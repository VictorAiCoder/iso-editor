// ============================================================
// GridRenderer — Isometric grid 100×100 + range highlight
// Grid lines drawn in world space (stage transform applies).
// ============================================================

import { Graphics } from 'pixi.js'
import type { Container } from 'pixi.js'
import { watch } from 'vue'
import { isoToPixel } from './coords'
import type { useEditorStore } from '@/stores/editor'
import type { GridRect } from '@/types/scene'

export class GridRenderer {
  readonly GRID_COLS = 100
  readonly GRID_ROWS = 100
  readonly lineColor = 0x333333
  readonly lineWidth = 1
  readonly highlightColor = 0x00ff88

   gridGraphics: Graphics
   highlightGraphics: Graphics

   private _stopWatch: (() => void) | null = null

   private stage: Container
   private store: ReturnType<typeof useEditorStore>

   constructor(
     stage: Container,
     store: ReturnType<typeof useEditorStore>,
   ) {
     this.stage = stage
     this.store = store

    this.gridGraphics = new Graphics()
    this.gridGraphics.label = 'grid'
    this.gridGraphics.eventMode = 'none'
    this.stage.addChild(this.gridGraphics)

    this.highlightGraphics = new Graphics()
    this.highlightGraphics.label = 'highlight'
    this.highlightGraphics.eventMode = 'none'
    this.stage.addChild(this.highlightGraphics)

    this.draw()

    // Sync grid visibility from store
    this._stopWatch = watch(
      () => this.store.gridVisible,
      (visible) => this.setVisible(visible),
      { immediate: true },
    )
  }

  // ── Draw iso grid ──────────────────────────────────────────

  draw(): void {
    const g = this.gridGraphics
    g.clear()

    // Columns: vertical iso lines for each x (0..100)
    for (let x = 0; x <= this.GRID_COLS; x++) {
      const start = isoToPixel(x, 0)
      const end = isoToPixel(x, this.GRID_ROWS)
      g.moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ width: this.lineWidth, color: this.lineColor })
    }

    // Rows: horizontal iso lines for each y (0..100)
    for (let y = 0; y <= this.GRID_ROWS; y++) {
      const start = isoToPixel(0, y)
      const end = isoToPixel(this.GRID_COLS, y)
      g.moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ width: this.lineWidth, color: this.lineColor })
    }
  }

  // ── Highlight a grid rectangle ─────────────────────────────

  highlightRange(rect: GridRect | null): void {
    const g = this.highlightGraphics
    g.clear()
    if (!rect) return

    // Bounding parallelogram covering all cell diamonds in the GridRect
    // Cells span from (cellX, cellY - height + 1) to (cellX + width - 1, cellY)
    // Each cell diamond goes from isoToPixel(x,y) to isoToPixel(x+1,y+1)
    const p1 = isoToPixel(rect.cellX, rect.cellY - rect.height + 1)
    const p2 = isoToPixel(rect.cellX + rect.width, rect.cellY - rect.height + 1)
    const p3 = isoToPixel(rect.cellX + rect.width, rect.cellY + 1)
    const p4 = isoToPixel(rect.cellX, rect.cellY + 1)

    g.moveTo(p1.x, p1.y)
      .lineTo(p2.x, p2.y)
      .lineTo(p3.x, p3.y)
      .lineTo(p4.x, p4.y)
      .lineTo(p1.x, p1.y)
      .fill({ color: this.highlightColor, alpha: 0.2 })
      .stroke({ width: 1, color: this.highlightColor, alpha: 0.5 })
  }

  // ── Visibility ─────────────────────────────────────────────

  setVisible(visible: boolean): void {
    this.gridGraphics.visible = visible
  }

  // ── Cleanup ────────────────────────────────────────────────

  destroy(): void {
    this._stopWatch?.()
    this.gridGraphics.destroy()
    this.highlightGraphics.destroy()
  }
}