import { useEffect, useRef, useState, type ReactNode } from "react";
import "./vocabulary.css";

export function useVocabularyRun<Action extends string, State>(
  id: string, replay: (events: unknown) => State | null,
) {
  const key = `flock-key-vocabulary-${id}-v1`;
  const [run, setRun] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      const events: unknown = raw === null ? [] : JSON.parse(raw);
      if (Array.isArray(events) && replay(events)) return { events: events as Action[], warning: "" };
      return { events: [], warning: "השמירה לא התאימה למשחק. מתחילים מחדש." };
    } catch {
      return { events: [], warning: "השמירה המקומית אינה זמינה או לא נקראה." };
    }
  });
  const state = replay(run.events)!;
  function save(events: Action[]) {
    if (!replay(events)) return;
    try {
      localStorage.setItem(key, JSON.stringify(events));
      setRun({ events, warning: "" });
    } catch {
      setRun({ events, warning: "השמירה המקומית אינה זמינה. אפשר לשחק, אך ההתקדמות עלולה להיעלם." });
    }
  }
  return { state, warning: run.warning, resumed: run.events.length > 0, send: (action: Action) => save([...run.events, action]), restart: () => save([]) };
}

export function VocabularyFrame({ title, exit, warning, resumed, help, onHelp, children }: {
  title: string; exit: () => void; warning: string; resumed: boolean; help: ReactNode; onHelp?: () => void; children: ReactNode;
}) {
  const [overlay, setOverlay] = useState<"pause" | "help" | null>(() => resumed ? "pause" : null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (overlay && !dialog.current?.open) dialog.current?.showModal();
  }, [overlay]);
  return <section className="panel vocabulary-panel" dir="rtl" aria-label={title} onKeyDown={event => {
    if (event.key === "Escape" && !overlay) setOverlay("pause");
  }}>
    <header className="vocabulary-heading">
      <h1>{title}</h1>
      <div>
        <button className="secondary" onClick={() => { onHelp?.(); setOverlay("help"); }}>עזרה</button>
        <button className="secondary" onClick={() => setOverlay("pause")}>הפסקה</button>
        <button className="secondary" onClick={exit}>למשחקונים</button>
      </div>
    </header>
    {warning && <p role="alert">{warning}</p>}
    {children}
    <dialog ref={dialog} className="vocabulary-dialog" aria-label={overlay === "help" ? "עזרה" : "הפסקה"}
      onClose={() => setOverlay(null)}>
      {overlay === "help" ? help : <p>המשחק מחכה כאן.</p>}
      <form method="dialog"><button autoFocus>ממשיכים</button></form>
    </dialog>
  </section>;
}
