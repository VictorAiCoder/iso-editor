# Composable Patterns

## Structure
```typescript
export function useXxx(
  store: ReturnType<typeof useXxxStore>,
) {
  const state = ref<Type>(initialValue)
  
  function action() { ... }
  
  return { state, action }
}
```

## Types of Composables

### Stateful (return refs + actions)
- `useGridSelection` — drag-to-rect: `start()`, `move()`, `end()`, `clear()`
- `useDragGroup` — entity drag: `tryStart()`, `update()`, `end()`
- `useCanvasInput` — pointer events: `attach()`, `detach()`

### Global (module-level state)
- `useToast` — module-level `ref<ToastMessage | null>` singleton
- `useDebugOverlay` — module-level `ref(false)` with `toggleDebug()`

### File I/O (no UI dependencies)
- `useFileOps` — programmatic `<a>` download + `<input type="file">`
- `useAutosave` — debounced localStorage persist + restore

### Keyboard (lifecycle-bound)
- `useHotkeys` — `onMounted`/`onUnmounted` for `window` keydown listener

## Rules
1. **Receive stores as parameters** — never call `useXxxStore()` inside composables that are used in editor classes.
2. **Return refs and action functions** — not raw reactive objects.
3. **Clean up listeners** in `destroy()` or `onUnmounted`.
4. **Module-level state** for global singletons (toast, debug overlay).
5. **No side effects in getters** — pure computed only.

## Anti-patterns
- ❌ Calling store functions directly instead of receiving as parameters
- ❌ Forgetting cleanup of event listeners
- ❌ Mixing business logic into composables that should be pure
