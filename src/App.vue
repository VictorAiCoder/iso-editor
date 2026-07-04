<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Toolbar from './components/Toolbar.vue'
import AssetPalette from './components/AssetPalette.vue'
import LayerPanel from './components/LayerPanel.vue'
import TransformPanel from './components/TransformPanel.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import StatusBar from './components/StatusBar.vue'
import DebugOverlay from './components/DebugOverlay.vue'
import { useToast } from './stores/composables/useToast'
import { useAutosave } from './stores/composables/useAutosave'
import { debugVisible } from './stores/composables/useDebugOverlay'
import PlanImageUploader from './components/PlanImageUploader.vue'
import PlanImageSection from './components/PlanImageSection.vue'
import type { GridRect } from '@/types/scene'

const leftPanelOpen = ref(true)
const rightPanelOpen = ref(true)

const { toast, success: toastSuccess } = useToast()
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('info')

watch(toast, (msg) => {
  if (msg) {
    snackbarText.value = msg.text
    snackbarColor.value = msg.color ?? 'info'
    snackbar.value = true
  } else {
    snackbar.value = false
  }
})

// ── Autosave restore ──────────────────────────────────────
const { readAutosave, restoreAutosave, clearAutosave } = useAutosave()
const showRestoreDialog = ref(false)
const pendingAutosave = ref<ReturnType<typeof readAutosave>>(null)

onMounted(() => {
  const doc = readAutosave()
  if (doc) {
    pendingAutosave.value = doc
    showRestoreDialog.value = true
  }
})

function onRestoreConfirm() {
  if (pendingAutosave.value) {
    restoreAutosave(pendingAutosave.value)
    toastSuccess('Session restored')
  }
  showRestoreDialog.value = false
  pendingAutosave.value = null
}

function onRestoreDismiss() {
  clearAutosave()
  showRestoreDialog.value = false
  pendingAutosave.value = null
}

// ── Plan image upload ───────────────────────────────────────
const showPlanUploader = ref(false)
const pendingPlanRect = ref<GridRect | null>(null)

function onPlanRectComplete(rect: GridRect) {
  pendingPlanRect.value = rect
  showPlanUploader.value = true
}

function onPlanUploaded() {
  toastSuccess('План-подложка добавлена')
}
</script>

<template>
  <!-- Fullscreen canvas — always fills viewport -->
  <EditorCanvas class="canvas-fullscreen" @plan-rect-complete="onPlanRectComplete" />

  <!-- Top toolbar — floats over canvas -->
  <div class="overlay-top">
    <div class="toolbar-row">
      <v-btn
        icon
        size="small"
        variant="text"
        class="panel-toggle"
        @click="leftPanelOpen = !leftPanelOpen"
        :color="leftPanelOpen ? 'primary' : undefined"
        title="Палитра ассетов (Ctrl+\)"
      >
        <v-icon>{{ leftPanelOpen ? 'mdi-palette' : 'mdi-palette-outline' }}</v-icon>
      </v-btn>

      <v-divider vertical class="mx-1" />

      <Toolbar />

      <v-divider vertical class="mx-1" />

      <v-btn
        icon
        size="small"
        variant="text"
        class="panel-toggle"
        @click="rightPanelOpen = !rightPanelOpen"
        :color="rightPanelOpen ? 'primary' : undefined"
        title="Панели справа (Ctrl+])"
      >
        <v-icon>{{ rightPanelOpen ? 'mdi-view-panel-right' : 'mdi-view-panel-right-outline' }}</v-icon>
      </v-btn>
    </div>
  </div>

  <!-- Left panel — Asset Palette -->
  <transition name="slide-left">
    <div v-show="leftPanelOpen" class="overlay-left">
      <AssetPalette />
    </div>
  </transition>

  <!-- Right panel — Transform + Layers + Plan Images -->
  <transition name="slide-right">
    <div v-show="rightPanelOpen" class="overlay-right">
      <TransformPanel />
      <v-divider />
      <LayerPanel />
      <v-divider />
      <PlanImageSection />
    </div>
  </transition>

  <!-- Bottom status bar — floats over canvas -->
  <div class="overlay-bottom">
    <StatusBar />
  </div>

  <!-- Debug Overlay (F3 toggle) -->
  <DebugOverlay :visible="debugVisible" />

  <!-- Autosave restore dialog -->
  <v-dialog v-model="showRestoreDialog" max-width="400" persistent>
    <v-card>
      <v-card-title class="text-body-1 font-weight-bold">
        <v-icon icon="mdi-history" color="info" class="mr-2" />
        Restore last session?
      </v-card-title>
      <v-card-text>
        An autosaved session was found. Do you want to restore it?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="onRestoreDismiss">Discard</v-btn>
        <v-btn color="primary" variant="tonal" @click="onRestoreConfirm">Restore</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Plan image upload dialog -->
  <PlanImageUploader
    v-model="showPlanUploader"
    :rect="pendingPlanRect"
    @uploaded="onPlanUploaded"
  />

  <!-- Toast notifications -->
  <v-snackbar
    v-model="snackbar"
    :color="snackbarColor"
    timeout="3000"
    location="bottom"
  >
    {{ snackbarText }}
  </v-snackbar>
</template>

<style>
/* Reset Vite boilerplate — this is an app, not a landing page */
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1a1a2e;
}
</style>

<style scoped>
/* ── Top toolbar overlay ───────────────────────────── */
.overlay-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: auto;
  width: fit-content;
  margin: 0 auto;
  border-radius: 0 0 8px 8px;
}

.panel-toggle {
  border-radius: 6px;
  min-width: 32px !important;
  height: 32px !important;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.panel-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.panel-toggle:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* ── Left panel overlay ────────────────────────────── */
.overlay-left {
  position: fixed;
  top: 48px;
  left: 0;
  bottom: 32px;
  width: 320px;
  z-index: 50;
  overflow-y: auto;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(8px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

/* ── Right panel overlay ───────────────────────────── */
.overlay-right {
  position: fixed;
  top: 48px;
  right: 0;
  bottom: 32px;
  width: 280px;
  z-index: 50;
  overflow-y: auto;
  scrollbar-width: thin;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(8px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

/* ── Bottom status bar overlay ─────────────────────── */
.overlay-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.overlay-bottom > * {
  pointer-events: auto;
}

/* ── Slide transitions ─────────────────────────────── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

<style>
/* Fullscreen canvas — must NOT be scoped (Vue 3 can't scope child root elements) */
.canvas-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 0 !important;
}
</style>
