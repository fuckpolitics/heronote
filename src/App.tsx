import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Dumbbell,
  Menu,
  Newspaper,
  NotebookPen,
  Package,
  Radar as RadarIcon,
  SlidersHorizontal,
  Swords,
  Workflow,
} from "lucide-react";
import type { DayEntry } from "./types";
import { useStore } from "./lib/useStore";
import { ACHIEVEMENTS, CAT_MAP, computeStats, rankFromTotalLevel, RANKS, RANK_HEX } from "./lib/rpg";
import type { Repository } from "./lib/repo";
import {
  ApiRepository,
  authApi,
  clearToken,
  feedApi,
  getToken,
  setToken,
  type AuthUser,
  type FeedDraft,
} from "./lib/api";
import { AuthScreen } from "./components/AuthScreen";
import { Avatar } from "./components/Avatar";
import { BootSplash } from "./components/BootSplash";
import { SystemHub } from "./components/SystemHub";
import { QuestsView } from "./components/QuestsView";
import { StatsView } from "./components/StatsView";
import { InventoryView } from "./components/InventoryView";
import { ProgressView } from "./components/ProgressView";
import { FeedView } from "./components/FeedView";
import { DiaryView, DIARY_KINDS } from "./components/DiaryView";
import { NavDrawer } from "./components/NavDrawer";
import { CanvasView } from "./components/CanvasView";
import { StatCards } from "./components/StatCards";
import { DayList } from "./components/DayList";
import { DayEditor } from "./components/DayEditor";
import { FieldsManager } from "./components/FieldsManager";
import { SettingsModal } from "./components/SettingsModal";
import { Onboarding } from "./components/Onboarding";
import { ScoreTrend, SleepTrend, TagFrequency } from "./components/Charts";
import { EditableNote, IdeasIcon, ObsIcon, SummaryIcon } from "./components/NotesPanels";

type View = "system" | "quests" | "stats" | "inventory" | "progress" | "feed" | "canvas" | "journal" | "diary";

// Пункты навигации (без «Система» — она открывается по аватару)
const TABS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "journal", label: "Журнал", icon: <CalendarDays size={17} /> },
  { id: "diary", label: "Дневник", icon: <NotebookPen size={17} /> },
  { id: "quests", label: "Квесты", icon: <Swords size={17} /> },
  { id: "stats", label: "Статы", icon: <RadarIcon size={17} /> },
  { id: "inventory", label: "Инвентарь", icon: <Package size={17} /> },
  { id: "progress", label: "Прогресс", icon: <Dumbbell size={17} /> },
  { id: "feed", label: "Лента", icon: <Newspaper size={17} /> },
  { id: "canvas", label: "Карта", icon: <Workflow size={17} /> },
];

const DIARY_META = Object.fromEntries(DIARY_KINDS.map((k) => [k.key, k]));

export default function App() {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  // при наличии токена проверяем его и подтягиваем пользователя
  useEffect(() => {
    let alive = true;
    if (!token) {
      setChecking(false);
      return;
    }
    setChecking(true);
    authApi
      .me(token)
      .then((u) => alive && setUser(u))
      .catch(() => {
        if (!alive) return;
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const logout = () => {
    clearToken();
    setUser(null);
    setTokenState(null);
  };

  const updateAccount = useCallback(
    async (patch: { name?: string; avatar?: string | null }) => {
      if (!token) return;
      const updated = await authApi.updateMe(token, patch);
      setUser(updated);
    },
    [token],
  );

  const repo = useMemo<Repository | null>(
    () => (token ? new ApiRepository(token, logout, user?.name) : null),
    [token, user?.name],
  );

  if (token && (checking || !user || !repo)) return <BootSplash />;

  if (!token || !user || !repo) {
    return (
      <AuthScreen
        onAuthed={(t, u) => {
          setToken(t);
          setUser(u);
          setTokenState(t);
        }}
      />
    );
  }

  // ремоунтим оболочку при смене аккаунта, чтобы стор перезагрузился
  return (
    <AppShell
      key={user.id}
      repo={repo}
      user={user}
      token={token}
      onLogout={logout}
      onUpdateAccount={updateAccount}
    />
  );
}

function AppShell({
  repo,
  user,
  token,
  onLogout,
  onUpdateAccount,
}: {
  repo: Repository;
  user: AuthUser;
  token: string;
  onLogout: () => void;
  onUpdateAccount: (patch: { name?: string; avatar?: string | null }) => Promise<void>;
}) {
  const store = useStore(repo);
  const [view, setView] = useState<View>("journal");
  const [editing, setEditing] = useState<DayEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const st = store.state;
  const stats = useMemo(
    () => (st ? computeStats(st.categoryXp, st.inventory, st.equipped) : null),
    [st],
  );

  const feedShare = st?.profile.feedEnabled ?? false;
  const postFeed = useCallback(
    (draft: FeedDraft) => {
      if (!feedShare) return;
      feedApi.post(token, draft).catch(() => {});
    },
    [token, feedShare],
  );

  // публикуем повышение ранга в общую ленту
  const prevRank = useRef<string | null>(null);
  const totalLevel = stats?.totalLevel ?? 0;
  useEffect(() => {
    if (!stats) return;
    const r = rankFromTotalLevel(stats.totalLevel);
    if (prevRank.current === null) {
      prevRank.current = r;
      return;
    }
    if (r !== prevRank.current && RANKS.indexOf(r) > RANKS.indexOf(prevRank.current as never)) {
      postFeed({
        type: "rank",
        title: `Поднялся до ранга ${r}`,
        detail: `Суммарный уровень ${stats.totalLevel}`,
        icon: "🏅",
        color: RANK_HEX[r],
      });
    }
    prevRank.current = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalLevel, postFeed]);

  const handleClaim = useCallback(
    (achId: string) => {
      const alreadyClaimed = st?.claimedAchievements.includes(achId);
      store.claimAchievement(achId);
      if (alreadyClaimed) return;
      const def = ACHIEVEMENTS.find((a) => a.id === achId);
      if (!def) return;
      const cat = CAT_MAP[def.category];
      postFeed({
        type: "achievement",
        title: `Достижение «${def.title}»`,
        detail: `Награда: ${def.reward.name}`,
        icon: cat.icon,
        color: cat.hex,
      });
    },
    [store, postFeed, st?.claimedAchievements],
  );

  const handleAddDiary = useCallback(
    (kind: "victory" | "gratitude" | "insight", text: string, shared: boolean) => {
      store.addDiaryEntry(kind, text, shared);
      if (shared) {
        const meta = DIARY_META[kind];
        // Запись из дневника публикуется по явному выбору пользователя
        feedApi
          .post(token, {
            type: "diary",
            title: text.trim().slice(0, 180),
            detail: meta?.label,
            icon: meta?.icon,
            color: meta?.hex,
          })
          .catch(() => {});
      }
    },
    [store, token],
  );

  if (!store.ready || !st || !stats || !store.active) return <BootSplash />;

  const active = store.active;
  const rank = rankFromTotalLevel(stats.totalLevel);
  const pick = (d: DayEntry) => {
    setEditing(d);
    setOpen(true);
  };

  return (
    <div className="min-h-full pb-12">
      <div className="app-bg" />

      <header className="sticky top-0 z-30 border-b border-white/8 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* Бургер — только мобильный */}
          <button
            onClick={() => setNavOpen(true)}
            title="Меню"
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-ink-200 transition hover:bg-white/10 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={() => setView("journal")}
            title="На главную (журнал)"
            className="flex min-w-0 items-center gap-3 text-left transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sys-blue to-sys-purple text-white shadow-[0_0_22px_-6px_rgba(47,107,255,0.8)] sm:h-11 sm:w-11">
              <Swords size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-black uppercase tracking-[0.18em] text-white">Heronote</h1>
              <p className="hidden text-xs text-ink-400 sm:block">
                {st.profile.name} · ранг{" "}
                <span style={{ color: RANK_HEX[rank] }} className="font-bold">
                  {rank}
                </span>{" "}
                · ур. {stats.totalLevel}
              </p>
            </div>
          </button>

          {/* Десктоп-навигация */}
          <nav className="mx-auto hidden gap-1 lg:flex">
            {TABS.map((t) => {
              const activeTab = view === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-ui text-sm font-semibold transition ${
                    activeTab ? "bg-sys-blue/20 text-white ring-1 ring-sys-blue/40" : "text-ink-400 hover:bg-white/6 hover:text-ink-100"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Аватар → страница «Система» */}
          <button
            onClick={() => setView("system")}
            title="Профиль"
            className={`ml-auto shrink-0 rounded-full transition hover:opacity-80 lg:ml-0 ${
              view === "system" ? "ring-2 ring-sys-cyan/60 ring-offset-2 ring-offset-ink-950" : ""
            }`}
          >
            <Avatar value={user.avatar} name={st.profile.name} size={38} ring={RANK_HEX[rank]} />
          </button>
        </div>
      </header>

      <NavDrawer
        open={navOpen}
        items={TABS}
        current={view}
        onSelect={(id) => setView(id as View)}
        onClose={() => setNavOpen(false)}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div className="animate-fade-in" key={view}>
          {view === "system" && (
            <SystemHub
              profile={st.profile}
              avatar={user.avatar}
              stats={stats}
              quests={st.quests}
              equipped={st.equipped}
              inventory={st.inventory}
              onToggleQuest={store.toggleQuest}
              onNav={(v) => setView(v as View)}
              onEditProfile={() => setSettingsOpen(true)}
            />
          )}

          {view === "diary" && (
            <DiaryView diary={st.diary} onAdd={handleAddDiary} onRemove={store.removeDiaryEntry} />
          )}

          {view === "quests" && (
            <QuestsView quests={st.quests} onAdd={store.addQuest} onRemove={store.removeQuest} onToggle={store.toggleQuest} />
          )}

          {view === "stats" && (
            <StatsView categoryXp={st.categoryXp} claimed={st.claimedAchievements} onClaim={handleClaim} />
          )}

          {view === "feed" && <FeedView token={token} meId={user.id} />}

          {view === "inventory" && (
            <InventoryView inventory={st.inventory} equipped={st.equipped} stats={stats} onEquip={store.equip} onUnequip={store.unequip} />
          )}

          {view === "progress" && (
            <ProgressView
              trackers={st.trackers}
              onAddTracker={store.addTracker}
              onRemoveTracker={store.removeTracker}
              onAddPoint={store.addTrackerPoint}
              onRemovePoint={store.removeTrackerPoint}
            />
          )}

          {view === "canvas" && (
            <CanvasView
              canvas={st.canvas}
              onAddNode={store.addNode}
              onUpdateNode={store.updateNode}
              onRemoveNode={store.removeNode}
              onAddEdge={store.addEdge}
              onRemoveEdge={store.removeEdge}
            />
          )}

          {view === "journal" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={st.activeMonthId}
                  onChange={(e) => store.setActiveId(e.target.value)}
                  className="input min-w-0 flex-1 cursor-pointer py-2 pr-8 text-sm font-medium sm:w-auto sm:flex-none"
                >
                  {st.months.map((m) => (
                    <option key={m.id} value={m.id} className="bg-ink-900">
                      {m.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setFieldsOpen(true)}
                  title="Настроить поля"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-ink-200 transition hover:bg-white/10"
                >
                  <SlidersHorizontal size={16} />
                  <span className="hidden sm:inline">Поля</span>
                </button>
              </div>
              <StatCards month={active} />
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <DayList days={active.days} fields={st.fields} onPick={pick} />
                </div>
                <div className="space-y-5">
                  <ScoreTrend days={active.days} />
                  <SleepTrend days={active.days} />
                  <TagFrequency days={active.days} />
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                <EditableNote title="Идеи / наблюдения" icon={IdeasIcon} value={active.ideas} placeholder="Краткие мысли, гипотезы…" onChange={(v) => store.patchMonth(active.id, { ideas: v })} />
                <EditableNote title="Наблюдения" icon={ObsIcon} value={active.observations} placeholder="Эмоции, планы, риски…" onChange={(v) => store.patchMonth(active.id, { observations: v })} />
                <EditableNote title="Итог месяца" icon={SummaryIcon} value={active.summary} placeholder="Чем запомнился месяц…" onChange={(v) => store.patchMonth(active.id, { summary: v })} />
              </div>
            </div>
          )}
        </div>

        <footer className="pt-2 text-center text-xs text-ink-600">
          Heronote · твой путь героя
        </footer>
      </main>

      <DayEditor
        open={open}
        day={editing}
        fields={st.fields}
        supplements={st.supplements}
        onAddSupplement={store.addSupplement}
        onClose={() => setOpen(false)}
        onSave={(d) => store.upsertDay(active.id, d)}
        onClear={(id) => store.clearDay(active.id, id)}
      />

      <FieldsManager
        open={fieldsOpen}
        fields={st.fields}
        onClose={() => setFieldsOpen(false)}
        onAdd={store.addField}
        onRemove={store.removeField}
        onMove={store.moveField}
        onReorder={store.reorderFields}
      />

      <SettingsModal
        open={settingsOpen}
        profile={st.profile}
        supplements={st.supplements}
        email={user.email}
        avatar={user.avatar}
        onUpdateAccount={onUpdateAccount}
        onClose={() => setSettingsOpen(false)}
        onPatchProfile={store.patchProfile}
        onRemoveSupplement={store.removeSupplement}
        onRestartTour={() => {
          store.patchProfile({ onboarded: false });
          setSettingsOpen(false);
        }}
        onReset={store.reset}
        onLogout={onLogout}
      />

      <Onboarding
        open={!st.profile.onboarded}
        name={st.profile.name}
        onFinish={() => store.patchProfile({ onboarded: true })}
      />
    </div>
  );
}
