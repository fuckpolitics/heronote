export type TagKey = "Work" | "Tr" | "Dr" | "Soc" | "NC" | "NP" | "PP" | "PK";

/** 0 — нет, 1 — было, 2 — отлично (модификатор «+») */
export type TagLevel = 0 | 1 | 2;

export type TagValue = Record<TagKey, TagLevel>;

export type FieldType =
  | "score"
  | "tags"
  | "text"
  | "number"
  | "textarea"
  | "boolean"
  | "select"
  | "sleep"
  | "supplements";

export interface FieldDef {
  id: string;
  /** Стабильный ключ для хранения значений */
  key: string;
  label: string;
  type: FieldType;
  /** Встроенное поле — нельзя удалить */
  builtin?: boolean;
  placeholder?: string;
  /** Варианты для select */
  options?: string[];
  /** Единица измерения для number (ч, кг, мг…) */
  unit?: string;
}

/** Значение поля «Сон» в стиле будильника */
export interface SleepValue {
  bed?: string; // «23:30»
  wake?: string; // «07:10»
}

export type FieldValue =
  | number
  | string
  | boolean
  | string[]
  | TagValue
  | SleepValue
  | undefined;

export interface DayEntry {
  id: string;
  /** День месяца, 1–31 */
  day: number;
  /** Метка дня недели: пн, вт, ... вс */
  weekday: string;
  values: Record<string, FieldValue>;
}

export interface HormoneLab {
  id: string;
  name: string;
  value: string;
}

export interface ControlItem {
  id: string;
  label: string;
}

export interface MonthData {
  /** «2026-06» */
  id: string;
  title: string;
  days: DayEntry[];
  ideas: string;
  observations: string;
  summary: string;
  hormones: HormoneLab[];
  control: ControlItem[];
}

// ——— Геймификация / профиль ———

export type Rank = "hippo" | "hero" | "warrior";

export interface Profile {
  name: string;
  feedEnabled: boolean;
  onboarded: boolean;
}

// ——— Добавки (быстрые кнопки) ———

export interface Supplement {
  id: string;
  name: string;
  dose?: string;
  emoji?: string;
}

// ——— Привычки ———

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Выполнено: набор ISO-дат «2026-06-07» */
  done: string[];
}

// ——— Дневники ———

export type JournalKind = "victory" | "gratitude" | "sport";

export interface JournalEntry {
  id: string;
  /** ISO-дата */
  date: string;
  text: string;
}

export type Journals = Record<JournalKind, JournalEntry[]>;

// ——— Дневник (победы / благодарности / инсайты) ———

export type DiaryKind = "victory" | "gratitude" | "insight";

export interface DiaryEntry {
  id: string;
  kind: DiaryKind;
  text: string;
  /** ISO-время создания */
  createdAt: string;
  /** Опубликовано ли в общей ленте */
  shared: boolean;
}

// ═══════════════ ИГРОВОЙ СЛОЙ (System) ═══════════════

export type CategoryKey = "sport" | "money" | "social" | "relations" | "intellect";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type GearSlot = "weapon" | "armor" | "helm" | "boots" | "artifact";

export type QuestPeriod = "daily" | "weekly";

export interface Quest {
  id: string;
  title: string;
  category: CategoryKey;
  period: QuestPeriod;
  xp: number;
  /** Ключи периодов, когда квест был выполнен: «2026-06-01» или «2026-W23» */
  completions: string[];
  createdAt: string;
}

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: Rarity;
  icon: string;
  /** Бонусы к характеристикам по категориям */
  stats: Partial<Record<CategoryKey, number>>;
  /** Источник (например, ачивка) */
  source?: string;
}

export interface AchievementDef {
  id: string;
  category: CategoryKey;
  level: number;
  title: string;
  desc: string;
  reward: Omit<GearItem, "id">;
}

export interface TrackerPoint {
  id: string;
  date: string; // ISO «2026-06-01»
  value: number;
}

export interface Tracker {
  id: string;
  name: string;
  unit: string;
  group: "body" | "exercise";
  icon: string;
  /** Лучше больше (true) или меньше (false) — для подсветки динамики */
  higherBetter: boolean;
  log: TrackerPoint[];
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
}

export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** Полное состояние приложения — единая точка сериализации для будущей БД */
export interface AppState {
  version: number;
  profile: Profile;
  // Журнал
  fields: FieldDef[];
  supplements: Supplement[];
  months: MonthData[];
  activeMonthId: string;
  // Игра
  categoryXp: Record<CategoryKey, number>;
  quests: Quest[];
  inventory: GearItem[];
  equipped: Partial<Record<GearSlot, string>>;
  claimedAchievements: string[];
  trackers: Tracker[];
  canvas: CanvasData;
  diary: DiaryEntry[];
}
