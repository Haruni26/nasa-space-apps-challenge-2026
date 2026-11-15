import { useEffect, useRef, useState } from "react";
import { COLORMAPS, getLut, gradientOf } from "../lib/colormaps";
import { loadSeries } from "../lib/frameSeries";
import { OBJECTS, SCALES } from "../lib/object";

const CONTROL = "mb-7 grid min-w-0 gap-2";
const LABEL = "font-semibold";
const FIELD = "rounded border border-rule bg-panel px-3 py-2.5 text-ink";
const RANGE = "w-full accent-ink disabled:opacity-40";
const BTN =
  "cursor-pointer rounded border border-ink px-3.5 py-1.5 text-ink hover:bg-ink/10 disabled:cursor-default disabled:opacity-40";
const NAV_BTN =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink px-5 py-2.5 text-ink hover:bg-ink/10 disabled:cursor-default disabled:opacity-40";

function Chevron({ left }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d={left ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export default function Explorer() {
  const canvasRef = useRef(null);
  const [objectId, setObjectId] = useState("");
  const [scale, setScale] = useState("");
  const [colormap, setColormap] = useState("grayscale");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState({ key: null, frames: [], error: "" });

  const object = OBJECTS.find((o) => o.id === objectId);
  const scaleInfo = SCALES.find((s) => s.id === scale);
  const key = objectId && scale ? `${objectId}/${scale}` : null;

  // Load every frame for the chosen object and scale, once, so stepping is instant.
  useEffect(() => {
    if (!key) return;
    let ignore = false;
    loadSeries(objectId, scale)
      .then((frames) => {
        if (!ignore) setLoaded({ key, frames, error: "" });
      })
      .catch((err) => {
        if (!ignore) setLoaded({ key, frames: [], error: err.message });
      });
    return () => {
      ignore = true;
    };
  }, [key, objectId, scale]);

  const settled = key !== null && loaded.key === key;
  const frames = settled ? loaded.frames : [];
  const count = frames.length;
  const index = Math.min(frame, Math.max(count - 1, 0));
  const current = frames[index] ?? null;

  useEffect(() => {
    if (!playing || count < 2) return;
    const id = window.setInterval(
      () => setFrame((f) => (Math.min(f, count - 1) + 1) % count),
      700,
    );
    return () => window.clearInterval(id);
  }, [playing, count]);

  // Redraw whenever the frame or color map changes. Empty pixels stay transparent (black behind).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !current) return;
    const { width, height, values, mask } = current.image;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const out = ctx.createImageData(width, height);
    const lut = getLut(colormap);
    values.forEach((v, i) => {
      const [r, g, b] = lut[v];
      const o = i * 4;
      out.data[o] = r;
      out.data[o + 1] = g;
      out.data[o + 2] = b;
      out.data[o + 3] = mask[i] ? 255 : 0;
    });
    ctx.putImageData(out, 0, 0);
  }, [current, colormap]);

  const chooseObject = (e) => {
    setObjectId(e.target.value);
    setFrame(0);
    setPlaying(false);
  };

  const step = (delta) => {
    setPlaying(false);
    setFrame((index + delta + count) % count);
  };

  let message = "Choose an object to begin.";
  if (objectId) message = "Now choose a scale to load the images.";
  if (key) message = "Loading images…";
  if (settled && count === 0) {
    message = loaded.error;
  }

  return (
    <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <figure>
        {current ? (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="block w-full rounded-2xl border border-rule bg-black [image-rendering:pixelated]"
              role="img"
              aria-label={`${object.name}, visit ${index + 1} of ${count}`}
            />
            <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              SPHEREx data: NASA/JPL-Caltech/IPAC
            </span>
          </div>
        ) : (
          <div className="grid aspect-square place-items-center rounded-2xl border border-rule bg-panel p-6 text-center text-muted">
            {message}
          </div>
        )}
        <figcaption className="mt-3 text-sm text-muted">
          {current ? (
            <>
              <strong className="text-ink">
                {object.name}, {scaleInfo.label}
              </strong>
              <br />
              MJD {current.mjd.toFixed(4)} ({current.label})
              {!current.image.hasData && (
                <>
                  <br />
                  <span className="text-signal">
                    This image has no data: every pixel is transparent.
                  </span>
                </>
              )}
            </>
          ) : (
            "The time series appears here, in order of observation time."
          )}
        </figcaption>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            className={NAV_BTN}
            disabled={count < 2}
            onClick={() => step(-1)}
          >
            <Chevron left /> Previous
          </button>
          <span className="text-lg font-semibold">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            className={NAV_BTN}
            disabled={count < 2}
            onClick={() => step(1)}
          >
            Next <Chevron />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className={BTN}
            disabled={count < 2}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            className={RANGE}
            aria-label="Step through visits"
            min="0"
            max={Math.max(count - 1, 0)}
            value={index}
            disabled={count < 2}
            onChange={(e) => {
              setPlaying(false);
              setFrame(Number(e.target.value));
            }}
          />
        </div>
      </figure>

      <div>
        <div className={CONTROL}>
          <label className={LABEL} htmlFor="object">
            Object
          </label>
          <select
            id="object"
            className={FIELD}
            value={objectId}
            onChange={chooseObject}
          >
            <option value="">Select an object</option>
            {OBJECTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset
          className={`${CONTROL} disabled:opacity-40`}
          disabled={!objectId}
        >
          <legend className={`${LABEL} mb-2`}>Scale</legend>
          {SCALES.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name="scale"
                className="accent-ink"
                value={s.id}
                checked={scale === s.id}
                onChange={() => setScale(s.id)}
              />
              {s.label}
            </label>
          ))}
        </fieldset>

        <fieldset className={CONTROL}>
          <legend className={`${LABEL} mb-2`}>Color map</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2">
            {Object.entries(COLORMAPS).map(([id, { label }]) => (
              <button
                key={id}
                type="button"
                className="grid cursor-pointer gap-1.5 rounded border border-rule bg-panel p-1.5 text-left text-sm text-ink aria-pressed:border-ink aria-pressed:outline-2 aria-pressed:outline-ink"
                aria-pressed={colormap === id}
                onClick={() => setColormap(id)}
              >
                <span
                  className="block h-2.5 rounded-sm"
                  style={{ backgroundImage: gradientOf(id) }}
                />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
