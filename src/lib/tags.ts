import type { FieldValue, TagKey, TagValue } from "../types";

export interface TagConfig {
  key: TagKey;
  /** Короткая подпись на чипе */
  short: string;
  /** Полное название */
  label: string;
  description: string;
  /** Tailwind-классы для акцентного цвета */
  text: string;
  bg: string;
  ring: string;
  /** HEX для графиков */
  hex: string;
}

export const TAGS: TagConfig[] = [
  {
    key: "Work",
    short: "Work",
    label: "Работа / Образование",
    description: "Продуктивный день, учёба, развитие",
    text: "text-emerald-300",
    bg: "bg-emerald-500/12",
    ring: "ring-emerald-400/30",
    hex: "#34d399",
  },
  {
    key: "Tr",
    short: "Tr",
    label: "Тренировка",
    description: "Спорт, активность, движение",
    text: "text-sky-300",
    bg: "bg-sky-500/12",
    ring: "ring-sky-400/30",
    hex: "#38bdf8",
  },
  {
    key: "Dr",
    short: "Dr",
    label: "Драйв / Настроение",
    description: "Энергия, мотивация, эмоции",
    text: "text-amber-300",
    bg: "bg-amber-500/12",
    ring: "ring-amber-400/30",
    hex: "#fbbf24",
  },
  {
    key: "Soc",
    short: "Soc",
    label: "Социальное",
    description: "Общение, встречи, люди",
    text: "text-violet-300",
    bg: "bg-violet-500/12",
    ring: "ring-violet-400/30",
    hex: "#a78bfa",
  },
  {
    key: "NC",
    short: "NC",
    label: "NC",
    description: "Личное сокращение (No-code и т.п.)",
    text: "text-rose-300",
    bg: "bg-rose-500/12",
    ring: "ring-rose-400/30",
    hex: "#fb7185",
  },
  {
    key: "NP",
    short: "NP",
    label: "NP",
    description: "Личное сокращение",
    text: "text-teal-300",
    bg: "bg-teal-500/12",
    ring: "ring-teal-400/30",
    hex: "#2dd4bf",
  },
  {
    key: "PP",
    short: "ПП",
    label: "ПП",
    description: "Любое сокращение, понятное только тебе",
    text: "text-fuchsia-300",
    bg: "bg-fuchsia-500/12",
    ring: "ring-fuchsia-400/30",
    hex: "#e879f9",
  },
  {
    key: "PK",
    short: "ПК",
    label: "ПК",
    description: "Любое сокращение, понятное только тебе",
    text: "text-indigo-300",
    bg: "bg-indigo-500/12",
    ring: "ring-indigo-400/30",
    hex: "#818cf8",
  },
];

export const TAG_MAP: Record<TagKey, TagConfig> = TAGS.reduce(
  (acc, t) => ((acc[t.key] = t), acc),
  {} as Record<TagKey, TagConfig>,
);

export const TAG_KEYS = TAGS.map((t) => t.key);

export function emptyTags(): TagValue {
  return {
    Work: 0,
    Tr: 0,
    Dr: 0,
    Soc: 0,
    NC: 0,
    NP: 0,
    PP: 0,
    PK: 0,
  };
}

/** Безопасно приводит значение поля к карте тегов */
export function asTags(v: FieldValue): TagValue {
  if (v && typeof v === "object") return v as TagValue;
  return emptyTags();
}
