import type { CategoryKey, GearItem, GearSlot } from "../types";
import { CAT_MAP, RARITY, SLOTS } from "../lib/rpg";
import type { Stats } from "../lib/rpg";
import { SystemPanel } from "./SystemPanel";

interface Props {
  inventory: GearItem[];
  equipped: Partial<Record<GearSlot, string>>;
  stats: Stats;
  onEquip: (gearId: string) => void;
  onUnequip: (slot: GearSlot) => void;
}

function GearStats({ stats }: { stats: GearItem["stats"] }) {
  const keys = Object.keys(stats) as CategoryKey[];
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {keys.map((k) => (
        <span key={k} className="rounded px-1.5 text-[10px] font-bold tabular-nums" style={{ background: `${CAT_MAP[k].hex}22`, color: CAT_MAP[k].hex }}>
          +{stats[k]} {CAT_MAP[k].short}
        </span>
      ))}
    </div>
  );
}

export function InventoryView({ inventory, equipped, stats, onEquip, onUnequip }: Props) {
  const equippedIds = new Set(Object.values(equipped).filter(Boolean));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-wider text-ink-100 glow-text">Инвентарь</h2>
        <p className="text-sm text-ink-400">Экипируй снаряжение, чтобы усилить характеристики</p>
      </div>

      <SystemPanel title="Снаряжение" accent="#f5b942">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {SLOTS.map((s) => {
            const gid = equipped[s.slot];
            const item = inventory.find((i) => i.id === gid);
            return (
              <div key={s.slot} className="rounded-xl border border-white/10 bg-white/3 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-ink-500">{s.name}</div>
                {item ? (
                  <button onClick={() => onUnequip(s.slot)} className="mt-1 w-full" title="Снять">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="truncate text-xs font-semibold" style={{ color: RARITY[item.rarity].hex }}>
                      {item.name}
                    </div>
                  </button>
                ) : (
                  <div className="mt-1 flex flex-col items-center text-ink-700">
                    <div className="text-3xl opacity-30">{s.icon}</div>
                    <div className="text-[11px] text-ink-600">пусто</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="neon-divider my-4" />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(stats.total) as CategoryKey[]).map((k) => (
            <div key={k} className="rounded-lg bg-white/3 p-2 text-center">
              <div className="font-display text-xl font-black tabular-nums" style={{ color: CAT_MAP[k].hex }}>
                {stats.total[k]}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{CAT_MAP[k].short}</div>
              {stats.bonus[k] > 0 && <div className="text-[10px] text-emerald-300">+{stats.bonus[k]}</div>}
            </div>
          ))}
        </div>
      </SystemPanel>

      <SystemPanel title={`Сундук · ${inventory.length}`} accent="#22d3ee">
        {inventory.length === 0 ? (
          <div className="py-6 text-center text-sm text-ink-500">Снаряжение пусто. Выполняй достижения!</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {inventory.map((g) => {
              const r = RARITY[g.rarity];
              const isOn = equippedIds.has(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => onEquip(g.id)}
                  className="card-hover rounded-xl border bg-white/3 p-3 text-left"
                  style={{ borderColor: isOn ? r.hex : `${r.hex}33` }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{g.icon}</span>
                    {isOn && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                        надето
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 truncate text-sm font-semibold text-ink-100">{g.name}</div>
                  <div className="text-[11px]" style={{ color: r.hex }}>
                    {r.name} · {SLOTS.find((s) => s.slot === g.slot)?.name}
                  </div>
                  <GearStats stats={g.stats} />
                </button>
              );
            })}
          </div>
        )}
      </SystemPanel>
    </div>
  );
}
