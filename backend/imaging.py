"""Turn a 2D float array (from FITS) into an 8-bit PNG a browser can show.

Notebooks can use this too (from the backend folder): from imaging import to_png_bytes
"""
import io

import numpy as np
from PIL import Image


def series_limits(arrays, low=1.0, high=99.5):
    """One shared (vmin, vmax) for a whole series, so brightness stays comparable between frames."""
    finite = np.concatenate([a[np.isfinite(a)].ravel() for a in map(np.asarray, arrays)])
    if finite.size == 0:
        return 0.0, 1.0
    lo, hi = np.percentile(finite, [low, high])
    return float(lo), float(hi)


def stretch_to_uint8(data, low=1.0, high=99.5, softening=10.0, vmin=None, vmax=None):
    """Scale a float array to 0-255, brightest = 255. Pass vmin/vmax to fix the range (see series_limits)."""
    arr = np.asarray(data, dtype=np.float32)

    # 1. Ignore NaN/inf pixels (masked or off-detector) when choosing the brightness range.
    finite = arr[np.isfinite(arr)]
    if finite.size == 0:
        return np.zeros(arr.shape, dtype=np.uint8)

    # 2. Clip to percentiles so a few hot pixels don't wash out everything else.
    lo, hi = (vmin, vmax) if vmin is not None and vmax is not None else np.percentile(finite, [low, high])
    if hi <= lo:
        hi = lo + 1.0
    scaled = np.clip((arr - lo) / (hi - lo), 0.0, 1.0)

    # 3. asinh stretch: lifts faint sources like a log scale, but handles zero and negative values.
    stretched = np.arcsinh(softening * scaled) / np.arcsinh(softening)

    # 4. Bad pixels become black, then convert to 8-bit.
    stretched = np.nan_to_num(stretched, nan=0.0)
    return (stretched * 255).astype(np.uint8)


def to_png_bytes(data, **stretch):
    arr = np.asarray(data, dtype=np.float32)
    gray = stretch_to_uint8(arr, **stretch)
    # Pixels with no data (NaN/inf) become transparent, so the site can leave them empty.
    alpha = np.where(np.isfinite(arr), 255, 0).astype(np.uint8)
    # FITS row 0 is the BOTTOM of the sky image; PNG row 0 is the TOP. Flip so north is up.
    gray, alpha = (np.ascontiguousarray(np.flipud(a)) for a in (gray, alpha))
    image = Image.merge("LA", (Image.fromarray(gray), Image.fromarray(alpha)))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()