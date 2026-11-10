import type { PrizeId } from "../content/chapter";
export type WorldView = {
  stage: number;
  step: number;
  total: number;
  equipped: PrizeId[];
  revealed: boolean;
};
export type GameCommand =
  { type: "world"; view: WorldView } | { type: "celebrate" };
export type GameBridge = { send: (command: GameCommand) => void };
