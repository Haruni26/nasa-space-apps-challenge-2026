import { useEffect, useMemo, useRef, useState } from "react";
import { COLORMAPS, getLut, gradientOf } from "../lib/colormaps";
import { FRAMES, SIZE, makeStars, renderFrame } from "../lib/placeholderSky";

const BANDS = 102;

// Combining more light lowers noise, which is why "All bands" looks cleanest.
const MODES = [
  { value: "all", label: "All bands combined", noise: 0.04 },
  ...Array.from({ length: 6 }, (_, i) => ({
    value: `array-${i + 1}`,
    label: `Detector array ${i + 1}`,
    noise: 0.1,
  })),
  { value: "band", label: "Single band", noise: 0.22 },
];

const CONTROL = "mb-7 grid min-w-0 gap-2";
const LABEL = "font-semibold";
const FIELD = "rounded border border-rule bg-panel px-3 py-2.5 text-ink";
const RANGE = "w-full accent-ink disabled:opacity-40";
const STEP_BTN =
  "cursor-pointer rounded border border-ink px-3.5 py-1.5 text-ink hover:bg-ink/10";

export default function Explorer({ query }) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [colormap, setColormap] = useState("viridis");
  const [modeIndex, setModeIndex] = useState(0);
  const [band, setBand] = useState(51);

  const mode = MODES[modeIndex];
  const seed = query
    ? Math.round(query.ra * 100 + (query.dec + 90) * 1000)
    : 42;
  const stars = useMemo(() => makeStars(seed), [seed]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % FRAMES), 700);
    return () => window.clearInterval(id);
  }, [playing]);

  // Redraw whenever the frame, color map, or spectrum choice changes.
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    const image = ctx.createImageData(SIZE, SIZE);
    const lut = getLut(colormap);
    const noiseSeed =
      seed + frame * 131 + modeIndex * 17 + (mode.value === "band" ? band : 0);
    const data = renderFrame(stars, frame, mode.noise, noiseSeed);
    data.forEach((v, i) => {
      const [r, g, b] = lut[Math.round(v * 255)];
      const o = i * 4;
      image.data[o] = r;
      image.data[o + 1] = g;
      image.data[o + 2] = b;
      image.data[o + 3] = 255;
    });
    ctx.putImageData(image, 0, 0);
  }, [stars, seed, frame, colormap, mode, modeIndex, band]);

  const step = (delta) => {
    setPlaying(false);
    setFrame((f) => (f + delta + FRAMES) % FRAMES);
  };

  return (
    <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <figure>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="block aspect-square w-full border border-rule bg-black [image-rendering:pixelated]"
          role="img"
          aria-label={`Placeholder sky image, visit ${frame + 1} of ${FRAMES}`}
        />
        <figcaption className="mt-3 text-sm text-muted">
          <strong className="text-ink">
            Visit {frame + 1} of {FRAMES}
          </strong>
          <br />
          {mode.label}
          {mode.value === "band" ? `, band ${band} of ${BANDS}` : ""}
          <br />
          {query
            ? `Placeholder image for RA ${query.ra}°, Dec ${query.dec}°, ${query.fov}′ field. Real SPHEREx images will replace it.`
            : "Placeholder image. Search for a patch of sky to set the position."}
        </figcaption>
      </figure>

      <div>
        <fieldset className={CONTROL}>
          <legend className={`${LABEL} mb-2`}>Color map</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2">
            {Object.entries(COLORMAPS).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                className="grid cursor-pointer gap-1.5 rounded border border-rule bg-panel p-1.5 text-left text-sm text-ink aria-pressed:border-ink aria-pressed:outline-2 aria-pressed:outline-ink"
                aria-pressed={colormap === key}
                onClick={() => setColormap(key)}
              >
                <span
                  className="block h-2.5 rounded-sm"
                  style={{ backgroundImage: gradientOf(key) }}
                />
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className={CONTROL}>
          <label className={LABEL} htmlFor="mode">
            Spectrum selection
          </label>
          <select
            id="mode"
            className={FIELD}
            value={modeIndex}
            onChange={(e) => setModeIndex(Number(e.target.value))}
          >
            {MODES.map((m, i) => (
              <option key={m.value} value={i}>
                {m.label}
              </option>
            ))}
          </select>
          <label className={LABEL} htmlFor="band">
            Band {band} of {BANDS}
          </label>
          <input
            id="band"
            type="range"
            className={RANGE}
            min="1"
            max={BANDS}
            value={band}
            disabled={mode.value !== "band"}
            onChange={(e) => setBand(Number(e.target.value))}
          />
          <p className="text-muted">
            Combining bands adds their light together, which lowers noise.
          </p>
        </div>

        <div className={CONTROL}>
          <label className={LABEL} htmlFor="frame">
            Step through visits
          </label>
          <input
            id="frame"
            type="range"
            className={RANGE}
            min="0"
            max={FRAMES - 1}
            value={frame}
            onChange={(e) => {
              setPlaying(false);
              setFrame(Number(e.target.value));
            }}
          />
          <div className="flex gap-2">
            <button type="button" className={STEP_BTN} onClick={() => step(-1)}>
              Previous
            </button>
            <button
              type="button"
              className={STEP_BTN}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" className={STEP_BTN} onClick={() => step(1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
