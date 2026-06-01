# Design: Compact Player Cards and Scrollable Layout for SquadScreen

## CSS Changes (`SquadScreen.module.css`)

### 1. Scrollable Container
Update `.squadCol` to allow vertical scrolling when height is limited.

```css
@media (max-height: 800px) {
  .squadCol {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

### 2. Sticky Headers
Make `.header`, `.gwNav`, and `.viewToggleWrap` sticky.

```css
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--fpl-bg-deep);
}

.gwNav {
  position: sticky;
  top: 4.5rem; /* Approximate height of header */
  z-index: 19;
  background: var(--fpl-bg-deep);
}

.viewToggleWrap {
  position: sticky;
  top: 7.5rem; /* Approximate height of header + gwNav */
  z-index: 18;
  background: var(--fpl-bg-deep);
}
```

### 3. Pitch Minimum Height
Prevent `.pitchWrap` from shrinking too much.

```css
@media (max-height: 800px) {
  .pitchWrap {
    min-height: 34rem;
    flex: none;
  }
}
```

## Verification Plan
- Manual check of `SquadScreen` layout on small screen heights (simulated).
- Run existing tests for `SquadScreen` to ensure no regressions.
- Linting.
