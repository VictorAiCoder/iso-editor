import { ref, computed } from 'vue'
import { pixelToIsoNearest } from '@/editor/coords'
import type { GridRect } from '@/types/scene'
import type { useEditorStore } from '@/stores/editor'

type Vec2 = { x: number; y: number }

/**
 * Drag-based GridRect selector.
 * start() sets corner 1, move() updates preview, end() finalizes and returns the GridRect.
 * clear() resets all state.
 */
export function useGridSelection(
  editorStore: ReturnType<typeof useEditorStore>,
  screenToWorld: (x: number, y: number) => Vec2 = (x, y) => ({ x, y }),
) {
  const isSelecting = ref(false)
  const firstClick = ref<Vec2 | null>(null)
  const currentScreen = ref<Vec2 | null>(null)

  function screenToIso(sx: number, sy: number): Vec2 {
    const world = screenToWorld(sx, sy)
    return pixelToIsoNearest(world.x, world.y)
  }

  function buildRect(startIso: Vec2, endIso: Vec2): GridRect {
    const cellX = Math.min(startIso.x, endIso.x)
    const cellY = Math.max(startIso.y, endIso.y)
    const width = Math.abs(endIso.x - startIso.x) + 1
    const height = Math.abs(endIso.y - startIso.y) + 1
    return { cellX, cellY, width, height }
  }

  /** Begin a new drag selection. Stores the first corner. */
  function start(screenX: number, screenY: number): void {
    isSelecting.value = true
    firstClick.value = { x: screenX, y: screenY }
    currentScreen.value = { x: screenX, y: screenY }
  }

  /** Update the live preview during drag. */
  function move(screenX: number, screenY: number): void {
    if (!isSelecting.value) return
    currentScreen.value = { x: screenX, y: screenY }
  }

  /** Finalize the drag selection. Returns the GridRect or null if no valid selection. */
  function end(): GridRect | null {
    if (!isSelecting.value || !firstClick.value || !currentScreen.value) {
      return null
    }

    const startIso = screenToIso(firstClick.value.x, firstClick.value.y)
    const endIso = screenToIso(currentScreen.value.x, currentScreen.value.y)
    const rect = buildRect(startIso, endIso)

    isSelecting.value = false
    // Keep firstClick/currentScreen so currentRect stays valid for highlight persistence
    return rect
  }

  /** Reset all state. */
  function clear(): void {
    isSelecting.value = false
    firstClick.value = null
    currentScreen.value = null
  }

  /** Live preview of the rectangle from first click to current mouse (persists after finalization) */
  const currentRect = computed<GridRect | null>(() => {
    if (!firstClick.value || !currentScreen.value) {
      return null
    }
    const startIso = screenToIso(firstClick.value.x, firstClick.value.y)
    const endIso = screenToIso(currentScreen.value.x, currentScreen.value.y)
    return buildRect(startIso, endIso)
  })

  return {
    isSelecting,
    currentRect,
    start,
    move,
    end,
    clear,
  }
}
