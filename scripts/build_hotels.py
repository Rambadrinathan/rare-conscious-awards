"""Build src/data/hotels.json from the Bridges participating hotels Excel list."""
from __future__ import annotations

import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Participating Hotels Status BRIDGES July 20.xlsx"
OUT = ROOT / "src" / "data" / "hotels.json"

REGION_COUNTRY = {
    "Nepal": "Nepal",
    "Bhutan": "Bhutan",
}


def main() -> None:
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.active

    hotels: list[dict] = []
    state: str | None = None
    country = "India"
    seen: set[str] = set()
    stop = False

    for row in ws.iter_rows(values_only=True):
        a, b = row[0], row[1]

        if b and str(b).strip().upper() == "NGO":
            stop = True
            continue
        if stop:
            continue

        if a is not None and (b is None or str(b).strip() == ""):
            label = str(a).strip()
            if label in ("S. No", "HOTEL", "ALL HOTELS"):
                continue
            state = label
            country = REGION_COUNTRY.get(label, "India")
            continue

        if not b or not str(b).strip():
            continue

        name = str(b).strip()
        if name.upper() in ("HOTEL", "NGO"):
            continue

        key = name.lower()
        if key in seen:
            continue
        seen.add(key)

        hotels.append(
            {
                "name": name,
                "state": state,
                "country": country,
            }
        )

    # Rows 56–59 sit after Bhutan in the sheet without a region header.
    overrides: dict[str, tuple[str | None, str]] = {
        "Localist": (None, "India"),
        "The Hyderabad History Project": ("Telangana", "India"),
        "Petrichor by The Blue Yonder": (None, "India"),
        "Art Ichol": ("Madhya Pradesh", "India"),
    }
    for h in hotels:
        if h["name"] in overrides:
            h["state"], h["country"] = overrides[h["name"]]

    hotels.sort(key=lambda h: h["name"].lower())
    OUT.write_text(json.dumps(hotels, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(hotels)} hotels -> {OUT}")
    for h in hotels:
        print(f"  {h['name']} | {h['state']} | {h['country']}")


if __name__ == "__main__":
    main()
