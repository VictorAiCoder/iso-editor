# Testing Patterns

## Framework
- Vitest with jsdom environment
- Tests in `src/test/`
- Run: `npm run test`

## Test Files
| File | Tests |
|---|---|
| `coords.test.ts` | Round-trip iso↔screen, snap precision |
| `sceneStore.test.ts` | addEntity, removeEntity, undo/redo, toJSON/fromJSON |
| `useGridSelection.test.ts` | Click-click flow, buildRect, clear |

## Conventions
1. **Test pure functions** — `coords.ts` functions are easily testable.
2. **Test store actions** — Pinia stores can be tested with `createPinia()`.
3. **Test composables** — `useGridSelection` tested with mock store.
4. **jsdom environment** — DOM APIs available, WebGL not available.
5. **`globals: true`** — `describe`, `it`, `expect` available without imports.

## What to Test
- Coordinate conversion round-trips
- Store mutation logic (add/remove/undo/redo)
- GridRect calculation
- Selection toggle/clear
- JSON serialization/deserialization

## What NOT to Test
- Pixi.js rendering (jsdom can't do WebGL)
- Vuetify component rendering (test logic, not UI)
- Browser-specific APIs (pointer events, etc.)
