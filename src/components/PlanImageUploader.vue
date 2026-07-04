<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GridRect } from '@/types/scene'
import { useSceneStore } from '@/stores/scene'
import { useToast } from '@/stores/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  rect: GridRect | null
  defaultCellX?: number
  defaultCellY?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'uploaded': []
}>()

const scene = useSceneStore()
const toast = useToast()

const planName = ref('')
const dataUrl = ref<string | null>(null)
const fileName = ref('')
const loading = ref(false)
const opacity = ref(1)
const rotation = ref(0)

const fileInput = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => dataUrl.value !== null)

function getCenterPosition() {
  return { cellX: 50, cellY: 50 }
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  fileName.value = file.name

  if (!planName.value) {
    planName.value = file.name.replace(/\.[^/.]+$/, '')
  }

  loading.value = true
  const reader = new FileReader()

  reader.onload = () => {
    dataUrl.value = reader.result as string
    loading.value = false
  }

  reader.onerror = () => {
    dataUrl.value = null
    loading.value = false
    toast.error('Ошибка чтения файла')
  }

  reader.readAsDataURL(file)
}

function reset() {
  planName.value = ''
  dataUrl.value = null
  fileName.value = ''
  opacity.value = 1
  rotation.value = 0

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function apply() {
  if (!canSubmit.value) return
  const center = getCenterPosition()
  const cellX = props.rect?.cellX ?? props.defaultCellX ?? center.cellX
  const cellY = props.rect?.cellY ?? props.defaultCellY ?? center.cellY
  const width = props.rect?.width ?? 10
  const height = props.rect?.height ?? 10

  scene.addPlanImage({
    name: planName.value || 'План',
    dataUrl: dataUrl.value!,
    cellX,
    cellY,
    width,
    height,
    opacity: opacity.value,
    rotation: rotation.value,
  })

  emit('uploaded')
  emit('update:modelValue', false)
  reset()
}

function cancel() {
  reset()
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    max-width="480"
  >
    <v-card>
      <v-card-title class="text-body-1 font-weight-bold">
        <v-icon icon="mdi-image-area" color="primary" class="mr-2" />
        Загрузка план-подложки
      </v-card-title>

      <v-card-text class="d-flex flex-column ga-4">
        <v-chip
          v-if="props.rect"
          color="warning"
          variant="tonal"
          label
          size="small"
          class="align-self-start"
        >
          <v-icon start icon="mdi-grid" />
          Выделено {{ props.rect.width }} × {{ props.rect.height }} клеток
        </v-chip>

        <v-text-field
          v-model="planName"
          prepend-icon="mdi-rename-outline"
          placeholder="Название плана"
          variant="outlined"
          density="compact"
          hide-details
        />

        <div
          class="upload-zone"
          :class="{ 'upload-zone--filled': dataUrl }"
          @click="fileInput?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg"
            class="d-none"
            @change="onFileSelected"
          />

          <template v-if="loading">
            <v-progress-circular indeterminate size="40" color="primary" />
            <span class="text-caption text-medium-emphasis mt-2">Загрузка...</span>
          </template>

          <template v-else-if="dataUrl && fileName">
            <v-avatar :image="dataUrl" size="96" rounded="4" />
            <span class="text-caption text-medium-emphasis mt-2">{{ fileName }}</span>
          </template>

          <template v-else>
            <v-icon icon="mdi-plus-thick" size="40" color="text-disabled" />
            <span class="text-caption text-medium-emphasis mt-2">Нажмите для выбора PNG</span>
          </template>
        </div>

        <v-slider
          v-model="opacity"
          :min="0"
          :max="1"
          :step="0.1"
          label="Прозрачность"
          prepend-icon="mdi-opacity"
          thumb-label
          hide-details
        />

        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis" style="min-width: 32px;">
            <v-icon icon="mdi-rotate-right" size="small" class="mr-1" />
          </span>
          <v-btn-toggle
            v-model="rotation"
            mandatory
            density="compact"
            variant="outlined"
            color="primary"
          >
            <v-btn :value="0" size="small">0°</v-btn>
            <v-btn :value="90" size="small">90°</v-btn>
            <v-btn :value="180" size="small">180°</v-btn>
            <v-btn :value="270" size="small">270°</v-btn>
          </v-btn-toggle>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancel">Отмена</v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="!canSubmit"
          @click="apply"
        >
          Применить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 24px 16px;
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.23);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  min-height: 140px;
}

.upload-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.upload-zone--filled {
  border-style: solid;
  border-color: rgb(var(--v-theme-primary));
  padding: 16px;
  min-height: auto;
}
</style>
