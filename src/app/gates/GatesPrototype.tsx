import { useEffect, useRef, useState } from "react";
import { keyboardRows } from "../../typing/KeyboardMap";

type Gate = { open: boolean; closingAt: number };
type Sheep = { id: number; lane: number; progress: number };
type Phase = "ready" | "out" | "regroup" | "back" | "done";
type Game = {
  phase: Phase;
  sheep: Sheep[];
  gates: Gate[];
  lever: { gate: number; action: "open" | "close"; remaining: number } | null;
  time: number;
  score: number;
  waiting: number;
  commands: number;
};
const GATE_PROGRESS = 0.5;
const STOP_OFFSET = 0.035;
const SHEEP_SPACING = 0.082;
const SPEED = 0.105;
const CONTROLS = [
  { code: "KeyG", hebrew: "ע", latin: "G" },
  { code: "KeyH", hebrew: "י", latin: "H" },
];
// The virtual keys preserve the physical left-to-right home-row order.
const HOME_ROW = keyboardRows[1];
const ART = "/assets/gates/";
const ART_VERSION = "farm-v2-20261112";

function initial(): Game {
  return {
    phase: "ready",
    sheep: [0, 1, 2, 3].map((id) => ({
      id, lane: Math.floor(id / 2), progress: -(id % 2) * SHEEP_SPACING,
    })),
    gates: [{ open: false, closingAt: 0 }, { open: false, closingAt: 0 }],
    lever: null, time: 0, score: 1000, waiting: 0, commands: 0,
  };
}

function cubic(a: number, b: number, c: number, d: number, t: number): number {
  const q = 1 - t;
  return q * q * q * a + 3 * q * q * t * b + 3 * q * t * t * c + t * t * t * d;
}

/** Identical world geometry for the pictured dirt tracks and the moving sheep. */
function sheepPosition(lane: number, progress: number) {
  if (progress < 0) {
    return { x: lane === 0 ? 740 - progress * 170 : 860 + progress * 170, y: 467 + progress * 40 };
  }
  const t = Math.min(1, progress);
  const firstHalf = t <= 0.5;
  const u = firstHalf ? t * 2 : (t - 0.5) * 2;
  const x = firstHalf
    ? cubic(740, 590, 520, 365, u)
    : cubic(365, 210, 100, -40, u);
  const y = firstHalf
    ? cubic(467, 461, 575, 581, u)
    : cubic(581, 587, 533, 460, u);
  return { x: lane === 0 ? x : 1600 - x, y };
}

function tick(game: Game, dt: number): Game {
  if (game.phase !== "out" && game.phase !== "back") return game;
  const next: Game = {
    ...game, time: game.time + dt,
    sheep: game.sheep.map((sheep) => ({ ...sheep })),
    gates: game.gates.map((gate) => ({ ...gate })),
    lever: game.lever ? { ...game.lever } : null,
  };
  if (next.lever) {
    next.lever.remaining -= dt;
    if (next.lever.remaining <= 0) {
      const { gate, action } = next.lever;
      next.gates[gate].open = action === "open";
      if (action === "open") next.gates[gate].closingAt = next.time + 5;
      next.lever = null;
    }
  }

  const outward = next.phase === "out";
  const direction = outward ? 1 : -1;
  let waitingNow = 0;
  for (const lane of [0, 1]) {
    const group = next.sheep.filter((sheep) => sheep.lane === lane)
      .sort((a, b) => direction * (b.progress - a.progress));
    let leader: number | null = null;
    let queueBlocked = false;
    const gate = next.gates[lane];
    const stop = GATE_PROGRESS - direction * STOP_OFFSET;
    for (const sheep of group) {
      const before = sheep.progress;
      const destination = outward ? (sheep.id % 2 === 0 ? 1 : 1 - SHEEP_SPACING)
        : (sheep.id % 2 === 0 ? SHEEP_SPACING : 0);
      let target = before + direction * SPEED * dt;
      target = outward ? Math.min(destination, target) : Math.max(destination, target);
      const approachingGate = direction * (before - stop) <= 0;
      if (!gate.open && approachingGate && direction * (target - stop) >= 0) {
        target = stop;
      }
      if (leader !== null) {
        target = outward
          ? Math.min(target, leader - SHEEP_SPACING)
          : Math.max(target, leader + SHEEP_SPACING);
      }
      const stopped = Math.abs(target - before) < 0.00001;
      const waitingForGate = !gate.open && (
        (approachingGate && Math.abs(target - stop) < 0.00001) ||
        (queueBlocked && stopped)
      );
      if (waitingForGate) waitingNow += dt;
      queueBlocked = waitingForGate;
      sheep.progress = target;
      // Passing a gate refreshes the timer, so a following sheep may pass.
      if (gate.open && direction * (before - GATE_PROGRESS) < 0
        && direction * (target - GATE_PROGRESS) >= 0) {
        gate.closingAt = next.time + 5;
      }
      leader = target;
    }
  }
  // Automatic local closures do not occupy the common lever.
  for (const gate of next.gates) {
    if (gate.open && next.time >= gate.closingAt) gate.open = false;
  }
  next.waiting += waitingNow;
  next.score = Math.max(0, 1000 - Math.floor(next.waiting));
  if (outward && next.sheep.every((s) => s.progress >= 1 - (s.id % 2) * SHEEP_SPACING - 0.00001)) {
    next.phase = "regroup";
    next.lever = null;
    next.gates = next.gates.map(() => ({ open: false, closingAt: 0 }));
  }
  if (!outward && next.sheep.every((s) => s.progress <= (s.id % 2 === 0 ? SHEEP_SPACING : 0) + 0.00001)) {
    next.phase = "done";
    next.lever = null;
  }
  return next;
}

export function GatesPrototype({ onExit }: { onExit: () => void }) {
  const [game, setGame] = useState<Game>(initial);
  const [paused, setPaused] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);
  const running = game.phase === "out" || game.phase === "back";
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
    setGame((g) => {
      if ((g.phase !== "out" && g.phase !== "back") || g.lever) return g;
      return { ...g, lever: { gate: index, action: g.gates[index].open ? "close" : "open", remaining: 0.8 }, commands: g.commands + 1 };
    });
  }
  function focusAndStart() {
    setGame((g) => ({ ...g, phase: "out" }));
    setPaused(false);
    area.current?.focus();
  }
  return (
    <section className="gate-prototype" dir="rtl">
      <div className="gate-prototype-toolbar">
        <div><h1>שומרי השערים <small>אב־טיפוס · שני שערים · Farm v2</small></h1><p>לחצו על האות של השער. מנוף אחד מפעיל את כולם.</p></div>
        <div className="gate-prototype-stats">
          <span className="gate-prototype-version" aria-label="גרסת תצוגת החווה">Farm v2</span>
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
        aria-label="החווה. השתמשו במקשים ע ו־י לפתיחת השערים."
        onKeyDown={(e) => { if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.nativeEvent.isComposing) return; if (CONTROLS.some((c) => c.code === e.code)) { e.preventDefault(); command(e.code); } }}
      >
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img"
          aria-label="מכלאת כבשים במרכז; שביל אחד שמאלה ושביל אחד ימינה, ושני שערים עם אותיות גדולות">
          <image href={ART + "farm-background.svg?v=" + ART_VERSION} x="0" y="0" width="1600" height="900" />
          {game.sheep.map((sheep) => {
            const point = sheepPosition(sheep.lane, sheep.progress);
            const facesRight = (sheep.lane === 1) === (game.phase !== "back");
            return (
              <image key={sheep.id} href={ART + "sheep.svg?v=" + ART_VERSION}
                x={facesRight ? point.x - 54 : point.x + 54} y={point.y - 46}
                width="108" height="78"
                transform={facesRight ? undefined : "translate(" + (2 * point.x) + " 0) scale(-1 1)"}
              />
            );
          })}
          {CONTROLS.map((control, index) => {
            const x = index === 0 ? 365 : 1235;
            const gate = game.gates[index];
            const active = game.lever?.gate === index;
            return (
              <g key={control.code}>
                <image href={ART + (gate.open ? "wooden-gate-open.svg" : "wooden-gate.svg") + "?v=" + ART_VERSION}
                  x={x - 88} y="500" width="176" height="142" />
                <image href={ART + "blank-gate-sign.svg?v=" + ART_VERSION} x={x - 100} y="297" width="200" height="139"/>
                <text x={x} y="376" textAnchor="middle" fontSize="77"
                  fontWeight="900" fill="#191d23" stroke="#fffaf0" strokeWidth="2" paintOrder="stroke">{control.hebrew}</text>
                {active && <circle cx={x} cy="585" r="106" fill="none" stroke="#f7e76a"
                  strokeWidth="12" strokeDasharray="15 11" opacity=".9" />}
              </g>
            );
          })}
          <g transform="translate(650 740)">
            <rect width="300" height="56" rx="18" fill="#544032" stroke="#241f1b" strokeWidth="5" />
            <text x="150" y="38" textAnchor="middle" fontSize="26" fontWeight="bold" fill="#fff7db">
              {game.lever ? "⚙ המנוף עובד…" : "⚙ המנוף פנוי"}
            </text>
          </g>
        </svg>
        {(game.phase === "ready" || game.phase === "regroup" || game.phase === "done" || paused) && (
          <div className="gate-prototype-overlay">
            <div className="gate-prototype-dialog">
              {game.phase === "ready" ? <><h2>מוציאים את הכבשים למרעה</h2><p>ע ו־י פותחים את השערים. המנוף עסוק למשך 0.8 שניות בכל פעולה. שער נסגר לבד אחרי 5 שניות ללא מעבר.</p><button onClick={focusAndStart}>מתחילים</button></> :
               game.phase === "done" ? <><h2>כל הכבשים בבית! 🐑</h2><p>ניקוד: {game.score} · זמן המתנה מצטבר: {game.waiting.toFixed(1)} שניות־כבשה</p><button onClick={() => { setGame(initial()); setPaused(false); area.current?.focus(); }}>משחק חדש</button></> :
               game.phase === "regroup" ? <><h2>הגיע הזמן לחזור הביתה</h2><p>אותם השערים, בכיוון ההפוך.</p><button onClick={() => { setGame((g) => ({ ...g, phase: "back" })); area.current?.focus(); }}>מחזירים הביתה</button></> :
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
                aria-disabled={!used || !running || paused || Boolean(game.lever)}
                onClick={() => {
                  if (used && running && !paused) command(code);
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
      <p className="gate-prototype-help">געו באות המתאימה בשורת המקלדת שמתחת לחווה. במחשב אפשר גם להקליד <kbd>ע</kbd> (G) או <kbd>י</kbd> (H). האותיות נשארות גלויות על השערים.</p>
    </section>
  );
}
