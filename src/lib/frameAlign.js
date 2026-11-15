// Pure helpers (no browser APIs) for lining PNG frames up on one canvas.
// An image here is { width, height, values, mask }: values are 0-255 brightness,
// and mask[i] is 1 for real data and 0 for empty pixels.

// Works out which pixels hold data. A PNG alpha channel is used if there is one.
// Otherwise a mostly-white border (what NaN pixels often become in a grayscale PNG)
// marks the empty area, and white connected to the border is treated as empty.
export function buildMask(rgba, width, height) {
  const n = width * height;
  const mask = new Uint8Array(n).fill(1);

  let hasAlpha = false;
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3];
    if (a < 255) {
      hasAlpha = true;
      mask[i] = a > 0 ? 1 : 0;
    }
  }
  if (hasAlpha) return mask;

  const isWhite = (i) => rgba[i * 4] >= 250;
  const edge = [];
  for (let x = 0; x < width; x++) edge.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) edge.push(y * width, y * width + width - 1);
  const stack = edge.filter(isWhite);
  // A noisy frame with real data at its edge is left alone: only act if the border is mostly white.
  if (stack.length < edge.length / 2) return mask;

  stack.forEach((i) => {
    mask[i] = 0;
  });
  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    const y = (i - x) / width;
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = ny * width + nx;
      if (mask[j] && isWhite(j)) {
        mask[j] = 0;
        stack.push(j);
      }
    }
  }
  return mask;
}

// Puts every frame on one shared canvas (centered, since cutouts are centered on the target),
// then crops to the area where any frame has data, so the image fills the viewer.
export function alignFrames(images) {
  const W = Math.max(...images.map((im) => im.width));
  const H = Math.max(...images.map((im) => im.height));

  const padded = images.map((im) => {
    const values = new Uint8ClampedArray(W * H);
    const mask = new Uint8Array(W * H);
    const ox = Math.floor((W - im.width) / 2);
    const oy = Math.floor((H - im.height) / 2);
    for (let y = 0; y < im.height; y++) {
      for (let x = 0; x < im.width; x++) {
        const from = y * im.width + x;
        const to = (y + oy) * W + (x + ox);
        values[to] = im.values[from];
        mask[to] = im.mask[from];
      }
    }
    return { values, mask };
  });

  let x0 = W,
    x1 = -1,
    y0 = H,
    y1 = -1;
  for (const { mask } of padded) {
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const x = i % W;
      const y = (i - x) / W;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return padded.map((p) => ({ width: W, height: H, ...p }));

  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  return padded.map(({ values, mask }) => {
    const v = new Uint8ClampedArray(w * h);
    const m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        v[y * w + x] = values[(y + y0) * W + (x + x0)];
        m[y * w + x] = mask[(y + y0) * W + (x + x0)];
      }
    }
    return { width: w, height: h, values: v, mask: m };
  });
}
