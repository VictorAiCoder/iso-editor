<script setup lang="ts">
import { ref } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { useEditorStore } from '@/stores/editor'
import PlanImageUploader from './PlanImageUploader.vue'

const scene = useSceneStore()
const editor = useEditorStore()
const showUploader = ref(false)

function addPlan() {
  showUploader.value = true
}

function onPlanClick(planId: string) {
  editor.selectPlanImage(planId)
}

function onUploaderUpload() {
  showUploader.value = false
}

function onUploaderCancel() {
  showUploader.value = false
}
</script>

<template>
  <v-card flat class="pa-3">
    <v-card-title class="text-body-2 font-weight-bold pa-0 mb-2 d-flex align-center">
      <v-icon icon="mdi-image-area" class="mr-1" size="small" />
      План-подложки
      <v-spacer />
      <v-btn
        icon="mdi-plus"
        variant="text"
        size="x-small"
        color="primary"
        title="Добавить план"
        @click="addPlan"
      />
    </v-card-title>

    <!-- Empty state -->
    <div v-if="scene.planImages.length === 0" class="empty-state">
      <div class="empty-state__icon">
        <v-icon icon="mdi-image-off-outline" size="32" color="text-disabled" />
      </div>
      <div class="text-body-2 text-medium-emphasis">Нет планов</div>
      <div class="text-caption text-disabled mb-4">Нажмите + или перетащите файл</div>
      <v-btn
        variant="tonal"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="addPlan"
      >
        Загрузить план
      </v-btn>
    </div>

    <!-- Plan list -->
    <div v-else class="plan-list">
      <div
        v-for="(plan, index) in scene.planImages"
        :key="plan.id"
        class="plan-item"
        :class="{ 'plan-item--selected': editor.selectedPlanImageId === plan.id }"
        :style="{ '--stagger-delay': `${index * 40}ms` }"
        @click="onPlanClick(plan.id)"
      >
        <div class="plan-item__header">
          <div class="plan-thumb">
            <div class="checker-bg"></div>
            <v-avatar :image="plan.dataUrl" size="40" rounded="4" class="plan-thumb__avatar" />
          </div>

          <div class="plan-item__info">
            <div class="text-body-2 plan-item__name">{{ plan.name }}</div>
            <div class="text-caption text-medium-emphasis font-mono">
              {{ plan.width }}×{{ plan.height }} · {{ Math.round((plan.opacity ?? 1) * 100) }}%
            </div>
          </div>

          <v-btn
            icon="mdi-delete"
            variant="text"
            size="x-small"
            color="error"
            @click="(e: Event) => { e.stopPropagation(); scene.removePlanImage(plan.id) }"
            title="Удалить план"
            class="plan-item__delete"
          />
        </div>

        <v-slider
          v-model="plan.opacity"
          :min="0"
          :max="1"
          :step="0.1"
          hide-details
          density="compact"
          thumb-label="hover"
          class="plan-item__slider"
          @update:model-value="(val) => scene.updatePlanImage(plan.id, { opacity: val })"
        />

        <div class="plan-item__rotation">
          <v-btn-toggle
            :model-value="plan.rotation || 0"
            @update:model-value="(v: number) => scene.updatePlanImage(plan.id, { rotation: v })"
            mandatory
            density="compact"
            variant="outlined"
            color="primary"
            size="x-small"
          >
            <v-btn :value="0" size="x-small">0°</v-btn>
            <v-btn :value="90" size="x-small">90°</v-btn>
            <v-btn :value="180" size="x-small">180°</v-btn>
            <v-btn :value="270" size="x-small">270°</v-btn>
          </v-btn-toggle>
        </div>
      </div>
    </div>

    <!-- uploader dialog -->
    <PlanImageUploader
      v-model="showUploader"
      :rect="null"
      @uploaded="onUploaderUpload"
      @update:modelValue="onUploaderCancel"
    />
  </v-card>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

/* ── Empty state ──────────────────────────────────────────── */
.empty-state {
  padding: 24px 16px;
  text-align: center;
}

.empty-state__icon {
  margin-bottom: 8px;
  opacity: 0.5;
}

/* ── Plan list ────────────────────────────────────────────── */
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-item {
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px;
  transition: all 0.2s ease;
  animation: fade-in 0.25s ease both;
  animation-delay: var(--stagger-delay, 0ms);
}

.plan-item:hover {
  background: rgba(var(--v-theme-primary), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.plan-item--selected {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.plan-item__info .font-mono {
  font-size: 0.75rem;
  line-height: 1.4;
}

/* ── Plan header row ──────────────────────────────────────── */
.plan-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-item__info {
  flex: 1;
  min-width: 0;
}

.plan-item__name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-item__delete {
  flex-shrink: 0;
}

/* ── Thumbnail with checkerboard ──────────────────────────── */
.plan-thumb {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.plan-thumb .checker-bg {
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

.plan-thumb__avatar {
  position: relative;
  z-index: 1;
}

/* ── Opacity slider ───────────────────────────────────────── */
.plan-item__slider {
  margin-top: 4px;
  padding: 0 4px;
}

.plan-item__rotation {
  margin-top: 4px;
  padding: 0 4px;
  display: flex;
  justify-content: center;
}

/* ── Typography ───────────────────────────────────────────── */
.font-mono {
  font-family: 'DM Mono', monospace;
  font-weight: 500;
}

/* ── Animation ────────────────────────────────────────────── */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
