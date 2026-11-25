import { musicTracks, pickBackgroundTrack } from "./Music";

const musicVolume = 0.08;
const duckedVolume = 0.02;

export class AudioPlayer {
  private music: HTMLAudioElement;
  private track = musicTracks[0];
  private speech: HTMLAudioElement | null = null;
  private musicOn = false;
  private stageKey: string | null = null;
  private onSpeaking: (value: boolean) => void;
  constructor(onSpeaking: (value: boolean) => void, private onTrackChange?: (title: string) => void) {
    this.onSpeaking = onSpeaking;
    this.music = new Audio(this.track.path);
    this.music.loop = true;
    this.music.volume = musicVolume;
  }
  beginStage(key: string) {
    if (key === this.stageKey) return;
    this.stageKey = key;
    this.selectTrack(pickBackgroundTrack(this.track.path));
  }
  nextTrack() {
    const index = musicTracks.indexOf(this.track);
    this.selectTrack(musicTracks[(index + 1) % musicTracks.length]);
  }
  private selectTrack(track: (typeof musicTracks)[number]) {
    this.track = track;
    this.music.pause();
    this.music.src = track.path;
    this.music.load();
    this.onTrackChange?.(track.title);
    this.resume();
  }
  setMusic(on: boolean) {
    this.musicOn = on;
    if (on) this.resume();
    else this.music.pause();
  }
  speak(path: string, onError: () => void) {
    this.stopSpeech();
    const clip = new Audio(path);
    this.speech = clip;
    this.music.volume = duckedVolume;
    this.onSpeaking(true);
    clip.onended = () => {
      if (this.speech === clip) this.stopSpeech();
    };
    clip.onerror = () => {
      if (this.speech === clip) {
        this.stopSpeech();
        onError();
      }
    };
    void clip.play().catch(() => {
      if (this.speech === clip) {
        this.stopSpeech();
        onError();
      }
    });
  }
  stopSpeech() {
    if (this.speech) {
      this.speech.pause();
      this.speech.onended = null;
      this.speech.onerror = null;
      this.speech.removeAttribute("src");
      this.speech.load();
      this.speech = null;
    }
    this.music.volume = musicVolume;
    this.onSpeaking(false);
  }
  pause() {
    this.stopSpeech();
    this.setMusic(false);
  }
  resume() {
    if (this.musicOn && this.music.paused) void this.music.play().catch(() => {});
  }
  destroy() {
    this.pause();
    this.music.removeAttribute("src");
    this.music.load();
  }
}
