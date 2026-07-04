import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Entity, Layer, LayerId, PlanImage, SceneDoc } from '@/types/scene'
import { nanoid } from 'nanoid'
import { useEditorStore } from '@/stores/editor'

/** Максимальное количество шагов истории */
const MAX_HISTORY = 50

export const useSceneStore = defineStore('scene', () => {
  // --- State ---
  const entities = ref<Entity[]>([])
  const layers = ref<Layer[]>([
    { id: 'buildings', name: 'Здания', zIndex: 0, visible: true, locked: false, color: 'cyan' },
    { id: 'plants', name: 'Растения', zIndex: 1, visible: true, locked: false, color: 'green' },
    { id: 'plumbing', name: 'Коммуникации', zIndex: 2, visible: true, locked: false, color: 'orange' },
    { id: 'appliance', name: 'Оборудование', zIndex: 3, visible: true, locked: false, color: 'purple' },
  ])
  const planImages = ref<PlanImage[]>([])
  const history = ref<{ entities: Entity[]; planImages: PlanImage[] }[]>([])
  const historyIndex = ref(-1)

  // --- Getters ---
  const visibleLayers = computed(() => layers.value.filter(l => l.visible))
  const activeLayerEntities = computed(() => {
    const editorStore = useEditorStore()
    return entities.value.filter(e => e.layerId === editorStore.activeLayerId)
  })

  // --- Actions ---
  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const snapshot = history.value[historyIndex.value]
      if (snapshot) {
        entities.value = JSON.parse(JSON.stringify(snapshot.entities))
        planImages.value = JSON.parse(JSON.stringify(snapshot.planImages))
      }
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const snapshot = history.value[historyIndex.value]
      if (snapshot) {
        entities.value = JSON.parse(JSON.stringify(snapshot.entities))
        planImages.value = JSON.parse(JSON.stringify(snapshot.planImages))
      }
    }
  }

  function pushHistory() {
    const snapshot = {
      entities: JSON.parse(JSON.stringify(entities.value)),
      planImages: JSON.parse(JSON.stringify(planImages.value)),
    }
    // Обрезаем историю до текущей позиции
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(snapshot)
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
  }

  function addEntity(entity: Omit<Entity, 'id'>): Entity {
    const newEntity = { ...entity, id: nanoid() } as Entity
    entities.value.push(newEntity)
    pushHistory()
    return newEntity
  }

  function updateEntity(id: string, partial: Partial<Entity>) {
    const index = entities.value.findIndex(e => e.id === id)
    if (index !== -1) {
      entities.value[index] = { ...entities.value[index], ...partial } as Entity
    }
    pushHistory()
  }

  function removeEntities(ids: string[]) {
    entities.value = entities.value.filter(e => !ids.includes(e.id))
    pushHistory()
  }

  function removeEntity(id: string) {
    removeEntities([id])
  }

  function updateLayer(id: LayerId, partial: Partial<Layer>) {
    const index = layers.value.findIndex(l => l.id === id)
    if (index !== -1) {
      layers.value[index] = { ...layers.value[index], ...partial } as Layer
    }
  }

  function getEntityById(id: string): Entity | undefined {
    return entities.value.find(e => e.id === id)
  }

  function setEntities(newEntities: Entity[]) {
    entities.value = newEntities
    pushHistory()
  }

  function addPlanImage(plan: Omit<PlanImage, 'id'>): PlanImage {
    const newPlan = { ...plan, id: nanoid() } as PlanImage
    planImages.value.push(newPlan)
    pushHistory()
    return newPlan
  }

  function updatePlanImage(id: string, partial: Partial<PlanImage>) {
    const index = planImages.value.findIndex(p => p.id === id)
    if (index !== -1) {
      planImages.value[index] = { ...planImages.value[index], ...partial } as PlanImage
    }
    pushHistory()
  }

  function setPlanImages(newPlanImages: PlanImage[]) {
    planImages.value = newPlanImages
    pushHistory()
  }

  function removePlanImage(id: string) {
    planImages.value = planImages.value.filter(p => p.id !== id)
    pushHistory()
  }

  function toJSON(): SceneDoc {
    return {
      version: 1,
      meta: {
        name: 'Untitled Scene',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      layers: JSON.parse(JSON.stringify(layers.value)),
      entities: JSON.parse(JSON.stringify(entities.value)),
      planImages: JSON.parse(JSON.stringify(planImages.value)),
    }
  }

  function fromJSON(doc: SceneDoc) {
    layers.value = JSON.parse(JSON.stringify(doc.layers))
    entities.value = JSON.parse(JSON.stringify(doc.entities))
    planImages.value = JSON.parse(JSON.stringify(doc.planImages))
    pushHistory()
  }

  // Save initial blank state so the first undo can go back to it
  pushHistory()

  return {
    entities,
    layers,
    planImages,
    history,
    historyIndex,
    visibleLayers,
    activeLayerEntities,
    undo,
    redo,
    pushHistory,
    addEntity,
    updateEntity,
    updateLayer,
    removeEntities,
    removeEntity,
    getEntityById,
    setEntities,
    addPlanImage,
    updatePlanImage,
    setPlanImages,
    removePlanImage,
    toJSON,
    fromJSON,
  }
})
