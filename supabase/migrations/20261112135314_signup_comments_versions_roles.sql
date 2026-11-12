-- Applied to the live project as migration 20261112135314 (signup_comments_versions_roles). Additive.

-- 1. Commenter role
alter table public.document_shares drop constraint document_shares_role_check;
alter table public.document_shares add constraint document_shares_role_check check (role in ('editor','commenter','viewer'));

create or replace function public.share_document(p_doc uuid, p_email text, p_role text default 'editor')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_user public.profiles;
begin
  if p_role not in ('editor','commenter','viewer') then return jsonb_build_object('status','bad_role'); end if;
  select owner_id into v_owner from public.documents where id = p_doc;
  if v_owner is null or v_owner <> auth.uid() then return jsonb_build_object('status','not_owner'); end if;
  select * into v_user from public.profiles where email = lower(trim(p_email));
  if v_user.id is null then return jsonb_build_object('status','no_user'); end if;
  if v_user.id = v_owner then return jsonb_build_object('status','is_owner'); end if;
  if exists (select 1 from public.document_shares where document_id = p_doc and user_id = v_user.id) then
    return jsonb_build_object('status','already_shared','user', to_jsonb(v_user));
  end if;
  insert into public.document_shares(document_id, user_id, role) values (p_doc, v_user.id, p_role);
  return jsonb_build_object('status','ok','user', to_jsonb(v_user), 'role', p_role);
end $$;

create or replace function public.update_share(p_doc uuid, p_user uuid, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.documents where id = p_doc and owner_id = auth.uid()) then
    return jsonb_build_object('status','not_owner'); end if;
  if p_role is null then
    delete from public.document_shares where document_id = p_doc and user_id = p_user;
  elsif p_role in ('editor','commenter','viewer') then
    update public.document_shares set role = p_role where document_id = p_doc and user_id = p_user;
  else return jsonb_build_object('status','bad_role'); end if;
  return jsonb_build_object('status','ok');
end $$;

-- 2. Comments: owner, editors and commenters write; everyone with access reads; only `resolved` is updatable.
create table public.document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  parent_id uuid references public.document_comments(id) on delete cascade,
  quote text check (quote is null or char_length(quote) <= 500),
  body text not null check (char_length(body) between 1 and 2000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index document_comments_doc_idx on public.document_comments(document_id, created_at);
alter table public.document_comments enable row level security;
create policy comments_read on public.document_comments for select to authenticated
  using (private.doc_role(document_id) is not null);
create policy comments_insert on public.document_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and private.doc_role(document_id) in ('owner','editor','commenter'));
create policy comments_resolve on public.document_comments for update to authenticated
  using (private.doc_role(document_id) in ('owner','editor','commenter'))
  with check (private.doc_role(document_id) in ('owner','editor','commenter'));
create policy comments_delete on public.document_comments for delete to authenticated
  using (author_id = (select auth.uid()) or private.doc_role(document_id) = 'owner');
revoke all on public.document_comments from anon;
revoke update on public.document_comments from authenticated;
grant update (resolved) on public.document_comments to authenticated;

-- 3. Version history: one rolling snapshot per user per 10-minute editing session, max 50 per document.
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  title text not null,
  content jsonb not null,
  saved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index document_versions_doc_idx on public.document_versions(document_id, updated_at desc);
alter table public.document_versions enable row level security;
create policy versions_read on public.document_versions for select to authenticated
  using (private.doc_role(document_id) is not null);
revoke all on public.document_versions from anon;
revoke insert, update, delete on public.document_versions from authenticated;

create function private.snapshot_version() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_last public.document_versions;
begin
  if tg_op = 'UPDATE' and new.content is not distinct from old.content and new.title is not distinct from old.title then
    return new;
  end if;
  select * into v_last from public.document_versions
    where document_id = new.id order by updated_at desc limit 1;
  if v_last.id is not null and v_last.saved_by is not distinct from auth.uid()
     and v_last.created_at > now() - interval '10 minutes' then
    update public.document_versions set title = new.title, content = new.content, updated_at = now() where id = v_last.id;
  else
    insert into public.document_versions(document_id, title, content, saved_by) values (new.id, new.title, new.content, auth.uid());
    delete from public.document_versions where id in (
      select id from public.document_versions where document_id = new.id order by updated_at desc offset 50);
  end if;
  return new;
end $$;
revoke execute on function private.snapshot_version() from public, anon, authenticated;
create trigger documents_snapshot after insert or update on public.documents
  for each row execute function private.snapshot_version();

-- 4. Sign-up with a server-side password policy. Email confirmation is skipped for the demo
--    (the hosted project's confirm-email setting cannot be changed from the build tools); a global
--    rate limit of 30 new accounts per hour applies. See docs/SECURITY_LEDGER.md SEC-006.
create function public.sign_up(p_email text, p_password text, p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(p_email)); v_name text := btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g')); v_id uuid;
  v_colors text[] := array['#3451d1','#0f766e','#9a3412','#7c3aed','#be185d','#0369a1','#4d7c0f','#b45309'];
begin
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or char_length(v_email) > 254 then return jsonb_build_object('status','invalid_email'); end if;
  if char_length(v_name) < 1 or char_length(v_name) > 80 then return jsonb_build_object('status','invalid_name'); end if;
  if char_length(p_password) < 8 or char_length(p_password) > 72
     or p_password !~ '[A-Z]' or p_password !~ '[a-z]' or p_password !~ '[0-9]' or p_password !~ '[^A-Za-z0-9]' then
    return jsonb_build_object('status','weak_password');
  end if;
  if (select count(*) from auth.users where created_at > now() - interval '1 hour') >= 30 then
    return jsonb_build_object('status','rate_limited');
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then return jsonb_build_object('status','email_taken'); end if;
  v_id := gen_random_uuid();
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', v_name, 'color', v_colors[1 + floor(random() * array_length(v_colors, 1))::int]),
    now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now());
  return jsonb_build_object('status','ok');
end $$;
revoke execute on function public.sign_up(text,text,text) from public;
grant execute on function public.sign_up(text,text,text) to anon, authenticated;
