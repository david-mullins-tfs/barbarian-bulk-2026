#!/usr/bin/env python3
"""Side-by-side visual QA for splash background continuity, using approved artwork."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "preview/heldkraft-seamless-splash.png"
SIZE = (1740, 1170)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"

def face(size, serif=False):
    return ImageFont.truetype(SERIF if serif else FONT, size)

def center(draw, centerx, y, words, f, color):
    box = draw.textbbox((0, 0), words, font=f)
    draw.text((int(centerx - (box[2] - box[0]) / 2), y), words, font=f, fill=color)

def backdrop(size, base, mid, glow, atmospheric):
    w, h = size
    result = Image.new("RGB", size, base)
    draw = ImageDraw.Draw(result)
    a = tuple(int(base[i:i+2], 16) for i in (1, 3, 5))
    b = tuple(int(mid[i:i+2], 16) for i in (1, 3, 5))
    for y in range(h):
        t = (1-abs((y/(h-1))*2-1)) * (0.65 if atmospheric else 0)
        color = tuple(round(a[k]*(1-t)+b[k]*t) for k in range(3))
        draw.line((0,y,w,y),fill=color)
    if atmospheric:
        haze = Image.new("RGBA", size, (0,0,0,0))
        hd = ImageDraw.Draw(haze)
        hd.ellipse((int(w*.16),int(h*.10),int(w*.84),int(h*.82)),fill=(*glow,60))
        result = Image.alpha_composite(result.convert("RGBA"),haze.filter(ImageFilter.GaussianBlur(w*.16))).convert("RGB")
    return result

def rounded(surface, radius=23):
    mask = Image.new("L", surface.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,surface.width-1,surface.height-1),radius=radius,fill=255)
    return mask

def art_on(surface, path, top, h):
    src = Image.open(ROOT / path).convert("RGB")
    maxw = surface.width-25
    factor = min(maxw/src.width,h/src.height)
    dest = src.resize((round(src.width*factor),round(src.height*factor)), Image.Resampling.LANCZOS)
    xy = ((surface.width - dest.width)//2,top+(h-dest.height)//2)
    region = surface.crop((xy[0],xy[1],xy[0]+dest.width,xy[1]+dest.height))
    surface.paste(ImageChops.lighter(region,dest),xy)

def splash_panel(config, new):
    w, h = 300, 423
    surface = (backdrop((w,h),config["base"],config["mid"],config["glow"],True)
               if new else Image.new("RGB",(w,h),"#000000"))
    art_on(surface,config["art"],44,249)
    d=ImageDraw.Draw(surface)
    center(d,w/2,16,"HELDKRAFT PERFORMANCE RESEARCH",face(9),config["gold"])
    center(d,w/2,305,config["name"],face(34 if config["name"]=="ATLAS" else 25,True),"#F5E8CC")
    center(d,w/2,357,config["tagline"],face(17,True),config["gold"])
    center(d,w/2,392,config["subtitle"].upper(),face(9),config["muted"])
    return surface

def app_panel(config):
    w,h=320,423
    im=backdrop((w,h),config["base"],config["mid"],config["glow"],False)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((6,6,w-6,72),radius=12,fill=config["header"])
    d.text((19,16),"HELDKRAFT PERFORMANCE RESEARCH",font=face(11),fill=config["gold"])
    d.text((19,35),config["name"],font=face(25,True),fill="#EEE8D6")
    d.rounded_rectangle((13,92,w-13,214),radius=16,fill=config["card"],outline=config["stroke"],width=2)
    d.text((28,112),config["tagline"],font=face(21,True),fill=config["gold"])
    d.text((28,147),config["subtitle"],font=face(14),fill=config["muted"])
    d.rounded_rectangle((28,182,w-28,192),radius=5,fill=config["border"])
    d.rounded_rectangle((28,182,204,192),radius=5,fill=config["highlight"])
    for i in range(2):
        top=235+i*66
        d.rounded_rectangle((13,top,w-13,top+53),radius=13,fill=config["card"],outline=config["stroke"],width=1)
        d.text((28,top+16),["Overview","Recent activity"][i],font=face(15),fill="#E8E5DB")
        d.ellipse((w-48,top+18,w-34,top+32),fill=config["highlight"])
    d.text((18,387),"APP BACKGROUND",font=face(11),fill=config["muted"])
    d.text((191,387),config["base"],font=face(15),fill=config["gold"])
    return im

def main():
    configs=[
        dict(name="ATLAS",tagline="Lift the World.",subtitle="Strength, Measured.",
            art="icons/atlas-launch.webp",base="#080E17",mid="#101C2A",glow=(99,136,158),
            gold="#D2AD70",muted="#B3C0CE",header="#0C1723",card="#142234",stroke="#405263",
            highlight="#728DA6",border="#263D51"),
        dict(name="HESPERIDES",tagline="Eat Like a God.",subtitle="Nutrition, Measured.",
            art="hesperides/icons/hesperides-launch.webp",base="#09130F",mid="#102218",glow=(85,126,90),
            gold="#E9C77D",muted="#BFCCB8",header="#0C1B12",card="#14241A",stroke="#405A49",
            highlight="#6A9671",border="#27432E")
    ]
    image=Image.new("RGB",SIZE,"#090D11")
    d=ImageDraw.Draw(image)
    center(d,SIZE[0]/2,24,"HELDKRAFT  /  SPLASH-TO-APP COHESION",face(27),"#E9D4AD")
    center(d,SIZE[0]/2,65,"The approved sculpture and apple remain unchanged; only the atmosphere is refined.",face(16),"#ACB7B8")
    for j,c in enumerate(configs):
        y=129+j*507
        x0=60
        d.rounded_rectangle((35,y-8,1705,y+478),radius=23,fill=c["base"],outline=c["stroke"],width=2)
        d.text((x0,y+8),c["name"],font=face(31,True),fill=c["gold"])
        for x,label,panel in [
            (450,"CURRENT: BLACK",splash_panel(c,False)),
            (795,"REFINED: MATCHED",splash_panel(c,True)),
            (1150,"APP SURFACES",app_panel(c))
        ]:
            center(d,x+panel.width/2,y+8,label,face(16),"#CBD0CF")
            image.paste(panel,(x,y+50),rounded(panel))
        d.text((x0,y+103),"BACKGROUND",font=face(14),fill="#C6CFCC")
        d.rounded_rectangle((x0,y+133,x0+148,y+171),radius=8,fill=c["base"],outline="#607266",width=1)
        d.text((x0,y+179),c["base"],font=face(17),fill=c["gold"])
        d.text((x0,y+236),"ACCENT",font=face(14),fill="#C6CFCC")
        d.rounded_rectangle((x0,y+266,x0+148,y+304),radius=8,fill=c["highlight"])
        d.text((x0,y+313),"Steel" if j==0 else "Garden green",font=face(17),fill="#D7DEDA")
        d.text((x0,y+382),"Same art. Same gold.",font=face(16,True),fill=c["gold"])
        d.text((x0,y+414),"No black cutout.",font=face(16),fill="#C5CFCC")
    OUT.parent.mkdir(parents=True,exist_ok=True)
    image.save(OUT,optimize=True)
    print("Wrote",str(OUT),OUT.stat().st_size,"bytes")

if __name__=="__main__":
    main()
