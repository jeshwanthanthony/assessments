-- Applied to the live project as migration delete_my_account. Additive.
-- Deletes the caller's account and everything that belongs to it, after re-checking the password.
-- Cascades: profiles -> owned documents -> their shares, comments, versions; the caller's shares on
-- other documents; the caller's comments everywhere. Versions the caller saved on other people's
-- documents keep their content (saved_by becomes null). Sample accounts cannot be deleted.
create function public.delete_my_account(p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user auth.users;
begin
  select * into v_user from auth.users where id = auth.uid();
  if v_user.id is null then return jsonb_build_object('status','not_signed_in'); end if;
  if lower(v_user.email) in ('maya@docspace.dev','daniel@docspace.dev','priya@docspace.dev') then
    return jsonb_build_object('status','demo_account');
  end if;
  if v_user.encrypted_password is null or v_user.encrypted_password <> extensions.crypt(coalesce(p_password,''), v_user.encrypted_password) then
    return jsonb_build_object('status','wrong_password');
  end if;
  delete from public.documents where owner_id = v_user.id;
  delete from auth.users where id = v_user.id;
  return jsonb_build_object('status','ok');
end $$;
revoke execute on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
