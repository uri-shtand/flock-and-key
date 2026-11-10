import { afterEach, expect, it, vi } from "vitest";
import { AudioPlayer } from "../../src/audio/AudioPlayer";
class FakeAudio {
  static clips: FakeAudio[] = [];
  volume = 1;
  loop = false;
  paused = true;
  src: string;
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  rejectPlay!: (reason: Error) => void;
  constructor(src: string) {
    this.src = src;
    FakeAudio.clips.push(this);
  }
  play() {
    this.paused = false;
    return new Promise<void>((_resolve, reject) => {
      this.rejectPlay = reject;
    });
  }
  pause() {
    this.paused = true;
  }
  getAttribute() {
    return this.src || null;
  }
  removeAttribute() {
    this.src = "";
  }
  load() {}
}
afterEach(() => {
  FakeAudio.clips = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("does not let a stopped clip rejection cancel a newer word, and releases audio on destroy", async () => {
  vi.stubGlobal("Audio", FakeAudio);
  const speaking = vi.fn(),
    failed = vi.fn();
  const player = new AudioPlayer(speaking);
  player.speak("/first.mp3", failed);
  const old = FakeAudio.clips[1];
  player.speak("/next.mp3", failed);
  const current = FakeAudio.clips[2];
  old.rejectPlay(Error("interrupted"));
  await Promise.resolve();
  await Promise.resolve();
  expect(failed).not.toHaveBeenCalled();
  expect(current.paused).toBe(false);
  expect(FakeAudio.clips[0].volume).toBeLessThan(0.1);
  player.destroy();
  expect(current.paused).toBe(true);
  expect(current.src).toBe("");
  expect(FakeAudio.clips[0].src).toBe("");
});

it("selects music once per stage, without restarting it on repeated entry or task changes", () => {
  vi.stubGlobal("Audio", FakeAudio);
  const random = vi.spyOn(Math, "random").mockReturnValue(0);
  const player = new AudioPlayer(vi.fn());
  player.setMusic(true);
  const music = FakeAudio.clips[0];
  player.beginStage("session:0");
  const chosen = music.src;
  expect(chosen).not.toBe("/audio/farm-theme.wav");
  expect(music.paused).toBe(false);
  music.currentTime = 12;
  player.beginStage("session:0");
  expect(music.currentTime).toBe(12);
  expect(random).toHaveBeenCalledTimes(1);
  player.beginStage("session:1");
  expect(music.src).not.toBe(chosen);
  expect(music.currentTime).toBe(0);
  player.destroy();
});

it("keeps mute and speech ducking when choosing another background track", () => {
  vi.stubGlobal("Audio", FakeAudio);
  vi.spyOn(Math, "random").mockReturnValue(0.999);
  const player = new AudioPlayer(vi.fn()),
    music = FakeAudio.clips[0];
  player.beginStage("one");
  expect(music.paused).toBe(true);
  player.setMusic(true);
  player.speak("/word.mp3", vi.fn());
  player.beginStage("two");
  expect(music.volume).toBe(0.035);
  expect(music.paused).toBe(false);
  player.setMusic(false);
  player.beginStage("three");
  expect(music.paused).toBe(true);
  player.stopSpeech();
  expect(music.volume).toBe(0.16);
  expect(music.paused).toBe(true);
  player.destroy();
});
