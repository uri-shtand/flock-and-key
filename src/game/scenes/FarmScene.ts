import Phaser from 'phaser';
export class FarmScene extends Phaser.Scene {
  private sheep?: Phaser.GameObjects.Container;
  constructor(private onReady: () => void) { super('farm'); }
  create() {
    const g = this.add.graphics();
    g.fillStyle(0xd8eeeb).fillRect(0, 0, 960, 460);
    g.fillStyle(0xffd886).fillCircle(790, 82, 43);
    g.fillStyle(0x94bda2).fillEllipse(220, 330, 850, 300);
    g.fillStyle(0x729e83).fillEllipse(810, 350, 1000, 320);
    g.fillStyle(0x507e62).fillRect(0, 355, 960, 105);
    g.fillStyle(0xc07758).fillRect(95, 225, 155, 130);
    g.fillStyle(0x723f37).fillTriangle(72, 230, 172, 145, 273, 230);
    g.fillStyle(0xedd8af).fillRect(147, 280, 48, 75);
    g.lineStyle(7, 0xe4d4ad);
    for (let x = 580; x < 930; x += 65) g.lineBetween(x, 285, x, 370);
    g.lineBetween(580, 310, 905, 310).lineBetween(580, 340, 905, 340);
    const body = this.add.ellipse(0, 0, 94, 63, 0xfff8e9);
    const head = this.add.ellipse(47, 2, 35, 43, 0x34443d);
    const eye = this.add.circle(54, -4, 3, 0xffffff);
    const legs = [-24, 24].map(x => this.add.rectangle(x, 35, 9, 24, 0x34443d));
    this.sheep = this.add.container(360, 315, [...legs, body, head, eye]);
    this.tweens.add({ targets: body, scaleY: 1.04, duration: 900, yoyo: true, repeat: -1 });
    this.onReady();
  }
  celebrate() {
    if (!this.sheep) return;
    this.tweens.killTweensOf(this.sheep);
    this.sheep.setPosition(360, 315);
    this.tweens.add({ targets: this.sheep, x: 720, duration: 950, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.sheep, y: 295, duration: 150, yoyo: true, repeat: 2 });
  }
}
