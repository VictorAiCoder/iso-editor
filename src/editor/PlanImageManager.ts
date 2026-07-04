// ============================================================
// PlanImageManager — PlanImage rendering lifecycle.
// Projects raster images into the isometric grid plane using
// skew, per-cell diamond mask, and bounding-box scaling.
// Intended to be called by IsoRenderer which owns the watcher.
// ============================================================

import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import { isoToPixel, pixelToIso, TILE_W, TILE_H, HALF_TILE_W, HALF_TILE_H } from './coords'
import type { useSceneStore } from '@/stores/scene'
import type { useEditorStore } from '@/stores/editor'
import type { PlanImage } from '@/types/scene'

type Edge = 'bottom' | 'right' | 'top' | 'left'

export class PlanImageManager {
  readonly container: Container

  private readonly _stage: Container
  private readonly _sceneStore: ReturnType<typeof useSceneStore>
  private readonly _editorStore: ReturnType<typeof useEditorStore>
  private readonly _canvas: HTMLCanvasElement
  private readonly _groupMap = new Map<string, Container>()
  private _selectedPlanId: string | null = null
  private _handleContainer: Container | null = null
  private _activeHandle: Container | null = null
  private _previewGraphic: Graphics | null = null
  private _resizeState: {
    edge: Edge
    planId: string
    startWidth: number
    startHeight: number
    startCellX: number
    startCellY: number
    startIsoX: number
    startIsoY: number
    currentCellX: number
    currentCellY: number
    currentWidth: number
    currentHeight: number
  } | null = null
  private _onDomMove!: (e: PointerEvent) => void
  private _onDomUp!: (e: PointerEvent) => void

  constructor(
    stage: Container,
    sceneStore: ReturnType<typeof useSceneStore>,
    editorStore: ReturnType<typeof useEditorStore>,
    canvas: HTMLCanvasElement,
  ) {
    this._stage = stage
    this.container = new Container()
    this.container.label = 'plan-images'
    stage.addChildAt(this.container, 0)
    this._sceneStore = sceneStore
    this._editorStore = editorStore
    this._canvas = canvas
    this.container.eventMode = 'static'
  }

  /**
   * Full re-sync with sceneStore.planImages.
   * Removes deleted plans and recreates all existing ones.
   */
  renderAll(): void {
    const plans = this._sceneStore.planImages
    const planIds = new Set(plans.map(p => p.id))

    // Remove groups for plans that no longer exist
    for (const [id, group] of this._groupMap) {
      if (!planIds.has(id)) {
        this._destroyGroup(id, group)
      }
    }

    // Full re-render: destroy old, create fresh
    for (const plan of plans) {
      const existing = this._groupMap.get(plan.id)
      if (existing) {
        this._destroyGroup(plan.id, existing)
      }
      this._createPlanGroup(plan)
    }
  }

  /** Show resize handles for the given plan ID, or hide if null */
  showHandles(planId: string | null): void {
    this._clearHandles()
    this._selectedPlanId = planId
    if (!planId) return

    const plan = this._sceneStore.planImages.find(p => p.id === planId)
    if (!plan) return
    this._createHandles(plan)
  }

  private _clearHandles(): void {
    // Remove DOM listeners if a resize is in progress
    if (this._resizeState) {
      this._canvas.removeEventListener('pointermove', this._onDomMove)
      this._canvas.removeEventListener('pointerup', this._onDomUp)
      this._canvas.removeEventListener('pointerupoutside', this._onDomUp)
    }

    if (this._previewGraphic) {
      this._previewGraphic.destroy()
      this._previewGraphic = null
    }

    if (this._handleContainer) {
      this._handleContainer.destroy({ children: true })
      this._handleContainer = null
    }
    this._resizeState = null
    this._activeHandle = null
  }

  // ── Edge handles ───────────────────────────────────────────

  private _createHandles(plan: PlanImage): void {
    const container = new Container()
    container.label = `handles-${plan.id}`
    container.eventMode = 'static'
    this.container.addChild(container)
    this._handleContainer = container

    // Keep handles at constant screen size regardless of zoom
    container.scale.set(1 / this._editorStore.zoom)

    const edges: Edge[] = ['bottom', 'right', 'top', 'left']
    const cursors: Record<Edge, string> = {
      bottom: 'ew-resize',
      top: 'ew-resize',
      right: 'ns-resize',
      left: 'ns-resize',
    }

    for (const edge of edges) {
      const edgeContainer = new Container()
      edgeContainer.label = `handle-${edge}`
      edgeContainer.eventMode = 'static'
      edgeContainer.cursor = cursors[edge]

      // Compute hit area for the edge (in world coordinates)
      const hitArea = this._computeEdgeHitArea(edge, plan)
      edgeContainer.hitArea = hitArea

      // Hover effects
      edgeContainer.on('pointerover', () => {
        const outline = this._drawEdgeOutline(edge, plan)
        outline.label = 'hover-outline'
        edgeContainer.addChild(outline)
      })
      edgeContainer.on('pointerout', () => {
        const outline = edgeContainer.getChildByLabel('hover-outline')
        if (outline) outline.destroy()
      })

      edgeContainer.on('pointerdown', (e: any) => {
        console.log('handle pointerdown', edge)
        this._startResizeWithDrag(edge, plan, edgeContainer, e)
      })

      container.addChild(edgeContainer)
    }
  }

  private _computeEdgeHitArea(edge: Edge, plan: PlanImage): Rectangle {
    const { cellX, cellY, width, height } = plan
    let corners: { x: number; y: number }[]

    switch (edge) {
      case 'bottom':
        corners = [
          isoToPixel(cellX, cellY),
          isoToPixel(cellX + width, cellY),
          isoToPixel(cellX + width, cellY + 1),
          isoToPixel(cellX, cellY + 1),
        ]
        break
      case 'top':
        corners = [
          isoToPixel(cellX, cellY - height + 1),
          isoToPixel(cellX + width, cellY - height + 1),
          isoToPixel(cellX + width, cellY - height + 2),
          isoToPixel(cellX, cellY - height + 2),
        ]
        break
      case 'left':
        corners = [
          isoToPixel(cellX, cellY - height + 1),
          isoToPixel(cellX + 1, cellY - height + 1),
          isoToPixel(cellX + 1, cellY + 1),
          isoToPixel(cellX, cellY + 1),
        ]
        break
      case 'right':
        corners = [
          isoToPixel(cellX + width - 1, cellY - height + 1),
          isoToPixel(cellX + width, cellY - height + 1),
          isoToPixel(cellX + width, cellY + 1),
          isoToPixel(cellX + width - 1, cellY + 1),
        ]
        break
    }

    const xs = corners.map(c => c.x)
    const ys = corners.map(c => c.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    return new Rectangle(minX, minY, maxX - minX, maxY - minY)
  }

  private _drawEdgeOutline(edge: Edge, plan: PlanImage): Graphics {
    const { cellX, cellY, width, height } = plan
    let corners: { x: number; y: number }[]

    switch (edge) {
      case 'bottom':
        corners = [
          isoToPixel(cellX, cellY + 1),           // shifted down by 1
          isoToPixel(cellX + width, cellY + 1),
          isoToPixel(cellX + width, cellY + 2),
          isoToPixel(cellX, cellY + 2),
        ]
        break
      case 'top':
        corners = [
          isoToPixel(cellX, cellY - height),       // shifted up by 1
          isoToPixel(cellX + width, cellY - height),
          isoToPixel(cellX + width, cellY - height + 1),
          isoToPixel(cellX, cellY - height + 1),
        ]
        break
      case 'left':
        corners = [
          isoToPixel(cellX - 1, cellY - height + 1), // shifted left by 1
          isoToPixel(cellX, cellY - height + 1),
          isoToPixel(cellX, cellY + 1),
          isoToPixel(cellX - 1, cellY + 1),
        ]
        break
      case 'right':
        corners = [
          isoToPixel(cellX + width, cellY - height + 1), // shifted right by 1
          isoToPixel(cellX + width + 1, cellY - height + 1),
          isoToPixel(cellX + width + 1, cellY + 1),
          isoToPixel(cellX + width, cellY + 1),
        ]
        break
    }

    const g = new Graphics()
    g.moveTo(corners[0].x, corners[0].y)
    for (let i = 1; i < corners.length; i++) {
      g.lineTo(corners[i].x, corners[i].y)
    }
    g.closePath()
    g.fill({ color: 0xff9800, alpha: 0.1 })
    g.stroke({ width: 2, color: 0xff9800, alpha: 0.6 })
    return g
  }

  // ── Drag resize logic ──────────────────────────────────────

  private _moveCounter = 0

  private _clientToIso(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this._canvas.getBoundingClientRect()
    const screenX = clientX - rect.left
    const screenY = clientY - rect.top
    const worldX = (screenX - this._editorStore.pan.x) / this._editorStore.zoom
    const worldY = (screenY - this._editorStore.pan.y) / this._editorStore.zoom
    return pixelToIso(worldX, worldY)
  }

  private _startResizeWithDrag(
    edge: Edge,
    plan: PlanImage,
    handle: Container,
    e: any,
  ): void {
    console.log('startResize', edge, plan.id)

    const nativeEvent = e.nativeEvent ?? e.originalEvent ?? e
    const startIso = this._clientToIso(nativeEvent.clientX, nativeEvent.clientY)

    this._resizeState = {
      edge,
      planId: plan.id,
      startWidth: plan.width,
      startHeight: plan.height,
      startCellX: plan.cellX,
      startCellY: plan.cellY,
      startIsoX: startIso.x,
      startIsoY: startIso.y,
      currentCellX: plan.cellX,
      currentCellY: plan.cellY,
      currentWidth: plan.width,
      currentHeight: plan.height,
    }
    this._activeHandle = handle

    this._onDomMove = (evt: PointerEvent) => this._handleDomMove(evt)
    this._onDomUp = (evt: PointerEvent) => this._handleDomUp(evt)

    this._canvas.addEventListener('pointermove', this._onDomMove)
    this._canvas.addEventListener('pointerup', this._onDomUp)
    this._canvas.addEventListener('pointerupoutside', this._onDomUp)
  }

  private _handleDomMove = (e: PointerEvent): void => {
    if (!this._resizeState) return
    this._moveCounter++

    const currentIso = this._clientToIso(e.clientX, e.clientY)
    const deltaIsoX = currentIso.x - this._resizeState.startIsoX
    const deltaIsoY = currentIso.y - this._resizeState.startIsoY

    let newCellX = this._resizeState.startCellX
    let newCellY = this._resizeState.startCellY
    let newWidth = this._resizeState.startWidth
    let newHeight = this._resizeState.startHeight

    switch (this._resizeState.edge) {
      case 'bottom': {
        const delta = Math.round(deltaIsoY)
        newCellY = this._resizeState.startCellY + delta
        newHeight = this._resizeState.startHeight + delta
        break
      }
      case 'top': {
        const delta = Math.round(-deltaIsoY)
        newHeight = this._resizeState.startHeight + delta
        // cellY unchanged
        break
      }
      case 'right': {
        const delta = Math.round(deltaIsoX)
        newWidth = this._resizeState.startWidth + delta
        // cellX unchanged
        break
      }
      case 'left': {
        const delta = Math.round(-deltaIsoX)
        newCellX = this._resizeState.startCellX - delta
        newWidth = this._resizeState.startWidth + delta
        break
      }
    }

    // Clamp to minimum size
    newWidth = Math.max(1, newWidth)
    newHeight = Math.max(1, newHeight)

    if (this._moveCounter % 10 === 0) {
      console.log('handleMove', { edge: this._resizeState.edge, deltaIsoX, deltaIsoY, newCellX, newCellY, newWidth, newHeight })
    }

    this._resizeState.currentCellX = newCellX
    this._resizeState.currentCellY = newCellY
    this._resizeState.currentWidth = newWidth
    this._resizeState.currentHeight = newHeight

    const plan = this._sceneStore.planImages.find(p => p.id === this._resizeState!.planId)
    if (!plan) return

    const group = this._groupMap.get(plan.id)
    if (!group) return

    const sprite = group.children.find(c => c.label?.startsWith('plan-')) as Sprite
    if (!sprite) return

    // Update sprite position and scale
    const bbox = this._computeBoundingBoxFromDims(newCellX, newCellY, newWidth, newHeight)
    sprite.position.set(bbox.centerX, bbox.centerY)
    const texture = sprite.texture
    if (texture && texture.width > 0 && texture.height > 0) {
      const uniformScale = Math.min(bbox.pixelWidth / texture.width, bbox.pixelHeight / texture.height)
      sprite.scale.set(uniformScale)
    }

    // Update mask
    const mask = group.children.find(c => c.label?.startsWith('plan-mask-')) as Graphics
    if (mask) {
      mask.clear()
      for (let dx = 0; dx < newWidth; dx++) {
        for (let dy = 0; dy < newHeight; dy++) {
          const gx = newCellX + dx
          const gy = newCellY - dy
          const center = isoToPixel(gx, gy)
          mask.moveTo(center.x, center.y - HALF_TILE_H)
            .lineTo(center.x + HALF_TILE_W, center.y)
            .lineTo(center.x, center.y + HALF_TILE_H)
            .lineTo(center.x - HALF_TILE_W, center.y)
            .closePath()
        }
      }
      mask.fill({ color: 0xffffff })
    }

    // Update preview
    if (this._previewGraphic) {
      this._previewGraphic.destroy()
      this._previewGraphic = null
    }
    this._previewGraphic = this._drawPreviewRect(newCellX, newCellY, newWidth, newHeight)
    this._previewGraphic.label = 'resize-preview'
    this.container.addChild(this._previewGraphic)
  }

  private _handleDomUp = (_e: PointerEvent): void => {
    this._canvas.removeEventListener('pointermove', this._onDomMove)
    this._canvas.removeEventListener('pointerup', this._onDomUp)
    this._canvas.removeEventListener('pointerupoutside', this._onDomUp)

    if (this._previewGraphic) {
      this._previewGraphic.destroy()
      this._previewGraphic = null
    }

    if (this._resizeState) {
      const { planId, currentCellX, currentCellY, currentWidth, currentHeight } = this._resizeState
      console.log('handleUp', { currentCellX, currentCellY, currentWidth, currentHeight })
      this._sceneStore.updatePlanImage(planId, {
        cellX: currentCellX,
        cellY: currentCellY,
        width: currentWidth,
        height: currentHeight,
      })
    }

    this._resizeState = null
    this._activeHandle = null
  }

  private _drawPreviewRect(cellX: number, cellY: number, width: number, height: number): Graphics {
    const corners = [
      isoToPixel(cellX, cellY - height + 1),
      isoToPixel(cellX + width, cellY - height + 1),
      isoToPixel(cellX + width, cellY + 1),
      isoToPixel(cellX, cellY + 1),
    ]
    const g = new Graphics()
    this._drawDashedPolygon(g, corners, 8, 4)
    g.stroke({ width: 2, color: 0x00ff88, alpha: 0.8 })
    return g
  }

  private _drawDashedPolygon(
    g: Graphics,
    points: { x: number; y: number }[],
    dashLength: number,
    gapLength: number,
  ): void {
    for (let i = 0; i < points.length; i++) {
      const start = points[i]!
      const end = points[(i + 1) % points.length]!
      const segDx = end.x - start.x
      const segDy = end.y - start.y
      const segLen = Math.sqrt(segDx * segDx + segDy * segDy)
      if (segLen === 0) continue
      const steps = Math.ceil(segLen / (dashLength + gapLength))

      for (let s = 0; s < steps; s++) {
        const t0 = s * (dashLength + gapLength) / segLen
        const t1 = Math.min(1, (s * (dashLength + gapLength) + dashLength) / segLen)
        if (t0 >= 1) break

        const x0 = start.x + segDx * t0
        const y0 = start.y + segDy * t0
        const x1 = start.x + segDx * t1
        const y1 = start.y + segDy * t1

        g.moveTo(x0, y0)
        g.lineTo(x1, y1)
      }
    }
  }

  /** Destroy all groups and the container itself. */
  destroy(): void {
    this._clearHandles()
    for (const [id, group] of this._groupMap) {
      this._destroyGroup(id, group)
    }
    this.container.destroy({ children: true })
  }

  // ── Private lifecycle ──────────────────────────────────────

  private _destroyGroup(id: string, group: Container): void {
    this.container.removeChild(group)
    group.destroy({ children: true })
    this._groupMap.delete(id)
  }

  private _createPlanGroup(plan: PlanImage): void {
    const group = new Container()
    group.label = `plan-group-${plan.id}`
    this.container.addChild(group)
    this._groupMap.set(plan.id, group)

    // Mask must be added as a child of the group and set on the sprite
    const mask = this._createMask(plan)
    group.addChild(mask)

    const sprite = this._createSprite(plan)
    sprite.mask = mask
    group.addChild(sprite)
  }

  // ── Mask: per-cell diamond union ───────────────────────────

  private _createMask(plan: PlanImage): Graphics {
    const g = this._createMaskFromDims(plan.cellX, plan.cellY, plan.width, plan.height)
    g.label = `plan-mask-${plan.id}`
    return g
  }

  private _createMaskFromDims(
    cellX: number,
    cellY: number,
    width: number,
    height: number,
  ): Graphics {
    const g = new Graphics()

    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        const gx = cellX + dx
        const gy = cellY - dy
        const center = isoToPixel(gx, gy)

        g.moveTo(center.x, center.y - HALF_TILE_H)
          .lineTo(center.x + HALF_TILE_W, center.y)
          .lineTo(center.x, center.y + HALF_TILE_H)
          .lineTo(center.x - HALF_TILE_W, center.y)
          .closePath()
      }
    }

    g.fill({ color: 0xffffff })
    return g
  }

  // ── Sprite with skew + isometric projection ────────────────

  private _createSprite(plan: PlanImage): Sprite {
    const texture = this._loadTexture(plan)
    const bbox = this._computeBoundingBox(plan)

    const sprite = new Sprite(texture)
    sprite.label = `plan-${plan.id}`
    sprite.anchor.set(0.5, 0.5)
    sprite.position.set(bbox.centerX, bbox.centerY)
    sprite.skew.set(
      -Math.atan2(TILE_W, TILE_H),  // skewX ≈ -63.4° — vertical lines go ↙
      Math.atan2(TILE_H, TILE_W),   // skewY ≈ 26.6° — horizontal lines go ↘
    )
    sprite.alpha = Math.max(0, Math.min(1, plan.opacity))

    // Guard against degenerate dimensions
    if (bbox.pixelWidth > 0 && bbox.pixelHeight > 0 && texture.width > 0 && texture.height > 0) {
      // Use uniform scale so the entire image is visible (no stretching/cropping)
      const uniformScale = Math.min(bbox.pixelWidth / texture.width, bbox.pixelHeight / texture.height)
      sprite.scale.set(uniformScale)
    }

    return sprite
  }

  // ── Texture loading with fallback ──────────────────────────

  private _loadTexture(plan: PlanImage): Texture {
    try {
      const img = new Image()
      img.src = plan.dataUrl

      if (img.complete && img.naturalWidth > 0) {
        const rotation = plan.rotation ?? 0
        const radians = rotation * Math.PI / 180

        // Calculate dimensions after rotation (swap for 90/270)
        let canvasWidth = img.naturalWidth
        let canvasHeight = img.naturalHeight
        if (rotation === 90 || rotation === 270) {
          canvasWidth = img.naturalHeight
          canvasHeight = img.naturalWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext('2d')!

        // Translate to center, rotate, draw from center
        ctx.translate(canvasWidth / 2, canvasHeight / 2)
        ctx.rotate(radians)
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)

        return Texture.from(canvas)
      }

      // Fallback to Texture.from if HTMLImageElement didn't load synchronously
      const tex = Texture.from(plan.dataUrl)
      if (tex.width > 0 && tex.height > 0) return tex
    } catch {
      // Fall through to fallback
    }
    return this._createFallbackTexture()
  }

  private _createFallbackTexture(): Texture {
    const canvas = document.createElement('canvas')
    canvas.width = TILE_W
    canvas.height = TILE_H
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(239, 83, 80, 0.3)'
    ctx.fillRect(0, 0, TILE_W, TILE_H)
    ctx.strokeStyle = '#ef5350'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, TILE_W, TILE_H)
    return Texture.from(canvas)
  }

  // ── Bounding box ───────────────────────────────────────────

  /**
   * Compute the screen-space axis-aligned bounding box of an isometric
   * rectangle defined by a PlanImage's GridRect.
   *
   * Formula (corrected from v2-draft §4.4 — uses width-1, height-1
   * so that the right/top edges align with the actual cells rather
   * than overshooting by one tile).
   */
  private _computeBoundingBox(plan: PlanImage): {
    centerX: number
    centerY: number
    pixelWidth: number
    pixelHeight: number
  } {
    return this._computeBoundingBoxFromDims(plan.cellX, plan.cellY, plan.width, plan.height)
  }

  private _computeBoundingBoxFromDims(
    cellX: number,
    cellY: number,
    width: number,
    height: number,
  ): {
    centerX: number
    centerY: number
    pixelWidth: number
    pixelHeight: number
  } {
    const leftX = isoToPixel(cellX, cellY).x - HALF_TILE_W

    const rightX =
      isoToPixel(
        cellX + width - 1,
        cellY - height + 1,
      ).x + HALF_TILE_W

    const topY =
      isoToPixel(
        cellX,
        cellY - height + 1,
      ).y - HALF_TILE_H

    const bottomY =
      isoToPixel(
        cellX + width - 1,
        cellY,
      ).y + HALF_TILE_H

    return {
      centerX: (leftX + rightX) / 2,
      centerY: (topY + bottomY) / 2,
      pixelWidth: rightX - leftX,
      pixelHeight: bottomY - topY,
    }
  }
}
