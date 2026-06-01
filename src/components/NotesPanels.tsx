import { useState } from "react";
import { Activity, Check, Lightbulb, Plus, ScrollText, Trash2, X } from "lucide-react";
import type { HormoneLab, ControlItem } from "../types";
import { uid } from "../lib/format";

export function EditableNote({
  title,
  icon,
  value,
  placeholder,
  onChange,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-emerald-300">{icon}</span>
        {title}
      </h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={Math.max(3, value.split("\n").length)}
        className="w-full resize-none rounded-lg border border-transparent bg-transparent text-sm leading-relaxed text-ink-200 outline-none transition placeholder:text-ink-600 focus:border-white/8 focus:bg-white/3"
        style={{ color: "#c8d0de" }}
      />
    </section>
  );
}

export const IdeasIcon = <Lightbulb size={15} />;
export const ObsIcon = <ScrollText size={15} />;
export const SummaryIcon = <Check size={15} />;

export function HormonesPanel({
  items,
  onChange,
}: {
  items: HormoneLab[];
  onChange: (items: HormoneLab[]) => void;
}) {
  const [name, setName] = useState("");
  const [val, setVal] = useState("");

  const add = () => {
    if (!name.trim()) return;
    onChange([...items, { id: uid(), name: name.trim(), value: val.trim() }]);
    setName("");
    setVal("");
  };

  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-violet-300">
          <Activity size={15} />
        </span>
        Гормоны и анализы
      </h3>
      <div className="space-y-1.5">
        {items.map((h) => (
          <div
            key={h.id}
            className="group flex items-center justify-between rounded-lg bg-white/3 px-3 py-2 text-sm"
          >
            <span className="text-ink-300">{h.name}</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold tabular-nums text-violet-200">{h.value}</span>
              <button
                onClick={() => onChange(items.filter((x) => x.id !== h.id))}
                className="text-ink-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Показатель"
          className="input flex-1 py-1.5 text-xs"
        />
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Значение"
          className="input w-24 py-1.5 text-xs"
        />
        <button
          onClick={add}
          className="rounded-lg bg-violet-500/15 px-2.5 text-violet-200 ring-1 ring-violet-400/25 transition hover:bg-violet-500/25"
        >
          <Plus size={16} />
        </button>
      </div>
    </section>
  );
}

export function ControlPanel({
  items,
  onChange,
}: {
  items: ControlItem[];
  onChange: (items: ControlItem[]) => void;
}) {
  const [text, setText] = useState("");
  const add = () => {
    if (!text.trim()) return;
    onChange([...items, { id: uid(), label: text.trim() }]);
    setText("");
  };
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-sky-300">
          <ScrollText size={15} />
        </span>
        Контроль за месяц
      </h3>
      <ul className="space-y-1.5">
        {items.map((c) => (
          <li
            key={c.id}
            className="group flex items-start justify-between gap-2 rounded-lg bg-white/3 px-3 py-2 text-sm text-ink-300"
          >
            <span className="flex gap-2">
              <span className="mt-0.5 text-sky-400/70">•</span>
              {c.label}
            </span>
            <button
              onClick={() => onChange(items.filter((x) => x.id !== c.id))}
              className="mt-0.5 shrink-0 text-ink-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Добавить пункт контроля…"
          className="input flex-1 py-1.5 text-xs"
        />
        <button
          onClick={add}
          className="rounded-lg bg-sky-500/15 px-2.5 text-sky-200 ring-1 ring-sky-400/25 transition hover:bg-sky-500/25"
        >
          <Plus size={16} />
        </button>
      </div>
    </section>
  );
}
