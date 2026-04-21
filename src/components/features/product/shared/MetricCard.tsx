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
    <div
      className="rounded-2xl border p-3 sm:rounded-3xl sm:p-4"
      style={{
        background: "var(--stitch-color-surface-container-high)",
        borderColor:
          "color-mix(in srgb, var(--stitch-color-secondary) 34%, var(--stitch-color-outline))",
        boxShadow:
          "inset 0 0 0 1px color-mix(in srgb, var(--stitch-color-primary-container) 35%, transparent)",
      }}
    >
      <div className="mb-1 flex items-center gap-2 sm:mb-2">
        <span
          className="material-symbols-outlined text-[18px] sm:text-[24px]"
          style={{ color: "var(--stitch-color-secondary)" }}
          aria-hidden
        >
          {icon}
        </span>
        <p
          className="text-[10px] font-black uppercase tracking-wide sm:text-sm sm:font-bold"
          style={{ color: "var(--stitch-color-on-surface-variant)" }}
        >
          {label}
        </p>
      </div>
      <p className="text-base font-black sm:text-2xl" style={{ color: "var(--stitch-color-primary)" }}>
        {value}
      </p>
      {sub ? (
        <p className="mt-1 hidden text-sm font-bold sm:block" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

