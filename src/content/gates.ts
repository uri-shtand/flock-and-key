import { keyboardRows } from "../typing/KeyboardMap";
import { gatesLevels } from "./gatesLevels";
/** Stage-one routes, in the background's 1600×900 world coordinates. */
export type Point = { x: number; y: number };
export type Curve = readonly [Point, Point, Point, Point];
const p = (x: number, y: number): Point => ({ x, y });
export const sharedRoute: readonly Curve[] = [
  [p(800, 515), p(800, 690), p(650, 770), p(520, 690)],
  [p(520, 690), p(290, 600), p(320, 430), p(500, 350)],
  [p(500, 350), p(660, 285), p(540, 125), p(790, 155)],
  [p(790, 155), p(1030, 170), p(1105, 225), p(1140, 350)],
  [p(1140, 350), p(1220, 520), p(1160, 700), p(1000, 720)],
];
export const pastureRoutes: readonly (readonly Curve[])[] = [
  [[p(1000, 720), p(760, 850), p(210, 825), p(160, 510)]],
  [[p(1000, 720), p(1280, 820), p(1490, 705), p(1440, 510)]],
];
// Gate IDs describe topology/unlocks, not keyboard order. Keep them stable for saves.
const gatePositions = [p(520, 690), p(500, 350), p(790, 155), p(1140, 350),
  p(650, 450), p(950, 450), p(800, 340), p(300, 450), p(1300, 450)] as const;
export const gateKeyboardOrder = gatePositions.map((_, id) => id).sort((a, b) => gatePositions[a].x - gatePositions[b].x);
const homeKeys = keyboardRows[1].slice(0, gatePositions.length);
/** Assign once across all nine gates: unlocking never changes an earlier letter. */
export const gateControls = gatePositions.map((point, id) => {
  const key = homeKeys[gateKeyboardOrder.indexOf(id)];
  return { code: key.code, hebrew: key.letter, latin: key.code.slice(3), point };
});
/** Three pen approaches and two bypasses are closed in stage one. No key labels. */
export const lockedGates = [p(650, 450), p(950, 450), p(800, 340), p(300, 450), p(1300, 450)] as const;
export const shortcutPaths = [
  "M 160 450 C 340 450 520 450 650 450",
  "M 950 450 C 1100 450 1260 450 1440 450",
  "M 800 340 C 800 270 940 280 1015 200",
] as const;
export function curvePath(curves: readonly Curve[]): string {
  return `M ${curves[0][0].x} ${curves[0][0].y}` + curves.map(([, b, c, d]) =>
    ` C ${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`).join("");
}
function sample(curve: Curve, t: number): Point {
  const q = 1 - t;
  const [a, b, c, d] = curve;
  return { x: q ** 3 * a.x + 3 * q * q * t * b.x + 3 * q * t * t * c.x + t ** 3 * d.x,
    y: q ** 3 * a.y + 3 * q * q * t * b.y + 3 * q * t * t * c.y + t ** 3 * d.y };
}
function measure(curves: readonly Curve[]) {
  const points = [{ ...curves[0][0], distance: 0 }];
  const ends: number[] = [];
  for (const curve of curves) {
    for (let i = 1; i <= 80; i++) {
      const point = sample(curve, i / 80);
      const previous = points[points.length - 1];
      points.push({ ...point, distance: previous.distance + Math.hypot(point.x - previous.x, point.y - previous.y) });
    }
    ends.push(points[points.length - 1].distance);
  }
  return { points, ends, length: points[points.length - 1].distance };
}
/** Names and symbols remain useful without color perception. */
export const sheepGroups = [
  { name: "פרחים", symbol: "○", color: "#256a7c", dash: "4 14" },
  { name: "כוכבים", symbol: "★", color: "#954c35", dash: "24 14" },
] as const;
const sequences = [
  [[0, 1], [3, 2]],
  [[4, 0, 1], [3, 2]],
  [[4, 0, 1], [5, 3, 2]],
  [[4, 0, 1, 6, 2], [5, 3, 2]],
  [[4, 7, 0, 1, 6, 2], [5, 8, 3, 2, 1]],
];
/** Curves use shared gate coordinates, but distances belong to one group only. */
function makeGroup(indices: number[], lane: number) {
  const start = p(lane ? 850 : 750, 540);
  const finish = p(lane ? 1440 : 160, 510);
  const waypoints: Point[] = [start];
  // Before the east pen exit unlocks, use its open southern doorway.
  if (lane === 1 && indices[0] === 3) waypoints.push(p(1030, 680), p(1180, 560));
  const gateEnds: { gate: number; end: number }[] = [];
  for (const gate of indices) {
    waypoints.push(gateControls[gate].point);
    gateEnds.push({ gate, end: waypoints.length - 2 });
  }
  // Scenic exits skirt the barn and avoid recrossing another controlled gate.
  if (lane) {
    if (indices[indices.length - 1] === 1) waypoints.push(p(460, 230), p(700, 80));
    waypoints.push(p(960, 90), p(1090, 150), p(1370, 330));
  } else waypoints.push(p(350, 160), p(170, 290));
  waypoints.push(finish);
  const curves: Curve[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    const previous = waypoints[Math.max(0, i - 1)], after = waypoints[Math.min(waypoints.length - 1, i + 2)];
    curves.push([a, p(a.x + (b.x - previous.x) / 6, a.y + (b.y - previous.y) / 6),
      p(b.x - (after.x - a.x) / 6, b.y - (after.y - a.y) / 6), b]);
  }
  const measured = measure(curves);
  return { ...measured, curves, path: curvePath(curves),
    crossings: gateEnds.map(({ gate, end }) => ({ gate, distance: measured.ends[end] })) };
}
const levelRoutes = sequences.map((groups, i) => {
  const routes = groups.map(makeGroup);
  const used = new Set(groups.flat());
  if (used.size !== gatesLevels[i].gates) throw new Error("Every unlocked gate needs a route");
  return { routes, routeLengths: routes.map((route) => route.length) };
});
export function routeForLevel(level = 1) { return levelRoutes[level - 1]; }
export function sheepPosition(lane: number, distance: number, level = 1): Point {
  const route = routeForLevel(level).routes[lane];
  if (distance < 0) return { x: route.points[0].x, y: route.points[0].y + Math.max(distance * 0.3, -150) };
  const after = route.points.findIndex((point) => point.distance >= distance);
  if (after <= 0) return after === 0 ? route.points[0] : route.points[route.points.length - 1];
  const a = route.points[after - 1];
  const b = route.points[after];
  const t = (distance - a.distance) / (b.distance - a.distance);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
