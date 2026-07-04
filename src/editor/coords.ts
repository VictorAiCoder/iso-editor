// ============================================================
// ISO Editor — изометрические координаты
// Проекция: диметрия 2:1
// Тайл: 64x32 px
// ============================================================

/** Ширина тайла в пикселях */
export const TILE_W = 64

/** Высота тайла в пикселях */
export const TILE_H = 32

/** Половина ширины тайла */
export const HALF_TILE_W = TILE_W / 2

/** Половина высоты тайла */
export const HALF_TILE_H = TILE_H / 2

/**
 * Конвертирует изометрические координаты в экранные.
 * @param x - координата X в клетках сетки
 * @param y - координата Y в клетках сетки
 * @returns экранные координаты { x, y }
 */
export function isoToPixel(x: number, y: number): { x: number; y: number } {
  return {
    x: (x - y) * HALF_TILE_W,
    y: (x + y) * HALF_TILE_H + HALF_TILE_H, // +HALF_TILE_H для anchor 0.5, 1.0
  }
}

/**
 * Конвертирует экранные координаты в изометрические.
 * @param px - экранная координата X
 * @param py - экранная координата Y
 * @returns изометрические координаты { x, y }
 */
export function pixelToIso(px: number, py: number): { x: number; y: number } {
  const adjustedY = py - HALF_TILE_H
  return {
    x: (px / HALF_TILE_W + adjustedY / HALF_TILE_H) / 2,
    y: (adjustedY / HALF_TILE_H - px / HALF_TILE_W) / 2,
  }
}

/**
 * Converts pixel coordinates to the NEAREST iso cell (nearest-neighbor).
 * Checks the 4 candidate cells around the float iso position and picks
 * the one whose center is closest to the original pixel coordinates.
 * This prevents "jumping over" cells in isometric projection.
 */
export function pixelToIsoNearest(px: number, py: number): { x: number; y: number } {
  const floatIso = pixelToIso(px, py)
  const baseX = Math.floor(floatIso.x)
  const baseY = Math.floor(floatIso.y)

  // Check 4 candidate cells: (baseX, baseY), (baseX+1, baseY), (baseX, baseY+1), (baseX+1, baseY+1)
  let bestX = baseX
  let bestY = baseY
  let bestDist = Infinity

  for (let dx = 0; dx <= 1; dx++) {
    for (let dy = 0; dy <= 1; dy++) {
      const cx = baseX + dx
      const cy = baseY + dy
      // Cell center in pixel space
      const center = isoToPixel(cx + 0.5, cy + 0.5)
      const dist = (px - center.x) ** 2 + (py - center.y) ** 2
      if (dist < bestDist) {
        bestDist = dist
        bestX = cx
        bestY = cy
      }
    }
  }

  return { x: bestX, y: bestY }
}

/**
 * Округляет значение к ближайшему шагу сетки.
 * @param v - исходное значение
 * @param step - шаг привязки (по умолчанию 1)
 * @returns округлённое значение
 */
export function snap(v: number, step: number = 1): number {
  return Math.round(v / step) * step
}

/**
 * Округляет значение вниз к ближайшему шагу сетки.
 * Используйте для привязки курсора/выделения, чтобы избежать "перескакивания" через клетку.
 * @param v - исходное значение
 * @param step - шаг привязки (по умолчанию 1)
 * @returns округлённое вниз значение
 */
export function snapFloor(v: number, step: number = 1): number {
  return Math.floor(v / step) * step
}

/**
 * Вычисляет масштаб спрайта для изометрической проекции.
 */
export function calcSpriteScale(
  entityScaleX: number,
  entityScaleY: number,
  flipX: boolean,
  texWidth: number,
  texHeight: number,
): { scaleX: number; scaleY: number } {
  return {
    scaleX: (flipX ? -1 : 1) * entityScaleX * TILE_W / texWidth,
    scaleY: entityScaleY * TILE_H / texHeight,
  }
}
