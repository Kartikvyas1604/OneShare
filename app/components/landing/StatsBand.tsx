const stats = [
  { value: "$10", label: "Minimum position" },
  { value: "60s", label: "From fiat-stable to stock" },
  { value: "0", label: "Keys held by the team" },
  { value: "25bps", label: "1Click unkeyed fee" },
];

export function StatsBand() {
  return (
    <section className="relative border-y border-white/[0.06] bg-[#070b14]/60">
      <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-white/[0.06] md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="px-6 py-10 text-center">
            <p className="font-mono text-3xl font-semibold tabular-nums text-foreground md:text-4xl">
              {s.value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
