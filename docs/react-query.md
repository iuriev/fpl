# React Query Conventions

Project-specific rules for defining and testing React Query hooks. These supplement `docs/testing.md`.

## Defining query hooks

All query hooks live in `web/src/api/queries.ts`. Each hook wraps a single proxy endpoint and returns the raw `UseQueryResult` from `useQuery` or `useMutation`.

---

## Testing

### Casting mock return values

When mocking a query hook with `vi.mocked(queries).useXxx.mockReturnValue(...)`, TypeScript will reject a partial object as `UseQueryResult<T, Error>` because the type has many required fields. Use a double cast via `unknown`:

```ts
// BAD — TS2352: "may be a mistake because neither type sufficiently overlaps"
mockQueries.usePriceChanges.mockReturnValue({
  data: emptyChanges,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
} as ReturnType<typeof queries.usePriceChanges>);

// GOOD — cast through unknown to satisfy strict overlap check
mockQueries.usePriceChanges.mockReturnValue({
  data: emptyChanges,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
} as unknown as ReturnType<typeof queries.usePriceChanges>);
```

**Why:** `UseQueryResult` has many fields (`status`, `fetchStatus`, `isFetching`, …) that a minimal test stub doesn't need to provide. The `as unknown as T` pattern is the idiomatic workaround when the test-stub shape is intentionally narrower than the full type.

### Mock only what the component reads

Keep mock stubs minimal — include only the fields the component under test actually reads (`data`, `isLoading`, `isError`, `refetch`). Do not fill in the full `UseQueryResult` shape.

### Module-level mock + per-test override pattern

```ts
vi.mock('@/api/queries', () => ({
  usePriceChanges: vi.fn(),
  usePricePredictions: vi.fn(),
}));

const mockQueries = vi.mocked(queries);

function setupMocks() {
  mockQueries.usePriceChanges.mockReturnValue({
    data: defaultData,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.usePriceChanges>);
}

beforeEach(() => {
  vi.clearAllMocks();
  setupMocks();
});

it('overrides for a specific case', () => {
  mockQueries.usePriceChanges.mockReturnValue({
    data: otherData,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof queries.usePriceChanges>);
  // ...
});
```
