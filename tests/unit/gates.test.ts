import { describe, expect, it } from "vitest";
import { sceneryAssets, stageOneScenery } from "../../src/content/gatesScenery";
import { readFileSync } from "node:fs";
import { curvePath, gateDistances, pastureRoutes, routeLengths, sharedRoute, sheepPosition, shortcutPaths } from "../../src/content/gates";
import { initial, operateGate, tick, type Game } from "../../src/typing/GatesSimulation";
function advance(game: Game, seconds: number): Game {
  for (let i = 0; i < seconds * 20; i++) game = tick(game, 0.05);
  return game;
}
describe("stage-one gate route", () => {
  it("matches the illustrated paths and has two distinct pasture destinations", () => {
    const background = readFileSync("public/assets/gates/farm-background.svg", "utf8");
    for (const path of [curvePath(sharedRoute), ...pastureRoutes.map(curvePath), ...shortcutPaths]) expect(background).toContain(`d="${path}"`);
    expect(sheepPosition(0, routeLengths[0])).toMatchObject({ x: 160, y: 510 });
    expect(sheepPosition(1, routeLengths[1])).toMatchObject({ x: 1440, y: 510 });
  });
  it("stops every sheep at each closed gate in order and completes both directions", () => {
    let game: Game = { ...initial(), phase: "out" };
    for (const [index, distance] of gateDistances.entries()) {
      game = advance(game, 25);
      expect(game.sheep.every((s) => s.progress < distance)).toBe(true);
      expect(game.sheep[0].progress).toBeCloseTo(distance - 40);
      // Opening only the gate needed now lets the entire flock through.
      game = advance(operateGate(game, index), 4);
      expect(game.sheep.every((s) => s.progress > distance)).toBe(true);
    }
    game = advance(game, 30);
    expect(game.phase).toBe("back");
    expect(game.sheep.every((s) => s.progress > gateDistances[3])).toBe(true);
    for (const index of [3, 2, 1, 0]) {
      game = advance(game, 30);
      expect(game.sheep.every((s) => s.progress > gateDistances[index])).toBe(true);
      game = advance(operateGate(game, index), 4);
      expect(game.sheep.every((s) => s.progress < gateDistances[index])).toBe(true);
    }
    game = advance(game, 20);
    expect(game.phase).toBe("done");
  });
  it("fades into dusk before returning automatically, without movement or waiting penalties during the fade", () => {
    let game: Game = { ...initial(), phase: "out" };
    game.sheep = game.sheep.map((s) => ({ ...s, progress: routeLengths[s.lane] - Math.floor(s.id / 2) * 64 }));
    game = tick(game, 0.05);
    expect(game.phase).toBe("regroup");
    const positions = game.sheep.map((s) => s.progress);
    const waiting = game.waiting;
    expect(operateGate(game, 0)).toBe(game);
    game = advance(game, 1);
    expect(game.phase).toBe("regroup");
    expect(game.duskProgress).toBeCloseTo(1 / 2.4);
    expect(game.sheep.map((s) => s.progress)).toEqual(positions);
    expect(game.waiting).toBe(waiting);
    game = advance(game, 2);
    expect(game.phase).toBe("back");
    expect(game.duskProgress).toBe(1);
    expect(game.sheep.every((s, index) => s.progress < positions[index])).toBe(true);
    expect(initial().duskProgress).toBe(0);
  });
  it("early opening does not bypass the first gate; locked gates reject commands", () => {
    let game: Game = { ...initial(), phase: "out" };
    expect(operateGate(game, 4)).toBe(game);
    game = advance(operateGate(game, 3), 15);
    expect(game.gates[3].open).toBe(false);
    expect(game.sheep[0].progress).toBeCloseTo(gateDistances[0] - 40);
    expect(game.waiting).toBeGreaterThan(0);
    expect(game.score).toBeLessThan(1000);
  });
  it("shares the lever, supports manual closing, and keeps pauses immutable", () => {
    let game: Game = { ...initial(), phase: "out" };
    game = operateGate(game, 0);
    expect(operateGate(game, 1)).toBe(game);
    game = advance(game, 1);
    expect(game.gates[0].open).toBe(true);
    game = advance(operateGate(game, 0), 1);
    expect(game.gates[0].open).toBe(false);
    const ready = initial();
    expect(tick(ready, 1)).toBe(ready);
  });
});

describe("independent scenery assets", () => {
  it("keeps every SVG self-contained with bounds matching the placement catalog", () => {
    for (const asset of Object.values(sceneryAssets)) {
      const svg = readFileSync(`public/assets/gates/scenery/${asset.file}`, "utf8");
      expect(svg).toContain(`viewBox="${asset.x} ${asset.y} ${asset.width} ${asset.height}"`);
      const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
      const references = [...svg.matchAll(/(?:href="#|url\(#)([^"\)]+)/g)].map((match) => match[1]);
      for (const reference of references) expect(ids.has(reference), `${asset.file}: missing ${reference}`).toBe(true);
    }
    expect(new Set(stageOneScenery.map((item) => item.id)).size).toBe(stageOneScenery.length);
  });
});
