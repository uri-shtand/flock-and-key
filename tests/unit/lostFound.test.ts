import { expect, it } from "vitest";
import { lostFound, replayLostFound } from "../../src/typing/LostFound";

it("asks for missing information without counting an ambiguous handover as an error", () => {
  const state = replayLostFound(["left", "give", "next", "left", "give"]);
  expect(state).toMatchObject({ index: 1, feedback: "clarify", wrong: 0, delivered: false });
  expect(lostFound(state!, "location")).toMatchObject({ knowsLocation: true });
});

it("replays an inspection choice and rejects impossible or duplicate handovers", () => {
  expect(replayLostFound(["inspect-right"])).toMatchObject({ inspection: "right", selected: null });
  expect(replayLostFound(["give"])).toBeNull();
  expect(replayLostFound(["left", "give", "give"])).toBeNull();
  expect(replayLostFound(["next"])).toBeNull();
  expect(replayLostFound(["left", "give", "next", "show", "give", "next", "show", "give"])).toMatchObject({
    index: 2, delivered: true, supported: true,
  });
});
