const stocks = [
  { symbol: "NVDAx", name: "NVIDIA", price: "$13.42", change: "+2.34%", up: true },
  { symbol: "AAPLx", name: "Apple", price: "$189.11", change: "+0.87%", up: true },
  { symbol: "TSLAx", name: "Tesla", price: "$242.65", change: "-1.12%", up: false },
  { symbol: "MSFTx", name: "Microsoft", price: "$415.28", change: "+0.44%", up: true },
  { symbol: "AMZNx", name: "Amazon", price: "$178.42", change: "+1.02%", up: true },
  { symbol: "GOOGLx", name: "Alphabet", price: "$164.19", change: "-0.31%", up: false },
  { symbol: "MSTRx", name: "MicroStrategy", price: "$131.77", change: "+3.10%", up: true },
  { symbol: "SPYx", name: "S&P 500", price: "$578.90", change: "+0.22%", up: true },
];

export function TickerStrip() {
  return (
    <section className="relative border-y border-white/[0.06] bg-[#070b14]/60 py-4">
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-ticker flex shrink-0 items-center gap-8 pr-8" aria-hidden>
          {[...stocks, ...stocks].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="font-mono text-xs font-semibold text-foreground">{s.symbol}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.price}</span>
              <span
                className={`font-mono text-xs font-semibold ${s.up ? "text-success" : "text-destructive"}`}
              >
                {s.change}
              </span>
            </div>
          ))}
        </div>
        <div className="animate-ticker flex shrink-0 items-center gap-8 pr-8" aria-hidden>
          {[...stocks, ...stocks].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="font-mono text-xs font-semibold text-foreground">{s.symbol}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.price}</span>
              <span
                className={`font-mono text-xs font-semibold ${s.up ? "text-success" : "text-destructive"}`}
              >
                {s.change}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">
        Tokenized stock tickers: NVDAx $13.42 +2.34%, AAPLx $189.11 +0.87%, TSLAx $242.65 −1.12%.
      </p>
    </section>
  );
}
