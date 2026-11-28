import { expect, it } from "vitest";
import { replayCafe } from "../../src/typing/CafeShift";

it("keeps valid ingredients when the customer sends a sandwich back", () => {
  expect(replayCafe(["cheese", "tomato", "serve"])).toMatchObject({ cheese: true, tomato: true, feedback: "tomato" });
  expect(replayCafe(["cheese", "tomato", "serve", "tomato", "serve"])).toMatchObject({ served: true, wrong: 1 });
});

it("accepts either half after packing and requires unpacking before joining", () => {
  const orderTwo = ["cheese", "serve", "next", "cheese", "split"];
  for (const half of ["pack-one", "pack-two"]) {
    expect(replayCafe([...orderTwo, half, "serve"])).toMatchObject({ served: true, wrong: 0 });
    expect(replayCafe([...orderTwo, half, "join"])).toBeNull();
    expect(replayCafe([...orderTwo, half, "unpack", "join"])).toMatchObject({ split: false, packed: null, cheese: true });
  }
  expect(replayCafe(["pack-one"])).toBeNull();
  expect(replayCafe(["show", "serve", "serve"])).toBeNull();
  expect(replayCafe(["show", "serve"])).toMatchObject({ supported: true, served: true });
});
