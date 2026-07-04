import { ref } from 'vue'

/** Shared reactive flag toggled by F3 and consumed by both useHotkeys and DebugOverlay. */
export const debugVisible = ref(false)

export function toggleDebug() {
  debugVisible.value = !debugVisible.value
}
