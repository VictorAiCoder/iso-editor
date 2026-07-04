import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEditorStore } from '@/stores/editor'

describe('editorStore', () => {
  beforeEach(() => {
    // Clear localStorage to prevent useStorage leaking state between tests
    localStorage.clear()
    setActivePinia(createPinia())
  })

  // ── Selection ──────────────────────────────────────────
  it('starts with empty selection', () => {
    const store = useEditorStore()
    expect(store.selection.size).toBe(0)
    expect(store.selectionCount).toBe(0)
  })

  it('selectEntity adds id to selection', () => {
    const store = useEditorStore()
    store.selectEntity('e1')
    expect(store.selection.has('e1')).toBe(true)
    expect(store.selectionCount).toBe(1)
  })

  it('deselectEntity removes id from selection', () => {
    const store = useEditorStore()
    store.selectEntity('e1')
    store.deselectEntity('e1')
    expect(store.selection.has('e1')).toBe(false)
  })

  it('toggleEntity adds if absent, removes if present', () => {
    const store = useEditorStore()
    store.toggleEntity('e1')
    expect(store.selection.has('e1')).toBe(true)
    store.toggleEntity('e1')
    expect(store.selection.has('e1')).toBe(false)
  })

  it('clearSelection empties the set', () => {
    const store = useEditorStore()
    store.selectEntity('e1')
    store.selectEntity('e2')
    store.clearSelection()
    expect(store.selection.size).toBe(0)
  })

  it('setSelection replaces selection with given ids', () => {
    const store = useEditorStore()
    store.selectEntity('e1')
    store.setSelection(['e2', 'e3'])
    expect(store.selection.has('e1')).toBe(false)
    expect(store.selection.has('e2')).toBe(true)
    expect(store.selection.has('e3')).toBe(true)
  })

  it('isSelected returns correct boolean', () => {
    const store = useEditorStore()
    store.selectEntity('e1')
    expect(store.isSelected('e1')).toBe(true)
    expect(store.isSelected('e2')).toBe(false)
  })

  // ── Zoom ───────────────────────────────────────────────
  it('starts at zoom 1', () => {
    const store = useEditorStore()
    expect(store.zoom).toBe(1)
  })

  it('setZoom clamps between 1 and 4', () => {
    const store = useEditorStore()
    store.setZoom(0)
    expect(store.zoom).toBe(1)
    store.setZoom(5)
    expect(store.zoom).toBe(4)
    store.setZoom(2)
    expect(store.zoom).toBe(2)
  })

  it('zoomIn increases zoom by 1', () => {
    const store = useEditorStore()
    store.zoomIn()
    expect(store.zoom).toBe(2)
  })

  it('zoomOut decreases zoom by 1', () => {
    const store = useEditorStore()
    store.setZoom(3)
    store.zoomOut()
    expect(store.zoom).toBe(2)
  })

  // ── Tool ───────────────────────────────────────────────
  it('starts with select tool', () => {
    const store = useEditorStore()
    expect(store.tool).toBe('select')
  })

  it('setTool changes tool', () => {
    const store = useEditorStore()
    store.setTool('place')
    expect(store.tool).toBe('place')
  })

  // ── Grid ───────────────────────────────────────────────
  it('grid starts visible', () => {
    const store = useEditorStore()
    expect(store.gridVisible).toBe(true)
  })

  it('toggleGrid flips visibility', () => {
    const store = useEditorStore()
    store.toggleGrid()
    expect(store.gridVisible).toBe(false)
    store.toggleGrid()
    expect(store.gridVisible).toBe(true)
  })

  // ── Snap ───────────────────────────────────────────────
  it('starts with snap step 1', () => {
    const store = useEditorStore()
    expect(store.snapStep).toBe(1)
  })

  it('setSnapStep changes step', () => {
    const store = useEditorStore()
    store.setSnapStep(0.5)
    expect(store.snapStep).toBe(0.5)
  })
})
