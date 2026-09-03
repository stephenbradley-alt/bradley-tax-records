-- P60 employment income and residential rental finance costs are separate record types.
-- Finance costs must not be included in ordinary property expenses or property profit.
alter table public.transactions
  add column if not exists paye_reference text;

alter table public.transactions
  drop constraint if exists transactions_kind_check;

alter table public.transactions
  add constraint transactions_kind_check check (kind in (
    'rental_income',
    'property_expense',
    'property_finance_cost',
    'employment_income',
    'state_pension',
    'private_pension',
    'bank_interest',
    'other_income'
  ));
