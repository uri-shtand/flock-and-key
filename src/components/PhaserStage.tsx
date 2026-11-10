import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { FarmScene } from '../game/scenes/FarmScene';
import type { GameBridge } from '../game/bridge';
export function PhaserStage({ onReady }: { onReady: (bridge: GameBridge | null) => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const scene = new FarmScene(() => onReady({ send: command => { if (command === 'celebrate') scene.celebrate(); } }));
    const game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current, width: 960, height: 460,
      backgroundColor: '#d8eeeb', scene: [scene],
      input: { keyboard: false }, // HTML inputs exclusively own keyboard events.
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    return () => { onReady(null); game.destroy(true); };
  }, [onReady]);
  return <div className="stage" ref={host} role="img" aria-label="חווה עם כבשה ושער עץ" />;
}
