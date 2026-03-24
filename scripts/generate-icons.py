#!/usr/bin/env python3
"""Convert icon.svg to PNG at 16, 48, 128 px using cairosvg."""
import os
import cairosvg

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SVG_PATH = os.path.join(SCRIPT_DIR, "icon.svg")
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "icons")

for size in (16, 48, 128):
    out = os.path.join(OUT_DIR, f"icon-{size}.png")
    cairosvg.svg2png(
        url=SVG_PATH,
        write_to=out,
        output_width=size,
        output_height=size,
    )
    print(f"Generated {out} ({size}x{size})")
