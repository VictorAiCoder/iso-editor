<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useSceneStore } from '@/stores/scene'
import { useFileOps } from '@/stores/composables/useFileOps'
import ClearDialog from './ClearDialog.vue'
import { ref, computed } from 'vue'
import type { Tool } from '@/types/scene'
import { layerColors, layerRgb } from '@/editor/layerColors'

const editor = useEditorStore()
const scene = useSceneStore()
const { saveScene, loadScene } = useFileOps()

const showClearDialog = ref(false)

const activeColor = computed(() => layerColors[editor.activeLayerId])
const activeRgb = computed(() => layerRgb[editor.activeLayerId])

// Tool definitions
const toolDefs: { value: Tool; icon: string; label: string; shortcut: string }[] = [
  { value: 'select', icon: 'mdi-cursor-default', label: 'Выделить', shortcut: 'V' },
]

// Zoom percent (get/set for v-model)
const zoomPercent = computed({
  get: () => Math.round(editor.zoom * 100),
  set: (v: number) => editor.setZoom(v / 100),
})
</script>

<template>
  <div
    class="toolbar-inner"
    :style="{
      '--layer-color': activeColor,
      '--layer-color-rgb': activeRgb,
    }"
  >
    <!-- Tools section -->
    <div class="toolbar-section" :style="{ '--stagger-index': 0 }">
      <v-btn
        v-for="td in toolDefs"
        :key="td.value"
        variant="text"
        density="compact"
        class="tool-btn"
        :class="{ 'tool-btn--active': editor.tool === td.value }"
        :active="editor.tool === td.value"
        :color="editor.tool === td.value ? activeColor : undefined"
        :title="td.label"
        @click="editor.setTool(td.value)"
      >
        <v-icon :icon="td.icon" />
        <span class="tool-btn__shortcut">{{ td.shortcut }}</span>
      </v-btn>
    </div>

    <div class="toolbar-divider" :style="{ '--stagger-index': 1 }" />

    <!-- Zoom section -->
    <div class="toolbar-section" :style="{ '--stagger-index': 2 }">
      <v-select
        :model-value="zoomPercent"
        @update:model-value="(v: number) => editor.setZoom(v / 100)"
        :items="[50, 75, 100, 150, 200, 300, 400]"
        variant="plain"
        density="compact"
        class="toolbar-select zoom-select"
        hide-details
        menu-icon=""
      >
        <template #selection="{ item }">
          <span class="numeric-value">{{ item.title }}%</span>
        </template>
      </v-select>
    </div>

    <div class="toolbar-divider" :style="{ '--stagger-index': 3 }" />

    <!-- Snap section -->
    <div class="toolbar-section" :style="{ '--stagger-index': 4 }">
      <span class="section-label">Snap</span>
      <v-select
        :model-value="editor.snapStep"
        @update:model-value="(v: number) => editor.setSnapStep(v)"
        :items="[0.5, 1, 2]"
        variant="plain"
        density="compact"
        class="toolbar-select snap-select"
        hide-details
        menu-icon=""
      >
        <template #selection="{ item }">
          <span class="numeric-value">{{ item.title }}</span>
        </template>
      </v-select>
    </div>

    <div class="toolbar-divider" :style="{ '--stagger-index': 5 }" />

    <!-- Grid toggle -->
    <div class="toolbar-section" :style="{ '--stagger-index': 6 }">
      <v-btn
        :icon="editor.gridVisible ? 'mdi-grid' : 'mdi-grid-off'"
        :color="editor.gridVisible ? 'primary' : undefined"
        variant="text"
        density="compact"
        class="action-btn"
        :class="{ 'action-btn--active': editor.gridVisible }"
        title="Сетка (G)"
        @click="editor.toggleGrid"
      />
    </div>

    <v-spacer />

    <!-- History section -->
    <div class="toolbar-section" :style="{ '--stagger-index': 7 }">
      <v-btn
        icon="mdi-undo"
        density="compact"
        variant="text"
        class="action-btn"
        :disabled="!editor.canUndo"
        title="Отменить (Ctrl+Z)"
        @click="scene.undo"
      />
      <v-btn
        icon="mdi-redo"
        density="compact"
        variant="text"
        class="action-btn"
        :disabled="!editor.canRedo"
        title="Повторить (Ctrl+Shift+Z)"
        @click="scene.redo"
      />
    </div>

    <div class="toolbar-divider" :style="{ '--stagger-index': 8 }" />

    <!-- File section -->
    <div class="toolbar-section" :style="{ '--stagger-index': 9 }">
      <v-btn
        icon="mdi-content-save"
        density="compact"
        variant="text"
        class="action-btn"
        title="Сохранить (Ctrl+S)"
        @click="saveScene"
      />
      <v-btn
        icon="mdi-folder-open"
        density="compact"
        variant="text"
        class="action-btn"
        title="Загрузить (Ctrl+O)"
        @click="loadScene"
      />
    </div>

    <div class="toolbar-divider" :style="{ '--stagger-index': 10 }" />

    <!-- Clear section (danger zone) -->
    <div class="toolbar-section danger-zone" :style="{ '--stagger-index': 11 }">
      <v-btn
        icon="mdi-delete-sweep"
        density="compact"
        variant="text"
        class="action-btn action-btn--danger"
        title="Очистить сцену"
        @click="showClearDialog = true"
      />
    </div>
  </div>

  <ClearDialog v-model="showClearDialog" />
</template>

<style scoped>
/* ── Container ─────────────────────────────────────────── */
.toolbar-inner {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 10px;
  min-height: 40px;
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.96), rgba(20, 20, 35, 0.96));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  animation: toolbar-enter 0.35s ease both;
}

/* Noise/grain texture overlay */
.toolbar-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  background-image: repeating-conic-gradient(#fff 0.00005%, transparent 0.0001%);
  background-size: 4px 4px;
  pointer-events: none;
}

/* Subtle top highlight */
.toolbar-inner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 8px;
  right: 8px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.06), transparent);
  pointer-events: none;
}

/* ── Sections ──────────────────────────────────────────── */
.toolbar-section {
  display: flex;
  align-items: center;
  gap: 2px;
  position: relative;
  z-index: 1;
  animation: section-enter 0.3s ease both;
  animation-delay: calc(var(--stagger-index, 0) * 15ms);
}

/* ── Dividers ──────────────────────────────────────────── */
.toolbar-divider {
  width: 1px;
  height: 22px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1), transparent);
  margin: 0 4px;
  flex-shrink: 0;
  animation: section-enter 0.3s ease both;
  animation-delay: calc(var(--stagger-index, 0) * 15ms);
}

/* ── Tool buttons ──────────────────────────────────────── */
.tool-btn {
  position: relative;
  border-radius: 6px;
  min-width: 32px !important;
  height: 32px !important;
  padding: 0 6px !important;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  overflow: visible;
}

.tool-btn:focus-visible {
  outline: 2px solid var(--layer-color, #4fc3f7);
  outline-offset: 2px;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

/* Active tool with layer color glow */
.tool-btn--active {
  background: rgba(var(--layer-color-rgb, 79, 195, 247), 0.12) !important;
  border-color: var(--layer-color, #4fc3f7) !important;
  box-shadow: 0 0 12px rgba(var(--layer-color-rgb, 79, 195, 247), 0.25);
}

.tool-btn--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 4px;
  right: 4px;
  height: 2px;
  background: var(--layer-color, #4fc3f7);
  border-radius: 1px;
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Shortcut badge on tool buttons */
.tool-btn__shortcut {
  position: absolute;
  top: -6px;
  right: -6px;
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.6);
  padding: 0 3px;
  border-radius: 3px;
  line-height: 14px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* When tool is active, shortcut badge gets the layer color */
.tool-btn--active .tool-btn__shortcut {
  color: var(--layer-color, #4fc3f7);
  background: rgba(0, 0, 0, 0.7);
  border-color: rgba(var(--layer-color-rgb, 79, 195, 247), 0.3);
}

/* ── Section label ─────────────────────────────────────── */
.section-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-right: 2px;
  user-select: none;
}

/* ── Select (zoom, snap) ────────────────────────────────── */
.toolbar-select {
  min-width: 0 !important;
  width: auto !important;
}

.toolbar-select :deep(.v-field) {
  min-height: 30px !important;
  padding: 0 4px !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border-radius: 6px !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  box-shadow: none !important;
}

.toolbar-select :deep(.v-field--focused) {
  border-color: var(--v-theme-primary) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

.toolbar-select :deep(.v-field__input) {
  padding: 0 4px !important;
  min-height: 30px !important;
  font-size: 13px !important;
}

.toolbar-select :deep(.v-select__selection) {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 13px;
}

.numeric-value {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.zoom-select {
  width: 72px !important;
}

.snap-select {
  width: 56px !important;
}

/* ── Action buttons ─────────────────────────────────────── */
.action-btn {
  border-radius: 6px;
  min-width: 30px !important;
  height: 30px !important;
  transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  background: transparent;
}

.action-btn:focus-visible {
  outline: 2px solid var(--layer-color, #4fc3f7);
  outline-offset: 2px;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.action-btn--active {
  color: rgb(var(--v-theme-primary)) !important;
}

.action-btn--danger:hover:not(:disabled) {
  background: rgba(229, 115, 115, 0.12) !important;
  color: #e57373 !important;
}

.action-btn--danger:active:not(:disabled) {
  background: rgba(229, 115, 115, 0.2) !important;
}

/* ── Danger zone (clear button area) ────────────────────── */
.danger-zone {
  border-left: 1px solid rgba(229, 115, 115, 0.15);
  padding-left: 4px;
  margin-left: 2px;
}

/* ── Keyframe animations ────────────────────────────────── */
@keyframes toolbar-enter {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes section-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 4px rgba(var(--layer-color-rgb, 79, 195, 247), 0.4);
  }
}
</style>
