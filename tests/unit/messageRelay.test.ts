import { expect, it } from "vitest";
import { replayRelay } from "../../src/typing/MessageRelay";

it("commits one field per update and starts only after readiness", () => {
  expect(replayRelay(["across"])).toMatchObject({ location: "station", status: "gathering" });
  expect(replayRelay(["across", "send"])).toMatchObject({ location: "across", status: "gathering", update: "delay" });
  expect(replayRelay(["across", "send", "wait", "send"])).toMatchObject({ location: "across", status: "waiting" });
  expect(replayRelay(["across", "send", "wait", "send", "receive", "ready"])).toMatchObject({ location: "across", status: "performing" });
});

it("preserves a separate waiting beat and rejects impossible confirmations", () => {
  const atPlaza = ["across", "send"];
  expect(replayRelay([...atPlaza, "start", "send"])).toMatchObject({
    location: "across", status: "gathering", feedback: "early", revisions: 1,
  });
  const waiting = [...atPlaza, "wait", "send"];
  expect(replayRelay(waiting)).toMatchObject({ update: "waiting", status: "waiting", location: "across" });
  expect(replayRelay([...waiting, "ready"])).toBeNull();
  expect(replayRelay([...waiting, "receive", "ready", "ready"])).toBeNull();
  expect(replayRelay(["send"])).toBeNull();
  expect(replayRelay(["show", "send"])).toMatchObject({ assisted: true });
});
