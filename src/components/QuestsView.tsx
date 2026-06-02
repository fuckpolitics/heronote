import { useState } from "react";
import { Check, Plus, ShieldAlert, Sparkles, Trash2, X } from "lucide-react";
import type { CategoryKey, Quest, QuestPeriod } from "../types";
import { CAT_MAP, CATEGORIES, QUEST_TEMPLATES, isQuestDone } from "../lib/rpg";
import { SystemPanel } from "./SystemPanel";

interface Props {
  quests: Quest[];
  onAdd: (title: string, category: CategoryKey, period: QuestPeriod, xp: number, stake: number) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

export function QuestsView({ quests, onAdd, onRemove, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const daily = quests.filter((q) => q.period === "daily");
  const weekly = quests.filter((q) => q.period === "weekly");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wider text-ink-100 glow-text">Квесты</h2>
          <p className="text-sm text-ink-400">Выполняй задания и качай характеристики. Ставка сгорает при провале.</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-sys flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm">
          <Plus size={16} /> Новый квест
        </button>
      </div>

      {open && <QuestCreator onAdd={onAdd} onClose={() => setOpen(false)} />}

      <QuestGroup title="Ежедневные" period="daily" list={daily} onRemove={onRemove} onToggle={onToggle} />
      <QuestGroup title="Еженедельные" period="weekly" list={weekly} onRemove={onRemove} onToggle={onToggle} />
    </div>
  );
}

function QuestGroup({
  title,
  period,
  list,
  onRemove,
  onToggle,
}: {
  title: string;
  period: QuestPeriod;
  list: Quest[];
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const doneCount = list.filter(isQuestDone).length;
  return (
    <SystemPanel
      title={title}
      accent={period === "daily" ? "#22d3ee" : "#a855f7"}
      right={
        <span className="font-display text-sm tabular-nums text-ink-300">
          {doneCount}/{list.length}
        </span>
      }
    >
      {list.length === 0 ? (
        <div className="py-6 text-center text-sm text-ink-500">Нет квестов. Добавь из шаблонов или создай свой.</div>
      ) : (
        <div className="space-y-2">
          {list.map((q) => {
            const cat = CAT_MAP[q.category];
            const done = isQuestDone(q);
            return (
              <div
                key={q.id}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                  done ? "border-emerald-400/30 bg-emerald-500/8" : "border-white/8 bg-white/3 hover:border-white/16"
                }`}
              >
                <button
                  onClick={() => onToggle(q.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition"
                  style={{
                    borderColor: done ? "#34d399" : `${cat.hex}55`,
                    background: done ? "#34d399" : "transparent",
                    color: done ? "#04060f" : "transparent",
                  }}
                >
                  <Check size={18} strokeWidth={3} />
                </button>
                <span className="text-lg" style={{ filter: done ? "grayscale(0.4)" : "none" }}>
                  {cat.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-medium ${done ? "text-ink-400 line-through" : "text-ink-100"}`}>
                    {q.title}
                  </div>
                  <div className="text-xs" style={{ color: cat.hex }}>
                    {cat.name}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-md px-2 py-1 font-display text-xs font-bold tabular-nums" style={{ background: `${cat.hex}1f`, color: cat.hex }}>
                    +{q.xp} XP
                  </span>
                  {(q.stake ?? 0) > 0 && (
                    <span
                      className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-display text-[11px] font-bold tabular-nums text-rose-300"
                      style={{ background: "rgba(244,63,94,0.14)" }}
                      title="Ставка: сгорит при провале за период"
                    >
                      <ShieldAlert size={11} /> −{q.stake}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemove(q.id)}
                  className="shrink-0 text-ink-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SystemPanel>
  );
}

function QuestCreator({
  onAdd,
  onClose,
}: {
  onAdd: (title: string, category: CategoryKey, period: QuestPeriod, xp: number, stake: number) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>("sport");
  const [period, setPeriod] = useState<QuestPeriod>("daily");
  const [xp, setXp] = useState(30);
  const [stake, setStake] = useState(0);

  const submit = () => {
    if (!title.trim()) return;
    onAdd(title, category, period, xp, stake);
    setTitle("");
  };

  return (
    <SystemPanel title="Создать квест" accent="#f5b942">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Название квеста" className="input sm:col-span-2" autoFocus />
        <select value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)} className="input cursor-pointer">
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key} className="bg-ink-900">
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select value={period} onChange={(e) => setPeriod(e.target.value as QuestPeriod)} className="input cursor-pointer">
          <option value="daily" className="bg-ink-900">Ежедневный</option>
          <option value="weekly" className="bg-ink-900">Еженедельный</option>
        </select>
        <div className="flex items-center gap-3 sm:col-span-2">
          <span className="font-ui text-sm text-ink-300">Награда</span>
          <input type="range" min={10} max={300} step={5} value={xp} onChange={(e) => setXp(parseInt(e.target.value))} className="flex-1" style={{ accentColor: "#f5b942" }} />
          <span className="w-20 text-right font-display font-bold tabular-nums text-sys-gold">+{xp} XP</span>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <span className="flex items-center gap-1 font-ui text-sm text-ink-300">
            <ShieldAlert size={14} className="text-rose-300" /> Ставка
          </span>
          <input type="range" min={0} max={100} step={5} value={stake} onChange={(e) => setStake(parseInt(e.target.value))} className="flex-1" style={{ accentColor: "#fb5c8a" }} />
          <span className="w-20 text-right font-display font-bold tabular-nums text-rose-300">
            {stake > 0 ? `−${stake} XP` : "нет"}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-500">
          <Sparkles size={13} /> Шаблоны
        </div>
        <div className="flex flex-wrap gap-2">
          {QUEST_TEMPLATES.map((t, i) => {
            const cat = CAT_MAP[t.category];
            return (
              <button
                key={i}
                onClick={() => onAdd(t.title, t.category, t.period, t.xp, 0)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-2.5 py-1.5 text-xs text-ink-200 transition hover:border-white/25"
                title={`${cat.name} · ${t.period === "daily" ? "ежедн." : "еженед."} · +${t.xp}`}
              >
                <span>{cat.icon}</span>
                {t.title}
                <span className="text-ink-500">+{t.xp}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-ink-400 transition hover:text-white">
          <X size={15} /> Закрыть
        </button>
        <button onClick={submit} className="btn-sys rounded-lg px-5 py-2 text-sm">Добавить</button>
      </div>
    </SystemPanel>
  );
}
