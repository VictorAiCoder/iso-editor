import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AssetMeta, LayerId } from '@/types/scene'
import catalogData from '@/assets/catalog.json'

const SCALE_STORAGE_KEY = 'iso-editor-scale-overrides'

function loadScaleOverrides(): Record<string, { scaleX: number; scaleY: number }> {
  try {
    const raw = localStorage.getItem(SCALE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const useCatalogStore = defineStore('catalog', () => {
  const assets = ref<AssetMeta[]>(catalogData as AssetMeta[])
  const overrides = loadScaleOverrides()
  for (const asset of assets.value) {
    const saved = overrides[asset.id]
    if (saved) {
      asset.defaultScaleX = Math.max(0.5, saved.scaleX)
      asset.defaultScaleY = Math.max(0.5, saved.scaleY)
    }
  }
  const searchQuery = ref('')
  const texturesLoaded = ref(false)

  const groupedByLayer = computed(() => {
    const groups: Record<LayerId, AssetMeta[]> = {
      buildings: [],
      plants: [],
      plumbing: [],
      appliance: [],
    }
    for (const asset of assets.value) {
      if (groups[asset.layerId]) {
        groups[asset.layerId]!.push(asset)
      }
    }
    return groups
  })

  const filteredAssets = computed(() => {
    if (!searchQuery.value.trim()) return assets.value
    const q = searchQuery.value.toLowerCase()
    return assets.value.filter(a => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
  })

  const filteredByLayer = computed(() => {
    const groups: Record<LayerId, AssetMeta[]> = {
      buildings: [],
      plants: [],
      plumbing: [],
      appliance: [],
    }
    for (const asset of filteredAssets.value) {
      if (groups[asset.layerId]) {
        groups[asset.layerId]!.push(asset)
      }
    }
    return groups
  })

  function getAsset(id: string): AssetMeta | undefined {
    return assets.value.find(a => a.id === id)
  }

  function getAssetByCatalogId(catalogId: string): AssetMeta | undefined {
    return assets.value.find(a => a.id === catalogId)
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function saveScaleOverride(assetId: string, scaleX: number, scaleY: number) {
    const overrides = loadScaleOverrides()
    overrides[assetId] = { scaleX, scaleY }
    localStorage.setItem(SCALE_STORAGE_KEY, JSON.stringify(overrides))
  }

  function markTexturesLoaded() {
    texturesLoaded.value = true
  }

  return {
    assets,
    searchQuery,
    texturesLoaded,
    groupedByLayer,
    filteredAssets,
    filteredByLayer,
    getAsset,
    getAssetByCatalogId,
    setSearchQuery,
    saveScaleOverride,
    markTexturesLoaded,
  }
})