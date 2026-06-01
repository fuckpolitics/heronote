import type { FieldValue, SleepValue } from "../types";

/** Длительность сна по времени «лёг» → «встал» (с учётом перехода через полночь) */
export function sleepDuration(bed?: string, wake?: string): number | null {
  if (!bed || !wake) return null;
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  if ([bh, bm, wh, wm].some((n) => Number.isNaN(n))) return null;
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export function isSleepValue(v: FieldValue): v is SleepValue {
  return !!v && typeof v === "object" && !Array.isArray(v) && ("bed" in v || "wake" in v);
}

/** Часы сна из значения поля (объект-будильник или старый текст) */
export function sleepHoursFromValue(v: FieldValue): number | null {
  if (isSleepValue(v)) return sleepDuration(v.bed, v.wake);
  if (typeof v === "string") return parseSleepHours(v);
  return null;
}

export function formatHours(h: number | null): string {
  if (h == null) return "—";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm ? `${hh}ч ${mm}м` : `${hh}ч`;
}

/** ISO-ключ даты для дня месяца: («2026-06», 7) → «2026-06-07» */
export function dateKey(monthId: string, day: number): string {
  return `${monthId}-${String(day).padStart(2, "0")}`;
}

/** Парсит свободный текст сна в часы: «7ч 40м», «7 ч», «6ч30м» → число часов */
export function parseSleepHours(sleep?: string): number | null {
  if (!sleep) return null;
  const s = sleep.toLowerCase().replace(",", ".");
  const h = s.match(/(\d+(?:\.\d+)?)\s*ч/);
  const m = s.match(/(\d+)\s*м/);
  let hours = 0;
  if (h) hours += parseFloat(h[1]);
  if (m) hours += parseInt(m[1], 10) / 60;
  if (!h && !m) {
    const num = s.match(/(\d+(?:\.\d+)?)/);
    if (num) hours = parseFloat(num[1]);
  }
  return hours > 0 ? Math.round(hours * 100) / 100 : null;
}

/** Цвет для оценки 0–10 (HEX) */
export function scoreColor(score?: number): string {
  if (score == null) return "#3a465b";
  if (score >= 8) return "#34d399";
  if (score >= 6.5) return "#a3e635";
  if (score >= 5) return "#fbbf24";
  if (score >= 3.5) return "#fb923c";
  return "#fb7185";
}

export function scoreTextClass(score?: number): string {
  if (score == null) return "text-ink-500";
  if (score >= 8) return "text-emerald-300";
  if (score >= 6.5) return "text-lime-300";
  if (score >= 5) return "text-amber-300";
  if (score >= 3.5) return "text-orange-300";
  return "text-rose-300";
}

export function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

export const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export function isWeekend(weekday: string): boolean {
  return weekday === "сб" || weekday === "вс";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
