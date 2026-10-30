# WESTRONIX Product Listing Standard

**Target:** 30 minutes per standard laptop listing.  
**Workflow:** Intake → Photos → Listing copy → Website entry → Quality check → Owner approval.

## Time budget

| Step | Target |
|---|---:|
| 1. Product information | 5 min |
| 2. Select and upload photos | 7 min |
| 3. Prepare product copy (EN/FR) | 5 min |
| 4. Add product to inventory data/site | 8 min |
| 5. Verify and review | 5 min |
| **Total** | **30 min** |

The time budget is a target, not a reason to guess. Mark unknown details **Not confirmed** and resolve only facts that materially affect safety, compatibility, or the sale.

## Reusable product intake template

Copy this section for each product.

### Basic information
- Brand:
- Model:
- Product category:
- SKU:
- Quantity:
- Selling price (FCFA):
- Location:

### Specifications
- Processor:
- RAM:
- Storage:
- Screen size/resolution:
- Graphics:
- Operating system:
- Connectivity / notable features:

### Condition and verification
- Condition / grade:
- Battery condition:
- Testing completed:
- Data wipe completed (if applicable):
- BIOS / firmware lock status:
- Known defects or cosmetic marks:
- Warranty / return terms:
- Included accessories:
- Missing accessories:

### Photos
- [ ] 01-front
- [ ] 02-keyboard
- [ ] 03-ports-sides
- [ ] 04-bottom-label
- [ ] Additional detail photos only when needed

### Publishing
- [ ] English title and description
- [ ] French title and description
- [ ] Specifications checked against the supplied information
- [ ] Price, quantity, SKU and category checked
- [ ] Product images load and match the item
- [ ] Product page and cart action tested
- [ ] Owner reviewed and approved

## Standard photo folder and filenames

Use one folder per SKU:

`product-photos/<sku-lowercase>/`

Recommended filenames:
- `01-front.jpg`
- `02-keyboard.jpg`
- `03-ports-sides.jpg`
- `04-bottom-label.jpg`
- `05-condition-detail.jpg` (only if needed)

Use clear, well-lit original photos. Crop/resize consistently; do not spend time on decorative edits. Never use a photo of a different model or conceal visible damage.

## Standard website listing fields

Every product uses the existing WESTRONIX product-card and product-page design:
1. Product title and main image
2. Brand, model and category
3. Processor, RAM, storage, screen and graphics (where applicable)
4. Condition/grade and testing status
5. Price in FCFA and available quantity
6. SKU and location
7. Existing View Product and Add to Cart actions

Do not redesign the card for an individual product. Do not invent specifications, stock, warranty, battery health, or test results.

## Roles and approval

**WESTRONIX supplies:** product facts, photos, price, quantity, condition and any known defects.

**Listing preparation:** organize the facts, flag missing information, write EN/FR copy, prepare image filenames and inventory data, and test the listing.

**Approval gate:** prepare changes on a review branch / draft pull request. Do not merge or publish until WESTRONIX explicitly approves.

## Rules that keep listings under 30 minutes

- Reuse the same intake template, card layout and photo sequence.
- Do not repeatedly redesign or retouch acceptable photos.
- Do not research every unknown detail; label it **Not confirmed**.
- Batch similar products and reuse verified brand/model information where appropriate.
- Stop and flag exceptions (missing key facts, unclear condition, conflicting photos, or unusual configuration) rather than silently guessing.
