const facts = [
  { label: "Reserve", value: "escrowed in a separate contract" },
  { label: "De-risk", value: "−50% from cost, single-shot" },
  { label: "Backtest", value: "10,000 paths · seed 20261112" },
  { label: "Funding", value: "30+ chains via NEAR Intents" },
  { label: "Fees", value: "0% for the hackathon" },
  { label: "Worst case", value: "in dollars, before you deposit" },
  { label: "Leverage", value: "zero · no liquidation" },
];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {[...facts, ...facts].map((f, i) => (
        <div key={i} className="flex items-center gap-2.5 whitespace-nowrap px-5">
          <span className="eyebrow">{f.label}</span>
          <span className="num text-xs text-foreground">{f.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TickerStrip() {
  return (
    <section className="border-b border-border bg-card" aria-label="Mechanism facts (demo data)">
      <div className="relative flex overflow-hidden py-2.5 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <div className="animate-marquee flex">
          <Row />
          <Row />
        </div>
      </div>
    </section>
  );
}
