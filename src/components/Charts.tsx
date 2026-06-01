import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayEntry, TagKey } from "../types";
import { TAGS, asTags } from "../lib/tags";
import { KEY_SCORE, KEY_SLEEP, KEY_TAGS } from "../data/factory";
import { avg, scoreColor, sleepHoursFromValue } from "../lib/format";

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

const tooltipStyle = {
  background: "rgba(11,15,23,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  fontSize: 12,
  color: "#e6eaf2",
};

export function ScoreTrend({ days }: { days: DayEntry[] }) {
  const data = days
    .map((d) => ({ day: d.day, score: num(d.values[KEY_SCORE]) }))
    .filter((d): d is { day: number; score: number } => d.score != null);
  const mean = avg(data.map((d) => d.score));

  return (
    <Panel title="Динамика оценки" sub={mean != null ? `средняя ${mean}` : ""}>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: "#5a6680", fontSize: 11 }} stroke="rgba(255,255,255,0.08)" />
            <YAxis domain={[0, 10]} tick={{ fill: "#5a6680", fontSize: 11 }} stroke="rgba(255,255,255,0.08)" />
            {mean != null && (
              <ReferenceLine y={mean} stroke="#a78bfa" strokeDasharray="4 4" strokeOpacity={0.6} />
            )}
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => `День ${v}`}
              formatter={(v) => [Number(v).toFixed(1), "оценка"]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#scoreFill)"
              dot={{ r: 2.5, fill: "#34d399" }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function SleepTrend({ days }: { days: DayEntry[] }) {
  const data = days
    .map((d) => ({ day: d.day, hours: sleepHoursFromValue(d.values[KEY_SLEEP]) }))
    .filter((d) => d.hours != null) as { day: number; hours: number }[];
  const mean = avg(data.map((d) => d.hours));

  return (
    <Panel title="Сон" sub={mean != null ? `в среднем ${mean} ч` : ""}>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: "#5a6680", fontSize: 11 }} stroke="rgba(255,255,255,0.08)" />
            <YAxis tick={{ fill: "#5a6680", fontSize: 11 }} stroke="rgba(255,255,255,0.08)" />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => `День ${v}`}
              formatter={(v) => [`${v} ч`, "сон"]}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} isAnimationActive={false} minPointSize={2}>
              {data.map((d) => (
                <Cell key={d.day} fill={d.hours >= 7 ? "#38bdf8" : "#fb7185"} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function TagFrequency({ days }: { days: DayEntry[] }) {
  const data = TAGS.map((t) => {
    let count = 0;
    let plus = 0;
    days.forEach((d) => {
      const lvl = asTags(d.values[KEY_TAGS])[t.key as TagKey];
      if (lvl > 0) count++;
      if (lvl === 2) plus++;
    });
    return { key: t.key, name: t.short, count, plus, hex: t.hex };
  }).filter((d) => d.count > 0);

  return (
    <Panel title="Контроль · частота тегов" sub={`${days.length} дней`}>
      <div className="space-y-2.5 pt-1">
        {data.length === 0 && (
          <div className="py-4 text-center text-sm text-ink-600">Пока нет данных</div>
        )}
        {data.map((d) => {
          const max = Math.max(...data.map((x) => x.count));
          return (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-xs font-semibold" style={{ color: d.hex }}>
                {d.name}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(d.count / max) * 100}%`, background: d.hex, opacity: 0.85 }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-500">
                {d.count}
                {d.plus > 0 && <span style={{ color: d.hex }}> · {d.plus}+</span>}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function ScoreDistribution({ days }: { days: DayEntry[] }) {
  const buckets = [
    { name: "0–2", min: 0, max: 2, hex: "#fb7185" },
    { name: "2–4", min: 2, max: 4, hex: "#fb923c" },
    { name: "4–6", min: 4, max: 6, hex: "#fbbf24" },
    { name: "6–8", min: 6, max: 8, hex: "#a3e635" },
    { name: "8–10", min: 8, max: 10.01, hex: "#34d399" },
  ];
  const data = buckets.map((b) => ({
    name: b.name,
    hex: b.hex,
    count: days.filter((d) => {
      const s = num(d.values[KEY_SCORE]);
      return s != null && s >= b.min && s < b.max;
    }).length,
  }));
  const total = data.reduce((a, b) => a + b.count, 0);

  return (
    <Panel title="Распределение оценок" sub={`${total} дней`}>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#5a6680", fontSize: 11 }} stroke="rgba(255,255,255,0.08)" />
            <YAxis allowDecimals={false} tick={{ fill: "#5a6680", fontSize: 11 }} stroke="rgba(255,255,255,0.08)" />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}`, "дней"]} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.hex} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function HabitsCompletion({
  habits,
  monthId,
  daysCount,
}: {
  habits: { id: string; name: string; emoji: string; color: string; done: string[] }[];
  monthId: string;
  daysCount: number;
}) {
  const data = habits
    .map((h) => {
      const inMonth = h.done.filter((k) => k.startsWith(monthId)).length;
      return { ...h, pct: daysCount ? Math.round((inMonth / daysCount) * 100) : 0, inMonth };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <Panel title="Выполнение привычек" sub={`${habits.length} шт.`}>
      <div className="space-y-2.5 pt-1">
        {data.length === 0 && <div className="py-4 text-center text-sm text-ink-600">Нет привычек</div>}
        {data.map((h) => (
          <div key={h.id} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center">{h.emoji}</span>
            <span className="w-24 shrink-0 truncate text-xs text-ink-300">{h.name}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full" style={{ width: `${h.pct}%`, background: h.color, opacity: 0.85 }} />
            </div>
            <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: h.color }}>
              {h.pct}%
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {sub && <span className="text-xs text-ink-500">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

export { scoreColor };
