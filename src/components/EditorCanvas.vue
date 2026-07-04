<script setup lang="ts">
const emit = defineEmits<{
  (e: 'plan-rect-complete', rect: import('@/types/scene').GridRect): void
}>()

import { ref, shallowRef, readonly, onMounted, onUnmounted, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useSceneStore } from '@/stores/scene'
import { useCatalogStore } from '@/stores/catalog'
import { IsoRenderer } from '@/editor/IsoRenderer'
import { useCanvasInput } from '@/editor/composables/useCanvasInput'
import { useHotkeys } from '@/editor/composables/useHotkeys'
import { useGridSelection } from '@/editor/composables/useGridSelection'
import { useDragGroup } from '@/editor/composables/useDragGroup'
import type { Entity } from '@/types/scene'
import { snap, pixelToIso } from '@/editor/coords'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const editorStore = useEditorStore()
const sceneStore = useSceneStore()
const catalogStore = useCatalogStore()

const renderer = shallowRef<IsoRenderer | null>(null)
let resizeObserver: ResizeObserver | null = null
let pixiCanvas: HTMLCanvasElement | null = null

useHotkeys()

const { destroy: destroyInput } = useCanvasInput(canvasRef, editorStore)

// Watch for placement mode changes to show/hide preview
watch(
  () => editorStore.pendingCatalogId,
  (catalogId) => {
    if (catalogId) {
      renderer.value?.updatePreview(catalogId, editorStore.cursorIso.x, editorStore.cursorIso.y)
    } else {
      renderer.value?.updatePreview(null, 0, 0)
    }
  },
)

// ── Grid selection (Shift+drag for batch placement) ──
const gridSelection = useGridSelection(editorStore, (vx, vy) => {
  if (!pixiCanvas) return { x: vx, y: vy }
  const rect = pixiCanvas.getBoundingClientRect()
  const cx = vx - rect.left
  const cy = vy - rect.top
  return {
    x: (cx - editorStore.pan.x) / editorStore.zoom,
    y: (cy - editorStore.pan.y) / editorStore.zoom,
  }
})

// Sync grid selection dimensions to the editor store for StatusBar
watch(
  () => gridSelection.currentRect.value,
  (rect) => {
    if (rect && rect.width > 0 && rect.height > 0) {
      editorStore.setSelectionRect({ width: rect.width, height: rect.height })
    } else {
      editorStore.setSelectionRect(null)
    }
  },
)

// ── Drag group (move selected entities) ────────────────────
const dragGroup = useDragGroup(editorStore, sceneStore)

// ── Internal drag-mode tracking ────────────────────────────
type DragMode = 'none' | 'selection' | 'entity'
const dragMode = ref<DragMode>('none')
const selectionTool = ref<'batch' | 'plan-rect'>('batch')

onMounted(async () => {
  if (!canvasRef.value) return

  // 1. Create and initialize IsoRenderer (replaces canvas with Pixi canvas)
  renderer.value = new IsoRenderer(canvasRef.value, editorStore, sceneStore, catalogStore)
  await renderer.value.init()

  // Re-attach composable listeners to the Pixi canvas (original was replaced)
  pixiCanvas = renderer.value.app.canvas as HTMLCanvasElement
  canvasRef.value = pixiCanvas

  // 2. Initial entity count
  editorStore.updateCounts(sceneStore.entities.length)

  // 3. Watch entity count changes
  watch(
    () => sceneStore.entities.length,
    (len) => editorStore.updateCounts(len),
  )

  // 4. ResizeObserver — sync Pixi renderer with container size
  let isFirstResize = true
  const container = pixiCanvas.parentElement
  if (container) {
    resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]!.contentRect
      renderer.value?.resize(width, height)
      // Center grid on first resize if pan is still default
      if (isFirstResize && renderer.value && editorStore.pan.x === 0 && editorStore.pan.y === 0) {
        renderer.value.centerGrid()
        isFirstResize = false
      }
    })
    resizeObserver.observe(container)
  }

  // Force initial resize to fill container
  if (container) {
    const rect = container.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      renderer.value?.resize(rect.width, rect.height)
      if (isFirstResize && editorStore.pan.x === 0 && editorStore.pan.y === 0) {
        renderer.value?.centerGrid()
        isFirstResize = false
      }
    }
  }

  // 5. Pointer handlers for selection drag & entity drag
  pixiCanvas.addEventListener('pointerdown', onPointerDown)
  pixiCanvas.addEventListener('pointermove', onPointerMove)
  pixiCanvas.addEventListener('pointerup', onPointerUp)
})

onUnmounted(() => {
  if (pixiCanvas) {
    pixiCanvas.removeEventListener('pointerdown', onPointerDown)
    pixiCanvas.removeEventListener('pointermove', onPointerMove)
    pixiCanvas.removeEventListener('pointerup', onPointerUp)
  }
  destroyInput()
  resizeObserver?.disconnect()
  resizeObserver = null
  renderer.value?.destroy()
  renderer.value = null
  pixiCanvas = null
})

// ── Pointer handlers ───────────────────────────────────────

function onPointerDown(e: PointerEvent) {
  // Guard: plan-rect tool uses its own selection flow (kept for plan images)
  if (editorStore.tool === 'plan-rect') {
    if (!gridSelection.isSelecting.value) {
      dragMode.value = 'selection'
      selectionTool.value = 'plan-rect'
      gridSelection.start(e.clientX, e.clientY)
      renderer.value?.highlightSelectionRange(gridSelection.currentRect.value)
    }
    return
  }

  // Must be 'select' tool
  if (editorStore.tool !== 'select') return

  const iso = isoFromPointer(e)

  // ── Placement mode (asset selected in palette) ───────
  if (editorStore.pendingCatalogId) {
    if (e.shiftKey) {
      // Shift+drag → create GridRect for batch fill
      if (!gridSelection.isSelecting.value) {
        dragMode.value = 'selection'
        selectionTool.value = 'batch'
        gridSelection.start(e.clientX, e.clientY)
        renderer.value?.highlightSelectionRange(gridSelection.currentRect.value)
      }
      return
    }

    // If there's an active GridRect → fill it
    if (gridSelection.currentRect.value) {
      batchPlaceEntities(gridSelection.currentRect.value)
      gridSelection.clear()
      renderer.value?.highlightSelectionRange(null)
      return
    }

    // No GridRect → place single entity
    placeSingleEntity(e)
    return
  }

  // ── Normal select mode (no pending asset) ────────────
  if (e.shiftKey) {
    if (!gridSelection.isSelecting.value) {
      dragMode.value = 'selection'
      selectionTool.value = 'batch'
      gridSelection.start(e.clientX, e.clientY)
      renderer.value?.highlightSelectionRange(gridSelection.currentRect.value)
    }
    return
  }

  // If there's a persisted GridRect highlight, clear it on non-shift click
  if (gridSelection.currentRect.value) {
    gridSelection.clear()
    renderer.value?.highlightSelectionRange(null)
  }

  // If we're in selection mode but user clicks without shift → cancel
  if (gridSelection.isSelecting.value) {
    gridSelection.clear()
    renderer.value?.highlightSelectionRange(null)
    dragMode.value = 'none'
    return
  }

  // Entity interaction
  const hitEntity = findEntityAtIso(iso.x, iso.y)

  if (hitEntity) {
    if (!editorStore.isSelected(hitEntity.id)) {
      editorStore.clearSelection()
      editorStore.selectEntity(hitEntity.id)
      dragGroup.tryStart(iso.x, iso.y)
      dragMode.value = 'entity'
      return
    }
    if (dragGroup.tryStart(iso.x, iso.y)) {
      dragMode.value = 'entity'
      return
    }
  } else {
    editorStore.clearSelection()
    dragMode.value = 'none'
    return
  }
}

function onPointerMove(e: PointerEvent) {
  // Update placement preview position
  if (editorStore.pendingCatalogId) {
    const iso = isoFromPointer(e)
    renderer.value?.updatePreviewPosition(iso.x, iso.y)
  }

  if (dragMode.value === 'selection') {
    gridSelection.move(e.clientX, e.clientY)
    renderer.value?.highlightSelectionRange(gridSelection.currentRect.value)
    return
  }

  if (dragMode.value === 'entity') {
    const iso = isoFromPointer(e)
    dragGroup.update(iso.x, iso.y)
    return
  }
}

function onPointerUp(_e: PointerEvent) {
  if (dragMode.value === 'entity') {
    dragGroup.end()
    dragMode.value = 'none'
    return
  }

  if (dragMode.value === 'selection') {
    const rect = gridSelection.end()
    dragMode.value = 'none'

    if (rect) {
      if (selectionTool.value === 'plan-rect') {
        emit('plan-rect-complete', rect)
      } else {
        batchPlaceEntities(rect)
      }
    }
    return
  }
}

// ── Batch placement ────────────────────────────────────────

function batchPlaceEntities(rect: import('@/types/scene').GridRect) {
  const catalogId = resolveBatchCatalogId()
  if (!catalogId) return

  const asset = catalogStore.getAssetByCatalogId(catalogId)
  if (!asset) return

  // Layer lock check
  const layer = sceneStore.layers.find(l => l.id === asset.layerId)
  if (layer?.locked) return

  // Save one undo snapshot before the entire batch
  sceneStore.pushHistory()

  for (let dx = 0; dx < rect.width; dx++) {
    for (let dy = 0; dy < rect.height; dy++) {
      const x = rect.cellX + dx
      const y = rect.cellY - dy

      sceneStore.addEntity({
        layerId: asset.layerId,
        catalogId: asset.id,
        x,
        y,
        scaleX: asset.defaultScaleX,
        scaleY: asset.defaultScaleY,
        flipX: false,
        worldX: x,
        worldY: y,
        gridW: 1,
        gridH: 1,
      })
    }
  }
}

function resolveBatchCatalogId(): string | null {
  // Prefer the pending catalog if set
  if (editorStore.pendingCatalogId) return editorStore.pendingCatalogId

  // Otherwise use the catalog of the first selected entity
  if (editorStore.selection.size > 0) {
    const firstId = [...editorStore.selection][0]!
    const entity = sceneStore.getEntityById(firstId)
    if (entity) return entity.catalogId
  }

  return null
}

// ── Placement ─────────────────────────────────────────────

function placeSingleEntity(e: PointerEvent) {
  if (!editorStore.pendingCatalogId) return

  const asset = catalogStore.getAssetByCatalogId(editorStore.pendingCatalogId)
  if (!asset) return

  // Layer lock check
  const layer = sceneStore.layers.find(l => l.id === asset.layerId)
  if (layer?.locked) return

  const iso = isoFromPointer(e)

  sceneStore.addEntity({
    layerId: asset.layerId,
    catalogId: asset.id,
    x: iso.x,
    y: iso.y,
    scaleX: asset.defaultScaleX,
    scaleY: asset.defaultScaleY,
    flipX: false,
    worldX: iso.x,
    worldY: iso.y,
    gridW: 1,
    gridH: 1,
  })

  editorStore.clearPendingCatalog()
}

// ── Helpers ────────────────────────────────────────────────

function isoFromPointer(e: PointerEvent) {
  if (!pixiCanvas) {
    const iso = pixelToIso(e.clientX, e.clientY)
    return { x: snap(iso.x, editorStore.snapStep), y: snap(iso.y, editorStore.snapStep) }
  }
  const rect = pixiCanvas.getBoundingClientRect()
  const canvasX = e.clientX - rect.left
  const canvasY = e.clientY - rect.top
  const worldX = (canvasX - editorStore.pan.x) / editorStore.zoom
  const worldY = (canvasY - editorStore.pan.y) / editorStore.zoom
  const iso = pixelToIso(worldX, worldY)
  return {
    x: snap(iso.x, editorStore.snapStep),
    y: snap(iso.y, editorStore.snapStep),
  }
}

function findEntityAtIso(isoX: number, isoY: number): Entity | undefined {
  return sceneStore.entities.find(e => e.x === isoX && e.y === isoY)
}

defineExpose({ renderer: readonly(renderer) })
</script>

<template>
  <v-sheet class="editor-canvas-container" color="background">
    <canvas ref="canvasRef" class="editor-canvas" />

    <!-- Placement mode indicator -->
    <v-chip
      v-if="editorStore.pendingCatalogId && !gridSelection.isSelecting.value"
      class="placement-indicator"
      color="primary"
      variant="elevated"
      prepend-icon="mdi-cursor-move"
    >
      <template v-if="gridSelection.currentRect.value">Кликните для заливки области</template>
      <template v-else>Кликните для размещения</template>
      <template #append>
        <v-icon size="small" @click="editorStore.clearPendingCatalog()">
          mdi-close
        </v-icon>
      </template>
    </v-chip>

    <!-- Batch selection mode indicator (no pending asset) -->
    <v-chip
      v-if="!editorStore.pendingCatalogId && gridSelection.isSelecting.value"
      class="placement-indicator"
      color="secondary"
      variant="elevated"
      prepend-icon="mdi-select-group"
    >
      Выделите область
    </v-chip>

    <!-- Plan rect mode indicator -->
    <v-chip
      v-if="editorStore.tool === 'plan-rect' && gridSelection.isSelecting.value"
      class="placement-indicator"
      color="warning"
      variant="elevated"
      prepend-icon="mdi-image-area"
    >
      Выделите область для плана
    </v-chip>
  </v-sheet>
</template>

<style scoped>
.editor-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.editor-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.placement-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: auto;
}
</style>
