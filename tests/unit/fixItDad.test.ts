import { expect, it } from "vitest";
import { replayWorkshop } from "../../src/typing/FixItDad";

it("tests the physical fault and accepts both stage sockets", () => {
  expect(replayWorkshop(["test"])).toMatchObject({ feedback: "blocked", checkpoint: null });
  expect(replayWorkshop(["remove-sign", "test"])).toMatchObject({ feedback: "stage" });
  for (const slot of ["stage-left", "stage-right"]) {
    expect(replayWorkshop(["remove-sign", slot, "test"])).toMatchObject({ checkpoint: slot, handle: true });
  }
});

it("undoes an experiment without replacing its valid checkpoint or requiring tag work", () => {
  const repair = ["remove-sign", "stage-right", "test"];
  expect(replayWorkshop([...repair, "handle", "test", "undo"])).toMatchObject({
    checkpoint: "stage-right", sign: "stage-right", handle: true, star: true,
  });
  expect(replayWorkshop([...repair, "remove-sign", "stage-left", "test", "restore"])).toMatchObject({
    checkpoint: "stage-right", sign: "stage-right", handle: true, feedback: "success",
  });
  expect(replayWorkshop(["stage-left"])).toBeNull();
  expect(replayWorkshop(["restore"])).toBeNull();
  expect(replayWorkshop(["star"])).toBeNull();
});
