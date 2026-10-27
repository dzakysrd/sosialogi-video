import sys
from PIL import Image, ImageDraw
out, cols = sys.argv[1], int(sys.argv[2])
files = sys.argv[3:]
w, h = 360, 640
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 12) + 12, rows * (h + 40) + 12), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((w, h), Image.LANCZOS)
    x = 12 + (i % cols) * (w + 12); y = 12 + (i // cols) * (h + 40)
    sheet.paste(im, (x, y + 24))
    d.text((x, y + 4), f.split("/")[-1], fill=(255, 255, 255))
sheet.save(out, quality=88)
print(out, sheet.size)
