import { useId } from "react";
import { lostCases } from "../../content/lostFound";
import { replayLostFound, type LostAction } from "../../typing/LostFound";
import { useVocabularyRun, VocabularyFrame } from "./VocabularyFrame";

function ObjectArt({ shape, stripes }: { shape: string; stripes: boolean }) {
  const pattern = useId();
  const silhouette = shape === "scarf" ? "M27 20H113V45H67V100H43V45H27Z" :
    shape === "tote" ? "M25 45H115L105 105H35Z" : "M28 102V49Q28 25 70 25T112 49V102Z";
  return <svg viewBox="0 0 140 120" aria-hidden="true">
    <defs><pattern id={pattern} width="18" height="18" patternUnits="userSpaceOnUse">
      <rect width="18" height="18" fill="#e1a36e" />
      {stripes ? <path d="M0 0H18V7H0Z" fill="#854236" /> : <circle cx="9" cy="9" r="6" fill="#854236" />}
    </pattern></defs>
    {shape !== "scarf" && <path d="M53 48V28Q53 7 70 7T87 28V48" fill="none" stroke="#6d4436" strokeWidth="7" />}
    <path d={silhouette} fill={`url(#${pattern})`} stroke="#603929" strokeWidth="3" />
  </svg>;
}

function TravelerArt({ shape }: { shape: string }) {
  return <svg viewBox="0 0 150 110" aria-hidden="true">
    <path d="M35 102V75Q39 51 71 51T106 75V102Z" fill="#41766a" />
    <circle cx="70" cy="35" r="25" fill="#c78054" />
    <path d="M45 33Q44 5 72 8Q99 9 95 31Q81 25 69 20Q57 31 45 33" fill="#594031" />
    <path d="M63 43Q70 50 77 43" fill="none" stroke="#703e2e" strokeWidth="2" />
    {shape === "scarf" ? <path d="M45 57H96V70H83V101H70V70H45Z M72 80H81 M72 91H81" fill="#a64647" stroke="#f2b37d" strokeWidth="3" /> :
      shape === "backpack" ? <path d="M44 75L69 79L94 74V99L69 105L44 99Z M69 79V105" fill="#ffe5ae" stroke="#854236" strokeWidth="3" /> :
        <path d="M36 76H126L137 106H25Z M56 76L52 106 M83 76V106 M108 76L111 106 M31 91H132" fill="#f4ae9a" stroke="#9d4849" strokeWidth="3" />}
  </svg>;
}

export function LostFound({ exit }: { exit: () => void }) {
  const run = useVocabularyRun<LostAction, NonNullable<ReturnType<typeof replayLostFound>>>("lost-found", replayLostFound);
  const { state, send } = run;
  const item = lostCases[state.index];
  const end = state.index === lostCases.length - 1;
  return <VocabularyFrame title="מחלקת האבידות של פיצי" exit={exit} warning={run.warning} resumed={run.resumed} onHelp={() => send("help")} help={<>
    <p><bdi lang="en">striped</bdi> פירושו מפוספס. <bdi lang="en">beside</bdi> פירושו לצד.</p>
    {!state.delivered && <form method="dialog"><button className="secondary" onClick={() => send("show")}>הדגימו איזה חפץ למסור</button></form>}
  </>}>
    <div className="vocabulary-layout">
      <div className="lost-counter">
        {state.delivered ? <div className="lost-result"><TravelerArt shape={item.shape} /><strong>{item.outcome}</strong></div> :
          (["left", "right"] as const).map((side, index) => {
            const stripes = item.shape === "backpack" || item.correct === side;
            const detail = item.shape === "backpack" ? (side === item.correct ? "לצד הספסל" : "מאחורי הספסל") : stripes ? "מפוספס" : "מנוקד";
            return <div key={side}>
              <button className="lost-object secondary" aria-pressed={state.selected === side} aria-label={`בחירת ${item.item} ${index + 1}`}
                onClick={() => send(side)}><ObjectArt shape={item.shape} stripes={stripes} />{item.item} {index + 1}</button>
              <button className="secondary" aria-pressed={state.inspection === side} onClick={() => send(side === "left" ? "inspect-left" : "inspect-right")}>בדיקת חפץ {index + 1}</button>
              <p>{(state.inspection === side || (state.knowsLocation && item.shape === "backpack")) ? detail : "\u00a0"}</p>
            </div>;
          })}
      </div>
      <div className="vocabulary-task">
        <p>מקרה {state.index + 1} מתוך {lostCases.length}</p>
        <h2>{item.person}</h2>
        <p>{item.need}</p>
        <p lang="en" dir="ltr" className="vocabulary-english">{item.request}</p>
        {state.delivered ? <button onClick={() => { if (end) run.restart(); else send("next"); }}>{end ? "סיבוב חדש" : "הלקוח הבא"}</button> : <>
          <div className="vocabulary-actions">
            <button className="secondary" onClick={() => send("pattern")}>לשאול על הדוגמה</button>
            <button className="secondary" onClick={() => send("location")}>לשאול על מקום המציאה</button>
          </div>
          <p className="vocabulary-feedback" role="status">
            {state.knowsLocation && item.shape === "backpack" && <bdi lang="en">It was beside the bench. </bdi>}
            {state.feedback === "pattern" && <bdi lang="en">It is striped.</bdi>}
            {state.feedback === "location" && item.shape !== "backpack" && "אפשר לזהות אותו לפי הדוגמה."}
            {state.feedback === "clarify" && "שניהם נראים מתאימים. אולי יש פרט שאוכל לספר?"}
            {state.feedback === "wrong" && (item.shape === "backpack" ? "התיק שלי נמצא במקום אחר ליד הספסל." : "הדוגמה קצת שונה משלי. אפשר לנסות שוב.")}
          </p>
          <button disabled={!state.selected} onClick={() => send("give")}>למסור ל{item.person}</button>
        </>}
      </div>
    </div>
  </VocabularyFrame>;
}
