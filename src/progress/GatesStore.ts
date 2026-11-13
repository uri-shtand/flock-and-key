import { gatesLevels, levelConfig, validGatesConfig } from "../content/gatesLevels";
import { initial, GATE_CLEARANCE, type Game } from "../typing/GatesSimulation";
import { routeForLevel } from "../content/gates";

export const GATES_STORAGE_KEY = "flock-key-gates-v1";
export type GatesSave = { version: 3; game: Game; best: number[] };
const finite = (n: unknown, min: number, max: number): n is number => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
/** Validate nested data before it reaches movement, rendering or array indices. */
export function validGatesSave(value: unknown): value is GatesSave {
  if (!value || typeof value !== "object") return false;
  const s = value as GatesSave;
  const g = s.game;
  if (s.version !== 3 || !g || !validGatesConfig(g.config) || !Array.isArray(s.best) || s.best.length !== 5 || !s.best.every((n) => Number.isInteger(n) && n >= 0 && n <= 3)) return false;
  if (!["ready", "out", "regroup", "back", "done"].includes(g.phase) || !finite(g.time, 0, 1e8) || !finite(g.waiting, 0, 1e9) || !finite(g.score, 0, 1000) || !finite(g.duskProgress, 0, 1)) return false;
  if (!Number.isInteger(g.commands) || !finite(g.commands, 0, 1e8) || !Number.isInteger(g.assists) || !finite(g.assists, 0, 1e8)) return false;
  if (!Array.isArray(g.gates) || g.gates.length !== gatesLevels[g.config.level - 1].gates || !g.gates.every((gate) => gate && typeof gate.open === "boolean" && finite(gate.closingAt, 0, 1e8 + 5) && (gate.trafficGroup === null || gate.trafficGroup === 0 || gate.trafficGroup === 1) && (gate.open || gate.trafficGroup === null))) return false;
  const validSelection = (index: unknown) => index === null || (Number.isInteger(index) && finite(index, 0, g.gates.length - 1));
  if (!validSelection(g.selectedGate) || !validSelection(g.shiftFrom)) return false;
  const { routeLengths } = routeForLevel(g.config.level);
  if (!Array.isArray(g.sheep) || g.sheep.length !== g.config.sheepCount || !g.sheep.every((sheep, id) => sheep && sheep.id === id && sheep.lane === id % 2 && finite(sheep.progress, -640, routeLengths[sheep.lane]))) return false;
  // A restored shared crossing must retain the same exclusive traffic owner.
  for (const [gateIndex, gate] of g.gates.entries()) {
    const owners = new Set(g.sheep.filter((sheep) => {
      const crossing = routeForLevel(g.config.level).routes[sheep.lane].crossings.find((c) => c.gate === gateIndex);
      return crossing !== undefined && Math.abs(sheep.progress - crossing.distance) < GATE_CLEARANCE - 0.000001;
    }).map((sheep) => sheep.lane));
    if (owners.size > 1 || (owners.size === 1 && (!gate.open || !owners.has(gate.trafficGroup!)))) return false;
  }
  if (g.lever !== null && (!g.lever || !Number.isInteger(g.lever.gate) || !finite(g.lever.gate, 0, gatesLevels[g.config.level - 1].gates - 1) || !["open", "close"].includes(g.lever.action) || !finite(g.lever.remaining, 0, g.config.gearboxSeconds))) return false;
  if (g.lever && g.selectedGate !== g.lever.gate) return false;
  return true;
}
/** Route topology changed: retain safe rewards/preferences, restart the affected round. */
export function migrateGatesSave(value: unknown): GatesSave | null {
  if (!value || typeof value !== "object") return null;
  const old = value as { version?: unknown; game?: Partial<Game>; best?: number[] };
  if ((old.version !== 1 && old.version !== 2) || !old.game || !validGatesConfig(old.game.config) || !Array.isArray(old.best) || old.best.length !== 5 || !old.best.every((n) => Number.isInteger(n) && n >= 0 && n <= 3)) return null;
  const config = { ...levelConfig(old.game.config.level), hints: old.game.config.hints, reducedMotion: old.game.config.reducedMotion };
  return { version: 3, game: initial(config), best: [...old.best] };
}
export function readGatesSave(): { save: GatesSave; warning: string } {
  const fallback: GatesSave = { version: 3, game: initial(), best: [0, 0, 0, 0, 0] };
  try {
    const raw = localStorage.getItem(GATES_STORAGE_KEY);
    if (!raw) return { save: fallback, warning: "" };
    const parsed: unknown = JSON.parse(raw);
    if (validGatesSave(parsed)) return { save: parsed, warning: "" };
    const migrated = migrateGatesSave(parsed);
    if (migrated) return { save: migrated, warning: "המסלול עודכן: השלב מתחיל מחדש. המדליות והעדפות העזרה נשמרו." };
    return { save: fallback, warning: "שמירת השערים לא נקראה. אפשר להתחיל סיבוב חדש." };
  } catch {
    return { save: fallback, warning: "השמירה המקומית אינה זמינה. אפשר להמשיך לשחק." };
  }
}
export function writeGatesSave(save: GatesSave): boolean {
  try { localStorage.setItem(GATES_STORAGE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
