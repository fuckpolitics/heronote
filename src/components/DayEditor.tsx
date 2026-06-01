import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eraser, X } from "lucide-react";
import type { DayEntry, FieldDef, FieldValue, Supplement } from "../types";
import { FieldInput } from "./FieldInput";

interface Props {
  open: boolean;
  day: DayEntry | null;
  fields: FieldDef[];
  supplements?: Supplement[];
  onAddSupplement?: (name: string, dose?: string) => void;
  onClose: () => void;
  onSave: (day: DayEntry) => void;
  onClear?: (id: string) => void;
}

export function DayEditor({
  open,
  day,
  fields,
  supplements,
  onAddSupplement,
  onClose,
  onSave,
  onClear,
}: Props) {
  const [draft, setDraft] = useState<DayEntry | null>(day);

  useEffect(() => setDraft(day), [day]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!draft) return null;

  const setValue = (key: string, v: FieldValue) =>
    setDraft((d) => (d ? { ...d, values: { ...d.values, [key]: v } } : d));

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
          <motion.aside
            className="glass fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-white/6 ring-1 ring-white/10">
                  <span className="font-display text-lg font-bold leading-none text-white">
                    {String(draft.day).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase text-ink-400">{draft.weekday}</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Заполнение дня</h2>
                  <p className="text-xs text-ink-400">Все поля необязательны</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-ink-400 transition hover:bg-white/8 hover:text-white"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {fields.map((f) => (
                <FieldInput
                  key={f.id}
                  field={f}
                  value={draft.values[f.key]}
                  onChange={(v) => setValue(f.key, v)}
                  supplements={supplements}
                  onAddSupplement={onAddSupplement}
                />
              ))}
            </div>

            <footer className="flex items-center gap-3 border-t border-white/8 px-5 py-4">
              {onClear && (
                <button
                  onClick={() => {
                    onClear(draft.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-rose-300 transition hover:bg-rose-500/12"
                  title="Очистить день"
                >
                  <Eraser size={16} />
                  <span className="hidden sm:inline">Очистить</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-auto rounded-lg px-4 py-2.5 text-sm font-medium text-ink-400 transition hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  onSave(draft);
                  onClose();
                }}
                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
              >
                Сохранить
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
