const actions = ["remove-sign", "case", "stage-left", "stage-right", "handle", "test", "restore", "undo", "help", "show", "star", "circle"] as const;
export type WorkshopAction = typeof actions[number];
type Slot = "stage-left" | "stage-right";
type Connections = { sign: "case" | "tray" | Slot; handle: boolean };
type WorkshopState = Connections & {
  checkpoint: Slot | null;
  previous: Connections | null;
  feedback: "handle" | "blocked" | "stage" | "success" | "";
  supported: boolean;
  star: boolean;
  circle: boolean;
};

function reduce(state: WorkshopState, action: WorkshopAction): WorkshopState | null {
  const editing = { ...state, previous: { sign: state.sign, handle: state.handle }, feedback: "" } as const;
  switch (action) {
    case "remove-sign": return state.sign !== "tray" ? { ...editing, sign: "tray" } : null;
    case "case":
    case "stage-left":
    case "stage-right": return state.sign === "tray" ? { ...editing, sign: action } : null;
    case "handle": return { ...editing, handle: !state.handle };
    case "test":
      if (!state.handle) return { ...state, feedback: "handle" };
      if (state.sign === "case") return { ...state, feedback: "blocked" };
      if (state.sign === "tray") return { ...state, feedback: "stage" };
      return { ...state, checkpoint: state.checkpoint ?? state.sign, feedback: "success" };
    case "undo": return state.previous ? { ...state, ...state.previous, previous: null, feedback: "" } : null;
    case "restore": return state.checkpoint ? { ...state, sign: state.checkpoint, handle: true, previous: null, feedback: "success" } : null;
    case "help": return { ...state, supported: true };
    case "show": return { ...editing, supported: true, handle: true, sign: "stage-left" };
    case "star": return state.checkpoint ? { ...state, star: !state.star } : null;
    case "circle": return state.checkpoint ? { ...state, circle: !state.circle } : null;
  }
}

export function replayWorkshop(events: unknown) {
  if (!Array.isArray(events)) return null;
  let state: WorkshopState = { sign: "case", handle: true, checkpoint: null, previous: null, feedback: "", supported: false, star: true, circle: true };
  for (const event of events) {
    if (!actions.includes(event)) return null;
    const next = reduce(state, event);
    if (!next) return null;
    state = next;
  }
  return state;
}
