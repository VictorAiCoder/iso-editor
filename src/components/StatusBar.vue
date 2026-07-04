<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useSceneStore } from '@/stores/scene'
import { layerColors, layerRgb } from '@/editor/layerColors'

const editor = useEditorStore()
const scene = useSceneStore()

const activeLayerName = computed(() => {
  const layer = scene.layers.find(l => l.id === editor.activeLayerId)
  return layer?.name ?? editor.activeLayerId
})

const activeLayerColor = computed(() => layerColors[editor.activeLayerId])
const activeLayerRgb = computed(() => layerRgb[editor.activeLayerId])
</script>

<template>
  <div
    class="statusbar-inner"
    :style="{
      '--layer-color': activeLayerColor,
      '--layer-color-rgb': activeLayerRgb,
    }"
  >
    <!-- Cursor segment -->
    <div class="status-segment" :style="{ '--stagger-index': 0 }">
      <span class="segment-label">Pos</span>
      <span class="segment-value font-mono">
        {{ editor.cursorIso.x.toFixed(1) }}, {{ editor.cursorIso.y.toFixed(1) }}
      </span>
    </div>

    <div class="status-divider" :style="{ '--stagger-index': 1 }" />

    <!-- Entities segment -->
    <div class="status-segment" :style="{ '--stagger-index': 2 }">
      <span class="segment-label">Entities</span>
      <span class="segment-value font-mono">{{ scene.entities.length }}</span>
    </div>

    <!-- Selection segment (conditional) -->
    <template v-if="editor.selectionCount > 0">
      <div class="status-divider" :style="{ '--stagger-index': 3 }" />
      <div class="status-segment status-segment--highlight" :style="{ '--stagger-index': 4 }">
        <span class="segment-label">Sel</span>
        <span class="segment-value font-mono">{{ editor.selectionCount }}</span>
      </div>
    </template>

    <!-- Selection rect segment (conditional) -->
    <template v-if="editor.selectionRect">
      <div class="status-divider" :style="{ '--stagger-index': 5 }" />
      <div class="status-segment" :style="{ '--stagger-index': 6 }">
        <span class="segment-label">Rect</span>
        <span class="segment-value font-mono">
          {{ editor.selectionRect.width }}×{{ editor.selectionRect.height }}
          <span class="segment-dim">({{ editor.selectionRect.width * editor.selectionRect.height }} cells)</span>
        </span>
      </div>
    </template>

    <div class="status-divider" :style="{ '--stagger-index': 7 }" />

    <!-- Layer segment — prominent with colored dot -->
    <div class="status-segment status-segment--layer" :style="{ '--stagger-index': 8 }">
      <span class="layer-dot" />
      <span class="segment-label">Layer</span>
      <span class="segment-value segment-value--layer">{{ activeLayerName }}</span>
    </div>

    <v-spacer />

    <!-- Zoom segment — right-aligned -->
    <div class="status-segment status-segment--zoom" :style="{ '--stagger-index': 9 }">
      <span class="segment-label">Zoom</span>
      <span class="segment-value font-mono">{{ Math.round(editor.zoom * 100) }}%</span>
    </div>
  </div>
</template>

<style scoped>
/* ── Container ─────────────────────────────────────────── */
.statusbar-inner {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 12px;
  min-height: 28px;
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.94), rgba(20, 20, 35, 0.94));
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
  animation: statusbar-enter 0.3s ease both;
}

/* Noise/grain texture overlay */
.statusbar-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.02;
  background-image: repeating-conic-gradient(#fff 0.00005%, transparent 0.0001%);
  background-size: 4px 4px;
  pointer-events: none;
}

/* Subtle top highlight */
.statusbar-inner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.05), transparent);
  pointer-events: none;
}

/* ── Segments ──────────────────────────────────────────── */
.status-segment {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  position: relative;
  z-index: 1;
  animation: segment-enter 0.25s ease both;
  animation-delay: calc(var(--stagger-index, 0) * 12ms);
  transition: background 0.2s ease;
}

/* Highlighted segment (selection) */
.status-segment--highlight {
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.status-segment--highlight .segment-value {
  color: rgb(var(--v-theme-primary));
}

/* Layer segment - slightly larger/bolder */
.status-segment--layer {
  gap: 6px;
}

.status-segment--layer .segment-value {
  font-weight: 600;
  color: var(--layer-color, #4fc3f7);
}

/* Zoom segment - right side */
.status-segment--zoom .segment-value {
  color: var(--layer-color, #4fc3f7);
}

/* ── Dividers ──────────────────────────────────────────── */
.status-divider {
  width: 1px;
  height: 14px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.08), transparent);
  margin: 0 4px;
  flex-shrink: 0;
  animation: segment-enter 0.25s ease both;
  animation-delay: calc(var(--stagger-index, 0) * 12ms);
}

/* ── Labels and values ─────────────────────────────────── */
.segment-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  user-select: none;
  white-space: nowrap;
}

.segment-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.font-mono {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
}

/* Dimension sub-label (e.g. "(24 cells)") */
.segment-dim {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'DM Mono', monospace;
  margin-left: 2px;
}

/* ── Layer colored dot ─────────────────────────────────── */
.layer-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--layer-color, #4fc3f7);
  box-shadow: 0 0 6px rgba(var(--layer-color-rgb, 79, 195, 247), 0.5);
  animation: dot-pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

/* ── Keyframes ─────────────────────────────────────────── */
@keyframes statusbar-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes segment-enter {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dot-pulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
    box-shadow: 0 0 10px rgba(var(--layer-color-rgb, 79, 195, 247), 0.7);
  }
}
</style>
