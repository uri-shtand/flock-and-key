import { words, typingWords, type Mode } from "../content/chapter";
export type Aid = "independent" | "keyboard" | "hint" | "copy" | "recall";
export type Attempt = {
  id: string;
  task: number;
  mode: Mode;
  wordId: string;
  expected: string;
  answer: string;
  at: string;
  correct: boolean;
  skipped: boolean;
  aid: Aid;
  hint: number;
  pasted: boolean;
  keyboardHelp: boolean;
  elapsedMs: number;
  inserted: number;
  errors: number;
  deleted: number;
  physicalCodes: string[];
  points: number;
  timed: boolean;
};
export type Difference = {
  kind: "החלפה" | "תוספת" | "השמטה";
  expected: string;
  actual: string;
};
export function differences(expected: string, actual: string): Difference[] {
  const a = [...expected],
    b = [...actual];
  const d = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
  let i = a.length,
    j = b.length;
  const result: Difference[] = [];
  while (i || j) {
    if (i && j && a[i - 1] === b[j - 1]) {
      i--;
      j--;
    } else if (i && j && d[i][j] === d[i - 1][j - 1] + 1) {
      result.push({ kind: "החלפה", expected: a[--i], actual: b[--j] });
    } else if (j && d[i][j] === d[i][j - 1] + 1) {
      result.push({ kind: "תוספת", expected: "", actual: b[--j] });
    } else {
      result.push({ kind: "השמטה", expected: a[--i], actual: "" });
    }
  }
  return result.reverse();
}
export function editMetrics(previous: string, next: string, expected: string) {
  let start = 0,
    end = 0;
  while (
    start < previous.length &&
    start < next.length &&
    previous[start] === next[start]
  )
    start++;
  while (
    end < previous.length - start &&
    end < next.length - start &&
    previous[previous.length - 1 - end] === next[next.length - 1 - end]
  )
    end++;
  const added = next.slice(start, next.length - end);
  return {
    inserted: added.length,
    deleted: previous.length - start - end,
    errors: [...added].filter(
      (letter, index) => letter !== expected[start + index],
    ).length,
  };
}
export function accuracy(
  a: Pick<Attempt, "inserted" | "errors">,
): number | null {
  return a.inserted
    ? Math.round((100 * Math.max(0, a.inserted - a.errors)) / a.inserted)
    : null;
}
export function rate(
  a: Pick<Attempt, "elapsedMs" | "inserted" | "errors">,
): number | null {
  return a.elapsedMs >= 1000 && a.inserted
    ? Math.round((Math.max(0, a.inserted - a.errors) * 60000) / a.elapsedMs)
    : null;
}
export function taskResults(attempts: Attempt[]): Attempt[] {
  const latest = new Map<number, Attempt>();
  for (const attempt of attempts) latest.set(attempt.task, attempt);
  return [...latest.values()];
}
export function reward(
  a: Omit<Attempt, "points">,
  previous: Attempt[],
  history: Attempt[] = [],
): number {
  if (!a.correct || a.skipped) return 0;
  const own = previous.filter((p) => p.task === a.task);
  const first = !own.length;
  const bonus =
    a.mode === "spelling"
      ? a.aid === "independent" && first
        ? 5
        : 0
      : a.errors === 0 && a.aid !== "copy"
        ? 5
        : 0;
  const comparable = previousComparable(a, [
    ...history,
    ...previous.filter((p) => p.task !== a.task),
  ]);
  const speedBonus =
    a.mode === "speed" &&
    a.timed &&
    a.aid === "independent" &&
    (accuracy(a) ?? 0) >= 95 &&
    comparable &&
    (accuracy(a) ?? 0) >= (accuracy(comparable) ?? 0) &&
    rate(a) !== null &&
    rate(comparable) !== null &&
    rate(a)! > rate(comparable)!
      ? 5
      : 0;
  return 10 + bonus + speedBonus;
}
export function previousComparable(
  a: Omit<Attempt, "points">,
  history: Attempt[],
): Attempt | undefined {
  return [...history]
    .reverse()
    .find(
      (p) =>
        p.correct &&
        !p.skipped &&
        p.mode === a.mode &&
        p.expected === a.expected &&
        p.aid === a.aid &&
        p.timed === a.timed &&
        p.keyboardHelp === a.keyboardHelp &&
        !p.pasted &&
        !a.pasted,
    );
}
export function chooseSpelling(history: Attempt[], seed: number): string[] {
  const last = new Map<string, Attempt>();
  for (const a of history.filter((a) => a.mode === "spelling"))
    last.set(a.wordId, a);
  const scored = words
    .map((word, index) => {
      const a = last.get(word.id);
      const priority =
        a && (!a.correct || a.aid !== "independent") ? 0 : !a ? 1 : 2;
      return { word, priority, order: (index * 37 + seed * 17) % words.length };
    })
    .sort((a, b) => a.priority - b.priority || a.order - b.order);
  const selected: string[] = [];
  const topics = new Set<string>();
  const add = (entry: (typeof scored)[number]) => {
    selected.push(entry.word.id);
    topics.add(entry.word.topic);
  };
  // Reserve room for new vocabulary; repeated difficulty must not trap a child in one list.
  for (const entry of scored.filter((e) => e.priority === 0))
    if (!topics.has(entry.word.topic) && selected.length < 4) add(entry);
  for (const entry of scored.filter((e) => e.priority === 1))
    if (!topics.has(entry.word.topic) && selected.length < 8) add(entry);
  for (const entry of scored)
    if (!topics.has(entry.word.topic) && selected.length < 8) add(entry);
  return [...selected, selected[0], selected[1]];
}
export function typingSet(seed: number): string[] {
  return typingWords.map(
    (_, i) => typingWords[(i + seed) % typingWords.length],
  );
}
