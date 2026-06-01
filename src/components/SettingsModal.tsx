import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, Loader2, LogOut, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import type { Profile, Supplement } from "../types";
import { RANKS, RANK_HEX } from "../lib/rpg";
import { fileToAvatarDataUrl } from "../lib/image";
import { Avatar } from "./Avatar";

const AVATAR_EMOJI = ["🦊", "🐺", "🦁", "🐉", "🥷", "🦅", "🔥", "⚡", "👑", "💀", "🐯", "🦈", "🐲", "🦾", "⚔️", "🧠"];

interface Props {
  open: boolean;
  profile: Profile;
  supplements: Supplement[];
  email?: string;
  avatar?: string | null;
  onUpdateAccount?: (patch: { name?: string; avatar?: string | null }) => Promise<void>;
  onClose: () => void;
  onPatchProfile: (patch: Partial<Profile>) => void;
  onRemoveSupplement: (id: string) => void;
  onRestartTour: () => void;
  onReset: () => void;
  onLogout?: () => void;
}

export function SettingsModal({
  open,
  profile,
  supplements,
  email,
  avatar,
  onUpdateAccount,
  onClose,
  onPatchProfile,
  onRemoveSupplement,
  onRestartTour,
  onReset,
  onLogout,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const setAvatar = (v: string | null) => {
    onUpdateAccount?.({ avatar: v }).catch(() => {});
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await onUpdateAccount?.({ avatar: dataUrl });
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="glass flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl"
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <h2 className="font-display text-lg font-bold text-white">Настройки</h2>
                <button onClick={onClose} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/8 hover:text-white">
                  <X size={18} />
                </button>
              </header>

              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                {onUpdateAccount && (
                  <div>
                    <div className="mb-2 text-sm font-semibold text-ink-200">Аватар</div>
                    <div className="flex items-center gap-4">
                      <Avatar value={avatar} name={profile.name} size={64} ring="#2f6bff" />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={busy}
                          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-ink-200 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                          Загрузить фото
                        </button>
                        {avatar && (
                          <button
                            onClick={() => setAvatar(null)}
                            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-ink-300 transition hover:bg-white/10"
                          >
                            <X size={15} /> Убрать
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickFile(e.target.files?.[0])}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-8 gap-1.5">
                      {AVATAR_EMOJI.map((em) => (
                        <button
                          key={em}
                          onClick={() => setAvatar(em)}
                          className={`flex aspect-square items-center justify-center rounded-lg text-xl transition ${
                            avatar === em ? "bg-sys-blue/30 ring-1 ring-sys-cyan" : "bg-white/4 hover:bg-white/10"
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink-200">Имя / позывной</label>
                  <input
                    value={profile.name}
                    onChange={(e) => onPatchProfile({ name: e.target.value })}
                    onBlur={(e) => onUpdateAccount?.({ name: e.target.value.trim() || "Охотник" }).catch(() => {})}
                    className="input"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-ink-200">Делиться успехами</div>
                    <div className="text-xs text-ink-400">Публиковать достижения и ранги в общей ленте</div>
                  </div>
                  <button
                    onClick={() => onPatchProfile({ feedEnabled: !profile.feedEnabled })}
                    className={`relative h-7 w-12 rounded-full transition ${profile.feedEnabled ? "bg-emerald-500" : "bg-white/12"}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${profile.feedEnabled ? "left-[1.55rem]" : "left-0.5"}`} />
                  </button>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-ink-200">Ранги System</div>
                  <div className="flex flex-wrap gap-1.5">
                    {RANKS.map((r) => (
                      <div
                        key={r}
                        className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-display text-sm font-black"
                        style={{ color: RANK_HEX[r], boxShadow: `inset 0 0 0 1px ${RANK_HEX[r]}44`, background: `${RANK_HEX[r]}12` }}
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                {supplements.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-semibold text-ink-200">Мои добавки</div>
                    <div className="flex flex-wrap gap-2">
                      {supplements.map((s) => (
                        <span key={s.id} className="group flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-ink-300 ring-1 ring-white/10">
                          {s.emoji && <span>{s.emoji}</span>}
                          {s.name}
                          <button onClick={() => onRemoveSupplement(s.id)} className="text-ink-600 transition hover:text-rose-300">
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {email && (
                  <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-ink-500">Аккаунт</div>
                      <div className="truncate text-sm text-ink-200">{email}</div>
                    </div>
                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-ink-200 transition hover:bg-white/10"
                      >
                        <LogOut size={15} /> Выйти
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 border-t border-white/8 pt-4">
                  <button
                    onClick={onRestartTour}
                    className="flex w-full items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-ink-200 transition hover:bg-white/10"
                  >
                    <Sparkles size={16} className="text-amber-300" /> Показать приветствие снова
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Сбросить все данные, привычки, дневники и поля?")) {
                        onReset();
                        onClose();
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
                  >
                    <RotateCcw size={16} /> Сбросить всё
                    <Trash2 size={14} className="ml-auto opacity-50" />
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
