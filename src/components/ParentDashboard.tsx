import { useState } from "react";
import { ResetProgressDialog } from "./ResetProgressDialog";
import { stages } from "../content/chapter";
import {
  allAttempts,
  exportCsv,
  exportJson,
  type GameProgress,
} from "../progress/GameStore";
import {
  accuracy,
  differences,
  rate,
  taskResults,
  type Attempt,
} from "../typing/Learning";
const aidNames = {
  independent: "ללא רמז לתשובה",
  keyboard: "מקלדת עזר",
  hint: "אחרי רמז",
  copy: "לאחר חשיפה / העתקה",
  recall: "שליפה לאחר חשיפה בסשן",
};
function download(text: string, type: string, extension: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `flock-and-key-${new Date().toISOString().slice(0, 10)}.${extension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function stats(attempts: Attempt[]) {
  const typed = attempts.filter((a) => a.mode !== "spelling" && !a.pasted);
  const inserted = typed.reduce((n, a) => n + a.inserted, 0),
    errors = typed.reduce((n, a) => n + a.errors, 0);
  const elapsedMs = typed.reduce((n, a) => n + a.elapsedMs, 0);
  return {
    accuracy: accuracy({ inserted, errors }),
    rate: rate({ inserted, errors, elapsedMs }),
  };
}
export function ParentDashboard({
  progress,
  onBack,
  onReset,
}: {
  progress: GameProgress;
  onBack: () => void;
  onReset: () => boolean;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  function cancelReset() {
    setConfirmReset(false);
    setResetError("");
  }
  function confirm() {
    if (onReset()) {
      setConfirmReset(false);
      setResetError("");
      setResetMessage("ההתקדמות אופסה. אפשר להתחיל הרפתקה חדשה.");
    } else
      setResetError(
        "האיפוס לא נשמר בדפדפן. ההתקדמות לא אופסה. אפשר לבטל ולייצא את הנתונים, או לנסות שוב.",
      );
  }
  const attempts = allAttempts(progress);
  const spelling = progress.sessions
    .flatMap((s) => taskResults(s.attempts))
    .filter((a) => a.mode === "spelling");
  const failed = attempts.filter((a) => !a.correct && !a.skipped && a.answer);
  const patterns = new Map<string, number>();
  for (const a of failed)
    for (const d of differences(a.expected, a.answer)) {
      const key = `${a.mode === "spelling" ? "איות" : "הקלדה"} · ${d.kind}: ${d.expected || "∅"} ← ${d.actual || "∅"}`;
      patterns.set(key, (patterns.get(key) ?? 0) + 1);
    }
  const typing = stats(
    progress.sessions.flatMap((s) => taskResults(s.attempts)),
  );
  return (
    <section className="panel parent" aria-label="מסך הורה">
      <div className="section-title">
        <div>
          <span className="eyebrow">מבט על הדרך</span>
          <h1>התקדמות וטעויות</h1>
        </div>
        <button className="secondary" onClick={onBack}>
          חזרה למשחק
        </button>
      </div>
      <p>
        הנתונים נשמרים בדפדפן הזה בלבד. איות, הקלדה ועבודה בעזרה נמדדים בנפרד.
        תשובות אחרי חשיפת מילה אינן הצלחה עצמאית.
      </p>
      <div className="stats-grid">
        <div>
          <b>
            {
              spelling.filter((a) => a.correct && a.aid === "independent")
                .length
            }
          </b>
          מילים שנכתבו עצמאית · כולל חזרות
        </div>
        <div>
          <b>{typing.accuracy === null ? "—" : typing.accuracy + "%"}</b>דיוק
          הזנה בהקלדה
        </div>
        <div>
          <b>{typing.rate ?? "—"}</b>תווים נכונים לדקת זמן פעיל
        </div>
        <div>
          <b>{progress.earned}</b>נקודות שנצברו אי פעם
        </div>
      </div>
      <div className="actions">
        <button
          onClick={() =>
            download(exportJson(progress), "application/json", "json")
          }
        >
          ייצוא JSON מלא
        </button>
        <button
          className="secondary"
          onClick={() =>
            download(exportCsv(progress), "text/csv;charset=utf-8", "csv")
          }
        >
          ייצוא ניסיונות CSV
        </button>
        <button
          className="reset-button"
          onClick={() => {
            setResetMessage("");
            setConfirmReset(true);
          }}
        >
          איפוס התקדמות
        </button>
      </div>
      {resetMessage && (
        <p className="feedback success" role="status">
          {resetMessage}
        </p>
      )}
      {confirmReset && (
        <ResetProgressDialog
          onCancel={cancelReset}
          onConfirm={confirm}
          error={resetError}
        />
      )}
      <p className="muted">
        הייצוא אינו כולל אפשרות שחזור במשחק. דיוק הזנה = תווים שהוזנו במקום
        הנכון מתוך כלל התווים שהוזנו; מחיקה אינה מעלימה טעות קודמת. הדבקה אינה
        נכללת במדדי קצב ודיוק. הזמן הפעיל אינו כולל הקראה, הפסקה או לשונית
        מוסתרת.
      </p>
      <h2>סשנים קודמים</h2>
      {!progress.sessions.length ? (
        <p>עוד אין סשנים. הנתונים יופיעו אחרי תחילת משחק.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>תחילה</th>
                <th>מצב</th>
                <th>משימות שהושלמו</th>
                <th>איות עצמאי</th>
                <th>דיוק הקלדה</th>
                <th>קצב הקלדה</th>
                <th>דקות משחק</th>
                <th>דקות משימה</th>
                <th>נקודות</th>
              </tr>
            </thead>
            <tbody>
              {[...progress.sessions].reverse().map((s) => {
                const final = taskResults(s.attempts),
                  t = stats(final);
                return (
                  <tr key={s.id}>
                    <td>{new Date(s.startedAt).toLocaleString("he-IL")}</td>
                    <td>
                      {s.status === "active"
                        ? "בתהליך"
                        : s.status === "completed"
                          ? "הושלם"
                          : "הופסק"}
                      {s.standalone ? " · תרגול" : ""}
                    </td>
                    <td>{final.filter((a) => a.correct).length}</td>
                    <td>
                      {
                        final.filter(
                          (a) =>
                            a.mode === "spelling" &&
                            a.correct &&
                            a.aid === "independent",
                        ).length
                      }{" "}
                      / {final.filter((a) => a.mode === "spelling").length}
                    </td>
                    <td>{t.accuracy === null ? "—" : t.accuracy + "%"}</td>
                    <td>{t.rate ?? "—"}</td>
                    <td>{(s.playMs / 60000).toFixed(1)}</td>
                    <td>
                      {(
                        final.reduce((sum, a) => sum + a.elapsedMs, 0) / 60000
                      ).toFixed(1)}
                    </td>
                    <td>{s.attempts.reduce((sum, a) => sum + a.points, 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted">
        סשנים יכולים לכלול תכנים ועזרה שונים. הבדלים בין השורות אינם בהכרח
        שיפור; משוב שיפור במשחק משווה אותה מילה באותו מצב ובתנאי עזרה דומים.
        נתונים חלקיים אינם מבחן שליטה.
      </p>
      <h2>מילים באיות</h2>
      <div className="word-history">
        {[...new Set(spelling.map((a) => a.expected))].map((word) => {
          const list = spelling.filter((a) => a.expected === word);
          const independent = list.filter(
            (a) => a.correct && a.aid === "independent",
          ).length;
          return (
            <div className="word-chip" key={word}>
              <b>{word}</b>
              <span>
                {independent} הצלחות עצמאיות / {list.length} מפגשים
              </span>
              <small>
                אחרון:{" "}
                {list.at(-1)?.skipped
                  ? "התקדמות בלי השלמה"
                  : aidNames[list.at(-1)!.aid]}
              </small>
            </div>
          );
        })}
      </div>
      <h2>דפוסים בתשובות שהוגשו</h2>
      <p className="muted">
        תיאור הבדלים בלבד. ייתכנו כמה דרכים ליישר שתי מילים; הסיווג אינו קובע את
        מקור הטעות. תוספת אהו״י מוצגת כתוספת האות בפועל.
      </p>
      <div className="patterns">
        {[...patterns]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([key, count]) => (
            <span key={key}>
              {key} · {count}
            </span>
          ))}
        {!patterns.size && <p>טרם נשמרו תשובות שגויות.</p>}
      </div>
      <h2>כל הניסיונות שהוגשו</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>משחק</th>
              <th>מילה</th>
              <th>התשובה בפועל</th>
              <th>תוצאה</th>
              <th>עזרה</th>
              <th>הבדלים</th>
            </tr>
          </thead>
          <tbody>
            {[...attempts].reverse().map((a) => (
              <tr key={a.id}>
                <td>{stages.find((s) => s.mode === a.mode)?.title}</td>
                <td>{a.expected}</td>
                <td className="answer-cell">{a.answer || "—"}</td>
                <td>
                  {a.skipped
                    ? "התקדמות בלי השלמה"
                    : a.correct
                      ? "נכון"
                      : "ניסיון נוסף"}
                </td>
                <td>
                  {aidNames[a.aid]}
                  {a.keyboardHelp ? " · מקלדת פתוחה" : ""}
                </td>
                <td>
                  {a.correct || a.skipped
                    ? "—"
                    : differences(a.expected, a.answer)
                        .map(
                          (d) =>
                            `${d.kind} ${d.expected || "∅"} ← ${d.actual || "∅"}`,
                        )
                        .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
