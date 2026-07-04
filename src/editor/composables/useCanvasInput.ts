import { ref, readonly, watch, type Ref, type DeepReadonly } from 'vue'
import type { useEditorStore } from '@/stores/editor'

type Vec2 = { x: number; y: number }

export function useCanvasInput(
  canvasRef: Ref<HTMLCanvasElement | null>,
  _editorStore: ReturnType<typeof useEditorStore>,
) {
  const isPointerDown = ref(false)
  const pointerScreen = ref<Vec2 | null>(null)
  const pointerIso = ref<Vec2 | null>(null)

  let boundHandlers: Array<[string, EventListener]> = []

  function onPointerDown(e: PointerEvent) {
    isPointerDown.value = true
    pointerScreen.value = { x: e.clientX, y: e.clientY }
    // TODO: setCursorDown — заглушка для будущего drag-режима
  }

  function onPointerMove(e: PointerEvent) {
    pointerScreen.value = { x: e.clientX, y: e.clientY }
    // CameraManager already updates cursorIso via CursorRenderer — no duplicate conversion needed
    pointerIso.value = null
  }

  function onPointerUp() {
    isPointerDown.value = false
    pointerScreen.value = null
  }

  function attach(canvas: HTMLCanvasElement) {
    const entries: Array<[string, EventListener]> = [
      ['pointerdown', onPointerDown as EventListener],
      ['pointermove', onPointerMove as EventListener],
      ['pointerup', onPointerUp as EventListener],
    ]
    for (const [type, handler] of entries) {
      canvas.addEventListener(type, handler)
    }
    boundHandlers = entries
  }

  function detach() {
    const canvas = canvasRef.value
    if (canvas) {
      for (const [type, handler] of boundHandlers) {
        canvas.removeEventListener(type, handler)
      }
    }
    boundHandlers = []
  }

  watch(canvasRef, (canvas, _old, cleanup) => {
    if (canvas) attach(canvas)
    cleanup(() => detach())
  }, { immediate: true })

  function destroy() {
    detach()
    isPointerDown.value = false
    pointerScreen.value = null
    pointerIso.value = null
  }

  return {
    isPointerDown: readonly(isPointerDown) as DeepReadonly<Ref<boolean>>,
    pointerScreen: readonly(pointerScreen) as DeepReadonly<Ref<Vec2 | null>>,
    pointerIso: readonly(pointerIso) as DeepReadonly<Ref<Vec2 | null>>,
    destroy,
  }
}