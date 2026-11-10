import { expect, it } from "vitest";
import {
  FARM_PATH,
  PITSI_FEET_OFFSET,
  pitsiPathPosition,
  pointOnFarmPath,
} from "../../src/game/farmPath";

it("keeps Pitsi’s paws on the illustrated polyline throughout a round", () => {
  for (let step = 0; step <= 8; step++) {
    const dog = pitsiPathPosition(step, 8),
      feet = { x: dog.x, y: dog.y + PITSI_FEET_OFFSET };
    const distance = Math.min(
      ...FARM_PATH.slice(1).map((b, i) => {
        const a = FARM_PATH[i],
          dx = b.x - a.x,
          dy = b.y - a.y;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((feet.x - a.x) * dx + (feet.y - a.y) * dy) / (dx * dx + dy * dy),
          ),
        );
        return Math.hypot(feet.x - a.x - t * dx, feet.y - a.y - t * dy);
      }),
    );
    expect(distance).toBeLessThan(0.001);
    expect(feet.y).toBeLessThan(400);
    if (step > 0) {
      const previous = pitsiPathPosition(step - 1, 8);
      expect(dog.x).toBeGreaterThan(previous.x);
      expect(dog.y).toBeLessThan(previous.y);
    }
  }
  expect(pitsiPathPosition(8, 8)).toEqual({
    x: 768,
    y: 285 - PITSI_FEET_OFFSET,
  });
  // The barn facade ends at y=283; paws must land on the ground below it.
  expect(pitsiPathPosition(8, 8).y + PITSI_FEET_OFFSET).toBeGreaterThan(283);
});
it("clamps visual progress and safely positions an empty route", () => {
  expect(pitsiPathPosition(-2, 8)).toEqual(pitsiPathPosition(0, 8));
  expect(pitsiPathPosition(12, 8)).toEqual(pitsiPathPosition(8, 8));
  expect(pitsiPathPosition(0, 0)).toEqual(pitsiPathPosition(0, 8));
  expect(pointOnFarmPath(0)).toEqual(FARM_PATH[0]);
  expect(pointOnFarmPath(1)).toEqual(FARM_PATH.at(-1));
});
