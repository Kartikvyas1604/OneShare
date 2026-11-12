const stocks = [
  { symbol: "NVDAx", price: "$13.42", change: "+2.34%", up: true },
  { symbol: "AAPLx", price: "$189.11", change: "+0.87%", up: true },
  { symbol: "TSLAx", price: "$242.65", change: "−1.12%", up: false },
  { symbol: "MSFTx", price: "$415.28", change: "+0.44%", up: true },
  { symbol: "AMZNx", price: "$178.42", change: "+1.02%", up: true },
  { symbol: "GOOGLx", price: "$164.19", change: "−0.31%", up: false },
  { symbol: "MSTRx", price: "$131.77", change: "+3.10%", up: true },
  { symbol: "SPYx", price: "$578.90", change: "+0.22%", up: true },
];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {[...stocks, ...stocks].map((s, i) => (
        <div key={i} className="flex items-center gap-2.5 whitespace-nowrap px-5">
          <span className="num text-xs font-semibold text-foreground">{s.symbol}</span>
          <span className="num text-xs text-muted-foreground">{s.price}</span>
          <span className={`num text-xs font-medium ${s.up ? "text-up" : "text-down"}`}>
            {s.change}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TickerStrip() {
  return (
    <section className="border-b border-border bg-card" aria-label="Tokenized stock prices (demo data)">
      <div className="relative flex overflow-hidden py-2.5 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <div className="animate-marquee flex">
          <Row />
          <Row />
        </div>
      </div>
    </section>
  );
}
