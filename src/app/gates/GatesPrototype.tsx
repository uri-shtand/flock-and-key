import { useEffect, useRef, useState } from "react";
import { GatesScenery } from "./GatesScenery";
import { GatesDecor, Gearbox } from "./GatesDecor";
import { GatesLab } from "./GatesLab";
import { stageOneScenery, sceneryForLevel } from "../../content/gatesScenery";
import { gatesLevels, levelConfig, type GatesConfig } from "../../content/gatesLevels";
import { keyboardRows } from "../../typing/KeyboardMap";
import { gateControls as CONTROLS, lockedGates, sheepGroups, sheepPosition, routeForLevel } from "../../content/gates";
import { initial, operateGate, tick, helpGate, nextGate, groupNextGate, activeGateCount, medal, type Game } from "../../typing/GatesSimulation";
import { readGatesSave, writeGatesSave, type GatesSave } from "../../progress/GatesStore";

const HOME_ROW = keyboardRows[1];
const ART = "/assets/gates/";
const ART_VERSION = "farm-v4-20261112";
const WAITING_JOKES = ["בלה: אני לא בתור. אני בודקת את הנוף.", "צמרית: למישהו יש תשבץ בזמן שמחכים?", "שושנה: השער בדיאטה? למה הוא לא נפתח?", "פיצי: אם נעמוד יפה, נקבל עוד דשא?"];

export function GatesPrototype({ onExit }: { onExit: () => void }) {
  const [loaded] = useState(readGatesSave);
  const [game, setGame] = useState<Game>(loaded.save.game);
  const [best, setBest] = useState(loaded.save.best);
  const [warning, setWarning] = useState(loaded.warning);
  const [paused, setPaused] = useState(!["ready", "done"].includes(game.phase));
  const [panel, setPanel] = useState<"help" | "lab" | null>(null);
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const area = useRef<HTMLDivElement>(null);
  const modal = useRef<HTMLDivElement>(null);
  const panelTrigger = useRef<HTMLButtonElement | null>(null);
  const last = useRef<number | null>(null);
  const live = useRef<GatesSave>({ version: 3, game, best });
  live.current = { version: 3, game, best };
  const controllable = game.phase === "out" || game.phase === "back";
  const running = controllable || game.phase === "regroup";
  const stopped = paused || panel !== null;
  const still = systemReduced || game.config.reducedMotion;
  const content = gatesLevels[game.config.level - 1];
  const hint = nextGate(game);
  const gateCount = activeGateCount(game);
  const route = routeForLevel(game.config.level);
  const controls = CONTROLS.slice(0, gateCount);
  const keyGuide = controls.map((control) => control.hebrew).join(", ");
  const banter = game.phase === "regroup" || game.phase === "back" ? content.dusk : game.waiting > 8 ? WAITING_JOKES[Math.floor(game.waiting / 25) % WAITING_JOKES.length] : content.joke;
  const arrived = game.sheep.filter((s) => game.phase === "back" || game.phase === "done" ? s.progress <= 0 : s.progress >= route.routeLengths[s.lane] - Math.floor(s.id / 2) * 64 - 0.01).length;

  function save() {
    if (!writeGatesSave(live.current)) setWarning("השמירה המקומית אינה זמינה. אפשר להמשיך לשחק.");
  }
  useEffect(() => {
    const timer = window.setInterval(save, 750);
    const flush = () => { writeGatesSave(live.current); };
    window.addEventListener("pagehide", flush);
    return () => { clearInterval(timer); window.removeEventListener("pagehide", flush); flush(); };
  }, []);
  useEffect(save, [game.phase, game.commands, game.assists, game.config, best, paused]);
  useEffect(() => {
    if (game.phase !== "done") return;
    setBest((previous) => previous[game.config.level - 1] >= medal(game) ? previous : previous.map((n, i) => i === game.config.level - 1 ? medal(game) : n));
  }, [game.phase, game.config.level]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!running || stopped) { last.current = null; return; }
    let frame = 0;
    const animate = (now: number) => {
      if (last.current !== null) {
        const dt = Math.min((now - last.current) / 1000, 0.05);
        if (!document.hidden && document.hasFocus()) setGame((g) => tick(g, dt));
      }
      last.current = now;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); last.current = null; };
  }, [running, stopped]);
  useEffect(() => {
    const stop = () => { if (document.hidden || !document.hasFocus()) setPaused(true); };
    document.addEventListener("visibilitychange", stop);
    window.addEventListener("blur", stop);
    return () => { document.removeEventListener("visibilitychange", stop); window.removeEventListener("blur", stop); };
  }, []);
  const overlay = panel !== null || paused || game.phase === "ready" || game.phase === "done";
  useEffect(() => {
    if (overlay) modal.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [overlay, game.phase, panel]);
  function command(code: string) {
    if (stopped) return;
    const index = CONTROLS.findIndex((c) => c.code === code);
    if (index !== -1) setGame((g) => operateGate(g, index));
  }
  function newRound(config: GatesConfig) {
    setGame(initial(config)); setPaused(false); setPanel(null);
  }
  function resume() { setPaused(false); area.current?.focus(); }
  function openPanel(value: "help" | "lab", trigger: HTMLButtonElement) {
    panelTrigger.current = trigger; setPaused(running); setPanel(value);
  }
  function closePanel() { setPanel(null); panelTrigger.current?.focus(); }
  return (
    <section className={`gate-prototype gate-theme-${content.theme}`} dir="rtl" data-phase={game.phase} data-level={game.config.level} data-still={still} data-stopped={stopped || !running}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.nativeEvent.isComposing || !running || stopped) return;
        e.preventDefault(); e.stopPropagation(); setPaused(true);
      }}>
      <div className="gate-prototype-toolbar">
        <div><h1>שומרי השערים <small>{game.config.level}/5 · {content.title}</small></h1><p>{game.duskProgress > 0 ? "חוזרים הביתה · השערים בסדר ההפוך" : "יוצאים למרעה · פותחים רגע לפני שהעדר מגיע"} · {arrived}/{game.sheep.length} 🐑</p></div>
        <div className="gate-prototype-stats">
          <strong aria-label={`ניקוד ${game.score}`}>⭐ {game.score}</strong>
          <button aria-keyshortcuts={running && !stopped ? "Escape" : undefined} title={paused ? "המשך" : "הפסקה (Esc)"} onClick={() => { setPaused((v) => !v); area.current?.focus(); }} disabled={!running || panel !== null}>{paused ? "המשך" : "הפסקה"}</button>
          <button className="secondary" onClick={(e) => openPanel("help", e.currentTarget)}>איך משחקים?</button>
          <button className="secondary" onClick={(e) => openPanel("lab", e.currentTarget)}>מעבדת הכיף</button>
          <button className="secondary" onClick={() => { save(); onExit(); }}>חזרה לבית</button>
        </div>
      </div>
      <nav className="gate-levels" aria-label="בחירת שלב">{gatesLevels.map((l, i) => <button key={l.theme} className="secondary" aria-current={game.config.level === i + 1 ? "step" : undefined}
        onClick={() => newRound({ ...levelConfig(i + 1), hints: game.config.hints, reducedMotion: game.config.reducedMotion })}>
        <b>{i + 1}</b> {l.title} <span aria-label={`${best[i]} מדליות`}>{best[i] ? "★".repeat(best[i]) : "○"}</span>
      </button>)}</nav>
      {warning && <p className="gate-storage-warning" role="status">{warning}</p>}
      <div className="gate-prototype-world" ref={area} tabIndex={0} role="application" aria-label={`החווה. השתמשו במקשים ${keyGuide} לפתיחת השערים.`}
        onKeyDown={(e) => { if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.nativeEvent.isComposing) return; if (CONTROLS.some((c) => c.code === e.code)) { e.preventDefault(); command(e.code); } }}>
        <aside className="gate-machine-panel" aria-label="תיבת ההילוכים">
          <h3>ידית הילוכים</h3>
          <svg viewBox="-132 -96 264 256" aria-hidden="true"><Gearbox game={game} still={still} /></svg>
          <p>{game.lever ? `${game.lever.action === "open" ? "פתיחה" : "סגירה"} · ${CONTROLS[game.lever.gate].hebrew}` : "מוכנה לפעולה"}</p>
          <progress aria-label="התקדמות פעולת תיבת ההילוכים" max="1" value={game.lever ? 1 - game.lever.remaining / game.config.gearboxSeconds : 0} />
          <small>{game.selectedGate === null ? "ידית בסרק" : `ידית בשער ${CONTROLS[game.selectedGate].hebrew}`}</small>
        </aside>
        <aside className="gate-farm-note" aria-label="קבוצות העדר">
          <h3>שתי קבוצות, שני מסלולים</h3>
          {sheepGroups.map((group, lane) => {
            const next = groupNextGate(game, lane);
            const members = game.sheep.filter((s) => s.lane === lane);
            const parked = members.every((s) => game.phase === "back" ? s.progress <= 0 : s.progress >= route.routeLengths[lane] - Math.floor(s.id / 2) * 64 - 0.01);
            const status = controllable ? next === null ? parked ? game.phase === "back" ? "בבית!" : "במרעה!" : "בדרך ליעד" : `השער הבא: ${CONTROLS[next].hebrew}` :
              game.phase === "regroup" ? "נחים במרעה" : game.phase === "done" ? "בבית!" : route.routes[lane].crossings.map((c) => CONTROLS[c.gate].hebrew).join(" ← ");
            return <div className="gate-group-card" key={group.name} data-testid={`group-${lane}`}>
              <strong><span style={{ color: group.color }}>{group.symbol}</span> {group.name}</strong>
              <small>{status}</small>
            </div>;
          })}
          <p className="gate-group-banter">{banter}</p>
        </aside>
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img" aria-label="חווה עם עדר כבשים, תיבת הילוכים ושערי אותיות לאורך המסלול">
          <image href={ART + "farm-background.svg?v=" + ART_VERSION} x="0" y="0" width="1600" height="900" />
          {game.config.level > 1 && <rect width="1600" height="900" fill={content.accent} opacity=".10" pointerEvents="none" />}
          {route.routes.map((groupRoute, lane) => <g key={lane} data-testid="active-route" data-group={lane} fill="none" strokeLinecap="round" pointerEvents="none">
            <path d={groupRoute.path} stroke="#8e793f" strokeWidth="44" opacity=".35" />
            <path d={groupRoute.path} stroke="#f7cf88" strokeWidth="36" />
            <path d={groupRoute.path} stroke={sheepGroups[lane].color} strokeWidth="5" strokeDasharray={sheepGroups[lane].dash} opacity=".8" />
          </g>)}
          <GatesScenery items={game.config.level === 1 ? stageOneScenery : sceneryForLevel(game.config.level)} />
          <GatesDecor game={game} still={still} />
          {game.sheep.map((sheep) => {
            const point = sheepPosition(sheep.lane, sheep.progress, game.config.level);
            const ahead = sheepPosition(sheep.lane, sheep.progress + (game.phase === "back" ? -8 : 8), game.config.level);
            const facesRight = ahead.x >= point.x;
            const moving = running && game.phase !== "regroup" && !stopped;
            return <g key={sheep.id} transform={`translate(${point.x} ${point.y})`}>
              <ellipse cy="9" rx="28" ry="7" fill="#293c3533" />
              <g className={moving ? "gate-sheep-bob" : ""} style={{ animationDelay: `${-sheep.id * 0.13}s` }}>
                <image data-testid={`sheep-${sheep.id}`} data-group={sheep.lane} data-progress={sheep.progress.toFixed(1)} href={ART + "sheep.svg?v=" + ART_VERSION}
                  x="-38" y="-43" width="76" height="55" transform={facesRight ? undefined : "scale(-1 1)"} />
                {game.config.level === 1 ? <path d="M -18 -24 l 12 7 l -12 7 Z M 6 -24 l -12 7 l 12 7 Z" fill={sheep.id % 2 ? "#d9766b" : "#6598b0"} stroke="#694d39" strokeWidth="2" /> :
                  game.config.level === 2 ? <g transform="translate(-6 -42)" fill={sheep.id % 2 ? "#e5a0bc" : "#efce66"}><circle cx="-5" r="6" /><circle cx="5" r="6" /><circle cy="-6" r="6" /><circle r="4" fill="#795c39" /></g> :
                  <g transform={`translate(${facesRight ? 21 : -21} -44)`}><path d="M -15 0 L 0 -30 L 15 0 Z" fill={sheep.id % 2 ? content.accent : "#df7c60"} stroke="#694d39" strokeWidth="2" /><circle cy="-30" r="5" fill="#fff3c3" /></g>}
                <circle cx="0" cy="-17" r="12" fill={sheepGroups[sheep.lane].color} stroke="#fff9dc" strokeWidth="2" />
                <text y="-12" textAnchor="middle" fontSize="17" fontWeight="900" fill="#fff9dc">{sheepGroups[sheep.lane].symbol}</text>
              </g>
            </g>;
          })}
          {controls.map((control, index) => {
            const { x, y } = control.point;
            const gate = game.gates[index];
            const active = game.lever?.gate === index;
            const countdown = Math.max(0, Math.min(1, (gate.closingAt - game.time) / game.config.openSeconds));
            return <g key={control.code} data-testid={`gate-${index}`} data-open={gate.open} role="group" aria-label={`שער ${control.hebrew}: ${gate.open ? "פתוח" : "סגור"}`}>
              {game.config.hints && hint === index && <ellipse cx={x} cy={y + 18} rx="90" ry="40" fill="#fff4ab77" stroke="#fff5ba" strokeWidth="7" strokeDasharray="12 8" />}
              <g className="gate-leaf" style={{ transformOrigin: `${x - 70}px ${y}px`, transform: gate.open ? "rotate(-6deg)" : "rotate(0deg)" }}>
                <image href={ART + (gate.open ? "wooden-gate-open.svg" : "wooden-gate.svg") + "?v=" + ART_VERSION} x={x - 70} y={y - 67} width="140" height="113" />
              </g>
              <image href={ART + "blank-gate-sign.svg?v=" + ART_VERSION} x={x - 66} y={y - 145} width="132" height="92" />
              <text x={x} y={y - 91} textAnchor="middle" fontSize="57" fontWeight="900" fill="#191d23" stroke="#fffaf0" strokeWidth="2" paintOrder="stroke">{control.hebrew}</text>
              {gate.open && <g><rect x={x - 52} y={y + 43} width="104" height="10" rx="5" fill="#4e5745" /><rect x={x - 52} y={y + 43} width={104 * countdown} height="10" rx="5" fill="#ffe58a" /></g>}
              {active && <circle cx={x} cy={y} r="77" fill="none" stroke="#f7e76a" strokeWidth="12" strokeDasharray="15 11" opacity=".9" />}
            </g>;
          })}
          {lockedGates.filter((_, index) => index + 4 >= gateCount).map(({ x, y }, index) => <g key={index} data-testid="locked-gate" role="group" aria-label="שער נעול, ללא מקש הפעלה">
            <image href={ART + "wooden-gate.svg?v=" + ART_VERSION} x={x - 54} y={y - 52} width="108" height="87" />
            <path d={`M ${x - 10} ${y - 4} v -12 a 10 10 0 0 1 20 0 v 12`} fill="none" stroke="#293b44" strokeWidth="7" />
            <rect x={x - 18} y={y - 7} width="36" height="30" rx="5" fill="#75858b" stroke="#293b44" strokeWidth="4" /><circle cx={x} cy={y + 6} r="4" fill="#fff6d9" />
          </g>)}
          <defs><linearGradient id="gate-dusk" x2="0" y2="1"><stop stopColor="#30234f" /><stop offset="1" stopColor="#df854b" /></linearGradient></defs>
          <rect data-testid="dusk-tint" width="1600" height="900" fill="url(#gate-dusk)" opacity={game.duskProgress * 0.32} pointerEvents="none" aria-hidden="true" />
        </svg>
        {panel === "lab" ? <GatesLab config={game.config} onApply={newRound} onClose={closePanel} /> :
          overlay && <div className="gate-prototype-overlay" onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            const buttons = modal.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
            if (!buttons?.length) return;
            if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
            if (!e.shiftKey && document.activeElement === buttons[buttons.length - 1]) { e.preventDefault(); buttons[0].focus(); }
          }}>
            <div ref={modal} className={`gate-prototype-dialog${panel === "help" ? " gate-help-dialog" : game.phase === "done" ? " gate-summary" : ""}`} role="dialog" aria-modal="true" aria-labelledby="gate-dialog-title">
              {panel === "help" ? <><h2 id="gate-dialog-title">דשא, שערים וקצת תזמון</h2><p>שתי קבוצות הולכות לבד במסלולים שונים: ○ פרחים ו־★ כוכבים. לכל קבוצה סדר שערים משלה, ובשער משותף מחכים לתור. מקשי {keyGuide} פותחים וסוגרים את השערים המתאימים. שערי מנעול מצטרפים בשלבים הבאים. לידית יש מיקום משלה לכל שער.</p><p>הפס שמתחת לשער מראה מתי ייסגר. מעבר כבשה ממלא אותו מחדש. במרעה יורד ערב, ואז חוזרים בכיוון ההפוך.</p><p>Esc להפסקה. ״עזרה בשער״ פותחת בחינם. אין פסילה, וכל שלב זמין לבחירה.</p><button onClick={closePanel}>הבנתי</button></> :
                game.phase === "ready" ? <><h2 id="gate-dialog-title">{content.title}</h2><p>{content.subtitle}</p><p>{game.sheep.length} כבשים · {gateCount} שערים · פתיחה ל־{game.config.openSeconds} שניות</p><p>○ פרחים ו־★ כוכבים יוצאים במסלולים שונים, וחוזרים בסדר ההפוך. עקבו אחרי הסימנים שעל הכבשים והשבילים!</p><button onClick={() => { setGame((g) => ({ ...g, phase: "out" })); resume(); }}>מתחילים</button></> :
                game.phase === "done" ? <><h2 id="gate-dialog-title">כל הכבשים בבית! 🐑</h2><div className="gate-summary-body"><div><div className="gate-medals" aria-label={`${medal(game)} מדליות`}>{"★".repeat(medal(game))}{"☆".repeat(3 - medal(game))}</div><p>{content.finish}</p></div><div><p>ניקוד: {game.score} · עזרה: {game.assists} · המתנה ממוצעת לכבשה: {(game.waiting / game.sheep.length).toFixed(1)} שנ׳</p><p>המדליות הן בונוס: עד 8 שניות המתנה לכבשה = שלוש, עד 22 = שתיים.</p></div></div><div className="gate-dialog-actions">
                  {game.config.level < 5 ? <button onClick={() => newRound({ ...levelConfig(game.config.level + 1), hints: game.config.hints, reducedMotion: game.config.reducedMotion })}>לשלב הבא</button> : <strong>{best.every((n) => n > 0) ? "סיימתם את כל חמשת השלבים! 🏅" : "מסיבת הפיג׳מות הושלמה! 🏅"}</strong>}
                  <button className="secondary" onClick={() => newRound(game.config)}>שוב באותו שלב</button>
                  <button className="secondary" onClick={() => newRound(levelConfig())}>משחק חדש</button>
                </div></> : <><h2 id="gate-dialog-title">המשחק בהפסקה</h2><p>הכבשים שומרות לכם מקום. גם תיבת ההילוכים מחכה.</p><button onClick={resume}>ממשיכים</button></>}
            </div>
          </div>}
      </div>
      <div className="gate-prototype-keyboard" aria-label="השורה האמצעית במקלדת עברית">
        <span className="gate-prototype-keyboard-label">שורת הבית</span>
        <div className="gate-prototype-key-row" dir="ltr">{HOME_ROW.map(({ code, letter }) => {
          const index = CONTROLS.findIndex((c) => c.code === code);
          const used = index >= 0 && index < gateCount;
          const selected = game.lever?.gate === index;
          return <button key={code} type="button" className={`gate-prototype-key${used ? " is-active" : ""}${selected ? " is-operating" : ""}${used && game.config.hints && hint === index ? " is-next" : ""}`}
            aria-label={`האות ${letter}${used ? " מפעילה שער" : " אינה מפעילה שער בשלב זה"}`} aria-disabled={!used || !controllable || stopped || Boolean(game.lever)}
            onClick={() => { if (used && controllable && !stopped) command(code); if (window.matchMedia("(pointer: fine)").matches) area.current?.focus(); }}>{letter}</button>;
        })}</div>
        <button className="secondary gate-rescue" disabled={!controllable || stopped || hint === null} onClick={() => { setGame(helpGate); area.current?.focus(); }}>עזרה בשער</button>
      </div>
      <p className="gate-prototype-help">{game.config.hints && hint !== null ? `השער הבא: ${CONTROLS[hint].hebrew} · ` : ""}{keyGuide} · {game.config.openSeconds} שנ׳ לפתיחה · {game.config.gearboxSeconds} שנ׳ לפעולה · עזרה תמיד בחינם</p>
    </section>
  );
}
