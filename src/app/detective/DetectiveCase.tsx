import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DialoguePanel, CharacterPortrait } from '../../components/DialoguePanel';
import { itemIds, boardIds, defaultAdventureSettings, type BoardId, type InteractionId, type CaseSettings, type ItemId } from '../../content/detective';
import { adventureContent, adventureLines, type AdventureEdition, type CasePlace } from '../../content/stationCases';
import { appendCase, availableEvidence, boardDecision, boardSolved, caseState, newAdventure, type CaseEvent, type CaseRun } from '../../typing/DetectiveCase';
import { DetectiveWorld } from './DetectiveWorld';
import { DetectiveProp, ItemArt } from './DetectiveTools';
import { isCorrectAnswer } from '../../typing/TypingEngine';
import { stationArt } from '../../content/station';
import './detective.css';

type Panel = 'intro' | 'interaction' | 'notebook' | 'bag' | 'solve' | 'help' | 'lab' | null;
const yardSpots: { id: InteractionId; title: string; x: number; y: number }[] = [
  { id: 'dad', title: 'לדבר עם אבא', x: 81, y: 42 }, { id: 'postman', title: 'לשאול את הדוור', x: 28, y: 47 },
  { id: 'ribbon', title: 'הסרט בעגלה', x: 63, y: 54 }, { id: 'book', title: 'פנקס המשלוחים', x: 50, y: 46 },
  { id: 'sheep', title: 'הכבשה בחצר', x: 15, y: 74 },
  { id: 'tracks', title: 'עקבות הקמח', x: 76, y: 77 }, { id: 'basket', title: 'הסל של פיצי', x: 45, y: 87 },
];
const bridgeSpots: typeof yardSpots = [
  { id: 'note', title: 'הפתק של השומר', x: 9, y: 53 }, { id: 'lower', title: 'מתחת לקשת', x: 49, y: 73 }, { id: 'curtain', title: 'המחיצה על הבמה', x: 58, y: 30 },
];
function CaseModal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => { dialog.close(); }; }, []);
  return <dialog className={`case-modal ${wide ? 'case-modal-wide' : ''}`} ref={ref} aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }}>
    <header className="case-modal-heading"><h2>{title}</h2><button onClick={onClose} aria-label="סגירה וחזרה למפה">סוגרים ×</button></header>{children}
  </dialog>;
}
function Pager({ page, count, setPage, onDone }: { page: number; count: number; setPage: (page: number) => void; onDone?: () => void }) {
  return count > 1 || onDone ? <nav className="case-pager" aria-label="דפדוף"><button disabled={page === 0} onClick={() => setPage(page - 1)}>הקודם</button><span>{page + 1} / {count}</span><button disabled={page >= count - 1 && !onDone} onClick={() => page >= count - 1 ? onDone?.() : setPage(page + 1)}>{page >= count - 1 && onDone ? "סיימנו בינתיים" : "הבא"}</button></nav> : null;
}
export function DetectiveCase({ runs, onChange, onExit, edition = 2, fresh = false }: { runs: CaseRun[]; onChange: (run: CaseRun) => void; onExit: () => void; edition?: AdventureEdition; fresh?: boolean }) {
  const latest = fresh ? undefined : [...runs].reverse().find(run => run.version === edition);
  const station = edition !== 2;
  const content = adventureContent(edition);
  const { interactions: adventureInteractions, items: adventureItems, boards: deductionBoards } = content;
  const evidenceSentences = adventureLines(edition);
  const [legacyNotice] = useState(edition === 2 && !latest && runs.some(run => run.version === 1));
  const [run, setRun] = useState(() => latest ?? newAdventure(defaultAdventureSettings, edition));
  const [paused, setPaused] = useState(Boolean(latest));
  const [panel, setPanel] = useState<Panel>(() => latest ? null : 'intro');
  const [interaction, setInteraction] = useState<InteractionId>('dad');
  const [page, setPage] = useState(0);
  const [trayPage, setTrayPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [helpBoard, setHelpBoard] = useState<BoardId>('happened');
  const [settings, setSettings] = useState<CaseSettings>(run.settings);
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [receiptFeedback, setReceiptFeedback] = useState('');
  const [osReduced, setOsReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const state = caseState(run);
  const stateRef = useRef(state); stateRef.current = state;
  const source = adventureInteractions[interaction]!;
  const currentLine = source.lines[Math.min(page, source.lines.length - 1)];
  const collection = panel === 'bag' ? state.bag : state.notebook;
  const evidence = availableEvidence(state);
  const stopped = paused || panel !== null;
  const dragEvidence = useRef<string | null>(null);
  useEffect(() => { onChange(run); }, [run]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setOsReduced(media.matches);
    const stop = () => setPaused(true);
    const hidden = () => { if (document.hidden) stop(); };
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape' && !document.querySelector('dialog[open]')) setPaused(true); };
    media.addEventListener('change', motion); window.addEventListener('blur', stop); document.addEventListener('visibilitychange', hidden); window.addEventListener('keydown', key);
    return () => { media.removeEventListener('change', motion); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('keydown', key); };
  }, []);
  function act(event: CaseEvent) { setRun(r => appendCase(r, event)); }
  function open(next: Panel) { setPanel(next); setPage(0); setMessage(''); setSelected(null); if (next === 'solve') setTrayPage(0); }
  function inspect(id: InteractionId) { act({ type: 'observe', interaction: id }); setInteraction(id); setReceipt(''); setReceiptFeedback(''); open('interaction'); }
  function restart(effective: CaseSettings) { setRun(newAdventure(effective, edition)); setPaused(false); open('intro'); }
  function put(board: BoardId, id: string) {
    const current = stateRef.current;
    if (!availableEvidence(current).includes(id) || boardSolved(current, board)) return;
    if (current.boards[board].length === 3) { setMessage('הטבלה מלאה. הוציאו רמז כדי לנסות חיבור אחר.'); return; }
    act({ type: 'placeEvidence', board, evidence: id }); setSelected(null); setMessage('');
  }
  function check(board: BoardId, guided = false) {
    const next = appendCase(run, { type: 'checkBoard', board, guided });
    if (next === run) return;
    const nextState = caseState(next);
    setRun(next);
    setMessage(boardSolved(nextState, board) ? deductionBoards[board].conclusion : 'יש כאן שלושה רמזים, אבל הם עדיין לא מספרים סיפור אחד. אפשר להוציא רמז ולהחליף אותו.');
    if (nextState.place === 'ending') setPanel(null);
    else if (guided) setPanel('solve');
  }
  function clueArt(id: ItemId) { return station ? <span aria-hidden="true" className="station-evidence-icon">▤</span> : <ItemArt item={id} />; }
  function clueCard(id: string) {
    const item = itemIds.includes(id as typeof itemIds[number]) ? id as typeof itemIds[number] : null;
    return <>{item && clueArt(item)}<span>{item ? adventureItems[item]?.title : evidenceSentences.find(line => line.id === id)?.text}</span></>;
  }
  const spots = station ? content.spots.filter(spot => spot.place === state.place).map(spot => ({ ...spot, title: adventureInteractions[spot.id]!.title })) : state.place === 'yard' ? yardSpots : bridgeSpots;
  const place = state.place === 'ending' ? (station ? 'bridge' : 'yard') : state.place;
  return <section className="detective" aria-label="תיק בלשי קטן" dir="rtl">
    <header className="detective-header"><div><span>{station ? 'מחברת החקירות של האחים' : 'התיק של תום ופיצי'}</span><h1>{content.title}</h1></div><nav aria-label="כלי חקירה"><button onClick={onExit}>{station ? 'לתחנה' : 'הביתה'}</button><button onClick={() => setPaused(true)}>הפסקה</button><button onClick={() => { setSettings(run.settings); setCopied(false); open('lab'); }}>אפשרויות</button></nav></header>
    <div className="detective-map">
      <div className={`adventure-world ${run.settings.labels ? 'show-labels' : ''}`}>
        <DetectiveWorld view={{ place: state.place, art: station ? content.places[place]?.art : undefined, label: content.places[place]?.label, stopped, reduced: osReduced || run.settings.reducedMotion, reaction: run.events.length, ribbonTaken: state.bag.includes('ribbon'), spoonTaken: state.bag.includes('spoon') }} />
        <div className="detective-location">{!station && state.place === 'ending' ? 'המסלול של נוגה' : content.places[place]?.label}</div>
        {!stopped && state.place !== 'ending' && spots.map(spot => <button key={spot.id} className={`detective-hotspot spot-${spot.id} ${state.observed.includes(spot.id) ? 'visited' : ''}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }} onClick={() => inspect(spot.id)} aria-label={spot.title}><span aria-hidden="true">{state.observed.includes(spot.id) ? '✓' : adventureInteractions[spot.id]?.kind === 'talk' ? '…' : '⌕'}</span><b>{spot.title}</b></button>)}
      </div>
      {state.place !== 'ending' && !paused && (station ? <nav className="station-case-travel" aria-label="מקומות בחקירה">
        {(Object.keys(content.places) as CasePlace[]).map(destination => <button key={destination} disabled={panel !== null || state.place === destination} aria-current={state.place === destination ? 'location' : undefined} onClick={() => { act({ type: 'visit', place: destination }); setMessage(''); }}>{content.places[destination]?.label}</button>)}
      </nav> : <button className="case-travel" disabled={panel !== null} onClick={() => { act({ type: 'visit', place: state.place === 'yard' ? 'bridge' : 'yard' }); setMessage(''); }}>{state.place === 'yard' ? 'לשביל אל הגשר ←' : 'בחזרה לחווה ←'}</button>)}
      {paused && <div className="detective-pause"><DetectiveProp kind="notebook"/><h2>החקירה מחכה לכם</h2><p>פיצי שומר על הדברים. אפשר להמשיך בנחת.</p><button onClick={() => setPaused(false)}>ממשיכים בחקירה</button></div>}
      {state.place === 'ending' && !paused && <div className="case-ending">{edition === 3 && <img className="station-case-finale-portrait" src={stationArt('portrait-noga')} alt="נוגה" />}<span>התיק נפתר!</span><h2>{content.ending[0]}</h2><p>{content.ending[1]}</p><p>{content.ending[2]}</p><div className="case-actions"><button onClick={onExit}>{station ? 'לתחנה' : 'בחזרה לפיקניק'}</button><button onClick={() => restart(run.settings)}>שוב אותו תיק</button></div></div>}
    </div>
    <aside className="detective-hud" aria-label="כלי הבלש">
      <button className="case-tool notebook-tool" disabled={paused} onClick={() => open('notebook')}><DetectiveProp kind="notebook"/><span>מחברת הרמזים<small>{state.notebook.length} משפטים</small></span></button>
      <button className="case-tool bag-tool" disabled={paused} onClick={() => open('bag')}><DetectiveProp kind="bag"/><span>תיק החפצים<small>{state.bag.length} חפצים</small></span></button>
      <p className="case-objective">{state.place === 'ending' ? 'התיק נסגר.' : run.settings.guided ? content.guided : content.objective}</p>
      <button className="case-solve-tool" disabled={paused || state.place === 'ending'} onClick={() => open('solve')}><DetectiveProp kind="solve"/>בוא ננסה לפתור</button>
    </aside>
    {panel && <CaseModal title={panel === 'intro' ? content.title : panel === 'interaction' ? source.title : panel === 'notebook' ? 'מחברת הרמזים' : panel === 'bag' ? 'תיק החפצים' : panel === 'solve' ? 'בוא ננסה לפתור' : panel === 'help' ? 'חושבים עם פיצי' : 'אפשרויות החקירה'} onClose={() => open(null)} wide={panel === 'solve'}>
      {paused ? <div className="case-modal-paused"><p>החקירה בהפסקה. כל מה שאספתם נשמר.</p><button onClick={() => setPaused(false)}>ממשיכים בחקירה</button></div> : panel === 'intro' ? <div className="case-intro">
        {legacyNotice && <p className="case-notice">החקירה קיבלה מפה וכלי בלש חדשים. התיק הקודם נשמר בהיסטוריה; כאן מתחילים הרפתקה חדשה.</p>}
        <DialoguePanel lines={content.opening} station={station} /><p>לחצו על אנשים וחפצים במפה. משפט מסקרן? שמרו במחברת. חפץ שימושי? קחו לתיק.</p><button onClick={() => open(null)}>פותחים בחקירה</button>
      </div> : panel === 'interaction' ? <div className="case-interaction">
        <div className="case-child-line"><CharacterPortrait character={station && source.speaker === 'sister' ? 'sister' : 'tom'} station={station}/><p><b>{station ? source.speaker === 'sister' ? 'האחות' : 'האח' : 'תום'}</b>{source.prompt}</p></div>
        <div className={`case-reply ${source.kind === 'talk' ? 'case-conversation' : 'case-observation'}`}>
          {source.kind === 'talk' && <div className="case-speaker"><CharacterPortrait character={source.speaker} station={station}/><b>{station ? source.title : source.speaker === 'dad' ? 'אבא' : 'הדוור'}</b></div>}
          <button className={`case-sentence ${state.notebook.includes(currentLine.id) ? 'bookmarked' : ''}`} aria-pressed={state.notebook.includes(currentLine.id)} onClick={() => { act({ type: 'bookmark', passage: currentLine.id }); }}><span>{currentLine.text}</span><small>{state.notebook.includes(currentLine.id) ? '✓ במחברת · לחצו כדי להסיר' : '＋ להעתיק למחברת הרמזים'}</small></button>
        </div>
        <div className="case-interaction-bottom"><Pager page={page} count={source.lines.length} setPage={setPage} onDone={source.kind === 'talk' ? () => open(null) : undefined}/>{itemIds.filter(id => adventureItems[id]?.source === interaction && (edition !== 4 || id !== 'delivery')).map(id => <button className="case-pickup" key={id} disabled={state.bag.includes(id)} onClick={() => act({ type: 'collect', item: id })}>{clueArt(id)}{state.bag.includes(id) ? `${adventureItems[id]?.title} בתיק ✓` : `לקחת: ${adventureItems[id]?.title}`}</button>)}</div>
        {edition === 4 && interaction === 'dad' && page === 0 && (state.bag.includes('delivery') ? <p className="case-subtle" role="status">הקבלה של חבילה 27 בתיק ✓</p> : <form className="station-receipt" onSubmit={event => {
          event.preventDefault();
          if (isCorrectAnswer(receipt, 'מפת שבילים')) act({ type: 'parcelReceipt', assisted: false });
          else setReceiptFeedback('אפשר לתקן את הכיתוב, או להעתיק יחד.');
        }}>
          <label htmlFor="parcel-receipt">תווית לקבלה: <b>מפת שבילים</b></label>
          <div><input id="parcel-receipt" value={receipt} maxLength={36} onChange={event => { setReceipt(event.target.value); setReceiptFeedback(''); }} autoComplete="off" onKeyDown={event => { if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault(); }} />
            <button type="submit">להכין קבלה</button><button type="button" onClick={() => act({ type: 'parcelReceipt', assisted: true })}>נעתיק יחד</button></div>
          {receiptFeedback && <small role="status">{receiptFeedback}</small>}
        </form>)}
        <p className="case-subtle">אפשר לשמור כל משפט. אתם מחליטים מה יעזור לפתרון.</p>
      </div> : panel === 'notebook' || panel === 'bag' ? <div className={`case-collection ${panel === 'notebook' ? 'open-notebook' : 'open-bag'}`}>
        <div className="case-collection-art"><DetectiveProp kind={panel === 'notebook' ? 'notebook' : 'bag'}/><p>{panel === 'notebook' ? 'המחשבות שלכם, מילה במילה.' : 'כל מה שהרמתם בדרך.'}</p></div>
        <div className="case-collection-pages">{!collection.length ? <p className="case-empty">{panel === 'notebook' ? 'עוד אין כאן משפטים. דברו עם דמות או בדקו משהו במפה, ולחצו על משפט שתרצו לזכור.' : 'התיק עדיין ריק. כשבודקים חפץ במפה, אפשר לבחור לקחת אותו.'}</p> : collection.slice(page * 3, page * 3 + 3).map(id => <article className="case-collected" key={id}>{clueCard(id)}{panel === 'notebook' && <small>{adventureInteractions[evidenceSentences.find(line => line.id === id)!.source]?.title}</small>}</article>)}<Pager page={page} count={Math.ceil(collection.length / 3)} setPage={setPage}/></div>
      </div> : panel === 'solve' ? <div className="case-deduction">
        <p className="case-solve-instructions">גררו שלושה רמזים לכל טבלה. אפשר גם ללחוץ על רמז ואז על הטבלה.</p>
        <div className="case-board-pair">{boardIds.map(board => <section className={`case-board ${boardSolved(state, board) ? 'solved' : ''}`} key={board} aria-label={deductionBoards[board].title} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || dragEvidence.current; if (id) put(board, id); dragEvidence.current = null; }}>
          <h3>{deductionBoards[board].title}<span>{boardSolved(state, board) ? '✓' : `${state.boards[board].length}/3`}</span></h3>
          <div className="case-board-slots">{[0, 1, 2].map(slot => { const id = state.boards[board][slot]; return id ? <div className="case-pinned-clue" key={slot}>{clueCard(id)}{!boardSolved(state, board) && <button aria-label={`להוציא רמז ${slot + 1} מהטבלה ${deductionBoards[board].title}`} onClick={() => act({ type: 'removeEvidence', board, evidence: id })}>×</button>}</div> : <button className="case-empty-slot" key={slot} aria-label={`מקום ${slot + 1} בטבלה ${deductionBoards[board].title}`} onClick={() => { if (selected) put(board, selected); else setMessage('בחרו רמז מהאוסף למטה, או גררו אותו לכאן.'); }}>＋ {selected ? 'מניחים את הרמז' : 'מקום לרמז'}</button>; })}</div>
          {boardSolved(state, board) ? <p className="case-board-conclusion">{deductionBoards[board].conclusion}</p> : <div className="case-board-actions"><button disabled={state.boards[board].length !== 3} onClick={() => check(board)}>בודקים את החיבור</button><button onClick={() => { setHelpBoard(board); act({ type: 'adventureHint', board }); open('help'); }}>רמז</button></div>}
        </section>)}</div>
        <div className="case-evidence-tray"><div className="case-tray-heading"><b>מהמחברת ומהתיק</b><span>{selected ? 'בחרתם רמז. לחצו על מקום בטבלה.' : 'גררו רמז למעלה'}</span><Pager page={trayPage} count={Math.ceil(evidence.length / 3)} setPage={setTrayPage}/></div><div className="case-tray-cards">{evidence.slice(trayPage * 3, trayPage * 3 + 3).map(id => <button key={id} draggable className={`case-evidence-card ${selected === id ? 'selected' : ''}`} aria-pressed={selected === id} onDragStart={e => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'copy'; dragEvidence.current = id; }} onDragEnd={() => { dragEvidence.current = null; }} onClick={() => setSelected(selected === id ? null : id)}>{clueCard(id)}</button>)}{!evidence.length && <p>עוד אין ראיות באוסף. חוזרים למפה, מדברים ובודקים.</p>}</div></div>
        {message && <p className="case-feedback" role="status">{message}</p>}
      </div> : panel === 'help' ? <div className="case-help"><DetectiveProp kind="solve"/><h3>{deductionBoards[helpBoard].title}</h3><p>{deductionBoards[helpBoard].hints[Math.max(0, state.hints[boardDecision(helpBoard)] - 1)]}</p><div className="case-actions">{state.hints[boardDecision(helpBoard)] < 3 ? <button onClick={() => act({ type: 'adventureHint', board: helpBoard })}>עוד רמז</button> : <button onClick={() => check(helpBoard, true)}>נחבר יחד</button>}<button onClick={() => open('solve')}>בחזרה לפתרון</button></div></div> : <div className="case-lab">
        <label><input type="checkbox" checked={settings.guided} onChange={e => setSettings({ ...settings, guided: e.target.checked })}/> הצעה איפה להתחיל</label><label><input type="checkbox" checked={settings.labels} onChange={e => setSettings({ ...settings, labels: e.target.checked })}/> שמות המקומות במפה</label><label><input type="checkbox" checked={settings.reducedMotion} onChange={e => setSettings({ ...settings, reducedMotion: e.target.checked })}/> פחות תנועה</label>
        <p>החלת שינויים מתחילה תיק חדש. ההתקדמות בתיק הנוכחי נשארת בהיסטוריה. הגדרת פחות תנועה של המחשב תמיד מכובדת.</p><div className="case-actions"><button onClick={() => restart(settings)}>החלה ותיק חדש</button><button onClick={() => setSettings({ ...defaultAdventureSettings })}>ברירות מחדל</button><button onClick={() => { void navigator.clipboard?.writeText(JSON.stringify(settings, null, 2)).then(() => setCopied(true), () => setCopied(false)); }}>העתקת הגדרות</button></div>{copied && <p role="status">ההגדרות הועתקו.</p>}
      </div>}
    </CaseModal>}
  </section>;
}
