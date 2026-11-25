import Phaser from "phaser";
import { stationArt } from "../../content/station";
import type { GameCommand, WorldView } from "../bridge";

export class StationScene extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Image;
  private props!: Phaser.GameObjects.Graphics;
  private dog!: Phaser.GameObjects.Container;
  private labels!: Phaser.GameObjects.Container;
  private view?: WorldView;
  private stopped = false;
  private reduced = false;

  constructor(private readonly ready: () => void) { super("station-word-games"); }

  preload() {
    for (const art of ["station-hall", "station-cafe", "orchard", "square", "workshop"]) this.load.image(art, stationArt(art));
  }

  create() {
    this.backdrop = this.add.image(480, 200, "station-hall");
    this.props = this.add.graphics();
    this.labels = this.add.container();
    this.dog = this.add.container(130, 336, [
      this.add.ellipse(0, 20, 98, 16, 0x362a25, .28),
      this.add.ellipse(-43, -15, 12, 50, 0x484844).setRotation(-.8),
      this.add.rectangle(-24, 8, 12, 27, 0xbf9468), this.add.rectangle(23, 8, 12, 27, 0xbf9468),
      this.add.ellipse(0, -9, 77, 39, 0x484844), this.add.circle(34, -27, 20, 0x484844),
      this.add.triangle(29, -47, 0, 25, 5, 0, 17, 19, 0x484844), this.add.triangle(42, -50, 0, 21, 14, 0, 16, 23, 0x484844),
      this.add.ellipse(45, -18, 26, 16, 0xe4bf8e), this.add.circle(56, -20, 4, 0x272923),
      this.add.circle(40, -31, 4, 0xfff0d4), this.add.circle(41, -31, 2, 0x272923),
      this.add.rectangle(30, -8, 24, 5, 0xa94b3f),
    ]).setVisible(false);
    this.ready();
  }

  command(command: GameCommand) {
    if (command.type === "motion") {
      this.stopped = command.paused;
      if (this.reduced !== command.reduced) {
        this.reduced = command.reduced;
        this.tweens.killAll();
        if (this.view) this.renderView(this.view, true);
      }
      if (this.stopped) this.tweens.pauseAll();
      else this.tweens.resumeAll();
    } else if (command.type === "world") {
      const changed = this.view?.stage !== command.view.stage || this.view?.route !== command.view.route;
      this.view = command.view;
      this.renderView(command.view, changed);
    } else if (!this.stopped && !this.reduced && this.dog.visible) {
      this.tweens.add({ targets: this.dog, y: 319, duration: 155, yoyo: true });
    }
  }

  private renderView(view: WorldView, changed: boolean) {
    const walking = view.stage === 1 || view.stage === 3;
    const art = view.stage === 0 ? "workshop" : view.stage === 2 ? "station-hall" :
      view.step === view.total ? "square" : view.stage === 3 && view.route === "cafe" ? "station-cafe" : "orchard";
    this.backdrop.setTexture(art);
    const source = this.backdrop.texture.getSourceImage();
    const scale = Math.max(960 / source.width, 400 / source.height);
    this.backdrop.setDisplaySize(source.width * scale, source.height * scale);
    this.props.clear();
    this.labels.removeAll(true);
    this.dog.setVisible(walking);
    const x = 120 + 700 * view.step / Math.max(1, view.total);
    if (walking) {
      this.tweens.killTweensOf(this.dog);
      this.dog.setY(336);
      if (changed || this.reduced || this.stopped) this.dog.setX(x);
      else this.tweens.add({ targets: this.dog, x, duration: 380, ease: "Sine.easeOut" });
      return;
    }
    if (!view.step) return;
    const width = view.stage === 0 ? 94 : 62;
    for (let i = 0; i < view.step; i++) {
      const left = (960 - (width + 8) * view.step) / 2 + (width + 8) * i;
      const top = view.stage === 0 ? 300 : 294 - (i % 2) * 12;
      const color = view.stage === 0 ? 0xb67b4c : [0xc8d6ae, 0xe8ac8a, 0xf1d7a4][i % 3];
      this.props.fillStyle(color).fillRoundedRect(left, top, width, 48, 5);
      this.props.lineStyle(2, 0x5c3f30).strokeRoundedRect(left, top, width, 48, 5);
      if (view.stage === 0 && view.labels?.[i]) {
        this.labels.add(this.add.text(left + width / 2, top + 24, view.labels[i], { color: "#35251c", fontSize: "15px", fontFamily: "Arial", backgroundColor: "#ffe1a9", padding: { x: 3, y: 2 } }).setOrigin(.5));
      } else {
        this.props.fillStyle(0xffeed0).fillRect(left + 38, top + 6, 16, 12);
        this.props.lineStyle(2, 0x79654d).lineBetween(left + 7, top + 26, left + 43, top + 26).lineBetween(left + 7, top + 34, left + 30, top + 34);
      }
    }
  }
}
