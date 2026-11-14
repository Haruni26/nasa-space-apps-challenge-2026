import { formatDec, formatRa } from "../lib/skyQuery";

const MISSION = [
  ["Mission", "NASA SPHEREx"],
  ["Sky coverage", "Whole sky every six months"],
  ["Spectral bands", "102, in near-infrared light"],
  ["Detector arrays", "6"],
  ["Returning data since", "May 2025"],
];

const H3 = "mt-7 mb-3 font-serif text-lg font-semibold first:mt-0";

function Facts({ items }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-x-8 gap-y-5">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="font-serif text-[1.3rem]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function QuickFacts({ query }) {
  const patch = query
    ? [
        ["Right ascension", `${query.ra}° (${formatRa(query.ra)})`],
        ["Declination", `${query.dec}° (${formatDec(query.dec)})`],
        ["Field of view", `${query.fov} arcminutes`],
        ["Images found", "6 (placeholder)"],
      ]
    : null;

  return (
    <>
      <h3 className={H3}>This patch of sky</h3>
      {patch ? (
        <Facts items={patch} />
      ) : (
        <p className="text-muted">
          Search for coordinates to see facts about that patch.
        </p>
      )}
      <h3 className={H3}>About SPHEREx</h3>
      <Facts items={MISSION} />
    </>
  );
}
