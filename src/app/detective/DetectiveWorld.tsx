import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { stationArt } from '../../content/station';
import type { CasePlace } from '../../content/stationCases';
export type DetectiveView = { place: CasePlace | 'ending'; art?: string; label?: string; stopped: boolean; reduced: boolean; reaction: number; ribbonTaken: boolean; spoonTaken: boolean };
// Visual commands only: no clue rules, answer checking or persistence in the scene.
class DetectiveScene extends Phaser.Scene {
  private current?: DetectiveView;
  private dog?: Phaser.GameObjects.Container;
  constructor(private ready: () => void, private station: boolean) { super('detective'); }
  preload() {
    if (this.station) for (const art of ['station-hall', 'station-cafe', 'square', 'forecourt']) this.load.image(art, stationArt(art));
  }
  create() { this.ready(); }
  command(view: DetectiveView) {
    const redraw = this.current?.place !== view.place || this.current?.reduced !== view.reduced || this.current?.ribbonTaken !== view.ribbonTaken || this.current?.spoonTaken !== view.spoonTaken;
    const react = this.current?.reaction !== view.reaction;
    this.current = view;
    if (redraw) this.draw(view);
    if (view.reduced) this.tweens.killAll();
    if (view.stopped) this.tweens.pauseAll(); else this.tweens.resumeAll();
    if (!redraw && react && !view.stopped && !view.reduced && this.dog) {
      this.tweens.killTweensOf(this.dog);
      this.dog.setAngle(0);
      this.tweens.add({ targets: this.dog, angle: -8, duration: 140, yoyo: true, repeat: 1 });
    }
  }
  private draw(view: DetectiveView) {
    this.tweens.killAll(); this.children.removeAll(true);
    if (view.art) {
      this.add.image(480, 320, view.art).setDisplaySize(960, 640);
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(0xb6dee0).fillRect(0, 0, 960, 640);
    g.fillStyle(0xffe6a0).fillCircle(785, 85, 45);
    g.fillStyle(0xfaf7e6).fillEllipse(190, 80, 180, 35).fillEllipse(560, 120, 150, 25);
    g.fillStyle(0x8ab48b).fillEllipse(160, 370, 900, 430);
    g.fillStyle(0x6b9877).fillEllipse(850, 355, 1000, 400);
    g.fillStyle(0xc1bd8a).fillRect(0, 380, 960, 260);
    g.fillStyle(0xe9d3a3).fillEllipse(500, 530, 1100, 260);
    // Distant fence and flowers reuse the established farm's primitive vocabulary.
    for (let x = 20; x < 960; x += 65) g.fillStyle(0xf2e5bc).fillRoundedRect(x, 295, 9, 120, 3);
    g.fillStyle(0xe4d5ae).fillRect(0, 320, 960, 10).fillRect(0, 365, 960, 8);
    if (view.place === 'yard') {
      g.fillStyle(0xba6b52).fillRoundedRect(25, 180, 190, 220, 5);
      g.fillStyle(0x4a5660).fillTriangle(5, 190, 120, 95, 235, 190);
      g.fillStyle(0x634d45).fillRect(80, 285, 80, 115);
      g.lineStyle(4, 0xf6d6a7).strokeRect(80, 285, 80, 115).lineBetween(80, 285, 160, 400).lineBetween(160, 285, 80, 400);
      // Cart: large enough to invite inspection of its ribbon and delivery book.
      g.fillStyle(0x785947).fillRoundedRect(345, 305, 280, 130, 10);
      for (let y = 315; y < 425; y += 30) g.fillStyle(0xb88959).fillRect(350, y, 270, 23);
      g.lineStyle(9, 0x614d43).lineBetween(365, 300, 365, 440).lineBetween(605, 300, 605, 440).lineBetween(625, 410, 715, 445);
      for (const x of [390, 585]) { g.fillStyle(0x3e4948).fillCircle(x, 445, 42); g.fillStyle(0xcaa36d).fillCircle(x, 445, 29); g.lineStyle(4, 0x665443).lineBetween(x - 29, 445, x + 29, 445).lineBetween(x, 416, x, 474); }
      g.fillStyle(0xd9c8a0).fillRoundedRect(405, 265, 150, 55, 22);
      g.lineStyle(5, 0x9b6f6b).strokeRoundedRect(410, 271, 140, 44, 18);
      if (!view.ribbonTaken) {
        g.fillStyle(0xb45c69).fillTriangle(585, 310, 630, 340, 594, 380);
        for (const [x, y] of [[600, 330], [608, 350]]) this.add.star(x, y, 5, 3, 7, 0xffe8b3);
      }
      // Picnic basket beside Pitsi. The collected spoon leaves the world.
      g.lineStyle(6, 0x805637).strokeEllipse(430, 523, 62, 48);
      g.fillStyle(0xb98b50).fillRoundedRect(388, 532, 84, 52, 10);
      for (let x = 400; x < 470; x += 14) g.lineStyle(2, 0x805637).lineBetween(x, 535, x, 580);
      g.lineStyle(3, 0x805637).lineBetween(393, 551, 467, 551).lineBetween(393, 566, 467, 566);
      if (!view.spoonTaken) { g.lineStyle(7, 0xe3bd80).lineBetween(450, 542, 470, 500); g.fillStyle(0xe3bd80).fillEllipse(473, 493, 18, 25); }
      g.fillStyle(0xfff5d5).fillRect(455, 280, 65, 40);
      g.lineStyle(2, 0x836952).lineBetween(488, 280, 488, 320);
      for (let y = 290; y < 318; y += 8) g.lineBetween(460, y, 481, y).lineBetween(494, y, 514, y);
      g.fillStyle(0x835c40).fillRect(720, 350, 170, 20).fillRect(740, 370, 10, 80).fillRect(860, 370, 10, 80);
      g.fillStyle(0xe4b86e).fillEllipse(800, 343, 85, 27);
      for (let i = 0; i < 5; i++) { const x = 810 - i * 40, y = 470 + i * 13; g.fillStyle(0xfff7df).fillEllipse(x, y, 10, 17).fillEllipse(x + 13, y + 6, 10, 17); }
      this.person(780, 265, 0x739f92, false); this.person(270, 310, 0x526e87, true);
      this.sheep(130, 475, false);
    } else {
      // Stream, two distinct levels, enclosed upper platform and a low movable screen.
      g.fillStyle(0x67a8b3).fillRect(0, 430, 960, 210);
      for (let y = 458; y < 630; y += 36) for (let x = 25; x < 960; x += 150) g.lineStyle(3, 0xb0d8d0).lineBetween(x, y, x + 70, y);
      g.fillStyle(0xa99b83).fillRoundedRect(180, 280, 620, 255, 16);
      g.fillStyle(0x67a8b3).fillEllipse(490, 540, 330, 340);
      g.fillStyle(0x736e61).fillRect(170, 265, 640, 25);
      g.fillStyle(0xd5c7a8).fillRect(165, 240, 650, 25);
      for (let x = 180; x < 810; x += 60) g.fillRect(x, 185, 12, 58);
      g.fillRect(175, 180, 640, 14);
      for (let y = 310; y < 470; y += 45) { g.lineStyle(2, 0x8d8271).lineBetween(185, y, 300, y).lineBetween(680, y, 795, y); }
      g.fillStyle(0x768f8b).fillEllipse(340, 487, 100, 25);
      g.fillStyle(0xe9d3a3).fillEllipse(480, 655, 1200, 250);
      g.fillStyle(0xbb6d6f).fillRoundedRect(420, 220, 230, 20, 4);
      g.fillStyle(0xf0d5a5).fillRect(433, 226, 205, 4);
      g.fillStyle(0x785944).fillRect(80, 300, 10, 170);
      g.fillStyle(0xfff2cf).fillRoundedRect(45, 305, 86, 80, 6);
      g.lineStyle(3, 0x997a55).lineBetween(58, 328, 116, 328).lineBetween(58, 343, 116, 343).lineBetween(58, 358, 95, 358);
      if (view.place === 'ending') {
        this.sheep(545, 185, true);
        const ribbon = this.add.graphics().fillStyle(0xb45c69).fillTriangle(585, 192, 745, 155, 717, 184);
        if (!view.reduced) this.tweens.add({ targets: ribbon, angle: 2, duration: 700, yoyo: true, repeat: -1 });
      }
      const screen = this.add.container(view.place === 'ending' ? 810 : 550, 175, [this.add.rectangle(0, 0, 225, 105, 0x67897e), this.add.rectangle(-108, 25, 8, 150, 0x6e5844), this.add.rectangle(108, 25, 8, 150, 0x6e5844)]);
      if (view.place === 'ending' && !view.reduced) { screen.x = 550; this.tweens.add({ targets: screen, x: 810, duration: 800, ease: 'Cubic.easeOut' }); }
      this.person(170, 515, 0x739f92, false);
    }
    this.dog = this.add.container(320, 550, [this.add.ellipse(0, 0, 85, 46, 0x4a5150), this.add.rectangle(-24, 32, 10, 33, 0xd7b18a), this.add.rectangle(24, 32, 10, 33, 0xd7b18a), this.add.ellipse(43, -22, 40, 48, 0x4a5150), this.add.triangle(25, -57, 0, 0, 10, 35, 22, 12, 0x4a5150), this.add.triangle(54, -60, 0, 22, 20, 0, 17, 42, 0x4a5150), this.add.ellipse(57, -9, 38, 24, 0xd7b18a), this.add.circle(76, -14, 7, 0x263a39), this.add.circle(50, -31, 4, 0xfff6df), this.add.circle(52, -31, 2, 0x263a39), this.add.rectangle(35, 6, 35, 7, 0xda7154), this.add.ellipse(-47, -19, 13, 45, 0x4a5150)]);
    if (view.place === 'ending' && !view.reduced) this.tweens.add({ targets: this.dog, angle: 360, duration: 650, delay: 800, ease: 'Sine.easeInOut' });
    for (let x = 30; x < 960; x += 130) { g.fillStyle(0x75865f).fillEllipse(x, 612, 45, 12); this.add.circle(x, 601, 5, 0xffdc91); }
  }
  private person(x: number, y: number, coat: number, hat: boolean) {
    this.add.container(x, y, [this.add.rectangle(-13, 65, 14, 45, 0x43545b), this.add.rectangle(13, 65, 14, 45, 0x43545b), this.add.rectangle(0, 24, 57, 65, coat), this.add.circle(0, -27, 28, 0xe3b68a), this.add.ellipse(-12, -52, 40, 20, 0x685243), this.add.circle(-8, -29, 3, 0x354846), this.add.circle(10, -29, 3, 0x354846), this.add.ellipse(4, -12, 13, 4, 0x9e6d5c), ...(hat ? [this.add.rectangle(0, -55, 75, 9, coat), this.add.rectangle(0, -65, 49, 20, coat)] : [])]);
  }
  private sheep(x: number, y: number, star: boolean) {
    const parts: Phaser.GameObjects.GameObject[] = [this.add.rectangle(-23, 30, 9, 30, 0x45534a), this.add.rectangle(20, 30, 9, 30, 0x45534a), this.add.ellipse(0, 0, 95, 63, 0xfff5dd), this.add.circle(-30, -14, 23, 0xfff5dd), this.add.circle(0, -25, 23, 0xfff5dd), this.add.circle(28, -16, 23, 0xfff5dd), this.add.ellipse(47, -1, 34, 41, 0x45534a), this.add.ellipse(61, -22, 29, 10, 0x45534a), this.add.circle(52, -7, 4, 0xffffff), this.add.circle(53, -7, 2, 0x253a35), this.add.rectangle(39, 18, 29, 9, star ? 0xb45c69 : 0x7ba8ad)];
    if (star) parts.push(this.add.star(42, 19, 5, 3, 7, 0xffe2a0));
    this.add.container(x, y, parts);
  }
}
export function DetectiveWorld({ view }: { view: DetectiveView }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<DetectiveScene | null>(null), latest = useRef(view);
  latest.current = view;
  const station = Boolean(view.art);
  useEffect(() => {
    if (!host.current) return;
    const world = new DetectiveScene(() => { scene.current = world; world.command(latest.current); }, station);
    const game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current, width: 960, height: 640, backgroundColor: '#b6dee0', scene: [world], input: { keyboard: false }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    return () => { scene.current = null; game.destroy(true); };
  }, [station]);
  useEffect(() => { scene.current?.command(view); }, [view.place, view.art, view.reduced, view.stopped, view.reaction, view.ribbonTaken, view.spoonTaken]);
  return <div className="detective-canvas" ref={host} role="img" aria-label={station ? view.label : view.place === 'yard' ? 'חצר החווה: עגלת הדוור, סרט כוכבים ועקבות ליד שולחן הפיקניק' : view.place === 'ending' ? 'נוגה מדגמנת על השטיח וסרט הכוכבים מתנופף ברוח' : 'גשר אבן: קשת רטובה מתחת ובמה מוקפת מעקה מעל, עם מחיצה סגורה'} />;
}
