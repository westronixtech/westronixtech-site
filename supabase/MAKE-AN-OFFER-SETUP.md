# WESTRONIX Make an Offer — setup checklist

The website UI and server-side code are prepared in this branch. Do not enable production submissions until the Supabase setup below is completed and tested.

## 1. Approved offer policy

The approved minimum offer is calculated from the current listed price and remains private in the Supabase database:

- **Laptops:** 85% of the listed price (15% maximum discount).
- **RAM, accessories, docking stations, and other non-laptop products:** 90% of the listed price (10% maximum discount).
- **Attempt limit:** five submitted offers per customer per product.
- **Offer expiry:** seven days after submission.
- **Review:** every offer is pending manual WESTRONIX review. No offer is automatically accepted.
- **Offers at or above the listed price** are not valid offers and are rejected.
- Offers below the applicable minimum are rejected automatically.
- The five-attempt counter is cumulative per customer and product; expiry does not reset it.

The minimum percentages are seeded for every currently offer-enabled product in the migration. The percentage is applied to the live listed price at the time the offer is submitted. The minimum is not returned to the website browser.

## 2. Apply the database migration

In the WESTRONIX Supabase project, open SQL Editor and run:
`supabase/migrations/202611070001_make_an_offer.sql`

The migration creates private offer rules, customer offer records, row-level security, an atomic server-side submission function, and status audit events. It seeds current offer-enabled SKUs with the approved minimum percentages and five-attempt limit. New products must receive a corresponding private rule before offers are enabled for them.

## 3. Deploy the Edge Function

Using the Supabase CLI connected to the WESTRONIX project:

```sh
supabase functions deploy submit-offer
```

The function uses Supabase's managed `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment variables and reads the public asking price from `https://westronixtech.com/inventory.json`. Never place the service-role key in website JavaScript.

## 4. Authentication

Offer submission currently requires a signed-in customer with a verified email. The existing WESTRONIX account flow is reused. Guest offer submissions with a separate email-verification flow are not included.

## 5. Before production

- Apply the database migration and verify the seeded percentages and product rules.
- Deploy the Edge Function and verify its environment.
- Test signed-in and unverified accounts, minimum-price validation, expired offers, repeated requests, concurrent submissions, and the per-product five-attempt cap.
- Build the seller-facing offer review/notification workflow and operational rate limiting.
- Complete privacy, sales terms, and consumer-protection review.
- Test cart, checkout, keyboard focus, mobile modal behavior, and browser console.
- Only merge this PR after review and explicit approval.
