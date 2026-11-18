#!/usr/bin/env python3
"""Compose real-source before/after splash comparisons on correct app colors."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "preview/heldkraft-transparent-splash.png"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def ff(size, serif=False):
    return ImageFont.truetype(SERIF if serif else SANS,size)

def center(draw, x, y, text, font, color):
    b=draw.textbbox((0,0),text,font=font)
    draw.text((x-(b[2]-b[0])/2,y),text,font=font,fill=color)

def gradient(size, base, raised, glow):
    w,h=size
    a=tuple(int(base[i:i+2],16) for i in (1,3,5))
    b=tuple(int(raised[i:i+2],16) for i in (1,3,5))
    im=Image.new("RGBA",size)
    pix=im.load()
    for y in range(h):
        center_weight=max(0,1-abs((y/(h-1))-.5)*2)
        for x in range(w):
            dx=(x-w*.5)/(w*.6)
            dy=(y-h*.41)/(h*.33)
            haze=math.exp(-(dx*dx+dy*dy)*2)*.17
            t=.6*center_weight + haze
            pix[x,y]=tuple(
                max(0,min(255,round(a[k]*(1-t)+b[k]*t+glow[k]*haze*.25)))
                for k in range(3))+(255,)
    return im

def panel(c,transparent,box):
    w,h=342,520
    scene=gradient((w,h),c["base"],c["mid"],c["glow"])
    source=ROOT / (c["cutout"] if transparent else c["original"])
    art=Image.open(source).convert("RGBA")
    maxw,maxh=328,360
    scale=min(maxw/art.width,maxh/art.height)
    art=art.resize((round(art.width*scale),round(art.height*scale)),Image.Resampling.LANCZOS)
    x=(w-art.width)//2
    y=59+(maxh-art.height)//2
    scene.alpha_composite(art,(x,y))
    d=ImageDraw.Draw(scene)
    center(d,w/2,19,"HELDKRAFT PERFORMANCE RESEARCH",ff(10),c["gold"])
    center(d,w/2,413,c["name"],ff(38 if c["name"]=="ATLAS" else 29,True),"#F3E4C8")
    center(d,w/2,458,c["tagline"],ff(20,True),c["gold"])
    center(d,w/2,494,c["subtitle"].upper(),ff(10),c["muted"])
    return scene

def main():
    c1=dict(name="ATLAS",base="#080E17",mid="#101C2A",glow=(99,136,158),gold="#D2AD70",muted="#B3C0CE",
            original="icons/atlas-launch.webp",cutout="icons/atlas-launch-cutout.png",
            tagline="Lift the World.",subtitle="Strength, Measured.")
    c2=dict(name="HESPERIDES",base="#09130F",mid="#102218",glow=(85,126,90),gold="#E9C77D",muted="#BFCCB8",
            original="hesperides/icons/hesperides-launch.webp",
            cutout="hesperides/icons/hesperides-launch-cutout.png",
            tagline="Eat Like a God.",subtitle="Nutrition, Measured.")
    sheet=Image.new("RGB",(1480,1320),"#0B1015")
    d=ImageDraw.Draw(sheet)
    center(d,740,25,"HELDKRAFT  /  TRUE TRANSPARENCY FIX",ff(28),"#E8D5B2")
    center(d,740,73,"Black rectangles removed from the images, not hidden with CSS.",ff(16),"#BCCAC8")
    for i,c in enumerate((c1,c2)):
        y0=139+i*574
        d.rounded_rectangle((36,y0-12,1444,y0+551),radius=28,fill=c["base"],outline="#49625B",width=2)
        d.text((68,y0+8),c["name"],font=ff(31,True),fill=c["gold"])
        d.text((68,y0+61),"APP BACKGROUND",font=ff(16),fill="#CBD2D0")
        d.rounded_rectangle((68,y0+101,220,y0+144),radius=9,fill=c["base"],outline=c["mid"],width=2)
        d.text((68,y0+158),c["base"],font=ff(17),fill=c["gold"])
        for x,title,is_transparent in ((381,"BEFORE: BLACK BOX",False),(805,"AFTER: CUTOUT",True)):
            p=panel(c,is_transparent,False)
            d.text((x,y0+4),title,font=ff(19),fill="#D3DAD5")
            sheet.paste(p.convert("RGB"),(x,y0+30))
        d.text((68,y0+440),"Original sculpture / apple retained.",font=ff(14),fill="#D4D7D4")
        d.text((68,y0+473),"Only the black matte is removed.",font=ff(14),fill="#D4D7D4")
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(OUTPUT,optimize=True)
    print(f"Created {OUTPUT.relative_to(ROOT)} {OUTPUT.stat().st_size} bytes")

if __name__=="__main__":
    main()
