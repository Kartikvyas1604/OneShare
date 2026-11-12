import { CountUp } from "@/app/components/motion/CountUp";

const stats = [
  { value: 10, format: (v: number) => `$${v}`, label: "Minimum deposit" },
  { value: 30, format: (v: number) => `${v}+`, label: "Funding chains via 1Click" },
  { value: 10, format: (v: number) => `${v}k`, label: "Backtest paths · seed 20261112" },
  { value: 0, format: (v: number) => `${v}%`, label: "Fees for the hackathon" },
];

export function StatsBand() {
  return (
    <section className="border-b border-border">
      <dl className="mx-auto grid max-w-[1100px] grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        {stats.map((s) => (
          <div key={s.label} className="px-6 py-10 text-center">
            <dd className="display text-4xl text-foreground md:text-5xl">
              <CountUp value={s.value} format={s.format} />
            </dd>
            <dt className="mt-1.5 text-xs text-muted-foreground">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
