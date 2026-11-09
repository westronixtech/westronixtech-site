# WESTRONIX WhatsApp Channel notification drafts

GitHub Actions watches changes to `inventory.json` on `main` and prepares bilingual English/French copy for the WESTRONIX RoundPoint WhatsApp Channel.

## What it detects
- A new SKU/product added to `inventory.json`
- A change to an existing product's `price`
- Changes to supported promotion fields such as `salePrice`, `promoPrice`, `discountPercent`, `promotion`, or `promoText`

## Where to find the draft
Open the repository's **Actions** tab, select **Prepare WhatsApp Channel Draft**, open the latest successful run, then:
- Read the draft in the run summary, or
- Download the `WESTRONIX-WhatsApp-Channel-Draft` artifact.

## Important
This workflow does **not** connect to WhatsApp, send messages, publish to the Channel, or access customer phone numbers. A person must review and manually publish the post.

The inventory currently stores product prices in USD. The workflow converts USD to FCFA using a default rate of 600 XOF per USD and rounds to the nearest 1,000 FCFA. Update `USD_TO_XOF` in the workflow if the pricing convention changes.
