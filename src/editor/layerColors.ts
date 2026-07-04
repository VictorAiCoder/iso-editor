import type { LayerId } from '@/types/scene'

/** Hex color values for each layer. */
export const layerColors: Record<LayerId, string> = {
  buildings: '#4fc3f7',
  plants: '#81c784',
  plumbing: '#ffb74d',
  appliance: '#e57373',
}

/** RGB triplets for use in CSS rgba(). */
export const layerRgb: Record<LayerId, string> = {
  buildings: '79, 195, 247',
  plants: '129, 199, 132',
  plumbing: '255, 183, 77',
  appliance: '229, 115, 115',
}

/** MDI icon names for each layer. */
export const layerIcons: Record<LayerId, string> = {
  buildings: 'mdi-domain',
  plants: 'mdi-flower',
  plumbing: 'mdi-pipe',
  appliance: 'mdi-fan',
}

/** Human-readable Russian labels for each layer. */
export const layerLabels: Record<LayerId, string> = {
  buildings: 'Здания',
  plants: 'Растения',
  plumbing: 'Коммуникации',
  appliance: 'Оборудование',
}

/**
 * Returns an `rgba()` string for the given layer and opacity.
 * Example: `layerRgba('buildings', 0.15)` → `'rgba(79, 195, 247, 0.15)'`
 */
export function layerRgba(layerId: LayerId, opacity: number): string {
  return `rgba(${layerRgb[layerId]}, ${opacity})`
}
