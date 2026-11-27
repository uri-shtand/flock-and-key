import { useEffect, useLayoutEffect, useRef } from "react";
import Phaser from "phaser";
import type { SceneAction } from "../../content/Rehearsals";
import { stationArt } from "../../content/station";

type Action = SceneAction | "idle" | "applause";
type StageCommand = { action: Action; cue: number; stopped: boolean; reduced: boolean };

class BarnScene extends Phaser.Scene {
  private view?: StageCommand;
  private dog!: Phaser.GameObjects.Container;
  private sheep!: Phaser.GameObjects.Container;
  private duck!: Phaser.GameObjects.Container;
  private props!: Phaser.GameObjects.Container;

  constructor(private ready: () => void, private station: boolean) { super("rehearsal-stage"); }
  preload() {
    if (this.station) {
      this.load.image("village-square", stationArt("square"));
      this.load.image("station-dog", stationArt("pitsi-walking"));
      this.load.image("stage-sister", stationArt("performer-sister"));
      this.load.image("stage-dad", stationArt("performer-dad"));
    }
  }

  create() {
    const g = this.add.graphics();
    g.fillStyle(0x4c3444).fillRect(0, 0, 800, 490);
    g.fillStyle(0x62434c).fillRect(25, 40, 750, 315);
    for (let x = 43; x < 780; x += 48) g.lineStyle(2, 0x49313e, 0.55).lineBetween(x, 45, x, 356);
    g.fillStyle(0x372d3e).fillRoundedRect(247, 63, 306, 200, 12);
    g.fillStyle(0xa5d5d6).fillRoundedRect(258, 74, 284, 177, 8);
    g.fillStyle(0xffda88).fillCircle(472, 113, 23);
    g.fillStyle(0x638c81).fillTriangle(258, 218, 371, 112, 505, 218);
    g.fillStyle(0xe9ede5).fillTriangle(335, 146, 371, 112, 415, 147);
    g.fillStyle(0x8fb18a).fillEllipse(328, 230, 140, 42).fillEllipse(471, 226, 142, 49);
    g.fillStyle(0x956350).fillRect(390, 76, 10, 174).fillRect(259, 164, 282, 10);
    g.fillStyle(0x805141).fillRect(0, 345, 800, 145);
    for (let y = 365; y < 490; y += 28) g.lineStyle(2, 0x593c40).lineBetween(0, y, 800, y);
    g.fillStyle(0xd39a6b).fillEllipse(400, 397, 672, 144);
    g.fillStyle(0xe7ad77).fillEllipse(400, 391, 637, 113);
    g.fillStyle(0x763d50).fillTriangle(0, 0, 146, 0, 0, 397).fillTriangle(800, 0, 654, 0, 800, 397);
    g.lineStyle(4, 0xf1bf71).lineBetween(0, 204, 71, 199).lineBetween(730, 199, 800, 204);
    g.lineStyle(2, 0xe0b482).lineBetween(62, 27, 738, 27);
    for (let x = 90; x < 740; x += 68) {
      g.fillStyle(x % 3 === 0 ? 0x9fd3bc : 0xf1c47e).fillTriangle(x - 12, 28, x + 13, 28, x, 47);
      g.fillStyle(0xffdf91, 0.13).fillCircle(x, 27, 14);
    }
    g.fillStyle(0x60404a).fillRoundedRect(95, 307, 94, 70, 7);
    g.lineStyle(3, 0xa67363).strokeRect(103, 316, 78, 51).lineBetween(105, 320, 177, 364);
    if (this.station) {
      g.clear();
      this.add.image(400, 245, "village-square").setDisplaySize(800, 490);
      const boards = this.add.graphics();
      boards.fillStyle(0xb77b51).fillRoundedRect(70, 320, 658, 124, 16);
      boards.fillStyle(0x84583e).fillRoundedRect(70, 422, 658, 30, 8);
      for (let y = 341; y < 417; y += 23) boards.lineStyle(2, 0x84583e, .7).lineBetween(74, y, 724, y);
    }

    this.sheep = this.add.container(204, 359, [
      this.add.rectangle(-22, 24, 10, 29, 0x344b4c), this.add.rectangle(21, 24, 10, 29, 0x344b4c),
      this.add.ellipse(0, 0, 94, 63, 0xfff0d8), this.add.circle(-30, -19, 20, 0xfff0d8),
      this.add.circle(-4, -29, 20, 0xfff0d8), this.add.circle(24, -25, 19, 0xfff0d8),
      this.add.ellipse(47, -4, 38, 45, 0x344b4c), this.add.ellipse(58, -22, 30, 12, 0x344b4c),
      this.add.circle(53, -10, 5, 0xfffff5), this.add.circle(55, -10, 2, 0x1d2c39),
      this.add.rectangle(43, 17, 33, 8, 0xbc5972), this.add.star(50, 20, 5, 3, 9, 0xffda7e),
    ]);
    this.dog = this.add.container(402, 364, [
      this.add.ellipse(-47, -18, 14, 45, 0x3e4049).setAngle(-30),
      this.add.ellipse(0, 0, 92, 49, 0x3e4049),
      this.add.rectangle(-25, 22, 12, 25, 0xd2a178), this.add.rectangle(26, 22, 12, 25, 0xd2a178),
      this.add.ellipse(44, -24, 45, 51, 0x3e4049),
      this.add.triangle(30, -57, 0, 34, 10, 0, 24, 36, 0x3e4049),
      this.add.triangle(56, -58, 0, 34, 16, 0, 23, 36, 0x3e4049),
      this.add.ellipse(59, -12, 34, 24, 0xd2a178), this.add.circle(77, -15, 6, 0x253039),
      this.add.circle(51, -34, 5, 0xfff1e1), this.add.circle(53, -33, 2, 0x252c35),
      this.add.rectangle(43, 8, 33, 7, 0xd6786a),
    ]);
    this.duck = this.add.container(613, 369, [
      this.add.ellipse(0, 0, 66, 42, 0xffcb66), this.add.ellipse(-8, 1, 34, 24, 0xe6a34d),
      this.add.circle(24, -24, 23, 0xffcb66), this.add.ellipse(46, -18, 26, 10, 0xe98851),
      this.add.circle(30, -29, 4, 0x333248), this.add.ellipse(0, 22, 26, 7, 0xe98851),
    ]);
    if (this.station) {
      this.sheep.destroy();
      this.duck.destroy();
      this.dog.destroy();
      this.sheep = this.actor(204, 359, "stage-sister", 188);
      this.duck = this.actor(613, 369, "stage-dad", 221);
      const dog = this.add.image(0, 36, "station-dog").setOrigin(.5, 1);
      dog.setScale(111 / dog.width);
      this.dog = this.add.container(402, 364, dog);
    }
    this.props = this.add.container();
    this.ready();
  }

  private actor(x: number, y: number, texture: string, height: number) {
    const sprite = this.add.image(0, 39, texture).setOrigin(.5, 1);
    sprite.setScale(height / sprite.height);
    return this.add.container(x, y, [this.add.ellipse(0, 39, 76, 15, 0x563f30, .32), sprite]);
  }

  command(view: StageCommand) {
    const newCue = this.view?.cue !== view.cue || this.view?.action !== view.action || this.view?.reduced !== view.reduced;
    this.view = view;
    if (newCue) this.pose(view.action, view.reduced);
    if (view.stopped) this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }

  private pose(action: Action, reduced: boolean) {
    this.tweens.killAll();
    this.props.removeAll(true);
    this.sheep.setPosition(204, 359).setAngle(0).setScale(1);
    this.dog.setPosition(402, 364).setAngle(0).setScale(1);
    this.duck.setPosition(613, 369).setAngle(0).setScale(1);
    const bounce = (target: Phaser.GameObjects.Container, height: number) => {
      if (!reduced) this.tweens.add({ targets: target, y: target.y - height, duration: 250, ease: "Sine.easeOut", yoyo: true, repeat: 1 });
    };

    if (this.station) {
      const drum = this.add.container(484, 358, [
        this.add.rectangle(0, 5, 57, 40, 0xb95146), this.add.ellipse(0, -14, 60, 18, 0xffe1ac),
        this.add.graphics().lineStyle(2, 0xffebc0).lineBetween(-18, -4, -10, 24).lineBetween(14, -4, 7, 24),
      ]);
      const suitcase = this.add.graphics().fillStyle(0x734937).fillRoundedRect(454, 357, 74, 48, 7)
        .lineStyle(3, 0xe0ab71).strokeRoundedRect(476, 348, 31, 14, 3).lineBetween(468, 359, 468, 403).lineBetween(514, 359, 514, 403);
      const x = action === "drum-beside" ? 420 : 499;
      const y = action === "drum-behind" ? 337 : action === "drum-front" ? 395 : 368;
      this.props.add(action === "drum-behind" ? [drum, suitcase] : [suitcase, drum]);
      if (reduced || action === "idle" || action === "applause") drum.setPosition(action === "idle" || action === "applause" ? 418 : x, y);
      else this.tweens.add({ targets: drum, x, y, duration: 410, ease: "Cubic.easeOut" });
      if (action === "applause") {
        bounce(this.sheep, 23);
        bounce(this.dog, 18);
        bounce(this.duck, 21);
      }
      return;
    }

    if (action === "hat" || action === "hats") {
      const hats = this.add.container(637, 318);
      const graphic = this.add.graphics();
      for (let i = 0; i < (action === "hat" ? 1 : 3); i++) {
        graphic.fillStyle([0x8e5779, 0x498478, 0x9b4e46][i]).fillRoundedRect(-20, -i * 22 - 14, 40, 19, 5);
        graphic.fillStyle(0xffdf8c).fillEllipse(0, 4 - i * 22, 58, 8);
      }
      hats.add(graphic);
      this.props.add(hats);
      if (!reduced) {
        this.tweens.add({ targets: hats, angle: 13, duration: 280, yoyo: true, repeat: 1 });
        this.tweens.add({ targets: this.duck, angle: 16, duration: 300, yoyo: true });
      }
      return;
    }

    if (action.endsWith("-chases")) {
      const leader = action === "pitsi-chases" ? this.sheep : this.dog;
      const chaser = action === "pitsi-chases" ? this.dog : action === "noga-chases" ? this.sheep : this.duck;
      const spectator = [this.duck, this.dog, this.sheep].find(actor => actor !== leader && actor !== chaser)!;
      spectator.setPosition(113, 349).setScale(0.8);
      leader.setPosition(reduced ? 565 : 420, 360);
      chaser.setPosition(reduced ? 420 : 275, 366);
      if (!reduced) {
        this.tweens.add({ targets: leader, x: 668, duration: 760, ease: "Quad.easeOut" });
        this.tweens.add({ targets: chaser, x: 545, duration: 840, ease: "Quad.easeOut" });
        bounce(chaser, 30);
      }
      return;
    }

    if (action === "boots" || action === "sock" || action === "drum" || action === "bell") {
      const object = this.add.container(517, action === "boots" || reduced ? 323 : 369);
      const g = this.add.graphics();
      if (action === "sock") {
        g.fillStyle(0xb65c70).fillRoundedRect(-11, -30, 28, 49, 8).fillRoundedRect(-32, 4, 48, 19, 8);
        g.fillStyle(0xf4c287).fillRect(-10, -20, 26, 6);
      } else if (action === "bell") {
        g.fillStyle(0xffcc67).fillCircle(0, -5, 18).fillEllipse(0, 11, 45, 12).fillCircle(1, 15, 7);
      } else {
        g.fillStyle(0xb95062).fillRoundedRect(-27, -1, 54, 33, 7);
        g.fillStyle(0xffe5b9).fillEllipse(0, 0, 56, 18);
        g.lineStyle(2, 0xffefd7).lineBetween(-17, 9, -5, 29).lineBetween(4, 8, 17, 29);
        if (action === "boots") {
          g.fillStyle(0x4c4759).fillRoundedRect(-28, -39, 17, 28, 4).fillRoundedRect(-39, -19, 33, 12, 5);
          g.fillRoundedRect(13, -45, 17, 28, 4).fillRoundedRect(3, -24, 32, 11, 5);
        }
      }
      if (action !== "boots") this.props.add(this.add.graphics().fillStyle(0x694959).fillRect(465, 301, 103, 12).fillRect(470, 313, 9, 59).fillRect(553, 313, 9, 59));
      object.add(g);
      this.props.add(object);
      bounce(object, action === "boots" ? 18 : 52);
      bounce(this.duck, 18);
      return;
    }

    if (action === "applause") {
      bounce(this.sheep, 37);
      bounce(this.dog, 26);
      bounce(this.duck, 32);
    }
  }
}

export function RehearsalStage({ command, station = false }: { command: StageCommand; station?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BarnScene | null>(null);
  const latest = useRef(command);
  latest.current = command;

  useEffect(() => {
    if (!host.current) return;
    const mount = document.createElement("div");
    mount.className = "rehearsal-phaser";
    host.current.append(mount);
    const barn = new BarnScene(() => {
      if (!mount.isConnected) return;
      scene.current = barn;
      barn.command(latest.current);
    }, station);
    const game = new Phaser.Game({
      type: Phaser.AUTO, parent: mount, width: 800, height: 490, scene: [barn],
      input: { keyboard: false },
      scale: { mode: Phaser.Scale.FIT },
    });
    return () => {
      scene.current = null;
      mount.remove();
      game.destroy(true);
    };
  }, [station]);

  useLayoutEffect(() => { scene.current?.command(command); }, [command]);
  return <div className="rehearsal-canvas" ref={host} aria-hidden="true" />;
}
