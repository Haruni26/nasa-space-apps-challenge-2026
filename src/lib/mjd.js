// File names look like 60789_855521771_epsilon_indi_2_lin.png:
// the modified Julian date (the underscore is the decimal point), a tag, then the scale.
const NAME = /^(\d+)_(\d+)_(.+)_(lin|stretch)\.png$/i;

export function parseFrameName(fileName) {
  const match = NAME.exec(fileName);
  if (!match) return null;
  // Build "60791.2150889" and convert it to a number, so frames sort by time, not by text.
  return {
    mjd: Number(`${match[1]}.${match[2]}`),
    tag: match[3],
    scale: match[4].toLowerCase(),
  };
}

const MJD_ZERO_MS = Date.UTC(1858, 10, 17); // MJD 0 is 1858-11-17 00:00 UTC
const MS_PER_DAY = 86400000;

// 60789.8555 -> "2025-04-24 20:31 UTC"
export function formatMjd(mjd) {
  const iso = new Date(MJD_ZERO_MS + mjd * MS_PER_DAY).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}
