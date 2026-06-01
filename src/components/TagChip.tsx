import type { TagKey, TagLevel } from "../types";
import { TAG_MAP } from "../lib/tags";

interface Props {
  tag: TagKey;
  level?: TagLevel;
  size?: "sm" | "md";
}

export function TagChip({ tag, level = 1, size = "sm" }: Props) {
  const cfg = TAG_MAP[tag];
  const plus = level === 2;
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md font-semibold ring-1 ${pad} ${cfg.bg} ${cfg.text} ${cfg.ring}`}
      title={`${cfg.label}${plus ? " — отлично!" : ""}`}
    >
      {cfg.short}
      {plus && <span className="opacity-90">+</span>}
    </span>
  );
}
