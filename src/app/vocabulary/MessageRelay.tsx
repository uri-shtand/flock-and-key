import { relay } from "../../content/messageRelay";
import { replayRelay, type RelayAction } from "../../typing/MessageRelay";
import { useVocabularyRun, VocabularyFrame } from "./VocabularyFrame";

function RadioMap({ location, status, draft, feedback }: NonNullable<ReturnType<typeof replayRelay>>) {
  const position = { station: [53, 188], cafe: [129, 78], across: [290, 122] }[location];
  const marker = draft === "cafe" ? 116 : draft === "across" ? 313 : null;
  return <svg className="vocabulary-world" viewBox="0 0 420 230" aria-hidden="true">
    <rect width="420" height="230" fill="#bbcf9f" />
    <path d="M207-12L175 242" stroke="#e6ccad" strokeWidth="57" />
    <path d="M207-12L175 242" stroke="#a4866d" strokeWidth="3" strokeDasharray="10 8" />
    <path d="M38 50H158V113H38Z" fill="#f3d0a4" stroke="#8b5c42" strokeWidth="5" />
    <path d="M27 50L46 25H150L169 50Z" fill="#ad5a50" stroke="#794b3c" strokeWidth="4" />
    <text x="98" y="72" textAnchor="middle" fontSize="18" fill="#472c29">בית הקפה</text>
    <rect x="237" y="60" width="152" height="113" rx="20" fill="#e0d5b5" stroke="#8a755b" strokeWidth="4" />
    <text x="313" y="84" textAnchor="middle" fontSize="18" fill="#472c29">רחבה</text>
    <rect x="10" y="164" width="131" height="53" rx="9" fill="#edd4b0" stroke="#9a724f" strokeWidth="4" />
    <text x="93" y="198" textAnchor="middle" fontSize="18" fill="#472c29">תחנה</text>
    {marker && <g transform={`translate(${marker} 99)`}>
      <ellipse rx="26" ry="13" fill="none" stroke="#563e6d" strokeWidth="4" strokeDasharray="4 4" />
      <path d="M0-5L-8-17H8Z" fill="#563e6d" />
    </g>}
    <g transform={`translate(${position.join(" ")})`}>
      {status === "waiting" && <path d="M-21 23H36M-15 16V28M30 16V28" stroke="#795638" strokeWidth="6" />}
      {[-11, 12, 35].map((x, index) => <g key={x} transform={`translate(${x} ${status === "waiting" ? 4 : 0})`}>
        <path d={status === "waiting" ? "M-8 13V5Q0-2 8 5V13L15 18L12 23L1 17Z" : "M-8 19V5Q0-2 8 5V19Z"} fill={["#3b7770", "#976147", "#a15f70"][index]} />
        <circle cy="-1" r="6" fill="#774c36" />
      </g>)}
      {status === "performing" ? <text x="8" y="-18" textAnchor="middle" fontSize="25" fill="#513e67">♪ ♫ ♪</text>
        : <g><rect x="-16" y="21" width="32" height="9" rx="4" fill="#674636" />
          {feedback === "early" && <path d="M-16 21L8 11L16 21Z" fill="#945c53" stroke="#674636" strokeWidth="2" />}</g>}
    </g>
  </svg>;
}

export function MessageRelay({ exit }: { exit: () => void }) {
  const run = useVocabularyRun<RelayAction, NonNullable<ReturnType<typeof replayRelay>>>("message-relay", replayRelay);
  const { state, send } = run;
  const { update } = state;
  const choices = update === "location" ? [["cafe", "בית הקפה"], ["across", "הרחבה מעבר לרחוב"]] as const :
    [["wait", "להמתין"], ["start", "להתחיל"]] as const;
  return <VocabularyFrame title={relay.title} exit={exit} warning={run.warning} resumed={run.resumed} onHelp={() => send("help")} help={<>
    <p><bdi lang="en">across from</bdi> פירושו מול, בצד השני. <bdi lang="en">delayed</bdi> פירושו מתעכב.</p>
    {(update === "location" || update === "delay") && <form method="dialog"><button className="secondary" onClick={() => send("show")}>הדגימו בחירה</button></form>}
  </>}>
    <div className="vocabulary-layout">
      <div>
        <RadioMap {...state} />
        <p><strong>הלהקה {relay.places[state.location]} · {relay.statuses[state.status]}</strong></p>
      </div>
      <div className="vocabulary-task">
        <h2>עדכון ללהקה</h2>
        {update !== "done" && update !== "waiting" && <p className="vocabulary-english" lang="en" dir="ltr">{relay.messages[update]}</p>}
        {update === "ready" && <p>קיבלנו אישור. עכשיו אפשר להתחיל.</p>}
        {(update === "location" || update === "delay") && <div className="vocabulary-actions">
          {choices.map(([action, label]) => <button key={action} className="secondary" aria-pressed={state.draft === action} onClick={() => send(action)}>{label}</button>)}
        </div>}
        <p className="vocabulary-feedback" role="status">
          {state.feedback === "cafe" && "הלהקה נכנסה לבית הקפה. האם התכוונו לצד השני של הרחוב?"}
          {state.feedback === "early" && "הלהקה רק פתחה נרתיק. ההודעה מבקשת לעדכן על העיכוב."}
          {update === "waiting" && "הלהקה נשארת ברחבה. הנרתיקים סגורים והמוזיקאים התיישבו."}
          {update === "done" && "כולם במקום. הלהקה פתחה את החזרה!"}
        </p>
        {update === "done" ? <button onClick={run.restart}>אירוע חדש</button> : update === "ready"
          ? <button onClick={() => send("ready")}>להתחיל את החזרה</button>
          : update === "waiting" ? <button onClick={() => send("receive")}>לקבל עדכון חדש</button>
          : <button disabled={!state.draft} onClick={() => send("send")}>להעביר ללהקה</button>}
      </div>
    </div>
  </VocabularyFrame>;
}
