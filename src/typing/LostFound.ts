import { lostCases } from "../content/lostFound";

const actions = ["left", "right", "inspect-left", "inspect-right", "pattern", "location", "help", "show", "give", "next"] as const;
export type LostAction = typeof actions[number];
type Side = "left" | "right";
type LostState = {
  index: number;
  selected: Side | null;
  inspection: Side | null;
  knowsLocation: boolean;
  feedback: "pattern" | "location" | "clarify" | "wrong" | "";
  supported: boolean;
  wrong: number;
  delivered: boolean;
};

function start(index: number): LostState {
  return { index, selected: null, inspection: null, knowsLocation: false, feedback: "", supported: false, wrong: 0, delivered: false };
}

export function lostFound(state: LostState, action: LostAction): LostState | null {
  const item = lostCases[state.index];
  if (state.delivered) return action === "next" && state.index < lostCases.length - 1 ? start(state.index + 1) : null;
  switch (action) {
    case "left":
    case "right": return { ...state, selected: action, feedback: "" };
    case "inspect-left":
    case "inspect-right": {
      const side = action === "inspect-left" ? "left" : "right";
      return { ...state, inspection: state.inspection === side ? null : side };
    }
    case "pattern": return { ...state, feedback: "pattern" };
    case "location": return { ...state, knowsLocation: true, feedback: "location" };
    case "help": return { ...state, supported: true };
    case "show": return { ...state, supported: true, knowsLocation: true, selected: item.correct };
    case "give":
      if (!state.selected) return null;
      if (item.shape === "backpack" && !state.knowsLocation) return { ...state, feedback: "clarify" };
      return state.selected === item.correct
        ? { ...state, delivered: true }
        : { ...state, wrong: state.wrong + 1, feedback: "wrong" };
    case "next": return null;
  }
}

export function replayLostFound(events: unknown) {
  if (!Array.isArray(events)) return null;
  let state = start(0);
  for (const event of events) {
    if (!actions.includes(event)) return null;
    const next = lostFound(state, event);
    if (!next) return null;
    state = next;
  }
  return state;
}
