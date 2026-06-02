import { useMemo } from "react";
import { Brain, Moon, Sparkles, TrendingUp } from "lucide-react";
import type { DayEntry, MonthData, TagKey } from "../types";
import { KEY_SCORE, KEY_SLEEP, KEY_TAGS } from "../data/factory";
import { avg, sleepHoursFromValue } from "../lib/format";
import { TAGS, asTags } from "../lib/tags";
import { SystemPanel } from "./SystemPanel";
import { ScoreDistribution, TagFrequency } from "./Charts";

interface Props {
  months: MonthData[];
}

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

/** Коэффициент корреляции Пирсона. */
function pearson(pairs: [number, number][]): number | null {
  const n = pairs.length;
  if (n < 4) return null;
  const sx = pairs.reduce((a, [x]) => a + x, 0);
  const sy = pairs.reduce((a, [, y]) => a + y, 0);
  const mx = sx / n;
  const my = sy / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (const [x, y] of pairs) {
    cov += (x - mx) * (y - my);
    vx += (x - mx) ** 2;
    vy += (y - my) ** 2;
  }
  if (vx === 0 || vy === 0) return null;
  return cov / Math.sqrt(vx * vy);
}

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export function AnalysisView({ months }: Props) {
  const allDays: DayEntry[] = useMemo(() => months.flatMap((m) => m.days), [months]);
  const filled = useMemo(
    () => allDays.filter((d) => d.values && Object.keys(d.values).length > 0),
    [allDays],
  );

  const scores = filled.map((d) => num(d.values[KEY_SCORE])).filter((v): v is number => v != null);
  const sleeps = filled
    .map((d) => sleepHoursFromValue(d.values[KEY_SLEEP]))
    .filter((v): v is number => v != null);

  const avgScore = avg(scores);
  const avgSleep = avg(sleeps);

  // Корреляция сон ↔ оценка дня
  const sleepScorePairs = useMemo(() => {
    const pairs: [number, number][] = [];
    for (const d of filled) {
      const s = num(d.values[KEY_SCORE]);
      const h = sleepHoursFromValue(d.values[KEY_SLEEP]);
      if (s != null && h != null) pairs.push([h, s]);
    }
    return pairs;
  }, [filled]);
  const corr = pearson(sleepScorePairs);

  // Лучший день недели по средней оценке
  const weekdayStats = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    for (const d of filled) {
      const s = num(d.values[KEY_SCORE]);
      if (s == null) continue;
      (buckets[d.weekday] ??= []).push(s);
    }
    return WEEKDAYS.map((wd) => ({ wd, mean: avg(buckets[wd] ?? []) })).filter((x) => x.mean != null) as {
      wd: string;
      mean: number;
    }[];
  }, [filled]);
  const bestWeekday = [...weekdayStats].sort((a, b) => b.mean - a.mean)[0];

  // Влияние тегов: средняя оценка в дни с тегом против дней без него
  const tagImpact = useMemo(() => {
    return TAGS.map((t) => {
      const withTag: number[] = [];
      const without: number[] = [];
      for (const d of filled) {
        const s = num(d.values[KEY_SCORE]);
        if (s == null) continue;
        const lvl = asTags(d.values[KEY_TAGS])[t.key as TagKey];
        (lvl > 0 ? withTag : without).push(s);
      }
      const a = avg(withTag);
      const b = avg(without);
      if (a == null || b == null || withTag.length < 3) return null;
      return { key: t.key, name: t.label, hex: t.hex, delta: +(a - b).toFixed(2), withCount: withTag.length };
    })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [filled]);

  const corrText = (() => {
    if (corr == null) return "Маловато данных — заполни больше дней со сном и оценкой.";
    const strength = Math.abs(corr);
    const dir = corr > 0 ? "больше" : "меньше";
    const effect = corr > 0 ? "выше" : "ниже";
    if (strength < 0.15) return "Заметной связи между сном и оценкой дня пока нет.";
    const lvl = strength > 0.5 ? "сильная" : strength > 0.3 ? "заметная" : "слабая";
    return `Чем ${dir} спишь — тем ${effect} оценка дня (${lvl} связь, r=${corr.toFixed(2)}).`;
  })();

  if (filled.length === 0) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="game-card p-10 text-center text-ink-500">
          Пока нет заполненных дней. Заполни журнал — и здесь появится аналитика.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<TrendingUp size={18} />} hex="#34d399" label="Средняя оценка" value={avgScore != null ? avgScore.toFixed(1) : "—"} sub={`${scores.length} дней`} />
        <Metric icon={<Moon size={18} />} hex="#38bdf8" label="Средний сон" value={avgSleep != null ? `${avgSleep.toFixed(1)} ч` : "—"} sub={`${sleeps.length} дней`} />
        <Metric icon={<Sparkles size={18} />} hex="#f5b942" label="Лучший день" value={bestWeekday ? bestWeekday.wd : "—"} sub={bestWeekday ? `оценка ${bestWeekday.mean.toFixed(1)}` : ""} />
        <Metric icon={<Brain size={18} />} hex="#a855f7" label="Заполнено дней" value={`${filled.length}`} sub={`из ${allDays.length}`} />
      </div>

      <SystemPanel title="Сон и продуктивность" accent="#38bdf8">
        <p className="text-sm text-ink-200">{corrText}</p>
        {corr != null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.abs(corr) * 100)}%`,
                marginLeft: corr < 0 ? "auto" : 0,
                background: corr > 0 ? "#34d399" : "#fb7185",
              }}
            />
          </div>
        )}
      </SystemPanel>

      {tagImpact.length > 0 && (
        <SystemPanel title="Что влияет на хорошие дни" accent="#a855f7">
          <p className="mb-3 text-xs text-ink-400">
            Разница средней оценки в дни с активностью и без неё. Зелёное — поднимает день, красное — тянет вниз.
          </p>
          <div className="space-y-2">
            {tagImpact.map((t) => {
              const positive = t.delta >= 0;
              const max = Math.max(...tagImpact.map((x) => Math.abs(x.delta)), 0.1);
              return (
                <div key={t.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm" style={{ color: t.hex }}>
                    {t.name}
                  </span>
                  <div className="relative h-3 flex-1 rounded-full bg-white/5">
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        width: `${(Math.abs(t.delta) / max) * 50}%`,
                        left: positive ? "50%" : undefined,
                        right: positive ? undefined : "50%",
                        background: positive ? "#34d399" : "#fb7185",
                        opacity: 0.85,
                      }}
                    />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-white/15" />
                  </div>
                  <span
                    className="w-14 shrink-0 text-right text-xs font-bold tabular-nums"
                    style={{ color: positive ? "#34d399" : "#fb7185" }}
                  >
                    {positive ? "+" : ""}
                    {t.delta}
                  </span>
                </div>
              );
            })}
          </div>
        </SystemPanel>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <ScoreDistribution days={filled} />
        <TagFrequency days={filled} />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h2 className="font-display text-2xl font-black tracking-tight text-ink-100">Анализ</h2>
      <p className="text-sm text-ink-400">Что твои данные говорят о тебе — по всему журналу.</p>
    </div>
  );
}

function Metric({
  icon,
  hex,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  hex: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="game-card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${hex}1f`, color: hex }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-ink-400">{label}</div>
        <div className="font-display text-xl font-black text-ink-100">{value}</div>
        {sub && <div className="text-[11px] text-ink-500">{sub}</div>}
      </div>
    </div>
  );
}
