// Each color map is a list of color stops; getLut turns it into 256 RGB entries.
export const COLORMAPS = {
  grayscale: { label: "Grayscale", stops: ["#000000", "#ffffff"] },
  inverted: { label: "Inverted", stops: ["#ffffff", "#000000"] },
  heat: { label: "Heat", stops: ["#000000", "#8a1c1c", "#f08a24", "#fff4c2"] },
  viridis: {
    label: "Viridis",
    stops: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"],
  },
  inferno: {
    label: "Inferno",
    stops: ["#000004", "#57106e", "#bc3754", "#f98e09", "#fcffa4"],
  },
};

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const cache = {};

// Lookup table: drawing a pixel is one array read, so switching maps is instant.
export function getLut(name) {
  if (cache[name]) return cache[name];
  const stops = COLORMAPS[name].stops.map(toRgb);
  cache[name] = Array.from({ length: 256 }, (_, i) => {
    const pos = (i / 255) * (stops.length - 1);
    const lo = Math.min(Math.floor(pos), stops.length - 2);
    const f = pos - lo;
    return stops[lo].map((c, k) => Math.round(c + (stops[lo + 1][k] - c) * f));
  });
  return cache[name];
}

export const gradientOf = (name) =>
  `linear-gradient(to right, ${COLORMAPS[name].stops.join(", ")})`;
