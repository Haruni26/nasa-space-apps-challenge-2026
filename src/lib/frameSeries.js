import { alignFrames, buildMask } from "./frameAlign";
import { formatMjd, parseFrameName } from "./mjd";
import { OBJECTS } from "./object";

// Every PNG anywhere under src/frames/ as { "../frames/<folder>/<file>.png": url }.
// "**" means PNGs inside sub-folders of an object's folder are found too.
const files = import.meta.glob("../frames/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

// The folders that exist directly inside src/frames/ (used to explain a miss).
export function listFolders() {
  const names = Object.keys(files)
    .map((path) => path.split("/"))
    .filter((p) => p.length > 3)
    .map((p) => p[2]);
  return [...new Set(names)].sort();
}

// The PNGs for one object and scale, oldest observation first.
export function listFrames(objectId, scaleId) {
  const object = OBJECTS.find((o) => o.id === objectId);
  if (!object) return [];
  return Object.entries(files)
    .map(([path, url]) => {
      const parts = path.split("/");
      return {
        folder: parts[2],
        url,
        info: parseFrameName(parts[parts.length - 1]),
      };
    })
    .filter(
      (f) => f.folder === object.folder && f.info && f.info.scale === scaleId,
    )
    .sort((a, b) => a.info.mjd - b.info.mjd);
}

// PNG -> { width, height, values, mask }. values are 0-255 brightness; mask marks real data.
// The color map is applied later in the browser, so switching maps never re-downloads anything.
async function decode(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  const rgba = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;

  // A grayscale PNG has equal R, G, and B, so the red channel is the brightness.
  const values = new Uint8ClampedArray(bitmap.width * bitmap.height);
  for (let i = 0; i < values.length; i++) values[i] = rgba[i * 4];
  return {
    width: bitmap.width,
    height: bitmap.height,
    values,
    mask: buildMask(rgba, bitmap.width, bitmap.height),
  };
}

// Loads every frame for an object and scale, in time order: [{ mjd, label, tag, image }].
export async function loadSeries(objectId, scaleId) {
  const frames = listFrames(objectId, scaleId);
  if (frames.length === 0) {
    const object = OBJECTS.find((o) => o.id === objectId);
    const folders = listFolders().join(", ") || "none";
    throw new Error(
      `No "${scaleId}" PNGs found in src/frames/${object?.folder}/. Folders that exist in src/frames/: ${folders}.`,
    );
  }

  const decoded = await Promise.all(
    frames.map(async (f) => ({ info: f.info, image: await decode(f.url) })),
  );
  // Frames can come in different sizes; put them on one shared canvas so nothing appears to zoom.
  const aligned = alignFrames(decoded.map((d) => d.image));
  return decoded.map((d, i) => ({
    mjd: d.info.mjd,
    label: formatMjd(d.info.mjd),
    tag: d.info.tag,
    image: { ...aligned[i], hasData: aligned[i].mask.includes(1) },
  }));
}
