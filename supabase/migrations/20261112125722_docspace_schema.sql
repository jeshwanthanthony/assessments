-- DocSpace schema: the final state of the three migrations applied to the live project
-- (20261112125722 docspace_schema, 20261112131849 documents_owner_shortcut, 20261112133459 harden_function_exposure).
-- Apply to a fresh Supabase project with the SQL editor or `supabase db push`, then run scripts/seed-users.sql and `npm run seed`.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  color text not null default '#5f5f66'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  title text not null default 'Untitled document' check (char_length(title) between 1 and 200),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
    check (octet_length(content::text) < 2000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_owner_idx on public.documents(owner_id, updated_at desc);

create table public.document_shares (
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (document_id, user_id)
);
create index document_shares_user_idx on public.document_shares(user_id);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

-- RLS helpers live in a schema the REST API does not expose. SECURITY DEFINER avoids
-- recursion between the documents and document_shares policies.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.doc_role(p_doc uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.documents d where d.id = p_doc and d.owner_id = auth.uid()) then 'owner'
    else (select s.role from public.document_shares s where s.document_id = p_doc and s.user_id = auth.uid())
  end
$$;

create function private.shares_a_doc_with(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.documents d
    left join public.document_shares s on s.document_id = d.id
    where (d.owner_id = auth.uid() or s.user_id = auth.uid())
      and (d.owner_id = p_user or s.user_id = p_user)
  ) or exists (
    select 1 from public.document_shares a join public.document_shares b on a.document_id = b.document_id
    where a.user_id = auth.uid() and b.user_id = p_user
  )
$$;
revoke execute on function private.doc_role(uuid), private.shares_a_doc_with(uuid) from public, anon;
grant execute on function private.doc_role(uuid), private.shares_a_doc_with(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_a_doc_with(id));

-- The owner_id shortcut matters: INSERT ... RETURNING checks this policy against a row
-- the helper's snapshot cannot see yet (docs/MISTAKES.md).
create policy documents_read on public.documents for select to authenticated
  using (owner_id = (select auth.uid()) or private.doc_role(id) is not null);
create policy documents_insert on public.documents for insert to authenticated
  with check (owner_id = auth.uid());
create policy documents_update on public.documents for update to authenticated
  using (owner_id = (select auth.uid()) or private.doc_role(id) = 'editor')
  with check (owner_id = (select auth.uid()) or private.doc_role(id) = 'editor');
create policy documents_delete on public.documents for delete to authenticated
  using (owner_id = auth.uid());

create policy shares_read on public.document_shares for select to authenticated
  using (private.doc_role(document_id) is not null);
-- No write policies on shares: writes go only through the functions below.

revoke all on public.profiles, public.documents, public.document_shares from anon;
revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.document_shares from authenticated;
revoke update on public.documents from authenticated;
grant update (title, content) on public.documents to authenticated; -- owner_id can never change

-- Share by email; returns a status the API maps to HTTP codes and UI copy.
create function public.share_document(p_doc uuid, p_email text, p_role text default 'editor')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_user public.profiles;
begin
  if p_role not in ('editor','viewer') then return jsonb_build_object('status','bad_role'); end if;
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

-- Owner changes a role, or removes access with p_role = null.
create function public.update_share(p_doc uuid, p_user uuid, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.documents where id = p_doc and owner_id = auth.uid()) then
    return jsonb_build_object('status','not_owner'); end if;
  if p_role is null then
    delete from public.document_shares where document_id = p_doc and user_id = p_user;
  elsif p_role in ('editor','viewer') then
    update public.document_shares set role = p_role where document_id = p_doc and user_id = p_user;
  else return jsonb_build_object('status','bad_role'); end if;
  return jsonb_build_object('status','ok');
end $$;

revoke execute on function public.share_document(uuid,text,text), public.update_share(uuid,uuid,text) from public, anon;
grant execute on function public.share_document(uuid,text,text), public.update_share(uuid,uuid,text) to authenticated;

-- A profile row for every new auth user (trigger only; not callable over the API).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, name, color)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'color', '#5f5f66'));
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
