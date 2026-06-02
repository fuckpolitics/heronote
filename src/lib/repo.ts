import type { AppState } from "../types";
import { createInitialState, STATE_VERSION } from "../data/factory";

/**
 * Абстракция доступа к данным. Сейчас реализована на localStorage,
 * но интерфейс асинхронный — чтобы позже без изменений в UI подменить
 * реализацию на REST/GraphQL/Supabase и т.п.
 *
 * Пример будущей реализации:
 *   class ApiRepository implements Repository {
 *     async load() { return (await fetch('/api/state')).json(); }
 *     async save(s) { await fetch('/api/state', { method:'PUT', body: JSON.stringify(s) }); }
 *   }
 */
export interface Repository {
  load(): Promise<AppState>;
  save(state: AppState): Promise<void>;
}

const KEY = "sololeveling.v4";

export function migrate(raw: Partial<AppState> | null): AppState {
  const base = createInitialState();
  if (!raw || !raw.version) return base;
  // мягкое слияние — отсутствующие части берём из дефолта
  return {
    ...base,
    ...raw,
    version: STATE_VERSION,
    profile: { ...base.profile, ...raw.profile },
    fields: raw.fields?.length ? raw.fields : base.fields,
    supplements: raw.supplements ?? base.supplements,
    months: raw.months?.length ? raw.months : base.months,
    activeMonthId: raw.activeMonthId ?? base.activeMonthId,
    categoryXp: { ...base.categoryXp, ...raw.categoryXp },
    quests: raw.quests ?? base.quests,
    inventory: raw.inventory ?? base.inventory,
    equipped: raw.equipped ?? base.equipped,
    claimedAchievements: raw.claimedAchievements ?? base.claimedAchievements,
    trackers: raw.trackers ?? base.trackers,
    canvas: raw.canvas ?? base.canvas,
    diary: raw.diary ?? base.diary,
    lastReconcileDay: raw.lastReconcileDay,
    lastReconcileWeek: raw.lastReconcileWeek,
  };
}

export class LocalRepository implements Repository {
  async load(): Promise<AppState> {
    // имитируем сетевую задержку (как будет с реальной БД)
    await new Promise((r) => setTimeout(r, 400));
    try {
      const raw = localStorage.getItem(KEY);
      return migrate(raw ? (JSON.parse(raw) as Partial<AppState>) : null);
    } catch {
      return createInitialState();
    }
  }

  async save(state: AppState): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }

  static clear(): void {
    localStorage.removeItem(KEY);
  }
}

export const repo: Repository = new LocalRepository();
