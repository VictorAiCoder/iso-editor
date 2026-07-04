<script setup lang="ts">
import { ref } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { useEditorStore } from '@/stores/editor'
import type { LayerId } from '@/types/scene'
import { layerColors, layerRgb, layerIcons, layerRgba } from '@/editor/layerColors'

const scene = useSceneStore()
const editor = useEditorStore()

const confirmClearLayerId = ref<LayerId | null>(null)
const showConfirmDialog = ref(false)

function toggleVisibility(layerId: LayerId) {
  const layer = scene.layers.find(l => l.id === layerId)
  if (!layer) return
  scene.updateLayer(layerId, { visible: !layer.visible })
}

function toggleLock(layerId: LayerId) {
  const layer = scene.layers.find(l => l.id === layerId)
  if (!layer) return
  scene.updateLayer(layerId, { locked: !layer.locked })
}

function layerEntityCount(layerId: LayerId): number {
  return scene.entities.filter(e => e.layerId === layerId).length
}

function clearLayerEntities(layerId: LayerId) {
  const ids = scene.entities.filter(e => e.layerId === layerId).map(e => e.id)
  scene.removeEntities(ids)
  confirmClearLayerId.value = null
  showConfirmDialog.value = false
}
</script>

<template>
  <v-card flat class="pa-3">
    <v-card-title class="text-body-2 font-weight-bold pa-0 mb-2">
      Слои
    </v-card-title>

    <v-list density="compact" class="py-0">
      <v-list-item
        v-for="layer in scene.layers"
        :key="layer.id"
        :active="editor.activeLayerId === layer.id"
        @click="editor.setActiveLayer(layer.id)"
        class="layer-item"
        :class="{ 'layer-item--active': editor.activeLayerId === layer.id }"
        :style="editor.activeLayerId === layer.id ? {
          '--layer-color': layerColors[layer.id],
          '--layer-color-rgb': layerRgb[layer.id],
        } : {}"
      >
        <template #prepend>
          <div
            class="layer-icon"
            :style="{
              background: layerRgba(layer.id, 0.15),
              color: layerColors[layer.id],
            }"
          >
            <v-icon :icon="layerIcons[layer.id]" size="small" />
          </div>
        </template>

        <v-list-item-title class="text-body-2">
          {{ layer.name }}
          <span class="entity-count font-mono">({{ layerEntityCount(layer.id) }})</span>
        </v-list-item-title>

        <template #append>
          <v-btn
            :icon="layer.visible ? 'mdi-eye' : 'mdi-eye-off'"
            size="x-small"
            variant="text"
            :color="layer.visible ? 'primary' : undefined"
            @click.stop="toggleVisibility(layer.id)"
            :title="layer.visible ? 'Скрыть' : 'Показать'"
          />
          <v-btn
            :icon="layer.locked ? 'mdi-lock' : 'mdi-lock-open'"
            size="x-small"
            variant="text"
            :color="layer.locked ? 'warning' : undefined"
            @click.stop="toggleLock(layer.id)"
            :title="layer.locked ? 'Разблокировать' : 'Заблокировать'"
            class="ml-1"
          />
          <v-btn
            icon="mdi-delete"
            size="x-small"
            variant="text"
            color="error"
            @click.stop="confirmClearLayerId = layer.id; showConfirmDialog = true"
            title="Очистить слой"
            class="ml-1"
          />
        </template>
      </v-list-item>
    </v-list>

    <!-- Clear layer confirmation dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="360">
      <v-card v-if="confirmClearLayerId">
        <v-card-title class="text-body-1 font-weight-bold">
          <v-icon icon="mdi-alert" color="warning" class="mr-2" />
          Очистить слой
        </v-card-title>
        <v-card-text>
          Удалить все сущности из слоя «{{ scene.layers.find(l => l.id === confirmClearLayerId)?.name }}»?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showConfirmDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="tonal" @click="clearLayerEntities(confirmClearLayerId!)">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.layer-item {
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 4px;
  border-left: 3px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.layer-item:focus-visible {
  outline: 2px solid var(--layer-color, #4fc3f7);
  outline-offset: 2px;
}

.layer-item:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  transform: translateX(2px);
}

.layer-item--active {
  border-left-color: var(--layer-color);
  background: rgba(var(--layer-color-rgb), 0.1);
}

/* ── Layer icon circle ────────────────────────────────────── */
.layer-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

/* ── Entity count in DM Mono ──────────────────────────────── */
.entity-count {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
