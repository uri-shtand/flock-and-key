import { useEffect, useRef, useState, type ReactNode } from "react";
import { CharacterPortrait } from "../../components/DialoguePanel";
import { questionLabels, songAudio, songFor, songGroups, songLyrics, songs, type SongGroup, type SongId } from "../../content/Rehearsals";
import {
  answerRehearsal, nextRehearsalQuestion, rehearsalDefaults, rehearsalQuestions, startRehearsal,
  type RehearsalRun, type RehearsalSettings,
} from "../../typing/Rehearsal";
import { RehearsalStage } from "./RehearsalStage";
import "./rehearsal.css";

function BarnDialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current!;
    const returnFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
    };
  }, []);

  return <dialog className="rehearsal-dialog" aria-label={title} ref={ref} onCancel={event => { event.preventDefault(); close(); }}>
    <header><h2>{title}</h2><button className="secondary" onClick={close} autoFocus>סוגרים</button></header>
    {children}
  </dialog>;
}

function RehearsalOptions({ settings, apply, copy }: {
  settings: RehearsalSettings; apply: (value: RehearsalSettings) => void; copy: (value: RehearsalSettings) => Promise<void>;
}) {
  const [draft, setDraft] = useState(settings);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  return <div className="rehearsal-options">
    <label>אורך החזרה <select value={draft.parts} onChange={e => setDraft({ ...draft, parts: e.target.value === "2" ? 2 : 3 })}>
      <option value="3">שלושה קטעים</option><option value="2">שני קטעים</option>
    </select></label>
    <label><input type="checkbox" checked={draft.support} onChange={e => setDraft({ ...draft, support: e.target.checked })} /> מציגים רמז בתחילת כל שאלה</label>
    <p>שמירת אפשרויות מתחילה חזרה חדשה לשיר הזה.</p>
    <div className="rehearsal-buttons">
      <button onClick={() => apply(draft)}>מתחילים מחדש עם ההגדרות</button>
      <button className="secondary" onClick={async () => {
        setShowSettings(true);
        try { await copy(draft); setCopied(true); } catch { setCopied(false); }
      }}>העתקת הגדרות</button>
    </div>
    {showSettings && <label>הגדרות {copied && "(הועתקו)"} <input dir="ltr" readOnly value={JSON.stringify(draft)} onFocus={e => e.currentTarget.select()} /></label>}
  </div>;
}

type Sheet = { song: SongId; part: number; word?: string };
type Playback = { song: SongId; start: number; end: number };

function cueIndex(cues: readonly { start: number }[], time: number) {
  const next = cues.findIndex(item => item.start > time);
  return (next === -1 ? cues.length : next) - 1;
}

export function Rehearsal({ runs, save, onExit, station = false }: {
  runs: RehearsalRun[]; save: (run: RehearsalRun) => void; onExit: () => void; station?: boolean;
}) {
  const title = station ? "חזרה בכיכר" : "חזרה באסם";
  const [group, setGroup] = useState<SongGroup>(station ? "station" : "series");
  const [active, setActive] = useState<SongId | null>(() => station && runs.some(run => run.song === "soundcheck") ? "soundcheck" : null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [dialog, setDialog] = useState<"pause" | "options" | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [cue, setCue] = useState(0);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [playing, setPlaying] = useState<Playback | null>(null);
  const [audioIssue, setAudioIssue] = useState(false);
  const [audioLine, setAudioLine] = useState<{ part: number; line: number } | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const playback = useRef<Playback | null>(null);
  const focus = useRef<HTMLHeadingElement>(null);
  const composing = useRef(false);
  const run = runs.find(item => item.song === active);
  const song = run && songFor(run.song);
  const questions = run ? rehearsalQuestions(run) : [];
  const question = run && questions[run.index];
  const result = run && run.results[run.index];
  const variation = song && preview !== null ? song.variations[preview] : undefined;
  const stopped = Boolean(dialog || sheet);

  function stopAudio() {
    playback.current = null;
    audio.current?.pause();
    setPlaying(null);
    setAudioLine(null);
  }

  function playAudio(id: SongId, start = songLyrics(id).start, end = songLyrics(id).end) {
    const element = audio.current;
    if (!element) return;
    if (playing?.song === id && playing.start === start && playing.end === end) {
      stopAudio();
      return;
    }
    const file = songAudio(id);
    if (element.getAttribute("src") !== file) element.setAttribute("src", file);
    const segment = { song: id, start, end };
    playback.current = segment;
    element.currentTime = start;
    setAudioIssue(false);
    setPlaying(segment);
    void element.play().catch(() => {
      if (playback.current === segment) {
        stopAudio();
        setAudioIssue(true);
      }
    });
  }

  useEffect(() => {
    if (!playing) return;
    const segment = playing;
    const { parts, start, end } = songLyrics(segment.song);
    const fullSong = segment.start === start && segment.end === end;
    let lastPart = -1;
    let lastLine = -1;
    let frame = 0;
    function tick() {
      const element = audio.current;
      if (!element || playback.current !== segment) return;
      const time = element.currentTime;
      if (time >= segment.end || element.ended) {
        stopAudio();
        return;
      }
      const part = Math.max(0, cueIndex(parts, time));
      const line = cueIndex(parts[part].lines, time);
      if (part !== lastPart || line !== lastLine) {
        if (fullSong && part !== lastPart) {
          setSheet(current => current?.song === segment.song && current.part !== part ? { song: current.song, part } : current);
        }
        lastPart = part;
        lastLine = line;
        setAudioLine({ part, line });
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = audio.current;
    function pause() {
      stopAudio();
      if (active) setDialog(current => current ?? "pause");
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && active && !document.querySelector("dialog[open]")) pause();
    }
    function onVisibility() { if (document.hidden) pause(); }
    window.addEventListener("blur", pause);
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", pause);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      element?.pause();
    };
  }, [active]);

  useEffect(() => { focus.current?.focus(); }, [active, run?.index, run?.finished]);

  function markHelp() {
    if (run && question && !result && !run.helped) save({ ...run, helped: true });
  }

  function openSheet(id: SongId, part = 0) {
    stopAudio();
    if (id === active) markHelp();
    setSheet({ song: id, part });
  }

  function resetUi() {
    composing.current = false;
    setAnswer("");
    setWrong(false);
    setHint(false);
    setPreview(null);
    setAudioIssue(false);
    stopAudio();
  }

  function enter(id: SongId, current?: RehearsalRun) {
    resetUi();
    if (!current) save(startRehearsal(id));
    setActive(id);
    if (current && !current.finished) setDialog("pause");
  }

  function submit(value: string | null) {
    if (!run || !question || result) return;
    stopAudio();
    const next = answerRehearsal(run, value);
    setWrong(!next.results[run.index]);
    save(next);
    if (next.results[run.index]) setCue(cue => cue + 1);
  }

  function perform(index: number) {
    if (!run) return;
    setPreview(index);
    setCue(cue => cue + 1);
    if (!run.finished) save({ ...run, variations: [...run.variations.filter(item => item !== index), index] });
  }

  const playLabel = (id: SongId, start: number, end: number, label: string) =>
    playing?.song === id && playing.start === start && playing.end === end ? "עוצרים השמעה" : label;
  function partButton(id: SongId, part: number, label: string, className?: string) {
    const { start, end } = songLyrics(id).parts[part];
    return <button className={className} onClick={() => playAudio(id, start, end)}>{playLabel(id, start, end, label)}</button>;
  }
  const notices = <p role="status" className="rehearsal-audio-notice">{audioIssue ? "השמע לא זמין כרגע. אפשר להמשיך עם מילות השיר." : ""}</p>;

  return <section className="rehearsal" aria-label={title}>
    <audio ref={audio} preload="none" onEnded={stopAudio} />
    <header className="rehearsal-heading">
      <div><h1 tabIndex={active ? undefined : -1} ref={active ? undefined : focus}>{title}</h1>
        <p>{song ? <b lang="en" dir="ltr">{song.title}</b> : station ? "בוחרים שיר באנגלית ומביימים את הלהקה בכיכר." : "בוחרים שיר באנגלית ומביימים את להקת החווה."}</p></div>
      <div className="rehearsal-buttons">
        {song && <><button className="secondary" onClick={() => openSheet(song.id, question?.part ?? 0)}>מילות השיר ותרגום</button>
          <button className="secondary" onClick={() => { stopAudio(); setDialog("pause"); }}>הפסקה</button>
          <button className="rehearsal-quiet" onClick={() => { resetUi(); setActive(null); }}>לבחירת שיר</button></>}
        {!song && <>
          {!station && <div className="rehearsal-buttons" role="group" aria-label="קבוצת שירים">
            {songGroups.map(({ id, label }) =>
              <button key={id} className="secondary" aria-pressed={group === id} onClick={() => {
                if (id === group) return;
                stopAudio();
                setAudioIssue(false);
                setGroup(id);
              }}>{label}</button>
            )}
          </div>}
          <button className="rehearsal-quiet" onClick={onExit}>{station ? "לתחנה" : "לחווה"}</button>
        </>}
      </div>
    </header>

    {!song ? <div className="rehearsal-poster">
      <div className="rehearsal-poster-art"><RehearsalStage station={station} command={{ action: "idle", cue, reduced, stopped }} /></div>
      <div className="rehearsal-songs">
        {songs.filter(item => item.group === group).map(item => {
          const existing = runs.find(candidate => candidate.song === item.id);
          return <article className="rehearsal-song" key={item.id} style={{ borderInlineStartColor: item.accent }}>
            <div><h2 lang="en" dir="ltr">{item.title}</h2><p>{item.subtitle}</p></div>
            <div className="rehearsal-buttons">
              <button onClick={() => enter(item.id, existing)}>{existing ? existing.finished ? "להדרן" : "ממשיכים" : "מתחילים"}</button>
              {partButton(item.id, 0, "טעימה", "secondary")}
              <button className="rehearsal-link" onClick={() => openSheet(item.id)}>מילים ותרגום</button>
            </div>
          </article>;
        })}
        {notices}
      </div>
    </div> : <div className="rehearsal-play">
      <section className="rehearsal-task">
        {question && run ? <>
          <div className="rehearsal-task-meta"><span>{questionLabels[question.kind]}</span><span>שאלה {run.index + 1} מתוך {questions.length}</span></div>
          <h2 ref={focus} tabIndex={-1}>{question.prompt}</h2>
          {question.stimulus && <p className="rehearsal-line" dir="ltr" lang="en">{question.stimulus}</p>}
          {partButton(song.id, question.part, "מקשיבים לקטע", "rehearsal-link")}
          {question.options ? <div className="rehearsal-answers">
            {question.options.map(option => {
              const english = /^[A-Za-z]/.test(option);
              return <button key={option} className="secondary" lang={english ? "en" : "he"} dir={english ? "ltr" : "rtl"}
                disabled={Boolean(result)} aria-pressed={answer === option} onClick={() => { setAnswer(option); submit(option); }}>{option}</button>;
            })}
          </div> : <form className="rehearsal-answer-form" onSubmit={event => { event.preventDefault(); if (!composing.current && answer.trim()) submit(answer); }}>
            <input aria-label="תשובה באנגלית" lang="en" dir="ltr" value={answer} maxLength={60} disabled={Boolean(result)}
              autoComplete="off" spellCheck={false} onChange={event => setAnswer(event.target.value)} onPaste={markHelp} onDrop={markHelp}
              onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
              onKeyDown={event => { if (event.key === "Enter" && (composing.current || event.nativeEvent.isComposing)) event.preventDefault(); }} />
            <button type="submit" disabled={!answer.trim() || Boolean(result)}>בדיקה</button>
          </form>}
          {(result || wrong || hint || run.settings.support) && <div className="rehearsal-feedback" aria-live="polite">
            {result ? <p>{result.outcome === "skipped" ? "" : "בדיוק! "}{question.explanation}</p> :
              <><p>{wrong ? "עוד ניסיון? אפשר לחזור לקטע או לפתוח תרגום." : ""}</p>{(hint || run.settings.support) && <p>{question.hint}</p>}</>}
          </div>}
          <div className="rehearsal-buttons rehearsal-task-actions">
            {result ? <button onClick={() => { resetUi(); save(nextRehearsalQuestion(run)); }}>ממשיכים</button> :
              <><button className="secondary" onClick={() => { markHelp(); setHint(true); }}>רמז</button>
                <button className="rehearsal-link" onClick={() => submit(null)}>מגלים וממשיכים</button></>}
          </div>
        </> : run && <>
          <h2 ref={focus} tabIndex={-1}>{run.finished ? "ההדרן שלכם" : "עכשיו אתם מביימים"}</h2>
          <p>{run.finished ? "אפשר לנגן את השיר ולצפות שוב ברגעים שבחרתם." : "בחרו מה יקרה במשפט והעלו אותו על הבמה."}</p>
          <div className="rehearsal-variants rehearsal-buttons" aria-label="בחירות בימוי">
            {(run.finished && run.variations.length ? run.variations.slice(-2) : song.variations.map((_, index) => index)).map(index =>
              <button key={index} className="secondary" aria-pressed={preview === index} onClick={() => perform(index)}>{song.variations[index].choice}</button>)}
          </div>
          {variation && <p className="rehearsal-line" dir="ltr" lang="en">{variation.sentence}</p>}
          <div className="rehearsal-buttons rehearsal-task-actions">
            {run.finished ? <>
              <button onClick={() => playAudio(song.id)}>{playLabel(song.id, songLyrics(song.id).start, songLyrics(song.id).end, "מנגנים את כל השיר")}</button>
              <button className="secondary" onClick={() => { resetUi(); save(startRehearsal(song.id, run.settings)); }}>חזרה חדשה</button>
            </> : <button onClick={() => { save({ ...run, finished: true }); setCue(cue => cue + 1); }}>להדרן</button>}
          </div>
        </>}
        {notices}
      </section>

      <figure className="rehearsal-world">
        <RehearsalStage station={station} command={{ action: variation?.action ?? (result || run?.finished ? "applause" : "idle"), cue, stopped, reduced }} />
        <figcaption aria-live="polite">
          <CharacterPortrait character={variation ? "pitsi" : "tom"} station={station} />
          <span>{variation?.caption ?? (run?.finished ? "פיצי קָד קידה. הקהל בכלל מאחוריו." : station ? "אבא הביא מזוודה. הוא מתעקש שזה כלי הקשה." : "תום מחכה ליד הבמה. פיצי מחכה שהמקל ייפול.")}</span>
        </figcaption>
      </figure>
    </div>}

    {dialog === "pause" && run && <BarnDialog title="החזרה בהפסקה" close={() => setDialog(null)}>
      <p>הלהקה מחכה. החזרה נשמרת במכשיר הזה.</p>
      <div className="rehearsal-buttons">
        <button onClick={() => setDialog(null)}>ממשיכים בחזרה</button>
        <button className="secondary" onClick={() => openSheet(run.song, question?.part ?? 0)}>מילות השיר ותרגום</button>
        <button className="secondary" onClick={() => setDialog("options")}>אפשרויות חזרה</button>
        <button className="rehearsal-link" onClick={() => { resetUi(); setDialog(null); setActive(null); }}>לבחירת שיר</button>
      </div>
    </BarnDialog>}
    {dialog === "options" && run && <BarnDialog title="אפשרויות חזרה" close={() => setDialog("pause")}>
      <RehearsalOptions settings={run.settings} copy={value => navigator.clipboard.writeText(JSON.stringify(value))} apply={value => {
        resetUi();
        save(startRehearsal(run.song, value));
        setDialog(null);
      }} />
    </BarnDialog>}
    {sheet && <BarnDialog title="מילות השיר ותרגום" close={() => { stopAudio(); setSheet(null); }}>
      <div className="rehearsal-sheet-title"><b lang="en" dir="ltr">{songFor(sheet.song).title}</b><span>קטע {sheet.part + 1} מתוך {songLyrics(sheet.song).parts.length}</span></div>
      <div className="rehearsal-lyrics">
        {songLyrics(sheet.song).parts[sheet.part].lines.map(({ english, hebrew, start, needsReview }, line, lines) => {
          const end = lines[line + 1]?.start ?? songLyrics(sheet.song).parts[sheet.part].end;
          return <div key={start} data-current={playing?.song === sheet.song && audioLine?.part === sheet.part && audioLine.line === line}>
            <p lang="en" dir="ltr">{english}</p><p>{hebrew}{needsReview && <small className="rehearsal-review"> נוסח לבדיקה</small>}</p>
            <button className="rehearsal-link" onClick={() => playAudio(sheet.song, start, end)}>{playLabel(sheet.song, start, end, "השמעת שורה")}</button>
          </div>;
        })}
      </div>
      {Boolean(songFor(sheet.song).glossary[sheet.part]?.length) && <div className="rehearsal-glossary">
        <b>מילים מהקטע</b>
        {songFor(sheet.song).glossary[sheet.part]?.map(([word, meaning]) => <span key={word}>
          <button className="rehearsal-link" lang="en" dir="ltr" aria-expanded={sheet.word === word} onClick={() => {
            setSheet({ ...sheet, word: sheet.word === word ? undefined : word });
          }}>{word}</button>
          {sheet.word === word && <span> — {meaning}</span>}
        </span>)}
      </div>}
      <div className="rehearsal-buttons">
        <button className="secondary" disabled={sheet.part === 0} onClick={() => { stopAudio(); setSheet({ song: sheet.song, part: sheet.part - 1 }); }}>לקטע הקודם</button>
        <button className="secondary" disabled={sheet.part + 1 === songLyrics(sheet.song).parts.length} onClick={() => { stopAudio(); setSheet({ song: sheet.song, part: sheet.part + 1 }); }}>לקטע הבא</button>
        {partButton(sheet.song, sheet.part, "השמעת הקטע")}
        <button className="rehearsal-link" onClick={() => playAudio(sheet.song)}>{playLabel(sheet.song, songLyrics(sheet.song).start, songLyrics(sheet.song).end, "השמעת כל השיר")}</button>
      </div>
      {notices}
    </BarnDialog>}
  </section>;
}
