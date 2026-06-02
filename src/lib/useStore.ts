import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppState,
  CanvasNode,
  CategoryKey,
  DayEntry,
  DiaryKind,
  FieldDef,
  GearSlot,
  MonthData,
  Profile,
  QuestPeriod,
  Tracker,
} from "../types";
import type { Repository } from "./repo";
import { createInitialState, createMonth } from "../data/factory";
import { uid } from "./format";
import { ACHIEVEMENTS, periodKey } from "./rpg";

export function useStore(repo: Repository) {
  const [state, setState] = useState<AppState | null>(null);
  const ready = state !== null;
  const loaded = useRef(false);

  useEffect(() => {
    let alive = true;
    repo.load().then((s) => {
      if (alive) setState(s);
    });
    return () => {
      alive = false;
    };
  }, [repo]);

  useEffect(() => {
    if (!state) return;
    if (!loaded.current) {
      loaded.current = true;
      return; // не пересохраняем сразу после загрузки
    }
    repo.save(state);
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  const active = useMemo(() => {
    if (!state) return null;
    return state.months.find((m) => m.id === state.activeMonthId) ?? state.months[0];
  }, [state]);

  // ——— Профиль ———
  const patchProfile = useCallback(
    (patch: Partial<Profile>) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
    [update],
  );

  // ——— Журнал: месяцы / дни ———
  const setActiveId = useCallback((id: string) => update((s) => ({ ...s, activeMonthId: id })), [update]);

  const patchMonth = useCallback(
    (id: string, patch: Partial<MonthData>) =>
      update((s) => ({ ...s, months: s.months.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
    [update],
  );

  const upsertDay = useCallback(
    (monthId: string, day: DayEntry) =>
      update((s) => ({
        ...s,
        months: s.months.map((m) =>
          m.id === monthId ? { ...m, days: m.days.map((d) => (d.id === day.id ? day : d)) } : m,
        ),
      })),
    [update],
  );

  const clearDay = useCallback(
    (monthId: string, dayId: string) =>
      update((s) => ({
        ...s,
        months: s.months.map((m) =>
          m.id === monthId ? { ...m, days: m.days.map((d) => (d.id === dayId ? { ...d, values: {} } : d)) } : m,
        ),
      })),
    [update],
  );

  const addMonth = useCallback(
    () =>
      update((s) => {
        let date = new Date();
        const exists = (d: Date) =>
          s.months.some((m) => m.id === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        let g = 0;
        while (exists(date) && g < 60) {
          date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
          g++;
        }
        const fresh = createMonth(date);
        return {
          ...s,
          months: [fresh, ...s.months].sort((a, b) => b.id.localeCompare(a.id)),
          activeMonthId: fresh.id,
        };
      }),
    [update],
  );

  // ——— Поля ———
  const addField = useCallback(
    (def: Omit<FieldDef, "id" | "key">) =>
      update((s) => {
        const id = uid();
        return { ...s, fields: [...s.fields, { ...def, id, key: `f_${id}` }] };
      }),
    [update],
  );
  const removeField = useCallback(
    (id: string) =>
      update((s) => {
        const target = s.fields.find((f) => f.id === id);
        if (!target || target.builtin) return s;
        return {
          ...s,
          fields: s.fields.filter((f) => f.id !== id),
          months: s.months.map((m) => ({
            ...m,
            days: m.days.map((d) => {
              const v = { ...d.values };
              delete v[target.key];
              return { ...d, values: v };
            }),
          })),
        };
      }),
    [update],
  );
  const moveField = useCallback(
    (id: string, dir: -1 | 1) =>
      update((s) => {
        const idx = s.fields.findIndex((f) => f.id === id);
        const next = idx + dir;
        if (idx < 0 || next < 0 || next >= s.fields.length) return s;
        const copy = [...s.fields];
        [copy[idx], copy[next]] = [copy[next], copy[idx]];
        return { ...s, fields: copy };
      }),
    [update],
  );
  const reorderFields = useCallback(
    (fromId: string, toId: string) =>
      update((s) => {
        const from = s.fields.findIndex((f) => f.id === fromId);
        const to = s.fields.findIndex((f) => f.id === toId);
        if (from < 0 || to < 0 || from === to) return s;
        const copy = [...s.fields];
        const [m] = copy.splice(from, 1);
        copy.splice(to, 0, m);
        return { ...s, fields: copy };
      }),
    [update],
  );

  // ——— Добавки ———
  const addSupplement = useCallback(
    (name: string, dose?: string) =>
      update((s) => {
        const clean = name.trim();
        if (!clean || s.supplements.some((x) => x.name.toLowerCase() === clean.toLowerCase())) return s;
        return { ...s, supplements: [...s.supplements, { id: uid(), name: clean, dose: dose?.trim() || undefined }] };
      }),
    [update],
  );
  const removeSupplement = useCallback(
    (id: string) => update((s) => ({ ...s, supplements: s.supplements.filter((x) => x.id !== id) })),
    [update],
  );

  // ——— Квесты ———
  const addQuest = useCallback(
    (title: string, category: CategoryKey, period: QuestPeriod, xp: number) =>
      update((s) => ({
        ...s,
        quests: [
          ...s.quests,
          { id: uid(), title: title.trim(), category, period, xp, completions: [], createdAt: new Date().toISOString() },
        ],
      })),
    [update],
  );
  const removeQuest = useCallback(
    (id: string) => update((s) => ({ ...s, quests: s.quests.filter((q) => q.id !== id) })),
    [update],
  );
  const toggleQuest = useCallback(
    (id: string) =>
      update((s) => {
        const q = s.quests.find((x) => x.id === id);
        if (!q) return s;
        const key = periodKey(q.period);
        const done = q.completions.includes(key);
        const completions = done ? q.completions.filter((k) => k !== key) : [...q.completions, key];
        const delta = done ? -q.xp : q.xp;
        return {
          ...s,
          quests: s.quests.map((x) => (x.id === id ? { ...x, completions } : x)),
          categoryXp: { ...s.categoryXp, [q.category]: Math.max(0, (s.categoryXp[q.category] ?? 0) + delta) },
        };
      }),
    [update],
  );

  // ——— Ачивки → награда в инвентарь ———
  const claimAchievement = useCallback(
    (achId: string) =>
      update((s) => {
        if (s.claimedAchievements.includes(achId)) return s;
        const def = ACHIEVEMENTS.find((a) => a.id === achId);
        if (!def) return s;
        return {
          ...s,
          claimedAchievements: [...s.claimedAchievements, achId],
          inventory: [...s.inventory, { ...def.reward, id: uid() }],
        };
      }),
    [update],
  );

  // ——— Экипировка ———
  const equip = useCallback(
    (gearId: string) =>
      update((s) => {
        const g = s.inventory.find((i) => i.id === gearId);
        if (!g) return s;
        const cur = s.equipped[g.slot];
        return { ...s, equipped: { ...s.equipped, [g.slot]: cur === gearId ? undefined : gearId } };
      }),
    [update],
  );
  const unequip = useCallback(
    (slot: GearSlot) => update((s) => ({ ...s, equipped: { ...s.equipped, [slot]: undefined } })),
    [update],
  );

  // ——— Трекеры (тело / упражнения) ———
  const addTracker = useCallback(
    (t: Omit<Tracker, "id" | "log">) => update((s) => ({ ...s, trackers: [...s.trackers, { ...t, id: uid(), log: [] }] })),
    [update],
  );
  const removeTracker = useCallback(
    (id: string) => update((s) => ({ ...s, trackers: s.trackers.filter((t) => t.id !== id) })),
    [update],
  );
  const addTrackerPoint = useCallback(
    (trackerId: string, value: number, date?: string) =>
      update((s) => ({
        ...s,
        trackers: s.trackers.map((t) =>
          t.id === trackerId
            ? {
                ...t,
                log: [...t.log, { id: uid(), date: date ?? new Date().toISOString().slice(0, 10), value }].sort((a, b) =>
                  a.date.localeCompare(b.date),
                ),
              }
            : t,
        ),
      })),
    [update],
  );
  const removeTrackerPoint = useCallback(
    (trackerId: string, pointId: string) =>
      update((s) => ({
        ...s,
        trackers: s.trackers.map((t) =>
          t.id === trackerId ? { ...t, log: t.log.filter((p) => p.id !== pointId) } : t,
        ),
      })),
    [update],
  );

  // ——— Канвас ———
  const addNode = useCallback(
    (node: Omit<CanvasNode, "id">) =>
      update((s) => ({ ...s, canvas: { ...s.canvas, nodes: [...s.canvas.nodes, { ...node, id: uid() }] } })),
    [update],
  );
  const updateNode = useCallback(
    (id: string, patch: Partial<CanvasNode>) =>
      update((s) => ({
        ...s,
        canvas: { ...s.canvas, nodes: s.canvas.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) },
      })),
    [update],
  );
  const removeNode = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        canvas: {
          nodes: s.canvas.nodes.filter((n) => n.id !== id),
          edges: s.canvas.edges.filter((e) => e.from !== id && e.to !== id),
        },
      })),
    [update],
  );
  const addEdge = useCallback(
    (from: string, to: string) =>
      update((s) => {
        if (from === to || s.canvas.edges.some((e) => e.from === from && e.to === to)) return s;
        return { ...s, canvas: { ...s.canvas, edges: [...s.canvas.edges, { id: uid(), from, to }] } };
      }),
    [update],
  );
  const removeEdge = useCallback(
    (id: string) =>
      update((s) => ({ ...s, canvas: { ...s.canvas, edges: s.canvas.edges.filter((e) => e.id !== id) } })),
    [update],
  );

  // ——— Дневник ———
  const addDiaryEntry = useCallback(
    (kind: DiaryKind, text: string, shared: boolean) =>
      update((s) => {
        const clean = text.trim();
        if (!clean) return s;
        return {
          ...s,
          diary: [
            { id: uid(), kind, text: clean, createdAt: new Date().toISOString(), shared },
            ...s.diary,
          ],
        };
      }),
    [update],
  );
  const removeDiaryEntry = useCallback(
    (id: string) => update((s) => ({ ...s, diary: s.diary.filter((d) => d.id !== id) })),
    [update],
  );

  const reset = useCallback(() => {
    const fresh = createInitialState();
    fresh.profile.onboarded = false;
    repo.save(fresh);
    setState(fresh);
  }, [repo]);

  return {
    ready,
    state,
    active,
    patchProfile,
    setActiveId,
    patchMonth,
    upsertDay,
    clearDay,
    addMonth,
    addField,
    removeField,
    moveField,
    reorderFields,
    addSupplement,
    removeSupplement,
    addQuest,
    removeQuest,
    toggleQuest,
    claimAchievement,
    equip,
    unequip,
    addTracker,
    removeTracker,
    addTrackerPoint,
    removeTrackerPoint,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    addDiaryEntry,
    removeDiaryEntry,
    reset,
  };
}
