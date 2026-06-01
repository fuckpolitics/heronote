import { CalendarCheck, Dumbbell, Moon, Sparkles, Star } from "lucide-react";
import type { MonthData } from "../types";
import { asTags } from "../lib/tags";
import { KEY_SCORE, KEY_SLEEP, KEY_TAGS } from "../data/factory";
import { avg, scoreColor, sleepHoursFromValue } from "../lib/format";

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

export function StatCards({ month }: { month: MonthData }) {
  const scores = month.days
    .map((d) => num(d.values[KEY_SCORE]))
    .filter((x): x is number => x != null);
  const mean = avg(scores);
  const tracked = month.days.filter((d) => Object.keys(d.values).length > 0).length;
  const trainings = month.days.filter((d) => asTags(d.values[KEY_TAGS]).Tr > 0).length;
  const sleepMean = avg(
    month.days.map((d) => sleepHoursFromValue(d.values[KEY_SLEEP])).filter((x): x is number => x != null),
  );
  const best = month.days.reduce<{ day: number; score: number } | null>((acc, d) => {
    const s = num(d.values[KEY_SCORE]);
    if (s == null) return acc;
    if (!acc || s > acc.score) return { day: d.day, score: s };
    return acc;
  }, null);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat
        icon={<Sparkles size={18} />}
        label="Средняя оценка"
        value={mean != null ? mean.toFixed(2) : "—"}
        accent={scoreColor(mean ?? undefined)}
        big
      />
      <Stat
        icon={<CalendarCheck size={18} />}
        label="Дней отмечено"
        value={`${tracked} / ${month.days.length}`}
        accent="#34d399"
      />
      <Stat icon={<Dumbbell size={18} />} label="Тренировок" value={String(trainings)} accent="#38bdf8" />
      <Stat
        icon={<Moon size={18} />}
        label="Сон, в среднем"
        value={sleepMean != null ? `${sleepMean} ч` : "—"}
        accent="#a78bfa"
      />
      <Stat
        icon={<Star size={18} />}
        label="Лучший день"
        value={best ? `${best.score.toFixed(1)} · ${best.day}-е` : "—"}
        accent="#fbbf24"
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
  big,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  big?: boolean;
}) {
  return (
    <div className="glass card-hover rounded-2xl p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </span>
        <span className="text-xs text-ink-400">{label}</span>
      </div>
      <div
        className={`font-display font-bold tabular-nums ${big ? "text-3xl" : "text-2xl"} text-white`}
        style={big ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
