/** Local origins and bounds match the viewBox of each independent SVG. */
export const sceneryAssets = {
  rock: { file: "rock.svg", x: -36, y: -26, width: 72, height: 52 },
  bush: { file: "bush.svg", x: -76, y: -70, width: 156, height: 104 },
  flower: { file: "flower.svg", x: -24, y: -34, width: 48, height: 48 },
  grassTuft: { file: "grass-tuft.svg", x: -30, y: -28, width: 56, height: 42 },
  dog: { file: "dog.svg", x: -100, y: -90, width: 210, height: 150 },
  barn: { file: "barn.svg", x: -100, y: 0, width: 440, height: 280 },
  silo: { file: "silo.svg", x: 0, y: 0, width: 80, height: 215 },
  hayBale: { file: "hay-bale.svg", x: -4, y: -4, width: 84, height: 47 },
  tree: { file: "tree.svg", x: -80, y: -115, width: 400, height: 295 },
  fence: { file: "fence.svg", x: -30, y: -30, width: 160, height: 110 },
} as const;
export type SceneryPlacement = {
  /** Stable per-instance ID, also available as data-scenery-id on its SVG group. */
  id: string;
  asset: keyof typeof sceneryAssets;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
};
/** Draw order is authored per stage; all props sit below sheep and gate controls. */
export const stageOneScenery: readonly SceneryPlacement[] = [
  { id: "barn", asset: "barn", x: 1190, y: -70 },
  { id: "silo", asset: "silo", x: 1388, y: -40 },
  { id: "hay-bale", asset: "hayBale", x: 1150, y: 133 },
  { id: "tree-northwest", asset: "tree", x: 0, y: 0 },
  { id: "fence-northwest", asset: "fence", x: 0, y: 235, rotation: 25 },
  { id: "fence-northeast", asset: "fence", x: 1492, y: 249, rotation: -25 },
  { id: "fence-southwest", asset: "fence", x: 0, y: 653, rotation: -17 },
  { id: "fence-southeast", asset: "fence", x: 1500, y: 644, rotation: 17 },
  { id: "bush-southwest", asset: "bush", x: 76, y: 868 },
  { id: "bush-southeast", asset: "bush", x: 1550, y: 859 },
  { id: "bush-north", asset: "bush", x: 1062, y: 58 },
  { id: "rock-west", asset: "rock", x: 388, y: 752 },
  { id: "rock-east", asset: "rock", x: 1110, y: 767 },
  { id: "flower-southwest", asset: "flower", x: 264, y: 721 },
  { id: "flower-southeast", asset: "flower", x: 1474, y: 725 },
  { id: "flower-northeast", asset: "flower", x: 1112, y: 255 },
  { id: "grass-northwest", asset: "grassTuft", x: 343, y: 324 },
  { id: "grass-southwest", asset: "grassTuft", x: 505, y: 818 },
  { id: "grass-southeast", asset: "grassTuft", x: 1022, y: 823 },
  { id: "grass-northeast", asset: "grassTuft", x: 1486, y: 383 },
  { id: "dog", asset: "dog", x: 179, y: 790 },
];

const levelScenery = Array.from({ length: 5 }, (_, level): readonly SceneryPlacement[] => [
  ...stageOneScenery.map((item) => item.asset === "flower" ? { ...item, rotation: level * 31, scale: 1 + level * 0.12 } : item),
  ...Array.from({ length: (level + 1) * 2 }, (_, i): SceneryPlacement => ({
    id: `round-${level}-garden-${i}`, asset: level % 2 ? "flower" : "grassTuft",
    x: 170 + i * 120, y: i % 2 ? 850 : 90, rotation: i * 27, scale: 0.9 + i % 3 * 0.15,
  })),
]);
export function sceneryForLevel(level: number): readonly SceneryPlacement[] { return levelScenery[level - 1]; }
