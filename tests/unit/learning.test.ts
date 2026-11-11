import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { words } from "../../src/content/chapter";
import { keyboardKeys, keyFor } from "../../src/typing/KeyboardMap";
import {
  accuracy,
  chooseSpelling,
  differences,
  editMetrics,
  typingSet,
  stageSuccess,
  reward,
  type Attempt,
} from "../../src/typing/Learning";
import { initialProgress, newSession, recordStageCompletion } from "../../src/progress/GameStore";
const attempt = (changes: Partial<Attempt> = {}): Attempt => ({
  id: "a",
  task: 1,
  mode: "spelling",
  wordId: "w013",
  expected: "מחברת",
  answer: "מחברת",
  at: "2026-11-10T10:00:00Z",
  correct: true,
  skipped: false,
  aid: "independent",
  hint: 0,
  pasted: false,
  keyboardHelp: false,
  elapsedMs: 5000,
  inserted: 5,
  errors: 0,
  deleted: 0,
  physicalCodes: [],
  points: 0,
  timed: false,
  ...changes,
});
describe("learning evidence", () => {
  it("counts a corrected wrong insertion rather than reporting perfect accuracy", () => {
    const first = editMetrics("ד", "דק", "דג");
    const deletion = editMetrics("דק", "ד", "דג");
    const correction = editMetrics("ד", "דג", "דג");
    expect(first).toEqual({ inserted: 1, errors: 1, deleted: 0 });
    expect(deletion.deleted).toBe(1);
    expect(
      accuracy({
        inserted: 1 + first.inserted + correction.inserted,
        errors: first.errors + correction.errors,
      }),
    ).toBe(67);
  });
  it("describes substitutions, extra vowel letters and omitted final letters", () => {
    expect(differences("טלה", "תלה")).toEqual([
      { kind: "החלפה", expected: "ט", actual: "ת" },
    ]);
    expect(differences("כתב", "כיתב")).toEqual([
      { kind: "תוספת", expected: "", actual: "י" },
    ]);
    expect(differences("מים", "מי")).toEqual([
      { kind: "השמטה", expected: "ם", actual: "" },
    ]);
  });
  it("rewards supported completion without awarding an independent spelling bonus", () => {
    expect(reward(attempt(), [])).toBe(15);
    expect(reward(attempt({ aid: "copy", hint: 2 }), [])).toBe(10);
    expect(reward(attempt({ skipped: true, correct: false }), [])).toBe(0);
    expect(
      reward(attempt(), [attempt({ correct: false, answer: "מחברט" })]),
    ).toBe(10);
  });
  it("only gives a speed improvement bonus for comparable accurate timed trials", () => {
    const previous = attempt({ mode: "speed", timed: true, elapsedMs: 10000 });
    const now = attempt({ mode: "speed", timed: true, elapsedMs: 5000 });
    expect(reward(now, [], [previous])).toBe(20);
    expect(reward({ ...now, timed: false }, [], [previous])).toBe(15);
    expect(reward({ ...now, errors: 1 }, [], [previous])).toBe(10);
    expect(
      reward(
        { ...now, inserted: 21, errors: 1 },
        [],
        [{ ...previous, inserted: 20 }],
      ),
    ).toBe(10);
  });
});
describe("authored content", () => {
  it("ships a diverse vocabulary with real prerecorded files for every word", () => {
    expect(words.length).toBeGreaterThanOrEqual(120);
    expect(new Set(words.map((w) => w.text)).size).toBe(words.length);
    expect(new Set(words.map((w) => w.topic)).size).toBeGreaterThanOrEqual(8);
    for (const word of words) {
      expect(word.sentence).toContain(word.text);
      expect(existsSync(resolve("public", word.audio.slice(1)))).toBe(true);
    }
  });
  it("maps all Hebrew and final letters to distinct physical keyboard positions", () => {
    for (const letter of "אבגדהוזחטיכלמנסעפצקרשתךםןףץ")
      expect(keyFor(letter)?.code).toBeTruthy();
    expect(new Set(keyboardKeys.map((k) => k.code)).size).toBe(
      keyboardKeys.length,
    );
    expect(keyFor("ף")?.code).toBe("Semicolon");
  });
  it("varies spelling across sessions and keeps two short-recall probes", () => {
    const first = chooseSpelling([], 0),
      second = chooseSpelling([], 1);
    expect(first).not.toEqual(second);
    expect(first.slice(-2)).toEqual(first.slice(0, 2));
    expect(
      new Set(
        first.slice(0, 8).map((id) => words.find((w) => w.id === id)!.topic),
      ).size,
    ).toBe(8);
    const s = newSession(initialProgress()).sessions[0];
    expect(s.difficulty).toBe(1);
    expect(s.tasks[0].map((t) => t.expected)).not.toEqual(s.tasks[1].map((t) => t.expected));
  });
});

it("expands vocabulary with difficulty and orders each set from shorter to longer", () => {
  const averages: number[] = [];
  for (const difficulty of [1, 2, 3] as const) {
    const seen = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const typed = typingSet(seed, difficulty);
      expect(typed).toHaveLength(8);
      expect(new Set(typed).size).toBe(8);
      const lengths = typed.map((text) => text.length);
      expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
      typed.forEach((text) => { seen.add(text); for (const letter of text) expect(keyFor(letter)).toBeDefined(); });
      const spelling = chooseSpelling([], seed, difficulty);
      expect(spelling).toHaveLength(10);
      expect(new Set(spelling.slice(0, 8)).size).toBe(8);
      expect(spelling.slice(-2)).toEqual(spelling.slice(0, 2));
      const spellingLengths = spelling.slice(0, 8).map((id) => words.find((w) => w.id === id)!.text.length);
      expect(spellingLengths).toEqual([...spellingLengths].sort((a, b) => a - b));
      expect(Math.max(...spellingLengths)).toBe([0, 4, 5, 7][difficulty]);
    }
    expect(seen.size).toBeGreaterThan(20);
    averages.push(typingSet(0, difficulty).reduce((sum, text) => sum + text.length, 0));
  }
  expect(averages[0]).toBeLessThan(averages[1]);
  expect(averages[1]).toBeLessThan(averages[2]);
});

it("raises only the completed game's proposal at 80%, once, capped at three", () => {
  const tasks = Array.from({ length: 5 }, (_, i) => ({ mode: "guided" as const, wordId: `word${i}`, expected: "בית" }));
  const p = newSession(initialProgress());
  const s = p.sessions[0];
  s.tasks[0] = tasks;
  s.phase = "clue";
  s.attempts = tasks.map((_, i) => attempt({ task: i, mode: "guided", correct: i < 4, aid: "keyboard" }));
  expect(stageSuccess(tasks, s.attempts, 0)).toBe(0.8);
  const next = recordStageCompletion(p);
  expect(next.recommendations).toEqual({ guided: 2 });
  expect(recordStageCompletion(next)).toBe(next);
  expect(p.recommendations).toBeUndefined();
  s.difficulty = 3;
  expect(recordStageCompletion(p).recommendations?.guided).toBe(3);
  s.attempts[3].correct = false;
  expect(recordStageCompletion(p).recommendations?.guided).toBe(1);
  p.recommendations = { guided: 2 };
  expect(recordStageCompletion(p).recommendations?.guided).toBe(2);
  // A later correction doesn't erase the first answer's error.
  s.attempts.push(attempt({ task: 3, mode: "guided", correct: true }));
  expect(stageSuccess(tasks, s.attempts, 0)).toBe(0.6);
});
it("excludes spelling recall probes and does not promote copying or hints as mastery", () => {
  const tasks = ["a", "b", "c", "d", "e", "a", "b"].map((wordId) => ({ mode: "spelling" as const, wordId }));
  const attempts = tasks.map((_, i) => attempt({ task: 200 + i, correct: true }));
  expect(stageSuccess(tasks, attempts, 2)).toBe(1);
  attempts[1].aid = "copy";
  expect(stageSuccess(tasks, attempts, 2)).toBe(0.8);
  attempts[2].aid = "hint";
  expect(stageSuccess(tasks, attempts, 2)).toBe(0.6);
  attempts[0].skipped = true;
  expect(stageSuccess(tasks, attempts, 2)).toBe(0.4);
});
