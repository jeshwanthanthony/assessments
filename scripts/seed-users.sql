-- Creates the three demo accounts (password demo1234, email pre-confirmed). Run once in the
-- Supabase SQL editor of a fresh project, after the migration. The profile trigger fills public.profiles.
do $$
declare u record; v_id uuid;
begin
  for u in select * from (values
    ('maya@docspace.dev','Maya Chen','#3451d1'),
    ('daniel@docspace.dev','Daniel Okafor','#0f766e'),
    ('priya@docspace.dev','Priya Raman','#9a3412')) as t(email,name,color)
  loop
    continue when exists (select 1 from auth.users where email = u.email);
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('name',u.name,'color',u.color),
      now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub',v_id::text,'email',u.email,'email_verified',true),
      'email', now(), now(), now());
  end loop;
end $$;
