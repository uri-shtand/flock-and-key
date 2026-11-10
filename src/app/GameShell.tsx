import { DadCratePrompt, CrateBackdrop } from "../components/CrateTask";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhaserStage } from "../components/PhaserStage";
import { DialoguePanel } from "../components/DialoguePanel";
import { HandGuide } from "../components/HandGuide";
import { HebrewKeyboard } from "../components/HebrewKeyboard";
import { ParentDashboard } from "../components/ParentDashboard";
import { stages, prizes, wordById, type Mode } from "../content/chapter";
import { AudioPlayer } from "../audio/AudioPlayer";
import type { GameBridge } from "../game/bridge";
import { keyFor, keyboardKeys } from "../typing/KeyboardMap";
import { isCorrectAnswer } from "../typing/TypingEngine";
import {
  accuracy,
  editMetrics,
  previousComparable,
  rate,
  reward,
  taskResults,
  type Attempt,
} from "../typing/Learning";
import {
  activeSession,
  allAttempts,
  buyOrToggle,
  emptyDraft,
  loadGame,
  newSession,
  saveGame,
  resetGame,
  updateSession,
  type Draft,
  type GameProgress,
  type Session,
} from "../progress/GameStore";

type Screen = "home" | "game" | "parent" | "shop";
export function GameShell() {
  const [loaded] = useState(loadGame);
  const [progress, setProgress] = useState<GameProgress>(loaded.progress);
  const [screen, setScreen] = useState<Screen>("home");
  const [warning, setWarning] = useState(loaded.warning);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [physical, setPhysical] = useState("");
  const [audioError, setAudioError] = useState("");
  const bridge = useRef<GameBridge | null>(null);
  const audio = useRef<AudioPlayer | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const compositionBase = useRef("");
  const submitted = useRef(false);
  const session = activeSession(progress);
  const stage = session ? stages[session.stage] : stages[0];
  const task = session?.tasks[session.stage][session.index];
  const draft = session?.draft;
  const word = task?.mode === "spelling" ? wordById(task.wordId) : undefined;
  const isPlaying =
    screen === "game" && session?.phase === "play" && !draft?.done && !paused;
  const connect = useCallback((value: GameBridge | null) => {
    bridge.current = value;
    setReady(Boolean(value));
  }, []);
  const patchDraft = useCallback(
    (patch: Partial<Draft>) =>
      setProgress((p) =>
        updateSession(p, (s) => ({ ...s, draft: { ...s.draft, ...patch } })),
      ),
    [],
  );

  useEffect(() => {
    if (!saveGame(progress))
      setWarning(
        "השמירה אינה זמינה בדפדפן הזה. אפשר להמשיך ולייצא את הנתונים ממסך ההורה.",
      );
  }, [progress]);
  useEffect(() => {
    const player = new AudioPlayer(setSpeaking);
    audio.current = player;
    return () => {
      player.destroy();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    audio.current?.setMusic(
      progress.settings.music && screen !== "parent" && !paused,
    );
  }, [progress.settings.music, screen, paused]);
  useEffect(() => {
    if (!progress.settings.speech) audio.current?.stopSpeech();
  }, [progress.settings.speech]);
  useEffect(() => {
    const handler = () => {
      if (document.hidden) audio.current?.pause();
      else if (!paused && screen !== "parent") audio.current?.resume();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [paused, screen]);
  useEffect(() => {
    if (paused || screen !== "game") audio.current?.stopSpeech();
  }, [paused, screen]);
  useEffect(() => {
    if (!ready) return;
    bridge.current?.send({
      type: "world",
      view: {
        stage: session?.stage ?? 0,
        step: session
          ? session.phase === "clue" || session.phase === "ending"
            ? session.tasks[session.stage].length
            : session.index
          : 0,
        total: session?.tasks[session.stage].length ?? 8,
        equipped: progress.equipped,
        revealed: session?.phase === "ending" || screen === "shop",
      },
    });
  }, [
    ready,
    session?.stage,
    session?.index,
    session?.phase,
    session?.tasks,
    progress.equipped,
    screen,
  ]);
  const playWord = useCallback(() => {
    if (!word || !progress.settings.speech) return;
    setAudioError("");
    audio.current?.speak(word.audio, () =>
      setAudioError(
        "ההקראה לא נטענה. אפשר לנסות שוב, או לבחור ״הצגת המילה״ ולהמשיך בעזרת העתקה.",
      ),
    );
  }, [word, progress.settings.speech]);
  useEffect(() => {
    if (isPlaying && word) playWord();
    return () => audio.current?.stopSpeech();
  }, [
    session?.id,
    session?.stage,
    session?.index,
    session?.phase,
    screen,
    paused,
    playWord,
  ]);
  useEffect(() => {
    submitted.current = false;
    composing.current = false;
    setPhysical("");
    setAudioError("");
    input.current?.focus();
  }, [
    session?.id,
    session?.stage,
    session?.index,
    session?.phase,
    screen,
    paused,
  ]);
  useEffect(() => {
    if (screen !== "game" || paused || session?.status !== "active") return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        delta = now - last;
      last = now;
      if (document.hidden || !document.hasFocus() || delta > 1500) return;
      setProgress((p) =>
        updateSession(p, (s) =>
          s.status === "active"
            ? {
                ...s,
                playMs: s.playMs + delta,
                draft:
                  isPlaying && !speaking && s.phase === "play" && !s.draft.done
                    ? { ...s.draft, elapsedMs: s.draft.elapsedMs + delta }
                    : s.draft,
              }
            : s,
        ),
      );
    }, 500);
    return () => window.clearInterval(timer);
  }, [screen, paused, session?.status, isPlaying, speaking]);
  useEffect(() => {
    const completed = session?.attempts.at(-1);
    if (
      screen !== "game" ||
      paused ||
      !session ||
      session.phase !== "play" ||
      !session.draft.done ||
      !completed?.correct ||
      completed.task !== session.stage * 100 + session.index
    )
      return;
    const timeout = window.setTimeout(
      () => advance(session.id, session.stage, session.index),
      2000,
    );
    return () => window.clearTimeout(timeout);
  }, [
    screen,
    paused,
    session?.id,
    session?.stage,
    session?.index,
    session?.phase,
    session?.draft.done,
    session?.attempts,
  ]);

  function start(mode?: Mode) {
    audio.current?.stopSpeech();
    setProgress((p) => newSession(p, mode));
    setScreen("game");
    setPaused(false);
    audio.current?.resume();
  }
  function resume() {
    setScreen("game");
    setPaused(false);
    audio.current?.resume();
  }
  function leave() {
    audio.current?.stopSpeech();
    setScreen("home");
    setPaused(false);
  }
  function resetProgress() {
    const reset = resetGame(progress);
    if (!reset) return false;
    audio.current?.stopSpeech();
    setProgress(reset);
    setPaused(false);
    setPhysical("");
    setAudioError("");
    setWarning("");
    submitted.current = false;
    composing.current = false;
    return true;
  }
  function warmup() {
    setProgress((p) => updateSession(p, (s) => ({ ...s, phase: "warmup" })));
  }
  function begin() {
    setProgress((p) => {
      const s = activeSession(p);
      if (!s) return p;
      const letters = s.tasks[s.stage]
        .filter((t) => t.mode !== "spelling")
        .flatMap((t) => [...t.expected]);
      const codes = letters
        .map((l) => keyFor(l)?.code)
        .filter((v): v is string => Boolean(v));
      return updateSession(
        { ...p, knownCodes: [...new Set([...p.knownCodes, ...codes])] },
        (x) => ({
          ...x,
          phase: "play",
          exposedWords:
            s.tasks[s.stage][0].mode === "spelling"
              ? x.exposedWords
              : [...new Set([...x.exposedWords, s.tasks[s.stage][0].expected])],
        }),
      );
    });
  }
  function change(value: string, previous?: string) {
    if (!task || !draft || draft.done || paused) return;
    const text = value.slice(0, 100);
    if (composing.current) {
      patchDraft({ input: text });
      return;
    }
    setProgress((p) =>
      updateSession(p, (s) => {
        const t = s.tasks[s.stage][s.index],
          d = s.draft;
        const delta = editMetrics(previous ?? d.input, text, t.expected);
        return {
          ...s,
          draft: {
            ...d,
            input: text,
            inserted: d.inserted + delta.inserted,
            errors: d.errors + delta.errors,
            deleted: d.deleted + delta.deleted,
          },
        };
      }),
    );
  }
  function finish(skipped = false, value?: string) {
    if (
      submitted.current ||
      composing.current ||
      !session ||
      !task ||
      !draft ||
      draft.done ||
      paused
    )
      return;
    const answer = value ?? draft.input;
    if (!skipped && !answer.trim()) {
      patchDraft({ message: "כתבו את המילה, או בקשו עזרה. אין לחץ." });
      return;
    }
    submitted.current = true;
    audio.current?.stopSpeech();
    setProgress((p) => {
      const s = activeSession(p);
      if (!s || s.draft.done) return p;
      const t = s.tasks[s.stage][s.index],
        d = s.draft;
      const correct = !skipped && isCorrectAnswer(answer, t.expected);
      const taskId = s.stage * 100 + s.index;
      const history = allAttempts(p);
      const aid =
        d.hint >= 2 || d.pasted
          ? "copy"
          : d.hint > 0
            ? "hint"
            : t.mode !== "spelling" && (t.mode === "guided" || d.keyboard)
              ? "keyboard"
              : t.mode === "spelling" && s.exposedWords.includes(t.expected)
                ? "recall"
                : "independent";
      const base: Omit<Attempt, "points"> = {
        id: crypto.randomUUID(),
        task: taskId,
        mode: t.mode,
        wordId: t.wordId,
        expected: t.expected,
        answer,
        at: new Date().toISOString(),
        correct,
        skipped,
        aid,
        hint: d.hint,
        pasted: d.pasted,
        keyboardHelp: t.mode === "guided" || d.keyboard,
        elapsedMs: d.elapsedMs,
        inserted: d.inserted,
        errors: d.errors,
        deleted: d.deleted,
        physicalCodes: d.physicalCodes,
        timed: t.mode === "speed" && s.timed,
      };
      const points = reward(
        base,
        s.attempts,
        history.filter((a) => !s.attempts.some((local) => local.id === a.id)),
      );
      const a: Attempt = { ...base, points };
      let message = "עוד ניסיון? אפשר למחוק ולתקן או לבקש עזרה.";
      if (t.mode === "guided" && !correct && !skipped) {
        const next = nextLetter(answer, t.expected);
        message = `אפשר לתקן; חפשו את ${next || "סוף המילה"}.`;
      }
      if (skipped) message = "ממשיכים בסיפור. נשמור את המילה לפעם אחרת.";
      if (correct) {
        message = `כל הכבוד! +${points} פעמונים.`;
        if (
          t.mode === "spelling" &&
          aid === "independent" &&
          !history.some(
            (old) =>
              old.mode === "spelling" &&
              old.expected === t.expected &&
              old.correct &&
              old.aid === "independent",
          )
        )
          message = `זאת הפעם הראשונה שכתבת ״${t.expected}״ נכון בלי רמז! +${points} פעמונים.`;
        else if (t.mode === "spelling" && aid === "recall")
          message = `זכרת איך לכתוב ״${t.expected}״ אחרי שראינו אותה קודם! +${points} פעמונים.`;
        else if (t.mode === "spelling" && aid === "copy")
          message = `השלמת את ״${t.expected}״ בעזרת המילה הכתובה. נפגוש אותה שוב! +${points} פעמונים.`;
        else {
          const prev = previousComparable(
            base,
            history.filter(
              (old) => old.task !== taskId || !s.attempts.includes(old),
            ),
          );
          const before = prev ? rate(prev) : null,
            now = rate(a);
          if (
            t.mode !== "spelling" &&
            prev &&
            now !== null &&
            before !== null &&
            now > before &&
            (accuracy(a) ?? 0) >= (accuracy(prev) ?? 0)
          )
            message += ` הקצב עלה מ־${before} ל־${now} תווים נכונים בדקה, בלי ירידה בדיוק.`;
        }
      }
      return updateSession(
        { ...p, balance: p.balance + points, earned: p.earned + points },
        (x) => ({
          ...x,
          attempts: [...x.attempts, a],
          draft: { ...x.draft, done: correct || skipped, message },
        }),
      );
    });
    if (skipped || isCorrectAnswer(answer, task.expected))
      bridge.current?.send({ type: "celebrate" });
    if (!skipped && !isCorrectAnswer(answer, task.expected))
      submitted.current = false;
  }
  function advance(
    expectedSessionId?: string,
    expectedStage?: number,
    expectedIndex?: number,
  ) {
    audio.current?.stopSpeech();
    setProgress((p) =>
      updateSession(p, (s) => {
        if (
          !s.draft.done ||
          s.phase !== "play" ||
          (expectedSessionId !== undefined &&
            (s.id !== expectedSessionId ||
              s.stage !== expectedStage ||
              s.index !== expectedIndex))
        )
          return s;
        const last = s.index === s.tasks[s.stage].length - 1;
        return {
          ...s,
          index: last ? s.index : s.index + 1,
          phase: last ? "clue" : "play",
          draft: last ? s.draft : emptyDraft(),
          exposedWords:
            !last && s.tasks[s.stage][s.index + 1].mode !== "spelling"
              ? [
                  ...new Set([
                    ...s.exposedWords,
                    s.tasks[s.stage][s.index + 1].expected,
                  ]),
                ]
              : s.exposedWords,
        };
      }),
    );
  }
  function nextStage() {
    setProgress((p) =>
      updateSession(p, (s) => {
        if (s.stage === 3 || s.standalone)
          return {
            ...s,
            phase: "ending",
            status: "completed",
            endedAt: new Date().toISOString(),
          };
        return {
          ...s,
          stage: s.stage + 1,
          index: 0,
          phase: "intro",
          draft: emptyDraft(),
        };
      }),
    );
  }
  function reveal(level: number) {
    setProgress((p) =>
      updateSession(p, (s) => {
        const expected = s.tasks[s.stage][s.index].expected;
        return {
          ...s,
          exposedWords:
            level >= 2
              ? [...new Set([...s.exposedWords, expected])]
              : s.exposedWords,
          draft: {
            ...s.draft,
            hint: level,
            message:
              level >= 2
                ? "אפשר להעתיק את המילה. זה תרגול בעזרה, והוא עוזר להתקדם."
                : "",
          },
        };
      }),
    );
    input.current?.focus();
  }
  function hint() {
    if (draft) reveal(Math.min(2, draft.hint + 1));
  }
  function showWord() {
    reveal(2);
  }
  function setSetting(name: "music" | "speech") {
    setProgress((p) => ({
      ...p,
      settings: { ...p.settings, [name]: !p.settings[name] },
    }));
  }
  const activeResults = session ? taskResults(session.attempts) : [];
  const score = session
    ? session.attempts.reduce((n, a) => n + a.points, 0)
    : 0;
  const next = task && draft ? nextLetter(draft.input, task.expected) : "";
  const clues = session
    ? stages.slice(
        0,
        session.standalone
          ? 0
          : session.stage +
              (session.phase === "clue" || session.phase === "ending" ? 1 : 0),
      )
    : [];

  return (
    <main
      className={
        screen === "game"
          ? `playing${session?.phase === "play" && stage.mode === "guided" ? " crate-game" : ""}`
          : screen === "home"
            ? "home-screen"
            : undefined
      }
    >
      <header className="topbar">
        <button className="brand" onClick={leave}>
          <span className="brand-icon" aria-hidden="true">
            ✦
          </span>
          <span>
            <b dir="ltr">Flock & Key</b>
            <small>תעלומת הכבשים הנעלמות</small>
          </span>
        </button>
        <nav aria-label="כלים">
          <span className="balance" data-testid="balance">
            🔔 {progress.balance}
          </span>
          <button
            className="icon-button"
            aria-pressed={progress.settings.music}
            onClick={() => setSetting("music")}
          >
            מוזיקה {progress.settings.music ? "פועלת" : "כבויה"}
          </button>
          <button
            className="icon-button"
            aria-pressed={progress.settings.speech}
            onClick={() => setSetting("speech")}
          >
            הקראה {progress.settings.speech ? "פועלת" : "כבויה"}
          </button>
          <button
            className="icon-button"
            onClick={() => {
              audio.current?.stopSpeech();
              setScreen("parent");
            }}
          >
            להורים
          </button>
        </nav>
      </header>
      {warning && (
        <p className="warning" role="alert">
          {warning}
        </p>
      )}
      {screen === "parent" ? (
        <ParentDashboard
          progress={progress}
          onBack={() => setScreen("home")}
          onReset={resetProgress}
        />
      ) : (
        <>
          <div className="world-column">
            <section className="world-card">
              <div className="scene-heading">
                <span>
                  {screen === "game"
                    ? `${String((session?.stage ?? 0) + 1).padStart(2, "0")} / ${stage.place}`
                    : "ניו זילנד · בוקר קצת חשוד"}
                </span>
                <span className="status">
                  {ready ? "החווה מוכנה" : "טוענים את החווה…"}
                </span>
              </div>
              {screen === "game" &&
                session?.phase === "play" &&
                task?.mode === "guided" && (
                  <DadCratePrompt word={task.expected} />
                )}
              <PhaserStage onReady={connect} />
              <div className="world-caption">
                <span>
                  {screen === "shop"
                    ? "החווה שלכם, ההומור שלכם"
                    : screen === "game"
                      ? "כל מילה מקרבת אותנו לפתרון"
                      : "ארבעה רמזים. כלב אחד. יותר מדי נצנצים."}
                </span>
                {screen === "game" && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setPaused(!paused);
                      audio.current?.pause();
                    }}
                  >
                    {" "}
                    {paused ? "חזרה למשחק" : "הפסקה"}
                  </button>
                )}
              </div>
            </section>
            {screen === "game" &&
              stage.mode === "guided" &&
              session?.phase !== "ending" && <HandGuide />}
          </div>
          {screen === "home" && (
            <section className="panel home">
              <span className="eyebrow">
                פרק ראשון · הרפתקה של כ־12–15 דקות
              </span>
              <h1>מי חגג בחווה בלילה?</h1>
              <p className="lead">
                שלטים הפוכים, עקבות מנצנצים והזמנה שנרטבה. עזרו לתום ולפיצי
                לגלות מה קרה כאן.
              </p>
              <div className="actions">
                {session?.status === "active" && (
                  <button onClick={resume} disabled={!ready}>
                    ממשיכים מאיפה שעצרנו
                  </button>
                )}
                <button
                  className={session?.status === "active" ? "secondary" : ""}
                  onClick={() => start()}
                  disabled={!ready}
                >
                  {session?.status === "active" ? "פרק חדש" : "יוצאים לחקירה ←"}
                </button>
                <button className="secondary" onClick={() => setScreen("shop")}>
                  משנים את החווה
                </button>
              </div>
              <p className="muted">
                בלי לחץ. עזרה בחינם, אפשר לתקן ואפשר לעצור בכל רגע.
              </p>
              <h2>רק עוד משחקון אחד?</h2>
              <div className="game-menu">
                {stages.map((s, i) => (
                  <button
                    className="game-tile"
                    key={s.mode}
                    onClick={() => start(s.mode)}
                    disabled={!ready}
                  >
                    <span className="tile-number">0{i + 1}</span>
                    <span className="tile-emblem" aria-hidden="true">
                      {["✎", "♧", "✉", "➜"][i]}
                    </span>
                    <b>{s.title}</b>
                    <small>
                      {
                        [
                          "מקשים ואצבעות",
                          "למצוא את המקשים",
                          "לכתוב מתוך הקשבה",
                          "קצב אישי, לבחירתכם",
                        ][i]
                      }
                    </small>
                  </button>
                ))}
              </div>
            </section>
          )}
          {screen === "game" && session && task && draft && (
            <section className="panel play-panel" aria-label={stage.title}>
              <div className="section-title">
                <div>
                  <span className="eyebrow">
                    {session.standalone
                      ? "תרגול חופשי"
                      : `רמז ${session.stage + 1} מתוך 4`}
                  </span>
                  <h1>{stage.title}</h1>
                </div>
                <button className="text-button" onClick={leave}>
                  שמירה ויציאה
                </button>
              </div>
              {paused ? (
                <div className="pause">
                  <h2>פיצי שומר על המקום שלכם.</h2>
                  <p>הזמן הפעיל נעצר. אפשר לנוח.</p>
                  <button onClick={() => setPaused(false)}>ממשיכים</button>
                </div>
              ) : (
                <>
                  {session.phase === "intro" && (
                    <div className="dialogue">
                      <DialoguePanel lines={stage.dialogue} />
                      <div className="mission-brief">
                        <span className="mission-marker" aria-hidden="true">
                          !
                        </span>
                        <div>
                          <h2>{stage.mission.title}</h2>
                          <p>{stage.mission.instruction}</p>
                        </div>
                      </div>
                      {stage.mode === "speed" && (
                        <fieldset>
                          <legend>באיזה קצב?</legend>
                          <label>
                            <input
                              type="radio"
                              name="pace"
                              checked={!session.timed}
                              onChange={() =>
                                setProgress((p) =>
                                  updateSession(p, (s) => ({
                                    ...s,
                                    timed: false,
                                  })),
                                )
                              }
                            />{" "}
                            קצב רגוע
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="pace"
                              checked={session.timed}
                              onChange={() =>
                                setProgress((p) =>
                                  updateSession(p, (s) => ({
                                    ...s,
                                    timed: true,
                                  })),
                                )
                              }
                            />{" "}
                            אתגר קצב אישי
                          </label>
                        </fieldset>
                      )}
                      <button onClick={warmup}>מכירים את המשימה ←</button>
                    </div>
                  )}
                  {session.phase === "warmup" && (
                    <div className="warmup">
                      <h2>
                        {stage.mode === "spelling"
                          ? "הקשיבו, דמיינו, כתבו"
                          : "חימום קצר לפני שיוצאים"}
                      </h2>
                      {stage.mode === "spelling" ? (
                        <>
                          <p>
                            תשמעו מילה בתוך משפט. האיות לא יוצג מראש. Enter בודק
                            את התשובה; הרמזים כאן כשצריך.
                          </p>
                          <p>שתי מילים יחזרו בסוף כדי לראות מה נשאר בזיכרון.</p>
                          {!progress.settings.speech && (
                            <p className="warning">
                              ההקראה כבויה. אפשר להפעיל אותה למעלה, או להיעזר
                              בהצגת המילה כתרגול העתקה.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>
                            המקשים למשימות הקרובות:{" "}
                            <b>
                              {[
                                ...new Set(
                                  session.tasks[session.stage].flatMap((t) => [
                                    ...t.expected,
                                  ]),
                                ),
                              ].join(" · ")}
                            </b>
                          </p>
                          <HebrewKeyboard next={next || "ד"} />
                          <p className="muted">
                            אפשר לנסות להניח את האצבעות כפי שמוצע. אין צורך
                            למהר, ואפשר תמיד לפתוח עזרה.
                          </p>
                        </>
                      )}
                      <button onClick={begin}>מוכנים, מתחילים ←</button>
                    </div>
                  )}
                  {session.phase === "play" && (
                    <>
                      <div className="task-progress">
                        <span>
                          משימה {session.index + 1} /{" "}
                          {session.tasks[session.stage].length}
                        </span>
                        <progress
                          value={session.index + (draft.done ? 1 : 0)}
                          max={session.tasks[session.stage].length}
                        />
                        <span>🔔 {score}</span>
                      </div>
                      {task.mode !== "guided" && (
                        <div
                          className={`task-card ${task.mode === "spelling" ? "envelope" : "sign"}`}
                        >
                          <span className="eyebrow">
                            {task.mode === "spelling"
                              ? "מילה מסתתרת בהזמנה"
                              : "המילה שלכם"}
                          </span>
                          {task.mode === "spelling" ? (
                            <>
                              <h2>איזו מילה שמעתם?</h2>
                              <button
                                className="secondary"
                                onClick={playWord}
                                disabled={
                                  !progress.settings.speech || draft.done
                                }
                              >
                                ◖ השמעת המילה והמשפט
                              </button>
                              {draft.hint === 1 && (
                                <p className="hint">
                                  האות הראשונה: <b>{task.expected[0]}</b>
                                </p>
                              )}
                              {draft.hint >= 2 && (
                                <p
                                  className="target-word"
                                  data-testid="revealed-word"
                                >
                                  {task.expected}
                                </p>
                              )}
                            </>
                          ) : (
                            <p
                              className="target-word"
                              data-testid="target-word"
                            >
                              {task.expected}
                            </p>
                          )}
                        </div>
                      )}
                      {audioError && (
                        <p role="alert" className="warning">
                          {audioError}
                        </p>
                      )}
                      {task.mode === "speed" && (
                        <div className="pace">
                          <span>
                            {session.timed
                              ? `זמן פעיל: ${Math.floor(draft.elapsedMs / 1000)} שניות · אין זמן קצוב`
                              : "קצב רגוע · בלי שעון"}
                          </span>
                          <button
                            className="text-button"
                            onClick={() =>
                              setProgress((p) =>
                                updateSession(p, (s) => ({
                                  ...s,
                                  timed: !s.timed,
                                })),
                              )
                            }
                          >
                            {session.timed
                              ? "לעבור לקצב רגוע"
                              : "לנסות אתגר קצב"}
                          </button>
                        </div>
                      )}
                      <form
                        className={
                          task.mode === "guided" ? "crate-form" : undefined
                        }
                        onSubmit={(event) => {
                          event.preventDefault();
                          finish();
                        }}
                      >
                        <label htmlFor="answer">
                          {task.mode === "spelling"
                            ? "כתבו את המילה ששמעתם"
                            : task.mode === "guided"
                              ? "כתבו על הארגז את המילה שאבא מבקש"
                              : "הקלידו את המילה שמופיעה למעלה"}
                        </label>
                        <div
                          className={
                            task.mode === "guided"
                              ? "crate-workspace"
                              : undefined
                          }
                        >
                          {task.mode === "guided" && <CrateBackdrop />}
                          <div
                            className={`input-row${task.mode === "guided" ? " crate-lettering" : ""}`}
                          >
                            <input
                              ref={input}
                              id="answer"
                              value={draft.input}
                              disabled={draft.done}
                              onChange={(event) => {
                                const value = event.target.value;
                                change(value);
                                if (
                                  task.mode === "speed" &&
                                  !composing.current &&
                                  isCorrectAnswer(value, task.expected)
                                ) {
                                  // Functional state updates apply the edit before recording completion.
                                  finish(false, value);
                                }
                              }}
                              onCompositionStart={() => {
                                compositionBase.current = draft.input;
                                composing.current = true;
                              }}
                              onCompositionEnd={(event) => {
                                composing.current = false;
                                const value = event.currentTarget.value;
                                change(value, compositionBase.current);
                                if (
                                  task.mode === "speed" &&
                                  isCorrectAnswer(value, task.expected)
                                )
                                  finish(false, value);
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.nativeEvent.isComposing ||
                                  composing.current
                                ) {
                                  if (event.key === "Enter")
                                    event.preventDefault();
                                  return;
                                }
                                setPhysical(event.code);
                                if (
                                  keyboardKeys.some(
                                    (k) => k.code === event.code,
                                  )
                                )
                                  setProgress((p) =>
                                    updateSession(p, (s) => ({
                                      ...s,
                                      draft: {
                                        ...s.draft,
                                        physicalCodes: [
                                          ...new Set([
                                            ...s.draft.physicalCodes,
                                            event.code,
                                          ]),
                                        ],
                                      },
                                    })),
                                  );
                              }}
                              onKeyUp={() => setPhysical("")}
                              onPaste={() => patchDraft({ pasted: true })}
                              onDrop={() => patchDraft({ pasted: true })}
                              dir="rtl"
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck={false}
                              maxLength={100}
                              placeholder={
                                task.mode === "guided"
                                  ? "כותבים כאן"
                                  : "כאן כותבים…"
                              }
                            />
                            {task.mode !== "guided" && (
                              <button
                                disabled={draft.done || speaking}
                                type="submit"
                              >
                                בדיקה ←
                              </button>
                            )}
                          </div>
                        </div>
                        {task.mode === "guided" && (
                          <button disabled={draft.done} type="submit">
                            סיימתי לצבוע ←
                          </button>
                        )}
                      </form>
                      <p
                        className={`feedback ${draft.done ? "success" : ""}`}
                        role="status"
                      >
                        {draft.message ||
                          (speaking
                            ? "מקשיבים למילה…"
                            : task.mode === "guided" && next
                              ? `המקש הבא הוא ${next}. אפשר לתקן בכל רגע.`
                              : "קחו את הזמן. אפשר למחוק ולתקן.")}
                      </p>
                      {!draft.done && (
                        <div className="help-actions">
                          {task.mode === "spelling" ? (
                            <>
                              <button
                                className="secondary"
                                onClick={hint}
                                disabled={draft.hint >= 2}
                              >
                                {draft.hint === 0 ? "רמז ראשון" : "הצגת המילה"}
                              </button>
                              {draft.hint < 2 && (
                                <button
                                  className="text-button"
                                  onClick={showWord}
                                >
                                  צריכים להעתיק?
                                </button>
                              )}
                            </>
                          ) : null}
                          {task.mode !== "guided" && (
                            <button
                              className="secondary"
                              onClick={() => patchDraft({ keyboard: true })}
                            >
                              פתיחת מקלדת עזר
                            </button>
                          )}
                          <button
                            className="text-button"
                            onClick={() => finish(true)}
                          >
                            קשה כרגע? ממשיכים בסיפור
                          </button>
                        </div>
                      )}
                      {(task.mode === "guided" || draft.keyboard) && (
                        <HebrewKeyboard
                          next={task.mode === "spelling" ? undefined : next}
                          physical={physical}
                        />
                      )}
                      {draft.done && (
                        <div className="completion-actions">
                          {session.attempts.at(-1)?.correct && (
                            <p className="muted">עוד רגע ממשיכים אוטומטית…</p>
                          )}
                          <button onClick={() => advance()}>
                            {session.attempts.at(-1)?.correct
                              ? "המשך עכשיו ←"
                              : session.index ===
                                  session.tasks[session.stage].length - 1
                                ? "לרמז שמצאנו ←"
                                : "למשימה הבאה ←"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {session.phase === "clue" && (
                    <div className="clue-card">
                      <span className="clue-icon">✦</span>
                      <span className="eyebrow">רמז חדש במחברת הבלש</span>
                      <h2>{stage.clue}</h2>
                      <p>{stage.closing}</p>
                      <button onClick={nextStage}>
                        {session.stage === 3 || session.standalone
                          ? "לסיום ←"
                          : "ממשיכים בעקבות הרמז ←"}
                      </button>
                    </div>
                  )}
                  {session.phase === "ending" && (
                    <div className="ending">
                      <span className="eyebrow">
                        {session.standalone
                          ? "התרגול הושלם"
                          : "התיק נסגר… בינתיים"}
                      </span>
                      <h2>
                        {session.standalone
                          ? "עוד צעד בדרך!"
                          : "הכבשים התאמנו למופע פעמונים!"}
                      </h2>
                      {!session.standalone && (
                        <>
                          <p>פיצי מתיישב מול התזמורת כאילו הוא המנצח.</p>
                          <p>
                            אבא: אז זו לא הייתה מסיבה?
                            <br />
                            תום: זו הייתה חזרה. המסיבה מתחילה כשאתה מביא ארוחת
                            בוקר.
                          </p>
                        </>
                      )}
                      <div className="stats-grid">
                        <div>
                          <b>{score}</b>פעמונים בסשן הזה
                        </div>
                        <div>
                          <b>
                            {
                              activeResults.filter(
                                (a) =>
                                  a.mode === "spelling" &&
                                  a.correct &&
                                  a.aid === "independent",
                              ).length
                            }
                          </b>
                          מילים שנכתבו בלי רמז
                        </div>
                        <div>
                          <b>{activeResults.filter((a) => a.correct).length}</b>
                          משימות שהושלמו
                        </div>
                      </div>
                      <p>באיזה משחקון תרצו לשחק שוב?</p>
                      <div className="actions">
                        <button onClick={() => setScreen("shop")}>
                          משנים את החווה ←
                        </button>
                        <button className="secondary" onClick={leave}>
                          לבחירת משחקון
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!session.standalone &&
                clues.length > 0 &&
                session.phase !== "ending" && (
                  <aside className="clue-notebook">
                    <b>מחברת הבלש</b>
                    {clues.map((s) => (
                      <span key={s.mode}>✦ {s.clue}</span>
                    ))}
                  </aside>
                )}
            </section>
          )}
          {screen === "shop" && (
            <section className="panel">
              <div className="section-title">
                <div>
                  <span className="eyebrow">קצת שטויות, הרבה אופי</span>
                  <h1>החווה שלכם</h1>
                </div>
                <button className="secondary" onClick={leave}>
                  חזרה לחקירה
                </button>
              </div>
              <p>
                פותחים פעם אחת, מפעילים ומחליפים בחינם. עזרה ורמזים לסיפור תמיד
                נשארים בחינם.
              </p>
              <div className="shop-grid">
                {prizes.map((prize) => {
                  const owned = progress.owned.includes(prize.id),
                    on = progress.equipped.includes(prize.id);
                  return (
                    <article
                      className={`prize ${on ? "equipped" : ""}`}
                      key={prize.id}
                    >
                      <span className="prize-icon">{prize.icon}</span>
                      <h2>{prize.title}</h2>
                      <p>{owned ? "כבר שלכם" : `${prize.price} פעמונים`}</p>
                      <button
                        disabled={!owned && progress.balance < prize.price}
                        onClick={() =>
                          setProgress((p) => buyOrToggle(p, prize.id))
                        }
                      >
                        {owned ? (on ? "להוריד" : "להפעיל") : "לפתוח"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
      <footer>סקרנות, כמה מילים וכלב שמאוד רוצה לעזור.</footer>
    </main>
  );
}
function correctPrefix(value: string, expected: string) {
  let i = 0;
  while (i < value.length && value[i] === expected[i]) i++;
  return expected.slice(0, i);
}
function nextLetter(value: string, expected: string) {
  return expected[correctPrefix(value, expected).length] ?? "";
}
