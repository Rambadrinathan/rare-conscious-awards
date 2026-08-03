"""Regenerate src/lib/brand-assets.ts from public/rare-logo.png.

The Word export embeds the ginkgo wordmark as base64 rather than reading
public/ at runtime, because a serverless function cannot rely on those files
being present. Keep the raster small — it renders ~150px wide in the document.

    python scripts/build_brand_asset.py
"""
from PIL import Image
import base64, io

SRC = "public/rare-logo.png"
OUT = "src/lib/brand-assets.ts"
TARGET_W = 420  # ~3x the rendered width, enough for print

im = Image.open(SRC).convert("RGBA")
bbox = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
if bbox:
    im = im.crop(bbox)
im.thumbnail((TARGET_W, TARGET_W), Image.LANCZOS)

# Word handles opaque PNGs most predictably; matte onto white.
flat = Image.new("RGB", im.size, (255, 255, 255))
flat.paste(im, (0, 0), im)

buf = io.BytesIO()
flat.save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()

with open(OUT, "w", encoding="utf-8", newline="") as f:
    f.write(
        "/**\n"
        " * RARE ginkgo wordmark, embedded as base64 so the Word export needs no\n"
        " * filesystem or network access at runtime.\n"
        " *\n"
        " * Generated — do not hand-edit. Run: python scripts/build_brand_asset.py\n"
        " */\n"
    )
    f.write(f"export const RARE_LOGO_WIDTH = {im.size[0]};\n")
    f.write(f"export const RARE_LOGO_HEIGHT = {im.size[1]};\n")
    f.write(f'export const RARE_LOGO_PNG_BASE64 =\n  "{b64}";\n')

print(f"{OUT}: {im.size[0]}x{im.size[1]}, {len(b64)/1000:.0f} KB base64")
