import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Check, ChevronRight, Flame, Quote, Swords } from "lucide-react";
import type { CategoryKey, GearSlot, GearItem, Profile, Quest } from "../types";
import {
  CATEGORIES,
  CAT_MAP,
  RANK_HEX,
  SLOTS,
  isQuestDone,
  rankFromTotalLevel,
  systemQuote,
} from "../lib/rpg";
import type { Stats } from "../lib/rpg";
import { SystemPanel, StatBar } from "./SystemPanel";
import { Avatar } from "./Avatar";

interface Props {
  profile: Profile;
  avatar?: string | null;
  stats: Stats;
  quests: Quest[];
  equipped: Partial<Record<GearSlot, string>>;
  inventory: GearItem[];
  onToggleQuest: (id: string) => void;
  onNav: (view: string) => void;
}

export function SystemHub({ profile, avatar, stats, quests, equipped, inventory, onToggleQuest, onNav }: Props) {
  const rank = rankFromTotalLevel(stats.totalLevel);
  const rankHex = RANK_HEX[rank];
  const daily = quests.filter((q) => q.period === "daily");
  const weekly = quests.filter((q) => q.period === "weekly");
  const dailyDone = daily.filter(isQuestDone).length;
  const weeklyDone = weekly.filter(isQuestDone).length;

  const radarData = CATEGORIES.map((c) => ({ stat: c.short, value: stats.total[c.key], full: c.name }));

  return (
    <div className="space-y-5">
      {/* Карточка охотника */}
      <div className="sys-panel relative overflow-hidden p-5 sm:p-6">
        <div className="scanline" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl font-display"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${rankHex}33, transparent 70%)`,
                border: `2px solid ${rankHex}`,
                boxShadow: `0 0 40px -8px ${rankHex}`,
              }}
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-300">Ранг</span>
              <span className="text-4xl font-black" style={{ color: rankHex, textShadow: `0 0 18px ${rankHex}` }}>
                {rank}
              </span>
            </div>
            <Avatar value={avatar} name={profile.name} size={64} ring={rankHex} className="hidden sm:block" />
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-sys-cyan">Охотник</div>
              <h1 className="font-display text-2xl font-black text-ink-100 sm:text-3xl">{profile.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-ink-300">
                <span className="flex items-center gap-1">
                  <Swords size={14} className="text-sys-blue" /> Ур. {stats.totalLevel}
                </span>
                <span className="flex items-center gap-1 font-display font-bold text-sys-gold">
                  <Flame size={14} /> {stats.power} PWR
                </span>
              </div>
            </div>
          </div>

          <div className="hidden h-20 w-px bg-white/10 sm:block" />

          <div className="grid flex-1 grid-cols-5 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => onNav("stats")} className="rounded-lg bg-white/4 p-2 text-center transition hover:bg-white/8">
                <div className="text-lg">{c.icon}</div>
                <div className="font-display text-xl font-black tabular-nums" style={{ color: c.hex }}>
                  {stats.total[c.key]}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-ink-500">{c.short}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2">
          <Quote size={15} className="shrink-0 text-sys-purple" />
          <p className="font-ui text-sm italic text-ink-200">{systemQuote()}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Радар */}
        <SystemPanel title="Профиль силы" accent="#2f6bff">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#2a3a66" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: "#b6c4e6", fontSize: 12, fontWeight: 700 }} />
                <Radar dataKey="value" stroke="#38bdf8" fill="#2f6bff" fillOpacity={0.45} isAnimationActive={false} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {SLOTS.map((s) => {
              const item = inventory.find((i) => i.id === equipped[s.slot]);
              return (
                <button key={s.slot} onClick={() => onNav("inventory")} className="rounded-lg bg-white/4 p-1.5 text-center transition hover:bg-white/8" title={item ? item.name : s.name}>
                  <div className="text-xl">{item ? item.icon : <span className="opacity-25">{s.icon}</span>}</div>
                </button>
              );
            })}
          </div>
        </SystemPanel>

        {/* Квесты сегодня */}
        <SystemPanel
          title="Квесты дня"
          accent="#22d3ee"
          right={
            <button onClick={() => onNav("quests")} className="flex items-center gap-0.5 text-xs text-sys-cyan hover:underline">
              все <ChevronRight size={13} />
            </button>
          }
        >
          <div className="mb-3 grid grid-cols-2 gap-3">
            <ProgressPill label="Ежедневные" done={dailyDone} total={daily.length} hex="#22d3ee" />
            <ProgressPill label="Еженедельные" done={weeklyDone} total={weekly.length} hex="#a855f7" />
          </div>
          <div className="space-y-1.5">
            {daily.slice(0, 6).map((q) => {
              const cat: { hex: string } = CAT_MAP[q.category as CategoryKey];
              const done = isQuestDone(q);
              return (
                <button
                  key={q.id}
                  onClick={() => onToggleQuest(q.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
                    done ? "border-emerald-400/30 bg-emerald-500/8" : "border-white/8 bg-white/3 hover:border-white/16"
                  }`}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded border"
                    style={{ borderColor: done ? "#34d399" : `${cat.hex}55`, background: done ? "#34d399" : "transparent", color: done ? "#04060f" : "transparent" }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className={`flex-1 truncate text-sm ${done ? "text-ink-400 line-through" : "text-ink-100"}`}>{q.title}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: cat.hex }}>
                    +{q.xp}
                  </span>
                </button>
              );
            })}
            {daily.length === 0 && <p className="py-3 text-center text-sm text-ink-500">Нет ежедневных квестов</p>}
          </div>
        </SystemPanel>
      </div>
    </div>
  );
}

function ProgressPill({ label, done, total, hex }: { label: string; done: number; total: number; hex: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="rounded-lg bg-white/3 p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-400">{label}</span>
        <span className="font-display font-bold tabular-nums" style={{ color: hex }}>
          {done}/{total}
        </span>
      </div>
      <StatBar pct={pct} hex={hex} height={6} />
    </div>
  );
}
