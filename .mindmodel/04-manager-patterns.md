# Manager Patterns (Pixi.js)

## Class Structure
```typescript
export class XxxManager {
  private _watchers: WatchStopHandle[] = []
  
  constructor(
    stage: Container,
    store: ReturnType<typeof useXxxStore>,
  ) {
    // Create Pixi objects
    // Add to stage
    // Set up Vue watchers → Pixi updates
  }
  
  destroy() {
    // Stop all watchers
    // Remove children from stage
    // Destroy Pixi objects
  }
}
```

## Lifecycle
1. `constructor()` — create Pixi objects, add to stage, start watchers
2. `destroy()` — stop watchers, remove children, destroy Pixi objects
3. IsoRenderer owns all managers, instantiates in dependency order

## IsoRenderer Dependency Order
1. CameraManager
2. PlanImageManager
3. GridRenderer
4. CursorRenderer
5. LayerManager
6. SpriteManager

## Pixi.js v8 Rules (CRITICAL)
1. **`shallowRef` for IsoRenderer** — Vue reactive proxy breaks `ObservablePoint`
2. **Direct property assignment** — `stage.scale.x = zoom`, never `.set(zoom)`
3. **`ObservablePoint._onUpdate` is null in v8** — `.set()` silently fails
4. **Preview sprite in `IsoRenderer.stage`**, not `app.stage`
5. **Pixel-perfect** — `scaleMode: 'nearest'`, `antialias: false`

## Watcher Pattern
```typescript
// Bridge Pinia state → Pixi rendering
this._watchers.push(
  watch(() => store.zoom, (zoom) => {
    this._stage.scale.x = zoom  // direct assignment!
    this._stage.scale.y = zoom
  })
)
```

## Anti-patterns
- ❌ Using `ref` instead of `shallowRef` for IsoRenderer
- ❌ Calling `container.scale.set(zoom)` 
- ❌ Adding sprites to `app.stage` instead of `IsoRenderer.stage`
- ❌ Forgetting to store/clean up watchers
