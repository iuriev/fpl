# React Component Conventions

Project-specific rules for writing React components and hooks. These supplement `docs/frontend.md` and take precedence over generic React advice where they conflict.

## Hooks

### Always destructure custom hook return values

If a custom hook returns an object that contains a `RefObject`, do **not** store the result as a named variable and access properties via dot notation in JSX or render logic:

```tsx
// BAD — React Compiler v7 (eslint-plugin-react-hooks ≥ 7) flags every property
// access on `list` because the object contains a RefObject.
const list = useProgressiveList(items);
return <>{list.visible.map(...)}</>;

// GOOD — destructuring lets the compiler analyse each binding independently.
const { visible, hasMore, sentinelRef } = useProgressiveList(items);
return <>{visible.map(...)}</>;
```

When the same hook is called multiple times (e.g. separate lists on a single screen), use aliased destructuring:

```tsx
const { visible: defconVisible, hasMore: defconHasMore, sentinelRef: defconSentinelRef } =
  useProgressiveList(defconPlayers);
const { visible: bpsVisible, hasMore: bpsHasMore, sentinelRef: bpsSentinelRef } =
  useProgressiveList(bpsPlayers);
```

**Why:** `eslint-plugin-react-hooks` v7 (React Compiler rules) treats any object that contains a `RefObject` as a "ref-containing value" and reports `react-hooks/refs` on every property access of that object during render — even plain array or boolean properties. Destructuring eliminates this false positive.

---

## State

### Prefer derived state over `useEffect` + `setState`

`eslint-plugin-react-hooks` v7 reports `react-hooks/set-state-in-effect` when `setState` is called synchronously inside a `useEffect`. Where possible, eliminate the effect by computing the value inline:

```tsx
// BAD — triggers react-hooks/set-state-in-effect
useEffect(() => {
  if ((activeTab === 'xa' || activeTab === 'xg') && posTab === 'GK') {
    setPosTab('FWD');
  }
}, [activeTab, posTab]);

// GOOD — derived value, no effect needed
const effectivePosTab: PositionTab =
  (activeTab === 'xa' || activeTab === 'xg') && posTab === 'GK' ? 'FWD' : posTab;
```

When a state value must reset whenever a tab/mode changes, derive it rather than storing it separately:

```tsx
// BAD — uses a ref in render + setState inside render
const prevTab = useRef(activeTab);
if (prevTab.current !== activeTab) {
  prevTab.current = activeTab;
  if (activeTab !== 'points') setViewMode('list');
}

// GOOD — viewMode is derived; userViewMode stores the user's explicit choice
const [userViewMode, setViewMode] = useState<ViewMode>('list');
const viewMode = activeTab === 'points' ? userViewMode : 'list';
```

### When `setState` inside `useEffect` is intentional

Some patterns are legitimate but still trigger the rule (e.g. one-shot initialisation from async data, reset-on-close). In these cases add a targeted disable comment — do **not** suppress the whole file:

```tsx
useEffect(() => {
  if (!periodInitialized.current && gameweeksData) {
    periodInitialized.current = true;
    if (gameweeksData.current >= MAX_GAMEWEEK) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeriod('season');
    }
  }
}, [gameweeksData]);
```

---

## Memoisation

### Remove manual `useMemo`/`useCallback` that the React Compiler can handle

`eslint-plugin-react-hooks` v7 reports `react-hooks/preserve-manual-memoization` ("Compilation Skipped") when it finds manual memoisation it cannot guarantee is safe. Remove the wrapper and write plain expressions — the React Compiler will optimise automatically:

```tsx
// BAD — triggers preserve-manual-memoization on simple derivations
const flag = useMemo(() => {
  if (!entry?.regionIsoCode) return null;
  return [...entry.regionIsoCode.toUpperCase()]
    .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
    .join('');
}, [entry?.regionIsoCode]);

// GOOD — plain conditional expression
const flag = entry?.regionIsoCode
  ? [...entry.regionIsoCode.toUpperCase()]
      .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
      .join('')
  : null;
```

Keep explicit `useMemo`/`useCallback` only for values that are expensive to compute or must be referentially stable (e.g. passed as a dependency to another hook, or prevent child re-renders in a hot list).
