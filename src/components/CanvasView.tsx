import { useRef, useState } from "react";
import { Link2, Maximize, Minus, Plus, Trash2, X } from "lucide-react";
import type { CanvasData, CanvasNode } from "../types";

interface Props {
  canvas: CanvasData;
  onAddNode: (node: Omit<CanvasNode, "id">) => void;
  onUpdateNode: (id: string, patch: Partial<CanvasNode>) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (from: string, to: string) => void;
  onRemoveEdge: (id: string) => void;
}

const COLORS = ["#2f6bff", "#22d3ee", "#a855f7", "#fb5c8a", "#f5b942", "#34d399"];
const MIN_SCALE = 0.35;
const MAX_SCALE = 2.5;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type Pt = { x: number; y: number };

export function CanvasView({ canvas, onAddNode, onUpdateNode, onRemoveNode, onAddEdge, onRemoveEdge }: Props) {
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, Pt>>(new Map());
  const pendingNode = useRef<string | null>(null);
  const mode = useRef<"none" | "pan" | "node" | "pinch">("none");
  const dragNode = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number } | null>(null);
  const panStart = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number; mid: Pt; pan: Pt } | null>(null);

  const rectOf = () => wrapRef.current?.getBoundingClientRect();
  const rel = (e: { clientX: number; clientY: number }): Pt => {
    const r = rectOf();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };

  const addNode = () => {
    const r = rectOf();
    const cx = (((r?.width ?? 600) / 2 - pan.x) / scale) | 0;
    const cy = (((r?.height ?? 400) / 2 - pan.y) / scale) | 0;
    onAddNode({
      x: cx - 90 + (Math.random() * 60 - 30),
      y: cy - 45 + (Math.random() * 60 - 30),
      w: 180,
      h: 92,
      text: "Новая идея",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  };

  const zoomAt = (p: Pt, next: number) => {
    const ns = clamp(next, MIN_SCALE, MAX_SCALE);
    setPan((prev) => ({ x: p.x - ((p.x - prev.x) * ns) / scale, y: p.y - ((p.y - prev.y) * ns) / scale }));
    setScale(ns);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomAt(rel(e), scale * (e.deltaY < 0 ? 1.12 : 0.89));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      mode.current = "pinch";
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale,
        mid: rel({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }),
        pan,
      };
      dragNode.current = null;
      panStart.current = null;
      return;
    }

    if (connectFrom) return;

    if (pendingNode.current) {
      const n = canvas.nodes.find((x) => x.id === pendingNode.current);
      if (n) {
        mode.current = "node";
        dragNode.current = { id: n.id, ox: n.x, oy: n.y, sx: e.clientX, sy: e.clientY };
      }
      pendingNode.current = null;
      return;
    }

    mode.current = "pan";
    panStart.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (mode.current === "pinch" && pinchStart.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = rel({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      const ps = pinchStart.current;
      const ns = clamp((ps.scale * dist) / ps.dist, MIN_SCALE, MAX_SCALE);
      setScale(ns);
      setPan({
        x: mid.x - ((ps.mid.x - ps.pan.x) * ns) / ps.scale,
        y: mid.y - ((ps.mid.y - ps.pan.y) * ns) / ps.scale,
      });
      return;
    }

    if (mode.current === "node" && dragNode.current) {
      const d = dragNode.current;
      onUpdateNode(d.id, { x: d.ox + (e.clientX - d.sx) / scale, y: d.oy + (e.clientY - d.sy) / scale });
      return;
    }

    if (mode.current === "pan" && panStart.current) {
      const p = panStart.current;
      setPan({ x: p.ox + (e.clientX - p.sx), y: p.oy + (e.clientY - p.sy) });
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      mode.current = "none";
      dragNode.current = null;
      panStart.current = null;
    }
  };

  const center = (n: CanvasNode): Pt => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });
  // точка на границе прямоугольника узла в направлении from
  const edgePoint = (from: Pt, n: CanvasNode): Pt => {
    const c = center(n);
    const dx = from.x - c.x;
    const dy = from.y - c.y;
    if (dx === 0 && dy === 0) return c;
    const hw = n.w / 2 + 4;
    const hh = n.h / 2 + 4;
    const sx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
    const sy = dy !== 0 ? hh / Math.abs(dy) : Infinity;
    const s = Math.min(sx, sy);
    return { x: c.x + dx * s, y: c.y + dy * s };
  };

  const handleNodeClick = (n: CanvasNode) => {
    if (connectFrom && connectFrom !== n.id) {
      onAddEdge(connectFrom, n.id);
      setConnectFrom(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wider text-ink-100 glow-text">Карта идей</h2>
          <p className="text-sm text-ink-400">
            {connectFrom
              ? "Кликни по узлу, чтобы соединить стрелкой"
              : "Тяни фон — двигай. Колесо или щипок — масштаб. Тяни шапку — двигай узел."}
          </p>
        </div>
        <button onClick={addNode} className="btn-sys flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm">
          <Plus size={16} /> Узел
        </button>
      </div>

      <div
        ref={wrapRef}
        className="sys-panel relative h-[68vh] touch-none overflow-hidden"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{ cursor: mode.current === "pan" ? "grabbing" : "grab" }}
      >
        <div className="scanline" />

        {/* Зум-контролы */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => zoomAt(rel({ clientX: (rectOf()?.left ?? 0) + (rectOf()?.width ?? 0) / 2, clientY: (rectOf()?.top ?? 0) + (rectOf()?.height ?? 0) / 2 }), scale * 1.2)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-ink-900/80 text-ink-200 hover:text-white">
            <Plus size={16} />
          </button>
          <button onClick={() => zoomAt(rel({ clientX: (rectOf()?.left ?? 0) + (rectOf()?.width ?? 0) / 2, clientY: (rectOf()?.top ?? 0) + (rectOf()?.height ?? 0) / 2 }), scale * 0.83)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-ink-900/80 text-ink-200 hover:text-white">
            <Minus size={16} />
          </button>
          <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-ink-900/80 text-ink-200 hover:text-white" title="Сброс">
            <Maximize size={15} />
          </button>
        </div>
        <div className="absolute left-3 top-3 z-20 rounded-md bg-ink-900/70 px-2 py-1 font-display text-xs tabular-nums text-ink-400">
          {Math.round(scale * 100)}%
        </div>

        {/* Трансформируемый слой */}
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          <svg className="pointer-events-none absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="8" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                <path d="M0,0 L10,5 L0,10 z" fill="#8ab4ff" />
              </marker>
            </defs>
            {canvas.edges.map((e) => {
              const a = canvas.nodes.find((n) => n.id === e.from);
              const b = canvas.nodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              const pa = edgePoint(center(b), a);
              const pb = edgePoint(center(a), b);
              return (
                <g key={e.id}>
                  <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#8ab4ff" strokeWidth={2} markerEnd="url(#arrow)" opacity={0.8} />
                  <circle
                    className="pointer-events-auto cursor-pointer"
                    cx={(pa.x + pb.x) / 2}
                    cy={(pa.y + pb.y) / 2}
                    r={8}
                    fill="#0a1022"
                    stroke="#fb5c8a"
                    strokeWidth={1.5}
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      onRemoveEdge(e.id);
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {canvas.nodes.map((n) => {
            const linking = connectFrom === n.id;
            return (
              <div
                key={n.id}
                onClick={() => handleNodeClick(n)}
                className="absolute rounded-xl border bg-ink-900/90 shadow-lg"
                style={{
                  left: n.x,
                  top: n.y,
                  width: n.w,
                  minHeight: n.h,
                  borderColor: linking ? "#fff" : n.color,
                  boxShadow: `0 0 22px -6px ${n.color}, 0 10px 30px -16px #000`,
                }}
              >
                <div
                  className="flex cursor-grab items-center justify-between rounded-t-xl px-2 py-1"
                  style={{ background: `${n.color}33` }}
                  onPointerDown={() => {
                    pendingNode.current = n.id;
                  }}
                >
                  <span className="flex gap-1">
                    {COLORS.slice(0, 4).map((c) => (
                      <button
                        key={c}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateNode(n.id, { color: c });
                        }}
                        className="h-3 w-3 rounded-full"
                        style={{ background: c, outline: n.color === c ? "1px solid #fff" : "none" }}
                      />
                    ))}
                  </span>
                  <span className="flex gap-1">
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConnectFrom(linking ? null : n.id);
                      }}
                      className={`rounded p-0.5 ${linking ? "bg-white text-ink-900" : "text-ink-300 hover:text-white"}`}
                      title="Соединить"
                    >
                      <Link2 size={13} />
                    </button>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveNode(n.id);
                      }}
                      className="rounded p-0.5 text-ink-400 hover:text-rose-300"
                    >
                      <X size={13} />
                    </button>
                  </span>
                </div>
                <textarea
                  value={n.text}
                  onChange={(e) => onUpdateNode(n.id, { text: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full resize-none border-0 bg-transparent p-2 text-sm text-ink-100 outline-none"
                  rows={2}
                />
              </div>
            );
          })}
        </div>

        {canvas.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-ink-600">
            <Plus size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Создай первый узел и начни строить схему</p>
          </div>
        )}
      </div>

      {canvas.edges.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <Trash2 size={12} /> Клик по розовой точке на линии удаляет стрелку
        </p>
      )}
    </div>
  );
}
