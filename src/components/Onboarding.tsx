import { AnimatePresence, motion } from "motion/react";
import { ChevronsRight, Dumbbell, Package, Swords, Workflow } from "lucide-react";

interface Props {
  open: boolean;
  name: string;
  onFinish: () => void;
}

const HINTS = [
  { icon: <Swords size={18} />, title: "Бери квесты", text: "Ежедневные и еженедельные задания. Готовые шаблоны или свои." },
  { icon: <Package size={18} />, title: "Качай характеристики", text: "5 категорий, достижения и снаряжение для усиления статов." },
  { icon: <Dumbbell size={18} />, title: "Следи за телом", text: "Замеры тела и упражнения с графиками динамики." },
  { icon: <Workflow size={18} />, title: "Строй карту идей", text: "Узлы и стрелки, чтобы визуализировать планы." },
];

export function Onboarding({ open, name, onFinish }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="sys-panel w-full max-w-lg overflow-hidden"
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
          >
            <div className="relative overflow-hidden px-7 pt-8 pb-5">
              <div className="scanline" />
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-sys-blue/25 blur-3xl" />
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-sys-blue to-sys-purple text-white shadow-[0_0_28px_-4px_rgba(47,107,255,0.9)]">
                <Swords size={30} />
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-sys-cyan">System · уведомление</div>
              <h2 className="mt-1 font-display text-3xl font-black uppercase text-white glow-text">
                Ты пробуждён{name ? `, ${name}` : ""}
              </h2>
              <p className="mt-2 text-ink-300">
                Система выбрала тебя. Выполняй квесты, прокачивай характеристики и поднимайся в ранге от
                <span className="text-sys-azure"> E</span> к легендарному
                <span className="font-bold text-sys-gold"> SSS</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 px-7 sm:grid-cols-2">
              {HINTS.map((h) => (
                <div key={h.title} className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/4 p-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sys-blue/15 text-sys-azure">
                    {h.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{h.title}</div>
                    <div className="text-xs leading-snug text-ink-400">{h.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-7 py-6">
              <button
                onClick={onFinish}
                className="btn-sys flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display text-lg"
              >
                Войти в Систему <ChevronsRight size={20} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
