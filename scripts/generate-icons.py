#!/usr/bin/env python3
"""
Generate shield+book PNG icons for the Wiqaya Chrome Extension.
Uses only Python stdlib (struct, zlib) — no third-party packages needed.
"""

import struct
import zlib
import math
import os

# ── Colours ──────────────────────────────────────────────────────────────────
TEAL_DARK  = (10,  122, 111)   # #0a7a6f  – bottom of gradient / border
TEAL_MID   = (13,  148, 136)   # #0d9488  – middle of shield
TEAL_LIGHT = (15,  172, 158)   # #0fac9e  – top highlight
GOLD       = (212, 175, 55)    # #D4AF37
WHITE      = (255, 255, 255)
TRANSPARENT = None              # sentinel for alpha=0


# ── PNG writer ────────────────────────────────────────────────────────────────

def _pack_chunk(chunk_type: bytes, data: bytes) -> bytes:
    c = chunk_type + data
    return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)


def write_png(path: str, pixels: list[list[tuple]]):
    """pixels[y][x] = (R, G, B, A)  0-255"""
    h = len(pixels)
    w = len(pixels[0])

    # Build raw image data: filter-byte 0 + RGBA row
    raw_rows = []
    for row in pixels:
        row_bytes = bytearray([0])  # filter type None
        for px in row:
            row_bytes += bytearray(px)
        raw_rows.append(bytes(row_bytes))
    compressed = zlib.compress(b"".join(raw_rows), 9)

    sig    = b"\x89PNG\r\n\x1a\n"
    ihdr   = _pack_chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    idat   = _pack_chunk(b"IDAT", compressed)
    iend   = _pack_chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(sig + ihdr + idat + iend)
    print(f"  wrote {path}  ({w}×{h})")


# ── Drawing primitives ────────────────────────────────────────────────────────

def lerp(a, b, t):
    return a + (b - a) * t


def blend(dst, src_rgb, src_a):
    """Alpha-composite src over dst (both RGBA tuples, alpha 0-255)."""
    sa = src_a / 255.0
    da = dst[3] / 255.0
    out_a = sa + da * (1 - sa)
    if out_a < 1e-6:
        return (0, 0, 0, 0)
    r = int((src_rgb[0] * sa + dst[0] * da * (1 - sa)) / out_a)
    g = int((src_rgb[1] * sa + dst[1] * da * (1 - sa)) / out_a)
    b = int((src_rgb[2] * sa + dst[2] * da * (1 - sa)) / out_a)
    a = int(out_a * 255)
    return (r, g, b, a)


def fill_pixel(buf, x, y, rgb, alpha=255):
    if 0 <= x < len(buf[0]) and 0 <= y < len(buf):
        buf[y][x] = blend(buf[y][x], rgb, alpha)


def draw_aa_circle(buf, cx, cy, r, rgb, alpha=255):
    """Draw a filled anti-aliased circle."""
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            dist = math.hypot(x - cx, y - cy)
            coverage = max(0.0, min(1.0, r - dist + 0.5))
            if coverage > 0:
                fill_pixel(buf, x, y, rgb, int(alpha * coverage))


def draw_filled_rect(buf, x0, y0, x1, y1, rgb, alpha=255):
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            fill_pixel(buf, x, y, rgb, alpha)


def draw_aa_line(buf, x0, y0, x1, y1, rgb, thickness=1.0, alpha=255):
    """Xiaolin Wu-ish thick AA line."""
    dx = x1 - x0
    dy = y1 - y0
    length = math.hypot(dx, dy)
    if length < 1e-6:
        return
    nx = -dy / length  # normal
    ny =  dx / length

    steps = max(int(length * 2), 2)
    for i in range(steps + 1):
        t = i / steps
        cx = x0 + t * dx
        cy = y0 + t * dy
        # draw a small circle along the line for thickness
        for sy in range(int(cy - thickness - 1), int(cy + thickness + 2)):
            for sx in range(int(cx - thickness - 1), int(cx + thickness + 2)):
                dist = math.hypot(sx - cx, sy - cy)
                coverage = max(0.0, min(1.0, thickness / 2 - dist + 0.5))
                if coverage > 0:
                    fill_pixel(buf, sx, sy, rgb, int(alpha * coverage))


# ── Shield polygon ────────────────────────────────────────────────────────────

def point_in_shield(x, y, w, h):
    """
    Returns a coverage value [0,1] for a shield shape.
    Shield: rounded top corners, straight sides, converges to a pointed bottom.
    Coordinates normalised to [0,1].
    """
    nx = x / w
    ny = y / h

    # Shield proportions
    top_pad   = 0.04
    side_pad  = 0.06
    arch_h    = 0.22   # how far down the top arch curve goes
    point_y   = 0.97   # where the bottom tip is

    # Above the shield
    if ny < top_pad:
        return 0.0

    # Bottom pointed region: linearly taper sides
    if ny > arch_h:
        taper_t = (ny - arch_h) / (point_y - arch_h)   # 0→1
        half_w = (0.5 - side_pad) * (1.0 - taper_t * taper_t)
        cx = 0.5
        dist_x = abs(nx - cx) - half_w
        if dist_x > 0.0:
            return max(0.0, 1.0 - dist_x * w * 2)   # AA edge
        return 1.0

    # Top arch region: elliptical arch
    if ny <= arch_h:
        # simple: just check left/right sides with corner rounding
        half_w_top = 0.5 - side_pad
        cx = 0.5
        dist_x = abs(nx - cx) - half_w_top
        if dist_x > 0.0:
            return max(0.0, 1.0 - dist_x * w * 2)
        return 1.0

    return 0.0


def shield_gradient_color(ny):
    """Return RGB for the shield fill based on normalised y [0,1]."""
    if ny < 0.5:
        t = ny / 0.5
        r = int(lerp(TEAL_LIGHT[0], TEAL_MID[0], t))
        g = int(lerp(TEAL_LIGHT[1], TEAL_MID[1], t))
        b = int(lerp(TEAL_LIGHT[2], TEAL_MID[2], t))
    else:
        t = (ny - 0.5) / 0.5
        r = int(lerp(TEAL_MID[0], TEAL_DARK[0], t))
        g = int(lerp(TEAL_MID[1], TEAL_DARK[1], t))
        b = int(lerp(TEAL_MID[2], TEAL_DARK[2], t))
    return (r, g, b)


# ── Book motif ────────────────────────────────────────────────────────────────

def draw_book(buf, size, margin_frac=0.22):
    """
    Draw an open book (two pages) in gold, centred in the shield.
    The spine is a vertical line; pages fan slightly outward.
    """
    w = h = size
    gold = GOLD

    cx   = w / 2.0
    # Vertical centre of book (shift up a tiny bit from shield centre)
    book_cy = h * 0.50

    # Book dimensions scale with icon size
    book_w  = w * 0.58   # total width of open book
    book_h  = h * 0.30   # height of pages
    thick   = max(1.0, size * 0.025)  # line thickness

    # Each page is a parallelogram.  Left page slants left, right page slants right.
    slant = w * 0.04   # horizontal slant at top vs bottom

    half = book_w / 2.0

    # ── right page ──────────────────────────────────────────────────────────
    # Four corners: spine-top, outer-top, outer-bottom, spine-bottom
    rt = [(cx + slant * 0.15,  book_cy - book_h / 2),
          (cx + half,          book_cy - book_h / 2 - slant * 0.4),
          (cx + half,          book_cy + book_h / 2 - slant * 0.1),
          (cx + slant * 0.15,  book_cy + book_h / 2)]

    # ── left page ───────────────────────────────────────────────────────────
    lt = [(cx - slant * 0.15,  book_cy - book_h / 2),
          (cx - half,          book_cy - book_h / 2 - slant * 0.4),
          (cx - half,          book_cy + book_h / 2 - slant * 0.1),
          (cx - slant * 0.15,  book_cy + book_h / 2)]

    page_alpha = 220

    # Fill pages
    for (corners, side) in [(lt, -1), (rt, 1)]:
        fill_parallelogram(buf, corners, gold, page_alpha)

    # Outline edges for crispness
    for corners in [lt, rt]:
        n = len(corners)
        for i in range(n):
            x0, y0 = corners[i]
            x1, y1 = corners[(i + 1) % n]
            draw_aa_line(buf, x0, y0, x1, y1, gold, thick, 255)

    # Spine line
    sx0, sy0 = cx, book_cy - book_h / 2 + slant * 0.1
    sx1, sy1 = cx, book_cy + book_h / 2
    draw_aa_line(buf, sx0, sy0, sx1, sy1, gold, thick * 1.3, 255)

    # Lines on pages (mimicking text lines) – only at 48+ px
    if size >= 48:
        n_lines = 3
        for i in range(n_lines):
            t = (i + 1) / (n_lines + 1)
            ly = book_cy - book_h / 2 + t * book_h
            # right page
            rx0 = cx + slant * 0.2
            rx1 = cx + half * 0.82
            draw_aa_line(buf, rx0, ly, rx1, ly, gold, max(0.6, thick * 0.6), 160)
            # left page
            lx0 = cx - slant * 0.2
            lx1 = cx - half * 0.82
            draw_aa_line(buf, lx0, ly, lx1, ly, gold, max(0.6, thick * 0.6), 160)


def fill_parallelogram(buf, corners, rgb, alpha):
    """
    Scan-fill a convex quadrilateral.
    corners: list of 4 (x,y) in order.
    """
    xs = [c[0] for c in corners]
    ys = [c[1] for c in corners]
    y_min = int(min(ys))
    y_max = int(max(ys)) + 1

    n = len(corners)
    for y in range(y_min, y_max + 1):
        intersections = []
        for i in range(n):
            x0, y0 = corners[i]
            x1, y1 = corners[(i + 1) % n]
            if y0 == y1:
                continue
            if min(y0, y1) <= y <= max(y0, y1):
                t = (y - y0) / (y1 - y0)
                ix = x0 + t * (x1 - x0)
                intersections.append(ix)
        if len(intersections) >= 2:
            intersections.sort()
            x_left  = intersections[0]
            x_right = intersections[-1]
            for x in range(int(x_left), int(x_right) + 1):
                fill_pixel(buf, x, y, rgb, alpha)


# ── Icon renderer ─────────────────────────────────────────────────────────────

def make_icon(size: int) -> list:
    buf = [[(0, 0, 0, 0)] * size for _ in range(size)]
    w = h = size

    border_w = max(1.0, size * 0.04)

    # ── 1. Draw shield fill with gradient ──────────────────────────────────
    for y in range(h):
        for x in range(w):
            cov = point_in_shield(x, y, w, h)
            if cov > 0:
                rgb = shield_gradient_color(y / h)
                fill_pixel(buf, x, y, rgb, int(cov * 255))

    # ── 2. Draw shield border (gold) ───────────────────────────────────────
    for y in range(h):
        for x in range(w):
            cov = point_in_shield(x, y, w, h)
            if 0 < cov < 1:
                fill_pixel(buf, x, y, GOLD, int(cov * 220))
            elif cov == 1:
                # Check if we're near the edge by sampling neighbours
                edge = False
                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        nc = point_in_shield(x + dx * border_w, y + dy * border_w, w, h)
                        if nc < 0.3:
                            edge = True
                if edge:
                    fill_pixel(buf, x, y, GOLD, 180)

    # ── 3. Draw book motif ──────────────────────────────────────────────────
    draw_book(buf, size)

    return buf


# ── Main ──────────────────────────────────────────────────────────────────────

ICONS_DIR = "/home/kudaliar/wiqaya/public/icons"

sizes = [16, 48, 128]
for s in sizes:
    pixels = make_icon(s)
    write_png(f"{ICONS_DIR}/icon-{s}.png", pixels)

print("Done.")
