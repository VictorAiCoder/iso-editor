<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useSceneStore } from '@/stores/scene'
import { useCatalogStore } from '@/stores/catalog'
import type { LayerId } from '@/types/scene'
import { layerColors, layerRgb } from '@/editor/layerColors'

const editor = useEditorStore()
const scene = useSceneStore()
const catalog = useCatalogStore()

const selectedEntity = computed(() => {
  if (editor.selection.size !== 1) return null
  const id = [...editor.selection][0]
  if (!id) return null
  return scene.getEntityById(id) ?? null
})

const selectedAsset = computed(() => {
  if (!selectedEntity.value) return null
  return catalog.getAssetByCatalogId(selectedEntity.value.catalogId) ?? null
})

const selectionSize = computed(() => editor.selection.size)

const selectedEntityLayerId = computed<LayerId | null>(() => {
  return selectedEntity.value?.layerId ?? null
})

const scaleOptions = [0.5, 1, 2, 3]

function setScale(field: 'scaleX' | 'scaleY', value: number) {
  if (!selectedEntity.value) return
  scene.updateEntity(selectedEntity.value.id, { [field]: value })
}

function toggleFlipX() {
  if (editor.selection.size === 0) return
  for (const id of [...editor.selection]) {
    const entity = scene.getEntityById(id)
    if (!entity) continue
    const layer = scene.layers.find(l => l.id === entity.layerId)
    if (layer?.locked) continue
    scene.updateEntity(id, { flipX: !entity.flipX })
  }
}

function resetToDefault() {
  if (!selectedEntity.value || !selectedAsset.value) return
  scene.updateEntity(selectedEntity.value.id, {
    scaleX: selectedAsset.value.defaultScaleX,
    scaleY: selectedAsset.value.defaultScaleY,
    flipX: false,
  })
}

function removeSelected() {
  if (editor.selection.size === 0) return
  // Check if any selected entity is on a locked layer
  for (const id of [...editor.selection]) {
    const entity = scene.getEntityById(id)
    if (entity && scene.layers.find(l => l.id === entity.layerId)?.locked) return
  }
  scene.removeEntities([...editor.selection])
  editor.clearSelection()
}
</script>

<template>
  <v-card flat class="transform-panel">
    <v-card-title class="text-body-2 font-weight-bold pa-0 mb-3">
      Трансформация
    </v-card-title>

    <!-- No selection state -->
    <div v-if="selectionSize === 0" class="empty-state">
      <div class="empty-state__icon">
        <v-icon icon="mdi-cursor-default" size="32" color="text-disabled" />
      </div>
      <div class="text-body-2 text-medium-emphasis mb-2">Нет выделения</div>
      <div class="text-caption text-disabled mb-3">Выберите объект на сцене</div>
      <div class="shortcut-hints">
        <div class="shortcut-hint">
          <kbd>V</kbd> Выделение
        </div>
        <div class="shortcut-hint">
          <kbd>G</kbd> Сетка
        </div>
        <div class="shortcut-hint">
          <kbd>Del</kbd> Удалить
        </div>
      </div>
    </div>

    <!-- Single selection: preview + scale/flip + delete -->
    <template v-else-if="selectedEntity">
      <!-- Asset preview -->
      <div
        v-if="selectedAsset && selectedEntityLayerId"
        class="transform-preview"
        :style="{
          borderColor: layerColors[selectedEntityLayerId],
          boxShadow: `0 0 12px rgba(${layerRgb[selectedEntityLayerId]}, 0.15)`,
        }"
      >
        <div class="checker-bg"></div>
        <v-img
          :src="selectedAsset.sprite"
          contain
          class="transform-preview__sprite"
        >
          <template #error>
            <div class="d-flex align-center justify-center fill-height">
              <v-icon size="24" color="grey">mdi-image-broken-variant</v-icon>
            </div>
          </template>
        </v-img>
      </div>

      <!-- Asset name -->
      <div v-if="selectedAsset" class="text-body-2 text-medium-emphasis text-center mb-3">
        {{ selectedAsset.name }}
      </div>

      <!-- Scale X -->
      <div class="text-body-2 text-medium-emphasis mb-1">Масштаб X</div>
      <v-btn-toggle
        :model-value="selectedEntity.scaleX"
        @update:model-value="(v: number | undefined) => v != null && setScale('scaleX', v)"
        mandatory
        density="compact"
        variant="outlined"
        color="primary"
        class="mb-3"
      >
        <v-btn
          v-for="s in scaleOptions"
          :key="'x' + s"
          :value="s"
          size="small"
          min-width="0"
          class="font-mono"
        >
          {{ s }}×
        </v-btn>
      </v-btn-toggle>

      <!-- Scale Y -->
      <div class="text-body-2 text-medium-emphasis mb-1">Масштаб Y</div>
      <v-btn-toggle
        :model-value="selectedEntity.scaleY"
        @update:model-value="(v: number | undefined) => v != null && setScale('scaleY', v)"
        mandatory
        density="compact"
        variant="outlined"
        color="primary"
        class="mb-3"
      >
        <v-btn
          v-for="s in scaleOptions"
          :key="'y' + s"
          :value="s"
          size="small"
          min-width="0"
          class="font-mono"
        >
          {{ s }}×
        </v-btn>
      </v-btn-toggle>

      <!-- Flip X -->
      <v-btn
        :color="selectedEntity.flipX ? 'primary' : undefined"
        variant="tonal"
        block
        @click="toggleFlipX"
        prepend-icon="mdi-flip-h"
        class="mb-3"
      >
        Отражение {{ selectedEntity.flipX ? 'вкл' : 'выкл' }}
      </v-btn>

      <!-- Reset + Delete -->
      <div class="btn-group">
        <v-btn
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          @click="resetToDefault"
          :disabled="!selectedAsset"
          class="reset-btn"
        >
          Сброс
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-delete"
          @click="removeSelected"
        >
          Удалить
        </v-btn>
      </div>
    </template>

    <!-- Multiple selection: delete only -->
    <template v-else>
      <div class="multi-selection-chip mb-3">
        <v-chip variant="outlined" size="small" class="font-mono">
          Выделено: {{ selectionSize }} объектов
        </v-chip>
      </div>

      <v-btn
        color="error"
        variant="tonal"
        size="small"
        prepend-icon="mdi-delete"
        block
        @click="removeSelected"
      >
        Удалить {{ selectionSize }} объектов
      </v-btn>
    </template>
  </v-card>
</template>

<style scoped>
.transform-panel {
  padding: 12px;
}

/* ── Preview area ─────────────────────────────────────────── */
.transform-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid;
  margin-bottom: 8px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.transform-preview .checker-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.transform-preview__sprite {
  position: relative;
  z-index: 1;
  image-rendering: pixelated;
  max-width: 100%;
  max-height: 100%;
  padding: 4px;
}

/* ── Empty state ──────────────────────────────────────────── */
.empty-state {
  padding: 24px 16px;
  text-align: center;
}

.empty-state__icon {
  margin-bottom: 8px;
  opacity: 0.5;
}

/* ── Shortcut hints ─────────────────────────────────────── */
.shortcut-hints {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.shortcut-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  gap: 6px;
}

.shortcut-hint kbd {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  padding: 1px 5px;
  min-width: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

/* ── Typography helpers ───────────────────────────────────── */
.font-mono {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
}

/* ── Button group ─────────────────────────────────────────── */
.btn-group {
  display: flex;
  gap: 4px;
}

.btn-group .v-btn {
  flex: 1;
}

.reset-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* ── Multi-selection chip ─────────────────────────────────── */
.multi-selection-chip {
  text-align: center;
}
</style>
