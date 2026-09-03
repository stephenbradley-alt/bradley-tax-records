-- A signed-in user may keep a separate personal record area in addition to a shared family household.
-- Membership remains the only access route, so other household members cannot see this area.
alter table public.households
  add column if not exists record_scope text not null default 'household'
  check (record_scope in ('household', 'personal'));

create function public.create_private_tax_records(
  record_name text default 'My Tax Records',
  first_taxpayer_name text default 'Me'
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_user_id uuid := (select auth.uid());
  private_household_id uuid;
  clean_record_name text := coalesce(nullif(trim(record_name), ''), 'My Tax Records');
  clean_taxpayer_name text := coalesce(nullif(trim(first_taxpayer_name), ''), 'Me');
begin
  if current_user_id is null then raise exception 'You must be signed in'; end if;
  if exists (
    select 1 from public.household_members member
    join public.households household on household.id = member.household_id
    where member.user_id = current_user_id and household.record_scope = 'personal'
  ) then raise exception 'You already have a private tax record area'; end if;
  insert into public.households (name, record_scope) values (clean_record_name, 'personal') returning id into private_household_id;
  insert into public.household_members (household_id, user_id, role) values (private_household_id, current_user_id, 'owner');
  insert into public.taxpayers (household_id, label, display_name, sort_order) values
    (private_household_id, 'person_1', clean_taxpayer_name, 1),
    (private_household_id, 'person_2', 'Not used', 2);
  insert into public.tax_years (household_id, label, starts_on, ends_on) values
    (private_household_id, '2025-26', date '2025-04-06', date '2026-04-05'),
    (private_household_id, '2026-27', date '2026-04-06', date '2027-04-05'),
    (private_household_id, '2027-28', date '2027-04-06', date '2028-04-05'),
    (private_household_id, '2028-29', date '2028-04-06', date '2029-04-05'),
    (private_household_id, '2029-30', date '2029-04-06', date '2030-04-05');
  return private_household_id;
end;
$$;

revoke all on function public.create_private_tax_records(text, text) from public;
grant execute on function public.create_private_tax_records(text, text) to authenticated;
