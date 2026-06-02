import type {
  AchievementDef,
  AppState,
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
  // total теперь начинается с 1 (новичок). +4 сохраняет прежний темп рангов:
  // E на старте, D после первого уровня характеристики и т.д.
  const idx = Math.min(RANKS.length - 1, Math.max(0, Math.floor((total + 4) / 6)));
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
  let sumBase = 0;
  let power = 0;
  CATEGORIES.forEach((c) => {
    total[c.key] = base[c.key] + bonus[c.key];
    sumBase += base[c.key];
    power += total[c.key];
  });
  // Общий уровень Охотника: новичок = 1, дальше растёт с каждым уровнем
  // характеристики (а не сумма пяти стартовых единиц = 5).
  const totalLevel = sumBase - (CATEGORIES.length - 1);
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

/** Сдвиг ISO-даты «YYYY-MM-DD» на n дней. */
export function shiftDayKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dayKeyNow(dt);
}

/** Собирает «активные дни» (ISO-даты): заполненные дни журнала + дни с выполненными ежедневными квестами. */
export function collectActiveDates(state: AppState): Set<string> {
  const set = new Set<string>();
  for (const m of state.months) {
    for (const d of m.days) {
      if (d.values && Object.keys(d.values).length > 0) {
        set.add(`${m.id}-${String(d.day).padStart(2, "0")}`);
      }
    }
  }
  for (const q of state.quests) {
    if (q.period === "daily") for (const c of q.completions) set.add(c);
  }
  return set;
}

export interface StreakInfo {
  current: number;
  longest: number;
  /** Активен ли стрик сегодня (сегодня уже отмечен) */
  activeToday: boolean;
}

/**
 * Считает стрик по набору «активных дней» (ISO-даты).
 * Текущий стрик тянется до сегодня или вчера (день ещё можно «спасти»).
 */
export function computeStreak(activeDates: Iterable<string>): StreakInfo {
  const set = new Set(activeDates);
  if (set.size === 0) return { current: 0, longest: 0, activeToday: false };

  // самый длинный стрик
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    if (prev && shiftDayKey(prev, 1) === day) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  // текущий стрик
  const today = dayKeyNow();
  const yesterday = shiftDayKey(today, -1);
  const activeToday = set.has(today);
  let current = 0;
  let cursor = activeToday ? today : set.has(yesterday) ? yesterday : null;
  while (cursor && set.has(cursor)) {
    current++;
    cursor = shiftDayKey(cursor, -1);
  }
  return { current, longest, activeToday };
}

// ——— Штрафы за невыполненные квесты со ставкой ———

export interface PenaltyItem {
  questTitle: string;
  category: CategoryKey;
  amount: number;
  period: string;
}

export interface ReconcileResult {
  categoryXp: Record<CategoryKey, number>;
  lastReconcileDay: string;
  lastReconcileWeek: string;
  penalties: PenaltyItem[];
}

/**
 * Начисляет штрафы за пропущенные периоды по квестам со ставкой.
 * Чисто (не мутирует вход). Первый запуск (маркеры пусты) штрафов не даёт —
 * только фиксирует точку отсчёта, чтобы не наказывать за прошлое.
 */
export function reconcilePenalties(
  quests: Quest[],
  categoryXp: Record<CategoryKey, number>,
  lastReconcileDay: string | undefined,
  lastReconcileWeek: string | undefined,
): ReconcileResult {
  const xp = { ...categoryXp };
  const penalties: PenaltyItem[] = [];
  const today = dayKeyNow();
  const yesterday = shiftDayKey(today, -1);
  const curWeek = weekKeyNow();

  const dailyStaked = quests.filter((q) => q.period === "daily" && (q.stake ?? 0) > 0);
  const weeklyStaked = quests.filter((q) => q.period === "weekly" && (q.stake ?? 0) > 0);

  // Ежедневные: обрабатываем все полностью прошедшие дни после последней сверки
  if (lastReconcileDay) {
    let cursor = shiftDayKey(lastReconcileDay, 1);
    let guard = 0;
    while (cursor <= yesterday && guard < 90) {
      for (const q of dailyStaked) {
        if (!q.completions.includes(cursor)) {
          const amount = Math.min(q.stake ?? 0, xp[q.category] ?? 0);
          if (amount > 0) {
            xp[q.category] = Math.max(0, (xp[q.category] ?? 0) - amount);
            penalties.push({ questTitle: q.title, category: q.category, amount, period: cursor });
          }
        }
      }
      cursor = shiftDayKey(cursor, 1);
      guard++;
    }
  }

  // Еженедельные: штрафуем предыдущую отслеженную неделю, если она закрылась
  if (lastReconcileWeek && lastReconcileWeek !== curWeek) {
    for (const q of weeklyStaked) {
      if (!q.completions.includes(lastReconcileWeek)) {
        const amount = Math.min(q.stake ?? 0, xp[q.category] ?? 0);
        if (amount > 0) {
          xp[q.category] = Math.max(0, (xp[q.category] ?? 0) - amount);
          penalties.push({ questTitle: q.title, category: q.category, amount, period: lastReconcileWeek });
        }
      }
    }
  }

  return { categoryXp: xp, lastReconcileDay: yesterday, lastReconcileWeek: curWeek, penalties };
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
