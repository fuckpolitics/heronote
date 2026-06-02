import type {
  AppState,
  CategoryKey,
  DayEntry,
  FieldDef,
  GearItem,
  MonthData,
  Profile,
  Quest,
  Supplement,
  Tracker,
} from "../types";
import { uid, WEEKDAYS } from "../lib/format";

/** Ключи встроенных полей журнала */
export const KEY_SCORE = "score";
export const KEY_TAGS = "tags";
export const KEY_SLEEP = "sleep";
export const KEY_SUPPLEMENTS = "used";

export const STATE_VERSION = 4;

export function defaultFields(): FieldDef[] {
  return [
    { id: uid(), key: KEY_SCORE, label: "Оценка дня", type: "score", builtin: true },
    { id: uid(), key: KEY_TAGS, label: "Теги", type: "tags", builtin: true },
    { id: uid(), key: KEY_SLEEP, label: "Сон", type: "sleep", builtin: true },
    { id: uid(), key: KEY_SUPPLEMENTS, label: "Что использовалось", type: "supplements", builtin: true },
    { id: uid(), key: "note", label: "Заметка", type: "textarea", builtin: true, placeholder: "Что запомнилось…" },
  ];
}

export function defaultProfile(): Profile {
  return { name: "Охотник", feedEnabled: true, onboarded: false };
}

export function defaultSupplements(): Supplement[] {
  return [
    { id: uid(), name: "Кофе", emoji: "☕" },
    { id: uid(), name: "Витамин D", dose: "2000 МЕ", emoji: "💊" },
    { id: uid(), name: "Креатин", dose: "5 г", emoji: "⚡" },
    { id: uid(), name: "Протеин", dose: "30 г", emoji: "🥤" },
  ];
}

export function defaultCategoryXp(): Record<CategoryKey, number> {
  return { sport: 0, money: 0, social: 0, relations: 0, intellect: 0 };
}

export function defaultQuests(): Quest[] {
  const now = new Date().toISOString();
  const mk = (title: string, category: CategoryKey, period: Quest["period"], xp: number): Quest => ({
    id: uid(),
    title,
    category,
    period,
    xp,
    completions: [],
    createdAt: now,
  });
  return [
    mk("Тренировка 30 минут", "sport", "daily", 40),
    mk("10 000 шагов", "sport", "daily", 30),
    mk("Без лишних трат сегодня", "money", "daily", 25),
    mk("Написать 3 людям", "social", "daily", 20),
    mk("Чтение 20 страниц", "intellect", "daily", 30),
    mk("Время с близкими", "relations", "daily", 35),
    mk("3 силовые за неделю", "sport", "weekly", 120),
    mk("Отложить 10% дохода", "money", "weekly", 150),
    mk("Прочесть книгу", "intellect", "weekly", 140),
  ];
}

export function defaultTrackers(): Tracker[] {
  const t = (name: string, unit: string, group: Tracker["group"], icon: string, higherBetter: boolean): Tracker => ({
    id: uid(),
    name,
    unit,
    group,
    icon,
    higherBetter,
    log: [],
  });
  return [
    t("Вес", "кг", "body", "⚖️", false),
    t("Грудь", "см", "body", "🫁", true),
    t("Талия", "см", "body", "📏", false),
    t("Бёдра", "см", "body", "🦵", true),
    t("Бицепс", "см", "body", "💪", true),
    t("Жим лёжа", "кг", "exercise", "🏋️", true),
    t("Подтягивания", "раз", "exercise", "🤸", true),
  ];
}

export function starterGear(): GearItem[] {
  return [
    {
      id: uid(),
      name: "Перчатки новичка",
      slot: "weapon",
      rarity: "common",
      icon: "🥊",
      stats: { sport: 2 },
      source: "Старт",
    },
    {
      id: uid(),
      name: "Кошелёк ученика",
      slot: "artifact",
      rarity: "common",
      icon: "👛",
      stats: { money: 2 },
      source: "Старт",
    },
  ];
}

function emptyDays(year: number, monthIdx: number): DayEntry[] {
  const count = new Date(year, monthIdx + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(year, monthIdx, i + 1);
    const wd = (d.getDay() + 6) % 7;
    return { id: uid(), day: i + 1, weekday: WEEKDAYS[wd], values: {} };
  });
}

export function createMonth(date = new Date()): MonthData {
  const year = date.getFullYear();
  const monthIdx = date.getMonth();
  const id = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const title = date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  return {
    id,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    days: emptyDays(year, monthIdx),
    ideas: "",
    observations: "",
    summary: "",
    hormones: [],
    control: [],
  };
}

export function createInitialState(): AppState {
  const month = createMonth();
  return {
    version: STATE_VERSION,
    profile: defaultProfile(),
    fields: defaultFields(),
    supplements: defaultSupplements(),
    months: [month],
    activeMonthId: month.id,
    categoryXp: defaultCategoryXp(),
    quests: defaultQuests(),
    inventory: starterGear(),
    equipped: {},
    claimedAchievements: [],
    trackers: defaultTrackers(),
    canvas: { nodes: [], edges: [] },
    diary: [],
  };
}
