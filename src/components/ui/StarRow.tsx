export function StarRow({
  filled,
  reviews,
  className,
}: {
  filled: number;
  reviews: string;
  className?: string;
}) {
  return (
    <div className={className ?? "mb-2 flex flex-wrap items-center gap-1"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined text-sm"
          style={{
            fontVariationSettings: `'FILL' ${i <= filled ? 1 : 0}`,
            color:
              i <= filled
                ? "var(--stitch-color-tertiary, var(--stitch-color-secondary))"
                : "var(--stitch-color-on-surface-variant)",
          }}
        >
          star
        </span>
      ))}
      <span className="text-[10px]" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
        {reviews}
      </span>
    </div>
  );
}

