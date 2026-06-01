import type {
  AchievementDef,
  CategoryKey,
  GearItem,
  GearSlot,
  Quest,
  QuestPeriod,
  Rarity,
} from "../types";

export interface CategoryMeta {
  key: CategoryKey;
  /** Название категории */
  name: string;
  /** Имя характеристики (стат) */
  stat: string;
  short: string;
  icon: string;
  hex: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "sport", name: "Спорт", stat: "Сила", short: "STR", icon: "⚔️", hex: "#22d3ee" },
  { key: "money", name: "Деньги", stat: "Богатство", short: "WLT", icon: "💰", hex: "#f5b942" },
  { key: "social", name: "Социум", stat: "Влияние", short: "FAM", icon: "🔥", hex: "#a855f7" },
  { key: "relations", name: "Отношения", stat: "Сердце", short: "HRT", icon: "💗", hex: "#fb5c8a" },
  { key: "intellect", name: "Интеллект", stat: "Разум", short: "INT", icon: "🧠", hex: "#3b82f6" },
];

export const CAT_MAP: Record<CategoryKey, CategoryMeta> = CATEGORIES.reduce(
  (a, c) => ((a[c.key] = c), a),
  {} as Record<CategoryKey, CategoryMeta>,
);

export const SLOTS: { slot: GearSlot; name: string; icon: string }[] = [
  { slot: "weapon", name: "Оружие", icon: "🗡️" },
  { slot: "armor", name: "Броня", icon: "🛡️" },
  { slot: "helm", name: "Шлем", icon: "⛑️" },
  { slot: "boots", name: "Сапоги", icon: "🥾" },
  { slot: "artifact", name: "Артефакт", icon: "💎" },
];

export const RARITY: Record<Rarity, { name: string; hex: string }> = {
  common: { name: "Обычное", hex: "#94a3b8" },
  rare: { name: "Редкое", hex: "#38bdf8" },
  epic: { name: "Эпическое", hex: "#a855f7" },
  legendary: { name: "Легендарное", hex: "#f5b942" },
};

/** Суммарный XP, нужный для достижения уровня L */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let t = 0;
  for (let l = 2; l <= level; l++) t += 80 + (l - 1) * 40;
  return t;
}

export function levelFromXp(xp: number): number {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
}

export interface LevelProgress {
  level: number;
  inLevel: number;
  span: number;
  pct: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - start;
  const inLevel = xp - start;
  return { level, inLevel, span, pct: span > 0 ? Math.min(100, Math.round((inLevel / span) * 100)) : 100 };
}

export const RANKS = ["E", "D", "C", "B", "A", "S", "SS", "SSS"] as const;
export type HunterRank = (typeof RANKS)[number];

export function rankFromTotalLevel(total: number): HunterRank {
  const idx = Math.min(RANKS.length - 1, Math.floor(total / 6));
  return RANKS[idx];
}

export const RANK_HEX: Record<HunterRank, string> = {
  E: "#94a3b8",
  D: "#5eead4",
  C: "#38bdf8",
  B: "#3b82f6",
  A: "#a855f7",
  S: "#f5b942",
  SS: "#fb5c8a",
  SSS: "#f43f5e",
};

export interface Stats {
  /** Базовый уровень категории */
  base: Record<CategoryKey, number>;
  /** Бонус от экипировки */
  bonus: Record<CategoryKey, number>;
  /** Итог */
  total: Record<CategoryKey, number>;
  totalLevel: number;
  power: number;
}

export function computeStats(
  categoryXp: Record<CategoryKey, number>,
  inventory: GearItem[],
  equipped: Partial<Record<GearSlot, string>>,
): Stats {
  const base = {} as Record<CategoryKey, number>;
  const bonus = {} as Record<CategoryKey, number>;
  const total = {} as Record<CategoryKey, number>;
  CATEGORIES.forEach((c) => {
    base[c.key] = levelFromXp(categoryXp[c.key] ?? 0);
    bonus[c.key] = 0;
  });
  Object.values(equipped).forEach((gid) => {
    const g = inventory.find((i) => i.id === gid);
    if (!g) return;
    (Object.keys(g.stats) as CategoryKey[]).forEach((k) => {
      bonus[k] = (bonus[k] ?? 0) + (g.stats[k] ?? 0);
    });
  });
  let totalLevel = 0;
  let power = 0;
  CATEGORIES.forEach((c) => {
    total[c.key] = base[c.key] + bonus[c.key];
    totalLevel += base[c.key];
    power += total[c.key];
  });
  return { base, bonus, total, totalLevel, power: power * 10 };
}

// ——— Периоды квестов ———

export function dayKeyNow(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function weekKeyNow(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function periodKey(period: QuestPeriod): string {
  return period === "daily" ? dayKeyNow() : weekKeyNow();
}

export function isQuestDone(quest: Quest): boolean {
  return quest.completions.includes(periodKey(quest.period));
}

// ——— Шаблоны квестов ———

export interface QuestTemplate {
  title: string;
  category: CategoryKey;
  period: QuestPeriod;
  xp: number;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { title: "Тренировка 30 мин", category: "sport", period: "daily", xp: 40 },
  { title: "10 000 шагов", category: "sport", period: "daily", xp: 30 },
  { title: "Растяжка", category: "sport", period: "daily", xp: 15 },
  { title: "Контроль расходов", category: "money", period: "daily", xp: 20 },
  { title: "Час обучения навыку", category: "money", period: "daily", xp: 35 },
  { title: "Написать 3 людям", category: "social", period: "daily", xp: 20 },
  { title: "Новый контакт", category: "social", period: "daily", xp: 30 },
  { title: "Чтение 20 страниц", category: "intellect", period: "daily", xp: 30 },
  { title: "Без соцсетей до обеда", category: "intellect", period: "daily", xp: 25 },
  { title: "Качественное время с близким", category: "relations", period: "daily", xp: 35 },
  { title: "Звонок родителям", category: "relations", period: "daily", xp: 25 },
  { title: "3 силовые тренировки", category: "sport", period: "weekly", xp: 120 },
  { title: "Пробежка 10 км", category: "sport", period: "weekly", xp: 90 },
  { title: "Отложить 10% дохода", category: "money", period: "weekly", xp: 150 },
  { title: "Прочесть книгу", category: "intellect", period: "weekly", xp: 140 },
  { title: "Встреча с друзьями", category: "social", period: "weekly", xp: 100 },
  { title: "Свидание / семейный вечер", category: "relations", period: "weekly", xp: 110 },
];

// ——— Ачивки ———

function gear(
  name: string,
  slot: GearSlot,
  rarity: Rarity,
  icon: string,
  stats: Partial<Record<CategoryKey, number>>,
): Omit<GearItem, "id"> {
  return { name, slot, rarity, icon, stats, source: "Достижение" };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "sport2", category: "sport", level: 2, title: "Первый пот", desc: "Сила 2 ур.", reward: gear("Напульсники силы", "armor", "rare", "🦾", { sport: 3 }) },
  { id: "sport5", category: "sport", level: 5, title: "Зверь", desc: "Сила 5 ур.", reward: gear("Клинок зверя", "weapon", "epic", "🗡️", { sport: 6, relations: 1 }) },
  { id: "sport10", category: "sport", level: 10, title: "Монарх тела", desc: "Сила 10 ур.", reward: gear("Доспех Монарха", "armor", "legendary", "🛡️", { sport: 12, social: 3 }) },
  { id: "money2", category: "money", level: 2, title: "Первый рубль", desc: "Богатство 2 ур.", reward: gear("Кольцо удачи", "artifact", "rare", "💍", { money: 3 }) },
  { id: "money5", category: "money", level: 5, title: "Инвестор", desc: "Богатство 5 ур.", reward: gear("Корона торговца", "helm", "epic", "👑", { money: 6, intellect: 2 }) },
  { id: "money10", category: "money", level: 10, title: "Магнат", desc: "Богатство 10 ур.", reward: gear("Сокровище дракона", "artifact", "legendary", "🐉", { money: 12, social: 4 }) },
  { id: "social2", category: "social", level: 2, title: "Заметный", desc: "Влияние 2 ур.", reward: gear("Плащ обаяния", "armor", "rare", "🧥", { social: 3 }) },
  { id: "social5", category: "social", level: 5, title: "Лидер", desc: "Влияние 5 ур.", reward: gear("Маска лидера", "helm", "epic", "🎭", { social: 6, relations: 2 }) },
  { id: "social10", category: "social", level: 10, title: "Легенда сцены", desc: "Влияние 10 ур.", reward: gear("Венец славы", "helm", "legendary", "🌟", { social: 12, money: 3 }) },
  { id: "relations2", category: "relations", level: 2, title: "Тепло", desc: "Сердце 2 ур.", reward: gear("Амулет тепла", "artifact", "rare", "🧿", { relations: 3 }) },
  { id: "relations5", category: "relations", level: 5, title: "Опора", desc: "Сердце 5 ур.", reward: gear("Щит верности", "armor", "epic", "💞", { relations: 6, sport: 2 }) },
  { id: "relations10", category: "relations", level: 10, title: "Душа компании", desc: "Сердце 10 ур.", reward: gear("Сердце вечности", "artifact", "legendary", "❤️‍🔥", { relations: 12, social: 4 }) },
  { id: "intellect2", category: "intellect", level: 2, title: "Любопытство", desc: "Разум 2 ур.", reward: gear("Очки мудреца", "helm", "rare", "🤓", { intellect: 3 }) },
  { id: "intellect5", category: "intellect", level: 5, title: "Стратег", desc: "Разум 5 ур.", reward: gear("Жезл знаний", "weapon", "epic", "📘", { intellect: 6, money: 2 }) },
  { id: "intellect10", category: "intellect", level: 10, title: "Мудрец", desc: "Разум 10 ур.", reward: gear("Гримуар Монарха", "weapon", "legendary", "📖", { intellect: 12, money: 4 }) },
];

export const SYSTEM_QUOTES = [
  "«Я левелюсь в одиночку.»",
  "Стань сильнее. Или останься слабым.",
  "Система ждёт твоего хода, Охотник.",
  "Каждый квест — ступень к рангу S.",
  "Дисциплина пробуждает Монарха внутри.",
  "Подземелье жизни не пройти, стоя на месте.",
];

export function systemQuote(): string {
  const d = new Date();
  return SYSTEM_QUOTES[(d.getFullYear() + d.getMonth() * 31 + d.getDate()) % SYSTEM_QUOTES.length];
}
