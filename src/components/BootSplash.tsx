export function BootSplash() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center">
      <div className="app-bg" />
      <div className="relative flex flex-col items-center">
        <div className="relative mb-6 h-24 w-24">
          <div className="absolute inset-0 rounded-2xl border-2 border-sys-cyan/40 animate-spin-slow" style={{ clipPath: "polygon(0 0, 70% 0, 100% 30%, 100% 100%, 30% 100%, 0 70%)" }} />
          <div className="absolute inset-2 flex items-center justify-center rounded-xl bg-gradient-to-br from-sys-blue to-sys-purple text-3xl shadow-[0_0_30px_rgba(47,107,255,0.7)]">
            ⚔️
          </div>
        </div>
        <h1 className="font-display text-2xl font-black uppercase tracking-[0.35em] text-ink-100 glow-text">
          Heronote
        </h1>
        <p className="mt-2 font-ui text-sm uppercase tracking-[0.25em] text-sys-cyan animate-pulse-glow">
          Пробуждение…
        </p>
        <div className="mt-5 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-[scan_1.2s_linear_infinite] bg-gradient-to-r from-transparent via-sys-cyan to-transparent" />
        </div>
      </div>
    </div>
  );
}
