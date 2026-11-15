import { useState } from "react";
import SearchBar from "./components/SearchBar";
import QuickFacts from "./components/QuickFacts";
import Explorer from "./components/Explorer";
import { parseQuery } from "./lib/skyQuery";

const PROJECT = {
  name: "I.R.I.S",
  headline: "Watch the sky change between visits.",
  lede: "Enter a patch of sky and flip through SPHEREx images of it, taken on different dates, to spot anything that moves.",
};

// Repeated class strings live here so a style change happens in one place.
const WRAP = "mx-auto max-w-[68rem] px-6";
const BAND = "border-t border-rule py-16";
const H2 = "mb-6 font-serif text-3xl font-medium";

export default function App() {
  // Starts from the URL, so a link like /?ra=133.795&dec=-7.245&fov=5 opens that view.
  const [query, setQuery] = useState(() => parseQuery(window.location.search));

  return (
    <>
      <div className={WRAP}>
        <header className="flex items-center justify-between py-5">
          <a className="font-serif text-[1.35rem] font-semibold" href="#top">
            {PROJECT.name}
          </a>
          <nav className="flex gap-6" aria-label="Main">
            <a className="text-muted hover:text-ink" href="#facts">
              Quick facts
            </a>
            <a className="text-muted hover:text-ink" href="#explorer">
              Explorer
            </a>
          </nav>
        </header>
        <main id="top">
          <section className="pt-12 pb-12 md:pb-20">
            <h1 className="mb-5 max-w-160 font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-medium tracking-[-0.02em]">
              {PROJECT.headline}
            </h1>
            <p className="mb-8 max-w-xl text-xl text-muted">{PROJECT.lede}</p>
            <SearchBar initial={query} onSearch={setQuery} />
          </section>
        </main>
      </div>

      <section className={BAND} id="facts">
        <div className={WRAP}>
          <h2 className={H2}>Quick facts</h2>
          <QuickFacts query={query} />
        </div>
      </section>

      <section className={BAND} id="explorer">
        <div className={WRAP}>
          <h2 className={H2}>Explorer</h2>
          <Explorer query={query} />
        </div>
      </section>

      <footer className="border-t border-rule pt-8 pb-12 text-[0.95rem] text-muted">
        <div className={WRAP}>
          <p className="max-w-176">
            Moving objects shown here are candidates for further checking, not
            confirmed discoveries. SPHEREx data: NASA/JPL-Caltech/IPAC. Built
            for the NASA Space Apps Challenge.
          </p>
        </div>
      </footer>
    </>
  );
}
