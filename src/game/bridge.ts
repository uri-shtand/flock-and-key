// React owns task state. Phaser only receives visual commands.
export type GameCommand = 'celebrate';
export type GameBridge = { send: (command: GameCommand) => void };
