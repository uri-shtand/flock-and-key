import { useState } from "react";
import { detectiveWords as story } from "../../content/wordDetectives";
import { replayWordDetectives, type WordDetectiveAction } from "../../typing/WordDetectives";
import { useVocabularyRun, VocabularyFrame } from "./VocabularyFrame";

function Lantern({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-9-18V-24Q0-39 9-24V-18M-18-18H18L24 20H-24Z" fill="#fbd071" stroke="#724b35" strokeWidth="4" />
    <path d="M0-8Q15 7 0 14Q-13 9 0-8Z" fill="#fff5ae" />
  </g>;
}

function DetectiveWorld({ place, found, stage, returned }: NonNullable<ReturnType<typeof replayWordDetectives>>) {
  return <svg className="vocabulary-world" viewBox="0 0 420 230" aria-hidden="true">
    <rect width="420" height="230" fill={place === "square" ? "#bad0a6" : "#e6c7a3"} />
    <path d="M0 167H420V230H0Z" fill={place === "square" ? "#a89978" : "#b47f5d"} />
    {place === "hall" && <>
      <path d="M33 143H235V161H33Z M44 161V191M221 161V191" fill="#865740" stroke="#704a38" strokeWidth="5" />
      <path d="M275 39H380V142H275Z" fill="#a05b64" stroke="#754943" strokeWidth="5" />
      <path d="M291 124L309 72L330 109L348 64L362 124Z" fill="#edc88d" />
      {returned ? <Lantern x={135} y={117} /> : <ellipse cx="135" cy="136" rx="29" ry="5" fill="#b29373" />}
    </>}
    {place === "cafe" && <>
      <path d="M28 124H185V185H28Z" fill="#90644d" stroke="#714634" strokeWidth="4" />
      <rect x="231" y="78" width="152" height="101" rx="12" fill="#8caa8f" stroke="#4c6d5e" strokeWidth="4" />
      <path d="M42 114L126 97L154 126L63 144Z" fill="#ffedc1" stroke="#9f7456" strokeWidth="4" />
      <path d="M247 119H367 M286 101H331 M286 144H331" stroke="#4c6d5e" strokeWidth="6" />
    </>}
    {place === "square" && <>
      <path d="M20 139H171V176H20Z M33 138V60H155V138" fill="#a4695e" stroke="#805348" strokeWidth="6" />
      {stage && <g fill="#ffe3a0"><path d="M55 69L35 136H88Z M131 69L89 136H143Z" /><circle cx="55" cy="69" r="7" fill="#55425a" /><circle cx="131" cy="69" r="7" fill="#55425a" /></g>}
      {found && <><path d="M210 72H420V189H210Z" fill="#e8d6a1" opacity=".6" />
        <path d="M331 143V112Q346 92 362 112V143Z" fill="#a76366" />
        <circle cx="346" cy="96" r="13" fill="#825338" /></>}
      <path d="M224 140H392V159H224Z M241 159V188 M375 159V188" fill="#8b634c" stroke="#6f503e" strokeWidth="6" />
      <g transform={found ? "translate(2 -27) rotate(-10 255 136)" : undefined}>
      <path d="M255 137V64H365V137Z" fill="#617f75" stroke="#46635c" strokeWidth="6" />
      <path d="M265 75L293 83L329 72L355 77V117L329 112L294 122L265 113Z" fill="#e9dbb2" />
      <path d="M271 104L292 90L310 105L344 87" fill="none" stroke="#7b945f" strokeWidth="4" />
      </g>
      {found && <><path d="M293 151L253 100L333 93L325 151Z" fill="#ffe08e" opacity=".36" /><Lantern x={311} y={165} /></>}
    </>}
  </svg>;
}

export function WordDetectives({ exit }: { exit: () => void }) {
  const run = useVocabularyRun<WordDetectiveAction, NonNullable<ReturnType<typeof replayWordDetectives>>>("word-detectives", replayWordDetectives);
  const { state, send } = run;
  const [notebook, setNotebook] = useState(false);
  const travel = (place: "hall" | "cafe" | "square") => { setNotebook(false); send(place); };
  return <VocabularyFrame title={story.title} exit={exit} warning={run.warning} resumed={run.resumed} onHelp={() => send("help")} help={<>
    <p><bdi lang="en">Borrow</bdi> פירושו לקחת ברשות כדי להחזיר. <bdi lang="en">Return</bdi> פירושו להחזיר.</p>
    <p>כדאי לבדוק בשביל מה ביקשו את הפנס ואיפה המשימה מתקיימת עכשיו.</p>
  </>}>
    <div className="vocabulary-layout">
      <div>
        <DetectiveWorld {...state} />
        {!state.returned && <nav className="vocabulary-actions" aria-label="מקומות לחקירה">
          <button className="secondary" aria-pressed={state.place === "hall"} onClick={() => travel("hall")}>לאולם</button>
          <button className="secondary" aria-pressed={state.place === "cafe"} onClick={() => travel("cafe")}>לבית הקפה</button>
          <button className="secondary" aria-pressed={state.place === "square"} onClick={() => travel("square")}>לכיכר</button>
        </nav>}
      </div>
      <div className="vocabulary-task">
        <h2>{story.places[state.place]}</h2>
        {state.returned ? <>
          <p role="status">{story.returned}</p>
          <p><bdi lang="en">Return</bdi> · להחזיר את מה ששאלנו.</p>
          <button onClick={() => { run.restart(); setNotebook(false); }}>לפתוח מחדש את התיק</button>
        </> : notebook ? <>
          <p>איפה כדאי לחפש את הפנס?</p>
          {state.poster && <p>כרזת האולם · איור מההצגה הקודמת.</p>}
          {state.note && <p>פתק הרשות בקפה · עוזר המפות ביקש פנס למפה.</p>}
          {state.moved && <p>מגירת המפות · שולחן המפות הועבר לכיכר.</p>}
          {state.stage && <p>הבמה בכיכר · בהצגה משתמשים בזרקורים.</p>}
          <button onClick={() => setNotebook(false)}>לחזור לחקירה</button>
        </> : <>
          <div className="vocabulary-feedback" role="status">
            {state.detail === "poster" && <p>{story.poster}</p>}
            {state.detail === "note" && <><p lang="en" dir="ltr" className="vocabulary-english">{story.note}</p><p>לעוזר המפות יש רשות לקחת בהשאלה ולהחזיר אחרי החזרה.</p></>}
            {state.detail === "move" && <><p lang="en" dir="ltr" className="vocabulary-english">{story.moved}</p><p>המפה הועברה לכיכר.</p></>}
            {state.detail === "stage" && <p>{story.stage}</p>}
            {state.detail === "table" && <>
              <p>{story.found}</p>
              {!!state.missingAtDiscovery?.length && <p><strong>השלמת מידע מעוזר המפות</strong><br />
                {state.missingAtDiscovery.includes("note") && <>קיבלתי רשות לשאול (<bdi lang="en">borrow</bdi>) את הפנס למפה ולהחזיר אותו אחרי החזרה. </>}
                {state.missingAtDiscovery.includes("move") && "העבירו את שולחן המפות לכיכר אחרי שקיבלתי את הפנס."}
              </p>}
            </>}
            {!state.detail && (state.place === "hall" ? <p lang="en" dir="ltr" className="vocabulary-english">The lantern is missing.</p> : <p>מה נבדוק כאן?</p>)}
          </div>
          <div className="vocabulary-actions">
            {state.place === "hall" && <button className="secondary" onClick={() => send("poster")}>לבדוק את הכרזה</button>}
            {state.place === "cafe" && <>
              <button className="secondary" onClick={() => send("note")}>לקרוא פתק רשות</button>
              <button className="secondary" onClick={() => send("move")}>לבדוק את מגירת המפות</button>
            </>}
            {state.place === "square" && <>
              <button className="secondary" onClick={() => send("stage")}>לבדוק את הבמה</button>
              <button className="secondary" onClick={() => send("table")}>לבדוק את שולחן המפות</button>
              {state.found && <button onClick={() => send("return")}>להחזיר את הפנס למדף</button>}
            </>}
            <button className="secondary" onClick={() => setNotebook(true)}>מחברת רמזים</button>
          </div>
        </>}
      </div>
    </div>
  </VocabularyFrame>;
}
