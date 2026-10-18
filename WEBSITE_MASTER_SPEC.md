# WESTRONIX TECH — Website Master Specification

**Status:** Lean launch blueprint  
**Canonical positioning:** Technology from USA → West Africa  
**Brand promise:** Technology • Trust • Opportunity  
**Launch priority:** Verified laptop sales, product requests, private offers, and business inquiries.

## 1. Operating rules
- Do not claim inventory, customers, suppliers, certifications, partnerships, charitable status, fulfillment capacity, or services that have not been verified.
- Publish a product only after WESTRONIX physically receives it and completes the short publish check in [PRODUCT_LISTING_WORKFLOW.md](PRODUCT_LISTING_WORKFLOW.md). Do not require verification of optional specifications to publish.
- Use [product-template.json](product-template.json) as the minimal starting record; unknown optional specifications stay blank rather than delaying a listing or being guessed.
- Keep private Make an Offer negotiations separate from public auctions.
- Keep internal operations, supplier records, permissions, reporting, and audit history out of customer navigation.
- Label a capability Available only after it is implemented and tested. Otherwise use Proposed, In development, or Future.
- Preserve working pages and URLs unless a replacement and redirect/link plan are confirmed.

## 2. Lean customer navigation
Primary navigation:
- Shop
- Make an Offer (contextual action on eligible products; not a separate auction)
- Bulk & Business
- Education
- Give / Sell Equipment
- Support

Header utilities: WESTRONIX logo, search, EN/FR only where translations are complete, Account only when real authentication exists, and Cart only while the cart/order-request flow is supported.

Do not add separate top-level links for both Shop and Inventory. Do not promote Request a Product to a permanent navigation item; show it as a contextual action in Shop and search. Do not expose internal Operations.

## 3. Canonical launch pages
- `index.html` — home and route to the main customer tasks.
- `inventory.html` — verified available products, loaded from `inventory.json`.
- `product.html` — product details and Buy / Make an Offer / Request actions.
- `request-product.html` — source a product not currently listed.
- `bulk-orders.html` — business and quantity quote requests.
- `sell-equipment.html` — supplier / equipment intake.
- `recycle-donate.html` — give equipment and responsible reuse inquiries; do not imply charitable status or guaranteed donation acceptance.
- `support.html`, `privacy.html`, `terms.html` — contact and policy information.
- `cart.html`, `checkout.html`, `order-confirmation.html` — retain only as an inquiry/order-request flow until secure order storage and payment are implemented. State clearly that submission is not a confirmed sale or payment.
- `africa-education.html` — retain as an informational page; do not claim established programs or partnerships without evidence.
- `auctions.html` + `auctions.json` — preview/coming-soon only until real bidding and fulfillment are operational.

## 4. One source of truth per data type
- `inventory.json` contains products and product categories only.
- `auctions.json` contains auction lots only. Do not duplicate auction lots in `inventory.json`.
- Product records are the source for product facts; do not retype the same facts into multiple places.
- Drafts and templates must never be added to public production `inventory.json`.
- Do not maintain duplicate donation pages or duplicate homepage implementations as active customer destinations. Before deleting a legacy file, check internal links and add a replacement/redirect plan if needed.

## 5. Make an Offer workflow
Product → customer submits proposed price, quantity, and contact details → staff reviews → Accept / Counter / Decline → if accepted, recheck stock → confirm final terms and delivery → fulfilment only after explicit confirmation.

An accepted offer is not automatically a completed order. Never expose another customer's offer or private negotiation.

## 6. Phased capability plan
**Launch:** verified catalog, search, product requests, manual private offer review, bulk quote inquiries, equipment intake, contact/WhatsApp, accurate policies.

**After the launch flow is reliable:** persistent inquiry/offer records, staff review tools, verified delivery workflow, and secure order records.

**Future:** customer accounts, online payments, automated order tracking, automated negotiation, live auctions, and impact reporting. Do not present these as active until implemented, secured, and tested.

## 7. Definition of done
- All primary navigation links resolve to the intended page.
- Mobile layout and keyboard-accessible forms work.
- No sample products, fake auction bids, fake countdowns, or unsupported claims are shown.
- Product and auction data are kept separate.
- EN/FR controls appear only where the selected language actually works.
- Inquiry submission clearly explains what happens next and does not falsely imply payment or order confirmation.
- Privacy and terms pages match the real data collection and business process.
- Test the live pages after deployment; a successful GitHub commit alone does not prove the live site works.
