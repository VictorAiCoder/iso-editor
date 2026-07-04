<script setup lang="ts">
import { ref } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { useEditorStore } from '@/stores/editor'
import type { LayerId, AssetMeta } from '@/types/scene'
import { layerColors, layerRgb, layerIcons, layerLabels, layerRgba } from '@/editor/layerColors'

const catalog = useCatalogStore()
const editor = useEditorStore()

function selectAsset(catalogId: string) {
  editor.setPendingCatalog(catalogId)
}

// ── Scale dialog ────────────────────────────────────────────
const showScaleDialog = ref(false)
const editingAsset = ref<AssetMeta | null>(null)
const editScaleX = ref(1)
const editScaleY = ref(1)

function openScaleEditor(asset: AssetMeta, e: Event) {
  e.stopPropagation()
  editingAsset.value = asset
  editScaleX.value = asset.defaultScaleX
  editScaleY.value = asset.defaultScaleY
  showScaleDialog.value = true
}

function applyScale() {
  const asset = editingAsset.value
  if (!asset) return
  asset.defaultScaleX = Math.max(0.5, editScaleX.value)
  asset.defaultScaleY = Math.max(0.5, editScaleY.value)
  catalog.saveScaleOverride(asset.id, asset.defaultScaleX, asset.defaultScaleY)
  showScaleDialog.value = false
  editingAsset.value = null
}

function cancelScaleEdit() {
  showScaleDialog.value = false
  editingAsset.value = null
}
</script>

<template>
  <div class="asset-palette">
    <div class="asset-palette__search">
      <v-text-field
        v-model="catalog.searchQuery"
        prepend-inner-icon="mdi-magnify"
        placeholder="Поиск"
        hint="Ctrl+F"
        persistent-hint
        variant="outlined"
        density="compact"
        clearable
      />
    </div>

    <v-expansion-panels
      :model-value="[0, 1, 2, 3]"
      multiple
      variant="accordion"
      class="asset-palette__panels flex-grow-1 overflow-y-auto"
    >
      <v-expansion-panel
        v-for="(assets, layerId) in catalog.filteredByLayer"
        :key="layerId"
        :disabled="assets.length === 0"
      >
        <v-expansion-panel-title
          class="text-body-2 font-weight-medium layer-panel-title"
          :style="{ background: layerRgba(layerId as LayerId, 0.08) }"
        >
          <v-icon :icon="layerIcons[layerId as LayerId]" size="small" class="mr-2" />
          {{ layerLabels[layerId as LayerId] }}
          <v-spacer />
          <v-chip size="x-small" variant="outlined" class="mr-1">
            {{ assets.length }}
          </v-chip>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div v-if="assets.length === 0" class="asset-grid__empty">
            Нет ассетов
          </div>
          <div v-else class="asset-grid">
            <div
              v-for="(asset, index) in assets"
              :key="asset.id"
              class="asset-card"
              :class="{ 'asset-card--active': editor.pendingCatalogId === asset.id }"
              :style="{
                '--layer-color': layerColors[asset.layerId],
                '--layer-color-rgb': layerRgb[asset.layerId],
                '--stagger-delay': `${index * 30}ms`,
              }"
              @click="selectAsset(asset.id)"
            >
              <div class="asset-card__preview">
                <div class="checker-bg"></div>

                <v-img
                  :src="asset.sprite"
                  width="100%"
                  height="100%"
                  contain
                  class="asset-card__sprite"
                >
                  <template #error>
                    <div class="d-flex align-center justify-center fill-height bg-grey-darken-3">
                      <v-icon size="16" color="grey">mdi-image-broken-variant</v-icon>
                    </div>
                  </template>
                </v-img>

                <!-- Scale badge — clickable to edit -->
                <div class="asset-card__scale-badge">
                  <v-chip
                    size="small"
                    variant="tonal"
                    color="primary"
                    class="scale-badge"
                    @click="openScaleEditor(asset, $event)"
                  >
                    {{ asset.defaultScaleX }}×{{ asset.defaultScaleY }}
                    <v-icon size="10" class="ml-1">mdi-pencil</v-icon>
                  </v-chip>
                </div>
              </div>

              <div class="asset-card__name">
                {{ asset.name }}
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Scale edit dialog -->
    <v-dialog v-model="showScaleDialog" max-width="320" persistent>
      <v-card v-if="editingAsset">
        <v-card-title class="text-body-1 font-weight-bold d-flex align-center ga-2">
          <v-img
            :src="editingAsset.sprite"
            width="24"
            height="24"
            contain
            style="image-rendering: pixelated; border-radius: 2px;"
          />
          {{ editingAsset.name }}
        </v-card-title>

        <v-card-text>
          <div class="d-flex align-center ga-3">
            <v-text-field
              v-model.number="editScaleX"
              label="Масштаб X"
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              variant="outlined"
              density="compact"
              hide-details
              autofocus
              @keydown.enter="applyScale"
            />
            <span class="text-h6 text-medium-emphasis">×</span>
            <v-text-field
              v-model.number="editScaleY"
              label="Масштаб Y"
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              variant="outlined"
              density="compact"
              hide-details
              @keydown.enter="applyScale"
            />
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelScaleEdit">Отмена</v-btn>
          <v-btn variant="tonal" color="primary" @click="applyScale">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* ── Container ──────────────────────────────────────────── */
.asset-palette {
  background: rgb(var(--v-theme-surface));
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ── Search field ───────────────────────────────────────── */
.asset-palette__search {
  padding: 12px 12px 4px;
}

.asset-palette__search :deep(.v-field--focused .v-field__prepend-inner .v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
  transition: color 0.2s ease;
}

.asset-palette__panels {
  scrollbar-width: thin;
}

/* ── Layer panel title ──────────────────────────────────── */
.layer-panel-title {
  transition: background-color 0.2s ease;
}

/* ── Checkerboard pattern (Photoshop-style transparency) ── */
.checker-bg {
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

/* ── Asset grid ─────────────────────────────────────────── */
.asset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 4px 0;
}

.asset-grid__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 12px;
  color: rgba(255, 255, 255, 0.38);
  font-size: 12px;
}

/* ── Asset cards ────────────────────────────────────────── */
.asset-card {
  position: relative;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
  animation: stagger-in 0.25s ease both;
  animation-delay: var(--stagger-delay, 0ms);
}

.asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.06);
}

.asset-card--active {
  border-color: var(--layer-color);
  background: rgba(var(--layer-color-rgb), 0.1);
  box-shadow: 0 0 12px rgba(var(--layer-color-rgb), 0.25);
}

.asset-card--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--layer-color);
  border-radius: 0 2px 2px 0;
  animation: pulse-glow 2s ease-in-out infinite;
}

.asset-card:focus-visible {
  outline: 2px solid var(--layer-color, #4fc3f7);
  outline-offset: 2px;
}

/* ── Card preview area ──────────────────────────────────── */
.asset-card__preview {
  position: relative;
  width: 100%;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.asset-card__sprite {
  position: relative;
  z-index: 1;
  image-rendering: pixelated;
  max-width: 100%;
  max-height: 100%;
  padding: 4px;
}

/* ── Scale badge overlay ────────────────────────────────── */
.asset-card__scale-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  padding: 2px;
  backdrop-filter: blur(4px);
}

.asset-card__scale-badge :deep(.v-chip) {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  height: 24px;
}

.scale-badge {
  cursor: pointer;
}

.scale-badge:hover {
  filter: brightness(1.2);
}

/* ── Card name label ────────────────────────────────────── */
.asset-card__name {
  padding: 4px 8px 6px;
  font-size: 11px;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Animation keyframes ────────────────────────────────── */
@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 6px rgba(var(--layer-color-rgb), 0.5);
  }
}
</style>
