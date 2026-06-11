#!/usr/bin/env python3
"""NIGHTFALL brand toolchain — renders the crescent (NF) and falling star (NSS)
marks as character-ramp ASCII art and exports PNG icons.

Usage:  python3 tools/ascii_marks.py
Requires: pillow  (pip install pillow)
"""
import math
import random
from PIL import Image, ImageDraw, ImageFont

RAMP = " .:;t%S8X@"  # density ramp, dark -> bright
GREYS = [(58,)*3, (92,)*3, (126,)*3, (158,)*3, (188,)*3, (216,)*3, (239,)*3, (255,)*3]
ACCENTS = [(255, 82, 82), (74, 222, 128), (91, 141, 239),
           (255, 169, 77), (77, 214, 232), (232, 121, 249)]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def crescent(size: int = 440) -> Image.Image:
    img = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(img)
    d.ellipse([60, 40, 380, 360], fill=255)
    d.ellipse([150, 20, 470, 340], fill=0)   # cutout -> crescent
    return img.crop((30, 30, 410, 410))


def falling_star(size: int = 400) -> Image.Image:
    img = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(img)
    for i in range(60):                       # tapering trail
        t = i / 60
        x, y, r = 30 + t * 165, 30 + t * 152, 2 + t * 9
        d.ellipse([x - r, y - r, x + r, y + r], fill=int(85 + t * 125))
    cx, cy, pts = 238, 222, []                # 4-point star head
    for k in range(8):
        ang = math.pi / 4 * k - math.pi / 2
        r = 145 if k % 2 == 0 else 36
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    d.polygon(pts, fill=255)
    return img.crop((8, 8, 396, 396))


def to_grid(img: Image.Image, cols: int = 38):
    rows = cols // 2                          # mono cells are ~2:1
    g = img.resize((cols, rows)).convert("L")
    px = g.load()
    return [[px[x, y] / 255 for x in range(cols)] for y in range(rows)]


def to_text(grid) -> str:
    return "\n".join(
        "".join(RAMP[int(v * 9)] if v >= 0.06 else " " for v in row).rstrip()
        for row in grid
    )


def to_icon(grid, path: str, accents: bool = False, size: int = 1024, seed: int = 11):
    random.seed(seed)
    rows, cols = len(grid), len(grid[0])
    cw, ch = size // (cols + 3), size // (rows + 3)
    font = ImageFont.truetype(FONT, int(ch * 0.92))
    im = Image.new("RGB", (size, size), (8, 8, 8))
    d = ImageDraw.Draw(im)
    ox, oy = (size - cols * cw) // 2, (size - rows * ch) // 2
    for y in range(rows):
        for x in range(cols):
            v = grid[y][x]
            if v < 0.06:
                continue
            color = (random.choice(ACCENTS) if accents and random.random() < 0.08
                     else GREYS[min(int(v * 8), 7)])
            d.text((ox + x * cw, oy + y * ch), RAMP[int(v * 9)], fill=color, font=font)
    im.save(path)
    print("wrote", path)


if __name__ == "__main__":
    star = to_grid(falling_star())
    moon = to_grid(crescent())
    print(to_text(star))
    to_icon(star, "nss-star-shark.png", accents=True)
    to_icon(star, "nss-star-mono.png")
    to_icon(moon, "nf-crescent-mono.png")
