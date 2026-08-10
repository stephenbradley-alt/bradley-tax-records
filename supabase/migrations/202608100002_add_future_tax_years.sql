-- Prepare the household for the next three tax years. Tax rates remain separately reviewable in the app.
insert into public.tax_years (household_id, label, starts_on, ends_on)
select id, year_data.label, year_data.starts_on, year_data.ends_on
from public.households
cross join (values
  ('2027-28', date '2027-04-06', date '2028-04-05'),
  ('2028-29', date '2028-04-06', date '2029-04-05'),
  ('2029-30', date '2029-04-06', date '2030-04-05')
) as year_data(label, starts_on, ends_on)
on conflict (household_id, starts_on) do nothing;
