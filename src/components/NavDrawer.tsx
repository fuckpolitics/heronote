import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  open: boolean;
  items: NavItem[];
  current: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function NavDrawer({ open, items, current, onSelect, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-white/10 bg-ink-900/95 p-4 backdrop-blur-xl lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-base font-black uppercase tracking-[0.18em] text-white">
                Heronote
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white/8 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {items.map((t) => {
                const active = current === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelect(t.id);
                      onClose();
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-left font-ui text-base font-semibold transition ${
                      active
                        ? "bg-sys-blue/20 text-white ring-1 ring-sys-blue/40"
                        : "text-ink-300 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    <span className={active ? "text-sys-cyan" : "text-ink-400"}>{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
