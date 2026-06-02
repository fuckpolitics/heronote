import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, RefreshCw } from "lucide-react";
import { feedApi, FEED_REACTIONS, type FeedItem } from "../lib/api";
import { SystemPanel } from "./SystemPanel";
import { Avatar } from "./Avatar";

interface Props {
  token: string;
  meId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} дн назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const TYPE_LABEL: Record<string, string> = {
  achievement: "достижение",
  rank: "новый ранг",
  levelup: "новый уровень",
  quest: "квест",
  diary: "из дневника",
};

export function FeedView({ token, meId }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    feedApi
      .list(token, 60)
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const react = useCallback(
    (eventId: string, emoji: string) => {
      // оптимистичное обновление
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== eventId) return it;
          const mine = it.myReactions ?? [];
          const has = mine.includes(emoji);
          const reactions = { ...(it.reactions ?? {}) };
          reactions[emoji] = Math.max(0, (reactions[emoji] ?? 0) + (has ? -1 : 1));
          if (reactions[emoji] === 0) delete reactions[emoji];
          return {
            ...it,
            reactions,
            myReactions: has ? mine.filter((e) => e !== emoji) : [...mine, emoji],
          };
        }),
      );
      feedApi
        .react(token, eventId, emoji)
        .then((r) =>
          setItems((prev) =>
            prev.map((it) =>
              it.id === eventId ? { ...it, reactions: r.reactions, myReactions: r.myReactions } : it,
            ),
          ),
        )
        .catch(() => load());
    },
    [token, load],
  );

  return (
    <div className="space-y-5">
      <SystemPanel
        title="Лента героев"
        right={
          <button
            onClick={load}
            title="Обновить"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-ink-200 transition hover:bg-white/10"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Обновить</span>
          </button>
        }
      >
        <p className="text-sm text-ink-400">
          Достижения и значимые успехи всех героев. Поднимаешься в ранге, забираешь награду или
          делишься записью из дневника — об этом узнают остальные.
        </p>
      </SystemPanel>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-400">
          <Loader2 size={18} className="animate-spin" /> Загрузка ленты…
        </div>
      ) : error ? (
        <div className="py-16 text-center text-ink-400">Не удалось загрузить ленту. Попробуй обновить.</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-ink-400">
          Пока пусто. Стань первым — выполни квест или забери достижение.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it, i) => {
            const mine = it.userId === meId;
            const accent = it.color || "#2f6bff";
            return (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className={`flex items-start gap-3.5 rounded-xl border bg-white/4 p-4 ${
                  mine ? "border-sys-cyan/40" : "border-white/8"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar value={it.userAvatar} name={it.userName} size={44} ring={accent} />
                  {it.icon && (
                    <span
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
                      style={{ background: "#0a1024", boxShadow: `0 0 0 1.5px ${accent}` }}
                    >
                      {it.icon}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-white">
                      {it.userName}
                      {mine && <span className="ml-1.5 text-xs text-sys-cyan">(ты)</span>}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${accent}22`, color: accent }}
                    >
                      {TYPE_LABEL[it.type] || it.type}
                    </span>
                    <span className="ml-auto text-xs text-ink-500">{timeAgo(it.createdAt)}</span>
                  </div>
                  <div className="mt-0.5 font-medium text-ink-100">{it.title}</div>
                  {it.detail && <div className="text-sm text-ink-400">{it.detail}</div>}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {FEED_REACTIONS.map((emoji) => {
                      const count = it.reactions?.[emoji] ?? 0;
                      const active = it.myReactions?.includes(emoji) ?? false;
                      return (
                        <button
                          key={emoji}
                          onClick={() => react(it.id, emoji)}
                          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
                            active
                              ? "border-sys-cyan/50 bg-sys-cyan/15 text-white"
                              : "border-white/8 bg-white/4 text-ink-300 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <span className="text-sm leading-none">{emoji}</span>
                          {count > 0 && <span className="tabular-nums font-semibold">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
