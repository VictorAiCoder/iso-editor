# Isometric Coordinate System

## Parameters
- Projection: dimetric 2:1
- Tile: 64×32 px
- Grid: 100×100 cells, center at (0,0)
- Anchor: `{0.5, 1.0}` (bottom-center)

## Formulas
```typescript
// Grid → Screen
isoToPixel(x, y) → {
  x: (x - y) * HALF_TILE_W,
  y: (x + y) * HALF_TILE_H + HALF_TILE_H  // +HALF_TILE_H for anchor
}

// Screen → Grid
pixelToIso(px, py) → {
  x: (px / HALF_TILE_W + adjustedY / HALF_TILE_H) / 2,
  y: (adjustedY / HALF_TILE_H - px / HALF_TILE_W) / 2
}

// Snap to grid
snap(v, step = 1) → Math.round(v / step) * step

// Sprite scale
calcSpriteScale(entityScaleX, entityScaleY, flipX, texW, texH) → {
  scaleX: (flipX ? -1 : 1) * entityScaleX * TILE_W / texW,
  scaleY: entityScaleY * TILE_H / texH
}
```

## GridRect
- `cellX`/`cellY` = **bottom-left** corner
- Rectangle grows **up-right** (width → +x, height → +y)
- `width = |dx| + 1`, `height = |dy| + 1`

## Rules
1. **Coordinates in grid cells**, not pixels — always.
2. **`isoToPixel` adds `+HALF_TILE_H`** for anchor `{0.5, 1.0}`.
3. **`worldX`/`worldY` must sync with `x`/`y`** — on nudge, duplicate, drag.
4. **GridRect.cellX/cellY = bottom-left** — never top-left.
5. **Preview sprite positioning** must account for the anchor offset.
