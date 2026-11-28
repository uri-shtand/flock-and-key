import { Rehearsal } from "./songs/Rehearsal";
import { ConceptGallery } from "./ConceptGallery";
import { DetectiveCase } from "./detective/DetectiveCase";
import { crateDifficultyLevels, difficultyLevels } from "../content/difficulty";
import { GatesPrototype } from "./gates/GatesPrototype";
import { DadCratePrompt, CrateBackdrop } from "../components/CrateTask";
import { StationActivities, StationPicture, StationShop } from "./StationHub";
import { courierRoutes, spellingFromStation, stationGermanName, stationName, stationStages, trail, type CourierRoute } from "../content/station";
import "./station.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhaserStage } from "../components/PhaserStage";
import { DialoguePanel } from "../components/DialoguePanel";
import { HebrewKeyboard } from "../components/HebrewKeyboard";
import { ParentDashboard } from "../components/ParentDashboard";
import { stages, availableStages, nextAvailableStage, prizes, wordById, type Mode } from "../content/chapter";
import { AudioPlayer } from "../audio/AudioPlayer";
import { musicTracks } from "../audio/Music";
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
  courierPace,
  loadGame,
  newSession,
  saveGame,
  resetGame,
  selectDifficulty,
  selectCourierRoute,
  recordStageCompletion,
  updateSession,
  type Draft,
  type GameProgress,
  type Session,
} from "../progress/GameStore";
import { caseState } from "../typing/DetectiveCase";
import { adventureContent } from "../content/stationCases";

import { LostFound } from "./vocabulary/LostFound";

import { CafeShift } from "./vocabulary/CafeShift";

import { FixItDad } from "./vocabulary/FixItDad";

import { MessageRelay } from "./vocabulary/MessageRelay";

import { WordDetectives } from "./vocabulary/WordDetectives";

type Screen = "word-detectives" | "message-relay" | "fix-it-dad" | "cafe-shift" | "lost-found" | "home" | "activities" | "game" | "parent" | "shop" | "gates" | "detective" | "parcel" | "songs" | "gallery";
const prizesPerPage = 5;
const versionDate = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date(__VERSION_TIMESTAMP__));

function resumeDescription(session: Session) {
  const phase = session.phase === "play"
    ? `מילה ${session.index + 1} מתוך ${session.tasks[session.stage].length}`
    : { intro: "פתיחה", warmup: "הכנה", clue: "הרמז שמצאנו", ending: "סיום" }[session.phase];
  return `${stages[session.stage].title} · ${phase}`;
}

export function GameShell() {
  const [station] = useState(() => new URLSearchParams(location.search).get("edition") !== "farm");
  const edition = station ? "station" : undefined;
  const [loaded] = useState(loadGame);
  const [progress, setProgress] = useState<GameProgress>(loaded.progress);
  const [screen, setScreen] = useState<Screen>("home");
  const [freshParcel, setFreshParcel] = useState(false);
  const [shopPage, setShopPage] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [warning, setWarning] = useState(loaded.warning);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [trackTitle, setTrackTitle] = useState(musicTracks[0].title);
  const [physical, setPhysical] = useState("");
  const [dadReaction, setDadReaction] = useState("");
  const [audioError, setAudioError] = useState("");
  const [trailFeedback, setTrailFeedback] = useState("");
  const bridge = useRef<GameBridge | null>(null);
  const audio = useRef<AudioPlayer | null>(null);
  const restartDialog = useRef<HTMLDialogElement>(null);
  const homeFocus = useRef<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const compositionBase = useRef("");
  const submitted = useRef(false);
  const session = activeSession(progress);
  const chapterSave = progress.sessions.find((s) => s.edition === edition && s.status === "active" && !s.standalone);
  const standaloneSave = progress.sessions.find((s) => s.edition === edition && s.status === "active" && s.standalone);
  const parcelRun = [...(progress.detective ?? [])].reverse().find(run => run.version === 4);
  const parcelPlace = screen === "home" && parcelRun ? caseState(parcelRun).place : undefined;
  const resumeOptions = [chapterSave, standaloneSave].filter(
    (s): s is Session => Boolean(s && (station || !stages[s.stage].hiddenReason)),
  );
  const resumeSave = resumeOptions.find((s) => s.id === progress.currentId) ?? resumeOptions[0];
  const otherSave = resumeOptions.find((s) => s.id !== resumeSave?.id);
  const gameStages = station ? stationStages : stages;
  const stage = gameStages[session?.stage ?? 0];
  const task = session?.tasks[session.stage][session.index];
  const trace = station && task?.mode === "blind" ? trail.find(item => item.word === task.expected) : undefined;
  const draft = session?.draft;
  const word = task?.mode === "spelling" ? wordById(task.wordId) : undefined;
  const isPlaying =
    screen === "game" && session?.phase === "play" && !draft?.done && !paused;
  useEffect(() => setToolsOpen(false), [screen]);
  useEffect(() => setTrailFeedback(""), [screen, session?.id, session?.index]);
  useEffect(() => {
    if (screen !== "home" || !homeFocus.current) return;
    document.getElementById(homeFocus.current)?.focus();
    homeFocus.current = null;
  }, [screen]);
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
    const player = new AudioPlayer(setSpeaking, setTrackTitle);
    audio.current = player;
    return () => {
      player.destroy();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    if (screen === "game" && session) {
      audio.current?.beginStage(`${session.id}:${session.stage}`);
    }
  }, [screen, session?.id, session?.stage]);
  useEffect(() => {
    const handler = () => {
      if (document.hidden) audio.current?.pause();
      else audio.current?.setMusic(
        progress.settings.music && screen !== "parent" && screen !== "songs" && !paused,
      );
    };
    handler();
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [progress.settings.music, paused, screen]);
  useEffect(() => {
    if (paused || screen !== "game") audio.current?.stopSpeech();
  }, [paused, screen]);
  useEffect(() => {
    if (!ready) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => bridge.current?.send({ type: "motion", paused, reduced: motion.matches });
    syncMotion();
    motion.addEventListener("change", syncMotion);
    return () => motion.removeEventListener("change", syncMotion);
  }, [ready, paused]);
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
        route: station ? session?.route : undefined,
        labels: station && session?.stage === 0 ? session.tasks[0].map(task => task.expected) : undefined,
        revealed: session?.phase === "ending" || screen === "shop",
      },
    });
  }, [
    ready,
    session?.stage,
    session?.index,
    session?.phase,
    session?.tasks,
    session?.route,
    progress.equipped,
    screen,
    station,
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
  }, [session?.id, session?.stage, session?.index, isPlaying, playWord]);
  useEffect(() => {
    if (screen === "game" && session?.phase === "play" && task?.mode === "spelling" &&
        !draft?.done && !progress.settings.speech && draft?.hint !== 2) {
      setProgress((p) => updateSession(p, (s) => ({
        ...s,
        exposedWords: [...new Set([...s.exposedWords, task.expected])],
        draft: { ...s.draft, hint: 2 },
      })));
    }
  }, [screen, session?.phase, task, draft?.done, draft?.hint, progress.settings.speech]);
  useEffect(() => {
    submitted.current = false;
    composing.current = false;
    setPhysical("");
    setAudioError("");
    // Touch players open their own software keyboard when they are ready.
    if (window.matchMedia("(pointer: fine)").matches) input.current?.focus();
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
    if (!station && mode && stages.find((stage) => stage.mode === mode)?.hiddenReason) return;
    audio.current?.stopSpeech();
    setProgress((p) => newSession(p, mode, edition));
    setScreen("game");
    setPaused(false);
    audio.current?.resume();
  }
  function resume(saved: Session) {
    setProgress((p) => ({ ...p, currentId: saved.id }));
    setScreen("game");
    setPaused(false);
    audio.current?.resume();
  }
  function leave() {
    if (station && screen !== "home") homeFocus.current = screen === "gallery" ? "station-gallery-button" : screen === "shop" ? "station-shop-button" : screen === "parcel" ? "station-story-button" : "station-activities-button";
    setDadReaction("");
    audio.current?.stopSpeech();
    setScreen("home");
    setPaused(false);
  }
  function openActivity(mode: Mode | "songs" | "detective" | "gates") {
    if (mode === "songs" || mode === "detective" || mode === "gates") {
      audio.current?.stopSpeech();
      setScreen(mode);
    } else start(mode);
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
    if (trace) setTrailFeedback("");
    const correct = !skipped && isCorrectAnswer(answer, task.expected);
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
      return recordStageCompletion(updateSession(
        { ...p, balance: p.balance + points, earned: p.earned + points },
        (x) => ({
          ...x,
          attempts: [...x.attempts, a],
          draft: { ...x.draft, done: correct || skipped, message },
        }),
      ));
    });
    if (correct && task.mode === "guided") setDadReaction(`${session.id}:${session.index}`);
    if (skipped || correct)
      bridge.current?.send({ type: "celebrate" });
    if (!skipped && !correct)
      submitted.current = false;
  }
  function advance(
    expectedSessionId?: string,
    expectedStage?: number,
    expectedIndex?: number,
  ) {
    audio.current?.stopSpeech();
    setProgress((p) =>
      recordStageCompletion(updateSession(p, (s) => {
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
      })),
    );
  }
  function nextStage() {
    setProgress((p) =>
      updateSession(p, (s) => {
        const nextStage = nextAvailableStage(s.stage);
        if (nextStage === -1 || s.standalone)
          return {
            ...s,
            phase: "ending",
            status: "completed",
            endedAt: new Date().toISOString(),
          };
        return {
          ...s,
          stage: nextStage,
          difficulty: s.stageDifficulties?.[nextStage] ?? s.difficulty,
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
    const enabled = !progress.settings[name];
    if (name === "music") {
      audio.current?.setMusic(enabled && !paused && screen !== "parent" && !document.hidden);
    } else if (!enabled) {
      audio.current?.stopSpeech();
    }
    setProgress((p) => ({
      ...p,
      settings: { ...p.settings, [name]: enabled },
    }));
  }
  const activeResults = session ? taskResults(session.attempts) : [];
  const deliveryPace = session?.phase === "ending" ? courierPace(session, progress.sessions) : null;
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
      ).filter((stage) => !stage.hiddenReason)
    : [];

  return (
    <main
      onClick={() => audio.current?.resume()}
      className={
        `${station ? "station-shell " : ""}${screen === "game"
          ? `playing phase-${session?.phase}${session?.phase === "play" && stage.mode === "guided" ? " crate-game" : ""}`
          : screen === "home"
            ? "home-screen"
            : (screen === "lost-found" || screen === "cafe-shift" || screen === "fix-it-dad" || screen === "message-relay" || screen === "word-detectives") ? "vocabulary-screen" : screen === "gallery" ? "concept-gallery-screen" : screen === "shop" ? "shop-screen" : screen === "gates" ? "gates-screen" : screen === "detective" || screen === "parcel" ? "detective-screen" : screen === "songs" ? "rehearsal-screen" : screen === "activities" ? "station-activities-screen" : ""}`
      }
    >
      <header className="topbar">
        <button className="brand" onClick={leave}>
          <span className="brand-icon" aria-hidden="true">
            ✦
          </span>
          <span>
            <b dir="ltr">Flock & Key</b>
            <small>{station ? <bdi lang="de">{stationGermanName}</bdi> : "תעלומת הכבשים הנעלמות"}</small>
          </span>
        </button>
        <button className="icon-button mobile-tools-toggle" aria-expanded={toolsOpen} aria-controls="game-tools" onClick={() => setToolsOpen((open) => !open)}>
          {toolsOpen ? "סגירת כלים ✕" : "כלים וצלילים ☰"}
        </button>
        <nav id="game-tools" className={toolsOpen ? "tools-open" : undefined} aria-label="כלים">
          <span className="balance" data-testid="balance">
            🔔 {progress.balance}
          </span>
          {screen !== "songs" && <>
            <button
              className="icon-button"
              aria-pressed={progress.settings.music}
              onClick={() => setSetting("music")}
            >
              מוזיקה {progress.settings.music ? "פועלת" : "כבויה"}
            </button>
            <button className="icon-button track-button" aria-label="מנגינה אחרת" aria-describedby="track-title" onClick={() => audio.current?.nextTrack()}>
              מנגינה אחרת <small id="track-title" aria-live="polite">{trackTitle}</small>
            </button>
            <button
              className="icon-button"
              aria-pressed={progress.settings.speech}
              onClick={() => setSetting("speech")}
            >
              הקראה {progress.settings.speech ? "פועלת" : "כבויה"}
            </button>
          </>}
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
      {screen === "word-detectives" ? (
        <WordDetectives exit={() => setScreen("activities")} />
      ) : screen === "message-relay" ? (
        <MessageRelay exit={() => setScreen("activities")} />
      ) : screen === "fix-it-dad" ? (
        <FixItDad exit={() => setScreen("activities")} />
      ) : screen === "cafe-shift" ? (
        <CafeShift exit={() => setScreen("activities")} />
      ) : screen === "lost-found" ? (
        <LostFound exit={() => setScreen("activities")} />
      ) : screen === "gallery" ? (
        <ConceptGallery onExit={leave} />
      ) : screen === "songs" ? (
        <Rehearsal runs={progress.rehearsals ?? []} save={run => setProgress(previous => ({
          ...previous, rehearsals: [...(previous.rehearsals ?? []).filter(item => item.song !== run.song), run],
        }))} onExit={leave} station={station} />
      ) : screen === "detective" || screen === "parcel" ? (
        <DetectiveCase key={screen} edition={station ? screen === "parcel" ? 4 : 3 : 2} fresh={screen === "parcel" && freshParcel} runs={progress.detective ?? []} onChange={(run) => setProgress(p => ({ ...p, detective: [...(p.detective ?? []).filter(r => r.id !== run.id), run] }))} onExit={leave} />
      ) : screen === "gates" ? (
        <GatesPrototype onExit={leave} />
      ) : screen === "parent" ? (
        <ParentDashboard
          progress={progress}
          onBack={() => setScreen("home")}
          onReset={resetProgress}
        />
      ) : station && screen === "home" ? (
        <>
          <div className="station-home-art"><StationPicture equipped={progress.equipped} /></div>
          <section className="panel home station-home">
            <h1>{stationName}</h1>
            <p className="lead">חבילה הגיעה לכתובת ישנה. למה אותו שם מופיע בתצלום חדש?</p>
            <div className="station-primary-actions">
              <button id="station-story-button" onClick={() => { setFreshParcel(false); setScreen("parcel"); }}>{parcelPlace === "ending" ? "לתיק החבילה" : parcelRun ? "ממשיכים בחקירה" : "יוצאים לחקירה"}</button>
              <button id="station-activities-button" className="secondary" onClick={() => setScreen("activities")}>משחקונים</button>
              <button id="station-shop-button" className="secondary" onClick={() => setScreen("shop")}>חנות התחנה</button>
            </div>
            {parcelPlace && <div className="resume-options">
              <p className="muted">פרק ראשון · {parcelPlace === "ending" ? "התיק נפתר" : adventureContent(4).places[parcelPlace]?.label}</p>
              <button className="text-button" onClick={() => restartDialog.current?.showModal()}>פרק חדש</button>
              <dialog ref={restartDialog} className="reset-dialog" aria-label="להתחיל את החקירה מחדש?">
                <h2>להתחיל את החקירה מחדש?</h2><p>תיפתח חקירה חדשה. החקירה הקודמת תישאר בהיסטוריה.</p>
                <div className="actions"><button autoFocus className="secondary" onClick={() => restartDialog.current?.close()}>ביטול</button><button onClick={() => { restartDialog.current?.close(); setFreshParcel(true); setScreen("parcel"); }}>מתחילים פרק חדש</button></div>
              </dialog>
            </div>}
            {standaloneSave && <button className="text-button" onClick={() => resume(standaloneSave)}>ממשיכים · {stationStages[standaloneSave.stage].title} · {standaloneSave.phase === "play" ? `משימה ${standaloneSave.index + 1}` : "הכנה"}</button>}
            <button id="station-gallery-button" className="text-button" onClick={() => setScreen("gallery")}>גלריית קונספט ארט</button>
            <p><a className="station-legacy" href="?edition=farm">לחווה הקודמת ולשמירות שלה</a></p>
          </section>
        </>
      ) : station && screen === "activities" ? (
        <StationActivities vocabulary={setScreen} start={openActivity} resumeMode={standaloneSave && stationStages[standaloneSave.stage].mode}
          resume={() => { if (standaloneSave) resume(standaloneSave); }} savedDetective={Boolean(progress.detective?.some(run => run.version === 3))}
          savedSong={Boolean(progress.rehearsals?.some(run => run.song === "soundcheck"))} back={leave} />
      ) : station && screen === "shop" ? (
        <StationShop balance={progress.balance} owned={progress.owned} equipped={progress.equipped} back={leave} toggle={id => setProgress(p => buyOrToggle(p, id))}
          pinWearer={progress.trainPinWearer} setPinWearer={trainPinWearer => setProgress(p => ({ ...p, trainPinWearer }))} />
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
                {!ready && <span className="status">{station ? "טוענים את התחנה…" : "טוענים את החווה…"}</span>}
              </div>
              {screen === "game" &&
                session?.phase === "play" &&
                task?.mode === "guided" && (
                  <DadCratePrompt
                    word={task.expected}
                    celebrating={dadReaction === `${session.id}:${session.index}`}
                    paused={paused}
                    station={station}
                  />
                )}
              <PhaserStage onReady={connect} station={station} />
              <div className="world-caption">
                <span>
                  {screen === "shop"
                    ? "החווה שלכם, ההומור שלכם"
                    : screen === "game"
                      ? station ? stage.place : "כל מילה מקרבת אותנו לפתרון"
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
            {screen === "game" && session?.phase === "intro" && (
              <div className="mission-brief">
                <span className="mission-marker" aria-hidden="true">
                  !
                </span>
                <div>
                  <h2>{stage.mission.title}</h2>
                  <p>{stage.mission.instruction}</p>
                </div>
              </div>
            )}
            {screen === "game" && session?.phase === "warmup" && (
              <div className="preparation-help">
                {stage.mode === "spelling" ? (
                  <>
                    <p>
                      {progress.settings.speech
                        ? "תשמעו מילה בתוך משפט. Enter בודק את התשובה, ואפשר לבקש רמז."
                        : station ? "ההקראה כבויה. המילה תופיע על הגלויה ואפשר להעתיק אותה." : "ההקראה כבויה. המילה תופיע על המעטפה ואפשר להעתיק אותה. Enter בודק את התשובה."}
                    </p>
                    <p>שתי מילים יחזרו בסוף הסיבוב.</p>
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
                    {stage.mode === "guided" && (
                      <p>מילים ארוכות שוות יותר פעמונים. 80% הצלחה בניסיון הראשון בלי רמז או העתקה יעלו את הצעת הרמה בפעם הבאה.</p>
                    )}
                  </>
                )}
                {stage.mode === "speed" && !station && (
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
              </div>
            )}
            {screen === "game" && session?.phase === "play" && task && draft &&
              (task.mode === "guided" || draft.keyboard) && (
                <HebrewKeyboard
                  next={task.mode === "spelling" ? undefined : next}
                  physical={physical}
                  showHands={task.mode === "guided"}
                />
              )}
            {screen === "game" && session && !session.standalone &&
              clues.length > 0 &&
              (session.phase === "play" || session.phase === "clue") && (
                <aside className="clue-notebook">
                  <b>מחברת הבלש</b>
                  {clues.map((s) => (
                    <span key={s.mode}>✦ {s.clue}</span>
                  ))}
                </aside>
              )}
          </div>
          {screen === "home" && (
            <section className="panel home">
              <span className="eyebrow">
                פרק ראשון · תעלומה בשני משחקונים
              </span>
              <h1>מי חגג בחווה בלילה?</h1>
              <a className="station-legacy" href="?">חזרה ל{stationName}</a>
              <p className="lead">
                שלטים הפוכים, עקבות מנצנצים והזמנה שנרטבה. עזרו לתום ולפיצי
                לגלות מה קרה כאן.
              </p>
              <div className="actions">
                {resumeSave && (
                  <button onClick={() => resume(resumeSave)} disabled={!ready} aria-describedby="resume-place">
                    ממשיכים מאיפה שעצרנו
                  </button>
                )}
                <button
                  className={resumeSave ? "secondary" : ""}
                  onClick={() => chapterSave ? restartDialog.current?.showModal() : start()}
                  disabled={!ready}
                >
                  {resumeSave || chapterSave ? "פרק חדש" : "יוצאים לחקירה ←"}
                </button>
                <button className="secondary" onClick={() => setScreen("shop")}>
                  משנים את החווה
                </button>
              </div>
              {resumeSave ? (
                <div className="resume-options">
                  <p className="muted" id="resume-place">
                    {resumeSave.standalone ? "משחקון שמור" : "פרק שמור"} · {resumeDescription(resumeSave)}
                  </p>
                  {otherSave && (
                    <button className="text-button" disabled={!ready} onClick={() => resume(otherSave)}>
                      {otherSave.standalone ? "להמשיך במשחקון השמור" : "להמשיך בפרק השמור"}
                    </button>
                  )}
                </div>
              ) : <p className="muted">בלי לחץ. עזרה בחינם, אפשר לתקן ואפשר לעצור בכל רגע.</p>}
              {session?.status === "active" && stages[session.stage].hiddenReason && <p className="muted">המשחקון ששמרתם נח בינתיים לקראת שיפור. ההתקדמות נשמרה.</p>}
              <dialog ref={restartDialog} className="reset-dialog" aria-labelledby="restart-title" aria-describedby="restart-description">
                <h2 id="restart-title">להתחיל את הפרק מחדש?</h2>
                <p id="restart-description">הפרק החדש יחליף את נקודת ההמשך בפרק השמור. הפעמונים והפרסים שכבר אספתם נשארים אצלכם.</p>
                <div className="actions">
                  <button className="secondary" autoFocus onClick={() => restartDialog.current?.close()}>ביטול</button>
                  <button onClick={() => { restartDialog.current?.close(); start(); }}>מתחילים פרק חדש</button>
                </div>
              </dialog>
              <div className="game-menu-heading">
                <h2>משחקונים</h2>
                <button onClick={() => { audio.current?.stopSpeech(); setScreen("songs"); }}>♫ חזרה באסם</button>
                <button onClick={() => setScreen("detective")}>🔎 תיק בלשי קטן</button>
                <button aria-label="🐑 שומרי השערים (משחקון 5)" onClick={() => setScreen("gates")}>🐑 שומרי השערים</button>
              </div>
              <div className="game-menu">
                {stages.map((s, i) => !s.hiddenReason && (
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
                      : `רמז ${availableStages.indexOf(stage) + 1} מתוך ${availableStages.length}`}
                  </span>
                  <h1>{stage.title}</h1>
                  {session.phase !== "intro" && session.phase !== "warmup" && <span className="session-level">רמה {session.difficulty}</span>}
                </div>
                <button className="text-button" aria-label="שמירה ויציאה" onClick={leave}>
                  <span className="desktop-exit-label">שמירה ויציאה</span><span className="mobile-exit-label">יציאה</span>
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
                      <DialoguePanel lines={stage.dialogue} station={station} />
                      <button onClick={warmup}>מכירים את המשימה ←</button>
                    </div>
                  )}
                  {session.phase === "warmup" && (
                    <div className="warmup">
                      <h2>
                        {stage.mode === "spelling" && progress.settings.speech
                          ? "הקשיבו, דמיינו, כתבו"
                          : "חימום קצר לפני שיוצאים"}
                      </h2>
                      <fieldset className={stage.mode === "guided" ? "difficulty-picker crate-difficulty" : "difficulty-picker"}>
                        <legend>באיזו רמה משחקים?</legend>
                        <div className="difficulty-options">
                          {(stage.mode === "guided" ? crateDifficultyLevels : difficultyLevels).map(({ level, title, description }) => (
                            <label key={level}>
                              <input
                                type="radio"
                                name="difficulty"
                                value={level}
                                checked={session.difficulty === level}
                                onChange={() => setProgress((p) => selectDifficulty(p, level))}
                              />
                              <span>
                                <b>{level} · {title}</b>
                                <small>{description}</small>
                              </span>
                            </label>
                          ))}
                        </div>
                        <p>הצעת המשחק: רמה {progress.recommendations?.[stage.mode] ?? 1}. אפשר לבחור כל רמה.</p>
                        {stage.mode !== "guided" && !station && <p>הבחירה קובעת את המילים לסיבוב שעומד להתחיל. 80% הצלחה בניסיון הראשון בלי רמז או העתקה יעלו את ההצעה לפעם הבאה.{stage.mode === "spelling" && " מילות הזיכרון החוזרות לא נספרות."}</p>}
                      </fieldset>
                      {station && stage.mode === "speed" && <>
                        <div className="station-route-options" role="group" aria-label="דרך לכיכר">
                          {(Object.keys(courierRoutes) as CourierRoute[]).map(route => <button className="secondary" key={route} aria-pressed={session.route === route} onClick={() => setProgress(p => selectCourierRoute(p, route))}>{courierRoutes[route]}</button>)}
                        </div>
                        <div className="station-route-options" role="group" aria-label="קצב השליחות">
                          <button className="secondary" aria-pressed={!session.timed} onClick={() => setProgress(p => updateSession(p, s => ({ ...s, timed: false })))}>קצב רגוע</button>
                          <button className="secondary" aria-pressed={session.timed} onClick={() => setProgress(p => updateSession(p, s => ({ ...s, timed: true })))}>אתגר קצב אישי</button>
                        </div>
                      </>}
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
                              ? station ? "מילה חסרה בגלויה" : "מילה מסתתרת בהזמנה"
                              : task.mode === "speed" && station ? courierRoutes[session.route ?? "orchard"] : trace ? "לאן מוביל הרמז?" : "המילה שלכם"}
                          </span>
                          {task.mode === "spelling" ? (
                            <>
                              {station && word && <p className="station-postcard-context">{spellingFromStation(word.sentence, task.expected)}</p>}
                              {draft.hint >= 2 ? (
                                <p className="target-word" data-testid="revealed-word">{task.expected}</p>
                              ) : draft.hint === 1 ? (
                                <h2 className="hint">האות הראשונה: <b>{task.expected[0]}</b></h2>
                              ) : <h2>איזו מילה שמעתם?</h2>}
                              {progress.settings.speech && !draft.done && (
                                <button
                                  className="secondary"
                                  onClick={speaking ? () => audio.current?.stopSpeech() : playWord}
                                >
                                  {speaking ? "דילוג על ההקראה" : "◖ השמעת המילה והמשפט"}
                                </button>
                              )}
                            </>
                          ) : trace ? <div className="station-trail">
                            <p>{trace.clue}</p>
                            <div className="station-route-options" role="group" aria-label="מקומות לבדיקה">
                              {(session.index % 2 ? [trace.other, trace.word] : [trace.word, trace.other]).map(place => <button className="secondary target-word" key={place} disabled={draft.done} onClick={() => {
                                if (place === trace.word) { setTrailFeedback("זה המקום. הקלידו את השם שלו כדי להתקדם."); input.current?.focus(); }
                                else setTrailFeedback("פיצי בדק שם. הרמז מצביע על מקום אחר. אפשר לנסות שוב.");
                              }}>{place}</button>)}
                            </div>
                          </div> : (
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
                          {!station && <button
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
                          </button>}
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
                            ? draft.hint >= 2 ? station ? "העתיקו את המילה מהגלויה" : "העתיקו את המילה מהמעטפה" : "כתבו את המילה ששמעתם"
                            : task.mode === "guided"
                              ? "כתבו על הארגז את המילה שאבא מבקש"
                              : trace ? "הקלידו את שם המקום שמתאים לרמז" : "הקלידו את המילה שמופיעה למעלה"}
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
                            className={`input-row${task.mode === "guided" ? " crate-lettering" : ""}${task.expected.length > 6 ? " long-word" : ""}`}
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
                              autoCapitalize="off"
                              enterKeyHint="done"
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
                                disabled={draft.done}
                                type="submit"
                              >
                                בדיקה ←
                              </button>
                            )}
                          </div>
                        </div>
                        {task.mode === "guided" && (
                          <div className="crate-submit-actions">
                            <button disabled={draft.done} type="submit">
                              {station ? "להדביק את התווית ←" : "סיימתי לצבוע ←"}
                            </button>
                            <span className="crate-submit-hint">
                              אפשר ומומלץ ללחוץ על <kbd dir="ltr">Enter ↵</kbd>
                            </span>
                          </div>
                        )}
                      </form>
                      <p
                        className={`feedback ${draft.done ? "success" : ""}`}
                        role="status"
                      >
                        {trailFeedback || draft.message ||
                          (speaking
                            ? "מקשיבים למילה…"
                            : task.mode === "guided" && next
                              ? `המקש הבא הוא ${next}. אפשר לתקן בכל רגע.`
                              : "קחו את הזמן. אפשר למחוק ולתקן.")}
                      </p>
                      {!draft.done && (
                        <div className="help-actions">
                          {task.mode === "spelling" && draft.hint < 2 ? (
                            <>
                              <button
                                className="secondary"
                                onClick={hint}
                              >
                                {draft.hint === 0 ? "רמז ראשון" : "הצגת המילה"}
                              </button>
                              <button className="text-button" onClick={showWord}>צריכים להעתיק?</button>
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
                            {task.mode === "spelling" ? "דילוג על המילה" : "קשה כרגע? ממשיכים בסיפור"}
                          </button>
                        </div>
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
                      {station && stage.mode === "guided" && <>
                        <p>המארגנת ביקשה: <strong>{session.tasks[0].at(-1)?.expected}</strong></p>
                        <div className="station-shelf-options" role="group" aria-label="ארגזים על המדף">
                          {session.tasks[0].slice(-3).map(box => <button className="secondary" key={box.wordId} onClick={() => {
                            if (box === session.tasks[0].at(-1)) nextStage();
                            else setTrailFeedback("זה ארגז אחר. בדקו את התווית ובחרו שוב.");
                          }}>{box.expected}</button>)}
                        </div>
                        {trailFeedback && <p role="status">{trailFeedback}</p>}
                      </>}
                      <button className={station && stage.mode === "guided" ? "secondary" : undefined} onClick={nextStage}>
                        {nextAvailableStage(session.stage) === -1 || session.standalone
                          ? station && stage.mode === "guided" ? "נמצא יחד ←" : "לסיום ←"
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
                      {deliveryPace && <p>זמן הקלדה במסלול: {(deliveryPace.current / 1000).toFixed(1)} שניות{deliveryPace.best === null ? "" : ` · השיא הקודם בתנאים דומים: ${(deliveryPace.best / 1000).toFixed(1)} שניות`}</p>}
                      <p>באיזה משחקון תרצו לשחק שוב?</p>
                      <div className="actions">
                        <button onClick={() => setScreen("shop")}>
                          {station ? "לחנות התחנה ←" : "משנים את החווה ←"}
                        </button>
                        <button className="secondary" onClick={station ? () => setScreen("activities") : leave}>
                          לבחירת משחקון
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
          {screen === "shop" && (
            <section className="panel">
              <div className="section-title">
                <div>
                  <span className="eyebrow">קצת שטויות, הרבה אופי</span>
                  <h1>חנות החווה</h1>
                </div>
                <button className="secondary" onClick={leave}>
                  חזרה לחקירה
                </button>
              </div>
              <p>קונים פעם אחת. מפעילים ומחליפים בחינם.</p>
              <div className="shop-grid">
                {prizes.slice(shopPage * prizesPerPage, (shopPage + 1) * prizesPerPage).map((prize) => {
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
              <nav className="shop-pages" aria-label="עמודי קישוטים">
                <button className="secondary" disabled={shopPage === 0} onClick={() => setShopPage(p => p - 1)}>לעמוד הקודם</button>
                <span role="status">עמוד {shopPage + 1} מתוך {Math.ceil(prizes.length / prizesPerPage)}</span>
                <button className="secondary" disabled={(shopPage + 1) * prizesPerPage >= prizes.length} onClick={() => setShopPage(p => p + 1)}>לעוד שטויות ←</button>
              </nav>
            </section>
          )}
        </>
      )}
      <footer>
        סקרנות, כמה מילים וכלב שמאוד רוצה לעזור.
        {screen === "home" && <span className="version-stamp">גרסה <time dir="ltr" dateTime={__VERSION_TIMESTAMP__}>{versionDate}</time></span>}
      </footer>
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
