-- Prevent policy recursion when a signed-in household member reads their own membership.
drop policy if exists "owners manage membership" on public.household_members;

create function private.is_household_owner(target_household uuid)
returns boolean language sql stable security definer set search_path = public, private
as $$ select exists(select 1 from public.household_members where household_id = target_household and user_id = (select auth.uid()) and role = 'owner') $$;

revoke all on function private.is_household_owner(uuid) from public;
grant execute on function private.is_household_owner(uuid) to authenticated;

create policy "owners add membership" on public.household_members for insert to authenticated
with check (private.is_household_owner(household_id));

create policy "owners remove membership" on public.household_members for delete to authenticated
using (private.is_household_owner(household_id));
