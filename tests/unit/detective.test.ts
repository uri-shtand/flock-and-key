import { describe, it, expect } from 'vitest';
import { appendCase, caseState, newCase, validCase, type CaseEvent } from '../../src/typing/DetectiveCase';
import { loadGame, saveGame, initialProgress, exportCsv, exportJson, resetGame, STORAGE_KEY } from '../../src/progress/GameStore';
import { decisions, decisionIds } from '../../src/content/detective';
function step(run: ReturnType<typeof newCase>, event: CaseEvent) { const next = appendCase(run, event); expect(validCase(next)).toBe(true); return next; }
function yard() { let run = newCase(); for (const clue of ['ribbon', 'dad', 'book', 'postman'] as const) run = step(run, { type: 'inspect', clue }); return run; }
describe('Noga case', () => {
  it('opening every source never solves a decision, and all choices require relevant evidence', () => {
    const run = yard(); expect(caseState(run).links).toEqual({});
    for (const id of ['identity', 'route'] as const) {
      for (const choice of [0, 1]) for (const support of [[], ['stars'], ['today'], ['trip'], ['today', 'trip'], ['stars', 'today', 'trip']]) {
        const next = step(run, { type: 'theory', decision: id, choice, support, guided: false });
        expect(Boolean(caseState(next).links[id])).toBe(choice === decisions[id].correct && decisions[id].support.every(p => support.includes(p)));
      }
    }
  });
  it('both yard orders lead to the bridge, with independent and exploratory discoveries kept separate', () => {
    for (const order of [['identity', 'route'], ['route', 'identity']] as const) {
      let run = yard();
      for (const decision of order) run = step(run, { type: 'theory', decision, choice: decisions[decision].correct, support: [...decisions[decision].support], guided: false });
      run = step(run, { type: 'travel' });
      run = step(run, { type: 'inspect', clue: 'note' });
      const lower = step(run, { type: 'theory', decision: 'search', choice: 0, support: ['usual'], guided: false });
      expect(caseState(lower).place).toBe('bridge');
      const supported = step(lower, { type: 'theory', decision: 'search', choice: 1, support: ['platform'], guided: false });
      expect(caseState(supported).links.search).toBe('supported');
      const explored = step(run, { type: 'theory', decision: 'search', choice: 1, support: [], guided: false });
      expect(caseState(explored).links.search).toBe('explored');
      expect(appendCase(explored, { type: 'theory', decision: 'search', choice: 1, support: [], guided: false })).toBe(explored);
    }
  });
  it('free guided completion works from an empty run, with an explicit help receipt', () => {
    let run = newCase();
    for (const decision of decisionIds) {
      if (decision === 'search') run = step(run, { type: 'travel' });
      for (let i = 0; i < 3; i++) run = step(run, { type: 'hint', decision });
      run = step(run, { type: 'theory', decision, choice: decisions[decision].correct, support: [], guided: true });
    }
    expect(caseState(run).place).toBe('ending');
    expect(caseState(run).attempts.every(a => a.result === 'guided')).toBe(true);
    const corrupt = structuredClone(run); corrupt.events.splice(0, 3); expect(validCase(corrupt)).toBe(false);
  });
  it('preserves bookmarks and tentative choices across serialization without claiming a solution', () => {
    let run = step(yard(), { type: 'pin', decision: 'route', passage: 'today' });
    run = step(run, { type: 'select', decision: 'route', choice: 1 });
    const restored: unknown = JSON.parse(JSON.stringify(run));
    expect(validCase(restored)).toBe(true);
    if (!validCase(restored)) throw Error('invalid save');
    expect(caseState(restored).drafts.route).toEqual({ choice: 1, support: ['today'] });
    expect(caseState(restored).links).toEqual({});
    expect(validCase({ ...newCase(), events: [{ type: 'pin', decision: 'route', passage: 'today' }] })).toBe(false);
  });
  it('rejects forged progression, unknown evidence, missing inspection and impossible completion receipts', () => {
    const run = newCase();
    for (const event of [{ type: 'travel' }, { type: 'inspect', clue: 'note' }, { type: 'theory', decision: 'identity', choice: 0, support: ['stars'], guided: false }, { type: 'theory', decision: 'identity', choice: 0, support: [], guided: true }] as CaseEvent[]) expect(validCase({ ...run, events: [event] })).toBe(false);
    expect(validCase({ ...run, version: 2 })).toBe(false);
    expect(validCase({ ...run, events: [null] })).toBe(false);
  });
  it('isolates corrupt case saves and includes valid cases in shared export and reset', () => {
    const memory = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
    const run = step(yard(), { type: 'theory', decision: 'identity', choice: 0, support: ['stars'], guided: false });
    const progress = { ...initialProgress(), earned: 15, balance: 15, detective: [run] };
    expect(saveGame(progress)).toBe(true); expect(loadGame().progress.detective).toEqual([run]);
    expect(exportJson(progress)).toContain(run.id); expect(exportCsv(progress)).toContain('reading-comprehension-case');
    memory.set(STORAGE_KEY, JSON.stringify({ ...progress, detective: [run, { ...run, events: [{ type: 'travel' }] }] }));
    const loaded = loadGame(); expect(loaded.warning).toContain('תיק בלשי'); expect(loaded.progress.earned).toBe(15); expect(loaded.progress.detective).toEqual([run]);
    expect(resetGame(progress)?.detective).toBeUndefined();
  });
});
