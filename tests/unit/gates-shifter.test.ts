import { describe, expect, it } from "vitest";
import { gearSlot, shifterPosition } from "../../src/content/gatesShifter";

describe("H-pattern motion", () => {
  it("assigns nine distinct slots and moves through the neutral channel", () => {
    const slots = Array.from({ length: 9 }, (_, index) => gearSlot(index));
    expect(new Set(slots.map((p) => `${p.x},${p.y}`)).size).toBe(9);
    for (let from = 0; from < 9; from++) for (let to = 0; to < 9; to++) {
      expect(shifterPosition(from, to, 0)).toEqual(gearSlot(from));
      expect(shifterPosition(from, to, 0.5).y).toBe(0);
      expect(shifterPosition(from, to, 1)).toEqual(gearSlot(to));
    }
    expect(gearSlot(null)).toEqual({ x: 0, y: 0 });
  });
});
