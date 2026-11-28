import { useState } from "react";
import { workshop } from "../../content/fixItDad";
import { replayWorkshop, type WorkshopAction } from "../../typing/FixItDad";
import { useVocabularyRun, VocabularyFrame } from "./VocabularyFrame";

function WorkshopArt({ sign, handle, feedback }: NonNullable<ReturnType<typeof replayWorkshop>>) {
  const x = { case: 92, tray: 196, "stage-left": 280, "stage-right": 353 }[sign];
  const y = sign === "case" ? 92 : sign === "tray" ? 188 : 67;
  const lifted = feedback === "stage" || feedback === "success";
  return <svg viewBox="0 0 420 230" className="vocabulary-world" aria-hidden="true">
    <rect width="420" height="230" fill="#ddc19b" />
    <path d="M0 157H420V230H0Z" fill="#ad7754" />
    <path d="M233 155H404V179H233Z M250 90V155 M387 90V155" fill="#956047" stroke="#674537" strokeWidth="6" />
    {[280, 353].map(slot => <circle key={slot} cx={slot} cy="79" r="15" fill="#ffedbf" stroke="#91654c" strokeWidth="4" />)}
    <rect x="142" y="169" width="103" height="54" rx="8" fill="#c7a285" stroke="#80563e" strokeWidth="4" />
    <g transform={lifted ? "translate(0 -24)" : undefined}>
      <rect x="23" y="97" width="138" height="65" rx="10" fill="#8db1a2" stroke="#345d5c" strokeWidth="5" />
      <path d="M24 121H160 M46 110V136 M138 110V136" stroke="#345d5c" strokeWidth="6" />
      {handle && <path d="M69 97V82Q92 59 115 82V97" fill="none" stroke="#624635" strokeWidth="7" />}
    </g>
    {!handle && <path d="M68 195V181Q91 160 114 181V195" fill="none" stroke="#624635" strokeWidth="7" />}
    {feedback === "success" && <g><path d="M33 75L49 38H145L151 75Z" fill="#edc36e" stroke="#92623b" strokeWidth="4" />
      <path d="M54 68L64 50L73 69Z" fill="#b04e49" /><circle cx="93" cy="63" r="10" fill="#fff4bc" />
      <path d="M115 69L123 48L137 69Z" fill="#3d796f" /></g>}
    <g transform={`translate(${x} ${y})`}>
      <rect x="-35" y="-16" width="70" height="33" rx="5" fill="#ffe0a3" stroke="#7d5038" strokeWidth="4" />
      <path d="M-22 8L-12-8L-2 6L10-10L22 8Z" fill="#417664" />
    </g>
  </svg>;
}

export function FixItDad({ exit }: { exit: () => void }) {
  const run = useVocabularyRun<WorkshopAction, NonNullable<ReturnType<typeof replayWorkshop>>>("fix-it-dad", replayWorkshop);
  const { state, send } = run;
  const [tags, setTags] = useState(false);
  return <VocabularyFrame title={workshop.title} exit={exit} warning={run.warning} resumed={run.resumed} onHelp={() => send("help")} help={<>
    <p><bdi lang="en">Attach</bdi> פירושו לחבר. <bdi lang="en">Remove</bdi> פירושו להסיר.</p>
    <form method="dialog"><button className="secondary" onClick={() => { if (tags) { if (state.star) send("star"); } else send("show"); }}>{tags ? "הדגימו הסרת תג" : "הדגימו את החיבורים"}</button></form>
  </>}>
    {tags ? <div className="vocabulary-layout">
      <svg viewBox="0 0 420 230" className="vocabulary-world" aria-hidden="true">
        <rect width="420" height="230" fill="#a97555" />
        <rect x="38" y="28" width="344" height="174" rx="18" fill="#f5d9aa" />
        <path d="M63 148L133 70L190 142Z" fill="#668673" />
        <path d="M228 143L268 86L353 148Z" fill="#9e6457" />
        {state.star && <g><rect x="62" y="62" width="132" height="105" rx="12" fill="#5c7867" /><text x="128" y="133" textAnchor="middle" fontSize="54" fill="#ffdf9c">★</text></g>}
        {state.circle && <g><rect x="226" y="62" width="132" height="105" rx="12" fill="#95614c" /><circle cx="292" cy="113" r="24" fill="#fff2cf" /></g>}
      </svg>
      <div className="vocabulary-task">
        <h2>לוח התגים</h2>
        <p lang="en" dir="ltr" className="vocabulary-english">{workshop.tagRequest}</p>
        <div className="vocabulary-actions">
          <button className="secondary" aria-pressed={state.star} onClick={() => send("star")}>★ תג כוכב</button>
          <button className="secondary" aria-pressed={state.circle} onClick={() => send("circle")}>● תג עיגול</button>
        </div>
        <p role="status">{!state.star ? "מתחת לכוכב הסתתר ציור של הר." : !state.circle ? "מתחת לעיגול הסתתר ציור אחר." : "שני התגים מחוברים."}</p>
        <button onClick={() => setTags(false)}>בחזרה למזוודה</button>
      </div>
    </div> : <div className="vocabulary-layout">
      <div>
        <WorkshopArt {...state} />
        <div className="vocabulary-actions">
          <button className="secondary" onClick={() => send("handle")}><bdi lang="en">{state.handle ? "Remove" : "Attach"}</bdi> ידית</button>
          {state.sign !== "tray" ? <button className="secondary" onClick={() => send("remove-sign")}><bdi lang="en">Remove</bdi> שלט</button> : <>
            <button className="secondary" onClick={() => send("case")}>לחבר למזוודה</button>
            <button className="secondary" onClick={() => send("stage-left")}>לחבר לתושבת שמאל</button>
            <button className="secondary" onClick={() => send("stage-right")}>לחבר לתושבת ימין</button>
          </>}
        </div>
      </div>
      <div className="vocabulary-task">
        <p>{state.checkpoint ? "התיקון נשמר. אפשר לנסות חיבורים נוספים." : workshop.fault}</p>
        <p className="vocabulary-english" lang="en" dir="ltr">{workshop.request}</p>
        <p className="vocabulary-feedback" role="status">{workshop.feedback[state.feedback]}</p>
        <div className="vocabulary-actions">
          <button onClick={() => send("test")}>ננסה להשתמש</button>
          {state.previous && <button className="secondary" onClick={() => send("undo")}>לבטל שינוי</button>}
          {state.checkpoint && <button className="secondary" onClick={() => send("restore")}>להחזיר לתיקון התקין</button>}
        </div>
        {state.checkpoint && <p><button className="secondary" onClick={() => setTags(true)}>לוח תגים · אפשר לדלג</button></p>}
      </div>
    </div>}
  </VocabularyFrame>;
}
