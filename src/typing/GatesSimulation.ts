import { gateControls, routeForLevel } from "../content/gates";
import { gatesLevels, levelConfig, type GatesConfig } from "../content/gatesLevels";
export type Gate = { open: boolean; closingAt: number; trafficGroup: number | null };
/** lane is the stable group ID; progress is local to that group’s route. */
export type Sheep = { id: number; lane: number; progress: number };
export type Game = {
  config: GatesConfig;
  selectedGate: number | null;
  shiftFrom: number | null;
  phase: "ready" | "out" | "regroup" | "back" | "done";
  sheep: Sheep[];
  gates: Gate[];
  lever: { gate: number; action: "open" | "close"; remaining: number } | null;
  duskProgress: number;
  time: number; score: number; waiting: number; commands: number; assists: number;
};
export const SHEEP_SPACING = 64;
export const GATE_CLEARANCE = 40;
export function initial(config: GatesConfig = levelConfig()): Game {
  return { config: { ...config }, selectedGate: null, shiftFrom: null, phase: "ready", sheep: Array.from({ length: config.sheepCount }, (_, id) => ({ id, lane: id % 2, progress: -Math.floor(id / 2) * SHEEP_SPACING })),
    gates: gateControls.slice(0, gatesLevels[config.level - 1].gates).map(() => ({ open: false, closingAt: 0, trafficGroup: null })),
    lever: null, duskProgress: 0, time: 0, score: 1000, waiting: 0, commands: 0, assists: 0 };
}
export function activeGateCount(game: Game): number { return gatesLevels[game.config.level - 1].gates; }
/** Route-local distances cannot be compared as if both groups share a track. */
function requests(game: Game, lane: number, closedOnly: boolean) {
  if (game.phase !== "out" && game.phase !== "back") return [];
  const direction = game.phase === "out" ? 1 : -1;
  return routeForLevel(game.config.level).routes[lane].crossings.flatMap(({ gate, distance }) => {
    if (closedOnly && game.gates[gate].open) return [];
    const approaching = game.sheep.filter((s) => s.lane === lane && direction * (distance - s.progress) >= -0.001);
    if (!approaching.length) return [];
    return [{ gate, distance: Math.min(...approaching.map((s) => direction * (distance - s.progress))) }];
  }).sort((a, b) => a.distance - b.distance);
}
export function groupNextGate(game: Game, lane: number): number | null {
  return requests(game, lane, false)[0]?.gate ?? null;
}
/** Help prioritizes the closest sheep needing a closed gate, across both groups. */
export function nextGate(game: Game): number | null {
  return [0, 1].flatMap((lane) => requests(game, lane, true)).sort((a, b) => a.distance - b.distance)[0]?.gate ?? null;
}
function crossingDistance(game: Game, lane: number, gate: number): number | undefined {
  return routeForLevel(game.config.level).routes[lane].crossings.find((c) => c.gate === gate)?.distance;
}
function occupied(game: Game, gate: number): boolean {
  return game.sheep.some((s) => {
    const distance = crossingDistance(game, s.lane, gate);
    return distance !== undefined && Math.abs(s.progress - distance) < GATE_CLEARANCE - 0.000001;
  });
}
/** Free rescue opens the next needed gate immediately, including during a busy lever. */
export function helpGate(game: Game): Game {
  const index = nextGate(game);
  if (index === null) return game;
  return { ...game, assists: game.assists + 1, lever: null, selectedGate: index, shiftFrom: index,
    gates: game.gates.map((g, i) => i === index ? { ...g, open: true, closingAt: game.time + game.config.openSeconds } : g) };
}
export function medal(game: Game): number {
  const averageWait = game.waiting / game.sheep.length;
  return averageWait <= 8 ? 3 : averageWait <= 22 ? 2 : 1;
}
export function operateGate(game: Game, index: number): Game {
  if ((game.phase !== "out" && game.phase !== "back") || game.lever || !game.gates[index] || index >= activeGateCount(game)) return game;
  return { ...game, selectedGate: index, shiftFrom: game.selectedGate, lever: { gate: index, action: game.gates[index].open ? "close" : "open", remaining: game.config.gearboxSeconds }, commands: game.commands + 1 };
}
export function tick(game: Game, dt: number): Game {
  if (!Number.isFinite(dt) || dt <= 0) return game;
  // Stable small steps prevent a long frame from skipping a closed gate or a whole flock.
  if (dt > 0.05) {
    let next = game;
    for (let remaining = Math.min(dt, 1); remaining > 0.000001; remaining -= 0.05) next = tick(next, Math.min(remaining, 0.05));
    return next;
  }
  if (game.phase === "regroup") {
    const duskProgress = Math.min(1, game.duskProgress + dt / 2.4);
    return { ...game, duskProgress, phase: duskProgress >= 1 ? "back" : "regroup" };
  }
  if (game.phase !== "out" && game.phase !== "back") return game;
  const { routes, routeLengths } = routeForLevel(game.config.level);
  const next: Game = { ...game, time: game.time + dt, sheep: game.sheep.map((s) => ({ ...s })),
    gates: game.gates.map((g) => ({ ...g })), lever: game.lever ? { ...game.lever } : null };
  if (next.lever) {
    next.lever.remaining -= dt;
    if (next.lever.remaining <= 0) {
      const { gate, action } = next.lever;
      next.gates[gate].open = action === "open";
      if (action === "open") next.gates[gate].closingAt = next.time + next.config.openSeconds;
      // Even manual closure waits until an occupied crossing is clear.
      if (action === "close" && occupied(next, gate)) {
        next.gates[gate].open = true;
        next.gates[gate].closingAt = next.time;
      }
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
    let target = before + direction * next.config.speed * dt;
    target = outward ? Math.min(destination, target) : Math.max(destination, target);
    let waiting = false;
    // Only sheep on the same route share a queue. A different group's progress
    // is measured from a different starting point and must never constrain it.
    for (const leader of moved) {
      if (leader.sheep.lane !== sheep.lane) continue;
      const limit = leader.sheep.progress - direction * SHEEP_SPACING;
      if (direction * (target - limit) > 0) {
        target = limit;
        waiting ||= leader.waiting;
      }
    }
    const crossings = [...routes[sheep.lane].crossings].sort((a, b) => direction * (a.distance - b.distance));
    for (const { gate: index, distance } of crossings) {
      const gate = next.gates[index];
      const stop = distance - direction * GATE_CLEARANCE;
      const entering = direction * (before - stop) <= 0.00001 && direction * (target - stop) > 0;
      if (entering && (!gate.open || (gate.trafficGroup !== null && gate.trafficGroup !== sheep.lane))) {
        target = stop;
        waiting = true;
      } else if (entering) gate.trafficGroup = sheep.lane;
    }
    if (waiting) waitingNow += dt;
    sheep.progress = target;
    for (const { gate: index, distance } of routes[sheep.lane].crossings) {
      if (next.gates[index].open && direction * (before - distance) < 0 && direction * (target - distance) >= 0) {
        next.gates[index].closingAt = next.time + next.config.openSeconds;
      }
    }
    moved.push({ sheep, waiting });
  }
  for (let i = 0; i < activeGateCount(next); i++) {
    const gate = next.gates[i];
    if (!occupied(next, i)) {
      gate.trafficGroup = null;
      if (gate.open && next.time >= gate.closingAt) gate.open = false;
    }
  }
  next.waiting += waitingNow;
  next.score = Math.max(0, 1000 - Math.floor(next.waiting));
  if (outward && next.sheep.every((s) => s.progress >= routeLengths[s.lane] - Math.floor(s.id / 2) * SHEEP_SPACING - 0.00001)) {
    next.phase = "regroup"; next.lever = null; next.selectedGate = null; next.shiftFrom = null;
    next.gates = next.gates.map(() => ({ open: false, closingAt: 0, trafficGroup: null }));
  }
  if (!outward && next.sheep.every((s) => s.progress <= 0.00001)) {
    next.phase = "done"; next.lever = null;
  }
  return next;
}
