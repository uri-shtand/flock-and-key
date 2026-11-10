import { afterEach, expect, it, vi } from "vitest";
import {
  buyOrToggle,
  exportCsv,
  initialProgress,
  loadGame,
  newSession,
  saveGame,
  resetGame,
  STORAGE_KEY,
} from "../../src/progress/GameStore";
afterEach(() => vi.unstubAllGlobals());
it("persists exact task position, answer exposure and a corrected draft", () => {
  let saved = "";
  vi.stubGlobal("localStorage", {
    getItem: () => saved || null,
    setItem: (key: string, value: string) => {
      expect(key).toBe(STORAGE_KEY);
      saved = value;
    },
  });
  const p = newSession(initialProgress(), "spelling");
  const s = p.sessions[0];
  s.phase = "play";
  s.index = 2;
  s.draft = { ...s.draft, hint: 2, input: "כתב", errors: 1, inserted: 3 };
  expect(saveGame(p)).toBe(true);
  expect(loadGame().progress).toEqual(p);
});
it("rejects malformed nested sessions and recovers when storage is inaccessible", () => {
  const p = newSession(initialProgress());
  p.sessions[0].index = 900;
  vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(p) });
  expect(loadGame().warning).not.toBe("");
  expect(loadGame().progress.sessions).toEqual([]);
  vi.stubGlobal("localStorage", {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  });
  expect(saveGame(initialProgress())).toBe(false);
  expect(loadGame().warning).not.toBe("");
});
it("charges for a prize once and toggles it for free without changing historical earnings", () => {
  const p = { ...initialProgress(), balance: 40, earned: 40 };
  const bought = buyOrToggle(p, "hat");
  expect(bought.balance).toBe(10);
  expect(bought.earned).toBe(40);
  expect(bought.equipped).toContain("hat");
  const off = buyOrToggle(bought, "hat");
  expect(off.balance).toBe(10);
  expect(off.equipped).not.toContain("hat");
  expect(buyOrToggle(off, "duck")).toBe(off);
});
it("keeps an interrupted session when starting another one", () => {
  const first = newSession(initialProgress());
  const second = newSession(first);
  expect(second.sessions[0].status).toBe("abandoned");
  expect(second.sessions[1].status).toBe("active");
});
it("quotes exported cells and neutralizes spreadsheet formulas in child input", () => {
  const p = newSession(initialProgress());
  p.sessions[0].attempts.push({
    id: "a",
    task: 0,
    mode: "guided",
    wordId: "typing:דג",
    expected: "דג",
    answer: '=1+1,"test"',
    at: "now",
    correct: false,
    skipped: false,
    aid: "independent",
    hint: 0,
    pasted: false,
    keyboardHelp: false,
    elapsedMs: 1000,
    inserted: 2,
    errors: 2,
    deleted: 0,
    physicalCodes: ["KeyS"],
    points: 0,
    timed: false,
  });
  const csv = exportCsv(p);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"\'=1+1,""test"""');
});
it("preserves recent word exposure independently of the current task draft", () => {
  let saved = "";
  vi.stubGlobal("localStorage", {
    getItem: () => saved || null,
    setItem: (_key: string, value: string) => {
      saved = value;
    },
  });
  const p = newSession(initialProgress(), "spelling");
  p.sessions[0].exposedWords = ["מחברת"];
  saveGame(p);
  expect(loadGame().progress.sessions[0].exposedWords).toContain("מחברת");
});
it("resets only game progress, retains sound preferences and persists before returning", () => {
  const p = newSession({
    ...initialProgress(),
    balance: 80,
    earned: 80,
    owned: ["hat"],
    equipped: ["hat"],
    knownCodes: ["KeyS"],
    settings: { music: false, speech: true },
  });
  const data = new Map<string, string>([
    [STORAGE_KEY, JSON.stringify(p)],
    ["other-app", "keep"],
  ]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  });
  const reset = resetGame(p);
  expect(reset).toEqual({ ...initialProgress(), settings: p.settings });
  expect(loadGame().progress).toEqual(reset);
  expect(data.get("other-app")).toBe("keep");
  expect(p.sessions).toHaveLength(1);
  expect(p.owned).toEqual(["hat"]);
});
it("does not discard the live progress if persisting a reset fails", () => {
  const p = newSession(initialProgress());
  const before = JSON.stringify(p);
  vi.stubGlobal("localStorage", {
    setItem() {
      throw Error("blocked");
    },
  });
  expect(resetGame(p)).toBeNull();
  expect(JSON.stringify(p)).toBe(before);
});
