import { gateControls, gateKeyboardOrder } from "../../src/content/gates";
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

it("maps gates left to right to the physical home row, with the same shifter ordering", () => {
  const ordered = [...gateControls].sort((a, b) => a.point.x - b.point.x);
  expect(ordered.map((g) => g.code)).toEqual(["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"]);
  expect(ordered.map((g) => g.hebrew).join("")).toBe("שדגכעיחלך");
  expect(gateKeyboardOrder).toEqual([7, 1, 0, 4, 2, 6, 5, 3, 8]);
  for (const count of [4, 5, 6, 7, 9]) {
    const gates = gateControls.slice(0, count).sort((a, b) => a.point.x - b.point.x);
    for (let i = 1; i < gates.length; i++) expect(ordered.indexOf(gates[i])).toBeGreaterThan(ordered.indexOf(gates[i - 1]));
  }
  const slots = gateKeyboardOrder.map(gearSlot);
  for (let i = 1; i < slots.length; i++) expect(slots[i].x).toBeGreaterThanOrEqual(slots[i - 1].x);
});
