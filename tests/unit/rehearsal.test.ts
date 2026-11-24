import { existsSync } from "node:fs";
import { expect, it } from "vitest";
import { songs, songAudio, songLyrics } from "../../src/content/Rehearsals";
import { answerRehearsal, nextRehearsalQuestion, rehearsalQuestions, startRehearsal, validRehearsal } from "../../src/typing/Rehearsal";

it("keeps rehearsal snapshots valid throughout every song and distinguishes assistance from correction", () => {
  expect(songs.filter(song => song.group === "series")).toHaveLength(3);
  expect(songs.filter(song => song.group === "farm")).toHaveLength(3);
  expect(new Set(songs.map(song => song.id)).size).toBe(songs.length);
  for (const song of songs) {
    expect(existsSync(`public/${songAudio(song.id).replace(/^\//, "")}`)).toBe(true);
    const lyrics = songLyrics(song.id);
    expect(lyrics.parts.length).toBeGreaterThanOrEqual(3);
    expect(lyrics.parts[0].start).toBeGreaterThanOrEqual(lyrics.start);
    expect(lyrics.parts.at(-1)?.end).toBe(lyrics.end);
    lyrics.parts.forEach((part, index) => {
      expect(part.end).toBeGreaterThan(part.start);
      if (index > 0) expect(part.start).toBe(lyrics.parts[index - 1].end);
      part.lines.forEach((line, position) => {
        expect(line.start).toBeGreaterThanOrEqual(part.start);
        expect(line.start).toBeLessThan(part.end);
        if (position > 0) expect(line.start).toBeGreaterThan(part.lines[position - 1].start);
        expect(line.hebrew).not.toBe("");
      });
    });
    let run = startRehearsal(song.id);
    for (const question of rehearsalQuestions(run)) {
      expect(question.part).toBeLessThan(songLyrics(song.id).parts.length);
      if (question.options) expect(question.options).toContain(question.solution);
      expect(validRehearsal(run)).toBe(true);
      run = answerRehearsal(run, "unmatched");
      expect(validRehearsal(run)).toBe(true);
      const helped = run.index % 2 === 1;
      run = answerRehearsal({ ...run, helped }, question.solution);
      expect(run.results[run.index]).toEqual({ outcome: helped ? "supported" : "independent", mistakes: 1 });
      expect(answerRehearsal(run, null)).toBe(run);
      expect(validRehearsal(run)).toBe(true);
      run = nextRehearsalQuestion(run);
    }
    expect(validRehearsal({ ...run, variations: [0, 2], finished: true })).toBe(true);
    expect(validRehearsal({ ...run, variations: [2, 2], finished: true })).toBe(false);
    expect(validRehearsal({ ...run, helped: true })).toBe(false);
  }
});

it("rejects snapshots that reach direction or encore before resolving the required questions", () => {
  const run = startRehearsal("rhythm", { parts: 2, support: true });
  expect(rehearsalQuestions(run)).toHaveLength(4);
  expect(validRehearsal({ ...run, index: 4, finished: true })).toBe(false);
  expect(validRehearsal({ ...run, variations: [0] })).toBe(false);
  const skipped = answerRehearsal(run, null);
  expect(skipped.results[0].outcome).toBe("skipped");
  expect(validRehearsal(skipped)).toBe(true);
  expect(validRehearsal({ ...skipped, results: [{ outcome: "independent", mistakes: 0 }] })).toBe(false);
});
