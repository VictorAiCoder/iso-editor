# Naming Conventions

## Files
- PascalCase for class-based files: `IsoRenderer.ts`, `CameraManager.ts`, `GridRenderer.ts`
- camelCase for utility/composable files: `coords.ts`, `useHotkeys.ts`, `useFileOps.ts`
- camelCase for store files: `scene.ts`, `editor.ts`, `catalog.ts`
- PascalCase for Vue SFCs: `EditorCanvas.vue`, `AssetPalette.vue`
- kebab-case for data files: `catalog.json`

## Classes
- PascalCase: `IsoRenderer`, `CameraManager`, `SpriteManager`
- Pattern: `{Noun}{Manager|Renderer|Composable}`

## Functions
- camelCase: `isoToPixel`, `pixelToIso`, `snap`, `calcSpriteScale`
- Composables: `use` prefix — `useHotkeys`, `useCanvasInput`, `useGridSelection`
- Store factories: `use{StoreName}Store` — `useSceneStore`, `useEditorStore`

## Variables
- Private class fields: `_` prefix — `_previewSprite`, `_isInitialized`, `_watchers`
- Constants: `UPPER_SNAKE_CASE` — `TILE_W`, `MAX_HISTORY`, `AUTOSAVE_KEY`
- Store references in classes: `_editorStore`, `_sceneStore` (injected via constructor)

## Types
- PascalCase: `Entity`, `Layer`, `GridRect`, `PlanImage`
- Type aliases: `LayerId`, `EntityId`, `Tool`, `LayerColor`
- Store instances typed as: `ReturnType<typeof useEditorStore>`

## Imports
- `@/` → `src/` (primary alias, used everywhere)
- `@editor/` → `src/editor/` (used only in composables)
- `@stores/` → `src/stores/` (rarely used, prefer `@/stores/`)
- Import order: external packages → alias imports → relative imports
