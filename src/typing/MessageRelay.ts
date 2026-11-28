const actions = ["cafe", "across", "wait", "start", "send", "receive", "ready", "help", "show"] as const;
export type RelayAction = typeof actions[number];
type RelayState = {
  update: "location" | "delay" | "waiting" | "ready" | "done";
  location: "station" | "cafe" | "across";
  status: "gathering" | "waiting" | "performing";
  draft: "cafe" | "across" | "wait" | "start" | null;
  feedback: "cafe" | "early" | "";
  assisted: boolean;
  revisions: number;
};

function reduce(state: RelayState, action: RelayAction): RelayState | null {
  if (state.update === "done") return null;
  switch (action) {
    case "cafe":
    case "across": return state.update === "location" ? { ...state, draft: action } : null;
    case "wait":
    case "start": return state.update === "delay" ? { ...state, draft: action } : null;
    case "help": return { ...state, assisted: true };
    case "show":
      if (state.update !== "location" && state.update !== "delay") return null;
      return { ...state, assisted: true, draft: state.update === "location" ? "across" : "wait" };
    case "send":
      if (state.draft === "cafe") return { ...state, location: "cafe", feedback: "cafe", revisions: state.revisions + 1 };
      if (state.draft === "across") return { ...state, location: "across", update: "delay", draft: null, feedback: "" };
      if (state.draft === "start") return { ...state, feedback: "early", revisions: state.revisions + 1 };
      if (state.draft === "wait") return { ...state, update: "waiting", status: "waiting", draft: null, feedback: "" };
      return null;
    case "receive": return state.update === "waiting" ? { ...state, update: "ready" } : null;
    case "ready": return state.update === "ready" ? { ...state, update: "done", status: "performing" } : null;
  }
}

export function replayRelay(events: unknown) {
  if (!Array.isArray(events)) return null;
  let state: RelayState = { update: "location", location: "station", status: "gathering", draft: null, feedback: "", assisted: false, revisions: 0 };
  for (const event of events) {
    if (!actions.includes(event)) return null;
    const next = reduce(state, event);
    if (!next) return null;
    state = next;
  }
  return state;
}
