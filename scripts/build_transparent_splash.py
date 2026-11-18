#!/usr/bin/env python3
"""Extract true transparency from the approved black-matted launch artwork.

The originals are retained without modification. The output has a genuine
alpha channel, so the launch artwork needs no CSS blend mode or black box.
Only standard Pillow is required.
"""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ASSETS = (
    ("icons/atlas-launch.webp", "icons/atlas-launch-cutout.png"),
    ("hesperides/icons/hesperides-launch.webp",
     "hesperides/icons/hesperides-launch-cutout.png"),
)

def build_one(source: Path, target: Path) -> None:
    original = Image.open(source).convert("RGB")
    r, g, b = original.split()
    brightest = ImageChops.lighter(ImageChops.lighter(r, g), b)

    # A soft matte is essential for webp antialiased edges. No alpha for
    # original black/near-black; keep gold and midtone details fully opaque.
    # Assumes the *approved* art is photographed against a black background.
    lower, upper = 9, 44
    alpha = brightest.point(
        lambda v: 0 if v <= lower else
                  255 if v >= upper else
                  round(255 * ((v - lower) / (upper - lower)) ** 0.78)
    )
    rgba = original.convert("RGBA")
    rgba.putalpha(alpha)
    target.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(target, format="PNG", optimize=True)
    print(
        f"{source.relative_to(ROOT)} -> {target.relative_to(ROOT)} "
        f"{rgba.width}x{rgba.height}, {target.stat().st_size} bytes "
        f"RGBA corners {[rgba.getpixel(p)[3] for p in [(0,0),(rgba.width-1,0),(0,rgba.height-1),(rgba.width-1,rgba.height-1)]]}"
    )

if __name__ == "__main__":
    for source, target in ASSETS:
        build_one(ROOT / source, ROOT / target)
