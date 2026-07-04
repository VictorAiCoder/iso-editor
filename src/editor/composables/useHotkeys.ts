import { onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useSceneStore } from '@/stores/scene'
import type { LayerId } from '@/types/scene'
import { useFileOps } from '@/stores/composables/useFileOps'
import { toggleDebug } from '@/stores/composables/useDebugOverlay'

export function useHotkeys() {
  const editor = useEditorStore()
  const scene = useSceneStore()
  const { saveScene, loadScene } = useFileOps()

  function isLayerLocked(layerId: LayerId): boolean {
    const layer = scene.layers.find(l => l.id === layerId)
    return layer?.locked ?? false
  }

  function onKeyDown(e: KeyboardEvent) {
    // Ignore when typing in an input/textarea
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
      return
    }

    const ctrl = e.ctrlKey || e.metaKey
    const shift = e.shiftKey

    // Ctrl+Z → Undo
    if (ctrl && !shift && e.key === 'z') {
      e.preventDefault()
      scene.undo()
      return
    }

    // Ctrl+Shift+Z → Redo
    if (ctrl && shift && e.key === 'Z') {
      e.preventDefault()
      scene.redo()
      return
    }

    // Ctrl+S → Save
    if (ctrl && e.key === 's') {
      e.preventDefault()
      saveScene()
      return
    }

    // Ctrl+O → Load
    if (ctrl && e.key === 'o') {
      e.preventDefault()
      loadScene()
      return
    }

    // Ctrl+D → Duplicate
    if (ctrl && e.key === 'd') {
      e.preventDefault()
      duplicateSelected()
      return
    }

    // Single-key shortcuts (no modifiers)
    if (ctrl || e.altKey) return

    switch (e.key) {
      case 'F3':
        e.preventDefault()
        toggleDebug()
        break
      case 'Delete':
      case 'Backspace':
        deleteSelected()
        break
      case 'Escape':
        editor.clearSelection()
        editor.clearPendingCatalog()
        editor.setTool('select')
        break
      case 'v':
        editor.clearPendingCatalog() // exit placement mode
        editor.setTool('select')
        break
      case 'r':
        editor.setTool('plan-rect')
        break
      case 'g':
        editor.toggleGrid()
        break
      case 'h':
      case 'H':
        flipSelected()
        break
      case '=':
      case '+':
        editor.zoomIn()
        break
      case '-':
        editor.zoomOut()
        break
      case 'ArrowUp':
        e.preventDefault()
        nudgeSelected(0, shift ? -5 * editor.snapStep : -editor.snapStep)
        break
      case 'ArrowDown':
        e.preventDefault()
        nudgeSelected(0, shift ? 5 * editor.snapStep : editor.snapStep)
        break
      case 'ArrowLeft':
        e.preventDefault()
        nudgeSelected(shift ? -5 * editor.snapStep : -editor.snapStep, 0)
        break
      case 'ArrowRight':
        e.preventDefault()
        nudgeSelected(shift ? 5 * editor.snapStep : editor.snapStep, 0)
        break
    }
  }

  function deleteSelected() {
    if (editor.selection.size === 0) return
    // Check if any selected entity is on a locked layer
    for (const id of [...editor.selection]) {
      const entity = scene.getEntityById(id)
      if (entity && isLayerLocked(entity.layerId)) return
    }
    scene.removeEntities([...editor.selection])
    editor.clearSelection()
  }

  function duplicateSelected() {
    if (editor.selection.size === 0) return
    // Check if any selected entity is on a locked layer
    for (const id of [...editor.selection]) {
      const entity = scene.getEntityById(id)
      if (entity && isLayerLocked(entity.layerId)) return
    }
    const offset = 1
    for (const id of [...editor.selection]) {
      const entity = scene.getEntityById(id)
      if (!entity) continue
      scene.addEntity({
        layerId: entity.layerId,
        catalogId: entity.catalogId,
        x: entity.x + offset,
        y: entity.y + offset,
        scaleX: entity.scaleX,
        scaleY: entity.scaleY,
        flipX: entity.flipX,
        worldX: entity.worldX,
        worldY: entity.worldY,
        gridW: entity.gridW,
        gridH: entity.gridH,
      })
    }
  }

  function nudgeSelected(dx: number, dy: number) {
    if (editor.selection.size === 0) return
    for (const id of [...editor.selection]) {
      const entity = scene.getEntityById(id)
      if (!entity) continue
      if (isLayerLocked(entity.layerId)) continue
      scene.updateEntity(id, {
        x: entity.x + dx,
        y: entity.y + dy,
        worldX: entity.worldX + dx,
        worldY: entity.worldY + dy,
      })
    }
  }

  function flipSelected() {
    if (editor.selection.size === 0) return
    for (const id of [...editor.selection]) {
      const entity = scene.getEntityById(id)
      if (!entity) continue
      if (isLayerLocked(entity.layerId)) continue
      scene.updateEntity(id, { flipX: !entity.flipX })
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
}
