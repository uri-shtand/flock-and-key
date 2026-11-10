import {
  stages,
  prizes,
  wordById,
  type Mode,
  type PrizeId,
} from "../content/chapter";
import { chooseSpelling, typingSet, type Attempt } from "../typing/Learning";
export type Phase = "intro" | "warmup" | "play" | "clue" | "ending";
export type Task = { mode: Mode; wordId: string; expected: string };
export type Draft = {
  input: string;
  hint: number;
  keyboard: boolean;
  pasted: boolean;
  elapsedMs: number;
  inserted: number;
  errors: number;
  deleted: number;
  physicalCodes: string[];
  done: boolean;
  message: string;
};
export type Session = {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: "active" | "completed" | "abandoned";
  standalone: boolean;
  stage: number;
  index: number;
  phase: Phase;
  tasks: Task[][];
  attempts: Attempt[];
  draft: Draft;
  timed: boolean;
  exposedWords: string[];
  playMs: number;
};
export type GameProgress = {
  version: 2;
  sessions: Session[];
  currentId: string | null;
  balance: number;
  earned: number;
  owned: PrizeId[];
  equipped: PrizeId[];
  knownCodes: string[];
  settings: { music: boolean; speech: boolean };
};
export const STORAGE_KEY = "flock-and-key:game:v2";
export function emptyDraft(): Draft {
  return {
    input: "",
    hint: 0,
    keyboard: false,
    pasted: false,
    elapsedMs: 0,
    inserted: 0,
    errors: 0,
    deleted: 0,
    physicalCodes: [],
    done: false,
    message: "",
  };
}
export function initialProgress(): GameProgress {
  return {
    version: 2,
    sessions: [],
    currentId: null,
    balance: 0,
    earned: 0,
    owned: [],
    equipped: [],
    knownCodes: [],
    settings: { music: true, speech: true },
  };
}
export function allAttempts(p: GameProgress): Attempt[] {
  return p.sessions.flatMap((s) => s.attempts);
}
export function activeSession(p: GameProgress): Session | undefined {
  return p.sessions.find((s) => s.id === p.currentId);
}
export function updateSession(
  p: GameProgress,
  update: (s: Session) => Session,
): GameProgress {
  return {
    ...p,
    sessions: p.sessions.map((s) => (s.id === p.currentId ? update(s) : s)),
  };
}
export function newSession(p: GameProgress, mode?: Mode): GameProgress {
  const seed = p.sessions.length;
  const typed = typingSet(seed);
  const tasks = stages.map((stage) =>
    stage.mode === "spelling"
      ? chooseSpelling(allAttempts(p), seed).map((id) => ({
          mode: stage.mode,
          wordId: id,
          expected: wordById(id)!.text,
        }))
      : typed.map((expected) => ({
          mode: stage.mode,
          wordId: "typing:" + expected,
          expected,
        })),
  );
  const session: Session = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    status: "active",
    standalone: Boolean(mode),
    stage: mode ? stages.findIndex((s) => s.mode === mode) : 0,
    index: 0,
    phase: "intro",
    tasks,
    attempts: [],
    draft: emptyDraft(),
    timed: false,
    exposedWords: [],
    playMs: 0,
  };
  const sessions = p.sessions.map((s) =>
    s.id === p.currentId && s.status === "active"
      ? {
          ...s,
          status: "abandoned" as const,
          endedAt: new Date().toISOString(),
        }
      : s,
  );
  return { ...p, sessions: [...sessions, session], currentId: session.id };
}
const record = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const strings = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((v) => typeof v === "string");
const finite = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= 0;
const integer = (x: unknown): x is number =>
  finite(x) && Number.isSafeInteger(x);
const modes = ["guided", "blind", "spelling", "speed"];
const prizeIds: string[] = prizes.map((p) => p.id);
function validDraft(d: unknown): boolean {
  return (
    record(d) &&
    typeof d.input === "string" &&
    integer(d.hint) &&
    d.hint <= 2 &&
    typeof d.keyboard === "boolean" &&
    typeof d.pasted === "boolean" &&
    finite(d.elapsedMs) &&
    integer(d.inserted) &&
    integer(d.errors) &&
    d.errors <= d.inserted &&
    integer(d.deleted) &&
    strings(d.physicalCodes) &&
    typeof d.done === "boolean" &&
    typeof d.message === "string"
  );
}
function validAttempt(a: unknown): boolean {
  return (
    record(a) &&
    typeof a.id === "string" &&
    integer(a.task) &&
    modes.includes(String(a.mode)) &&
    typeof a.wordId === "string" &&
    typeof a.expected === "string" &&
    typeof a.answer === "string" &&
    typeof a.at === "string" &&
    typeof a.correct === "boolean" &&
    typeof a.skipped === "boolean" &&
    ["independent", "keyboard", "hint", "copy", "recall"].includes(
      String(a.aid),
    ) &&
    integer(a.hint) &&
    a.hint <= 2 &&
    typeof a.pasted === "boolean" &&
    typeof a.keyboardHelp === "boolean" &&
    finite(a.elapsedMs) &&
    integer(a.inserted) &&
    integer(a.errors) &&
    a.errors <= a.inserted &&
    integer(a.deleted) &&
    strings(a.physicalCodes) &&
    integer(a.points) &&
    typeof a.timed === "boolean"
  );
}
function validSession(s: unknown): boolean {
  if (
    !record(s) ||
    typeof s.id !== "string" ||
    typeof s.startedAt !== "string" ||
    (s.endedAt !== undefined && typeof s.endedAt !== "string") ||
    !["active", "completed", "abandoned"].includes(String(s.status)) ||
    typeof s.standalone !== "boolean" ||
    !integer(s.stage) ||
    s.stage > 3 ||
    !integer(s.index) ||
    !["intro", "warmup", "play", "clue", "ending"].includes(String(s.phase)) ||
    typeof s.timed !== "boolean" ||
    !strings(s.exposedWords) ||
    !finite(s.playMs) ||
    !validDraft(s.draft) ||
    !Array.isArray(s.attempts) ||
    !s.attempts.every(validAttempt) ||
    !Array.isArray(s.tasks) ||
    s.tasks.length !== 4
  )
    return false;
  return (
    s.tasks.every(
      (group, stage) =>
        Array.isArray(group) &&
        group.length > 0 &&
        group.length <= 50 &&
        group.every(
          (t) =>
            record(t) &&
            t.mode === stages[stage].mode &&
            typeof t.wordId === "string" &&
            typeof t.expected === "string" &&
            t.expected.length > 0 &&
            t.expected.length <= 100 &&
            (t.mode !== "spelling" || wordById(t.wordId)?.text === t.expected),
        ),
    ) &&
    Array.isArray(s.tasks[s.stage]) &&
    s.index < s.tasks[s.stage].length
  );
}
export function loadGame(): { progress: GameProgress; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: initialProgress(), warning: "" };
    const x: unknown = JSON.parse(raw);
    if (
      !record(x) ||
      x.version !== 2 ||
      !Array.isArray(x.sessions) ||
      !x.sessions.every(validSession) ||
      !(x.currentId === null || typeof x.currentId === "string") ||
      !integer(x.balance) ||
      !integer(x.earned) ||
      x.balance > x.earned ||
      !strings(x.owned) ||
      !x.owned.every((id) => prizeIds.includes(id)) ||
      !strings(x.equipped) ||
      !x.equipped.every(
        (id) => x.owned instanceof Array && x.owned.includes(id),
      ) ||
      !strings(x.knownCodes) ||
      !record(x.settings) ||
      typeof x.settings.music !== "boolean" ||
      typeof x.settings.speech !== "boolean"
    )
      throw Error("invalid");
    const progress = x as unknown as GameProgress;
    if (
      progress.currentId &&
      !progress.sessions.some((s) => s.id === progress.currentId)
    )
      throw Error("missing session");
    return { progress, warning: "" };
  } catch {
    return {
      progress: initialProgress(),
      warning:
        "השמירה הקודמת אינה זמינה או אינה תקינה. אפשר לשחק; כדאי לייצא נתונים זמינים ממסך ההורה.",
    };
  }
}
export function saveGame(p: GameProgress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
// Persist the empty model first. A failed reset leaves both the live model and
// its existing stored value intact; never clear unrelated localStorage keys.
export function resetGame(p: GameProgress): GameProgress | null {
  const next = { ...initialProgress(), settings: { ...p.settings } };
  return saveGame(next) ? next : null;
}
export function buyOrToggle(p: GameProgress, id: PrizeId): GameProgress {
  const prize = prizes.find((x) => x.id === id)!;
  if (p.owned.includes(id))
    return {
      ...p,
      equipped: p.equipped.includes(id)
        ? p.equipped.filter((x) => x !== id)
        : [...p.equipped, id],
    };
  if (p.balance < prize.price) return p;
  return {
    ...p,
    balance: p.balance - prize.price,
    owned: [...p.owned, id],
    equipped: [...p.equipped, id],
  };
}
export function exportJson(p: GameProgress): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), ...p },
    null,
    2,
  );
}
export function exportCsv(p: GameProgress): string {
  const cell = (v: unknown) => {
    const text = String(v ?? "");
    return (
      '"' +
      (/^(?:\s*[=+@\-]|[\t\r])/.test(text) ? "'" : "") +
      text.replaceAll('"', '""') +
      '"'
    );
  };
  const rows: unknown[][] = [
    [
      "session",
      "status",
      "startedAt",
      "task",
      "mode",
      "word",
      "answer",
      "correct",
      "skipped",
      "aid",
      "hint",
      "pasted",
      "keyboardHelp",
      "elapsedMs",
      "inserted",
      "errors",
      "deleted",
      "physicalCodes",
      "points",
      "timed",
      "at",
    ],
  ];
  for (const s of p.sessions)
    for (const a of s.attempts)
      rows.push([
        s.id,
        s.status,
        s.startedAt,
        a.task,
        a.mode,
        a.expected,
        a.answer,
        a.correct,
        a.skipped,
        a.aid,
        a.hint,
        a.pasted,
        a.keyboardHelp,
        a.elapsedMs,
        a.inserted,
        a.errors,
        a.deleted,
        a.physicalCodes.join(" "),
        a.points,
        a.timed,
        a.at,
      ]);
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
