import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  Newspaper,
  Package,
  Plus,
  Radar as RadarIcon,
  Settings,
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
import { CanvasView } from "./components/CanvasView";
import { StatCards } from "./components/StatCards";
import { DayList } from "./components/DayList";
import { DayEditor } from "./components/DayEditor";
import { FieldsManager } from "./components/FieldsManager";
import { SettingsModal } from "./components/SettingsModal";
import { Onboarding } from "./components/Onboarding";
import { ScoreTrend, SleepTrend, TagFrequency } from "./components/Charts";
import { EditableNote, IdeasIcon, ObsIcon, SummaryIcon } from "./components/NotesPanels";

type View = "system" | "quests" | "stats" | "inventory" | "progress" | "feed" | "canvas" | "journal";

const TABS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "system", label: "Система", icon: <LayoutDashboard size={17} /> },
  { id: "quests", label: "Квесты", icon: <Swords size={17} /> },
  { id: "stats", label: "Статы", icon: <RadarIcon size={17} /> },
  { id: "inventory", label: "Инвентарь", icon: <Package size={17} /> },
  { id: "progress", label: "Прогресс", icon: <Dumbbell size={17} /> },
  { id: "feed", label: "Лента", icon: <Newspaper size={17} /> },
  { id: "canvas", label: "Карта", icon: <Workflow size={17} /> },
  { id: "journal", label: "Журнал", icon: <CalendarDays size={17} /> },
];

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
  const [view, setView] = useState<View>("system");
  const [editing, setEditing] = useState<DayEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3 sm:px-6">
          <div className="mr-auto flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sys-blue to-sys-purple text-white shadow-[0_0_22px_-4px_rgba(47,107,255,0.8)]">
              <Swords size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-black uppercase tracking-[0.18em] text-white glow-text">System</h1>
              <p className="hidden text-xs text-ink-400 sm:block">
                {st.profile.name} · ранг{" "}
                <span style={{ color: RANK_HEX[rank] }} className="font-bold">
                  {rank}
                </span>{" "}
                · ур. {stats.totalLevel}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            {view === "journal" && (
              <>
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
                <button
                  onClick={store.addMonth}
                  title="Новый месяц"
                  className="btn-sys flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Месяц</span>
                </button>
              </>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              title="Профиль и аватар"
              className="shrink-0 rounded-full transition hover:opacity-80"
            >
              <Avatar value={user.avatar} name={st.profile.name} size={36} ring={RANK_HEX[rank]} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Настройки"
              className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-white/8 hover:text-white"
            >
              <Settings size={18} />
            </button>
          </div>

          <nav className="-mb-3 flex w-full gap-1 overflow-x-auto pt-1">
            {TABS.map((t) => {
              const activeTab = view === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 font-ui text-sm font-semibold uppercase tracking-wide transition ${
                    activeTab ? "border-sys-cyan text-white glow-text" : "border-transparent text-ink-400 hover:text-ink-200"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

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
            />
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
          System v4 · данные через Repository (сейчас localStorage, готово к подключению БД)
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
