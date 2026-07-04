import { ref } from 'vue'
import { snap } from '@/editor/coords'
import type { useEditorStore } from '@/stores/editor'
import type { useSceneStore } from '@/stores/scene'

type Vec2 = { x: number; y: number }

/**
 * Drag-group composable: when the user drags on a selected entity,
 * all selected entities move together, snapping to the grid.
 *
 * Usage:
 * 1. On pointerdown, call `tryStart(x, y)` — returns true if drag began.
 * 2. On pointermove, call `update(x, y)`.
 * 3. On pointerup, call `end()`.
 */
export function useDragGroup(
  editorStore: ReturnType<typeof useEditorStore>,
  sceneStore: ReturnType<typeof useSceneStore>,
) {
  const isDragging = ref(false)
  const startIso = ref<Vec2 | null>(null)

  /**
   * Attempt to begin a drag-group operation.
   * Returns true if dragging started (a selected entity was under the pointer).
   */
  function tryStart(isoX: number, isoY: number): boolean {
    // Guard: must be in select tool with an active selection
    if (editorStore.tool !== 'select') return false
    if (editorStore.selection.size === 0) return false

    // Snap the start position
    const snappedX = snap(isoX, editorStore.snapStep)
    const snappedY = snap(isoY, editorStore.snapStep)

    // Check if any selected entity sits at this grid position
    const hitEntity = [...editorStore.selection].some((id) => {
      const entity = sceneStore.getEntityById(id)
      if (!entity) return false
      return entity.x === snappedX && entity.y === snappedY
    })

    if (!hitEntity) return false

    isDragging.value = true
    startIso.value = { x: snappedX, y: snappedY }
    return true
  }

  /**
   * Update the drag — moves all selected entities by the delta from start.
   * Delta is snapped to the grid step.
   */
  function update(isoX: number, isoY: number): void {
    if (!isDragging.value || !startIso.value) return

    const currentX = snap(isoX, editorStore.snapStep)
    const currentY = snap(isoY, editorStore.snapStep)
    const dx = currentX - startIso.value.x
    const dy = currentY - startIso.value.y

    // Skip if no movement
    if (dx === 0 && dy === 0) return

    for (const id of [...editorStore.selection]) {
      const entity = sceneStore.getEntityById(id)
      if (!entity) continue
      // Skip if layer is locked
      const layer = sceneStore.layers.find(l => l.id === entity.layerId)
      if (layer?.locked) continue
      sceneStore.updateEntity(id, {
        x: entity.x + dx,
        y: entity.y + dy,
        worldX: entity.worldX + dx,
        worldY: entity.worldY + dy,
      })
    }

    // Advance the start so next frame delta is relative to new position
    startIso.value = { x: currentX, y: currentY }
  }

  /** Finalize the drag operation */
  function end(): void {
    isDragging.value = false
    startIso.value = null
  }

  return {
    isDragging,
    tryStart,
    update,
    end,
  }
}
