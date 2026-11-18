#!/usr/bin/env python3
"""Verify true alpha on both generated assets and preserved original pixels."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
pairs=[
 ("icons/atlas-launch.webp","icons/atlas-launch-cutout.png"),
 ("hesperides/icons/hesperides-launch.webp","hesperides/icons/hesperides-launch-cutout.png")
]
for src,dst in pairs:
    source=Image.open(ROOT/src).convert("RGB")
    cutout=Image.open(ROOT/dst)
    assert cutout.mode=="RGBA",(dst,cutout.mode)
    assert cutout.size==source.size,(src,source.size,cutout.size)
    for x,y in [(0,0),(cutout.width-1,0),(0,cutout.height-1),(cutout.width-1,cutout.height-1)]:
        assert cutout.getpixel((x,y))[3]==0,(dst,"corner black not removed",x,y)
    alpha=cutout.getchannel("A")
    zero=sum(v==0 for _,v in alpha.getcolors(cutout.width*cutout.height))
    counts=alpha.histogram()
    blank_fraction=counts[0]/(cutout.width*cutout.height)
    full_fraction=sum(counts[240:])/(cutout.width*cutout.height)
    assert blank_fraction>0.05,(dst,"insufficient transparent pixels",blank_fraction)
    assert full_fraction>0.12,(dst,"gold art too transparent",full_fraction)
    # We preserve original RGB values, so every illuminated detail stays unchanged.
    assert cutout.getpixel((cutout.width//2,cutout.height//2))[:3]==source.getpixel((source.width//2,source.height//2))
    print("PASS",dst,cutout.size,"transparent",round(blank_fraction,3),"opaque",round(full_fraction,3))
png=Image.open(ROOT/"preview/heldkraft-transparent-splash.png")
assert png.size==(1480,1320)
print("PASS review preview dimensions",png.size)
