#!/usr/bin/env python3
"""Create bilingual, copy-ready WhatsApp Channel drafts from inventory.json changes.

No WhatsApp API, customer phone list, secret, or automatic publishing is used.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "inventory.json"
OUTPUT = ROOT / "whatsapp-drafts" / "latest.md"
SITE_URL = "https://westronixtech.com/inventory.html"
DEFAULT_USD_TO_XOF = 600

PROMO_KEYS = {
    "saleprice", "promoprice", "promotionalprice", "discountprice",
    "discountpercent", "promotion", "promo", "promotext", "promotiontext",
    "promostart", "promoend", "offerlabel", "onsale",
}


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict) or not isinstance(data.get("products"), list):
        raise ValueError("inventory.json must contain a products array.")
    return data


def load_previous(revision: str) -> dict[str, Any]:
    if not revision or set(revision) == {"0"}:
        return {"products": []}
    try:
        raw = subprocess.check_output(
            ["git", "show", f"{revision}:inventory.json"],
            cwd=ROOT,
            text=True,
            encoding="utf-8",
            stderr=subprocess.DEVNULL,
        )
        data = json.loads(raw)
        return data if isinstance(data, dict) and isinstance(data.get("products"), list) else {"products": []}
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return {"products": []}


def identity(product: dict[str, Any]) -> str:
    return str(product.get("sku") or product.get("id") or product.get("name") or "").strip()


def promo_values(product: dict[str, Any]) -> dict[str, Any]:
    return {
        str(key).lower(): value
        for key, value in product.items()
        if str(key).lower() in PROMO_KEYS and value not in (None, "", False, 0)
    }


def currency_for(product: dict[str, Any], inventory: dict[str, Any]) -> str:
    return str(product.get("currency") or inventory.get("currency") or "USD").upper()


def to_xof(value: Any, currency: str) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return None
    if currency in {"XOF", "FCFA", "CFA"}:
        xof = amount
    elif currency in {"USD", "$", "US$"}:
        rate = float(os.environ.get("USD_TO_XOF", DEFAULT_USD_TO_XOF))
        xof = amount * rate
    else:
        return None
    return int(round(xof / 1000.0) * 1000)


def money(value: Any, currency: str) -> str:
    amount = to_xof(value, currency)
    return f"{amount:,}".replace(",", " ") + " FCFA" if amount is not None else "prix à confirmer / price to confirm"


def clean(value: Any, fallback: str = "") -> str:
    text = str(value or fallback).strip()
    return " ".join(text.split())


def product_url(product: dict[str, Any]) -> str:
    candidate = product.get("productUrl") or product.get("url")
    if isinstance(candidate, str) and candidate.startswith("https://"):
        return candidate
    return SITE_URL


def describe_change(kind: str, product: dict[str, Any], previous: dict[str, Any] | None, inventory: dict[str, Any]) -> tuple[str, str]:
    name = clean(product.get("name"), "WESTRONIX product")
    currency = currency_for(product, inventory)
    url = product_url(product)

    if kind == "new":
        en = f"🆕 NEW ARRIVAL | {name}\nPrice: {money(product.get('price'), currency)}"
        fr = f"🆕 NOUVEAUTÉ | {name}\nPrix : {money(product.get('price'), currency)}"
    elif kind == "price":
        old_currency = currency_for(previous or {}, inventory)
        en = f"💰 PRICE UPDATE | {name}\nWas: {money((previous or {}).get('price'), old_currency)}\nNow: {money(product.get('price'), currency)}"
        fr = f"💰 NOUVEAU PRIX | {name}\nAncien prix : {money((previous or {}).get('price'), old_currency)}\nNouveau prix : {money(product.get('price'), currency)}"
    else:
        promo = promo_values(product)
        details = []
        for key, value in promo.items():
            if key in {"saleprice", "promoprice", "promotionalprice", "discountprice"}:
                details.append(f"Offer price: {money(value, currency)}")
            elif key in {"discountpercent"}:
                details.append(f"Discount: {value}%")
            elif isinstance(value, str):
                details.append(value)
        extra = "\n" + "\n".join(details) if details else ""
        en = f"🎉 SPECIAL OFFER | {name}{extra}\nCheck availability and details on our website."
        fr = f"🎉 OFFRE SPÉCIALE | {name}{extra}\nConsultez notre site pour les détails et la disponibilité."

    en += f"\n📍 Lomé, Togo\n🔗 {url}\nWESTRONIX TECH"
    fr += f"\n📍 Lomé, Togo\n🔗 {url}\nWESTRONIX TECH"
    return en, fr


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--before", default="")
    args = parser.parse_args()

    current = load_json(INVENTORY)
    previous = load_previous(args.before)
    old_by_id = {identity(p): p for p in previous.get("products", []) if identity(p)}
    changes: list[tuple[str, dict[str, Any], dict[str, Any] | None]] = []

    for product in current["products"]:
        if not isinstance(product, dict) or not identity(product):
            continue
        key = identity(product)
        old = old_by_id.get(key)
        if old is None:
            changes.append(("new", product, None))
            continue

        old_price = old.get("price")
        new_price = product.get("price")
        promo_changed = promo_values(old) != promo_values(product)
        if promo_changed:
            changes.append(("promo", product, old))
        elif old_price != new_price:
            changes.append(("price", product, old))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if not changes:
        if OUTPUT.exists():
            OUTPUT.unlink()
        print("No eligible inventory changes detected.")
        return

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sections = [
        "# WESTRONIX RoundPoint — WhatsApp Channel Draft",
        "",
        f"Generated automatically from the website inventory on {now}.",
        "",
        "**Review before publishing. This is a draft only; nothing is sent to WhatsApp.**",
        "",
        f"Detected changes: {len(changes)}",
        "",
    ]

    for index, (kind, product, old) in enumerate(changes, start=1):
        english, french = describe_change(kind, product, old, current)
        sku = clean(product.get("sku"), "SKU not supplied")
        sections.extend([
            f"## {index}. {clean(product.get('name'), 'WESTRONIX product')}",
            f"**SKU:** {sku}  ",
            f"**Change:** { {'new': 'New product', 'price': 'Price changed', 'promo': 'Promotion changed'}[kind] }",
            "",
            "### English",
            "",
            english,
            "",
            "### Français",
            "",
            french,
            "",
            "---",
            "",
        ])

    sections.extend([
        "## Publishing checklist",
        "",
        "- Confirm the product is still available and the price is correct.",
        "- Check the FCFA conversion and any promotion dates/conditions.",
        "- Copy the English and/or French version into the WESTRONIX RoundPoint WhatsApp Channel.",
        "- Publish manually only after review.",
        "",
        "_Price conversion: USD × 600, rounded to the nearest 1,000 FCFA. Change USD_TO_XOF in the workflow if WESTRONIX updates its pricing convention._",
    ])
    OUTPUT.write_text("\n".join(sections), encoding="utf-8")
    print(f"Prepared {len(changes)} WhatsApp Channel draft(s): {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
