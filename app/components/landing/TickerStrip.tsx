import { Marquee } from "@/app/components/Marquee";

const facts = [
  { label: "Reserve", value: "escrowed in a separate contract" },
  { label: "De-risk", value: "−50% from cost, single-shot" },
  { label: "Funding", value: "30+ chains via NEAR Intents" },
  { label: "Fees", value: "0% at launch" },
  { label: "Worst case", value: "in dollars, before you deposit" },
  { label: "Leverage", value: "zero · no liquidation" },
  { label: "Early exit", value: "1% fee, set by the contract" },
];

function Row() {
  return (
    <>
      {facts.map((f) => (
        <span key={f.label} className="flex items-center gap-8 whitespace-nowrap">
          <span className="eyebrow">{f.label}</span>
          <span className="num text-xs text-foreground">{f.value}</span>
          <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
        </span>
      ))}
    </>
  );
}

export function TickerStrip() {
  return (
    <section
      className="border-b border-border bg-card py-2.5"
      aria-label="Mechanism facts"
    >
      <div className="[mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <Marquee duration={30} gap="2rem">
          <Row />
        </Marquee>
      </div>
    </section>
  );
}
