import { useMemo, useState } from "react";
import { Plus, Trash2, Globe, Lock, Hash, X } from "lucide-react";
import type { DiaryEntry, DiaryKind } from "../types";

const TAG_RE = /#[\p{L}\p{N}_]+/gu;

/** Извлекает хэштеги (#тег) из текста, в нижнем регистре, без дублей. */
export function extractTags(text: string): string[] {
  const found = text.match(TAG_RE) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of found) {
    const tag = t.toLowerCase();
    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out;
}

interface Props {
  diary: DiaryEntry[];
  onAdd: (kind: DiaryKind, text: string, shared: boolean) => void;
  onRemove: (id: string) => void;
}

export const DIARY_KINDS: { key: DiaryKind; label: string; icon: string; hex: string; hint: string }[] = [
  { key: "victory", label: "Победы", icon: "🏆", hex: "#f5b942", hint: "Что сегодня получилось? Любая выигранная битва." },
  { key: "gratitude", label: "Благодарности", icon: "🙏", hex: "#fb5c8a", hint: "За что и кому ты благодарен сегодня?" },
  { key: "insight", label: "Инсайты", icon: "💡", hex: "#22d3ee", hint: "Мысль, открытие или урок, который стоит запомнить." },
];

const KIND_MAP = Object.fromEntries(DIARY_KINDS.map((k) => [k.key, k])) as Record<
  DiaryKind,
  (typeof DIARY_KINDS)[number]
>;

export function DiaryView({ diary, onAdd, onRemove }: Props) {
  const [kind, setKind] = useState<DiaryKind>("victory");
  const [text, setText] = useState("");
  const [shared, setShared] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const meta = KIND_MAP[kind];
  const kindEntries = useMemo(
    () => diary.filter((d) => d.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [diary, kind],
  );

  // все теги внутри текущего раздела
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of kindEntries) {
      for (const t of extractTags(e.text)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [kindEntries]);

  const entries = activeTag
    ? kindEntries.filter((e) => extractTags(e.text).includes(activeTag))
    : kindEntries;

  const submit = () => {
    if (!text.trim()) return;
    onAdd(kind, text, shared);
    setText("");
  };

  const selectKind = (k: DiaryKind) => {
    setKind(k);
    setActiveTag(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-black tracking-tight text-ink-100">Дневник</h2>
        <p className="text-sm text-ink-400">Фиксируй победы, благодарности и инсайты — это твоя летопись.</p>
      </div>

      {/* Переключатель разделов */}
      <div className="flex flex-wrap gap-2">
        {DIARY_KINDS.map((k) => {
          const on = k.key === kind;
          const count = diary.filter((d) => d.kind === k.key).length;
          return (
            <button
              key={k.key}
              onClick={() => selectKind(k.key)}
              className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition"
              style={
                on
                  ? { borderColor: k.hex, background: `${k.hex}1f`, color: "#fff", boxShadow: `0 0 18px -8px ${k.hex}` }
                  : { borderColor: "rgba(255,255,255,0.1)", color: "#b6c4e6" }
              }
            >
              <span className="text-base">{k.icon}</span>
              {k.label}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 text-xs tabular-nums"
                  style={{ background: `${k.hex}33`, color: k.hex }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Форма добавления */}
      <div className="game-card p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <span className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: meta.hex }}>
            {meta.label}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`${meta.hint}\nИспользуй #хэштеги, чтобы группировать записи.`}
          rows={3}
          className="input resize-none"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShared((s) => !s)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              shared
                ? "border-sys-cyan/50 bg-sys-cyan/10 text-sys-cyan"
                : "border-white/10 bg-white/4 text-ink-300 hover:text-ink-100"
            }`}
          >
            {shared ? <Globe size={15} /> : <Lock size={15} />}
            {shared ? "Поделиться в ленте" : "Только для меня"}
          </button>
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="btn-sys flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} /> Записать
          </button>
        </div>
      </div>

      {/* Фильтр по хэштегам */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {allTags.map(([tag, count]) => {
            const on = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(on ? null : tag)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  on
                    ? "border-sys-cyan/50 bg-sys-cyan/15 text-white"
                    : "border-white/8 bg-white/4 text-ink-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {tag}
                <span className="tabular-nums text-ink-500">{count}</span>
              </button>
            );
          })}
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-ink-400 transition hover:text-white"
            >
              <X size={12} /> сбросить
            </button>
          )}
        </div>
      )}

      {/* Список записей */}
      <div className="space-y-2.5">
        {entries.length === 0 && (
          <div className="game-card p-8 text-center text-sm text-ink-500">
            Здесь пока пусто. Первая запись в раздел «{meta.label}» ждёт тебя.
          </div>
        )}
        {entries.map((e) => (
          <div key={e.id} className="game-card card-hover group flex items-start gap-3 p-4">
            <span className="mt-0.5 text-xl">{meta.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap break-words text-sm text-ink-100">{e.text}</p>
              {extractTags(e.text).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {extractTags(e.text).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className="flex items-center gap-0.5 rounded-full bg-sys-cyan/10 px-2 py-0.5 text-xs text-sys-cyan transition hover:bg-sys-cyan/20"
                    >
                      <Hash size={10} />
                      {tag.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-500">
                <span>{new Date(e.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                {e.shared && (
                  <span className="flex items-center gap-1 text-sys-cyan">
                    <Globe size={11} /> в ленте
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(e.id)}
              className="shrink-0 rounded-lg p-1.5 text-ink-500 opacity-0 transition hover:bg-white/8 hover:text-sys-rose group-hover:opacity-100"
              title="Удалить"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
