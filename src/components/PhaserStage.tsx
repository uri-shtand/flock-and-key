import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { FarmScene } from "../game/scenes/FarmScene";
import type { GameBridge } from "../game/bridge";
export function PhaserStage({
  onReady,
}: {
  onReady: (bridge: GameBridge | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const scene = new FarmScene(() =>
      onReady({ send: (command) => scene.command(command) }),
    );
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: 960,
      height: 400,
      backgroundColor: "#d8eeeb",
      scene: [scene],
      input: { keyboard: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    return () => {
      onReady(null);
      game.destroy(true);
    };
  }, [onReady]);
  return (
    <div
      className="stage"
      ref={host}
      role="img"
      aria-label="החווה של תום ופיצי, עם האסם, הכבשים והקישוטים שבחרתם"
    />
  );
}
