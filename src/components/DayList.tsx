import { Check } from "lucide-react";
import type { DayEntry, FieldDef, FieldValue, TagKey } from "../types";
import { TAG_KEYS, asTags } from "../lib/tags";
import { KEY_SCORE, KEY_TAGS } from "../data/factory";
import { formatHours, isWeekend, scoreColor, sleepHoursFromValue } from "../lib/format";
import { TagChip } from "./TagChip";

interface Props {
  days: DayEntry[];
  fields: FieldDef[];
  onPick: (day: DayEntry) => void;
}

function valueToText(field: FieldDef, v: FieldValue): string | null {
  if (v == null || v === "") return null;
  if (field.type === "boolean") return v ? "да" : null;
  if (field.type === "number") return `${v}${field.unit ? " " + field.unit : ""}`;
  if (field.type === "sleep") {
    const h = sleepHoursFromValue(v);
    return h != null ? formatHours(h) : null;
  }
  if (field.type === "supplements") {
    const arr = Array.isArray(v) ? (v as string[]) : [];
    return arr.length ? arr.join(", ") : null;
  }
  if (Array.isArray(v)) return v.length ? v.join(", ") : null;
  return String(v);
}

export function DayList({ days, fields, onPick }: Props) {
  const scoreField = fields.find((f) => f.key === KEY_SCORE);
  const tagsField = fields.find((f) => f.key === KEY_TAGS);
  const previewFields = fields.filter((f) => f.key !== KEY_SCORE && f.key !== KEY_TAGS);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="hidden grid-cols-[3.4rem_3rem_1fr] gap-3 border-b border-white/8 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 sm:grid">
        <div>День</div>
        <div className="text-center">Оц.</div>
        <div>Содержимое</div>
      </div>

      <div className="divide-y divide-white/5">
        {days.map((d) => (
          <DayRow
            key={d.id}
            day={d}
            hasScore={!!scoreField}
            hasTags={!!tagsField}
            previewFields={previewFields}
            onClick={() => onPick(d)}
          />
        ))}
      </div>
    </div>
  );
}

function DayRow({
  day,
  hasScore,
  hasTags,
  previewFields,
  onClick,
}: {
  day: DayEntry;
  hasScore: boolean;
  hasTags: boolean;
  previewFields: FieldDef[];
  onClick: () => void;
}) {
  const score = hasScore && typeof day.values[KEY_SCORE] === "number" ? (day.values[KEY_SCORE] as number) : null;
  const tags = hasTags ? asTags(day.values[KEY_TAGS]) : null;
  const activeTags = tags ? (TAG_KEYS.filter((k) => tags[k] > 0) as TagKey[]) : [];
  const weekend = isWeekend(day.weekday);

  const previews = previewFields
    .map((f) => ({ f, text: valueToText(f, day.values[f.key]) }))
    .filter((x) => x.text != null) as { f: FieldDef; text: string }[];

  const filled = score != null || activeTags.length > 0 || previews.length > 0;

  return (
    <button
      onClick={onClick}
      className={`group relative grid w-full grid-cols-[3.4rem_3rem_1fr] items-center gap-3 px-4 py-3 text-left transition hover:bg-white/4 ${
        filled ? "" : "opacity-55 hover:opacity-100"
      }`}
    >
      <span
        className="absolute left-0 top-0 h-full w-0.5 rounded-r transition-opacity"
        style={{ background: score != null ? scoreColor(score) : "transparent", opacity: filled ? 1 : 0 }}
      />

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-lg font-bold tabular-nums text-white">
          {String(day.day).padStart(2, "0")}
        </span>
        <span className={`text-xs ${weekend ? "font-semibold text-rose-300/80" : "text-ink-500"}`}>
          {day.weekday}
        </span>
      </div>

      <div className="flex justify-center">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold tabular-nums"
          style={{
            color: score != null ? scoreColor(score) : "#4a5570",
            background: score != null ? `${scoreColor(score)}22` : "rgba(255,255,255,0.03)",
            boxShadow: score != null ? `inset 0 0 0 1px ${scoreColor(score)}44` : "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {score != null ? score.toFixed(1) : "—"}
        </span>
      </div>

      <div className="min-w-0">
        {activeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeTags.map((k) => (
              <TagChip key={k} tag={k} level={tags![k]} />
            ))}
          </div>
        )}
        {previews.length > 0 && (
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 ${activeTags.length ? "mt-1.5" : ""}`}>
            {previews.map(({ f, text }) => (
              <span key={f.id} className="flex min-w-0 items-center gap-1">
                <span className="text-ink-600">{f.label}:</span>
                {f.type === "boolean" ? (
                  <Check size={13} className="text-emerald-300" />
                ) : (
                  <span className="truncate text-ink-300">{text}</span>
                )}
              </span>
            ))}
          </div>
        )}
        {!filled && (
          <span className="block truncate text-xs text-ink-600">
            <span className="sm:hidden">— нажми, чтобы заполнить</span>
            <span className="hidden sm:inline">— пусто, нажми чтобы заполнить —</span>
          </span>
        )}
      </div>
    </button>
  );
}
