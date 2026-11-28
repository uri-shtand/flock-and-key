const actions = ["hall", "cafe", "square", "poster", "note", "move", "stage", "table", "help", "return"] as const;
export type WordDetectiveAction = typeof actions[number];
type Place = "hall" | "cafe" | "square";
type WordDetectiveState = {
  place: Place;
  detail: "" | "poster" | "note" | "move" | "stage" | "table";
  poster: boolean;
  note: boolean;
  moved: boolean;
  stage: boolean;
  found: boolean;
  missingAtDiscovery: ("note" | "move")[] | null;
  supported: boolean;
  returned: boolean;
};

function reduce(state: WordDetectiveState, action: WordDetectiveAction): WordDetectiveState | null {
  if (state.returned) return null;
  switch (action) {
    case "hall":
    case "cafe":
    case "square": return { ...state, place: action, detail: "" };
    case "poster": return state.place === "hall" ? { ...state, poster: true, detail: "poster" } : null;
    case "note": return state.place === "cafe" ? { ...state, note: true, detail: "note" } : null;
    case "move": return state.place === "cafe" ? { ...state, moved: true, detail: "move" } : null;
    case "stage": return state.place === "square" ? { ...state, stage: true, detail: "stage" } : null;
    case "table": {
      if (state.place !== "square") return null;
      const missing = state.missingAtDiscovery ?? (["note", "move"] as const).filter(source => source === "note" ? !state.note : !state.moved);
      return { ...state, found: true, detail: "table", missingAtDiscovery: missing, supported: state.supported || missing.length > 0 };
    }
    case "return": return state.found && state.place === "square"
      ? { ...state, place: "hall", detail: "", returned: true } : null;
    case "help": return { ...state, supported: true };
  }
}

export function replayWordDetectives(events: unknown) {
  if (!Array.isArray(events)) return null;
  let state: WordDetectiveState = { place: "hall", detail: "", poster: false, note: false, moved: false, stage: false, found: false, missingAtDiscovery: null, supported: false, returned: false };
  for (const event of events) {
    if (!actions.includes(event)) return null;
    const next = reduce(state, event);
    if (!next) return null;
    state = next;
  }
  return state;
}
