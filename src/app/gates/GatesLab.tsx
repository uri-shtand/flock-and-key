import { useEffect, useRef, useState } from "react";
import { gatesLevels, levelConfig, validGatesConfig, type GatesConfig } from "../../content/gatesLevels";

export function GatesLab({ config, onApply, onClose }: { config: GatesConfig; onApply: (config: GatesConfig) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(config);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => { dialog.current?.close(); };
  }, []);
  const sliders: { key: "speed" | "sheepCount" | "openSeconds" | "gearboxSeconds"; label: string; min: number; max: number; step: number; unit: string }[] = [
    { key: "speed", label: "קצב הליכה", min: 90, max: 260, step: 5, unit: "" },
    { key: "sheepCount", label: "כבשים בעדר", min: 2, max: 10, step: 1, unit: "" },
    { key: "openSeconds", label: "זמן שער פתוח", min: 1.2, max: 5, step: 0.1, unit: " שנ׳" },
    { key: "gearboxSeconds", label: "זמן תיבת ההילוכים", min: 0.15, max: 1.2, step: 0.05, unit: " שנ׳" },
  ];
  return <dialog ref={dialog} className="gate-prototype-dialog gate-lab" aria-labelledby="gate-lab-title" onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div className="gate-lab-heading"><h2 id="gate-lab-title">מעבדת הכיף ⚙</h2><button autoFocus className="secondary" onClick={onClose} aria-label="סגירת מעבדת הכיף">✕</button></div>
      <p>מה יותר כיף: עדר גדול או שער זריז? משנים, משחקים, מנסים שוב.</p>
      <label className="gate-lab-level">שלב לניסוי <select value={draft.level} onChange={(e) => { setDraft({ ...levelConfig(Number(e.target.value)), hints: draft.hints, reducedMotion: draft.reducedMotion }); setCopied(false); }}>
        {gatesLevels.map((l, i) => <option key={l.theme} value={i + 1}>{i + 1} · {l.title}</option>)}
      </select></label>
      <div className="gate-lab-sliders">{sliders.map(({ key, label, min, max, step, unit }) => <label key={key}>
        <span>{label} <output>{Number(draft[key].toFixed(2))}{unit}</output></span>
        <input type="range" aria-label={label} min={min} max={max} step={step} value={draft[key]} onChange={(e) => { setDraft({ ...draft, [key]: Number(e.target.value) }); setCopied(false); }} />
      </label>)}</div>
      <div className="gate-lab-options">
        <label><input type="checkbox" checked={draft.hints} onChange={(e) => setDraft({ ...draft, hints: e.target.checked })} /> רמז לשער הבא</label>
        <label><input type="checkbox" checked={draft.reducedMotion} onChange={(e) => setDraft({ ...draft, reducedMotion: e.target.checked })} /> פחות תנועה</label>
      </div>
      <div className="gate-lab-presets" aria-label="ניסויים מוכנים">
        <button className="secondary" onClick={() => setDraft({ ...draft, speed: 110, openSeconds: 4, gearboxSeconds: 0.3 })}>רגוע</button>
        <button className="secondary" onClick={() => setDraft({ ...draft, speed: 220, openSeconds: 1.8, gearboxSeconds: 0.3 })}>זריז</button>
        <button className="secondary" onClick={() => setDraft(levelConfig(draft.level))}>ברירת מחדל לשלב</button>
      </div>
      <div className="gate-dialog-actions"><button disabled={!validGatesConfig(draft)} onClick={() => onApply(draft)}>החלה וסיבוב חדש</button>
        <button className="secondary" onClick={async () => { setShowJson(true); try { await navigator.clipboard.writeText(JSON.stringify(draft, null, 2)); setCopied(true); } catch { setCopied(false); } }}>העתקת הגדרות</button></div>
      {showJson && <label className="gate-lab-json">{copied ? "הועתק!" : "אפשר להעתיק מכאן:"}<input aria-label="הגדרות JSON" readOnly value={JSON.stringify(draft)} onFocus={(e) => e.target.select()} /></label>}
      <small>החלה מתחילה מחדש את השלב. הסיבוב נשמר רק בדפדפן הזה.</small>
  </dialog>;
}
