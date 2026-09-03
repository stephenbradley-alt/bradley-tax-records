alter table public.transactions drop constraint if exists transactions_kind_check;
alter table public.transactions add constraint transactions_kind_check check (kind in ('rental_income','property_expense','property_finance_cost','employment_income','employment_expense','state_pension','private_pension','bank_interest','other_income'));
