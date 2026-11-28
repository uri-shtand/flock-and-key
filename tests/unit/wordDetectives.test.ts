import { expect, it } from "vitest";
import { replayWordDetectives } from "../../src/typing/WordDetectives";

it("supports both visit orders and a lucky discovery", () => {
  expect(replayWordDetectives(["square", "stage", "cafe", "note", "move", "square", "table"])).toMatchObject({ found: true, note: true, moved: true });
  expect(replayWordDetectives(["cafe", "note", "move", "square", "table"])).toMatchObject({ found: true, note: true, moved: true });
  expect(replayWordDetectives(["square", "table", "return"])).toMatchObject({ returned: true, note: false, moved: false });
});

it("keeps a factual record of missing sources at discovery and rejects premature or duplicate returns", () => {
  expect(replayWordDetectives(["cafe", "note", "square", "table"])).toMatchObject({
    missingAtDiscovery: ["move"], supported: true,
  });
  expect(replayWordDetectives(["square", "table", "cafe", "note", "move", "square", "table", "return"])).toMatchObject({
    missingAtDiscovery: ["note", "move"], supported: true, returned: true,
  });
  expect(replayWordDetectives(["cafe", "note", "move", "help", "square", "table"])).toMatchObject({
    missingAtDiscovery: [], supported: true,
  });
  expect(replayWordDetectives(["note"])).toBeNull();
  expect(replayWordDetectives(["square", "return"])).toBeNull();
  expect(replayWordDetectives(["square", "table", "return", "return"])).toBeNull();
});
