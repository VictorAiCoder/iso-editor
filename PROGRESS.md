# Progress Log — ISO Editor

## 🎯 Current Goal
M6: Полировка — ВЫПОЛНЕНО ✅. Все майлстоуны завершены (M1–M6).

## 📍 Status
- **Last updated:** 2026-05-28
- **Branch:** master
- **Phase:** COMPLETE ✅ (M1 ✅ → M2 ✅ → M3 ✅ → M4 ✅ → M5 ✅ → M6 ✅)
- **Build:** `npm run build` ✅ | `npx vue-tsc --noEmit` ✅ (0 errors)

## ✅ Done

### M1 — Каркас + Vuetify ✅
- [x] Vite + Vue 3.5 + TS strict + Pinia 3 + Pixi.js 8.18 + Vuetify 3.12 + Vitest
- [x] tsconfig, vite.config.ts, ESLint, Prettier
- [x] Vuetify 3: тёмная тема, MDI, компактные defaults
- [x] src/types/scene.ts: все типы данных
- [x] src/editor/coords.ts: изометрические формулы
- [x] src/assets/catalog.json: 9 ассетов, 4 слоя
- [x] Pinia stores: scene + editor + catalog
- [x] App.vue layout: v-app-bar + 2×navigation-drawer + v-main + v-footer + v-snackbar
- [x] 6 компонентов + useToast

### M2 — Камера и сетка ✅
- [x] CameraManager: pan, zoom 1-4x, screenToWorld/worldToScreen
- [x] GridRenderer: 100×100 изосетка, highlightRange
- [x] CursorRenderer: ромбик, snap, pointermove
- [x] LayerManager: 4 Container, zIndex/visible sync
- [x] SpriteManager: texture cache, syncEntities, highlightSelection
- [x] IsoRenderer: фасад Pixi, 5 менеджеров, watchers
- [x] useCanvasInput: pointer events composable
- [x] Fix 32 TS errors

### M3 — Размещение сущностей ✅
- [x] App.vue: полная Vuetify раскладка
- [x] AssetPalette: палитра с поиском по слоям, preview
- [x] LayerPanel: visibility/lock toggle, entity count, clear layer
- [x] Click-to-place: tool='place' → клик → entity → reset
- [x] useHotkeys: Delete, Escape, V/P/R, G, +/-, Ctrl+Z/Y/D/S/O, стрелки
- [x] SpriteManager: fallback текстура (Canvas 2D), sorting по (x+y)
- [x] sceneStore.updateLayer()

### M4 — Выделение, трансформация, GridRect ✅
- [x] useGridSelection: start/move/end → GridRect
- [x] useDragGroup: drag группы с snap
- [x] Batch placement: Shift+drag → fill GridRect
- [x] IsoRenderer.highlightSelectionRange()
- [x] EditorCanvas: pointer handlers integration

### M5 — Слои, сцена и планы ✅
- [x] Save/Load: useFileOps.ts (toJSON→Blob→download, FileReader→fromJSON)
- [x] Ctrl+S / Ctrl+O hotkeys
- [x] ClearDialog: v-dialog подтверждения очистки
- [x] StatusBar: isoX, isoY, entity/selection count, active layer
- [x] LayerPanel: visibility/lock/clear с диалогами
- [x] TransformPanel: group delete при multi-selection
- [x] useToast → v-snackbar wiring

### M6 — Полировка ✅
- [x] Удалены HelloWorld.vue, useSelection.ts, pixi-contracts.json
- [x] DebugOverlay: F3 toggle, FPS, coords, entity count, zoom, history
- [x] useAutosave: debounced 2s localStorage persist + restore dialog
- [x] useDebugOverlay: shared reactive ref + toggleDebug()
- [x] App.vue: autosave restore dialog on mount
- [x] useHotkeys: F3 mapping
- [x] Build ✅ (0 TS errors)

## 🏗️ Final Architecture

### Стек
Vue 3 + TypeScript (strict) + Vite + Pixi.js v8 + Vuetify 3 + Pinia 3 + VueUse + nanoid

### Структура
```
src/
├── App.vue                          — layout + toast + autosave restore
├── main.ts                          — entry point
├── types/scene.ts                   — все типы
├── editor/
│   ├── coords.ts                    — изометрические формулы
│   ├── CameraManager.ts             — pan/zoom
│   ├── GridRenderer.ts              — сетка + highlight
│   ├── CursorRenderer.ts            — ромбик-курсор
│   ├── LayerManager.ts              — контейнеры слоёв
│   ├── SpriteManager.ts             — sprites + fallback + sorting
│   ├── IsoRenderer.ts               — фасад Pixi
│   └── composables/
│       ├── useCanvasInput.ts        — pointer events
│       ├── useHotkeys.ts            — keyboard shortcuts
│       ├── useGridSelection.ts      — GridRect выделение
│       └── useDragGroup.ts          — drag группы
├── stores/
│   ├── scene.ts                     — CRUD + undo/redo + toJSON/fromJSON
│   ├── editor.ts                    — состояние + persist
│   ├── catalog.ts                   — каталог ассетов
│   └── composables/
│       ├── useToast.ts              — toast notifications
│       ├── useFileOps.ts            — save/load JSON
│       ├── useAutosave.ts           — debounced autosave
│       └── useDebugOverlay.ts       — debug state
├── components/
│   ├── EditorCanvas.vue             — canvas + IsoRenderer + interaction
│   ├── AssetPalette.vue             — палитра ассетов
│   ├── LayerPanel.vue               — слои + visibility/lock/clear
│   ├── Toolbar.vue                  — инструменты + save/load/clear
│   ├── TransformPanel.vue           — трансформация + group delete
│   ├── StatusBar.vue                — нижняя строка
│   ├── ClearDialog.vue              — диалог подтверждения
│   └── DebugOverlay.vue             — debug overlay (F3)
├── plugins/vuetify.ts               — Vuetify config
└── assets/catalog.json              — каталог ассетов
```

### Майлстоуны
| # | Название | Статус |
|---|----------|--------|
| M1 | Каркас + Vuetify | ✅ |
| M2 | Камера и сетка | ✅ |
| M3 | Размещение сущностей | ✅ |
| M4 | Выделение, трансформация, GridRect | ✅ |
| M5 | Слои, сцена и планы | ✅ |
| M6 | Полировка | ✅ |

## 🧠 Ключевые решения
- **Архитектура:** Vue = UI, Pixi через IsoRenderer-фасад
- **erasableSyntaxOnly:** явные поля в конструкторах
- **Координаты:** tile 64×32 px, anchor {0.5, 1.0}, диметрия 2:1
- **GridRect:** cellX/cellY — нижний левый угол, растёт вверх-вправо
- **Fallback:** Canvas 2D placeholder texture
- **Autosave:** debounced 2s, localStorage key 'iso-editor:autosave'
- **Save/Load:** useFileOps shared composable

## 🔗 Key Files
(see architecture diagram above)

## ✅ MVP Criteria (from instructions.md)
Открыть редактор → выбрать ассет → разместить на сетке → выделить группу → продублировать → сдвинуть стрелками → изменить масштаб → скрыть слой → сохранить → перезагрузить → загрузить → получить ту же сцену с тостом об успехе.

**Status: ACHIEVED** ✅
