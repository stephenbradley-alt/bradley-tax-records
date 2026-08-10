-- An owner can add an already-registered family email to the same private household.
create function public.add_household_member_by_email(member_email text)
returns void language plpgsql security definer set search_path = public, auth
as $$
declare current_user_id uuid := (select auth.uid()); target_household uuid; invited_user uuid;
begin
  if current_user_id is null then raise exception 'You must be signed in'; end if;
  select household_id into target_household from public.household_members where user_id=current_user_id and role='owner' limit 1;
  if target_household is null then raise exception 'Only the household owner can add users'; end if;
  select id into invited_user from auth.users where lower(email)=lower(trim(member_email)) limit 1;
  if invited_user is null then raise exception 'That email has not created an account yet'; end if;
  insert into public.household_members(household_id,user_id,role) values(target_household,invited_user,'member') on conflict(household_id,user_id) do nothing;
end $$;
revoke all on function public.add_household_member_by_email(text) from public;
grant execute on function public.add_household_member_by_email(text) to authenticated;
