# WESTRONIX — Simple Product Listing Standard

**Purpose:** Get accurate products ready for customers quickly. Avoid repeated reviews and do not block a listing over optional details.

## The standard workflow

1. **Create one product record.** Enter the brand/model, condition, price (or "Contact for price"), and availability/quantity. Add the photos once.
2. **Do one short publish check.** Confirm the item is physically received by WESTRONIX, the product identity and condition are honestly described, the price/contact option is clear, and stock status is accurate.
3. **Publish.** If those essentials are true, publish the product. Leave unknown optional specifications out of the customer-facing description.
4. **Update only when something changes.** Recheck photos only when photos change; recheck price/quantity when they change. Do not repeat the entire checklist.

## Required before a product can appear as available

- **Identity:** Brand and model are correct.
- **Condition:** A truthful plain-language condition is selected (for example: New, Refurbished, Used, or Parts/Repair). Do not use a quality grade unless it has a defined meaning.
- **Commercial next step:** A price is shown, or the page clearly says **Contact for price**.
- **Availability:** Quantity is known, or the page clearly says **Confirm availability**. Never imply in-stock availability without evidence.
- **Basic integrity:** WESTRONIX has received the item and performed a basic identity/condition check sufficient to support the listing. Do not claim testing that was not performed.

## Optional — do not block a basic listing

Exact CPU generation, display details, graphics model, operating system/activation, battery health, detailed test results, cosmetic micro-notes, warranty, and accessories may be omitted when unknown. Add them later when known. If a field is advertised as a feature or promise, it must be accurate.

## Photos

- Approve a photo set once.
- Reuse that approval unless the images change.
- Use actual product photos when available.
- Do not publish photos that expose serial numbers, service tags, personal data, or other device identifiers. Redact them or omit that view.

## Simple statuses

- **DRAFT:** Product record started; not customer-facing.
- **READY:** Required fields and basic check complete.
- **PUBLISHED:** Added to public inventory.
- **SOLD / UNAVAILABLE:** No longer offered as available.

Avoid a separate "verified" flag for every optional specification. Keep internal notes for unknowns; never fill unknown values with guesses.

## Source of truth and guardrails

- `inventory.json` remains the public source of truth for products.
- Use one product record as the source for the product page and catalog; do not re-enter facts in multiple places.
- Keep drafts and templates out of public `inventory.json`.
- Never invent stock, product condition, test results, warranty, price, or specifications.
- A saved GitHub change does not prove that the live website has deployed or rendered correctly.
- This standard simplifies the process; it does not automatically authorize publication or enable checkout/payment.

## Fast publish checklist

- [ ] Brand/model correct
- [ ] Condition honestly stated
- [ ] Price or "Contact for price"
- [ ] Stock quantity or "Confirm availability"
- [ ] Item received and basic check completed
- [ ] Approved photos do not expose identifiers

If all six are true, publish without waiting for optional specifications.
