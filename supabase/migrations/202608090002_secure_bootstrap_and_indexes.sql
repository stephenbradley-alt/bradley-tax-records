-- Keep RLS helper out of the exposed API schema and add a safe first-household setup RPC.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public, private
as $$ select exists(select 1 from public.household_members where household_id=target_household and user_id=(select auth.uid())) $$;
revoke all on function private.is_household_member(uuid) from public;
grant execute on function private.is_household_member(uuid) to authenticated;

alter policy "members manage households" on public.households using (private.is_household_member(id)) with check (private.is_household_member(id));
alter policy "household taxpayer access" on public.taxpayers using (private.is_household_member(household_id)) with check (private.is_household_member(household_id));
alter policy "household tax year access" on public.tax_years using (private.is_household_member(household_id)) with check (private.is_household_member(household_id));
alter policy "household property access" on public.properties using (private.is_household_member(household_id)) with check (private.is_household_member(household_id));
alter policy "household transaction access" on public.transactions using (private.is_household_member(household_id)) with check (private.is_household_member(household_id));
alter policy "household document access" on public.documents using (private.is_household_member(household_id)) with check (private.is_household_member(household_id));
alter policy "mapping access through tax year" on public.hmrc_mappings using (exists(select 1 from public.tax_years y where y.id=tax_year_id and private.is_household_member(y.household_id))) with check (exists(select 1 from public.tax_years y where y.id=tax_year_id and private.is_household_member(y.household_id)));
alter policy "household audit access" on public.audit_log using (private.is_household_member(household_id));
alter policy "household files are private" on storage.objects using (bucket_id='tax-documents' and private.is_household_member(((storage.foldername(name))[1])::uuid)) with check (bucket_id='tax-documents' and private.is_household_member(((storage.foldername(name))[1])::uuid));
drop function public.is_household_member(uuid);

create function public.setup_initial_household(household_name text default 'Bradley Tax Records')
returns uuid language plpgsql security definer set search_path = public, private
as $$
declare h_id uuid; current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then raise exception 'You must be signed in'; end if;
  if exists(select 1 from public.household_members where user_id=current_user_id) then raise exception 'This user already belongs to a household'; end if;
  insert into public.households(name) values (coalesce(nullif(trim(household_name), ''), 'Bradley Tax Records')) returning id into h_id;
  insert into public.household_members(household_id,user_id,role) values(h_id,current_user_id,'owner');
  insert into public.taxpayers(household_id,label,display_name,sort_order) values(h_id,'person_1','Person 1',1),(h_id,'person_2','Person 2',2);
  insert into public.tax_years(household_id,label,starts_on,ends_on) values(h_id,'2025-26','2025-04-06','2026-04-05'),(h_id,'2026-27','2026-04-06','2027-04-05');
  return h_id;
end $$;
revoke all on function public.setup_initial_household(text) from public;
grant execute on function public.setup_initial_household(text) to authenticated;

create index household_members_user_id_idx on public.household_members(user_id);
create index properties_household_id_idx on public.properties(household_id);
create index tax_years_household_id_idx on public.tax_years(household_id);
create index taxpayers_household_id_idx on public.taxpayers(household_id);
create index transactions_household_id_idx on public.transactions(household_id);
create index transactions_property_id_idx on public.transactions(property_id);
create index transactions_tax_year_id_idx on public.transactions(tax_year_id);
create index transactions_taxpayer_id_idx on public.transactions(taxpayer_id);
create index documents_household_id_idx on public.documents(household_id);
create index documents_transaction_id_idx on public.documents(transaction_id);
create index documents_property_id_idx on public.documents(property_id);
create index documents_tax_year_id_idx on public.documents(tax_year_id);
create index audit_log_household_id_idx on public.audit_log(household_id);
create index audit_log_actor_id_idx on public.audit_log(actor_id);
