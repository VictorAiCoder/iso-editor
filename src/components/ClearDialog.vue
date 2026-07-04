<script setup lang="ts">
import { useSceneStore } from '@/stores/scene'
import { useEditorStore } from '@/stores/editor'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const scene = useSceneStore()
const editor = useEditorStore()

function confirm() {
  scene.setEntities([])
  scene.setPlanImages([])
  editor.clearSelection()
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="props.modelValue" @update:model-value="(v: boolean) => emit('update:modelValue', v)" max-width="400">
    <v-card>
      <v-card-title class="text-body-1 font-weight-bold">
        <v-icon icon="mdi-alert" color="warning" class="mr-2" />
        Очистить сцену
      </v-card-title>
      <v-card-text>
        Вы уверены, что хотите очистить сцену? Все сущности и планы будут удалены. Это действие нельзя отменить.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Отмена</v-btn>
        <v-btn color="error" variant="tonal" @click="confirm">Очистить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
