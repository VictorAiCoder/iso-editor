// ============================================================
// ISO Editor — типы данных сцены
// ============================================================

export type LayerId = 'buildings' | 'plants' | 'plumbing' | 'appliance'

export type EntityId = string

export type LayerColor = 'cyan' | 'green' | 'orange' | 'purple'

/**
 * Единый тип прямоугольного выделения на изосетке.
 * cellX, cellY — нижний левый угол в изометрических координатах (визуально низ ромба).
 * Прямоугольник растёт вверх и вправо от этой точки.
 */
export interface GridRect {
  cellX: number
  cellY: number
  width: number
  height: number
}

export interface Layer {
  id: LayerId
  name: string
  zIndex: number
  visible: boolean
  locked: boolean
  color: LayerColor
}

export interface Entity {
  id: string
  layerId: LayerId
  catalogId: string
  x: number
  y: number
  scaleX: number
  scaleY: number
  flipX: boolean
  worldX: number
  worldY: number
  gridW: number
  gridH: number
}

export interface AssetMeta {
  id: string
  layerId: LayerId
  name: string
  sprite: string
  defaultScaleX: number
  defaultScaleY: number
}

export interface PlanImage {
  id: string
  name: string
  dataUrl: string
  cellX: number
  cellY: number
  width: number
  height: number
  opacity: number
  rotation: number  // 0 | 90 | 180 | 270 — degrees clockwise
}

export type Tool = 'select' | 'place' | 'plan-rect'

export interface EditorState {
  activeLayerId: LayerId
  selection: Set<EntityId>
  zoom: number
  pan: { x: number; y: number }
  snapStep: number
  tool: Tool
  pendingCatalogId: string
  gridVisible: boolean
}

export interface SceneDoc {
  version: 1
  meta: { name: string; createdAt: string; updatedAt: string }
  layers: Layer[]
  entities: Entity[]
  planImages: PlanImage[]
}