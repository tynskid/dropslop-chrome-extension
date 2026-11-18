#!/usr/bin/env python3
"""Generate icons/icon{16,48,128}.png (a dark rounded square with a pale check mark). Needs Pillow."""
import os
from PIL import Image, ImageDraw

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
os.makedirs(out, exist_ok=True)
S = 512
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle([0, 0, S - 1, S - 1], radius=110, fill=(29, 75, 168, 255))
d.line([(120, 270), (215, 365), (395, 150)], fill=(255, 255, 255, 255), width=64, joint="curve")
for r, (x, y) in ((32, (120, 270)), (32, (395, 150))):
    d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 255))
for n in (16, 48, 128):
    img.resize((n, n), Image.LANCZOS).save(os.path.join(out, f"icon{n}.png"))
