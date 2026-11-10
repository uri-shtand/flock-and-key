import Phaser from "phaser";
import type { GameCommand, WorldView } from "../bridge";
export class FarmScene extends Phaser.Scene {
  private dog?: Phaser.GameObjects.Container;
  private view: WorldView = {
    stage: 0,
    step: 0,
    total: 8,
    equipped: [],
    revealed: false,
  };
  constructor(private onReady: () => void) {
    super("farm");
  }
  create() {
    this.draw();
    this.onReady();
  }
  command(command: GameCommand) {
    if (command.type === "world") {
      this.view = command.view;
      this.draw();
    } else if (this.dog) {
      this.tweens.add({
        targets: this.dog,
        y: this.dog.y - 15,
        duration: 160,
        yoyo: true,
        ease: "Sine.easeOut",
      });
    }
  }
  private draw() {
    this.tweens.killAll();
    this.children.removeAll(true);
    const { stage, step, total, equipped, revealed } = this.view;
    const g = this.add.graphics();
    g.fillStyle(stage === 1 ? 0xa8bddd : 0x9bdce4).fillRect(0, 0, 960, 400);
    g.fillStyle(0xffce61).fillCircle(790, 65, 34);
    g.fillStyle(0xffffff, 0.65)
      .fillEllipse(175, 60, 145, 30)
      .fillEllipse(390, 95, 180, 30);
    g.fillStyle(0x91ca8b).fillEllipse(260, 300, 960, 300);
    g.fillStyle(0x61ad7d).fillEllipse(820, 315, 850, 320);
    g.fillStyle(0x3f926a).fillRect(0, 300, 960, 100);
    for (let i = 0; i < 14; i++) {
      const x = 28 + i * 69,
        y = 360 + (i % 3) * 12;
      g.lineStyle(2, 0x266d56).lineBetween(x, y, x, y - 11);
      g.fillStyle(i % 2 ? 0xffd36a : 0xffa8a1).fillCircle(x, y - 13, 4);
    }
    // Winding path, barn and post office.
    g.lineStyle(47, 0xf4d093)
      .beginPath()
      .moveTo(220, 400)
      .lineTo(420, 310)
      .lineTo(700, 260)
      .strokePath();
    g.fillStyle(0xd77456).fillRoundedRect(675, 147, 182, 136, 5);
    g.fillStyle(0x663e51).fillTriangle(655, 155, 765, 75, 877, 155);
    g.fillStyle(revealed ? 0xffd785 : 0x61473e).fillRect(738, 209, 62, 74);
    g.lineStyle(3, 0xeccba7)
      .strokeRect(738, 209, 62, 74)
      .lineBetween(738, 209, 800, 283)
      .lineBetween(800, 209, 738, 283);
    g.fillStyle(0xffe0a3).fillRoundedRect(85, 178, 142, 114, 5);
    g.fillStyle(0x326883).fillTriangle(65, 182, 156, 116, 247, 182);
    g.fillStyle(0x77bfd1).fillRect(105, 202, 31, 32).fillRect(179, 202, 31, 32);
    g.fillStyle(0x83604b).fillRect(144, 236, 30, 56);
    g.fillStyle(0xc9aa7e).fillRect(289, 215, 8, 78);
    g.fillStyle(0xfff0c9).fillRoundedRect(254, 192, 82, 43, 4);
    // Sign paint progresses with the current exercise.
    g.fillStyle(0x5b8b87).fillRoundedRect(
      261,
      201,
      Math.max(5, (65 * step) / total),
      23,
      3,
    );
    for (let x = 30, i = 0; x < 960; x += 55, i++) {
      const colors = [0xedb1a8, 0xf5d58a, 0x97bcd3, 0xc5add5];
      g.lineStyle(
        6,
        equipped.includes("rainbow") ? colors[i % 4] : 0xe3d4aa,
      ).lineBetween(x, 310, x, 352);
    }
    g.lineStyle(4, 0xe3d4aa).lineBetween(0, 325, 960, 325);
    if (stage === 1)
      for (let i = 0; i < 8; i++) {
        g.fillStyle(i < step ? 0x634c3f : 0x9f997f, 0.85)
          .fillEllipse(340 + i * 40, 340 - i * 7, 10, 15)
          .fillEllipse(355 + i * 40, 350 - i * 7, 10, 15);
      }
    if (stage === 2) {
      g.fillStyle(0xfaf1d9).fillRect(342, 242, 65, 40);
      g.lineStyle(2, 0xa9a18f)
        .lineBetween(342, 242, 375, 264)
        .lineBetween(407, 242, 375, 264);
    }
    for (let i = 0; i < 4; i++) {
      const x = 510 + i * 66,
        y = 250 + (i % 2) * 27;
      const body = this.add.ellipse(0, 0, 49, 32, 0xfff9e8);
      const head = this.add.ellipse(25, -1, 22, 26, 0x34483e);
      const eye = this.add.circle(29, -5, 2, 0xffffff);
      const parts: Phaser.GameObjects.GameObject[] = [
        this.add.rectangle(-12, 20, 5, 13, 0x34483e),
        this.add.rectangle(12, 20, 5, 13, 0x34483e),
        body,
        head,
        eye,
      ];
      if (equipped.includes("mustache"))
        parts.push(this.add.ellipse(26, 6, 20, 6, 0x191d20));
      const sheep = this.add.container(x, y, parts);
      if (equipped.includes("dance"))
        this.tweens.add({
          targets: sheep,
          y: y - 10,
          angle: i % 2 ? 8 : -8,
          duration: 350 + i * 30,
          yoyo: true,
          repeat: -1,
        });
    }
    const dogParts: Phaser.GameObjects.GameObject[] = [
      this.add.ellipse(0, 0, 54, 30, 0x434d42),
      this.add.ellipse(28, -12, 27, 30, 0xc3a375),
      this.add.ellipse(16, -27, 12, 24, 0x434d42),
      this.add.circle(36, -15, 2, 0x101f1b),
      this.add.rectangle(-16, 21, 7, 22, 0xc3a375),
      this.add.rectangle(16, 21, 7, 22, 0xc3a375),
      this.add.ellipse(-29, -10, 10, 28, 0x434d42),
    ];
    if (equipped.includes("hat"))
      dogParts.push(
        this.add.rectangle(25, -34, 46, 7, 0x483e48),
        this.add.rectangle(25, -45, 29, 20, 0x483e48),
      );
    this.dog = this.add.container(
      320 + Math.min(step / total, 1) * 300,
      stage === 1 ? 353 : 369,
      dogParts,
    );
    if (equipped.includes("duck")) {
      this.add.ellipse(855, 348, 118, 60, 0xf3cc52);
      this.add.circle(885, 305, 35, 0xf3cc52);
      this.add.triangle(920, 311, 0, 0, 30, 10, 0, 18, 0xdd8f4b);
      this.add.circle(897, 297, 4, 0x293b31);
    }
    if (revealed) {
      for (let i = 0; i < 12; i++) {
        const dot = this.add.circle(
          420 + i * 32,
          150 + (i % 3) * 18,
          4,
          [0xe8b659, 0xc57b89, 0x75a5a3][i % 3],
        );
        this.tweens.add({
          targets: dot,
          y: dot.y - 16,
          duration: 600 + i * 20,
          yoyo: true,
          repeat: -1,
        });
      }
    }
  }
}
