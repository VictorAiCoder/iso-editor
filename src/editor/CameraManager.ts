// ============================================================
// CameraManager — Pan (middle mouse drag) + Zoom (wheel 1–4×)
// Pan updates store.pan; Zoom updates store.zoom.
// IsoRenderer watches store changes → calls applyTransform().
// ============================================================

import type { Container } from 'pixi.js'
import type { useEditorStore } from '@/stores/editor'

export class CameraManager {
  /** True while the user drags with middle mouse button */
  isPanning = false
  /** Screen-space position where current pan started */
  panStart: { x: number; y: number } | null = null

  // Bound handler references (needed for removeEventListener)
  private _pointerDown: (e: PointerEvent) => void
  private _pointerMove: (e: PointerEvent) => void
  private _pointerUp: (e: PointerEvent) => void
  private _wheel: (e: WheelEvent) => void

  private stage: Container
  private canvas: HTMLCanvasElement
  private store: ReturnType<typeof useEditorStore>

  constructor(
    stage: Container,
    canvas: HTMLCanvasElement,
    store: ReturnType<typeof useEditorStore>,
  ) {
    this.stage = stage
    this.canvas = canvas
    this.store = store

    this._pointerDown = this.onPointerDown.bind(this)
    this._pointerMove = this.onPointerMove.bind(this)
    this._pointerUp = this.onPointerUp.bind(this)
    this._wheel = this.onWheel.bind(this)

    this.canvas.addEventListener('pointerdown', this._pointerDown)
    this.canvas.addEventListener('pointermove', this._pointerMove)
    this.canvas.addEventListener('pointerup', this._pointerUp)
    this.canvas.addEventListener('wheel', this._wheel, { passive: false })
  }

  // ── Pan: middle mouse button (button === 1) ────────────────

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 1) return
    e.preventDefault()
    this.isPanning = true
    this.panStart = { x: e.clientX, y: e.clientY }
    this.canvas.style.cursor = 'grabbing'
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isPanning || !this.panStart) return
    const dx = e.clientX - this.panStart.x
    const dy = e.clientY - this.panStart.y
    this.panStart = { x: e.clientX, y: e.clientY }
    this.store.setPan({
      x: this.store.pan.x + dx,
      y: this.store.pan.y + dy,
    })
  }

  private onPointerUp(e: PointerEvent): void {
    if (e.button !== 1 || !this.isPanning) return
    this.isPanning = false
    this.panStart = null
    this.canvas.style.cursor = ''
  }

  // ── Zoom: wheel, center on cursor ──────────────────────────

  private onWheel(e: WheelEvent): void {
    e.preventDefault()
    const { zoom, pan } = this.store
    const delta = e.deltaY > 0 ? -1 : 1
    const newZoom = Math.max(1, Math.min(4, zoom + delta))
    if (newZoom === zoom) return

    // Keep the world point under cursor fixed after zoom
    const rect = this.canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top
    const ratio = newZoom / zoom
    this.store.setZoom(newZoom)
    this.store.setPan({
      x: canvasX - (canvasX - pan.x) * ratio,
      y: canvasY - (canvasY - pan.y) * ratio,
    })
  }

  // ── Coordinate conversions ─────────────────────────────────

  /** Screen pixel → world pixel (viewport → canvas → unzoom/unpan) */
  screenToWorld(px: number, py: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const canvasX = px - rect.left
    const canvasY = py - rect.top
    return {
      x: (canvasX - this.store.pan.x) / this.store.zoom,
      y: (canvasY - this.store.pan.y) / this.store.zoom,
    }
  }

  /** World pixel → screen pixel (pan/zoom → canvas → viewport) */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: wx * this.store.zoom + this.store.pan.x + rect.left,
      y: wy * this.store.zoom + this.store.pan.y + rect.top,
    }
  }

  /** Canvas element offset from viewport origin */
  getCanvasOffset(): { left: number; top: number } {
    const rect = this.canvas.getBoundingClientRect()
    return { left: rect.left, top: rect.top }
  }

  // ── Transform ──────────────────────────────────────────────

  /** Apply current zoom/pan from store to stage */
  applyTransform(): void {
    const zoom = this.store.zoom
    this.stage.scale.x = zoom
    this.stage.scale.y = zoom
    this.stage.position.x = this.store.pan.x
    this.stage.position.y = this.store.pan.y
  }

  // ── Cleanup ────────────────────────────────────────────────

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this._pointerDown)
    this.canvas.removeEventListener('pointermove', this._pointerMove)
    this.canvas.removeEventListener('pointerup', this._pointerUp)
    this.canvas.removeEventListener('wheel', this._wheel)
    this.canvas.style.cursor = ''
  }
}