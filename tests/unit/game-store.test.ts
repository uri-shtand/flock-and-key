import { afterEach, expect, it, vi } from "vitest";
import {
  buyOrToggle,
  exportCsv,
  initialProgress,
  loadGame,
  newSession,
  saveGame,
  resetGame,
  selectDifficulty,
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

it("loads older saves without difficulty and validates new difficulty values", () => {
  const p = newSession(initialProgress());
  const old = JSON.parse(JSON.stringify(p));
  delete old.sessions[0].difficulty;
  vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(old) });
  const restored = loadGame();
  expect(restored.warning).toBe("");
  expect(restored.progress.sessions[0].difficulty).toBe(1);
  expect(restored.progress.sessions[0].tasks).toEqual(p.sessions[0].tasks);
  for (const bad of [0, 4, "3", null]) {
    old.settings.difficulty = bad;
    expect(loadGame().warning).not.toBe("");
  }
});
it("captures the selected difficulty for each new session", () => {
  const p = initialProgress();
  p.recommendations = { guided: 3 };
  const started = newSession(p);
  expect(started.sessions[0].difficulty).toBe(3);
  started.recommendations = { guided: 1 };
  const next = newSession(started);
  expect(next.sessions[0].difficulty).toBe(3);
  expect(next.sessions[1].difficulty).toBe(1);
  expect(Math.max(...next.sessions[0].tasks[0].map((t) => t.expected.length))).toBeGreaterThan(7);
});

it("lets warmup select this mini-game only and never rewrites an active task", () => {
  const p = newSession(initialProgress());
  p.sessions[0].phase = "warmup";
  const changed = selectDifficulty(p, 3);
  expect(changed.sessions[0].difficulty).toBe(3);
  expect(changed.sessions[0].tasks[0]).not.toEqual(p.sessions[0].tasks[0]);
  expect(changed.sessions[0].tasks.slice(1)).toEqual(p.sessions[0].tasks.slice(1));
  expect(changed.recommendations).toBeUndefined();
  changed.sessions[0].phase = "play";
  expect(selectDifficulty(changed, 1).sessions[0]).toEqual(changed.sessions[0]);
});
it("validates per-game recommendations and retains them on refresh", () => {
  const p = initialProgress();
  p.recommendations = { guided: 2, spelling: 3 };
  vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(p) });
  expect(loadGame().progress.recommendations).toEqual(p.recommendations);
  for (const recommendations of [{ guided: "2" }, { spelling: 4 }, { other: 1 }, []]) {
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify({ ...p, recommendations }) });
    expect(loadGame().warning).not.toBe("");
  }
});

it("migrates a legacy chapter's level for every stage without changing its words", () => {
  const p = newSession(initialProgress());
  const old = JSON.parse(JSON.stringify(p));
  old.sessions[0].difficulty = 3;
  delete old.sessions[0].stageDifficulties;
  delete old.sessions[0].ratedStages;
  vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(old) });
  const loaded = loadGame();
  expect(loaded.warning).toBe("");
  expect(loaded.progress.sessions[0].stageDifficulties).toEqual([3, 3, 3, 3]);
  expect(loaded.progress.sessions[0].tasks).toEqual(p.sessions[0].tasks);
});
