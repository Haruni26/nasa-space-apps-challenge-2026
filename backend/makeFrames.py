"""Turn a folder of FITS files into the PNG series the website shows.

Run from the repo root (with your .venv active):
    python backend/make_frames.py data/wise-0855 wise-0855

Reads every .fits file in the folder (sorted by name, so name them in time order) and writes
src/frames/wise-0855/001_<name>.png, 002_<name>.png, ... for the Explorer to step through.
"""
import sys
from importlib import import_module
from pathlib import Path

from imaging import series_limits, to_png_bytes

ROOT = Path(__file__).resolve().parents[1]  # the repo root, one level above backend/


def read_image(path):
    """Return the 2D science image: the IMAGE extension if present, else the first 2D HDU."""
    try:
        fits = import_module("astropy.io.fits")
    except ModuleNotFoundError as exc:
        raise RuntimeError("Reading FITS files requires astropy; install it with `pip install astropy`.") from exc

    with fits.open(path) as hdul:
        try:
            data = hdul["IMAGE"].data
        except KeyError:
            data = next(h.data for h in hdul if h.data is not None and h.data.ndim == 2)
        # Copy: FITS data is memory-mapped and vanishes when the file closes.
        return data.astype("float32", copy=True)


def main(fits_dir, target):
    paths = sorted(Path(fits_dir).glob("*.fits"))
    if not paths:
        sys.exit(f"No .fits files found in {fits_dir}")
    arrays = [read_image(p) for p in paths]

    # TODO: reproject every array onto one shared sky grid here, so stars stay put between frames.

    # One brightness range for the whole series, so frames stay comparable.
    vmin, vmax = series_limits(arrays)

    out = ROOT / "src" / "frames" / target
    out.mkdir(parents=True, exist_ok=True)
    for i, (path, arr) in enumerate(zip(paths, arrays), start=1):
        (out / f"{i:03d}_{path.stem}.png").write_bytes(to_png_bytes(arr, vmin=vmin, vmax=vmax))
    print(f"Wrote {len(paths)} frames to {out}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python backend/make_frames.py <folder-with-fits> <target-folder-name>")
    main(sys.argv[1], sys.argv[2])