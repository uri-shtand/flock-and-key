import { songs, songFor, type SongId } from "../content/Rehearsals";

export type RehearsalSettings = { parts: 2 | 3; support: boolean };
type Result = { outcome: "independent" | "supported" | "skipped"; mistakes: number };
export type RehearsalRun = {
  version: 1;
  song: SongId;
  settings: RehearsalSettings;
  index: number;
  results: Result[];
  helped: boolean;
  mistakes: number;
  variations: number[];
  finished: boolean;
};

export const rehearsalDefaults: RehearsalSettings = { parts: 3, support: false };

export function startRehearsal(song: SongId, settings = rehearsalDefaults): RehearsalRun {
  return { version: 1, song, settings, index: 0, results: [], helped: false, mistakes: 0, variations: [], finished: false };
}

export function rehearsalQuestions(run: Pick<RehearsalRun, "song" | "settings">) {
  const questions = songFor(run.song).questions;
  const practiceParts = [...new Set(questions.map(({ part }) => part))].slice(0, run.settings.parts);
  return questions.filter(({ part }) => practiceParts.includes(part));
}

export function answerRehearsal(run: RehearsalRun, answer: string | null): RehearsalRun {
  const question = rehearsalQuestions(run)[run.index];
  if (!question || run.results[run.index]) return run;
  const normalize = (value: string) => value.trim().normalize("NFC").toLowerCase().replace(/\s+/g, " ");
  const correct = answer !== null && [question.solution, ...(question.alternatives ?? [])].some((value) => normalize(value) === normalize(answer));
  if (answer !== null && !correct) return { ...run, mistakes: Math.min(99, run.mistakes + 1) };
  const outcome = answer === null ? "skipped" : run.helped || run.settings.support ? "supported" : "independent";
  return { ...run, results: [...run.results, { outcome, mistakes: run.mistakes }], mistakes: 0, helped: false };
}

export function nextRehearsalQuestion(run: RehearsalRun): RehearsalRun {
  return run.results[run.index] ? { ...run, index: run.index + 1 } : run;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function count(value: unknown, limit: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= limit;
}

export function validRehearsal(value: unknown): value is RehearsalRun {
  if (!record(value) || value.version !== 1 || !songs.some(({ id }) => value.song === id) ||
      !record(value.settings) || (value.settings.parts !== 2 && value.settings.parts !== 3) ||
      typeof value.settings.support !== "boolean" || typeof value.finished !== "boolean" ||
      typeof value.helped !== "boolean" || !count(value.mistakes, 99)) return false;

  const song = songFor(value.song as SongId);
  const total = rehearsalQuestions({ song: song.id, settings: value.settings as RehearsalSettings }).length;
  if (!count(value.index, total) || !Array.isArray(value.results) ||
      value.results.length < value.index || value.results.length > Math.min(total, value.index + 1) ||
      !value.results.every((result: unknown) => record(result) && count(result.mistakes, 99) &&
        (result.outcome === "skipped" || result.outcome === "supported" ||
          (result.outcome === "independent" && !(value.settings as RehearsalSettings).support))) ||
      !Array.isArray(value.variations) || !value.variations.every((choice: unknown) => count(choice, song.variations.length - 1)) ||
      new Set(value.variations).size !== value.variations.length) return false;

  if ((value.index === total || value.results.length > value.index) && (value.helped || value.mistakes !== 0)) return false;
  return value.index === total || (!value.finished && value.variations.length === 0);
}
