// ============================================================
// LayerManager — Isometric layer container hierarchy.
// Each LayerId maps to a Container with zIndex + visibility.
// ============================================================

import { Container, type Container as ContainerType } from 'pixi.js'
import { watch } from 'vue'
import type { useSceneStore } from '@/stores/scene'
import type { LayerId } from '@/types/scene'

const ALL_LAYERS: LayerId[] = ['buildings', 'plants', 'plumbing', 'appliance']

export class LayerManager {
  readonly containers = new Map<LayerId, Container>()

  private _stopWatch: (() => void) | null = null

  private stage: Container
  private store: ReturnType<typeof useSceneStore>

  constructor(
    stage: Container,
    store: ReturnType<typeof useSceneStore>,
  ) {
    this.stage = stage
    this.store = store

    for (const id of ALL_LAYERS) {
      const layer = new Container()
      layer.label = `layer-${id}`
      layer.sortableChildren = true
      this.containers.set(id, layer)
      this.stage.addChild(layer)
    }

    this.syncLayers()

    this._stopWatch = watch(
      () => this.store.layers,
      () => this.syncLayers(),
      { deep: true },
    )
  }

  getContainer(layerId: LayerId): Container {
    const c = this.containers.get(layerId)
    if (!c) throw new Error(`Layer "${layerId}" not found`)
    return c
  }

  syncLayers(): void {
    for (const layer of this.store.layers) {
      const container = this.containers.get(layer.id)
      if (!container) continue
      container.zIndex = layer.zIndex
      container.visible = layer.visible
    }
  }

  addToLayer(layerId: LayerId, child: ContainerType): void {
    this.getContainer(layerId).addChild(child)
  }

  removeFromLayer(layerId: LayerId, child: ContainerType): void {
    this.getContainer(layerId).removeChild(child)
  }

  clearLayer(layerId: LayerId): void {
    this.getContainer(layerId).removeChildren()
  }

  destroy(): void {
    this._stopWatch?.()
    for (const [_id, container] of this.containers) {
      this.stage.removeChild(container)
      container.destroy({ children: true })
    }
    this.containers.clear()
  }
}