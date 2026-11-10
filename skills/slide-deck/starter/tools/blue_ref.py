"""blue_ref.py — the style reference sheet in the blue palette: every non-yellow colour moves to one blue hue family."""
import colorsys, numpy as np
from PIL import Image
im = Image.open("assets/ref/green-indicators.png").convert("RGB")
a = np.asarray(im).astype(np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx, mn = a.max(-1), a.min(-1)
d = mx - mn
h = np.zeros_like(mx)
m = d > 1e-6
rc = np.where(m, (mx - r) / np.where(m, d, 1), 0); gc = np.where(m, (mx - g) / np.where(m, d, 1), 0); bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc)) / 6 % 1
s = np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0)
v = mx
yellow = (h > 0.08) & (h < 0.18) & (s > 0.35)
# green/teal → blue: lighter tones a clear azure (212°), dark structure a deep navy (222°)
nh = np.where(yellow, h, (222 - 12 * np.clip(v, 0, 1)) / 360)
ns = np.where(yellow, s, np.clip(s * 1.12 + 0.04 * (s > 0.08), 0, 0.92))
nv = np.where(yellow, v, np.clip(v * 1.06 + 0.02, 0, 1))
i = np.floor(nh * 6).astype(int) % 6
f = nh * 6 - np.floor(nh * 6)
p, q, t = nv * (1 - ns), nv * (1 - f * ns), nv * (1 - (1 - f) * ns)
out = np.choose(i[..., None], [np.stack(x, -1) for x in [(nv, t, p), (q, nv, p), (p, nv, t), (p, q, nv), (t, p, nv), (nv, p, q)]])
Image.fromarray((out * 255).round().astype(np.uint8)).save("assets/ref/blue-indicators.png")
