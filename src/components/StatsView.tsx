import { Lock, Sparkles } from "lucide-react";
import type { CategoryKey } from "../types";
import { ACHIEVEMENTS, CATEGORIES, RARITY, levelProgress } from "../lib/rpg";
import { SystemPanel, StatBar } from "./SystemPanel";

interface Props {
  categoryXp: Record<CategoryKey, number>;
  claimed: string[];
  onClaim: (achId: string) => void;
}

export function StatsView({ categoryXp, claimed, onClaim }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-wider text-ink-100 glow-text">Характеристики</h2>
        <p className="text-sm text-ink-400">Прокачивай категории — открывай достижения и снаряжение</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CATEGORIES.map((c) => {
          const xp = categoryXp[c.key] ?? 0;
          const prog = levelProgress(xp);
          const achs = ACHIEVEMENTS.filter((a) => a.category === c.key);
          return (
            <SystemPanel key={c.key} title={c.name} accent={c.hex}>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-3xl"
                  style={{ background: `${c.hex}1f`, boxShadow: `inset 0 0 0 1px ${c.hex}55, 0 0 20px -6px ${c.hex}` }}
                >
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-lg font-bold" style={{ color: c.hex }}>
                      {c.stat}
                    </span>
                    <span className="font-display text-2xl font-black tabular-nums text-ink-100">
                      {prog.level}
                      <span className="ml-1 text-xs font-normal text-ink-500">ур.</span>
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <StatBar pct={prog.pct} hex={c.hex} />
                  </div>
                  <div className="mt-1 text-right text-[11px] tabular-nums text-ink-500">
                    {prog.inLevel}/{prog.span} XP
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {achs.map((a) => {
                  const reached = prog.level >= a.level;
                  const isClaimed = claimed.includes(a.id);
                  const r = RARITY[a.reward.rarity];
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                        reached ? "border-white/12 bg-white/4" : "border-white/6 bg-white/2 opacity-55"
                      }`}
                    >
                      <span className="text-xl">{reached ? a.reward.icon : "🔒"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-ink-100">
                          {a.title}
                          <span className="rounded px-1.5 text-[10px] font-bold uppercase" style={{ background: `${r.hex}22`, color: r.hex }}>
                            {r.name}
                          </span>
                        </div>
                        <div className="text-xs text-ink-500">
                          {a.desc} · награда: {a.reward.name}
                        </div>
                      </div>
                      {reached ? (
                        isClaimed ? (
                          <span className="shrink-0 text-xs font-semibold text-emerald-300">получено</span>
                        ) : (
                          <button
                            onClick={() => onClaim(a.id)}
                            className="btn-sys flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs"
                          >
                            <Sparkles size={13} /> Забрать
                          </button>
                        )
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-xs text-ink-600">
                          <Lock size={12} /> {a.level} ур.
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </SystemPanel>
          );
        })}
      </div>
    </div>
  );
}
