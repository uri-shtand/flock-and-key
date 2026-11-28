import { useState } from "react";
import { stationArt, stationName, stationPrizes, stationShopTabs, stationStages, type StationPrizeId } from "../content/station";
import type { Mode, PrizeId } from "../content/chapter";

const pictureSizes = {
  "station-hall": [1057, 674], "family-lineup": [1250, 833], square: [752, 498], forecourt: [751, 497],
} as const;
type StationPictureArt = keyof typeof pictureSizes;

export function StationPicture({ art = "station-hall", equipped = [], preview, lap = 0, pinWearer = "sister" }: {
  art?: StationPictureArt; equipped?: PrizeId[]; preview?: StationPrizeId; lap?: number; pinWearer?: "brother" | "sister";
}) {
  const [ready, setReady] = useState(false);
  const [width, height] = pictureSizes[art];
  const objects = stationPrizes.filter(item => item.art === art && (item.id === preview || equipped.includes(item.id)));
  return <figure className={`station-picture station-picture-${art}`}>
    <img className="station-picture-base" src={stationArt(art)} width={width} height={height} onLoad={() => setReady(true)} alt={art === "station-hall" ? "אולם התחנה. אבא ליד הדלפק, האחים ליד ארגז 27 ופיצי מתחת לספסל." : `איור מתוך ${stationName}`} />
    {ready && objects.map(item => <img
      key={item.id === "modelTrain" ? `${item.id}:${lap}` : item.id}
      alt="" src={stationArt(`prize-${item.id}`)}
      className={`station-decoration ${item.id === preview ? "station-preview-item" : ""} ${item.id === "modelTrain" && lap > 0 ? "station-model-lap" : ""}`}
      style={{ left: `${item.id === "trainPin" && pinWearer === "sister" ? 45 : item.x}%`, top: `${item.y}%`, width: `${item.width}%` }}
    />)}
    {ready && art === "station-hall" && objects.some(item => item.id === "dogCushion") && <img className="station-bench-arm" src={stationArt("bench-arm")} alt="" />}
  </figure>;
}

const activities = [
  { mode: "guided", detail: "הקלדה על ארגזים", icon: "▤" },
  { mode: "spelling", detail: "איות מהקראה", icon: "✉" },
  { mode: "blind", detail: "רמזים ושלטים", icon: "⌕" },
  { mode: "speed", detail: "בחירת שביל וקצב", icon: "➜" },
  { mode: "songs", title: "חזרה בכיכר", detail: "אנגלית על הבמה", icon: "♫" },
  { mode: "detective", title: "איפה נוגה?", detail: "תיק בלשי בתחנה", icon: "◇" },
] as const;
type Activity = Mode | "songs" | "detective";

export function StationActivities({ start, resumeMode, resume, savedDetective, savedSong, back, vocabulary }: {
  start: (mode: Activity | "gates") => void; resumeMode?: Mode; resume: () => void; savedDetective: boolean; savedSong: boolean; back: () => void; vocabulary: (id: "lost-found" | "cafe-shift" | "fix-it-dad" | "message-relay") => void;
}) {
  return <section className="panel station-activities">
    <div className="section-title"><h1 tabIndex={-1} autoFocus>משחקונים בתחנה</h1><button className="secondary" onClick={back}>לתחנה</button></div>
    <div className="station-activity-grid">
      {activities.map(activity => {
        const title = "title" in activity ? activity.title : stationStages.find(stage => stage.mode === activity.mode)!.title;
        const saved = activity.mode === "detective" ? savedDetective : activity.mode === "songs" ? savedSong : resumeMode === activity.mode;
        return <article key={activity.mode}>
          <span aria-hidden="true">{activity.icon}</span><div><h2>{title}</h2><p>{activity.detail}</p></div>
          <button aria-label={`${saved ? "ממשיכים" : "פותחים"} · ${title}`} onClick={saved && resumeMode === activity.mode ? resume : () => start(activity.mode)}>{saved ? "ממשיכים" : "פותחים"}</button>
        </article>;
      })}
    </div>
    <div className="vocabulary-menu">
      <button className="secondary" onClick={() => vocabulary("lost-found")}>מחלקת האבידות של פיצי</button>
      <button className="secondary" onClick={() => vocabulary("cafe-shift")}>המשמרת בבית הקפה</button>
      <button className="secondary" onClick={() => vocabulary("fix-it-dad")}>הסדנה של אבא</button>
      <button className="secondary" onClick={() => vocabulary("message-relay")}>רדיו התחנה</button>
      <button className="secondary" aria-label="🐑 שומרי השערים (משחקון 5)" onClick={() => start("gates")}>🐑 שומרי השערים</button>
    </div>
  </section>;
}

export function StationShop({ balance, owned, equipped, toggle, back, pinWearer = "sister", setPinWearer }: {
  balance: number; owned: PrizeId[]; equipped: PrizeId[]; toggle: (id: PrizeId) => void; back: () => void;
  pinWearer?: "brother" | "sister"; setPinWearer: (wearer: "brother" | "sister") => void;
}) {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<StationPrizeId | null>(null);
  const [lap, setLap] = useState(0);
  const item = stationPrizes.find(prize => prize.id === selected);
  const art = item?.art ?? (["family-lineup", "station-hall", "forecourt"] as const)[tab];
  return <section className="panel station-shop">
    <div className="section-title"><div><h1>חנות התחנה</h1><b aria-live="polite">🔔 {balance} פעמונים</b></div><button className="secondary" onClick={back}>לתחנה</button></div>
    <div className="station-shop-body">
      <div>
        <nav className="station-shop-tabs" aria-label="קטגוריות בחנות">
          {stationShopTabs.map((title, index) => <button key={title} aria-pressed={tab === index} onClick={() => { setTab(index); setSelected(null); setLap(0); }}>{title}</button>)}
        </nav>
        <div className="station-prize-list">
          {stationPrizes.filter(prize => prize.tab === tab).map(prize => <div className="station-prize" key={prize.id}>
            <button className="secondary" aria-pressed={selected === prize.id} onClick={() => { setSelected(prize.id); setLap(0); }}><img src={stationArt(`prize-${prize.id}`)} alt="" />{prize.title}</button>
            <small>{equipped.includes(prize.id) ? "מוצג בתחנה" : owned.includes(prize.id) ? "כבר שלכם" : `${prize.price} פעמונים`}</small>
          </div>)}
        </div>
      </div>
      <div className="station-shop-preview">
        <StationPicture key={art} art={art} equipped={equipped} preview={selected ?? undefined} lap={lap} pinWearer={pinWearer} />
        <div className="station-purchase-actions" aria-live="polite">
          {item ? <><strong>{item.title}</strong>
            {selected === "modelTrain" && <button className="secondary" onClick={() => setLap(lap + 1)}>סיבוב לרכבת</button>}
            {selected === "trainPin" && <select aria-label="מי עונד את סיכת הרכבת?" value={pinWearer} onChange={event => setPinWearer(event.target.value === "brother" ? "brother" : "sister")}><option value="sister">האחות</option><option value="brother">האח</option></select>}
            <button disabled={!owned.includes(item.id) && balance < item.price} onClick={() => {
              if (equipped.includes(item.id)) setSelected(null);
              toggle(item.id);
            }}>{equipped.includes(item.id) ? "להוריד" : owned.includes(item.id) ? "להציג" : `לקנות · ${item.price} פעמונים`}</button>
          </> : <span>בחרו פריט לתצוגה מקדימה.</span>}
        </div>
      </div>
    </div>
  </section>;
}
