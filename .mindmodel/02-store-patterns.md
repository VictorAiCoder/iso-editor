# Store Patterns (Pinia)

## Structure
All stores use Composition API style:
```typescript
export const useXxxStore = defineStore('xxx', () => {
  // --- State ---
  const data = ref<Type[]>([])
  
  // --- Getters ---
  const derived = computed(() => ...)
  
  // --- Actions ---
  function doSomething() { ... }
  
  return { data, derived, doSomething }
})
```

## Rules
1. **Never mutate state directly in components.** Always call store actions.
2. **All mutations go through explicit action functions.**
3. **`pushHistory()` after every entity/plan mutation** (for undo/redo).
4. **Selection Set requires replacement** — `selection.value = new Set(selection.value)` after add/delete to trigger reactivity.
5. **Persisted state uses `useStorage`** from `@vueuse/core` — auto-syncs to localStorage.
6. **Deep watchers** (`{ deep: true }`) required for arrays mutated via `push()`.

## Store Roles
| Store | Purpose | Key State |
|---|---|---|
| `scene` | Data: entities, layers, plan images, undo history | `entities`, `layers`, `planImages`, `history`, `historyIndex` |
| `editor` | UI state: selection, zoom, tool, grid | `selection`, `zoom`, `tool`, `gridVisible`, `canUndo`, `canRedo` |
| `catalog` | Asset catalog: static JSON, search, grouping | `assets`, `searchQuery`, `groupedByLayer` |

## Anti-patterns to Avoid
- ❌ Mutating `entities.value.push(...)` without calling `pushHistory()`
- ❌ Using `ref` for IsoRenderer (use `shallowRef`)
- ❌ Calling `stage.scale.set()` (use direct property assignment)
- ❌ Watching arrays without `{ deep: true }`
