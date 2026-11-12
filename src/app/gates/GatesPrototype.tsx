import { useEffect, useRef, useState } from "react";
import { GatesScenery } from "./GatesScenery";
import { stageOneScenery } from "../../content/gatesScenery";
import { keyboardRows } from "../../typing/KeyboardMap";

import { gateControls as CONTROLS, lockedGates, sheepPosition } from "../../content/gates";
import { initial, operateGate, tick, type Game } from "../../typing/GatesSimulation";

// Preserve physical left-to-right home-row order.
const HOME_ROW = keyboardRows[1];
const ART = "/assets/gates/";
const ART_VERSION = "farm-v4-20261112";

export function GatesPrototype({ onExit }: { onExit: () => void }) {
  const [game, setGame] = useState<Game>(initial);
  const [paused, setPaused] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);
  const controllable = game.phase === "out" || game.phase === "back";
  const running = controllable || game.phase === "regroup";
  useEffect(() => {
    if (!running || paused) { last.current = null; return; }
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
  }, [running, paused]);
  useEffect(() => {
    const stop = () => { if (document.hidden || !document.hasFocus()) setPaused(true); };
    document.addEventListener("visibilitychange", stop);
    window.addEventListener("blur", stop);
    return () => { document.removeEventListener("visibilitychange", stop); window.removeEventListener("blur", stop); };
  }, []);
  function command(code: string) {
    if (paused) return;
    const index = CONTROLS.findIndex((c) => c.code === code);
    if (index === -1) return;
    setGame((g) => operateGate(g, index));
  }
  function focusAndStart() {
    setGame((g) => ({ ...g, phase: "out" }));
    setPaused(false);
    area.current?.focus();
  }
  return (
    <section className="gate-prototype" dir="rtl" data-phase={game.phase}>
      <div className="gate-prototype-toolbar">
        <div><h1>שומרי השערים <small>אב־טיפוס · שלב 1 · ארבעה שערים</small></h1><p>{game.duskProgress > 0 ? "בדרך הביתה עוברים בשערים בסדר ההפוך: ל ← ח ← י ← ע." : "בדרך למרעה עוברים בכל ארבעת השערים: ע ← י ← ח ← ל."}</p></div>
        <div className="gate-prototype-stats">
          <span className="gate-prototype-version" aria-label="גרסת תצוגת החווה">Farm v3</span>
          <strong>⭐ {game.score}</strong>
          <span>⚙️ {game.lever ? "המנוף עובד…" : "המנוף פנוי"}</span>
          <button onClick={() => { setPaused((v) => !v); area.current?.focus(); }} disabled={!running}>{paused ? "המשך" : "הפסקה"}</button>
          <button className="secondary" onClick={onExit}>חזרה לבית</button>
        </div>
      </div>
      <div
        className="gate-prototype-world"
        ref={area}
        tabIndex={0}
        role="application"
        aria-label="החווה. השתמשו במקשים ע, י, ח, ל לפתיחת השערים."
        onKeyDown={(e) => { if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.nativeEvent.isComposing) return; if (CONTROLS.some((c) => c.code === e.code)) { e.preventDefault(); command(e.code); } }}
      >
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img"
          aria-label="מכלאה במרכז, שבילים מתפתלים ומצטלבים, שני שטחי מרעה, ארבעה שערי אותיות ושערים נעולים ללא אות">
          <image href={ART + "farm-background.svg?v=" + ART_VERSION} x="0" y="0" width="1600" height="900" />
          <GatesScenery items={stageOneScenery} />
          {game.sheep.map((sheep) => {
            const point = sheepPosition(sheep.lane, sheep.progress);
            const ahead = sheepPosition(sheep.lane, sheep.progress + (game.phase === "back" ? -8 : 8));
            const facesRight = ahead.x >= point.x;
            return (
              <image key={sheep.id} data-testid={`sheep-${sheep.id}`} data-progress={sheep.progress.toFixed(1)} href={ART + "sheep.svg?v=" + ART_VERSION}
                x={point.x - 38} y={point.y - 43}
                width="76" height="55"
                transform={facesRight ? undefined : "translate(" + (2 * point.x) + " 0) scale(-1 1)"}
              />
            );
          })}
          {CONTROLS.map((control, index) => {
            const { x, y } = control.point;
            const gate = game.gates[index];
            const active = game.lever?.gate === index;
            return (
              <g key={control.code} data-testid={`gate-${index}`} data-open={gate.open} role="group" aria-label={`שער ${control.hebrew}: ${gate.open ? "פתוח" : "סגור"}`}>
                <image href={ART + (gate.open ? "wooden-gate-open.svg" : "wooden-gate.svg") + "?v=" + ART_VERSION}
                  x={x - 70} y={y - 67} width="140" height="113" />
                <image href={ART + "blank-gate-sign.svg?v=" + ART_VERSION} x={x - 66} y={y - 145} width="132" height="92"/>
                <text x={x} y={y - 91} textAnchor="middle" fontSize="57"
                  fontWeight="900" fill="#191d23" stroke="#fffaf0" strokeWidth="2" paintOrder="stroke">{control.hebrew}</text>
                {active && <circle cx={x} cy={y} r="77" fill="none" stroke="#f7e76a"
                  strokeWidth="12" strokeDasharray="15 11" opacity=".9" />}
              </g>
            );
          })}
          {lockedGates.map(({ x, y }, index) => (
            <g key={index} data-testid="locked-gate" role="group" aria-label="שער נעול, ללא מקש הפעלה">
              <image href={ART + "wooden-gate.svg?v=" + ART_VERSION} x={x - 54} y={y - 52} width="108" height="87" />
              <path d={`M ${x - 10} ${y - 4} v -12 a 10 10 0 0 1 20 0 v 12`} fill="none" stroke="#293b44" strokeWidth="7" />
              <rect x={x - 18} y={y - 7} width="36" height="30" rx="5" fill="#75858b" stroke="#293b44" strokeWidth="4" />
              <circle cx={x} cy={y + 6} r="4" fill="#fff6d9" />
            </g>
          ))}
          <defs>
            <linearGradient id="gate-dusk" x2="0" y2="1">
              <stop stopColor="#30234f" />
              <stop offset="1" stopColor="#df854b" />
            </linearGradient>
          </defs>
          <rect data-testid="dusk-tint" width="1600" height="900" fill="url(#gate-dusk)"
            opacity={game.duskProgress * 0.32} pointerEvents="none" aria-hidden="true" />
        </svg>
        {(game.phase === "ready" || game.phase === "done" || paused) && (
          <div className="gate-prototype-overlay">
            <div className="gate-prototype-dialog">
              {game.phase === "ready" ? <><h2>מוציאים את הכבשים למרעה</h2><p>פתחו לפי המסלול: ע, י, ח, ל. כל הכבשים עוברות בכל ארבעת השערים לפני הפיצול למרעה. שער עם מנעול אינו ניתן להפעלה. המנוף עסוק למשך 0.8 שניות בכל פעולה. שער נסגר לבד אחרי 5 שניות ללא מעבר.</p><button onClick={focusAndStart}>מתחילים</button></> :
               game.phase === "done" ? <><h2>כל הכבשים בבית! 🐑</h2><p>ניקוד: {game.score} · זמן המתנה מצטבר: {game.waiting.toFixed(1)} שניות־כבשה</p><button onClick={() => { setGame(initial()); setPaused(false); area.current?.focus(); }}>משחק חדש</button></> :
               <><h2>המשחק בהפסקה</h2><button onClick={() => { setPaused(false); area.current?.focus(); }}>ממשיכים</button></>}
            </div>
          </div>
        )}
      </div>
      <div className="gate-prototype-keyboard" aria-label="השורה האמצעית במקלדת עברית">
        <span className="gate-prototype-keyboard-label">שורת הבית</span>
        <div className="gate-prototype-key-row" dir="ltr">
          {HOME_ROW.map(({ code, letter }) => {
            const used = CONTROLS.some((control) => control.code === code);
            const selected = game.lever && CONTROLS[game.lever.gate].code === code;
            return (
              <button
                key={code}
                type="button"
                className={`gate-prototype-key${used ? " is-active" : ""}${selected ? " is-operating" : ""}`}
                aria-label={`האות ${letter}${used ? " מפעילה שער" : " אינה מפעילה שער בשלב זה"}`}
                aria-disabled={!used || !controllable || paused || Boolean(game.lever)}
                onClick={() => {
                  if (used && controllable && !paused) command(code);
                  // Preserve desktop physical-key input after a touch/click.
                  if (window.matchMedia("(pointer: fine)").matches) area.current?.focus();
                }}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
      <p className="gate-prototype-help">פתחו וסגרו בעזרת <kbd>ע</kbd> (G), <kbd>י</kbd> (H), <kbd>ח</kbd> (J), <kbd>ל</kbd> (K). או לחצו על מקשי המסך. שערי מנעול חסומים.</p>
    </section>
  );
}
