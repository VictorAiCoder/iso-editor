import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSceneStore } from '@/stores/scene'

describe('sceneStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addEntity creates entity with id', () => {
    const store = useSceneStore()
    const entity = store.addEntity({
      layerId: 'buildings',
      catalogId: 'home',
      x: 5, y: 10,
      scaleX: 1, scaleY: 1, flipX: false,
      worldX: 5, worldY: 10,
      gridW: 1, gridH: 1,
    })
    expect(entity.id).toBeTruthy()
    expect(entity.x).toBe(5)
    expect(entity.y).toBe(10)
    expect(store.entities.length).toBe(1)
  })

  it('removeEntities removes by id', () => {
    const store = useSceneStore()
    const e1 = store.addEntity({
      layerId: 'buildings', catalogId: 'home',
      x: 0, y: 0, scaleX: 1, scaleY: 1, flipX: false,
      worldX: 0, worldY: 0, gridW: 1, gridH: 1,
    })
    const e2 = store.addEntity({
      layerId: 'plants', catalogId: 'tree',
      x: 1, y: 1, scaleX: 1, scaleY: 1, flipX: false,
      worldX: 1, worldY: 1, gridW: 1, gridH: 1,
    })
    store.removeEntities([e1.id])
    expect(store.entities.length).toBe(1)
    expect(store.entities[0]!.id).toBe(e2.id)
  })

  it('updateEntity patches entity fields', () => {
    const store = useSceneStore()
    const e = store.addEntity({
      layerId: 'buildings', catalogId: 'home',
      x: 0, y: 0, scaleX: 1, scaleY: 1, flipX: false,
      worldX: 0, worldY: 0, gridW: 1, gridH: 1,
    })
    store.updateEntity(e.id, { x: 10, flipX: true })
    const updated = store.getEntityById(e.id)!
    expect(updated.x).toBe(10)
    expect(updated.flipX).toBe(true)
  })

  it('undo restores previous state', () => {
    const store = useSceneStore()
    store.addEntity({
      layerId: 'buildings', catalogId: 'home',
      x: 0, y: 0, scaleX: 1, scaleY: 1, flipX: false,
      worldX: 0, worldY: 0, gridW: 1, gridH: 1,
    })
    expect(store.entities.length).toBe(1)
    store.undo()
    expect(store.entities.length).toBe(0)
  })

  it('redo restores after undo', () => {
    const store = useSceneStore()
    store.addEntity({
      layerId: 'buildings', catalogId: 'home',
      x: 0, y: 0, scaleX: 1, scaleY: 1, flipX: false,
      worldX: 0, worldY: 0, gridW: 1, gridH: 1,
    })
    store.undo()
    expect(store.entities.length).toBe(0)
    store.redo()
    expect(store.entities.length).toBe(1)
  })

  it('toJSON/fromJSON round-trips entities and planImages', () => {
    const store = useSceneStore()
    store.addEntity({
      layerId: 'buildings', catalogId: 'home',
      x: 5, y: 10, scaleX: 1, scaleY: 1, flipX: false,
      worldX: 5, worldY: 10, gridW: 1, gridH: 1,
    })
    store.addPlanImage({
      name: 'test', dataUrl: 'data:image/png;base64,test',
      cellX: 0, cellY: 0, width: 2, height: 2, opacity: 0.5, rotation: 0,
    })

    const json = store.toJSON()
    expect(json.version).toBe(1)
    expect(json.entities.length).toBe(1)
    expect(json.planImages.length).toBe(1)

    const store2 = useSceneStore()
    store2.fromJSON(json)
    expect(store2.entities.length).toBe(1)
    expect(store2.planImages.length).toBe(1)
    expect(store2.planImages[0]!.opacity).toBe(0.5)
  })
})
