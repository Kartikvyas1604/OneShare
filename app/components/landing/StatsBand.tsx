const stats = [
  { value: "$10", label: "Minimum position" },
  { value: "60s", label: "From stablecoin to stock" },
  { value: "0", label: "Keys held by the team" },
  { value: "25bps", label: "1Click unkeyed fee" },
];

export function StatsBand() {
  return (
    <section className="border-b border-border">
      <dl className="mx-auto grid max-w-[1100px] grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        {stats.map((s) => (
          <div key={s.label} className="px-6 py-10 text-center">
            <dd className="num text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {s.value}
            </dd>
            <dt className="mt-1.5 text-xs text-muted-foreground">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
