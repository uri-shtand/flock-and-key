import { cafeOrders } from "../../content/cafeShift";
import { replayCafe, type CafeAction } from "../../typing/CafeShift";
import { useVocabularyRun, VocabularyFrame } from "./VocabularyFrame";

function Sandwich({ cheese, tomato, split, packed, served }: NonNullable<ReturnType<typeof replayCafe>>) {
  return <svg className="vocabulary-world" viewBox="0 0 400 240" aria-hidden="true">
    <rect width="400" height="240" fill="#d1a179" />
    <ellipse cx={packed === 1 ? 263 : packed === 2 ? 137 : 200} cy="132" rx={packed ? 104 : 145} ry="81" fill="#fff6dd" stroke="#467a73" strokeWidth="5" />
    {(split ? [1, 2] : [0]).map(half => {
      const x = !half ? 200 : half === 1 ? 137 : 263;
      return <g key={half} transform={`translate(${x} 120)`}>
        {half === packed ? <><path d="M-47-44H47V51H-47Z M-47-17H47 M0-44V51" fill="#f8dcad" stroke="#9a6448" strokeWidth="4" />{served && <path d="M-60-30H60L54 65H-54Z M-24-30V-44Q0-75 24-44V-30" fill="#b68555" stroke="#744834" strokeWidth="4" />}</> : <>
          <rect x={half ? -46 : -95} y="-43" width={half ? 92 : 190} height="100" rx="22" fill="#ecbd79" stroke="#a86739" strokeWidth="7" />
          {cheese && <path d={half ? "M-34-24L35-28L37 33L-30 41Z" : "M-78-24L80-28L84 33L-73 41Z"} fill="#fbd452" stroke="#ba833a" strokeWidth="3" />}
          {tomato && <><circle cx="-17" cy="0" r="23" fill="#bb493c" /><circle cx="19" cy="26" r="21" fill="#cd6651" /></>}
          {served && <path d="M-58-60H-8Q-5-27-23-29Q-24-10-58-11Z" fill="#fff6dd" />}
        </>}
        {split && <text x="0" y="93" textAnchor="middle" fill="#38251c" fontWeight="bold" fontSize="18">{packed ? half === packed ? "ארוז" : "בצלחת" : half}</text>}
      </g>;
    })}
    {served && <path d="M345 34L353 44L373 22" fill="none" stroke="#326a54" strokeWidth="7" strokeLinecap="round" />}
  </svg>;
}

export function CafeShift({ exit }: { exit: () => void }) {
  const run = useVocabularyRun<CafeAction, NonNullable<ReturnType<typeof replayCafe>>>("cafe-shift", replayCafe);
  const { state, send } = run;
  const order = cafeOrders[state.index];
  const end = state.index === cafeOrders.length - 1;
  const feedback = {
    cheese: state.cheese ? "בבקשה בלי גבינה. אפשר להסיר רק אותה." : "חסרה גבינה. שאר המנה נשארת כאן.",
    tomato: state.tomato ? "בבקשה בלי עגבנייה. הגבינה יכולה להישאר." : "חסרה עגבנייה. אפשר להוסיף אותה כאן.",
    split: "אפשר לחלק לשני חצאים שווים.",
    pack: "חצי אחד מחכה לאריזה, והשני נשאר בצלחת.",
    "": "",
  };
  return <VocabularyFrame title="המשמרת בבית הקפה" exit={exit} warning={run.warning} resumed={run.resumed} onHelp={() => send("help")} help={<>
    <p><bdi lang="en">without</bdi> פירושו בלי. <bdi lang="en">half</bdi> הוא אחד משני חלקים שווים.</p>
    {!state.served && <form method="dialog"><button className="secondary" onClick={() => send("show")}>הדגימו את המנה</button></form>}
  </>}>
    <div className="vocabulary-layout">
      <div>
        <Sandwich {...state} />
        {!state.served && <div className="vocabulary-actions">
          <button className="secondary" aria-pressed={state.cheese} onClick={() => send("cheese")}>גבינה</button>
          <button className="secondary" aria-pressed={state.tomato} onClick={() => send("tomato")}>עגבנייה</button>
          {order.split && !state.packed && <button className="secondary" onClick={() => send(state.split ? "join" : "split")}>{state.split ? "לחבר חצאים" : "לחלק לשניים"}</button>}
          {state.split && (state.packed
            ? <button className="secondary" onClick={() => send("unpack")}>לפתוח אריזה</button>
            : <><button className="secondary" onClick={() => send("pack-one")}>לארוז חצי 1</button>
                <button className="secondary" onClick={() => send("pack-two")}>לארוז חצי 2</button></>)}
        </div>}
      </div>
      <div className="vocabulary-task">
        <p>הזמנה {state.index + 1} מתוך {cafeOrders.length}</p>
        <h2>{order.name}</h2>
        <p lang="en" dir="ltr" className="vocabulary-english">{order.request}</p>
        {order.split && !state.served && <p><bdi lang="en">Now:</bdi> בצלחת · <bdi lang="en">Later:</bdi> באריזה</p>}
        <p className="vocabulary-feedback" role="status">{state.served ? order.outcome : feedback[state.feedback]}</p>
        {state.served ? <button onClick={() => end ? run.restart() : send("next")}>{end ? "משמרת חדשה" : "ההזמנה הבאה"}</button>
          : <button onClick={() => send("serve")}>להגיש ל{order.name}</button>}
      </div>
    </div>
  </VocabularyFrame>;
}
