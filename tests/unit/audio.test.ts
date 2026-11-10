import { afterEach, expect, it, vi } from "vitest";
import { AudioPlayer } from "../../src/audio/AudioPlayer";
class FakeAudio {
  static clips: FakeAudio[] = [];
  volume = 1;
  loop = false;
  paused = true;
  src: string;
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
  removeAttribute() {
    this.src = "";
  }
  load() {}
}
afterEach(() => {
  FakeAudio.clips = [];
  vi.unstubAllGlobals();
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
