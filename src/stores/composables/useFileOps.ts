import { useSceneStore } from '../scene'
import { useToast } from './useToast'
import type { SceneDoc } from '@/types/scene'

export function useFileOps() {
  const scene = useSceneStore()
  const toast = useToast()

  function saveScene(): void {
    try {
      const doc = scene.toJSON()
      const json = JSON.stringify(doc)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.meta.name || 'scene'}.json`
      a.click()

      URL.revokeObjectURL(url)
      toast.success('Сцена сохранена')
    } catch {
      toast.error('Ошибка сохранения')
    }
  }

  function loadScene(): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const doc = JSON.parse(text) as SceneDoc

        if (doc.version !== 1) {
          toast.error('Неверная версия файла')
          return
        }

        // Validate entity required fields
        const requiredFields = ['id', 'layerId', 'catalogId', 'x', 'y']
        for (const entity of doc.entities) {
          for (const field of requiredFields) {
            if (!(field in entity) || entity[field as keyof typeof entity] === undefined) {
              toast.error(`Ошибка валидации: сущность ${entity.id || '(без id)'} не содержит поле "${field}"`)
              return
            }
          }
        }

        scene.fromJSON(doc)
        toast.success('Сцена загружена')
      } catch {
        toast.error('Ошибка чтения файла')
      }
    }

    input.click()
  }

  return { saveScene, loadScene }
}
