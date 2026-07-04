import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { EntityId, Tool, LayerId } from '@/types/scene'
import { useStorage } from '@vueuse/core'
import { useSceneStore } from '@/stores/scene'
import { useToast } from '@/stores/composables/useToast'

export const useEditorStore = defineStore('editor', () => {
  // --- Persisted state (localStorage) ---
  const zoom = useStorage('iso-editor:zoom', 1)
  const pan = useStorage('iso-editor:pan', { x: 0, y: 0 })
  const snapStep = useStorage('iso-editor:snap-step', 1)
  const tool = useStorage<Tool>('iso-editor:tool', 'select')
  const gridVisible = useStorage('iso-editor:grid-visible', true)

  // --- Runtime state ---
  const activeLayerId = ref<LayerId>('buildings')
  const selection = ref<Set<EntityId>>(new Set())
  const pendingCatalogId = ref('')
  const cursorIso = ref({ x: 0, y: 0 })
  const entityCount = ref(0)
  const selectionCount = computed(() => selection.value.size)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const selectionRect = ref<{ width: number; height: number } | null>(null)
  const selectedPlanImageId = ref<string | null>(null)

  // ── Undo/Redo state sync ─────────────────────────────────
  const sceneStore = useSceneStore()

  watch(() => sceneStore.historyIndex, (idx) => {
    canUndo.value = idx > 0
    canRedo.value = idx < sceneStore.history.length - 1
  }, { immediate: true })

  // ── Performance guard ─────────────────────────────────────
  const toast = useToast()
  const PERFORMANCE_LIMIT = 500

  watch(() => sceneStore.entities.length, (count) => {
    if (count >= PERFORMANCE_LIMIT) {
      toast.warning(`Превышен лимит производительности: ${count} сущностей на сцене. Рекомендуется не более ${PERFORMANCE_LIMIT}.`)
    }
  })

  // --- Selection actions ---
  function selectEntity(id: EntityId) {
    selection.value.add(id)
    selection.value = new Set(selection.value) // trigger reactivity
  }

  function deselectEntity(id: EntityId) {
    selection.value.delete(id)
    selection.value = new Set(selection.value)
  }

  function toggleEntity(id: EntityId) {
    if (selection.value.has(id)) {
      deselectEntity(id)
    } else {
      selectEntity(id)
    }
  }

  function clearSelection() {
    selection.value = new Set()
  }

  function setSelection(ids: EntityId[]) {
    selection.value = new Set(ids)
  }

  function isSelected(id: EntityId): boolean {
    return selection.value.has(id)
  }

  // --- Tool actions ---
  function setTool(newTool: Tool) {
    tool.value = newTool
  }

  function setPendingCatalog(catalogId: string) {
    pendingCatalogId.value = catalogId
    // Tool stays 'select' — placement is merged into select mode
  }

  function clearPendingCatalog() {
    pendingCatalogId.value = ''
  }

  // --- View actions ---
  function setZoom(newZoom: number) {
    zoom.value = Math.max(1, Math.min(4, Math.round(newZoom)))
  }

  function zoomIn() {
    setZoom(zoom.value + 1)
  }

  function zoomOut() {
    setZoom(zoom.value - 1)
  }

  function setPan(newPan: { x: number; y: number }) {
    pan.value = newPan
  }

  function toggleGrid() {
    gridVisible.value = !gridVisible.value
  }

  function setSnapStep(step: number) {
    snapStep.value = step
  }

  function setActiveLayer(id: LayerId) {
    activeLayerId.value = id
  }

  function updateCursorIso(x: number, y: number) {
    cursorIso.value = { x, y }
  }

  function updateCounts(total: number) {
    entityCount.value = total
  }

  function setUndoRedoState(undo: boolean, redo: boolean) {
    canUndo.value = undo
    canRedo.value = redo
  }

  function setSelectionRect(rect: { width: number; height: number } | null) {
    selectionRect.value = rect
  }

  function selectPlanImage(id: string | null) {
    selectedPlanImageId.value = id
    // Clear entity selection when selecting a plan
    selection.value = new Set()
  }

  return {
    // persisted
    zoom,
    pan,
    snapStep,
    tool,
    gridVisible,
    // runtime
    activeLayerId,
    selection,
    pendingCatalogId,
    cursorIso,
    entityCount,
    selectionCount,
    canUndo,
    canRedo,
    selectionRect,
    selectedPlanImageId,
    // actions
    selectPlanImage,
    selectEntity,
    deselectEntity,
    toggleEntity,
    clearSelection,
    setSelection,
    isSelected,
    setTool,
    setPendingCatalog,
    clearPendingCatalog,
    setZoom,
    zoomIn,
    zoomOut,
    setPan,
    toggleGrid,
    setSnapStep,
    setActiveLayer,
    updateCursorIso,
    updateCounts,
    setUndoRedoState,
    setSelectionRect,
  }
})
