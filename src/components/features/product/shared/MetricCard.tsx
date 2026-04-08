export function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-3xl p-4" style={{ background: "var(--stitch-color-surface-container)", border: "0" }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>
          {icon}
        </span>
        <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          {label}
        </p>
      </div>
      <p className="text-2xl font-black" style={{ color: "var(--stitch-color-primary)" }}>
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

