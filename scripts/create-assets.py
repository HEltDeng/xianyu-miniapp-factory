"""Original programmatic interior illustrations; no third-party images."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
out=Path(__file__).resolve().parents[1]/"assets"
out.mkdir(exist_ok=True)
def scene(name, wall, sofa, accent):
    im=Image.new("RGB",(1000,760),wall); d=ImageDraw.Draw(im)
    d.rectangle((0,550,1000,760),fill="#c8c4ae")
    d.polygon([(0,550),(1000,550),(1000,760),(0,760)],fill="#b6b39d")
    for x in range(0,1000,110):d.line((x,550,x-150,760),fill="#a7a58f",width=2)
    d.rectangle((620,65,930,495),fill="#f4f0dc");d.rectangle((642,85,907,475),fill="#c4d0c1")
    d.polygon([(642,340),(780,180),(907,330),(907,475),(642,475)],fill="#91a78d")
    d.line((774,85,774,475),fill="#f5f0df",width=12);d.line((642,270,907,270),fill="#f5f0df",width=12)
    d.polygon([(620,495),(930,495),(820,760),(180,760)],fill="#d4d0b9")
    d.ellipse((150,555,830,724),fill="#ddd7bd")
    d.rounded_rectangle((100,350,650,560),radius=55,fill=sofa)
    d.rounded_rectangle((90,425,660,585),radius=32,fill=sofa)
    d.rounded_rectangle((115,435,160,585),radius=20,fill=accent);d.rounded_rectangle((600,435,645,585),radius=20,fill=accent)
    for x in [185,400]:d.rounded_rectangle((x,390,x+150,505),radius=18,fill=accent)
    d.rectangle((125,582,143,620),fill="#625949");d.rectangle((607,582,625,620),fill="#625949")
    d.ellipse((415,570,720,640),fill="#817b60");d.rectangle((550,605,570,695),fill="#67654e")
    d.ellipse((523,575,586,597),fill="#ded8bc")
    d.rectangle((210,110,420,285),fill="#e6dfc8");d.rectangle((224,124,406,271),fill="#a3aa8c")
    d.ellipse((250,145,368,254),fill="#cfbd94");d.rectangle((270,205,350,271),fill="#79896e")
    d.rectangle((832,340,842,590),fill="#556b43")
    for box in [(760,280,838,380),(837,240,919,340),(776,370,844,450),(835,355,926,428)]:d.ellipse(box,fill="#647e53")
    d.polygon([(801,540),(874,540),(860,615),(815,615)],fill="#a18261")
    im.save(out/(name+".png"),optimize=True)
scene("hero","#e0decd","#657d65","#91a083")
scene("space","#e7dfcd","#a6aa8d","#c3c3a4")
scene("care","#d6e1d8","#587c70","#84a18e")
scene("design","#dfd2c8","#96705f","#b49379")
im=Image.new("RGB",(192,192),"#286454");d=ImageDraw.Draw(im);d.line([(44,134),(44,75),(96,38),(148,75),(148,134)],fill="#eee9d9",width=8);d.arc((63,73,131,146),0,180,fill="#d4b785",width=7);im.save(out/"logo.png")
for name in ["home","service","booking","profile"]:
 for active in [False,True]:
  im=Image.new("RGBA",(80,80));d=ImageDraw.Draw(im);c="#286454" if active else "#858b80"
  if name=="home":d.line([(14,38),(40,15),(66,38),(66,65),(14,65),(14,38)],fill=c,width=5)
  elif name=="service":
   for x,y in [(15,15),(45,15),(15,45),(45,45)]:d.rounded_rectangle((x,y,x+20,y+20),radius=4,outline=c,width=4)
  elif name=="booking":d.rounded_rectangle((15,20,65,66),radius=6,outline=c,width=4);d.line((15,34,65,34),fill=c,width=4);d.line((27,14,27,26),fill=c,width=4);d.line((53,14,53,26),fill=c,width=4)
  else:d.ellipse((27,12,53,38),outline=c,width=4);d.arc((15,41,65,82),180,360,fill=c,width=4)
  im.save(out/("nav-"+name+("-active" if active else "")+".png"))
print("13 original PNG assets created")

