import { useEffect, useRef, useState } from 'react';
import { caseSources, decisions, decisionIds, observations, defaultCaseSettings, type SourceId, type DecisionId, type Clue, type CaseSettings } from '../../content/detective';
import { appendCase, caseState, newCase, type CaseEvent, type CaseRun } from '../../typing/DetectiveCase';
import { DetectiveWorld } from './DetectiveWorld';
import './detective.css';
const yardSpots: { clue: Clue; title: string; x: number; y: number }[] = [
  { clue: 'dad', title: 'לדבר עם אבא', x: 81, y: 38 }, { clue: 'postman', title: 'לשאול את הדוור', x: 28, y: 46 },
  { clue: 'ribbon', title: 'הסרט בעגלה', x: 64, y: 56 }, { clue: 'book', title: 'פנקס המשלוחים', x: 50, y: 42 },
  { clue: 'tracks', title: 'עקבות הקמח', x: 75, y: 82 }, { clue: 'basket', title: 'החשוד של פיצי', x: 39, y: 93 },
];
export function DetectiveCase({ runs, onChange, onExit }: { runs: CaseRun[]; onChange: (run: CaseRun) => void; onExit: () => void }) {
  const [run, setRun] = useState(() => runs.at(-1) ?? newCase());
  const [paused, setPaused] = useState(runs.length > 0);
  const [panel, setPanel] = useState<'intro' | 'inspect' | 'notebook' | 'source' | 'help' | 'lab'>('intro');
  const [source, setSource] = useState<SourceId>('dad');
  const [active, setActive] = useState<DecisionId>(() => { const s = caseState(run); return s.place === 'bridge' || s.place === 'ending' ? 'search' : s.links.identity ? 'route' : 'identity'; });
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<CaseSettings>(run.settings);
  const [copied, setCopied] = useState(false);
  const [osReduced, setOsReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const panelRef = useRef<HTMLElement>(null);
  const state = caseState(run), rule = decisions[active];
  const choice = state.drafts[active].choice, supports = state.drafts[active].support;
  useEffect(() => { onChange(run); }, [run]); // Persist every meaningful action, including a new run.
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setOsReduced(media.matches);
    const stop = () => setPaused(true);
    const hidden = () => { if (document.hidden) stop(); };
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape') setPaused(true); };
    media.addEventListener('change', motion); window.addEventListener('blur', stop); document.addEventListener('visibilitychange', hidden); window.addEventListener('keydown', key);
    return () => { media.removeEventListener('change', motion); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('keydown', key); };
  }, []);
  useEffect(() => { panelRef.current?.focus(); }, [panel, source, active, state.place, paused]);
  function act(e: CaseEvent) { setRun(r => appendCase(r, e)); }
  function inspect(clue: Clue) {
    act({ type: 'inspect', clue });
    if (clue in caseSources) { setActive(clue === 'note' ? 'search' : clue === 'dad' ? 'identity' : 'route'); setSource(clue as SourceId); setPanel('source'); setMessage(''); }
    else { setMessage(observations[clue] ?? ''); setPanel('inspect'); }
  }
  function notebook(d: DecisionId = state.place === 'bridge' ? 'search' : !state.links.identity ? 'identity' : 'route') {
    setActive(d); setMessage(''); setPanel('notebook');
  }
  function theory(guided = false) {
    const selected = guided ? rule.correct : choice;
    if (selected === null) return;
    const event: CaseEvent = { type: 'theory', decision: active, choice: selected, support: guided ? [] : supports, guided };
    const next = appendCase(run, event), result = caseState(next).attempts.at(-1);
    setRun(next);
    if (guided) setPanel('notebook');
    setMessage(result?.result === 'revisit' ? active === 'identity' ? 'כדאי להשוות את הסרט בעגלה למה שאבא סיפר. איזה משפט מחזק את הכיוון?' : active === 'route' ? 'אבא ניחש שאולי האסם. אבל איזו נסיעה כבר בוצעה, ואיזו מתוכננת למחר?' : 'מתחת לקשת יש רק אבנים רטובות. פיצי: ״בדקתי. לא שטיח.״ אפשר לחזור לפתק או לבדוק את הבמה.' : rule.explanation);
  }
  function restart(effective = settings) { setRun(newCase(effective)); setPaused(false); setPanel('intro'); setMessage(''); }
  const stopped = paused || panel === 'lab';
  return <section className="detective" aria-label="תיק בלשי קטן" dir="rtl">
    <header className="detective-header"><div><span>תיק בלשי קטן</span><h1>הטרמפ של נוגה</h1></div><nav aria-label="כלי חקירה"><button onClick={onExit}>הביתה</button><button onClick={() => setPaused(true)}>הפסקה</button><button onClick={() => { setSettings(run.settings); setPanel('lab'); }}>מעבדת החקירה</button></nav></header>
    <div className="detective-layout">
      <div className={`detective-stage ${run.settings.labels ? 'show-labels' : ''}`}>
        <DetectiveWorld view={{ place: state.place, stopped, reduced: osReduced || run.settings.reducedMotion, reaction: run.events.length }} />
        <div className="detective-location">{state.place === 'yard' ? 'חצר החווה · עקבות של טרמפ' : state.place === 'bridge' ? 'הגשר · הוראה קטנה, שינוי גדול' : 'הגשר · תצוגת האופנה של נוגה'}</div>
        {!stopped && state.place === 'yard' && yardSpots.map(spot => <button key={spot.clue} className={`detective-hotspot ${state.inspected.includes(spot.clue) ? 'visited' : ''}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }} onClick={() => inspect(spot.clue)} aria-label={spot.title}><span aria-hidden="true">{state.inspected.includes(spot.clue) ? '✓' : '+'}</span><b>{spot.title}</b></button>)}
        {!stopped && state.place === 'bridge' && <>
          <button className="detective-hotspot" style={{ left: '16%', top: '55%' }} aria-label="הפתק של השומר" onClick={() => inspect('note')}><span>+</span><b>הפתק של השומר</b></button>
          <button className="detective-hotspot" style={{ left: '49%', top: '73%' }} aria-label="מתחת לקשת" onClick={() => { notebook('search'); act({ type: 'select', decision: 'search', choice: 0 }); }}><span>+</span><b>מתחת לקשת</b></button>
          <button className="detective-hotspot" style={{ left: '58%', top: '32%' }} aria-label="על הבמה" onClick={() => { notebook('search'); act({ type: 'select', decision: 'search', choice: 1 }); }}><span>+</span><b>על הבמה</b></button>
        </>}
        {stopped && <div className="detective-pause"><h2>{paused ? 'החקירה מחכה לכם' : 'המעבדה פתוחה'}</h2>{paused && <><p>גם פיצי לוקח הפסקה. הראיות נשארו כאן.</p><button onClick={() => { setPaused(false); if (panel === 'intro' && run.events.length) setPanel('inspect'); }}>ממשיכים בחקירה</button></>}</div>}
      </div>
      <aside className="detective-paper" ref={panelRef} tabIndex={-1} aria-label="מחברת החקירה">
        {paused ? <><h2>עוצרים לנשום</h2><p>אפשר להמשיך בכל רגע או לחזור הביתה. התיק נשמר בדפדפן הזה.</p></> : panel === 'lab' ? <>
          <h2>מעבדת החקירה</h2><label><input type="checkbox" checked={settings.guided} onChange={e => setSettings({ ...settings, guided: e.target.checked })} /> סדר שיחות מודרך</label><label><input type="checkbox" checked={settings.labels} onChange={e => setSettings({ ...settings, labels: e.target.checked })} /> שמות כל המקומות גלויים</label><label><input type="checkbox" checked={settings.reducedMotion} onChange={e => setSettings({ ...settings, reducedMotion: e.target.checked })} /> פחות תנועה</label>
          <p>החלת השינוי תתחיל את התיק מחדש. העדפת פחות תנועה של המחשב תמיד נשמרת.</p>
          <div className="detective-actions"><button onClick={() => restart()}>החלה ותיק חדש</button><button onClick={() => setSettings({ ...defaultCaseSettings })}>ברירות מחדל</button><button onClick={() => { void navigator.clipboard?.writeText(JSON.stringify(settings, null, 2)).then(() => setCopied(true), () => setCopied(false)); }}>העתקת הגדרות</button><button onClick={() => setPanel('inspect')}>חזרה לחקירה</button></div>{copied && <p role="status">ההגדרות הועתקו.</p>}
        </> : state.place === 'ending' ? <>
          <div className="detective-stamp">התיק נפתר!</div><h2>נוגה לא נעלמה. היא על המסלול.</h2><p>נוגה: ״זה לא שטיח. זה מסלול תצוגה. והרוח? מאוורר על חשבון הבית.״</p><p>פיצי מנסה לדגמן. הוא מסתובב פעם אחת, מסתבך בזנב, ומתיישב בגאווה.</p><div className="detective-recap">{decisionIds.map(id => <p key={id}>✦ {decisions[id].explanation}</p>)}</div><div className="detective-actions"><button onClick={onExit}>בחזרה לפיקניק</button><button onClick={() => { setSettings(run.settings); restart(run.settings); }}>שוב אותו תיק</button></div>
        </> : panel === 'intro' ? <>
          <span className="detective-kicker">כבשה חסרה. עגלה חשודה. כלב רעב.</span><h2>מי לקחה טרמפ?</h2><p>אבא: ״נוגה נעלמה מההכנות לפיקניק. אולי הלכה אחרי האוכל לאסם?״</p><p>תום: ״רגע, לפני ששולחים את כל המשפחה… בואו נבדוק מה קרה כאן.״</p><p>לחצו על אנשים וחפצים בחצר. הרמז הבא יכול להסתתר בשיחה.</p><button onClick={() => { setPanel('inspect'); setMessage('פיצי כבר בודק את סל הפיקניק. אתם מוזמנים לבחור חשוד קצת פחות טעים.'); }}>פותחים בחקירה</button>
        </> : panel === 'source' ? <>
          <div className="detective-paper-heading"><h2>{caseSources[source].title}</h2><button onClick={() => setPanel('notebook')}>למחברת ←</button></div>
          <p className="detective-source-instruction">אפשר לקרוא שוב ולסמן משפט למחברת.</p>
          <div className="detective-source">{caseSources[source].strips.map(strip => <button key={strip.id} className={supports.includes(strip.id) ? 'pinned' : ''} aria-pressed={supports.includes(strip.id)} onClick={() => act({ type: 'pin', decision: active, passage: strip.id })}>{strip.text}<small>{supports.includes(strip.id) ? '✓ סומן במחברת' : 'סימון משפט'}</small></button>)}</div>
          {source === 'postman' && state.inspected.includes('ribbon') && <p className="detective-aside">״אם השטיח התחיל לגדל צמר, אני מבקש עגלה גדולה יותר.״</p>}
          <button onClick={() => { setPanel('notebook'); setMessage(''); }}>לחבר את הרמזים ←</button>
        </> : panel === 'help' ? <>
          <h2>רמז לחקירה</h2><h3>{rule.title}</h3>
          <p className="detective-hint">{rule.hints[Math.max(0, state.hints[active] - 1)]}</p>
          <div className="detective-actions">
            {state.hints[active] < 3 ? <button onClick={() => act({ type: 'hint', decision: active })}>רמז לחקירה</button> : <button onClick={() => theory(true)}>נבדוק יחד</button>}
            <button onClick={() => setPanel('notebook')}>חזרה למחברת</button>
          </div>
        </> : panel === 'notebook' ? <>
          <div className="detective-tabs">{(state.place === 'bridge' ? ['search'] as DecisionId[] : ['identity', 'route'] as DecisionId[]).map(id => <button key={id} aria-pressed={active === id} onClick={() => notebook(id)}>{id === 'identity' ? 'הנוסעת' : id === 'route' ? 'המסלול' : 'מקום החיפוש'} {state.links[id] ? '✓' : ''}</button>)}</div>
          <h2>{rule.title}</h2>
          {state.links[active] ? <p>{rule.explanation}</p> : <>
            <div className="detective-choices">{rule.choices.map((text, index) => <button key={text} aria-pressed={choice === index} onClick={() => { act({ type: 'select', decision: active, choice: index }); setMessage(''); }}>{text}</button>)}</div>
            <p className="detective-source-instruction">איזה משפט מחזק את הכיוון? אפשר לסמן משפטים במקורות.</p>
            <div className="detective-actions">{rule.sources.map(id => <button key={id} onClick={() => inspect(id)}>{caseSources[id].title} {supports.some(p => caseSources[id].strips.some(strip => strip.id === p)) ? '📌' : ''}</button>)}</div>
            <small>{supports.length ? `${supports.length} משפטים מסומנים` : 'אפשר גם לנסות כיוון ולבדוק מה קורה.'}</small>
            <div className="detective-actions"><button disabled={choice === null} onClick={() => theory()}>בודקים את הכיוון</button><button onClick={() => { act({ type: 'hint', decision: active }); setPanel('help'); }}>רמז לחקירה</button></div>
          </>}
          {message && <p className="detective-feedback" role="status">{message}</p>}
          {state.place === 'yard' && state.links.identity && state.links.route && <button onClick={() => { act({ type: 'travel' }); setActive('search'); setPanel('inspect'); setMessage('העגלה הגיעה לכאן. ליד הכניסה תלוי פתק משומר הגשר. פיצי מוכן לבדוק כל פינה — כל עוד אין שם אמבטיה.'); }}>יוצאים אל הגשר ←</button>}
        </> : <>
          <h2>{state.place === 'yard' ? 'מסתכלים מקרוב' : 'איפה השטיח?'}</h2><p role="status">{message || (state.place === 'yard' ? 'החצר מלאה סיפורים. בחרו אדם או חפץ כדי לבדוק אותו.' : 'אפשר לקרוא את הפתק ולבדוק את אחד המקומות בגשר.')}</p>
          {run.settings.guided && state.place === 'yard' && <button onClick={() => inspect(!state.inspected.includes('dad') ? 'dad' : !state.inspected.includes('book') ? 'book' : 'postman')}>השיחה הבאה</button>}
          {state.inspected.includes('ribbon') && state.place === 'yard' && <div className="detective-actions"><button onClick={() => { inspect('dad'); }}>להראות לאבא את הסרט</button><button onClick={() => inspect('postman')}>להראות לדוור את הסרט</button></div>}
          <button onClick={() => notebook()}>פותחים את מחברת החקירה ←</button>
        </>}
      </aside>
    </div>
    <footer className="detective-footer"><span>{state.place === 'ending' ? 'גם בלשים מוזמנים לפיקניק.' : 'אין שעון. אין חיים להפסיד. אפשר לבדוק ולשנות כיוון.'}</span><div><button disabled={stopped || state.place === 'ending'} onClick={() => notebook()}>מחברת החקירה</button><button disabled={stopped || state.place === 'ending'} onClick={() => { setRun(r => ({ ...r, settings: { ...r.settings, labels: !r.settings.labels } })); }}>מה אפשר לבדוק?</button></div></footer>
  </section>;
}
