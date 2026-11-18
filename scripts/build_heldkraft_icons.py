#!/usr/bin/env python3
"""Regenerate borderless Atlas/Hesperides PWA icons from approved local splash art.

Run: python -m pip install Pillow && python scripts/build_heldkraft_icons.py
Outputs: 192, 512, maskable 512, and iOS 180 PNG for both apps.
The name alone is included: no subtitle, slogan, border or wreath.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BRANDS = [
    dict(name="ATLAS",art="icons/atlas-launch.webp",out="icons",
         top=(16,28,42),bottom=(8,14,23),glow=(55,88,112),
         gold=(210,173,112),crop=0.82),
    dict(name="HESPERIDES",art="hesperides/icons/hesperides-launch.webp",
         out="hesperides/icons",top=(16,34,24),bottom=(9,19,15),
         glow=(52,95,62),gold=(233,199,125),crop=1.0)
]

def serif(size):
    for name in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    ]:
        if Path(name).exists():
            return ImageFont.truetype(name,size)
    raise RuntimeError("Install DejaVu Serif or Liberation Serif font")

def text_width(draw,label,font,gap):
    return sum(draw.textlength(ch,font=font) for ch in label)+gap*(len(label)-1)

def lettering(draw,x,y,label,font,color,gap,stroke=0,stroke_color=None):
    for ch in label:
        draw.text((round(x),round(y)),ch,font=font,fill=color,anchor="lt",
                  stroke_width=stroke,stroke_fill=stroke_color)
        x+=draw.textlength(ch,font=font)+gap

def build(brand,size=512,maskable=False):
    n=512
    image=Image.new("RGBA",(n,n))
    d=ImageDraw.Draw(image)
    for y in range(n):
        t=y/(n-1)
        rgb=tuple(round(a*(1-t)+b*t) for a,b in zip(brand["top"],brand["bottom"]))
        d.line((0,y,n,y),fill=(*rgb,255))
    haze=Image.new("RGBA",(n,n))
    h=ImageDraw.Draw(haze)
    h.ellipse((48,0,464,465),fill=(*brand["glow"],80))
    image=Image.alpha_composite(image,haze.filter(ImageFilter.GaussianBlur(78)))
    art=Image.open(ROOT/brand["art"]).convert("RGB")
    if brand["crop"]<1:
        art=art.crop((0,0,art.width,round(art.height*brand["crop"])))
    alpha=ImageOps.grayscale(art).point(lambda v:max(0,min(255,round((v-5)*255/31))))
    bounds=alpha.point(lambda v:255 if v>=45 else 0).getbbox()
    if bounds:
        pad=max(4,round(min(art.size)*0.02))
        bounds=(max(0,bounds[0]-pad),max(0,bounds[1]-pad),
                min(art.width,bounds[2]+pad),min(art.height,bounds[3]+pad))
        art=art.crop(bounds);alpha=alpha.crop(bounds)
    maxw,maxh=(377,326) if maskable else (465,395)
    factor=min(maxw/art.width,maxh/art.height)
    newsize=(round(art.width*factor),round(art.height*factor))
    art=ImageEnhance.Color(art.resize(newsize,Image.Resampling.LANCZOS)).enhance(.94)
    alpha=alpha.resize(newsize,Image.Resampling.LANCZOS)
    art=art.convert("RGBA");art.putalpha(alpha)
    image.alpha_composite(art,((n-art.width)//2,(63 if maskable else 20)+max(0,round((maxh-art.height)*.2))))
    fade=Image.new("RGBA",(n,n))
    f=ImageDraw.Draw(fade)
    start=360 if maskable else 345
    for y in range(start,n):
        f.line((0,y,n,y),fill=(*brand["bottom"],min(225,round((y-start)*175/110))))
    image=Image.alpha_composite(image,fade)
    label=brand["name"]
    fontsize=64 if label=="ATLAS" else 47
    gap=6.0 if label=="ATLAS" else 3.8
    d=ImageDraw.Draw(image)
    font=serif(fontsize)
    limit=376 if maskable else 460
    while text_width(d,label,font,gap)>limit:
        fontsize-=1;font=serif(fontsize)
    x=(n-text_width(d,label,font,gap))/2
    y=399 if maskable else 416
    glowtext=Image.new("RGBA",(n,n))
    lettering(ImageDraw.Draw(glowtext),x,y,label,font,(*brand["gold"],95),gap,2,(*brand["gold"],65))
    image=Image.alpha_composite(image,glowtext.filter(ImageFilter.GaussianBlur(7)))
    lettering(ImageDraw.Draw(image),x,y,label,font,(*brand["gold"],255),gap,1,(77,49,19,200))
    if size!=n:
        image=image.resize((size,size),Image.Resampling.LANCZOS)
    return image.convert("RGB")

def main():
    for brand in BRANDS:
        if not (ROOT/brand["art"]).is_file():
            raise FileNotFoundError(brand["art"])
        folder=ROOT/brand["out"]
        for filename,size,maskable in [
            ("icon-192.png",192,False),("icon-512.png",512,False),
            ("icon-maskable-512.png",512,True),("apple-touch-icon.png",180,False)
        ]:
            dest=folder/filename
            build(brand,size,maskable).save(dest,format="PNG",optimize=True)
            print("Created",dest.relative_to(ROOT))

if __name__=="__main__":
    main()
