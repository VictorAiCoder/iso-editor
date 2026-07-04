# Anti-patterns to Avoid

## Critical
1. **Using `ref` for IsoRenderer** — breaks Pixi.js ObservablePoint. Always `shallowRef`.
2. **Calling `.set()` on ObservablePoint** — `_onUpdate` is null in v8, silently fails. Use direct property assignment.
3. **Not calling `pushHistory()` after entity mutations** — breaks undo/redo.
4. **Mutating scene state directly from components** — always use store actions.
5. **Not checking `layer.locked` before mutations** — locked layers can still be modified.

## Moderate
6. **Watching Pinia arrays without `{ deep: true }`** — `push()` mutates in place, reference doesn't change.
7. **Importing stores via relative paths** — use `@/stores/...` alias consistently.
8. **Adding sprites to `app.stage`** — preview sprite must go in `IsoRenderer.stage`.
9. **Using `stage.scale.set(zoom)`** — direct property assignment required.
10. **Duplicate `Vec2` type definitions** — centralize in `types/scene.ts`.

## Minor
11. **Mixed Russian/English in comments and UI** — pick one language per context.
12. **`updateEntity` calling `pushHistory()` even when entity not found** — guard with early return.
13. **`useCanvasInput` competing with native handlers** — two sets of pointer listeners on canvas.
14. **Module-level `ref` in composables** — fragile pattern, ensure used within Vue context.
