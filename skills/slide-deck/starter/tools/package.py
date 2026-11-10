"""package.py <pieces_dir> <export_dir> <loops_dir> <media_dir> <out_dir> — builds the PowerPoint and the PDF.

PowerPoint: every talk slide rebuilt from its parts, the way a hand-made deck is built:
  - the slide background is a picture of what is there before anything builds in
  - every card, chart, icon and image is its own picture, grouped with its own text, in the web deck's stacking order
  - all text is real, editable text in the deck's own fonts (Space Grotesk, Inter, JetBrains Mono)
  - no animation for what a slide shows from the start; the few slides with a click reveal it with PowerPoint's own
    entrance (fade with a short rise), and plain graphics that change on that click (lines, highlights) fade in
  - the motion videos play by themselves; the title and closing slides play their living background as a
    seamless loop under the editable text
  - speaker notes per slide, split by click
PDF: the final state of every slide.
Pieces come from deck/pptx-extract.mjs. Runs in Docker (deck-pack image)."""
import json
import math
import os
import subprocess
import sys
from collections import defaultdict
from xml.sax.saxutils import escape

import numpy as np
from lxml import etree
from PIL import Image, ImageDraw
from pptx import Presentation
from pptx.oxml.ns import qn
from pptx.util import Emu
from fontTools.ttLib import TTFont
from scipy import ndimage

pieces, exp, loops_dir, media, out = sys.argv[1:6]
NAME = open("tools/deck-name.txt").read().strip()  # the file name of the PPTX and PDF
os.makedirs(out, exist_ok=True)
info = {s["n"]: s for s in json.load(open(os.path.join(pieces, "pptx.json")))}
slides = json.load(open(os.path.join(exp, "slides.json")))
loops = {c["slide"]: c for c in json.load(open(os.path.join(loops_dir, "loops.json")))}
W, H = Emu(12192000), Emu(6858000)  # 13.333 x 7.5 in, 16:9
PX = 6350  # EMU per deck pixel (the deck is 1920 px wide)
SC = 2  # pieces are rendered at 2x
NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
DECL = f'xmlns:p="{NS}" xmlns:a="{A}" xmlns:r="{R}"'
tmp = os.path.join(out, ".tmp")
os.makedirs(tmp, exist_ok=True)

# font metrics (ascent, descent per em) and PowerPoint's placement of exactly spaced lines: the first baseline sits
# 0.76 x the line spacing below the top of the text box, for every font (measured in PowerPoint 16 against Chrome)
ASC = {"Space Grotesk": 0.984, "Inter": 0.96875, "JetBrains Mono": 1.02}
DESC = {"Space Grotesk": 0.292, "Inter": 0.2421875, "JetBrains Mono": 0.3}
BASELINE = 0.76
WEIGHTS = {400: "", 500: " Medium", 600: " SemiBold", 700: " Bold"}
RISE = 22 / 1080  # the web deck's builds rise 22 px


def face(r):
    """The installed family for a run: one family per weight, and "... Tabular" for tabular figures."""
    name = r["family"] + WEIGHTS[min(WEIGHTS, key=lambda k: abs(k - r["weight"]))]
    return name + " Tabular" if r.get("tnum") and r["family"] != "JetBrains Mono" else name


FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts", "static")
_fonts = {}


def natural_width(runs):
    """How wide PowerPoint sets these runs: glyph advances plus letter spacing (PowerPoint applies no kerning)."""
    w = 0.0
    for r in runs:
        name = face(r)
        if name not in _fonts:
            f = TTFont(os.path.join(FONT_DIR, name.replace(" ", "") + "-Regular.ttf"))
            _fonts[name] = (f.getBestCmap(), f["hmtx"], f["head"].unitsPerEm)
        cmap, hmtx, upem = _fonts[name]
        for ch in r["text"]:
            g = cmap.get(ord(ch))
            w += (hmtx[g][0] / upem if g else 0.55) * r["size"] + r["spacing"]
    return w


def fitted(line, width):
    """The line with its letter spacing nudged so it is exactly as wide as Chrome set it (Chrome kerns, PowerPoint
    does not): every character gets the same share of the difference."""
    n = sum(len(r["text"]) for r in line)
    if not width or not n:
        return line
    d = (width - natural_width(line)) / n
    if abs(d) > 0.08 * max(r["size"] for r in line):
        return line
    return [{**r, "spacing": r["spacing"] + d} for r in line]


def emu(v):
    return Emu(int(round(v * PX)))


# ---------------------------------------------------------------- pictures
def trimmed(png, dst):
    """A full-slide transparent piece cut down to what it shows; None when it shows nothing."""
    im = Image.open(png).convert("RGBA")
    a = np.asarray(im.getchannel("A"))
    ys, xs = np.nonzero(a > 2)
    if not len(xs):
        return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    im.crop((x0, y0, x1, y1)).save(dst, optimize=True)
    return dst, x0 / SC, y0 / SC, (x1 - x0) / SC, (y1 - y0) / SC


def frosted(unit_png, over_png, boxes, dst):
    """A frosted-glass card as PowerPoint can show it: inside each glass box the card is opaque and carries the
    blurred backdrop it has on the web (captured over the real background); outside (shadows, edges) it stays
    transparent."""
    im = np.asarray(Image.open(unit_png).convert("RGBA")).copy()
    over = np.asarray(Image.open(over_png).convert("RGB"))
    mask = Image.new("L", (im.shape[1], im.shape[0]), 0)
    draw = ImageDraw.Draw(mask)
    for b in boxes:
        x0, y0 = b["x"] * SC + SC, b["y"] * SC + SC
        x1, y1 = (b["x"] + b["w"]) * SC - SC, (b["y"] + b["h"]) * SC - SC
        draw.rounded_rectangle((x0, y0, x1, y1), radius=max(0, b["r"] * SC - SC), fill=255)
    m = np.asarray(mask) > 127
    im[m, :3] = over[m]
    im[m, 3] = 255
    Image.fromarray(im, "RGBA").save(dst)
    return dst


def layer(prev_png, cur_png, dst):
    """What a click changes in the plain graphics, cut to the changed area; None when nothing changes."""
    a = np.asarray(Image.open(prev_png).convert("RGB")).astype(np.int16)
    b = np.asarray(Image.open(cur_png).convert("RGB"))
    mask = np.abs(b.astype(np.int16) - a).max(axis=2) > 3
    if mask.sum() < 40:
        return None
    mask = ndimage.binary_dilation(mask, iterations=4)
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.dstack([b, (mask * 255).astype(np.uint8)])[y0:y1, x0:x1]
    Image.fromarray(rgba, "RGBA").save(dst, optimize=True)
    return dst, x0 / SC, y0 / SC, (x1 - x0) / SC, (y1 - y0) / SC


def jpg(src, dst):
    Image.open(src).convert("RGB").save(dst, quality=93, subsampling=0)
    return dst


def frame(mp4, dst, last=False):
    args = ["ffmpeg", "-v", "error", "-y"] + (["-sseof", "-0.05"] if last else []) + ["-i", mp4, "-frames:v", "1", "-q:v", "2", dst]
    subprocess.run(args, check=True)
    return dst


def duration_ms(mp4):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], capture_output=True, text=True)
    return int(float(r.stdout.strip() or 1) * 1000)


def background(slide, img):
    """The picture as the slide's own background (not a shape, so it cannot be nudged by accident)."""
    _, rid = slide.part.get_or_add_image_part(img)
    bg = etree.fromstring(f'<p:bg {DECL}><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="{rid}"/><a:srcRect/>'
                          f'<a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>')
    slide._element.find(qn("p:cSld")).insert(0, bg)


def picture(shapes, piece, name):
    path, x, y, w, h = piece
    pic = shapes.add_picture(path, emu(x), emu(y), emu(w), emu(h))
    pic.name = name
    return pic


# ---------------------------------------------------------------- editable text
# a source link: PowerPoint keeps the run's own colour (hlinkClr "tx") instead of painting it in the theme's blue
HLINK = ('<a:hlinkClick r:id="{}"><a:extLst><a:ext uri="{{A12FA001-AC4F-418D-AE19-62706E023703}}">'
         '<ahyp:hlinkClr xmlns:ahyp="http://schemas.microsoft.com/office/drawing/2018/hyperlinkcolor" val="tx"/>'
         '</a:ext></a:extLst></a:hlinkClick>')


def run_xml(r, text=None, link=None):
    """One run's properties (and text). `link` is the relationship id of the run's hyperlink, if it has one."""
    c = r["color"]
    rgb = "%02X%02X%02X" % tuple(int(round(v)) for v in c[:3])
    alpha = f'<a:alpha val="{int(round(c[3] * 100000))}"/>' if c[3] < 0.995 else ""
    f = escape(face(r), {'"': "&quot;"})
    italic = ' i="1"' if r["italic"] else ""
    rpr = (f'lang="vi-VN" sz="{round(r["size"] * 50)}"{italic} b="0" spc="{round(r["spacing"] * 50)}" dirty="0"><a:solidFill>'
           f'<a:srgbClr val="{rgb}">{alpha}</a:srgbClr></a:solidFill><a:latin typeface="{f}"/><a:ea typeface="{f}"/><a:cs typeface="{f}"/>'
           + (HLINK.format(link) if link else ""))

    if text is None:
        return rpr
    return f'<a:r><a:rPr {rpr}</a:rPr><a:t>{escape(text)}</a:t></a:r>'


def textbox(shapes, t):
    """One text block of the web deck as a PowerPoint text box whose glyphs land where Chrome draws them."""
    lines = t["lines"] if abs(t["rot"]) > 0.5 else [fitted(line, lw) for line, lw in zip(t["lines"], t["lw"])]
    runs = [r for line in lines for r in line]
    size = max(r["size"] for r in runs)
    fam = lines[0][0]["family"]
    rot = t["rot"]
    if abs(rot) > 0.5:
        # rotated SVG label: centre the box on the label, one line as tall as the font's own line
        lh = (ASC[fam] + DESC[fam]) * size
        delta = ASC[fam] * size - BASELINE * lh  # box centre below the glyph box centre, in the label's own frame
        th = math.radians(rot)
        w, h = t["w"] + size * 0.6, lh
        cx, cy = t["cx"] - math.sin(th) * delta, t["cy"] + math.cos(th) * delta
        left, top, algn = cx - w / 2, cy - h / 2, "ctr"
    else:
        lh = t["lineHeight"]
        base1 = t["y"] + max(ASC[r["family"]] * r["size"] for r in lines[0])
        w = t["w"] * 1.04 + size * 0.5
        h = lh * len(lines)
        top = base1 - BASELINE * lh
        algn = t["align"]
        left = t["x"] if algn == "l" else t["x"] + t["w"] - w if algn == "r" else t["cx"] - w / 2
    body = []
    rels = {}
    def link(r):  # a run that is a source link in the web deck becomes a PowerPoint hyperlink
        h = r.get("href")
        if h and h not in rels:
            rels[h] = shapes.part.relate_to(h, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
        return rels.get(h) if h else None
    for k, line in enumerate(lines):
        if k:
            body.append(f'<a:br><a:rPr {run_xml(line[0])}</a:rPr></a:br>')
        body.extend(run_xml(r, r["text"], link(r)) for r in line if r["text"])
    end = run_xml(lines[-1][-1])
    tx = (f'<p:txBody {DECL}><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t"><a:spAutoFit/></a:bodyPr>'
          f'<a:lstStyle/><a:p><a:pPr algn="{algn}"><a:lnSpc><a:spcPts val="{round(lh * 50)}"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef>'
          f'<a:spcAft><a:spcPts val="0"/></a:spcAft></a:pPr>{"".join(body)}<a:endParaRPr {end}</a:endParaRPr></a:p></p:txBody>')
    tb = shapes.add_textbox(emu(left), emu(top), emu(w), emu(h))
    old = tb._element.txBody
    old.getparent().replace(old, etree.fromstring(tx))
    if abs(rot) > 0.5:
        tb.rotation = rot
    words = " ".join(r["text"] for r in runs).split()
    tb.name = " ".join(words[:6])[:48] or "Text"
    return tb


# ---------------------------------------------------------------- PowerPoint timing XML (as PowerPoint writes it)
class Ids:
    def __init__(self):
        self.n = 2

    def __call__(self):
        self.n += 1
        return self.n


def _vis(ids, spid):
    return (f'<p:set><p:cBhvr><p:cTn id="{ids()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
            f'</p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>')


def rise(ids, spid, node, delay):
    """The web deck's build: fade in over 0.7 s while rising 22 px over 0.9 s, easing out."""
    return f'''<p:par><p:cTn id="{ids()}" presetID="42" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="{node}">
<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>{_vis(ids, spid)}
<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{ids()}" dur="700"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>
<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="{ids()}" dur="900" decel="100000" fill="hold"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>
<p:attrNameLst><p:attrName>ppt_x</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav></p:tavLst></p:anim>
<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="{ids()}" dur="900" decel="100000" fill="hold"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>
<p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_y+{RISE:.5f}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav></p:tavLst></p:anim>
</p:childTnLst></p:cTn></p:par>'''


def fade(ids, spid, node, delay):
    return f'''<p:par><p:cTn id="{ids()}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" nodeType="{node}">
<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>{_vis(ids, spid)}
<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{ids()}" dur="600"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>
</p:childTnLst></p:cTn></p:par>'''


def play(ids, spid, node, delay, dur_ms):
    return f'''<p:par><p:cTn id="{ids()}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="{node}">
<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>
<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="{ids()}" dur="{dur_ms}" fill="hold"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:cmd>
</p:childTnLst></p:cTn></p:par>'''


def media_node(ids, spid, vol, loop):
    rep = ' repeatCount="indefinite"' if loop else ""
    return f'''<p:video><p:cMediaNode vol="{vol}"{(' mute="1"' if vol == 0 else '')}><p:cTn id="{ids()}"{rep} fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>
<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cMediaNode></p:video>'''


def timing(slide, steps, medias, text_ids):
    """steps: {click: [(delay_ms, effect_fn, spid, extra)]}; click 0 (videos) plays as the slide opens, the rest on click."""
    ids = Ids()
    groups = []
    for c in sorted(steps):
        effs = sorted(steps[c], key=lambda e: e[0])
        first = "afterEffect" if c == 0 else "clickEffect"
        inner = "".join(fn(ids, spid, first if k == 0 else "withEffect", d, *extra) for k, (d, fn, spid, extra) in enumerate(effs))
        start = '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' if c == 0 else '<p:cond delay="indefinite"/>'
        groups.append(f'<p:par><p:cTn id="{ids()}" fill="hold"><p:stCondLst>{start}</p:stCondLst><p:childTnLst><p:par><p:cTn id="{ids()}" fill="hold">'
                      f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
    if not groups and not medias:
        return
    blds = "".join(f'<p:bldP spid="{i}" grpId="0" animBg="1"/>' for i in text_ids)
    xml = f'''<p:timing {DECL}><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>
<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>{"".join(groups)}</p:childTnLst></p:cTn>
<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>
<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>{"".join(m(ids) for m in medias)}</p:childTnLst></p:cTn></p:par></p:tnLst>{f"<p:bldLst>{blds}</p:bldLst>" if blds else ""}</p:timing>'''
    el = etree.fromstring(xml)
    for n, ctn in enumerate(el.iter(f"{{{NS}}}cTn"), start=1):
        ctn.set("id", str(n))
    sld = slide._element
    for old in sld.findall(f"{{{NS}}}timing"):  # adding a movie writes a timing block of its own
        sld.remove(old)
    ext = sld.find(f"{{{NS}}}extLst")
    (ext.addprevious(el) if ext is not None else sld.append(el))


def fade_transition(slide):
    tr = etree.fromstring(f'<p:transition {DECL} spd="fast"><p:fade/></p:transition>')  # 0.5 s, like the web deck
    slide._element.find(f"{{{NS}}}clrMapOvr").addnext(tr)


# ---------------------------------------------------------------- build
prs = Presentation()
prs.slide_width, prs.slide_height = W, H
blank = prs.slide_layouts[6]
stats = defaultdict(int)

for i, s in enumerate(slides):
    n = i + 1
    nn = f"{n:02d}"
    slide = prs.slides.add_slide(blank)
    fade_transition(slide)
    steps, medias, text_ids = defaultdict(list), [], []
    if s.get("video"):
        mp4 = os.path.join(media, os.path.basename(s["video"]["src"]))
        background(slide, frame(mp4, os.path.join(tmp, f"{nn}-last.jpg"), last=True))
        mov = slide.shapes.add_movie(mp4, 0, 0, W, H, poster_frame_image=frame(mp4, os.path.join(tmp, f"{nn}-first.jpg")), mime_type="video/mp4")
        mov.name = "Video"
        steps[0].append((0, play, mov.shape_id, (duration_ms(mp4),)))
        medias.append(lambda ids, spid=mov.shape_id: media_node(ids, spid, 80000, False))
    else:
        p = info[n]
        background(slide, jpg(os.path.join(pieces, f"base-{nn}.png"), os.path.join(tmp, f"{nn}-bg.jpg")))
        if n in loops:
            mp4 = os.path.join(loops_dir, loops[n]["file"])
            mov = slide.shapes.add_movie(mp4, 0, 0, W, H, poster_frame_image=os.path.join(loops_dir, loops[n]["file"].replace(".mp4", "-first.jpg")), mime_type="video/mp4")
            mov.name = "Living background"
            steps[0].append((0, play, mov.shape_id, (duration_ms(mp4),)))
            medias.append(lambda ids, spid=mov.shape_id: media_node(ids, spid, 0, True))
        # plain graphics that a click adds or changes
        prev = os.path.join(pieces, f"base-{nn}.png")
        for c in range(p["clicks"]):
            cur = os.path.join(pieces, f"g-{nn}-{c}.png")
            piece = layer(prev, cur, os.path.join(tmp, f"{nn}-g{c}.png"))
            prev = cur
            if piece:
                pic = picture(slide.shapes, piece, "Graphic")
                if c > 0:
                    steps[c].append((0, fade, pic.shape_id, ()))
                stats["layers"] += 1
        # build elements: picture plus the text that arrives with it, grouped, in stacking order
        texts_of = defaultdict(list)
        loose = []
        for t in p["texts"]:
            u = p["units"][t["unit"]] if t["unit"] is not None else None
            (texts_of[t["unit"]] if u and t["click"] == u["click"] else loose).append(t)
        for u in p["units"]:
            src = os.path.join(pieces, f"unit-{nn}-{u['i']}.png")
            if u["glass"]:
                src = frosted(src, os.path.join(pieces, f"unitbg-{nn}-{u['i']}.png"), u["glass"], os.path.join(tmp, f"{nn}-f{u['i']}.png"))
            piece = trimmed(src, os.path.join(tmp, f"{nn}-u{u['i']}.png"))
            ts = texts_of[u["i"]]
            if not piece and not ts:
                continue
            if piece and not ts:
                shape = picture(slide.shapes, piece, "Graphic")
            elif not piece and len(ts) == 1:
                shape = textbox(slide.shapes, ts[0])
                if u["click"] > 0:
                    text_ids.append(shape.shape_id)
            else:
                shape = slide.shapes.add_group_shape()
                if piece:
                    picture(shape.shapes, piece, "Graphic")
                for t in ts:
                    textbox(shape.shapes, t)
                shape.name = next((sh.name for sh in shape.shapes if sh.has_text_frame), "Group")
            stats["units"] += 1
            if u["click"] > 0:
                steps[u["click"]].append((int(round(u["delay"] * 1000)), rise, shape.shape_id, ()))
        for t in loose:
            tb = textbox(slide.shapes, t)
            if t["click"] > 0:
                steps[t["click"]].append((int(round(t["delay"] * 1000)), rise, tb.shape_id, ()))
                text_ids.append(tb.shape_id)
        stats["texts"] += len(p["texts"])
    timing(slide, steps, medias, text_ids)
    parts = s.get("clickNotes") or [s.get("notes", "")]
    head = f'{n}. {s["title"]}  ({f'{s["minutes"]:g}'.replace(".", ",")} phút{", có thể bỏ" if s.get("cuttable") else ""})'
    body = "\n\n".join(q if k == 0 else f"[bấm] {q}" for k, q in enumerate(parts))
    slide.notes_slide.notes_text_frame.text = head + "\n\n" + body

# the deck's fonts travel inside the file: PowerPoint embeds them on its next save (see release.sh)
prs.part._element.set("embedTrueTypeFonts", "1")
prs.part._element.attrib.pop("saveSubsetFonts", None)  # whole fonts, so anyone can edit the text
pptx = os.path.join(out, NAME + ".pptx")
prs.save(pptx)

ims = [Image.open(os.path.join(exp, s["image"])).convert("RGB") for s in slides]
pdf = os.path.join(out, NAME + ".pdf")
ims[0].save(pdf, save_all=True, append_images=ims[1:], resolution=192)
for f in os.listdir(tmp):
    os.remove(os.path.join(tmp, f))
os.rmdir(tmp)
print(pptx, len(prs.slides), "slides,", dict(stats), os.path.getsize(pptx) // 1048576, "MB")
print(pdf, os.path.getsize(pdf) // 1024, "KB")
