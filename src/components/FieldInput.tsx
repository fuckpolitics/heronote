import { useState } from "react";
import { Moon, Plus, Sun } from "lucide-react";
import type { FieldDef, FieldValue, SleepValue, Supplement, TagKey, TagLevel, TagValue } from "../types";
import { TAGS, asTags } from "../lib/tags";
import { formatHours, scoreColor, sleepDuration } from "../lib/format";

interface Props {
  field: FieldDef;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  supplements?: Supplement[];
  onAddSupplement?: (name: string, dose?: string) => void;
}

export function FieldInput({ field, value, onChange, supplements = [], onAddSupplement }: Props) {
  switch (field.type) {
    case "score": {
      const v = typeof value === "number" ? value : undefined;
      return (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label field={field} />
            <span className="font-display text-3xl font-bold tabular-nums" style={{ color: scoreColor(v) }}>
              {v != null ? v.toFixed(1) : "—"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={v ?? 0}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="h-2 w-full"
            style={{ accentColor: scoreColor(v) }}
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-500">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      );
    }

    case "tags": {
      const tags = asTags(value);
      const cycle = (key: TagKey) => {
        const next = (((tags[key] ?? 0) + 1) % 3) as TagLevel;
        onChange({ ...tags, [key]: next } as TagValue);
      };
      return (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Label field={field} />
            <span className="text-xs text-ink-500">тап: нет → есть → «+»</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => {
              const lvl = tags[t.key] ?? 0;
              const active = lvl > 0;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => cycle(t.key)}
                  title={t.label}
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 transition ${
                    active
                      ? `${t.bg} ${t.text} ${t.ring}`
                      : "bg-white/5 text-ink-400 ring-white/10 hover:bg-white/10 hover:text-ink-200"
                  }`}
                >
                  {t.short}
                  {lvl === 2 && <span className="ml-0.5">+</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "sleep": {
      const sv: SleepValue = value && typeof value === "object" && !Array.isArray(value) ? (value as SleepValue) : {};
      const dur = sleepDuration(sv.bed, sv.wake);
      const set = (patch: Partial<SleepValue>) => {
        const next = { ...sv, ...patch };
        onChange(next.bed || next.wake ? next : undefined);
      };
      return (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label field={field} />
            {dur != null && (
              <span className="font-display text-lg font-bold text-sky-300">{formatHours(dur)}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ClockField icon={<Moon size={16} />} label="Лёг" tint="#a78bfa" value={sv.bed} onChange={(t) => set({ bed: t })} />
            <ClockField icon={<Sun size={16} />} label="Встал" tint="#fbbf24" value={sv.wake} onChange={(t) => set({ wake: t })} />
          </div>
        </div>
      );
    }

    case "supplements": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (name: string) => {
        const next = selected.includes(name)
          ? selected.filter((n) => n !== name)
          : [...selected, name];
        onChange(next.length ? next : undefined);
      };
      return (
        <SupplementsControl
          field={field}
          selected={selected}
          supplements={supplements}
          onToggle={toggle}
          onAddSupplement={(n, d) => {
            onAddSupplement?.(n, d);
            if (!selected.includes(n)) onChange([...selected, n]);
          }}
        />
      );
    }

    case "boolean": {
      const on = value === true;
      return (
        <div className="flex items-center justify-between">
          <Label field={field} />
          <button
            type="button"
            onClick={() => onChange(!on)}
            className={`relative h-7 w-12 rounded-full transition ${on ? "bg-emerald-500" : "bg-white/12"}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[1.55rem]" : "left-0.5"}`}
            />
          </button>
        </div>
      );
    }

    case "number": {
      const v = typeof value === "number" ? value : "";
      return (
        <Wrap field={field}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={v}
              onChange={(e) => onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
              placeholder={field.placeholder ?? "0"}
              className="input"
            />
            {field.unit && <span className="shrink-0 text-sm text-ink-400">{field.unit}</span>}
          </div>
        </Wrap>
      );
    }

    case "select": {
      const v = typeof value === "string" ? value : "";
      return (
        <Wrap field={field}>
          <select value={v} onChange={(e) => onChange(e.target.value || undefined)} className="input cursor-pointer">
            <option value="" className="bg-ink-900">
              — не выбрано —
            </option>
            {(field.options ?? []).map((o) => (
              <option key={o} value={o} className="bg-ink-900">
                {o}
              </option>
            ))}
          </select>
        </Wrap>
      );
    }

    case "textarea": {
      const v = typeof value === "string" ? value : "";
      return (
        <Wrap field={field}>
          <textarea
            value={v}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder={field.placeholder}
            rows={3}
            className="input resize-none"
          />
        </Wrap>
      );
    }

    default: {
      const v = typeof value === "string" ? value : "";
      return (
        <Wrap field={field}>
          <input
            value={v}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder={field.placeholder}
            className="input"
          />
        </Wrap>
      );
    }
  }
}

function ClockField({
  icon,
  label,
  tint,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  tint: string;
  value?: string;
  onChange: (t: string) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-white/8 bg-white/3 p-3 transition hover:border-white/16">
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
        <span style={{ color: tint }}>{icon}</span>
        {label}
      </span>
      <input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-display text-2xl font-bold tabular-nums text-white outline-none [color-scheme:dark]"
      />
    </label>
  );
}

function SupplementsControl({
  field,
  selected,
  supplements,
  onToggle,
  onAddSupplement,
}: {
  field: FieldDef;
  selected: string[];
  supplements: Supplement[];
  onToggle: (name: string) => void;
  onAddSupplement: (name: string, dose?: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAddSupplement(name.trim(), dose.trim() || undefined);
    setName("");
    setDose("");
    setAdding(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Label field={field} />
        {selected.length > 0 && <span className="text-xs text-ink-500">{selected.length} отмечено</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {supplements.map((s) => {
          const active = selected.includes(s.name);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.name)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                active
                  ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/35"
                  : "bg-white/5 text-ink-300 ring-white/10 hover:bg-white/10"
              }`}
            >
              {s.emoji && <span>{s.emoji}</span>}
              {s.name}
              {s.dose && <span className="text-xs opacity-60">{s.dose}</span>}
            </button>
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-xl border border-dashed border-white/15 px-3 py-2 text-sm text-ink-400 transition hover:border-emerald-400/40 hover:text-emerald-200"
          >
            <Plus size={15} /> Добавить
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-2.5 flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Название"
            className="input flex-1 py-2 text-sm"
          />
          <input
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Доза"
            className="input w-24 py-2 text-sm"
          />
          <button
            onClick={submit}
            className="rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-ink-950 transition hover:bg-emerald-400"
          >
            ОК
          </button>
        </div>
      )}
    </div>
  );
}

function Label({ field }: { field: FieldDef }) {
  return <span className="text-sm font-semibold text-ink-100">{field.label}</span>;
}

function Wrap({ field, children }: { field: FieldDef; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5">
        <Label field={field} />
      </div>
      {children}
    </div>
  );
}
