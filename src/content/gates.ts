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
export const gateControls = [
  { code: "KeyG", hebrew: "ע", latin: "G", point: p(520, 690) },
  { code: "KeyH", hebrew: "י", latin: "H", point: p(500, 350) },
  { code: "KeyJ", hebrew: "ח", latin: "J", point: p(790, 155) },
  { code: "KeyK", hebrew: "ל", latin: "K", point: p(1140, 350) },
  { code: "KeyF", hebrew: "כ", latin: "F", point: p(650, 450) },
  { code: "KeyD", hebrew: "ג", latin: "D", point: p(950, 450) },
  { code: "KeyS", hebrew: "ד", latin: "S", point: p(800, 340) },
  { code: "KeyA", hebrew: "ש", latin: "A", point: p(300, 450) },
  { code: "KeyL", hebrew: "ך", latin: "L", point: p(1300, 450) },
] as const;
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
/** New approaches reuse the existing pen/shortcut gate positions. Each gate is crossed once. */
const westToFirst: Curve = [p(650, 450), p(530, 450), p(450, 570), p(520, 690)];
const eastToWest: Curve = [p(950, 450), p(850, 450), p(750, 450), p(650, 450)];
const northExit: Curve = [p(800, 515), p(800, 450), p(800, 390), p(800, 340)];
const northToEast: Curve = [p(800, 340), p(900, 250), p(1040, 350), p(950, 450)];
const approaches: readonly (readonly Curve[])[] = [
  [sharedRoute[0]],
  [[p(800, 515), p(750, 510), p(700, 475), p(650, 450)], westToFirst],
  [[p(800, 515), p(875, 515), p(920, 490), p(950, 450)], eastToWest, westToFirst],
  [northExit, northToEast, eastToWest, westToFirst],
  [northExit,
    [p(800, 340), p(800, 270), p(940, 280), p(1015, 200)],
    [p(1015, 200), p(1180, 220), p(1300, 350), p(1300, 450)],
    [p(1300, 450), p(1200, 450), p(1030, 450), p(950, 450)],
    eastToWest,
    [p(650, 450), p(530, 450), p(420, 450), p(300, 450)],
    [p(300, 450), p(260, 580), p(400, 640), p(520, 690)]],
];
const levelRoutes = approaches.map((approach, level) => {
  const curves = [...approach, ...sharedRoute.slice(1)];
  const shared = measure(curves);
  const routes = pastureRoutes.map((branch) => measure([...curves, ...branch]));
  const distances = gateControls.slice(0, gatesLevels[level].gates).map(({ point }) => {
    const index = curves.findIndex((curve) => curve[3].x === point.x && curve[3].y === point.y);
    if (index < 0) throw new Error(`Missing gate on level ${level + 1}`);
    return shared.ends[index];
  });
  return { curves, routes, gateDistances: distances, sharedDistance: shared.length,
    routeLengths: routes.map((route) => route.length), path: curvePath(curves) };
});
export function routeForLevel(level = 1) { return levelRoutes[level - 1]; }
// Base-map exports remain available to geometry checks and earlier design references.
export const gateDistances = levelRoutes[0].gateDistances;
export const sharedDistance = levelRoutes[0].sharedDistance;
export const routeLengths = levelRoutes[0].routeLengths;
export function sheepPosition(lane: number, distance: number, level = 1): Point {
  if (distance < 0) return { x: 800 + Math.sin(-distance / 64 * Math.PI / 2) * 70, y: 515 + Math.max(distance * 0.3, -150) };
  const route = routeForLevel(level).routes[lane];
  const after = route.points.findIndex((point) => point.distance >= distance);
  if (after <= 0) return after === 0 ? route.points[0] : route.points[route.points.length - 1];
  const a = route.points[after - 1];
  const b = route.points[after];
  const t = (distance - a.distance) / (b.distance - a.distance);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
