// Fake sky frames so the explorer works before the backend exists.
// TODO: replace renderFrame with real image data from your API (e.g. /api/frames?ra&dec&fov).
export const SIZE = 128;
export const FRAMES = 6;

// Small seeded random generator: same seed, same sky.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeStars(seed, count = 40) {
  const rand = rng(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * SIZE,
    y: rand() * SIZE,
    amp: 0.15 + rand() * 0.6,
    sigma: 1 + rand() * 1.5,
  }));
}

// Returns brightness values from 0 to 1. One extra source drifts a little each frame.
export function renderFrame(stars, frame, noise, noiseSeed) {
  const rand = rng(noiseSeed);
  const mover = { x: 20 + frame * 10, y: 70 - frame * 3, amp: 0.7, sigma: 1.8 };
  const sources = [...stars, mover];
  const data = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let v = 0.05;
      for (const s of sources) {
        const d2 = (x - s.x) ** 2 + (y - s.y) ** 2;
        if (d2 < 100) v += s.amp * Math.exp(-d2 / (2 * s.sigma * s.sigma));
      }
      v += (rand() - 0.5) * noise;
      data[y * SIZE + x] = Math.min(1, Math.max(0, v));
    }
  }
  return data;
}
