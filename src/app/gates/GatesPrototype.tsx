import { useEffect, useRef, useState } from "react";

type Gate = { open: boolean; closingAt: number };
type Sheep = { id: number; lane: number; x: number; crossed: boolean };
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
const GATE_X = 620;
const SPEED = 105;
const START_X = 250;
const END_X = 1000;
const CONTROLS = [{ code: "KeyG", hebrew: "ע", latin: "G" }, { code: "KeyH", hebrew: "י", latin: "H" }];
function initial(): Game {
  return {
    phase: "ready",
    sheep: [0, 1, 2, 3].map((id) => ({ id, lane: Math.floor(id / 2), x: START_X - (id % 2) * 45, crossed: false })),
    gates: [{ open: false, closingAt: 0 }, { open: false, closingAt: 0 }],
    lever: null, time: 0, score: 1000, waiting: 0, commands: 0,
  };
}
function tick(game: Game, dt: number): Game {
  if (game.phase !== "out" && game.phase !== "back") return game;
  const next: Game = {
    ...game, time: game.time + dt, sheep: game.sheep.map((s) => ({ ...s })),
    gates: game.gates.map((g) => ({ ...g })),
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
  for (const gate of next.gates) {
    if (gate.open && next.time >= gate.closingAt) gate.open = false;
  }
  const direction = next.phase === "out" ? 1 : -1;
  let waitingNow = 0;
  for (const lane of [0, 1]) {
    const group = next.sheep.filter((s) => s.lane === lane)
      .sort((a, b) => direction * (b.x - a.x));
    let previous: number | null = null;
    for (const sheep of group) {
      const oldX = sheep.x;
      let target = oldX + direction * SPEED * dt;
      const gate = next.gates[lane];
      // Only one sheep can approach the closed gate. Followers queue behind it.
      if (!gate.open && (oldX - GATE_X) * direction <= 0 && (target - GATE_X) * direction >= 0) {
        target = GATE_X - direction * 19;
      }
      if (previous !== null) {
        target = direction === 1 ? Math.min(target, previous - 44) : Math.max(target, previous + 44);
      }
      const atGate = Math.abs(target - (GATE_X - direction * 19)) < 0.1 && !gate.open;
      if (atGate || (previous !== null && Math.abs(target - oldX) < 0.001 && !gate.open)) waitingNow += dt;
      sheep.x = direction === 1 ? Math.min(END_X, target) : Math.max(START_X - (sheep.id % 2) * 45, target);
      if (gate.open && (oldX - GATE_X) * (sheep.x - GATE_X) <= 0 && oldX !== sheep.x) {
        gate.closingAt = next.time + 5;
      }
      previous = sheep.x;
    }
  }
  next.waiting += waitingNow;
  next.score = Math.max(0, 1000 - Math.floor(next.waiting));
  if (next.phase === "out" && next.sheep.every((s) => s.x >= END_X)) {
    next.phase = "regroup";
    next.lever = null;
    next.gates = next.gates.map(() => ({ open: false, closingAt: 0 }));
  }
  if (next.phase === "back" && next.sheep.every((s) => s.x <= START_X - (s.id % 2) * 45)) {
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
        <div><h1>שומרי השערים <small>אב־טיפוס · שני שערים</small></h1><p>לחצו על האות של השער. מנוף אחד מפעיל את כולם.</p></div>
        <div className="gate-prototype-stats">
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
        <svg viewBox="0 0 1200 660" role="img" aria-label="מכלאה משמאל, שני שבילים למרעה מימין, שני שערים וארבע כבשים">
          <rect x="0" y="0" width="1200" height="660" rx="28" fill="#b9da94" />
          <path d="M80 180 Q360 140 620 200 T1120 180" stroke="#d8ba81" strokeWidth="88" fill="none" strokeLinecap="round"/>
          <path d="M80 475 Q350 530 620 460 T1120 490" stroke="#d8ba81" strokeWidth="88" fill="none" strokeLinecap="round"/>
          <rect x="65" y="85" width="185" height="495" rx="18" fill="#e9d9ad" stroke="#947a50" strokeWidth="12" strokeDasharray="24 12"/>
          <text x="160" y="115" fontSize="30" textAnchor="middle" fill="#5b4e35">מכלאה</text>
          <text x="1080" y="100" fontSize="30" textAnchor="middle" fill="#416d30">מרעה</text>
          <text x="1080" y="580" fontSize="30" textAnchor="middle" fill="#416d30">מרעה</text>
          {CONTROLS.map((control, i) => {
            const y = i ? 465 : 195;
            const gate = game.gates[i];
            return <g key={control.code}>
              <rect x="596" y={y - 63} width="48" height="126" rx="9" fill={gate.open ? "#a6d1a0" : "#855d44"} stroke="#60452d" strokeWidth="5"/>
              {gate.open ? <path d={`M605 ${y-52} L637 ${y-52}`} stroke="#426943" strokeWidth="9" /> : <path d={`M604 ${y-45} L636 ${y+45} M636 ${y-45} L604 ${y+45}`} stroke="#e2c89a" strokeWidth="9" />}
              <rect x="560" y={y - 115} width="120" height="46" rx="12" fill="#fff9e7" stroke="#71523b" strokeWidth="3"/>
              <text x="620" y={y - 83} textAnchor="middle" fontSize="30" fontWeight="bold" fill="#442e27">{control.hebrew} / {control.latin}</text>
            </g>;
          })}
          {game.sheep.map((s) => <g key={s.id} transform={`translate(${s.x} ${s.lane ? 465 : 195})`}>
            <ellipse cx="0" cy="4" rx="24" ry="20" fill="#fffdf5" stroke="#857c6b" strokeWidth="2"/>
            <circle cx={game.phase === "back" ? -18 : 18} cy="-4" r="11" fill="#5e5550"/>
            <circle cx={game.phase === "back" ? -21 : 21} cy="-7" r="2.5" fill="white"/>
            <path d="M-12 21 V27 M12 21 V27" stroke="#60584d" strokeWidth="5" strokeLinecap="round"/>
          </g>)}
          <g transform="translate(90 615)">
            <rect width="280" height="30" rx="12" fill="#675044"/>
            <text x="140" y="22" fill="#fff8e9" fontSize="19" textAnchor="middle">⚙️ מנוף מרכזי {game.lever ? "פועל" : "מוכן"}</text>
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
      <p className="gate-prototype-help">הקלידו <kbd>ע</kbd> (G) או <kbd>י</kbd> (H). השערים מסומנים תמיד. כדי להמשיך להפעיל מקשים אחרי לחיצה על כפתור, המיקוד חוזר לחווה.</p>
    </section>
  );
}
