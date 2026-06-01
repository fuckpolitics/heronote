import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Lock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { FieldDef, FieldType } from "../types";

interface Props {
  open: boolean;
  fields: FieldDef[];
  onClose: () => void;
  onAdd: (def: Omit<FieldDef, "id" | "key">) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReorder: (fromId: string, toId: string) => void;
}

const TYPE_OPTIONS: { value: FieldType; label: string; hint: string }[] = [
  { value: "text", label: "Текст", hint: "однострочное поле" },
  { value: "textarea", label: "Длинный текст", hint: "заметка в несколько строк" },
  { value: "number", label: "Число", hint: "с единицей измерения" },
  { value: "boolean", label: "Да / Нет", hint: "переключатель" },
  { value: "select", label: "Выбор", hint: "из списка вариантов" },
  { value: "score", label: "Оценка 0–10", hint: "ползунок с цветом" },
];

const TYPE_LABEL: Record<FieldType, string> = {
  score: "Оценка",
  tags: "Теги",
  text: "Текст",
  number: "Число",
  textarea: "Длинный текст",
  boolean: "Да / Нет",
  select: "Выбор",
  sleep: "Сон (будильник)",
  supplements: "Добавки",
};

export function FieldsManager({ open, fields, onClose, onAdd, onRemove, onMove, onReorder }: Props) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [unit, setUnit] = useState("");
  const [options, setOptions] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const submit = () => {
    if (!label.trim()) return;
    onAdd({
      label: label.trim(),
      type,
      unit: type === "number" && unit.trim() ? unit.trim() : undefined,
      options:
        type === "select"
          ? options.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
    });
    setLabel("");
    setUnit("");
    setOptions("");
    setType("text");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl"
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Поля дня</h2>
                  <p className="text-xs text-ink-400">
                    Перетащи за ручку, чтобы изменить порядок. Встроенные поля удалить нельзя.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-ink-400 transition hover:bg-white/8 hover:text-white"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
                {fields.map((f, i) => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={() => setDragId(f.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragId && dragId !== f.id) onReorder(dragId, f.id);
                      setDragId(null);
                    }}
                    className={`group flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 transition ${
                      dragId === f.id ? "opacity-40" : "hover:border-white/16"
                    }`}
                  >
                    <GripVertical size={16} className="cursor-grab text-ink-500 active:cursor-grabbing" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink-100">{f.label}</span>
                        {f.builtin && (
                          <span className="flex items-center gap-1 rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] text-ink-400">
                            <Lock size={10} /> базовое
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-ink-500">{TYPE_LABEL[f.type]}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => onMove(f.id, -1)}
                        disabled={i === 0}
                        className="rounded-md p-1.5 text-ink-400 transition hover:bg-white/8 hover:text-white disabled:opacity-25"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        onClick={() => onMove(f.id, 1)}
                        disabled={i === fields.length - 1}
                        className="rounded-md p-1.5 text-ink-400 transition hover:bg-white/8 hover:text-white disabled:opacity-25"
                      >
                        <ChevronDown size={15} />
                      </button>
                      {!f.builtin && (
                        <button
                          onClick={() => onRemove(f.id)}
                          className="rounded-md p-1.5 text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-300"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/8 bg-white/2 px-5 py-4">
                <h3 className="mb-2.5 text-sm font-semibold text-ink-200">Новое поле</h3>
                <div className="space-y-2.5">
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Название поля, напр. «Вес» или «Медитация»"
                    className="input"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as FieldType)}
                      className="input cursor-pointer"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value} className="bg-ink-900">
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {type === "number" && (
                      <input
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="Ед.: кг, ч, мг…"
                        className="input"
                      />
                    )}
                    {type === "select" && (
                      <input
                        value={options}
                        onChange={(e) => setOptions(e.target.value)}
                        placeholder="Варианты через запятую"
                        className="input"
                      />
                    )}
                  </div>
                  <button
                    onClick={submit}
                    disabled={!label.trim()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                    Добавить поле
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
