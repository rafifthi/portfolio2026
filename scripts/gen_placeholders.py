#!/usr/bin/env python3
"""Generate lightweight placeholder PNGs for case-study thumbnails/banners.

Solid brand-blue (#3b82f6) fill so the layout doesn't break before the
client drops in real screenshots. Run once; re-run is idempotent.
"""
from __future__ import annotations

from PIL import Image, ImageDraw, ImageFont

BRAND = (59, 130, 246)  # #3b82f6

# (filename, width, height, label)
ASSETS = [
    ("lumona-thumb.png", 320, 240, "Lumona ERP"),
    ("tdn-thumb.png", 260, 340, "TDN Quick Commerce"),
    ("invitation-thumb.png", 300, 260, "Digital Invitation"),
    ("sewain-thumb.png", 300, 260, "Sewain Rental"),
    ("lumona-banner.png", 800, 300, "Lumona ERP"),
    ("tdn-banner.png", 800, 300, "TDN Quick Commerce"),
    ("invitation-banner.png", 800, 300, "Digital Invitation"),
    ("sewain-banner.png", 800, 300, "Sewain Rental"),
]


def label_text(draw: ImageDraw.ImageDraw, w: int, h: int, text: str) -> None:
    # Try to load a sensible truetype font; fall back to default if missing.
    font = None
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        try:
            font = ImageFont.truetype(candidate, size=max(18, h // 12))
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    # Center the label, wrapping if needed.
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) <= w * 0.85:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    line_h = font.size + 6
    total_h = line_h * len(lines)
    y = (h - total_h) / 2
    for line in lines:
        tw = draw.textlength(line, font=font)
        draw.text(((w - tw) / 2, y), line, font=font, fill=(255, 255, 255))
        y += line_h


def main() -> None:
    import os

    out_dir = "public/cases"
    os.makedirs(out_dir, exist_ok=True)
    for name, w, h, label in ASSETS:
        img = Image.new("RGB", (w, h), BRAND)
        draw = ImageDraw.Draw(img)
        # subtle inner border so the placeholder reads as a framed asset
        draw.rectangle(
            [8, 8, w - 9, h - 9],
            outline=(255, 255, 255),
            width=2,
        )
        label_text(draw, w, h, label)
        img.save(os.path.join(out_dir, name))
        print(f"wrote {out_dir}/{name} ({w}x{h})")


if __name__ == "__main__":
    main()
