# Vue Component Patterns

## SFC Structure
```vue
<script setup lang="ts">
// Imports
// Props & Emits
// Store instantiation (top level)
// Composable instantiation
// Local state (ref, computed)
// Actions
// Watchers
// Lifecycle hooks
</script>

<template>
  <!-- Vuetify components only -->
</template>

<style scoped>
/* Component-scoped styles */
</style>
```

## Rules
1. **`<script setup lang="ts">`** — always, no Options API.
2. **Props via TypeScript generics** — `defineProps<{...}>()`, no runtime validation.
3. **Emits via TypeScript generics** — `defineEmits<{...}>()`.
4. **v-model pattern for dialogs** — `modelValue`/`update:modelValue` pair.
5. **Store access at top level** — `const editor = useEditorStore()` in setup, not in hooks.
6. **Composables destructured at top level** — `const { save, load } = useFileOps()`.
7. **All UI is Vuetify** — no custom CSS components.
8. **`@click.stop`** on interactive elements inside clickable containers.
9. **Native `addEventListener`** only when DOM element is replaced at runtime (Pixi canvas).
10. **`defineExpose`** sparingly — only `EditorCanvas` exposes its renderer.

## Vuetify Conventions
- `density="compact"` on all form controls
- `variant="text"` for icon buttons, `"outlined"` for toggles, `"tonal"` for actions
- Theme colors via `rgb(var(--v-theme-primary))` in CSS
- MDI icons: `mdi-*` prefix exclusively
- Text utilities: `text-body-2`, `text-caption`, `text-medium-emphasis`

## CSS Conventions
- `<style scoped>` for component styles
- `<style>` (global) only in `App.vue` for body reset and fullscreen canvas
- Transitions: `<transition name="slide-left">` with transform/opacity
- Pixel art: `image-rendering: pixelated` on all sprite images
- Panel backgrounds: `rgba(var(--v-theme-surface), 0.92)` + `backdrop-filter: blur(8px)`
