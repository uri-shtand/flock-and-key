import { cafeOrders } from "../content/cafeShift";

const actions = ["cheese", "tomato", "split", "join", "pack-one", "pack-two", "unpack", "serve", "help", "show", "next"] as const;
export type CafeAction = typeof actions[number];
type CafeState = {
  index: number;
  cheese: boolean;
  tomato: boolean;
  split: boolean;
  packed: 1 | 2 | null;
  served: boolean;
  feedback: "cheese" | "tomato" | "split" | "pack" | "";
  supported: boolean;
  wrong: number;
};

function initial(index: number): CafeState {
  return { index, cheese: false, tomato: false, split: false, packed: null, served: false, feedback: "", supported: false, wrong: 0 };
}

function reduce(state: CafeState, action: CafeAction): CafeState | null {
  const order = cafeOrders[state.index];
  if (state.served) return action === "next" && state.index < cafeOrders.length - 1 ? initial(state.index + 1) : null;
  const recipe = { cheese: order.cheese, tomato: !order.cheese };
  const editing = { ...state, feedback: "" } as const;
  switch (action) {
    case "cheese": return { ...editing, cheese: !state.cheese };
    case "tomato": return { ...editing, tomato: !state.tomato };
    case "split": return order.split && !state.split ? { ...editing, split: true } : null;
    case "join": return state.split && !state.packed ? { ...editing, split: false, packed: null } : null;
    case "pack-one":
    case "pack-two": return state.split && !state.packed ? { ...editing, packed: action === "pack-one" ? 1 : 2 } : null;
    case "unpack": return state.packed ? { ...editing, packed: null } : null;
    case "help": return { ...state, supported: true };
    case "show": return { ...editing, ...recipe, split: order.split, packed: order.split ? 1 : null, supported: true };
    case "serve": {
      const feedback = state.cheese !== recipe.cheese ? "cheese" :
        state.tomato !== recipe.tomato ? "tomato" : state.split !== order.split ? "split" :
        order.split && !state.packed ? "pack" : "";
      return feedback ? { ...state, feedback, wrong: state.wrong + 1 } : { ...state, served: true, feedback: "" };
    }
    case "next": return null;
  }
}

export function replayCafe(events: unknown) {
  if (!Array.isArray(events)) return null;
  let state = initial(0);
  for (const event of events) {
    if (!actions.includes(event)) return null;
    const next = reduce(state, event);
    if (!next) return null;
    state = next;
  }
  return state;
}
