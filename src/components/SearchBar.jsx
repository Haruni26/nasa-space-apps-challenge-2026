import { useState } from "react";
import {
  DEFAULT_FOV,
  FOV_OPTIONS,
  findPreset,
  isValid,
  parseCoords,
  toSearch,
} from "../lib/skyQuery";

const FIELD = "rounded border border-rule bg-panel px-3 py-2.5 text-ink";

export default function SearchBar({ initial, onSearch }) {
  const [text, setText] = useState(
    initial ? `${initial.ra}, ${initial.dec}` : "",
  );
  const [fov, setFov] = useState(initial?.fov ?? DEFAULT_FOV);
  const [error, setError] = useState("");

  const options = FOV_OPTIONS.includes(fov)
    ? FOV_OPTIONS
    : [...FOV_OPTIONS, fov].sort((a, b) => a - b);

  const submit = (e) => {
    e.preventDefault();
    const coords = parseCoords(text) ?? findPreset(text);
    if (!coords) {
      setError(
        "Enter RA and Dec in degrees, like 133.795, -7.245, or pick a preset. Name search isn't connected yet.",
      );
      return;
    }
    const q = { ...coords, fov };
    if (!isValid(q)) {
      setError("RA must be from 0 to 360 and Dec from -90 to 90.");
      return;
    }
    setError("");
    window.history.pushState(null, "", toSearch(q));
    onSearch(q);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex max-w-3xl flex-wrap gap-2">
        <label className="sr-only" htmlFor="q">
          Coordinates in degrees
        </label>
        <input
          id="q"
          type="search"
          className={`${FIELD} min-w-0 flex-1 basis-72`}
          placeholder="RA, Dec in degrees (for example 133.795, -7.245)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="sr-only" htmlFor="fov">
          Field of view
        </label>
        <select
          id="fov"
          className={FIELD}
          value={fov}
          onChange={(e) => setFov(Number(e.target.value))}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}′ field
            </option>
          ))}
        </select>
        <button
          className="cursor-pointer rounded bg-ink px-5 py-2.5 font-semibold text-plate hover:bg-ink/90"
          type="submit"
        >
          Search
        </button>
      </div>

      {error && (
        <p className="mt-3 text-signal" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
