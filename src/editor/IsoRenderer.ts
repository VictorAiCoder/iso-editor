// ============================================================
// IsoRenderer — Facade: Pixi Application lifecycle + 5 managers.
// Owns the Application; managers are created in dependency order.
// ============================================================

import { Application, Container, Sprite } from 'pixi.js'
import { watch, type WatchStopHandle } from 'vue'
import { CameraManager } from './CameraManager'
import { GridRenderer } from './GridRenderer'
import { CursorRenderer } from './CursorRenderer'
import { LayerManager } from './LayerManager'
import { SpriteManager } from './SpriteManager'
import { PlanImageManager } from './PlanImageManager'
import { isoToPixel, calcSpriteScale } from './coords'
import type { useEditorStore } from '@/stores/editor'
import type { useSceneStore } from '@/stores/scene'
import type { useCatalogStore } from '@/stores/catalog'
import type { GridRect } from '@/types/scene'

export class IsoRenderer {
  readonly app: Application
  stage: Container

  camera!: CameraManager
  grid!: GridRenderer
  cursor!: CursorRenderer
  layers!: LayerManager
  sprites!: SpriteManager
  planImages!: PlanImageManager

  private _previewSprite: Sprite | null = null

  private _isInitialized = false
  private _watchers: WatchStopHandle[] = []

  private readonly _canvas: HTMLCanvasElement
  private readonly _editorStore: ReturnType<typeof useEditorStore>
  private readonly _sceneStore: ReturnType<typeof useSceneStore>
  private readonly _catalogStore: ReturnType<typeof useCatalogStore>

  constructor(
    _canvas: HTMLCanvasElement,
    _editorStore: ReturnType<typeof useEditorStore>,
    _sceneStore: ReturnType<typeof useSceneStore>,
    _catalogStore: ReturnType<typeof useCatalogStore>,
  ) {
    this._canvas = _canvas
    this._editorStore = _editorStore
    this._sceneStore = _sceneStore
    this._catalogStore = _catalogStore

    this.app = new Application()
    this.stage = new Container()
    this.stage.eventMode = 'static'
  }

  get isInitialized(): boolean {
    return this._isInitialized
  }

  // ── Lifecycle ──────────────────────────────────────────────

  async init(): Promise<void> {
    await this.app.init({
      background: '#1a1a2e',
      antialias: false,
      resolution: 1,
    })

    // Attach Pixi canvas to the host element
    this._canvas.replaceWith(this.app.canvas)
    this.app.canvas.className = this._canvas.className

    // Add our own Container as child of app's root stage
    this.app.stage.addChild(this.stage)

    // 1. Camera — reads canvas + stage, handles pan/zoom events
    this.camera = new CameraManager(
      this.stage,
      this.app.canvas as HTMLCanvasElement,
      this._editorStore,
    )

    // 2. Plan images — lowest z-order (behind grid, layers, cursor)
    this.planImages = new PlanImageManager(this.stage, this._sceneStore, this._editorStore, this.app.canvas as HTMLCanvasElement)

    // 3. Grid — 100×100 iso grid + range highlight
    this.grid = new GridRenderer(
      this.stage,
      this._editorStore,
    )

    // 4. Cursor — cell highlight with snap
    this.cursor = new CursorRenderer(
      this.stage,
      this.camera,
      this.app.canvas as HTMLCanvasElement,
      this._editorStore,
    )

    // 5. Layers — 4 Pixi Containers for entity layers
    this.layers = new LayerManager(this.stage, this._sceneStore)

    this.sprites = new SpriteManager(
      this.layers,
      this._sceneStore,
      this._catalogStore,
    )
    await this.sprites.loadTextures()

    // ── Store watchers (each with stop handle for cleanup) ──
    this._watchers.push(
      watch(
        () => this._editorStore.zoom,
        () => this.camera.applyTransform(),
      ),
      watch(
        () => this._editorStore.pan,
        () => this.camera.applyTransform(),
      ),
      watch(
        () => this._editorStore.selection,
        (ids) => this.sprites.highlightSelection(ids),
      ),
      watch(
        () => this._sceneStore.entities,
        () => this.sprites.syncEntities(),
        { deep: true },
      ),
      watch(
        () => this._sceneStore.planImages,
        () => {
          this.planImages.renderAll()
          if (this._editorStore.selectedPlanImageId) {
            this.planImages.showHandles(this._editorStore.selectedPlanImageId)
          }
        },
        { deep: true },
      ),
      watch(
        () => this._editorStore.selectedPlanImageId,
        (id) => this.planImages.showHandles(id),
      ),
    )

    // Initial state
    this.camera.applyTransform()
    this.grid.draw()

    this._isInitialized = true
  }

  // ── Public API ─────────────────────────────────────────────

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height)
    const canvas = this.app.canvas as HTMLCanvasElement
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    this.grid.draw()
  }

  /** Center the grid on screen. Call after first resize. */
  centerGrid(): void {
    const gridCenter = isoToPixel(
      this.grid.GRID_COLS / 2,
      this.grid.GRID_ROWS / 2,
    )
    const canvasEl = this.app.canvas as HTMLCanvasElement
    const rect = canvasEl.getBoundingClientRect()
    this._editorStore.setPan({
      x: rect.width / 2 - gridCenter.x * this._editorStore.zoom,
      y: rect.height / 2 - gridCenter.y * this._editorStore.zoom,
    })
  }

  render(): void {
    this.app.render()
  }

  highlightSelectionRange(rect: GridRect | null): void {
    this.grid.highlightRange(rect)
  }

  /** Show/hide placement preview at cursor position */
  updatePreview(catalogId: string | null, isoX: number, isoY: number): void {
    if (this._previewSprite) {
      this._previewSprite.destroy()
      this._previewSprite = null
    }

    if (!catalogId) return

    const asset = this._catalogStore.getAssetByCatalogId(catalogId)
    if (!asset) return

    const tex = this.sprites.textureCache.get(catalogId)
    if (!tex || !tex.width) return

    const sprite = new Sprite(tex)
    sprite.label = 'preview'
    sprite.alpha = 0.4

    const { x, y } = isoToPixel(isoX, isoY)
    sprite.position.set(x, y)

    const { scaleX, scaleY } = calcSpriteScale(
      asset.defaultScaleX, asset.defaultScaleY, false,
      tex.width, tex.height,
    )
    sprite.scale.set(scaleX, scaleY)
    sprite.anchor.set(0.5, 1.0)
    sprite.zIndex = 9999

    this.stage.addChild(sprite)

    this._previewSprite = sprite
  }

  /** Update preview position (called on cursor move) */
  updatePreviewPosition(isoX: number, isoY: number): void {
    if (!this._previewSprite) return
    const { x, y } = isoToPixel(isoX, isoY)
    this._previewSprite.position.set(x, y)
  }

  destroy(): void {
    // Stop all store watchers first
    for (const stop of this._watchers) stop()
    this._watchers.length = 0

    if (this._previewSprite) {
      this._previewSprite.destroy()
      this._previewSprite = null
    }

    this.sprites?.destroy()
    this.planImages?.destroy()
    this.layers?.destroy()
    this.grid?.destroy()
    this.cursor?.destroy()
    this.camera?.destroy()

    this.app.destroy(undefined, { texture: true })

    this._isInitialized = false
  }
}