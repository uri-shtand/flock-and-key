import type { PrizeId } from "../content/chapter";
import type { CourierRoute } from "../content/station";
export type WorldView = {
  stage: number;
  step: number;
  total: number;
  equipped: PrizeId[];
  revealed: boolean;
  route?: CourierRoute;
  labels?: string[];
};
export type GameCommand =
  | { type: "world"; view: WorldView }
  | { type: "celebrate" }
  | { type: "motion"; paused: boolean; reduced: boolean };
export type GameBridge = { send: (command: GameCommand) => void };
