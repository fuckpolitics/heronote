interface Props {
  title?: string;
  right?: React.ReactNode;
  accent?: string;
  className?: string;
  children: React.ReactNode;
}

export function SystemPanel({ title, right, accent = "#22d3ee", className = "", children }: Props) {
  return (
    <section className={`sys-panel p-4 sm:p-5 ${className}`}>
      {title && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rotate-45" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-ink-100">{title}</h3>
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatBar({ pct, hex, height = 8 }: { pct: number; hex: string; height?: number }) {
  return (
    <div className="overflow-hidden rounded-full bg-white/8" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${hex}, #ffffff66)`, boxShadow: `0 0 12px ${hex}` }}
      />
    </div>
  );
}
