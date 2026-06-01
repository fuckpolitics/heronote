import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Plus, Trash2, X } from "lucide-react";
import type { Tracker } from "../types";
import { SystemPanel } from "./SystemPanel";

interface Props {
  trackers: Tracker[];
  onAddTracker: (t: Omit<Tracker, "id" | "log">) => void;
  onRemoveTracker: (id: string) => void;
  onAddPoint: (trackerId: string, value: number, date?: string) => void;
  onRemovePoint: (trackerId: string, pointId: string) => void;
}

export function ProgressView({ trackers, onAddTracker, onRemoveTracker, onAddPoint, onRemovePoint }: Props) {
  const [open, setOpen] = useState(false);
  const body = trackers.filter((t) => t.group === "body");
  const exercise = trackers.filter((t) => t.group === "exercise");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wider text-ink-100 glow-text">Прогресс тела</h2>
          <p className="text-sm text-ink-400">Замеры тела и упражнения — следи за динамикой</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-sys flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm">
          <Plus size={16} /> Метрика
        </button>
      </div>

      {open && <TrackerCreator onAdd={onAddTracker} onClose={() => setOpen(false)} />}

      <SystemPanel title="Метрики тела" accent="#fb5c8a">
        <Grid list={body} onAddPoint={onAddPoint} onRemovePoint={onRemovePoint} onRemoveTracker={onRemoveTracker} />
      </SystemPanel>
      <SystemPanel title="Упражнения" accent="#22d3ee">
        <Grid list={exercise} onAddPoint={onAddPoint} onRemovePoint={onRemovePoint} onRemoveTracker={onRemoveTracker} />
      </SystemPanel>
    </div>
  );
}

function Grid({
  list,
  onAddPoint,
  onRemovePoint,
  onRemoveTracker,
}: {
  list: Tracker[];
  onAddPoint: (id: string, v: number, d?: string) => void;
  onRemovePoint: (id: string, pid: string) => void;
  onRemoveTracker: (id: string) => void;
}) {
  if (list.length === 0) return <div className="py-5 text-center text-sm text-ink-500">Пока пусто.</div>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((t) => (
        <TrackerCard key={t.id} t={t} onAddPoint={onAddPoint} onRemovePoint={onRemovePoint} onRemoveTracker={onRemoveTracker} />
      ))}
    </div>
  );
}

function TrackerCard({
  t,
  onAddPoint,
  onRemovePoint,
  onRemoveTracker,
}: {
  t: Tracker;
  onAddPoint: (id: string, v: number, d?: string) => void;
  onRemovePoint: (id: string, pid: string) => void;
  onRemoveTracker: (id: string) => void;
}) {
  const [val, setVal] = useState("");
  const latest = t.log[t.log.length - 1];
  const prev = t.log[t.log.length - 2];
  const delta = latest && prev ? latest.value - prev.value : null;
  const good = delta == null ? null : t.higherBetter ? delta > 0 : delta < 0;
  const data = t.log.map((p) => ({ date: p.date.slice(5), value: p.value }));

  const submit = () => {
    const n = parseFloat(val.replace(",", "."));
    if (Number.isFinite(n)) {
      onAddPoint(t.id, n);
      setVal("");
    }
  };

  return (
    <div className="group rounded-xl border border-white/8 bg-white/3 p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{t.icon}</span>
          <div>
            <div className="text-sm font-semibold text-ink-100">{t.name}</div>
            <div className="text-[11px] text-ink-500">{t.unit}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-black tabular-nums text-ink-100">
            {latest ? latest.value : "—"}
          </div>
          {delta != null && delta !== 0 && (
            <div className={`flex items-center justify-end gap-0.5 text-xs ${good ? "text-emerald-300" : "text-rose-300"}`}>
              {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(delta).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {data.length > 1 && (
        <div className="mt-2 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`g-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                contentStyle={{ background: "#0a1022", border: "1px solid #2a3a66", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#8a9bc7" }}
              />
              <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} fill={`url(#g-${t.id})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          inputMode="decimal"
          placeholder={`Новое значение, ${t.unit}`}
          className="input flex-1 py-1.5 text-sm"
        />
        <button onClick={submit} className="btn-sys rounded-md px-3 py-1.5 text-sm">
          <Plus size={15} />
        </button>
        <button onClick={() => onRemoveTracker(t.id)} className="text-ink-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100">
          <Trash2 size={15} />
        </button>
      </div>

      {t.log.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {t.log.slice(-6).reverse().map((p) => (
            <span key={p.id} className="group/p flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-ink-300">
              {p.date.slice(5)}: <b className="text-ink-100">{p.value}</b>
              <button onClick={() => onRemovePoint(t.id, p.id)} className="text-ink-600 hover:text-rose-300">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackerCreator({ onAdd, onClose }: { onAdd: (t: Omit<Tracker, "id" | "log">) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("кг");
  const [group, setGroup] = useState<Tracker["group"]>("exercise");
  const [icon, setIcon] = useState("🏋️");
  const [higherBetter, setHigherBetter] = useState(true);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), unit: unit.trim() || "ед.", group, icon, higherBetter });
    onClose();
  };

  return (
    <SystemPanel title="Новая метрика" accent="#f5b942">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название (напр. Присед)" className="input" autoFocus />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ед. (кг, см, раз)" className="input" />
        <select value={group} onChange={(e) => setGroup(e.target.value as Tracker["group"])} className="input cursor-pointer">
          <option value="exercise" className="bg-ink-900">Упражнение</option>
          <option value="body" className="bg-ink-900">Тело</option>
        </select>
        <input value={icon} onChange={(e) => setIcon(e.target.value.slice(0, 2))} placeholder="Эмодзи" className="input" />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-300 sm:col-span-2">
          <input type="checkbox" checked={higherBetter} onChange={(e) => setHigherBetter(e.target.checked)} className="h-4 w-4" style={{ accentColor: "#22d3ee" }} />
          Чем больше — тем лучше
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink-400 hover:text-white">Отмена</button>
        <button onClick={submit} className="btn-sys rounded-lg px-5 py-2 text-sm">Создать</button>
      </div>
    </SystemPanel>
  );
}
