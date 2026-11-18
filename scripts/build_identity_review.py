#!/usr/bin/env python3
"""Create a side-by-side review image from the *actual* approved app assets."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "preview" / "heldkraft-identity-review.png"
W, H = 1600, 1030

def rgb(color):
    return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))

def font(size, serif=False):
    candidate = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf" if serif else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(candidate, size)

def centered(draw, xy, label, font_, fill):
    x, y = xy
    b = draw.textbbox((0, 0), label, font=font_)
    draw.text((int(x - (b[2] - b[0]) / 2), y), label, fill=fill, font=font_)

def rounded_icon(icon, size):
    im = Image.open(icon).convert("RGB").resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * .21), fill=255)
    return im, mask

def make():
    sheet = Image.new("RGB", (W, H), "#07090D")
    draw = ImageDraw.Draw(sheet)
    centered(draw, (W / 2, 28), "HELDKRAFT PERFORMANCE RESEARCH", font(24), "#E7CA90")
    centered(draw, (W / 2, 69), "COORDINATED APPLICATION IDENTITIES", font(19), "#B3B9B6")
    configs = [
        dict(name="ATLAS",subtitle="Strength, Measured.",tagline="Lift the World.",
             icon="icons/icon-512.png",launch="icons/atlas-launch.webp",
             bg="#080E17",card="#142234",gold="#D2AD70",muted="#728DA6",
             black="#080E17",x=42),
        dict(name="HESPERIDES",subtitle="Nutrition, Measured.",tagline="Eat Like a God.",
             icon="hesperides/icons/icon-512.png",launch="hesperides/icons/hesperides-launch.webp",
             bg="#09130F",card="#14241A",gold="#E9C77D",muted="#426349",
             black="#09130F",x=818)
    ]
    for c in configs:
        x = c["x"]
        draw.rounded_rectangle((x, 136, x + 741, 1000), radius=30, fill=c["bg"], outline="#334339", width=2)
        centered(draw, (x + 370, 155), c["name"], font(38, True), c["gold"])
        draw.text((x + 50, 227), "HOME SCREEN ICON", font=font(15), fill="#C3C8C5")
        i, mask = rounded_icon(ROOT / c["icon"], 246)
        sheet.paste(i, (x + 50, 267), mask)
        draw.text((x + 50, 539), "APP IDENTITY", font=font(16), fill="#CACFC9")
        draw.text((x + 50, 572), c["tagline"], font=font(24, True), fill=c["gold"])
        draw.text((x + 50, 615), c["subtitle"], font=font(17), fill="#C3C8C5")
        draw.text((x + 367, 226), "SPLASH SCREEN", font=font(15), fill="#C3C8C5")
        px1, py1, px2, py2 = x + 359, 265, x + 691, 819
        draw.rounded_rectangle((px1, py1, px2, py2), radius=27, fill="#000000", outline=c["muted"], width=2)
        art = Image.open(ROOT / c["launch"]).convert("RGB")
        targetw, targeth = 310, 348
        scale = min(targetw / art.width, targeth / art.height)
        newsize = (int(art.width * scale), int(art.height * scale))
        art = art.resize(newsize, Image.Resampling.LANCZOS)
        area = (px1 + (px2 - px1 - newsize[0]) // 2,
                py1 + 32 + (targeth - newsize[1]) // 2)
        region = sheet.crop((area[0], area[1], area[0] + newsize[0], area[1] + newsize[1]))
        sheet.paste(ImageChops.screen(region, art), area)
        draw = ImageDraw.Draw(sheet)
        centered(draw, ((px1 + px2) / 2, py1 + 401), c["name"],
                 font(41 if c["name"] == "ATLAS" else 28, True), "#F0DAB5")
        centered(draw, ((px1 + px2) / 2, py1 + 455), c["tagline"], font(21, True), c["gold"])
        centered(draw, ((px1 + px2) / 2, py1 + 499), c["subtitle"].upper(), font(13), "#CAD2C7")
        draw.text((x + 50, 864), "PALETTE", font=font(16), fill="#CFD4D1")
        for j, color in enumerate([c["black"], c["card"], c["gold"], c["muted"]]):
            sx = x + 50 + j * 166
            draw.rounded_rectangle((sx, 899, sx + 132, 934), radius=10, fill=color, outline="#8B8E82", width=1)
            draw.text((sx, 942), color, font=font(13), fill="#C7C9C6")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print("Generated", OUT.relative_to(ROOT), OUT.stat().st_size, "bytes")

if __name__ == "__main__":
    make()
