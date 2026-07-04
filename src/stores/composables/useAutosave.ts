import { watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useSceneStore } from '../scene'
import type { SceneDoc } from '@/types/scene'

const AUTOSAVE_KEY = 'iso-editor:autosave'

/**
 * Persists the full scene to localStorage on every change (debounced).
 * Returns helpers for checking / restoring / clearing the autosave.
 */
export function useAutosave() {
  const scene = useSceneStore()

  const persist = useDebounceFn(() => {
    try {
      const doc = scene.toJSON()
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(doc))
    } catch {
      // Silently ignore — autosave is best-effort
    }
  }, 2000)

  // Deep-watch both reactive sources that matter
  watch(
    () => scene.entities,
    () => persist(),
    { deep: true },
  )

  watch(
    () => scene.planImages,
    () => persist(),
    { deep: true },
  )

  /** Returns the stored SceneDoc if it exists, otherwise null. */
  function readAutosave(): SceneDoc | null {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY)
      if (!raw) return null
      const doc = JSON.parse(raw) as SceneDoc
      if (doc.version !== 1) return null
      return doc
    } catch {
      return null
    }
  }

  /** Restore a previously saved autosave into the scene store. */
  function restoreAutosave(doc: SceneDoc) {
    scene.fromJSON(doc)
  }

  /** Remove the autosave from localStorage. */
  function clearAutosave() {
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  return { readAutosave, restoreAutosave, clearAutosave }
}
