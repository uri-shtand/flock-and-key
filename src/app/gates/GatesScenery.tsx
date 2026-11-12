import { memo } from "react";
import { sceneryAssets, type SceneryPlacement } from "../../content/gatesScenery";

/** Separate groups let each prop be placed, replaced or animated independently. */
export const GatesScenery = memo(function GatesScenery({ items }: { items: readonly SceneryPlacement[] }) {
  return (
    <g aria-hidden="true" pointerEvents="none" data-testid="farm-scenery" clipPath="url(#gate-scenery-bounds)">
      <defs>
        <clipPath id="gate-scenery-bounds"><rect width="1600" height="900" /></clipPath>
      </defs>
      {items.map((item) => {
        const asset = sceneryAssets[item.asset];
        return (
          <g key={item.id} data-scenery-id={item.id} data-scenery-asset={item.asset}
            transform={`translate(${item.x} ${item.y}) rotate(${item.rotation ?? 0}) scale(${item.scale ?? 1})`}>
            <image href={`/assets/gates/scenery/${asset.file}`} x={asset.x} y={asset.y}
              width={asset.width} height={asset.height} />
          </g>
        );
      })}
    </g>
  );
});
