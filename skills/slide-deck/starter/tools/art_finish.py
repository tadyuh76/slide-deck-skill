"""art_finish.py — every assets/gen/<name>.png → deck/public/art/<name>.webp: trimmed to the subject, centred on a
640 px transparent square (subject fits 600 px), lossless WebP. Skips files that are already up to date."""
import glob, os
import numpy as np
from PIL import Image

os.makedirs("deck/public/art", exist_ok=True)
for src in sorted([f for f in glob.glob("assets/gen/*.png") if not os.path.basename(f).startswith(("sheet", "log"))]):
    name = os.path.splitext(os.path.basename(src))[0]
    dst = f"deck/public/art/{name}.webp"
    if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src):
        continue
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 8)
    if not len(xs):
        print("EMPTY", name); continue
    corner = a[:6, :6].mean()
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    S, F = 640, 600
    k = F / max(im.size)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(im, ((S - im.width) // 2, (S - im.height) // 2), im)
    out.save(dst, "WEBP", lossless=True, quality=100, method=6)
    print(name, "ok" if corner < 5 else f"WARN opaque corner {corner:.0f}")
