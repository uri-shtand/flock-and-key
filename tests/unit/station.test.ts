import { expect, test, vi } from "vitest";
import { initialProgress, loadGame, newSession, selectCourierRoute, selectDifficulty, STORAGE_KEY, updateSession } from "../../src/progress/GameStore";
import { appendCase, caseState, newAdventure, validCase, type CaseEvent } from "../../src/typing/DetectiveCase";

test("station route and difficulty survive reload independently of a farm draft", () => {
  const farm = newSession(initialProgress(), "guided");
  let progress = newSession(farm, "speed", "station");
  progress = updateSession(progress, session => ({ ...session, phase: "warmup" }));
  progress = selectCourierRoute(progress, "cafe");
  progress = selectDifficulty(progress, 2);
  let stored = JSON.stringify(progress);
  vi.stubGlobal("localStorage", { getItem: (key: string) => key === STORAGE_KEY ? stored : null });
  try {
    const saved = loadGame();
    expect(saved.warning).toBe("");
    expect(saved.progress.sessions[0]).toMatchObject({ id: farm.currentId, status: "active" });
    expect(saved.progress.sessions[1]).toMatchObject({ edition: "station", route: "cafe", difficulty: 2, status: "active" });
    expect(saved.progress.sessions[1].tasks[3].map(task => task.expected)).toEqual(["קפה", "ספסל", "חלון", "כיכר"]);
    progress.sessions[1].tasks[3][0].expected = "שער";
    stored = JSON.stringify(progress);
    expect(loadGame().warning).not.toBe("");
  } finally { vi.unstubAllGlobals(); }
});

test("the station case needs its own evidence and rejects clues from the wrong place", () => {
  let run = newAdventure(undefined, 3);
  const act = (event: CaseEvent) => { run = appendCase(run, event); expect(validCase(run)).toBe(true); };
  expect(appendCase(run, { type: "observe", interaction: "curtain" })).toBe(run);
  expect(appendCase(run, { type: "bookmark", passage: "stars" })).toBe(run);
  act({ type: "observe", interaction: "dad" });
  act({ type: "bookmark", passage: "rainStarted" });
  act({ type: "bookmark", passage: "nogaFolder" });
  act({ type: "observe", interaction: "book" });
  act({ type: "collect", item: "ribbon" });
  act({ type: "visit", place: "bridge" });
  act({ type: "observe", interaction: "note" });
  act({ type: "collect", item: "delivery" });
  act({ type: "observe", interaction: "curtain" });
  act({ type: "bookmark", passage: "starOnStand" });
  for (const [board, evidence] of [["happened", ["ribbon", "rainStarted", "delivery"]], ["where", ["delivery", "nogaFolder", "starOnStand"]]] as const) {
    for (const item of evidence) act({ type: "placeEvidence", board, evidence: item });
    act({ type: "checkBoard", board, guided: false });
  }
  expect(caseState(run)).toMatchObject({ place: "ending", links: { identity: "supported", route: "supported" } });
  expect(validCase({ ...run, version: 2 })).toBe(false);
});

test("parcel receipt can be made once from the observed station record", () => {
  const start = newAdventure(undefined, 4);
  const receipt = { type: "parcelReceipt", assisted: true } as const;
  expect(appendCase(start, receipt)).toBe(start);
  const observed = appendCase(start, { type: "observe", interaction: "dad" });
  expect(appendCase(observed, { type: "collect", item: "delivery" })).toBe(observed);
  const done = appendCase(observed, receipt);
  expect(caseState(done).bag).toEqual(["delivery"]);
  expect(validCase(done)).toBe(true);
  expect(appendCase(done, receipt)).toBe(done);
});
