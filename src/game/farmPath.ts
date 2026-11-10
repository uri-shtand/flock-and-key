// Shared drawing and movement geometry, in the scene's 960 × 400 coordinates.
export const FARM_PATH = [
  { x: 220, y: 400 },
  { x: 420, y: 310 },
  { x: 768, y: 285 },
] as const;
export const PITSI_FEET_OFFSET = 32;

export function pointOnFarmPath(progress: number) {
  const fraction = Math.max(0, Math.min(1, progress));
  if (fraction === 0) return { ...FARM_PATH[0] };
  if (fraction === 1) return { ...FARM_PATH[FARM_PATH.length - 1] };
  const lengths = FARM_PATH.slice(1).map((point, i) =>
    Math.hypot(point.x - FARM_PATH[i].x, point.y - FARM_PATH[i].y),
  );
  let remaining = fraction * lengths.reduce((sum, length) => sum + length, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const from = FARM_PATH[i],
        to = FARM_PATH[i + 1];
      const t = Math.min(1, remaining / lengths[i]);
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      };
    }
    remaining -= lengths[i];
  }
  return { ...FARM_PATH[0] };
}

export function pitsiPathPosition(step: number, total: number) {
  const progress = Math.max(0, Math.min(1, total > 0 ? step / total : 0));
  // Start a little way up the path so all paws fit inside the picture.
  const feet = pointOnFarmPath(0.12 + progress * 0.88);
  return { x: feet.x, y: feet.y - PITSI_FEET_OFFSET };
}
