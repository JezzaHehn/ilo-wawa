import sys
from PIL import Image, ImageDraw, ImageFont

if len(sys.argv) > 1:
    text = sys.argv[1]
else:
    text = "toki pona"

linja = ImageFont.truetype("C:/WINDOWS/FONTS/LINJA-PONA-4.0.OTF", 40)
(w,h) = linja.getsize(text)
w += 10
h += 10

im = Image.new("RGB", (w,h), color = "white")
draw = ImageDraw.Draw(im)
draw.text((5,0), text, font=linja, fill=(0,0,0))

im.save("sitelen.png")
