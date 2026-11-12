import { gateControls, gateDistances, routeLengths, sharedDistance } from "../content/gates";
export type Gate = { open: boolean; closingAt: number };
export type Sheep = { id: number; lane: number; progress: number };
export type Game = {
  phase: "ready" | "out" | "regroup" | "back" | "done";
  sheep: Sheep[];
  gates: Gate[];
  lever: { gate: number; action: "open" | "close"; remaining: number } | null;
  duskProgress: number;
  time: number; score: number; waiting: number; commands: number;
};
export const SHEEP_SPACING = 64;
const STOP_OFFSET = 40;
const SPEED = 105;
export function initial(): Game {
  return { phase: "ready", sheep: [0, 1, 2, 3].map((id) => ({ id, lane: id % 2, progress: -id * SHEEP_SPACING })),
    gates: gateControls.map(() => ({ open: false, closingAt: 0 })),
    lever: null, duskProgress: 0, time: 0, score: 1000, waiting: 0, commands: 0 };
}
export function operateGate(game: Game, index: number): Game {
  if ((game.phase !== "out" && game.phase !== "back") || game.lever || !game.gates[index]) return game;
  return { ...game, lever: { gate: index, action: game.gates[index].open ? "close" : "open", remaining: 0.8 }, commands: game.commands + 1 };
}
export function tick(game: Game, dt: number): Game {
  if (game.phase === "regroup") {
    const duskProgress = Math.min(1, game.duskProgress + dt / 2.4);
    return { ...game, duskProgress, phase: duskProgress >= 1 ? "back" : "regroup" };
  }
  if (game.phase !== "out" && game.phase !== "back") return game;
  const next: Game = { ...game, time: game.time + dt, sheep: game.sheep.map((s) => ({ ...s })),
    gates: game.gates.map((g) => ({ ...g })), lever: game.lever ? { ...game.lever } : null };
  if (next.lever) {
    next.lever.remaining -= dt;
    if (next.lever.remaining <= 0) {
      const { gate, action } = next.lever;
      next.gates[gate].open = action === "open";
      if (action === "open") next.gates[gate].closingAt = next.time + 5;
      next.lever = null;
    }
  }
  const outward = next.phase === "out";
  const direction = outward ? 1 : -1;
  let waitingNow = 0;
  const group = [...next.sheep].sort((a, b) => direction * (b.progress - a.progress));
  const moved: { sheep: Sheep; waiting: boolean }[] = [];
  for (const sheep of group) {
    const before = sheep.progress;
    const destination = outward ? routeLengths[sheep.lane] - Math.floor(sheep.id / 2) * SHEEP_SPACING : -(next.sheep.length - 1) * SHEEP_SPACING;
    let target = before + direction * SPEED * dt;
    target = outward ? Math.min(destination, target) : Math.max(destination, target);
    let waiting = false;
    for (const [index, distance] of gateDistances.entries()) {
      const stop = distance - direction * STOP_OFFSET;
      if (!next.gates[index].open && direction * (before - stop) <= 0.00001 && direction * (target - stop) >= 0) {
        target = stop;
        waiting = true;
      }
    }
    // All sheep queue together before the fork, and separately in each pasture branch.
    for (const leader of moved) {
      if (leader.sheep.lane !== sheep.lane && Math.min(target, leader.sheep.progress) > sharedDistance + SHEEP_SPACING) continue;
      const limit = leader.sheep.progress - direction * SHEEP_SPACING;
      if (direction * (target - limit) > 0) {
        target = limit;
        waiting ||= leader.waiting;
      }
    }
    if (waiting) waitingNow += dt;
    sheep.progress = target;
    for (const [index, distance] of gateDistances.entries()) {
      if (next.gates[index].open && direction * (before - distance) < 0 && direction * (target - distance) >= 0) {
        next.gates[index].closingAt = next.time + 5;
      }
    }
    moved.push({ sheep, waiting });
  }
  for (const gate of next.gates) if (gate.open && next.time >= gate.closingAt) gate.open = false;
  next.waiting += waitingNow;
  next.score = Math.max(0, 1000 - Math.floor(next.waiting));
  if (outward && next.sheep.every((s) => s.progress >= routeLengths[s.lane] - Math.floor(s.id / 2) * SHEEP_SPACING - 0.00001)) {
    next.phase = "regroup"; next.lever = null;
    next.gates = next.gates.map(() => ({ open: false, closingAt: 0 }));
  }
  if (!outward && next.sheep.every((s) => s.progress <= 0.00001)) {
    next.phase = "done"; next.lever = null;
  }
  return next;
}
