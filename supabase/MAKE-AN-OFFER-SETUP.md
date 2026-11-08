# WESTRONIX Make an Offer — setup checklist

The website UI and server-side code are prepared in this branch. Do not enable production submissions until the Supabase setup below is completed and tested.

## 1. Apply the database migration
In the WESTRONIX Supabase project, open SQL Editor and run:
`supabase/migrations/202611070001_make_an_offer.sql`

The migration creates private offer rules, customer offer records, row-level security, and an atomic server-side submission function. It seeds the current product SKUs with offers enabled and a five-attempt limit. **Minimum offer floors are intentionally left unset** because WESTRONIX has not supplied a minimum price or percentage policy. The server rejects submissions until a minimum is configured for that SKU.

## 2. Configure minimums
Choose a minimum USD amount OR a minimum percentage of the current listed price for each product. Example only (do not run without approval of the policy):

```sql
update public.offer_product_rules
set minimum_offer_percentage = 80
where sku = 'DELL-XPS15-9570-16-256';
``

The minimum remains in the private database table and is never returned to the browser. To disable offers for a product, set `enabled = false`. Adjust `max_offers` per product as needed.

## 3. Deploy the Edge Function
Using the Supabase CLI connected to the WESTRONIX project:

```sh
supabase functions deploy submit-offer
``

The function uses Supabase's managed `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment variables and reads the public asking price from `https://westronixtech.com/inventory.json`. Never place the service-role key in website JavaScript.

## 4. Authentication
Offer submission currently requires a signed-in customer with a verified email. The existing WESTRONIX account flow is reused. This is intentional: it provides a stable, privacy-conscious server-side identity for enforcing per-customer attempt limits. Guest offer submissions with a separate email-verification flow are not included.

## 5. Before production
- Apply migration and configure product minimums.
- Deploy the Edge Function and verify its environment.
- Test signed-in and unverified accounts, all validation cases, repeated requests, concurrent submissions, and the per-product attempt cap.
- Add operational rate limiting and seller-facing offer review/notification workflow.
- Complete privacy, sales terms, and consumer-protection review.
- Test cart, checkout, keyboard focus, mobile modal behavior, and browser console.
- Only merge this PR after review and explicit approval.
