import { describe, it, expect, beforeEach } from 'vitest'
import { useGridSelection } from '@/editor/composables/useGridSelection'

describe('useGridSelection', () => {
  let editorStore: any
  let screenToWorld: (x: number, y: number) => { x: number; y: number }

  beforeEach(() => {
    editorStore = { snapStep: 1 }
    screenToWorld = (x: number, y: number) => ({ x, y })
  })

  it('starts selection on start()', () => {
    const sel = useGridSelection(editorStore, screenToWorld)
    expect(sel.isSelecting.value).toBe(false)

    sel.start(100, 200)
    expect(sel.isSelecting.value).toBe(true)
  })

  it('produces a GridRect after end() and clears isSelecting', () => {
    const sel = useGridSelection(editorStore, screenToWorld)
    sel.start(0, 0)
    sel.move(64, 32)

    const rect = sel.end()

    expect(rect).not.toBeNull()
    expect(rect!.width).toBeGreaterThanOrEqual(1)
    expect(rect!.height).toBeGreaterThanOrEqual(1)
    expect(sel.isSelecting.value).toBe(false)
  })

  it('returns null when end() called without start', () => {
    const sel = useGridSelection(editorStore, screenToWorld)
    const rect = sel.end()
    expect(rect).toBeNull()
  })

  it('returns null when end() called a second time', () => {
    const sel = useGridSelection(editorStore, screenToWorld)
    sel.start(0, 0)
    sel.move(64, 32)

    sel.end() // first call finalizes
    const second = sel.end() // second call should return null

    expect(second).toBeNull()
  })

  it('currentRect updates during drag', () => {
    const sel = useGridSelection(editorStore, screenToWorld)
    sel.start(0, 0)

    expect(sel.currentRect.value).not.toBeNull()

    sel.move(64, 32)
    expect(sel.currentRect.value!.width).toBeGreaterThanOrEqual(1)
    expect(sel.currentRect.value!.height).toBeGreaterThanOrEqual(1)
  })

  it('clear() resets all state', () => {
    const sel = useGridSelection(editorStore, screenToWorld)
    sel.start(100, 200)
    sel.move(64, 32)

    sel.clear()
    expect(sel.isSelecting.value).toBe(false)
    expect(sel.currentRect.value).toBeNull()
  })

  it('produces a single-cell rect for a click without drag', () => {
    const sel = useGridSelection(editorStore, screenToWorld)
    sel.start(64, 32)
    // No move() — end() should still produce a valid 1×1 rect

    const rect = sel.end()

    expect(rect).not.toBeNull()
    expect(rect!.width).toBe(1)
    expect(rect!.height).toBe(1)
  })

  it('normalizes rect so cellX/cellY is bottom-left regardless of drag direction', () => {
    // Dragging from top-left to bottom-right should produce the same GridRect
    // as dragging from bottom-right to top-left.
    const sel1 = useGridSelection(editorStore, screenToWorld)
    sel1.start(0, 0)
    sel1.move(128, 64)
    const rectForward = sel1.end()

    const sel2 = useGridSelection(editorStore, screenToWorld)
    sel2.start(128, 64)
    sel2.move(0, 0)
    const rectBackward = sel2.end()

    expect(rectForward).not.toBeNull()
    expect(rectBackward).not.toBeNull()
    // Both drags must produce the identical normalized rect
    expect(rectForward).toEqual(rectBackward)
    // Width and height must be at least 1
    expect(rectForward!.width).toBeGreaterThanOrEqual(1)
    expect(rectForward!.height).toBeGreaterThanOrEqual(1)
  })
})
