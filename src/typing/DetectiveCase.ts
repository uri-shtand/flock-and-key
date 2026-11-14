import { caseSources, clues, decisions, decisionIds, sourceIds, defaultCaseSettings, type CaseSettings, type Clue, type SourceId, type DecisionId } from '../content/detective';
export type CaseEvent = { type: 'pin'; decision: DecisionId; passage: string } | { type: 'select'; decision: DecisionId; choice: number } | { type: 'inspect'; clue: Clue } | { type: 'hint'; decision: DecisionId } | { type: 'theory'; decision: DecisionId; choice: number; support: string[]; guided: boolean } | { type: 'travel' };
export type CaseRun = { version: 1; id: string; startedAt: string; settings: CaseSettings; events: CaseEvent[] };
export type CaseAttempt = { decision: DecisionId; choice: number; support: string[]; result: 'supported' | 'guided' | 'explored' | 'revisit'; hints: number; inspected: Clue[] };
export type CaseState = { place: 'yard' | 'bridge' | 'ending'; inspected: Clue[]; hints: Record<DecisionId, number>; links: Partial<Record<DecisionId, 'supported' | 'guided' | 'explored'>>; attempts: CaseAttempt[]; drafts: Record<DecisionId, { choice: number | null; support: string[] }> };
export function newCase(settings: CaseSettings = defaultCaseSettings): CaseRun {
  return { version: 1, id: crypto.randomUUID(), startedAt: new Date().toISOString(), settings: { ...settings }, events: [] };
}
export function initialCaseState(): CaseState { return { place: 'yard', inspected: [], hints: { identity: 0, route: 0, search: 0 }, links: {}, attempts: [], drafts: { identity: { choice: null, support: [] }, route: { choice: null, support: [] }, search: { choice: null, support: [] } } }; }
export function reduceCase(s: CaseState, e: CaseEvent): CaseState | null {
  if (s.place === 'ending') return null;
  if (e.type === 'inspect') {
    if (!clues.includes(e.clue) || (e.clue === 'note' ? s.place !== 'bridge' : s.place !== 'yard')) return null;
    return { ...s, inspected: [...new Set([...s.inspected, e.clue])] };
  }
  if (e.type === 'travel') return s.place === 'yard' && s.links.identity && s.links.route ? { ...s, place: 'bridge' } : null;
  if (!decisionIds.includes(e.decision) || (e.decision === 'search' ? s.place !== 'bridge' : s.place !== 'yard') || s.links[e.decision]) return null;
  if (e.type === 'hint') return s.hints[e.decision] < 3 ? { ...s, hints: { ...s.hints, [e.decision]: s.hints[e.decision] + 1 } } : null;
  if (e.type === 'select') return [0, 1].includes(e.choice) ? { ...s, drafts: { ...s.drafts, [e.decision]: { ...s.drafts[e.decision], choice: e.choice } } } : null;
  if (e.type === 'pin') {
    const available = sourceIds.filter(id => s.inspected.includes(id)).flatMap(id => caseSources[id].strips.map(strip => strip.id as string));
    if (!available.includes(e.passage)) return null;
    const previous = s.drafts[e.decision];
    return { ...s, drafts: { ...s.drafts, [e.decision]: { ...previous, support: previous.support.includes(e.passage) ? previous.support.filter(p => p !== e.passage) : [...previous.support, e.passage] } } };
  }
  if (e.type !== 'theory' || ![0, 1].includes(e.choice) || typeof e.guided !== 'boolean' || !Array.isArray(e.support) || new Set(e.support).size !== e.support.length) return null;
  const known = sourceIds.filter(id => s.inspected.includes(id)).flatMap(id => caseSources[id].strips.map(strip => strip.id as string));
  if (!e.support.every(id => known.includes(id))) return null;
  const rule = decisions[e.decision];
  if (e.guided && (s.hints[e.decision] !== 3 || e.choice !== rule.correct)) return null;
  const ready = rule.sources.every(id => s.inspected.includes(id)) && (e.decision !== 'identity' || s.inspected.includes('ribbon'));
  const supported = ready && rule.support.every(id => e.support.includes(id)) && e.choice === rule.correct;
  const result: CaseAttempt['result'] = e.guided ? 'guided' : supported ? 'supported' : e.decision === 'search' && e.choice === 1 ? 'explored' : 'revisit';
  return { ...s, links: result === 'revisit' ? s.links : { ...s.links, [e.decision]: result }, place: result !== 'revisit' && e.decision === 'search' ? 'ending' : s.place, attempts: [...s.attempts, { decision: e.decision, choice: e.choice, support: [...e.support], result, hints: s.hints[e.decision], inspected: [...s.inspected] }] };
}
export function caseState(run: CaseRun): CaseState { return run.events.reduce((s, e) => reduceCase(s, e) ?? s, initialCaseState()); }
export function appendCase(run: CaseRun, event: CaseEvent): CaseRun { return reduceCase(caseState(run), event) ? { ...run, events: [...run.events, event] } : run; }
export function validCase(value: unknown): value is CaseRun {
  if (!value || typeof value !== 'object') return false;
  const r = value as CaseRun;
  if (r.version !== 1 || typeof r.id !== 'string' || !r.id || typeof r.startedAt !== 'string' || !Number.isFinite(Date.parse(r.startedAt)) || !r.settings || ['guided', 'labels', 'reducedMotion'].some(k => typeof r.settings[k as keyof CaseSettings] !== 'boolean') || !Array.isArray(r.events) || r.events.length > 5000) return false;
  let s = initialCaseState();
  try { for (const event of r.events) { if (!event || typeof event !== 'object') return false; const next = reduceCase(s, event); if (!next) return false; s = next; } } catch { return false; }
  return true;
}
export function openedSources(s: CaseState): SourceId[] { return sourceIds.filter(id => s.inspected.includes(id)); }
