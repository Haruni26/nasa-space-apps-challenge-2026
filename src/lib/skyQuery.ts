// Everything about "which patch of sky is being viewed" lives here.
// A query looks like { ra, dec, fov }: degrees, degrees, arcminutes.

export const DEFAULT_FOV = 5;
export const FOV_OPTIONS = [2, 5, 10, 20, 30];

// WISE 0855 comes from the challenge page (08h55m10.831s, -7d14m42.53s).
// TODO: add Barnard's Star, Epsilon Indi B, RW Aurigae, R Draconis once you have
// coordinates (SIMBAD, or a backend name lookup). Fast movers drift, so note the epoch.
export const PRESETS = [{ name: "WISE 0855", ra: 133.795129, dec: -7.245147 }];

export function isValid(q) {
  return (
    Number.isFinite(q.ra) &&
    q.ra >= 0 &&
    q.ra < 360 &&
    Number.isFinite(q.dec) &&
    q.dec >= -90 &&
    q.dec <= 90 &&
    Number.isFinite(q.fov) &&
    q.fov > 0 &&
    q.fov <= 60
  );
}

// Accepts "133.795, -7.245" or "133.795 -7.245".
export function parseCoords(text) {
  const parts = text.trim().split(/[\s,]+/);
  if (parts.length !== 2 || parts.includes("")) return null;
  const [ra, dec] = parts.map(Number);
  return Number.isFinite(ra) && Number.isFinite(dec) ? { ra, dec } : null;
}

export function findPreset(text) {
  const name = text.trim().toLowerCase();
  return PRESETS.find((p) => p.name.toLowerCase() === name) ?? null;
}

// Reads ?ra=133.795&dec=-7.245&fov=5 so a shared link reopens the same view.
export function parseQuery(search) {
  const p = new URLSearchParams(search);
  if (!p.has("ra") || !p.has("dec")) return null;
  const q = {
    ra: Number(p.get("ra")),
    dec: Number(p.get("dec")),
    fov: p.has("fov") ? Number(p.get("fov")) : DEFAULT_FOV,
  };
  return isValid(q) ? q : null;
}

export function toSearch(q) {
  return `?${new URLSearchParams({ ra: String(q.ra), dec: String(q.dec), fov: String(q.fov) })}`;
}

// Degrees to hours/minutes/seconds so people can cross-check against catalogs.
function split(totalSeconds) {
  const t = Math.round(totalSeconds * 100) / 100;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t - h * 3600) / 60);
  return [h, m, t - h * 3600 - m * 60];
}
const two = (n) => String(n).padStart(2, "0");
const sec = (s) => s.toFixed(2).padStart(5, "0");

export function formatRa(deg) {
  const [h, m, s] = split((deg / 15) * 3600);
  return `${two(h)}h ${two(m)}m ${sec(s)}s`;
}

export function formatDec(deg) {
  const [d, m, s] = split(Math.abs(deg) * 3600);
  return `${deg < 0 ? "-" : "+"}${two(d)}° ${two(m)}′ ${sec(s)}″`;
}
