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
  reward,
  type Attempt,
} from "../../src/typing/Learning";
import { initialProgress, newSession } from "../../src/progress/GameStore";
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
  it("varies spelling across sessions, repeats two probes and uses introduced keys in typing", () => {
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
    for (const t of s.tasks.flat().filter((t) => t.mode !== "spelling"))
      for (const letter of t.expected) expect("דגכחלי").toContain(letter);
  });
});
