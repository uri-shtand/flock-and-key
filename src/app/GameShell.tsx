import { useCallback, useRef, useState } from 'react';
import { PhaserStage } from '../components/PhaserStage';
import type { GameBridge } from '../game/bridge';
import challenges from '../content/challenges.json';
import { isCorrectAnswer } from '../typing/TypingEngine';
import { readCompleted, saveCompleted } from '../progress/ProgressStore';
export function GameShell() {
  const bridge = useRef<GameBridge | null>(null);
  const [ready, setReady] = useState(false);
  const [answer, setAnswer] = useState('');
  const [completed, setCompleted] = useState(readCompleted);
  const [message, setMessage] = useState('החווה מוכנה להרפתקה הראשונה שלכם.');
  const connect = useCallback((value: GameBridge | null) => { bridge.current = value; setReady(Boolean(value)); }, []);
  const challenge = challenges[0];
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isCorrectAnswer(answer, challenge.word)) { setMessage('עוד ניסיון? העתיקו את המילה דג. אין לחץ.'); return; }
    bridge.current?.send('celebrate');
    const next = completed + 1;
    setCompleted(next);
    const saved = saveCompleted(next);
    setMessage(saved ? 'כל הכבוד! הכבשה בדרך לשער. ההתקדמות נשמרה.' : 'כל הכבוד! הכבשה בדרך לשער. השמירה אינה זמינה בדפדפן הזה.');
    setAnswer('');
  }
  return <main>
    <header><span className="eyebrow">הרפתקה קטנה · התחלה גדולה</span><h1 dir="ltr">Flock & Key</h1><p>תעלומת הכבשים הנעלמות</p></header>
    <section className="game-card" aria-label="הדגמת המשחק">
      <div className="scene-heading"><span>01 / בוקר בחווה</span><span className="status">{ready ? 'המנוע מוכן' : 'טוענים את החווה…'}</span></div>
      <PhaserStage onReady={connect}/>
      <div className="challenge"><span className="eyebrow">שלום עולם, שלום כבשה</span><h2>{challenge.prompt}</h2>
        <form onSubmit={submit}><label htmlFor="answer">המילה שלכם: <strong>{challenge.word}</strong></label>
          <div className="input-row"><input id="answer" value={answer} onChange={e => setAnswer(e.target.value)} dir="rtl" autoFocus autoComplete="off" spellCheck={false} placeholder="הקלידו כאן"/><button disabled={!ready} type="submit">קדימה לשער ←</button></div>
        </form><p className="feedback" role="status">{message}</p>
        <div className="meta"><span>הצלחות שנשמרו: <b data-testid="completed">{completed}</b></span><span>Phaser + React + TypeScript</span></div>
      </div>
    </section><footer>בלי שעון, עם סקרנות. כל הרפתקה מתחילה במילה אחת.</footer>
  </main>;
}
