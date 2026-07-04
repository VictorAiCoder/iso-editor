// ============================================================
// SpriteManager — Entity → Sprite lifecycle + texture cache.
// Coordinates: isoToPixel for position, calcSpriteScale for size.
// ============================================================

import { Sprite, Texture, Assets } from 'pixi.js'
import { isoToPixel, calcSpriteScale } from './coords'
import type { useSceneStore } from '@/stores/scene'

import type { useCatalogStore } from '@/stores/catalog'
import type { Entity, EntityId } from '@/types/scene'
import type { LayerManager } from './LayerManager'

export class SpriteManager {
  readonly spriteMap = new Map<EntityId, Sprite>()
  readonly textureCache = new Map<string, Texture>()
  selectionHighlightColor = 0x00aaff

  private layerManager: LayerManager
  private sceneStore: ReturnType<typeof useSceneStore>
  private catalogStore: ReturnType<typeof useCatalogStore>

   constructor(
     layerManager: LayerManager,
     sceneStore: ReturnType<typeof useSceneStore>,
     catalogStore: ReturnType<typeof useCatalogStore>,
   ) {
     this.layerManager = layerManager
     this.sceneStore = sceneStore
     this.catalogStore = catalogStore
   }

  async loadTextures(): Promise<void> {
    for (const asset of this.catalogStore.assets) {
      if (this.textureCache.has(asset.id)) continue
      const tex = asset.sprite.startsWith('data:')
        ? Texture.from(asset.sprite)
        : await Assets.load(asset.sprite)
      this.textureCache.set(asset.id, tex)
    }
  }

  syncEntities(): void {
    const entityIds = new Set(this.sceneStore.entities.map(e => e.id))

    for (const id of [...this.spriteMap.keys()]) {
      if (!entityIds.has(id)) this.removeSprite(id)
    }

    for (const entity of this.sceneStore.entities) {
      if (this.spriteMap.has(entity.id)) {
        this.updateSpritePosition(entity)
      } else {
        this.createSprite(entity)
      }
    }

    this.sortAllLayers()
  }

  createSprite(entity: Entity): Sprite {
    let tex = this.textureCache.get(entity.catalogId)

    // Fallback: if texture is missing, create a placeholder
    if (!tex || !tex.width) {
      tex = this.createPlaceholderTexture()
    }

    const sprite = new Sprite(tex)
    sprite.label = `sprite-${entity.id}`
    this.positionSprite(sprite, entity)
    this.layerManager.addToLayer(entity.layerId, sprite)
    this.spriteMap.set(entity.id, sprite)
    return sprite
  }

  private createPlaceholderTexture(): Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(79, 195, 247, 0.3)'
    ctx.fillRect(0, 0, 64, 32)
    ctx.strokeStyle = '#4fc3f7'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, 64, 32)
    return Texture.from(canvas)
  }

  removeSprite(entityId: EntityId): void {
    const sprite = this.spriteMap.get(entityId)
    if (!sprite) return
    const entity = this.sceneStore.getEntityById(entityId)
    if (entity) this.layerManager.removeFromLayer(entity.layerId, sprite)
    sprite.destroy({ children: true, texture: true })
    this.spriteMap.delete(entityId)
  }

  updateSpritePosition(entity: Entity): void {
    const sprite = this.spriteMap.get(entity.id)
    if (!sprite) return
    this.positionSprite(sprite, entity)
  }

  private positionSprite(sprite: Sprite, entity: Entity): void {
    const { x, y } = isoToPixel(entity.x, entity.y)
    sprite.position.set(x, y)

    const tex = sprite.texture
    if (tex && tex.width && tex.height) {
      const { scaleX, scaleY } = calcSpriteScale(
        entity.scaleX, entity.scaleY, entity.flipX,
        tex.width, tex.height,
      )
      sprite.scale.set(scaleX, scaleY)
    }
    sprite.anchor.set(0.5, 1.0)
  }

  highlightSelection(selectedIds: Set<EntityId>): void {
    for (const [id, sprite] of this.spriteMap) {
      sprite.tint = selectedIds.has(id)
        ? this.selectionHighlightColor
        : 0xffffff
    }
  }

  getSprite(entityId: EntityId): Sprite | undefined {
    return this.spriteMap.get(entityId)
  }

  private sortAllLayers(): void {
    for (const [entityId, sprite] of this.spriteMap) {
      const entity = this.sceneStore.getEntityById(entityId)
      if (entity) {
        sprite.zIndex = entity.x + entity.y
      }
    }
  }

  destroy(): void {
    for (const sprite of this.spriteMap.values()) {
      sprite.destroy({ children: true, texture: true })
    }
    this.spriteMap.clear()
    this.textureCache.clear()
  }
}