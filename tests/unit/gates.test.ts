import { levelConfig, validGatesConfig } from "../../src/content/gatesLevels";
import { validGatesSave, migrateGatesSave } from "../../src/progress/GatesStore";
import { describe, expect, it } from "vitest";
import { sceneryAssets, stageOneScenery } from "../../src/content/gatesScenery";
import { readFileSync } from "node:fs";
import { curvePath, gateDistances, pastureRoutes, routeLengths, sharedRoute, sheepPosition, shortcutPaths, routeForLevel, gateControls } from "../../src/content/gates";
import { initial, operateGate, tick, helpGate, nextGate, activeGateCount, medal, type Game } from "../../src/typing/GatesSimulation";
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
    let game: Game = { ...initial(levelConfig(1)), phase: "out" };
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
    let game: Game = { ...initial(levelConfig(1)), phase: "out" };
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
    let game: Game = { ...initial(levelConfig(1)), phase: "out" };
    expect(operateGate(game, 4)).toBe(game);
    game = advance(operateGate(game, 3), 15);
    expect(game.gates[3].open).toBe(false);
    expect(game.sheep[0].progress).toBeCloseTo(gateDistances[0] - 40);
    expect(game.waiting).toBeGreaterThan(0);
    expect(game.score).toBeLessThan(1000);
  });
  it("shares the lever, supports manual closing, and keeps pauses immutable", () => {
    let game: Game = { ...initial(levelConfig(1)), phase: "out" };
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

describe("five-level gates game", () => {
  for (const level of [1, 2, 3, 4, 5]) {
    it(`level ${level} can finish in both directions with its authored rules`, () => {
      const { gateDistances } = routeForLevel(level);
      let game: Game = { ...initial(levelConfig(level)), phase: "out" };
      let openings = 0;
      for (let i = 0; i < 4000 && game.phase !== "done"; i++) {
        const index = nextGate(game);
        // A real player can see and anticipate the next required gate.
        if (index !== null && !game.lever && game.sheep.some((s) => Math.abs(s.progress - gateDistances[index]) < 200)) {
          game = operateGate(game, index); openings++;
        }
        game = tick(game, 0.05);
        if (i % 100 === 0) {
          const snapshot: unknown = JSON.parse(JSON.stringify({ version: 2, game, best: [0, 0, 0, 0, 0] }));
          expect(validGatesSave(snapshot)).toBe(true);
        }
      }
      expect(game.phase).toBe("done");
      expect(game.sheep.every((s) => s.progress <= 0)).toBe(true);
      expect(openings).toBeGreaterThanOrEqual(activeGateCount(game) * 2);
      expect(game.assists).toBe(0);
      expect(game.time).toBeLessThan(100);
    });
  }
  it("starts with four controls and puts every unlocked gate on the level route", () => {
    expect(activeGateCount(initial())).toBe(4);
    for (const [index, count] of [4, 5, 6, 7, 9].entries()) {
      const level = index + 1;
      const game = initial(levelConfig(level));
      const route = routeForLevel(level);
      expect(game.gates).toHaveLength(count);
      expect(game.gates.every((g) => !g.open)).toBe(true);
      expect(operateGate({ ...game, phase: "out" }, count)).toMatchObject({ lever: null });
      for (const [i, distance] of route.gateDistances.entries()) {
        const position = sheepPosition(0, distance, level);
        expect(position.x).toBeCloseTo(gateControls[i].point.x);
        expect(position.y).toBeCloseTo(gateControls[i].point.y);
      }
    }
  });
  it("uses configurable gearbox and shorter opening time, refreshed by passage", () => {
    const config = { ...levelConfig(), gearboxSeconds: 0.3, openSeconds: 1.2 };
    let game: Game = { ...initial(config), phase: "out" };
    game = tick(operateGate(game, 0), 0.25);
    expect(game.gates[0].open).toBe(false);
    game = tick(game, 0.1);
    expect(game.gates[0].open).toBe(true);
    game = advance(game, 1.3);
    expect(game.gates[0].open).toBe(false);
    game.sheep[0].progress = gateDistances[0] - 5;
    game = helpGate(game);
    const deadline = game.gates[0].closingAt;
    game = tick(game, 0.05);
    expect(game.gates[0].closingAt).toBeGreaterThan(deadline);
  });
  it("does not close on an occupied gate, but closes after the crossing clears", () => {
    let game: Game = { ...initial(), phase: "out" };
    game.sheep[0].progress = gateDistances[0] + 10;
    game.gates[0] = { open: true, closingAt: 0 };
    game = tick(game, 0.05);
    expect(game.gates[0].open).toBe(true);
    game = advance(game, 0.3);
    expect(game.gates[0].open).toBe(false);
  });
  it("free rescue works while busy; zero score still finishes and earns a completion medal", () => {
    let game: Game = { ...initial(), phase: "out", waiting: 5000, score: 0 };
    game = helpGate(operateGate(game, 1));
    expect(game.lever).toBeNull();
    expect(game.gates[0].open).toBe(true);
    expect(game.assists).toBe(1);
    for (let i = 0; i < 3000 && game.phase !== "done"; i++) {
      const needed = nextGate(game);
      if (needed !== null && game.sheep.some((s) => Math.abs(s.progress - gateDistances[needed]) < 100)) game = helpGate(game);
      game = tick(game, 0.05);
    }
    expect(game.phase).toBe("done");
    expect(game.score).toBe(0);
    expect(medal(game)).toBe(1);
  });
  it("substeps large deltas and rejects invalid time without mutating the input", () => {
    const game: Game = { ...initial(), phase: "out" };
    const before = structuredClone(game);
    const large = tick(game, 1);
    const small = advance(game, 1);
    expect(large.sheep[0].progress).toBeCloseTo(small.sheep[0].progress);
    expect(tick(game, NaN)).toBe(game);
    expect(tick(game, -1)).toBe(game);
    expect(game).toEqual(before);
  });
  it("validates complete snapshots and rejects corrupted nested rules or movement", () => {
    const save = { version: 2, game: initial(), best: [0, 1, 2, 3, 0] };
    expect(validGatesSave(JSON.parse(JSON.stringify(save)))).toBe(true);
    expect(validGatesConfig({ ...levelConfig(), sheepCount: 900 })).toBe(false);
    expect(validGatesConfig({ ...levelConfig(), speed: Infinity })).toBe(false);
    expect(validGatesSave({ ...save, game: { ...save.game, sheep: [null, {}, 4] } })).toBe(false);
    expect(validGatesSave({ ...save, game: { ...save.game, lever: { gate: 7, action: "open", remaining: 0.1 } } })).toBe(false);
    expect(validGatesSave({ ...save, game: { ...save.game, duskProgress: 9 } })).toBe(false);
  });
});

describe("vintage shifter and route upgrade", () => {
  it("retains each gate's selected lever position and rejects busy shifts", () => {
    let game: Game = { ...initial(levelConfig(5)), phase: "out" };
    for (let gate = 0; gate < 9; gate++) {
      const before = game.selectedGate;
      game = operateGate(game, gate);
      expect(game.selectedGate).toBe(gate);
      expect(game.shiftFrom).toBe(before);
      expect(operateGate(game, (gate + 1) % 9)).toBe(game);
      game = advance(game, 0.5);
      expect(game.lever).toBeNull();
      expect(game.selectedGate).toBe(gate);
      expect(validGatesSave({ version: 2, game, best: [0, 0, 0, 0, 0] })).toBe(true);
    }
  });
  it("migrates old route progress to a new ready round, keeping medals and help preferences", () => {
    const old = { version: 1, game: { config: { ...levelConfig(3), openSeconds: 3, hints: false, reducedMotion: true } }, best: [3, 2, 1, 0, 0] };
    const migrated = migrateGatesSave(old)!;
    expect(migrated.version).toBe(2);
    expect(migrated.game.phase).toBe("ready");
    expect(migrated.game.gates).toHaveLength(6);
    expect(migrated.game.config).toMatchObject({ openSeconds: 2, hints: false, reducedMotion: true });
    expect(migrated.best).toEqual(old.best);
    expect(validGatesSave(migrated)).toBe(true);
    expect(migrateGatesSave({ ...old, best: [999] })).toBeNull();
    expect(validGatesSave({ ...migrated, game: { ...migrated.game, selectedGate: 8 } })).toBe(false);
  });
});
