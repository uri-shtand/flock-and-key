import { adventureItems, interactionIds, itemIds, evidenceSentences, deductionBoards, boardIds, type BoardId, type InteractionId, type ItemId } from '../content/detective';
import { caseSources, clues, decisions, decisionIds, sourceIds, defaultCaseSettings, defaultAdventureSettings, type CaseSettings, type Clue, type SourceId, type DecisionId } from '../content/detective';
export type AdventureEvent = { type: 'observe'; interaction: InteractionId } | { type: 'bookmark'; passage: string } | { type: 'collect'; item: ItemId } | { type: 'placeEvidence'; board: BoardId; evidence: string } | { type: 'removeEvidence'; board: BoardId; evidence: string } | { type: 'checkBoard'; board: BoardId; guided: boolean } | { type: 'adventureHint'; board: BoardId } | { type: 'visit'; place: 'yard' | 'bridge' };
export type CaseEvent = AdventureEvent | { type: 'pin'; decision: DecisionId; passage: string } | { type: 'select'; decision: DecisionId; choice: number } | { type: 'inspect'; clue: Clue } | { type: 'hint'; decision: DecisionId } | { type: 'theory'; decision: DecisionId; choice: number; support: string[]; guided: boolean } | { type: 'travel' };
export type CaseRun = { version: 1 | 2; id: string; startedAt: string; settings: CaseSettings; events: CaseEvent[] };
export type CaseAttempt = { decision: DecisionId; choice: number; support: string[]; result: 'supported' | 'guided' | 'explored' | 'revisit'; hints: number; inspected: Clue[]; observed?: InteractionId[] };
export type CaseState = { edition: 1 | 2; observed: InteractionId[]; notebook: string[]; bag: ItemId[]; boards: Record<BoardId, string[]>; place: 'yard' | 'bridge' | 'ending'; inspected: Clue[]; hints: Record<DecisionId, number>; links: Partial<Record<DecisionId, 'supported' | 'guided' | 'explored'>>; attempts: CaseAttempt[]; drafts: Record<DecisionId, { choice: number | null; support: string[] }> };
export function newCase(settings: CaseSettings = defaultCaseSettings): CaseRun {
  return { version: 1, id: crypto.randomUUID(), startedAt: new Date().toISOString(), settings: { ...settings }, events: [] };
}
export function newAdventure(settings: CaseSettings = defaultAdventureSettings): CaseRun { return { ...newCase(settings), version: 2 }; }
export function initialCaseState(edition: 1 | 2 = 1): CaseState { return { edition, observed: [], notebook: [], bag: [], boards: { happened: [], where: [] }, place: 'yard', inspected: [], hints: { identity: 0, route: 0, search: 0 }, links: {}, attempts: [], drafts: { identity: { choice: null, support: [] }, route: { choice: null, support: [] }, search: { choice: null, support: [] } } }; }
export function reduceCase(s: CaseState, e: CaseEvent): CaseState | null {
  if (s.place === 'ending') return null;
  if (s.edition === 2) return reduceAdventure(s, e);
  if (['observe', 'bookmark', 'collect', 'placeEvidence', 'removeEvidence', 'checkBoard', 'adventureHint', 'visit'].includes(e.type)) return null;
  const legacy = e as Exclude<CaseEvent, AdventureEvent>;
  return reduceLegacy(s, legacy);
}
function reduceLegacy(s: CaseState, e: Exclude<CaseEvent, AdventureEvent>): CaseState | null {
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
export function caseState(run: CaseRun): CaseState { return run.events.reduce((s, e) => reduceCase(s, e) ?? s, initialCaseState(run.version)); }
export function appendCase(run: CaseRun, event: CaseEvent): CaseRun { return reduceCase(caseState(run), event) ? { ...run, events: [...run.events, event] } : run; }
export function validCase(value: unknown): value is CaseRun {
  if (!value || typeof value !== 'object') return false;
  const r = value as CaseRun;
  if (![1, 2].includes(r.version) || typeof r.id !== 'string' || !r.id || typeof r.startedAt !== 'string' || !Number.isFinite(Date.parse(r.startedAt)) || !r.settings || ['guided', 'labels', 'reducedMotion'].some(k => typeof r.settings[k as keyof CaseSettings] !== 'boolean') || !Array.isArray(r.events) || r.events.length > 5000) return false;
  let s = initialCaseState(r.version);
  try { for (const event of r.events) { if (!event || typeof event !== 'object') return false; const next = reduceCase(s, event); if (!next) return false; s = next; } } catch { return false; }
  return true;
}
export function openedSources(s: CaseState): SourceId[] { return sourceIds.filter(id => s.inspected.includes(id)); }

export function availableEvidence(s: CaseState): string[] { return [...s.notebook, ...s.bag]; }
export function boardDecision(board: BoardId): DecisionId { return board === 'happened' ? 'identity' : 'route'; }
export function boardSolved(s: CaseState, board: BoardId): boolean { return Boolean(s.links[boardDecision(board)]); }
function reduceAdventure(s: CaseState, event: CaseEvent): CaseState | null {
  const e = event as AdventureEvent;
  if (e.type === 'observe') {
    if (!interactionIds.includes(e.interaction) || (['note', 'lower', 'curtain'].includes(e.interaction) ? s.place !== 'bridge' : s.place !== 'yard')) return null;
    return { ...s, observed: [...new Set([...s.observed, e.interaction])], inspected: [...new Set([...s.inspected, ...((clues as readonly string[]).includes(e.interaction) ? [e.interaction as Clue] : [])])] };
  }
  if (e.type === 'visit') return ['yard', 'bridge'].includes(e.place) && e.place !== s.place ? { ...s, place: e.place } : null;
  if (e.type === 'bookmark') {
    if (!evidenceSentences.some(line => line.id === e.passage && s.observed.includes(line.source))) return null;
    // Removing a note also returns any copies on the deduction board.
    const removing = s.notebook.includes(e.passage);
    if (removing && boardIds.some(board => boardSolved(s, board) && s.boards[board].includes(e.passage))) return null;
    return { ...s, notebook: removing ? s.notebook.filter(id => id !== e.passage) : [...s.notebook, e.passage], boards: removing ? { happened: s.boards.happened.filter(id => id !== e.passage), where: s.boards.where.filter(id => id !== e.passage) } : s.boards };
  }
  if (e.type === 'collect') {
    if (!itemIds.includes(e.item) || s.bag.includes(e.item) || !s.observed.includes(adventureItems[e.item].source)) return null;
    return { ...s, bag: [...s.bag, e.item] };
  }
  if (!('board' in e) || !boardIds.includes(e.board)) return null;
  const board = e.board, decision = boardDecision(board);
  if (boardSolved(s, board)) return null;
  if (e.type === 'adventureHint') return s.hints[decision] < 3 ? { ...s, hints: { ...s.hints, [decision]: s.hints[decision] + 1 } } : null;
  if (e.type === 'placeEvidence') {
    if (!availableEvidence(s).includes(e.evidence) || s.boards[board].includes(e.evidence) || s.boards[board].length >= 3) return null;
    return { ...s, boards: { ...s.boards, [board]: [...s.boards[board], e.evidence] } };
  }
  if (e.type === 'removeEvidence') return s.boards[board].includes(e.evidence) ? { ...s, boards: { ...s.boards, [board]: s.boards[board].filter(id => id !== e.evidence) } } : null;
  if (e.type !== 'checkBoard' || typeof e.guided !== 'boolean' || (e.guided && s.hints[decision] !== 3)) return null;
  const selected = s.boards[board];
  if (!e.guided && selected.length !== 3) return null;
  const supported = selected.length === 3 && deductionBoards[board].groups.every(group => (group as readonly string[]).some(id => selected.includes(id)));
  const result = e.guided ? 'guided' : supported ? 'supported' : 'revisit';
  const links = result === 'revisit' ? s.links : { ...s.links, [decision]: result };
  return { ...s, links, place: links.identity && links.route ? 'ending' : s.place, attempts: [...s.attempts, { decision, choice: decisions[decision].correct, support: [...selected], result, hints: s.hints[decision], inspected: [...s.inspected], observed: [...s.observed] }] };
}
