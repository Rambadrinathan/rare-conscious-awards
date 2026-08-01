"""Extract the 9 Pinwheel touchstone icons from 'Pinwheel by RARE.pdf'.

Two cases:
  * 7 pages embed the icon as its own image with a soft-mask (SMask) holding
    the alpha -> combine base + smask, giving clean art on transparency.
  * Energy Efficiency + Employee Wellbeing are vector art -> render at high DPI
    clipped to the union of the drawing bboxes, skipping the full-page
    background rect, then knock the white out to alpha.

Output: public/icons/ts-<key>.png, 512x512, transparent, trimmed and centred.
"""
import fitz
from PIL import Image
import numpy as np
import io, os

PDF = r"E:\Users\shobh\Downloads\Pinwheel by RARE.pdf"
OUT = r"E:\RareIndia\rare-conscious-awards\public\icons"

EMBEDDED = {
    7:  "water",           # p8  Water Conservation
    8:  "waste",           # p9  Responsible Waste Management
    10: "inclusivity",     # p11 Inclusivity
    12: "heritage",        # p13 Heritage Preservation
    13: "biodiversity",    # p14 Biodiversity Conservation
    14: "light_footprint", # p15 Light Footprint Tourism
    15: "community",       # p16 Local Community Engagement
}
VECTOR = {
    6: "energy",     # p7  Energy Efficiency
    9: "wellbeing",  # p10 Employee & Guest Health & Wellbeing
}

BG_SIZE = (1229, 859)  # the paper-texture background image


def knockout_white(im, thresh=232):
    """Make near-white paper transparent; keep saturated art fully opaque."""
    im = im.convert("RGBA")
    a = np.array(im).astype(np.int16)
    rgb = a[..., :3]
    lightness = rgb.min(axis=-1)
    spread = rgb.max(axis=-1) - rgb.min(axis=-1)
    paper = (lightness >= thresh) & (spread < 16)
    alpha = np.where(paper, 0, 255)
    near = (~paper) & (lightness >= thresh - 18) & (spread < 22)
    alpha = np.where(near, 120, alpha)
    a[..., 3] = alpha
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def trim(im, pad=10):
    bbox = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad),
                    min(im.width, r + pad), min(im.height, b + pad)))


def square(im, size=512):
    im = im.copy()
    im.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    return canvas


def save(im, key, src):
    path = os.path.join(OUT, f"ts-{key}.png")
    square(trim(im)).save(path, optimize=True)
    print(f"  ts-{key:<16} {src}")


doc = fitz.open(PDF)

print("embedded icons (base + smask):")
for page_no, key in EMBEDDED.items():
    for img in doc[page_no].get_images(full=True):
        xref, smask = img[0], img[1]
        if (img[2], img[3]) == BG_SIZE:
            continue
        pix = fitz.Pixmap(doc, xref)
        if smask:
            pix = fitz.Pixmap(pix, fitz.Pixmap(doc, smask))  # attach alpha
        im = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
        save(im, key, f"{img[2]}x{img[3]} smask={smask}")
        break

print("vector icons (clipped render):")
for page_no, key in VECTOR.items():
    page = doc[page_no]
    for img in page.get_images(full=True):
        if (img[2], img[3]) == BG_SIZE:
            page.delete_image(img[0])
    page_rect = page.rect
    clip = None
    for d in page.get_drawings():
        r = d["rect"]
        if r.width >= page_rect.width * 0.9:  # full-page background rect
            continue
        clip = r if clip is None else clip | r
    pix = page.get_pixmap(matrix=fitz.Matrix(8, 8), clip=clip, alpha=False)
    im = knockout_white(Image.open(io.BytesIO(pix.tobytes("png"))))
    save(im, key, f"clip={tuple(round(v) for v in clip)}")

doc.close()
