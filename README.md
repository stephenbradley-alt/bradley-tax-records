# Bradley Tax Records

A deliberately simple, mobile-first UK Self Assessment record-keeping application for a two-person household. It is not tax advice and does not submit returns to HMRC.

## Included in this first release

- Large, plain-English dashboard and navigation
- Tax-year selector and separate tax-year data model
- Two-person/joint ownership model, with per-person allocation fields
- Property register
- Rental income and property expense entry, including phone camera/PDF receipt input
- Private pension, bank interest and other income entry points
- Individual tax summary and printable HMRC Entry Guide
- Configurable, tax-year-specific HMRC mapping table
- Supabase schema for private documents, household access, RLS and audit history

## Connect Supabase securely

1. Create a Supabase project and a **private** storage bucket called `tax-documents`.
2. Run `supabase/migrations/202608090001_initial_tax_records.sql` in the Supabase SQL editor (or apply it through the Supabase CLI).
3. Copy `.env.example` to `.env.local`, then add the project URL and publishable key. Never add a service-role key to a browser environment variable.
4. Enable email/password authentication in Supabase and create the two authorised family accounts.
5. Create the household and add those two authenticated user IDs to `household_members` as owner/member. This table is the access boundary for every record and document.

Documents are designed to live in the private bucket and be accessed through authenticated Supabase requests only—never permanent public URLs.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` has been run successfully for this project.
