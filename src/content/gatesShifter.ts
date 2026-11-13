import type { Point } from "./gates";

/** Fixed nine-slot truck-style H pattern. Unlocking a slot never moves an earlier gate. */
export function gearSlot(index: number | null): Point {
  return index === null ? { x: 0, y: 0 } : { x: -80 + Math.floor(index / 2) * 40, y: index % 2 === 0 ? -44 : 44 };
}
/** Shift vertically to neutral, across its channel, then into the target gear. */
export function shifterPosition(from: number | null, to: number | null, progress: number): Point {
  const start = gearSlot(from);
  const end = gearSlot(to);
  const t = Math.max(0, Math.min(1, progress));
  const ease = (v: number) => v * v * (3 - 2 * v);
  if (t < 1 / 3) return { x: start.x, y: start.y * (1 - ease(t * 3)) };
  if (t < 2 / 3) return { x: start.x + (end.x - start.x) * ease(t * 3 - 1), y: 0 };
  return { x: end.x, y: end.y * ease(t * 3 - 2) };
}
