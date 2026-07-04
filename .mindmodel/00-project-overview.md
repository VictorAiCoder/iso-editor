# Project Overview: ISO Editor v2

## What This Is
Isometric pixel-art scene editor — a browser SPA where users place sprites on a 2:1 dimetric grid, manage layers, transform objects, and save/load scenes as JSON.

## Tech Stack
- Vue 3.5 (Composition API, `<script setup>`)
- TypeScript 6.0 (strict, erasableSyntaxOnly)
- Vite 8.0
- Pixi.js 8.18 (WebGL rendering)
- Vuetify 3.12 (Material Design UI)
- Pinia 3 (state management)
- VueUse (useStorage, useDebounceFn)
- nanoid (entity IDs)
- Vitest (unit tests, jsdom)

## Architecture
- **Vue components = UI only.** All business logic in `src/editor/` or `src/stores/`.
- **IsoRenderer = Facade** over Pixi.js. Only interface to Pixi. Direct Pixi mutations forbidden.
- **Pinia stores** hold all reactive state. All mutations through store actions.
- **Composables** encapsulate reusable logic (hotkeys, canvas input, drag, grid selection).

## Key Constants
- Tile: 64×32 px, dimetric 2:1
- Grid: 100×100 cells, center at (0,0)
- Anchor: `{0.5, 1.0}` (bottom-center)
- Max undo history: 50 steps
- Autosave debounce: 2 seconds
