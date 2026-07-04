<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useSceneStore } from '@/stores/scene'
import type { LayerId } from '@/types/scene'

defineProps<{ visible: boolean }>()

const editor = useEditorStore()
const scene = useSceneStore()

// ── Layer colour palette ──────────────────────────────────
const layerColors: Record<LayerId, string> = {
  buildings: '#4fc3f7',
  plants: '#81c784',
  plumbing: '#ffb74d',
  appliance: '#e57373',
}

const layerRgb: Record<LayerId, string> = {
  buildings: '79, 195, 247',
  plants: '129, 199, 132',
  plumbing: '255, 183, 77',
  appliance: '229, 115, 115',
}

// ── Reactive layer accent ─────────────────────────────────
const activeColor = computed(() => layerColors[editor.activeLayerId])
const activeRgb = computed(() => layerRgb[editor.activeLayerId])

// ── FPS counter via requestAnimationFrame ──────────────────
const fps = ref(0)

let frameCount = 0
let lastTime = performance.now()
let rafId = 0

function tick(now: DOMHighResTimeStamp) {
  frameCount++
  const elapsed = now - lastTime
  if (elapsed >= 1000) {
    fps.value = Math.round((frameCount * 1000) / elapsed)
    frameCount = 0
    lastTime = now
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})

// ── FPS colour coding ─────────────────────────────────────
const fpsColor = computed(() => {
  const f = fps.value
  if (f >= 30) return '#81c784'
  if (f >= 15) return '#ffb74d'
  return '#e57373'
})

// fpsRgb is available for CSS variable usage if needed:
// const fpsRgb = computed(() => { ... })
</script>

<template>
  <v-slide-x-reverse-transition>
    <div
      v-if="visible"
      class="debug-overlay"
      :style="{
        '--layer-color': activeColor,
        '--layer-color-rgb': activeRgb,
      }"
    >
      <!-- Header -->
      <div class="debug-header">
        <v-icon icon="mdi-bug-outline" size="small" class="debug-header__icon" />
        <span class="debug-header__title">Debug</span>
        <span class="debug-header__shortcut">F3</span>
      </div>

      <!-- Data table -->
      <table class="debug-table">
        <tbody>
          <tr class="debug-row debug-row--fps" :style="{ '--stagger-index': 0 }">
            <td class="debug-label">
              <span class="live-dot" :style="{ background: fpsColor }" />
              FPS
            </td>
            <td class="debug-value font-mono" :style="{ color: fpsColor }">
              {{ fps }}
            </td>
          </tr>
          <tr class="debug-row" :style="{ '--stagger-index': 1 }">
            <td class="debug-label">Cursor</td>
            <td class="debug-value font-mono">
              {{ editor.cursorIso.x.toFixed(1) }}, {{ editor.cursorIso.y.toFixed(1) }}
            </td>
          </tr>
          <tr class="debug-row" :style="{ '--stagger-index': 2 }">
            <td class="debug-label">Entities</td>
            <td class="debug-value font-mono">{{ scene.entities.length }}</td>
          </tr>
          <tr class="debug-row" :style="{ '--stagger-index': 3 }">
            <td class="debug-label">Selected</td>
            <td class="debug-value font-mono">{{ editor.selection.size }}</td>
          </tr>
          <tr class="debug-row" :style="{ '--stagger-index': 4 }">
            <td class="debug-label">Zoom</td>
            <td class="debug-value font-mono">{{ editor.zoom }}×</td>
          </tr>
          <tr class="debug-row" :style="{ '--stagger-index': 5 }">
            <td class="debug-label">Layer</td>
            <td class="debug-value font-mono" :style="{ color: activeColor }">
              {{ editor.activeLayerId }}
            </td>
          </tr>
          <tr class="debug-row" :style="{ '--stagger-index': 6 }">
            <td class="debug-label">History</td>
            <td class="debug-value font-mono">{{ scene.history.length }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </v-slide-x-reverse-transition>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

/* ── Container ─────────────────────────────────────────── */
.debug-overlay {
  position: fixed;
  top: 80px;
  right: 16px;
  z-index: 9999;
  min-width: 210px;
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(20, 20, 35, 0.95));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(var(--layer-color-rgb, 79, 195, 247), 0.08);
}

/* Noise texture */
.debug-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.02;
  background-image: repeating-conic-gradient(#fff 0.00005%, transparent 0.0001%);
  background-size: 4px 4px;
  pointer-events: none;
}

/* ── Header ────────────────────────────────────────────── */
.debug-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;
  user-select: none;
}

/* Gradient line under header */
.debug-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 12px;
  right: 12px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(var(--layer-color-rgb, 79, 195, 247), 0.3),
    transparent
  );
}

.debug-header__icon {
  color: var(--layer-color, #4fc3f7) !important;
  font-size: 16px;
}

.debug-header__title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--layer-color, #4fc3f7);
}

.debug-header__shortcut {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: auto;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Table ─────────────────────────────────────────────── */
.debug-table {
  width: 100%;
  border-collapse: collapse;
  position: relative;
  z-index: 1;
}

.debug-row {
  animation: row-enter 0.2s ease both;
  animation-delay: calc(var(--stagger-index, 0) * 20ms);
  transition: background 0.15s ease;
}

.debug-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* Alternating row backgrounds */
.debug-row:nth-child(even) {
  background: rgba(255, 255, 255, 0.015);
}

.debug-row:nth-child(even):hover {
  background: rgba(255, 255, 255, 0.04);
}

/* FPS row — slightly more prominent */
.debug-row--fps {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.debug-label {
  padding: 3px 8px 3px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  vertical-align: middle;
}

.debug-value {
  padding: 3px 12px 3px 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  text-align: right;
  white-space: nowrap;
  vertical-align: middle;
}

.font-mono {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
}

/* ── Live dot (next to FPS) ────────────────────────────── */
.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
  animation: live-blink 1.5s ease-in-out infinite;
}

/* ── Keyframes ─────────────────────────────────────────── */
@keyframes row-enter {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes live-blink {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}
</style>
