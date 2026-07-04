// ============================================================
// CursorRenderer — Cell highlight with snap, updates cursorIso.
// Listens to pointermove on canvas (NOT stage events).
// ============================================================

import { Graphics } from 'pixi.js'
import type { Container } from 'pixi.js'
import { isoToPixel, pixelToIsoNearest } from './coords'
import type { CameraManager } from './CameraManager'
import type { useEditorStore } from '@/stores/editor'

export class CursorRenderer {
  cursorGraphics: Graphics
  cursorColor = 0xffff00
  fillAlpha = 0.3

  private _onPointerMove: (e: PointerEvent) => void
  private _rafId = 0

  private stage: Container
  private _camera: CameraManager
  private canvas: HTMLCanvasElement
  private store: ReturnType<typeof useEditorStore>

  constructor(
    stage: Container,
    _camera: CameraManager,
    canvas: HTMLCanvasElement,
    store: ReturnType<typeof useEditorStore>,
  ) {
    this.stage = stage
    this._camera = _camera
    this.canvas = canvas
    this.store = store

    this.cursorGraphics = new Graphics()
    this.cursorGraphics.label = 'cursor'
    this.cursorGraphics.eventMode = 'none'
    this.stage.addChild(this.cursorGraphics)

    this._onPointerMove = this.onPointerMove.bind(this)
    this.canvas.addEventListener('pointermove', this._onPointerMove)
  }

  private onPointerMove(e: PointerEvent): void {
    cancelAnimationFrame(this._rafId)
    this._rafId = requestAnimationFrame(() => {
      this.update(e.clientX, e.clientY)
    })
  }

  /**
   * Pipeline: screen coords → world coords → nearest iso cell → draw
   *
   * The cursor does NOT follow the mouse smoothly — it jumps from cell to cell.
   * pixelToIsoNearest prevents "jumping over" cells in isometric projection
   * by finding the cell whose center is closest to the mouse position.
   */
  update(screenX: number, screenY: number): void {
    const world = this._camera.screenToWorld(screenX, screenY)
    const iso = pixelToIsoNearest(world.x, world.y)

    this.store.updateCursorIso(iso.x, iso.y)
    this.drawCursor(iso.x, iso.y)
  }

  setVisible(visible: boolean): void {
    this.cursorGraphics.visible = visible
  }

  private drawCursor(isoX: number, isoY: number): void {
    const g = this.cursorGraphics
    g.clear()

    const top = isoToPixel(isoX, isoY)
    const right = isoToPixel(isoX + 1, isoY)
    const bottom = isoToPixel(isoX + 1, isoY + 1)
    const left = isoToPixel(isoX, isoY + 1)

    g.moveTo(top.x, top.y)
      .lineTo(right.x, right.y)
      .lineTo(bottom.x, bottom.y)
      .lineTo(left.x, left.y)
      .lineTo(top.x, top.y)
      .fill({ color: this.cursorColor, alpha: this.fillAlpha })
      .stroke({ width: 2, color: this.cursorColor })
  }

  destroy(): void {
    cancelAnimationFrame(this._rafId)
    this.canvas.removeEventListener('pointermove', this._onPointerMove)
    this.cursorGraphics.destroy({ children: true })
  }
}