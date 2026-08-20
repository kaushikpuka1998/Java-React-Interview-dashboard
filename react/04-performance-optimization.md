# React Performance & Optimization Interview Questions (Q231-Q300)

---

### Q231. What are the main reasons for unnecessary re-renders in React?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
Unnecessary re-renders occur when a component renders even though its output wouldn't change. The main causes are:

1. **Parent re-renders** - By default, all children re-render when parent does
2. **Prop changes** - New object/array references created on every render
3. **Context changes** - All consumers re-render when context value changes
4. **State changes** - Any state update triggers re-render, even if value is the same
5. **Anonymous functions** - New function references on every render
6. **Inline objects** - New object references in JSX props

React's default behavior is to re-render children when parent re-renders because it's safer and often cheap. Performance issues arise when expensive computations or large component trees re-render unnecessarily.

#### Code Example / Key Takeaways
```jsx
// Problem: New reference on every render
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <Child
      onClick={() => console.log('click')}  // New function each render
      style={{ color: 'red' }}              // New object each render
    />
  );
}

// Solution: Stable references
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => console.log('click'), []);
  const style = useMemo(() => ({ color: 'red' }), []);

  return <Child onClick={handleClick} style={style} />;
}
```

---

### Q232. How does React.memo work and when should you use it?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
`React.memo` is a higher-order component that memoizes the rendered output. It performs a shallow comparison of props and skips re-rendering if props haven't changed. It's useful for:

- Components that render often with the same props
- Expensive-to-render components
- Components deep in the tree that don't need to re-render when parent changes

It should NOT be used for:
- Components that always receive different props
- Small, cheap components (memoization overhead may outweigh benefits)
- Components where props change frequently anyway

#### Code Example / Key Takeaways
```jsx
import React, { memo } from 'react';

// Memoized component
const UserCard = memo(function UserCard({ user, onSelect }) {
  return (
    <div onClick={() => onSelect(user.id)}>
      {user.name}
    </div>
  );
});

// Alternative syntax
const UserCard = memo(function UserCard({ user }) {
  return <div>{user.name}</div>;
});
```

---

### Q233. What is the difference between shallow comparison and custom comparator in React.memo?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
`React.memo` accepts an optional second argument: a custom comparison function `(prevProps, nextProps) => boolean`.

- **Shallow comparison** (default): Compares each prop with `Object.is`. Objects/arrays are compared by reference, not content.
- **Custom comparator**: Returns `true` if props are "equal" (skip render), `false` if different (re-render). Use it when you need deep comparison or want to ignore certain props.

**Best practice**: Avoid custom comparators unless necessary. They run on every render and can hurt performance if expensive. Prefer stable references with `useMemo`/`useCallback` instead.

#### Code Example / Key Takeaways
```jsx
import React, { memo } from 'react';

const ExpensiveList = memo(
  function ExpensiveList({ items }) {
    return items.map(item => <li key={item.id}>{item.text}</li>);
  },
  // Custom comparator: only re-render if length or last item changes
  (prevProps, nextProps) => {
    return (
      prevProps.items.length === nextProps.items.length &&
      prevProps.items[prevProps.items.length - 1]?.id ===
      nextProps.items[nextProps.items.length - 1]?.id
    );
  }
);
```

---

### Q234. What is code splitting and how does it improve performance?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
Code splitting is the practice of breaking your bundle into smaller chunks that are loaded on demand rather than all at once. Benefits:

- **Faster initial load**: Users download only what they need for the current view
- **Smaller initial bundle**: Reduced Time to Interactive (TTI)
- **Better caching**: Unchanged chunks stay cached

With React, you use `React.lazy` for component-level splitting and dynamic `import()` for route/feature-based splitting. Bundle analyzers (webpack-bundle-analyzer) help identify splitting opportunities.

#### Code Example / Key Takeaways
```jsx
// Without splitting - everything in one bundle
import AdminPanel from './AdminPanel';

// With splitting - loaded on demand
const AdminPanel = React.lazy(() => import('./AdminPanel'));

// Route-based splitting
const routes = [
  { path: '/', component: React.lazy(() => import('./Home')) },
  { path: '/admin', component: React.lazy(() => import('./Admin')) },
];
```

---

### Q235. How do you use React.lazy and Suspense for code splitting?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
`React.lazy` lets you render a dynamic import as a regular component. `<Suspense>` shows a fallback while the lazy component loads.

Key points:
- `React.lazy` must return a Promise resolving to a module with a default export
- `<Suspense>` must wrap lazy components
- You can nest multiple Suspense boundaries for granular loading states
- Works in both Client and Server Components (with caveats in Next.js)

In React 18+, `Suspense` also handles data fetching with libraries like Relay or `use()` hook.

#### Code Example / Key Takeaways
```jsx
import React, { Suspense, lazy } from 'react';

const Chart = lazy(() => import('./Chart'));
const Modal = lazy(() => import('./Modal'));

function Dashboard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <Suspense fallback={<Spinner />}>
        <Chart />
      </Suspense>

      {showModal && (
        <Suspense fallback={<Spinner />}>
          <Modal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </div>
  );
}
```

---

### Q236. What is virtualization (windowing) and when should you use it?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Virtualization (windowing) renders only the visible portion of a large list, plus a small buffer. The DOM contains only ~20-50 items regardless of list size (10,000+ items).

Use it when:
- Lists have 100+ items
- Each row is moderately expensive to render
- You need smooth scrolling performance

Libraries: `react-window` (lightweight, ~5kb), `react-virtualized` (feature-rich), `@tanstack/react-virtual` (modern, headless).

#### Code Example / Key Takeaways
```jsx
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={500}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

### Q237. Compare react-window and react-virtualized
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Both are virtualization libraries by Brian Vaughn, but differ significantly:

| Feature | react-window | react-virtualized |
|---------|-------------|-------------------|
| Size | ~5kb | ~30kb+ |
| API | Simple (List, Grid) | Complex (many components) |
| Features | Core virtualization | AutoSizer, CellMeasurer, MultiGrid, SortableList |
| Maintenance | Actively maintained | Legacy (use react-window) |

**Recommendation**: Use `react-window` for standard use cases. Use `react-virtualized` only if you need its advanced features (variable heights, masonry, etc.). For modern apps, `@tanstack/react-virtual` is increasingly popular.

#### Code Example / Key Takeaways
```jsx
// react-window - simple and small
import { FixedSizeGrid } from 'react-window';

// react-virtualized - more features
import { Grid, AutoSizer, CellMeasurer } from 'react-virtualized';

// Modern alternative
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

### Q238. How does the React DevTools Profiler work?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
The Profiler records component render times and reasons. Features:

1. **Record button**: Start/stop a profiling session
2. **Flamegraph**: Visualize render duration hierarchically
3. **Ranked chart**: Sort components by render time
4. **Commit timeline**: See each commit and what changed
5. **Highlight updates**: Visualize re-renders in real-time
6. **Why did this render?**: Shows changed props/state/hooks/context

To enable, ensure you're using the development build. Production builds disable profiling unless you use the special profiling build.

#### Code Example / Key Takeaways
```jsx
// Profiler can also be used programmatically
import { Profiler } from 'react';

function onRenderCallback(
  id,              // Component identifier
  phase,           // "mount" or "update"
  actualDuration,  // Time spent rendering
  baseDuration,    // Estimated time without memoization
  startTime,
  commitTime
) {
  console.log(`[${id}] ${phase}: ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <ExpensiveTree />
    </Profiler>
  );
}
```

---

### Q239. How do you identify and fix re-render performance issues?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Step-by-step approach:

1. **Profile** with React DevTools to find slow components
2. **Enable "Highlight updates"** to see what re-renders unnecessarily
3. **Check props**: Are new object/function references created each render?
4. **Wrap with `React.memo`** where props are stable
5. **Use `useCallback`/`useMemo`** for stable references
6. **Split context** so consumers only re-render when relevant data changes
7. **Use `useTransition`** for non-urgent updates

Avoid premature optimization - measure first, then fix the actual bottleneck.

#### Code Example / Key Takeaways
```jsx
// BEFORE: Re-renders on every parent state change
function Parent() {
  const [count, setCount] = useState(0);
  const [user] = useState({ name: 'John' });

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <UserProfile user={user} />
    </>
  );
}

// AFTER: Memoize to prevent unnecessary re-renders
const UserProfile = memo(function UserProfile({ user }) {
  return <div>{user.name}</div>;
});
```

---

### Q240. Why are anonymous functions and inline objects problematic in JSX?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
Anonymous functions and inline objects create new references on every render:

```jsx
<Button onClick={() => doSomething()} />  // New function each render
<Button style={{ color: 'red' }} />        // New object each render
```

When passed to memoized children, this defeats `React.memo` (shallow comparison sees different references) and triggers unnecessary re-renders.

Solutions:
- Extract functions with `useCallback`
- Extract objects with `useMemo`
- Define static objects/arrays outside the component

This matters most when the JSX is inside a frequently-rendering parent or passed to memoized children.

#### Code Example / Key Takeaways
```jsx
// BAD: New references every render
function Toolbar({ onSave }) {
  return (
    <div>
      <button onClick={() => onSave()}>Save</button>
      <button style={{ marginLeft: 8 }}>Cancel</button>
    </div>
  );
}

// GOOD: Stable references
const BUTTON_STYLE = { marginLeft: 8 };

function Toolbar({ onSave }) {
  const handleSave = useCallback(() => onSave(), [onSave]);
  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <button style={BUTTON_STYLE}>Cancel</button>
    </div>
  );
}
```

---

### Q241. How do you detect and fix memory leaks in React components?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Common memory leak sources:
1. **Uncleared timers/intervals** - `setInterval` never cleared
2. **Uncleaned event listeners** - `window.addEventListener` without removal
3. **Pending async requests** - State updates after unmount
4. **Subscriptions** - WebSocket, observables not unsubscribed
5. **Global references** - Storing component instances in globals

Fix: Always clean up in `useEffect` return function. Use `AbortController` for fetch. Check `isMounted` ref pattern (or `useRef` guard).

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  let isMounted = true;
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(data => {
      if (isMounted) setData(data);  // Guard against unmount
    });

  const timer = setInterval(() => console.log('tick'), 1000);
  window.addEventListener('resize', handleResize);

  return () => {
    isMounted = false;
    controller.abort();         // Cancel fetch
    clearInterval(timer);       // Clear timer
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

---

### Q242. What is the relationship between React state and memory leaks?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
The "Can't perform a React state update on an unmounted component" warning indicates a leak: async work completes after the component unmounts, attempting to set state on a destroyed component.

React 18 removed this warning (it's now harmless but wasteful), but the underlying issue remains - you're doing work for a component that no longer exists.

Best practice: Cancel async operations on unmount. For fetch, use `AbortController`. For timeouts, track and clear them. Modern approach: `useSyncExternalStore` handles subscription lifecycle automatically.

#### Code Example / Key Takeaways
```jsx
// React 18+ pattern with AbortController
function useUserData(userId) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(setUser)
      .catch(err => {
        if (err.name !== 'AbortError') throw err;
      });

    return () => controller.abort();  // Critical cleanup
  }, [userId]);

  return user;
}
```

---

### Q243. How do you optimize Context re-renders?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Context re-renders ALL consumers when the value changes. Optimizations:

1. **Split context**: Separate frequently-changing from stable values
2. **Selectors**: Use a library like `use-context-selector` to subscribe to slices
3. **Memoize context value**: `useMemo` the value object
4. **Move state down**: Keep context state minimal
5. **Combine with reducer**: Centralize but isolate updates

The core issue: every consumer re-renders when ANY part of context changes.

#### Code Example / Key Takeaways
```jsx
// BAD: Single context, all consumers re-render on count change
const AppContext = createContext();
function App() {
  const [user, setUser] = useState();
  const [count, setCount] = useState(0);
  return (
    <AppContext.Provider value={{ user, count, setUser, setCount }}>
      <Children />
    </AppContext.Provider>
  );
}

// GOOD: Split contexts
const UserContext = createContext();
const CountContext = createContext();

function App() {
  const [user] = useState();
  const [count, setCount] = useState(0);

  return (
    <UserContext.Provider value={user}>
      <CountContext.Provider value={{ count, setCount }}>
        <Children />
      </CountContext.Provider>
    </UserContext.Provider>
  );
}
```

---

### Q244. What are context selectors and how do they help performance?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Context selectors let consumers subscribe to only the slice of context they need, preventing re-renders when unrelated parts change.

The native Context API doesn't support selectors - any context value change re-renders all consumers. Libraries like `use-context-selector` solve this by using a subscription model under the hood.

In React 18+, `useSyncExternalStore` enables selector-based subscriptions for external stores. For context specifically, `use-context-selector` is the popular solution.

#### Code Example / Key Takeaways
```jsx
import { createContext, useContextSelector } from 'use-context-selector';

const CounterContext = createContext();

function Display() {
  // Only re-renders when 'count' changes, not 'theme'
  const count = useContextSelector(CounterContext, v => v.count);
  return <div>{count}</div>;
}

function ThemeButton() {
  // Only re-renders when 'theme' changes
  const theme = useContextSelector(CounterContext, v => v.theme);
  return <button className={theme}>Themed</button>;
}
```

---

### Q245. How do you optimize images in React web applications?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Image optimization strategies:

1. **Use modern formats**: WebP, AVIF instead of PNG/JPG (30-50% smaller)
2. **Lazy loading**: `loading="lazy"` attribute
3. **Responsive images**: `srcset` and `sizes` attributes
4. **Next.js Image component**: Automatic optimization, lazy loading, resizing
5. **Placeholder/blur-up**: Show low-res while loading
6. **CDN**: Serve images from optimized CDN with caching
7. **Avoid layout shift**: Always set `width` and `height`

#### Code Example / Key Takeaways
```jsx
// Native HTML
<img
  src="image.webp"
  loading="lazy"
  width={800}
  height={600}
  alt="Description"
  srcSet="image-400.webp 400w, image-800.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
/>

// Next.js
import Image from 'next/image';
<Image
  src="/photo.jpg"
  alt="Description"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/..."
  priority={false}  // true for LCP images
/>
```

---

### Q246. What are Core Web Vitals and why do they matter?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
Core Web Vitals are Google's metrics for user experience:

1. **LCP (Largest Contentful Paint)**: Loading performance. Should be < 2.5s
2. **INP (Interaction to Next Paint)** (replaced FID in 2024): Responsiveness. Should be < 200ms
3. **CLS (Cumulative Layout Shift)**: Visual stability. Should be < 0.1

They affect SEO rankings and user experience. React apps can struggle with these due to client-side rendering delays and hydration.

Measure with Lighthouse, Chrome DevTools, or `web-vitals` library.

#### Code Example / Key Takeaways
```jsx
import { onCLS, onINP, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(metric.name, metric.value);
}

onLCP(sendToAnalytics);  // Largest Contentful Paint
onINP(sendToAnalytics);  // Interaction to Next Paint
onCLS(sendToAnalytics);  // Cumulative Layout Shift
```

---

### Q247. How do you optimize LCP (Largest Contentful Paint) in React?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
LCP measures when the largest content element (image, text block) renders. Optimize:

1. **Server-side rendering (SSR)**: Render initial HTML on server
2. **Preload critical resources**: `<link rel="preload">` for hero images/fonts
3. **Optimize hero images**: Use WebP/AVIF, proper sizing, CDN
4. **Code splitting**: Reduce JS blocking the main thread
5. **Remove render-blocking CSS/JS**
6. **Prioritize LCP element**: Set `priority` prop on Next.js Image
7. **Fast fonts**: `font-display: swap`, preload font files

#### Code Example / Key Takeaways
```jsx
// Next.js: prioritize LCP image
import Image from 'next/image';

function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      priority          // Preloads and prioritizes
      width={1200}
      height={600}
    />
  );
}

// Manual preload in head
<head>
  <link rel="preload" as="image" href="/hero.webp" />
  <link rel="preload" as="font" href="/font.woff2" type="font/woff2" crossOrigin="" />
</head>
```

---

### Q248. What is INP and how does it differ from FID?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
- **FID (First Input Delay)**: Measures delay for first user interaction only. Deprecated in 2024.
- **INP (Interaction to Next Paint)**: Measures responsiveness across ALL interactions throughout page lifecycle. It's the 98th percentile of interaction latency.

INP captures the full interaction lifecycle: input delay + processing time + render time.

Optimize INP:
1. **Break up long tasks** with `useDeferredValue`/`useTransition`
2. **Move work off main thread** (Web Workers)
3. **Avoid expensive re-renders** with memoization
4. **Debounce/throttle** non-urgent updates

#### Code Example / Key Takeaways
```jsx
import { useState, useTransition } from 'react';

function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  function handleChange(e) {
    const value = e.target.value;
    // Mark expensive update as non-urgent
    startTransition(() => {
      setResults(heavyFilter(value));  // Doesn't block input
    });
  }

  return (
    <div className={isPending ? 'opacity-50' : ''}>
      {/* Results */}
    </div>
  );
}
```

---

### Q249. How do you minimize CLS (Cumulative Layout Shift) in React?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
CLS measures unexpected layout shifts. Common React causes:

1. **Images without dimensions**: Browser doesn't reserve space
2. **Async content loading**: Ads, embeds, fonts popping in
3. **Late-rendering components**: Conditional rendering without placeholders
4. **Web fonts**: FOIT/FOUT causing text reflow

Fixes:
- Always set `width`/`height` on images
- Reserve space with `min-height` or skeleton loaders
- Use `font-display: swap` with `size-adjust`
- Avoid inserting content above existing content

#### Code Example / Key Takeaways
```jsx
// BAD: No dimensions, causes shift
<img src="/banner.jpg" alt="Banner" />

// GOOD: Reserve space
<img src="/banner.jpg" alt="Banner" width={800} height={200} />

// Skeleton prevents shift for async content
function ProfileCard() {
  const [user, setUser] = useState(null);
  return user ? (
    <div>{user.name}</div>
  ) : (
    <div style={{ height: 100 }} className="skeleton" />
  );
}
```

---

### Q250. What is useMemo and when should you use it?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
`useMemo` memoizes a computed value, recomputing only when dependencies change. It prevents expensive calculations on every render.

Use when:
- Expensive calculations (sorting, filtering large arrays)
- Referential equality needed (passing to memoized children)
- Creating objects that must be stable

Don't use for:
- Cheap calculations (overhead isn't worth it)
- As a substitute for state
- Every value "just in case" (premature optimization)

#### Code Example / Key Takeaways
```jsx
import { useMemo } from 'react';

function ProductList({ products, searchTerm }) {
  // Only recomputes when products or searchTerm change
  const filtered = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return <List items={filtered} />;
}
```

---

### Q251. What is useCallback and how does it relate to useMemo?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
`useCallback` memoizes a function reference. It's equivalent to `useMemo(() => fn, deps)`. Returns the same function instance across renders when deps are unchanged.

Primary use: Pass stable function references to memoized children (so they don't re-render) and to effects that depend on stable callbacks.

```jsx
// These are equivalent
const fn1 = useCallback(() => doSomething(a), [a]);
const fn2 = useMemo(() => () => doSomething(a), [a]);
```

#### Code Example / Key Takeaways
```jsx
import { useCallback, memo } from 'react';

const Button = memo(function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
});

function Toolbar() {
  const [count, setCount] = useState(0);

  // Without useCallback, Button re-renders every time count changes
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <>
      <Button onClick={handleClick}>Click</Button>
      <span>{count}</span>
    </>
  );
}
```

---

### Q252. What is the difference between useMemo and useCallback?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Both are memoization hooks, but differ in what they return:

- **useMemo**: Returns a **memoized value** (result of computation)
- **useCallback**: Returns a **memoized function** (the function itself)

Implementation: `useCallback(fn, deps)` is literally `useMemo(() => fn, deps)`.

Use `useMemo` for expensive calculations and stable object/array references. Use `useCallback` for stable function references passed to children or effects.

#### Code Example / Key Takeaways
```jsx
// useMemo - memoizes the VALUE
const sortedList = useMemo(() => list.sort(), [list]);

// useCallback - memoizes the FUNCTION
const handleSort = useCallback(() => setList(list.sort()), [list]);

// Equivalent to:
const handleSort = useMemo(() => () => setList(list.sort()), [list]);
```

---

### Q253. What are the pitfalls of over-using useMemo and useCallback?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Common pitfalls:

1. **Premature optimization**: Memoization has overhead; for cheap operations it's slower
2. **Incorrect dependencies**: Stale closures if deps are wrong
3. **False sense of security**: Doesn't prevent re-renders from other causes
4. **Memory usage**: Cached values persist in memory
5. **Breaks when deps change**: Spurious re-renders if deps are unstable

Rule: Profile first. Only memoize when you've measured a problem. The React docs say: "You can wrap [a calculation] in useMemo... But you should only do this if the calculation is slow."

#### Code Example / Key Takeaways
```jsx
// BAD: Memoizing trivial work
const doubled = useMemo(() => count * 2, [count]);  // Overkill

// BAD: Wrong deps cause bugs
const handler = useCallback(() => {
  console.log(count);  // Stale! count not in deps
}, []);

// GOOD: Only memoize expensive work
const sortedUsers = useMemo(() => {
  return users.sort(complexSortFn);  // 10k+ items
}, [users]);
```

---

### Q254. How does React's concurrent rendering improve performance?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Concurrent rendering (React 18+) allows React to:

1. **Interrupt rendering**: Pause/resume render work based on priority
2. **Prevent blocking**: User input stays responsive during large renders
3. **Suspense integration**: Render parts of UI while waiting for data

Key APIs:
- `useTransition`: Mark non-urgent updates (stay responsive)
- `useDeferredValue`: Defer expensive value updates
- `<Suspense>`: Show fallbacks for async work

This means React can work on multiple states simultaneously without blocking the main thread.

#### Code Example / Key Takeaways
```jsx
import { useState, useDeferredValue, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Defer expensive list update
  const deferredQuery = useDeferredValue(query);

  function onChange(e) {
    const value = e.target.value;
    setQuery(value);  // Urgent - updates input immediately
    startTransition(() => {
      // Non-urgent - can be interrupted
      performSearch(value);
    });
  }

  return (
    <>
      <input value={query} onChange={onChange} />
      <Results query={deferredQuery} pending={isPending} />
    </>
  );
}
```

---

### Q255. What is useTransition and how does it help with performance?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
`useTransition` lets you mark state updates as non-urgent ("transitions"), keeping the UI responsive during expensive re-renders.

Returns: `[isPending, startTransition]`.
- `isPending`: True while transition is in progress
- `startTransition`: Wrap state updates that can be deferred

Urgent updates (typing, clicking) render immediately. Non-urgent updates (filtering large lists, tab switches) can be interrupted by more urgent work.

#### Code Example / Key Takeaways
```jsx
import { useState, useTransition } from 'react';

function Tabs() {
  const [tab, setTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);  // Non-urgent update
    });
  }

  return (
    <>
      <TabBar onSelect={selectTab} />
      {isPending ? <Spinner /> : <TabContent tab={tab} />}
    </>
  );
}
```

---

### Q256. What is useDeferredValue and when should you use it?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
`useDeferredValue` returns a deferred copy of a value that lags behind the latest value during expensive renders. Unlike `useTransition` which wraps updates, `useDeferredValue` wraps the value itself.

Use when:
- You can't wrap the state update in `startTransition` (e.g., third-party state)
- You want to keep showing stale data while new data renders
- The value comes from props or external sources

It's essentially "useTransition for values" - React keeps old value visible while computing new one in background.

#### Code Example / Key Takeaways
```jsx
import { useState, useDeferredValue } from 'react';

function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => {
    return search(deferredQuery);  // Uses stale value during render
  }, [deferredQuery]);

  // Input stays responsive because query updates immediately
  // Results update after a delay
  return (
    <ul>
      {results.map(r => <li key={r.id}>{r.name}</li>)}
    </ul>
  );
}
```

---

### Q257. How do you optimize a large form with many inputs?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Large forms re-render the entire tree on each keystroke. Optimizations:

1. **Controlled vs uncontrolled**: Use uncontrolled inputs (`defaultValue` + ref) for simple cases
2. **Field-level state**: Each input manages its own state
3. **Split components**: Isolate state to sub-components
4. **memo each field**: Prevent re-render when other fields change
5. **Debounce validation**: Don't validate on every keystroke
6. **React Hook Form**: Uses uncontrolled inputs + refs (minimal re-renders)
7. **useDeferredValue**: Defer expensive validation

#### Code Example / Key Takeaways
```jsx
import { memo, useState } from 'react';
import { useForm } from 'react-hook-form';

// With React Hook Form (uncontrolled, minimal re-renders)
function Form() {
  const { register, handleSubmit } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      <input {...register('email')} />
    </form>
  );
}

// Manual: memoize each field
const Field = memo(function Field({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input value={value} onChange={onChange} />
    </label>
  );
});
```

---

### Q258. How does React's reconciliation algorithm affect performance?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
React's reconciliation (the "diffing" algorithm) determines what changed between renders. Key performance aspects:

1. **Element type check**: Different types → destroy and rebuild (expensive)
2. **Same type**: Update props in place (cheap)
3. **Keys**: Help identify list items across renders
4. **Children diffing**: O(n) with heuristics, not optimal O(n^3)

Performance implications:
- Avoid changing element types at same position (destroys subtree)
- Use stable, unique `key` props in lists
- Keep component identity stable (don't create components inside render)

#### Code Example / Key Takeaways
```jsx
// BAD: Changing element type destroys entire subtree
function Widget({ isButton }) {
  return isButton ? <button>Click</button> : <a href="#">Link</a>;
}

// GOOD: Keep element type stable
function Widget({ isButton }) {
  return isButton
    ? <button className="widget">Click</button>
    : <button className="widget link-style">Link</button>;
}

// Keys must be stable and unique
items.map(item => <li key={item.id}>{item.text}</li>);  // Good
items.map((item, i) => <li key={i}>{item.text}</li>);   // Bad - unstable
```

---

### Q259. Why is it bad to define components inside other components?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Defining a component inside another component creates a NEW component type on every render. This causes:

1. **Full remount**: React sees a different component type, destroys and recreates it (loses state)
2. **Performance hit**: Re-mounting is expensive (DOM recreation, effect re-runs)
3. **State loss**: Internal state resets on every parent render
4. **Effect re-runs**: All effects re-execute

Fix: Define components at module level or use composition/children prop.

#### Code Example / Key Takeaways
```jsx
// BAD: New component type every render
function Parent() {
  function Child({ name }) {  // Re-created each render
    return <div>{name}</div>;
  }
  return <Child name="John" />;  // Fully remounts on parent re-render
}

// GOOD: Module-level component
function Child({ name }) {
  return <div>{name}</div>;
}

function Parent() {
  return <Child name="John" />;
}
```

---

### Q260. How do you handle expensive calculations in render?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
For expensive calculations during render:

1. **useMemo**: Cache result, recompute only when deps change
2. **useDeferredValue**: Show stale result while computing new one
3. **Web Workers**: Move heavy computation off main thread
4. **Memoize intermediate steps**: Break computation into memoized chunks
5. **Virtualize**: Only compute visible items
6. **Debounce**: Delay calculation until input settles

Measure first with Profiler to confirm the calculation is actually the bottleneck.

#### Code Example / Key Takeaways
```jsx
import { useMemo } from 'react';

function Analytics({ data }) {
  // Expensive: runs only when data changes
  const stats = useMemo(() => {
    return data.reduce((acc, item) => {
      // Heavy computation here
      return computeDetailedStats(acc, item);
    }, initialStats);
  }, [data]);

  return <StatsDisplay stats={stats} />;
}

// Alternative: Web Worker for very heavy work
const result = useWorker(heavyComputation, inputData);
```

---

### Q261. What is the purpose of the key prop and how does it affect performance?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
The `key` prop helps React identify which items in a list changed, were added, or removed. Without keys, React uses index-based diffing which is error-prone.

Performance impact:
- **Stable unique keys** (e.g., database IDs): Optimal reconciliation, minimal DOM operations
- **Index keys**: Causes unnecessary re-renders and bugs when list order changes
- **Missing keys**: Forces full re-render of list

Keys must be stable across renders (not random, not array index when items reorder).

#### Code Example / Key Takeaways
```jsx
// GOOD: Stable unique identifier
{todos.map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}

// BAD: Array index as key (breaks on reorder/insert)
{todos.map((todo, index) => (
  <TodoItem key={index} todo={todo} />
))}

// BAD: Random key (always remounts)
{todos.map(todo => (
  <TodoItem key={Math.random()} todo={todo} />
))}
```

---

### Q262. How do you optimize bundle size in a React app?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Bundle size optimization techniques:

1. **Code splitting**: `React.lazy` + `Suspense` for routes/features
2. **Tree shaking**: Use ES modules, avoid side-effectful imports
3. **Bundle analyzer**: Identify large dependencies
4. **Replace heavy libs**: `date-fns` instead of `moment`, `lodash-es` with specific imports
5. **Compression**: Gzip/Brotli on server
6. **Modern build target**: Target modern browsers, use differential loading
7. **Remove unused code**: Dead code elimination

#### Code Example / Key Takeaways
```jsx
// BAD: Imports entire library
import _ from 'lodash';

// GOOD: Import only what you need
import debounce from 'lodash/debounce';

// Or use tree-shakeable lodash-es
import { debounce } from 'lodash-es';

// Analyze bundle
// npx webpack-bundle-analyzer stats.json
// or: npm install --save-dev webpack-bundle-analyzer
```

---

### Q263. What is tree shaking and how does it work with React?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Tree shaking is dead-code elimination that removes unused exports from the final bundle. It works with ES modules (`import`/`export`) because they're statically analyzable, but NOT with CommonJS (`require`).

Requirements:
- Use ES module syntax (`import`/`export`)
- Build tool must support it (webpack, Rollup, Vite all do)
- Avoid side effects in modules (`"sideEffects": false` in package.json)
- Don't use `import * as` when you need specific parts

React itself is tree-shakeable in modern versions.

#### Code Example / Key Takeaways
```jsx
// Tree-shakeable: only DatePicker imported
import { DatePicker } from 'antd';

// NOT tree-shakeable (default import, pulls everything)
import antd from 'antd';

// package.json
{
  "sideEffects": false  // Enables aggressive tree shaking
}

// Build config (webpack)
optimization: {
  usedExports: true,
}
```

---

### Q264. How do you measure React app performance?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
Measurement tools and techniques:

1. **React DevTools Profiler**: Component render times, re-render reasons
2. **Chrome DevTools Performance tab**: Main thread activity, long tasks
3. **Lighthouse**: Core Web Vitals, best practices
4. **web-vitals library**: Programmatic metric collection
5. **why-did-you-render**: Detect unnecessary re-renders
6. **Bundle analyzer**: Visualize bundle composition
7. **Performance API**: `performance.now()` for custom timing

Always measure in production build (dev has overhead) and on real devices.

#### Code Example / Key Takeaways
```jsx
// Install why-did-you-render for dev
// npm i -D @welldone-software/why-did-you-render

import whyDidYouRender from '@welldone-software/why-did-you-render';
whyDidYouRender(React, { trackAllPureComponents: true });

// Programmatic timing
const start = performance.now();
heavyOperation();
const duration = performance.now() - start;
console.log(`Operation took ${duration}ms`);
```

---

### Q265. What is the performance impact of CSS-in-JS libraries?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Runtime CSS-in-JS (styled-components, emotion) has performance costs:

1. **Runtime serialization**: Styles computed during render
2. **Re-renders**: Style recalculation on every render
3. **Bundle size**: Library code adds weight

Mitigations:
- Use `babel-plugin-styled-components` for static extraction
- Use compiled CSS-in-JS (vanilla-extract, linaria) - zero runtime
- Use CSS modules for static styles
- Avoid dynamic styles based on props when possible

CSS-in-JS tradeoff: developer experience vs runtime performance. For high-performance needs, prefer static CSS or build-time solutions.

#### Code Example / Key Takeaways
```jsx
// Runtime CSS-in-JS - recalculated each render
const Button = styled.button`
  color: ${props => props.color};  // Dynamic, runtime cost
`;

// Build-time (vanilla-extract) - zero runtime
import { style } from '@vanilla-extract/css';

const button = style({
  color: 'red',  // Static, extracted at build
});

// CSS Modules - also zero runtime
import styles from './Button.module.css';
<button className={styles.button} />;
```

---

### Q266. How do you optimize React apps for low-end devices?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Low-end device optimizations:

1. **Reduce JS execution**: Smaller bundles, code splitting
2. **Avoid long tasks**: Break work with `useTransition`/`scheduler`
3. **Virtualize lists**: Limit DOM nodes
4. **Debounce/throttle**: Reduce event handler frequency
5. **Lazy load heavy features**: Only load when needed
6. **Minimize re-renders**: Aggressive memoization
7. **Use passive event listeners**: `{ passive: true }`
8. **Optimize images**: Smaller formats, responsive sizes
9. **Avoid layout thrashing**: Batch DOM reads/writes

#### Code Example / Key Takeaways
```jsx
// Passive listeners for scroll
useEffect(() => {
  const handler = () => console.log('scroll');
  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}, []);

// Reduce work with transitions
const [isPending, startTransition] = useTransition();
startTransition(() => setHeavyState(data));

// Virtualize for low memory
<VirtualizedList items={items} />  // Renders only visible
```

---

### Q267. What is the difference between useMemo for values vs React.memo for components?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Both prevent unnecessary work, but at different levels:

- **React.memo**: Component-level. Skips re-rendering the entire component when props are shallow-equal. Changes the render decision for the component.
- **useMemo**: Calculation-level. Caches a computed value within a component across renders. The component still renders, but skips the expensive calculation.

They're complementary: `React.memo` prevents the render, `useMemo` makes the render cheaper.

#### Code Example / Key Takeaways
```jsx
// React.memo: prevents Child from re-rendering
const Child = memo(function Child({ data }) {
  return <ExpensiveView data={data} />;
});

// useMemo: makes calculation cheaper when Child DOES render
function ExpensiveView({ data }) {
  const processed = useMemo(() => {
    return data.map(transform).filter(predicate);
  }, [data]);

  return <List items={processed} />;
}
```

---

### Q268. How do you debounce and throttle in React for performance?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
**Debounce**: Delays execution until after a pause (good for search input).
**Throttle**: Limits execution to once per interval (good for scroll/resize).

In React, create stable debounced/throttled functions with `useRef` or `useMemo` to avoid recreating them each render.

Use cases:
- Search-as-you-type (debounce 300ms)
- Window resize handlers (throttle)
- Scroll position tracking (throttle)
- Auto-save (debounce)

#### Code Example / Key Takeaways
```jsx
import { useMemo } from 'react';
import { debounce, throttle } from 'lodash-es';

function SearchBox() {
  const [results, setResults] = useState([]);

  // Stable debounced function
  const debouncedSearch = useMemo(
    () => debounce(query => fetchResults(query), 300),
    []
  );

  function onChange(e) {
    debouncedSearch(e.target.value);
  }

  // Throttled scroll handler
  const handleScroll = useMemo(
    () => throttle(() => console.log('scroll'), 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return <input onChange={onChange} />;
}
```

---

### Q269. How do you optimize list rendering in React?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
List rendering optimization techniques:

1. **Virtualization**: Render only visible items (react-window)
2. **memo list items**: Prevent re-render when other items change
3. **Stable keys**: Use unique IDs, not array indices
4. **windowing for large data**: Process in chunks
5. **Avoid inline functions in map**: Extract callbacks
6. **Pagination**: Limit items rendered at once
7. **useMemo for derived data**: Filter/sort once

#### Code Example / Key Takeaways
```jsx
import { memo, useMemo } from 'react';

const ListItem = memo(function ListItem({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});

function OptimizedList({ items, onSelect }) {
  const handleSelect = useCallback((id) => onSelect(id), [onSelect]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  return (
    <ul>
      {sortedItems.map(item => (
        <ListItem key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  );
}
```

---

### Q270. What is the role of React.StrictMode in performance?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
`React.StrictMode` is a development-only tool that intentionally double-invokes certain functions to surface bugs:
- Function component bodies (render)
- useState/useMemo/useReducer initializers
- Effect setup/cleanup (runs twice)

It does NOT affect production. The double-invocation helps detect:
- Impure renders (side effects in render)
- Missing effect cleanup (memory leaks)
- Stale closures

Performance note: Your code should run correctly under double-invocation. If it breaks, you have a side-effect bug. Don't disable StrictMode to "fix" performance - fix the underlying issue.

#### Code Example / Key Takeaways
```jsx
import { StrictMode } from 'react';

// Wrap app in StrictMode for dev checks
<StrictMode>
  <App />
</StrictMode>

// Effects run twice in dev - must be idempotent
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();  // Cleanup prevents double-subscribe
}, []);
```

---

### Q271. How does server-side rendering (SSR) improve performance?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
SSR renders React components to HTML on the server, sending complete HTML to the client. Benefits:

1. **Faster FCP/LCP**: Content visible before JS loads
2. **Better SEO**: Crawlers see rendered content
3. **No blank screen**: Users see content immediately
4. **Lower TTI on slow devices**: Less client computation

Tradeoffs:
- Higher server load
- Slower TTFB (server computation)
- Complexity (hydration)

Modern alternatives: SSG (static generation), ISR (incremental static regeneration), Streaming SSR.

#### Code Example / Key Takeaways
```jsx
// Express + React SSR
import { renderToString } from 'react-dom/server';
import App from './App';

app.get('/', (req, res) => {
  const html = renderToString(<App />);
  res.send(`<!DOCTYPE html><html><body>${html}</body></html>`);
});

// Next.js handles SSR automatically
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}
```

---

### Q272. What is hydration and how can it be optimized?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Hydration is React "attaching" event listeners to server-rendered HTML, making it interactive. The problem: hydration is synchronous and blocks the main thread, delaying interactivity (hurts TTI/INP).

Optimizations:
1. **Streaming SSR**: Send HTML in chunks with `<Suspense>`
2. **Selective hydration** (React 18): Hydrate parts as they arrive
3. **Progressive hydration**: Hydrate on idle/visible
4. **Defer non-critical JS**: Don't load admin components initially
5. **`hydrationMismatch` handling**: Avoid SSR/client mismatches

#### Code Example / Key Takeaways
```jsx
// Next.js App Router - streaming with Suspense
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>Static Header</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />  {/* Streams in separately */}
      </Suspense>
    </div>
  );
}

// Selective hydration happens automatically in React 18
// for Suspense boundaries
```

---

### Q273. How do you use the useId hook for performance and accessibility?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
`useId` generates stable, unique IDs for accessibility attributes (aria-labelledby, htmlFor/id pairs) without causing hydration mismatches.

Before `useId`, developers used `Math.random()` or `Date.now()` which caused SSR/client mismatches (different IDs each render → hydration error).

It's performant because React generates IDs deterministically during render - no Math.random, no flaky hydration.

#### Code Example / Key Takeaways
```jsx
import { useId } from 'react';

function FormField({ label, type }) {
  const id = useId();  // Stable across SSR + hydration

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} />
    </div>
  );
}

// Avoid this (hydration mismatch):
const id = `field-${Math.random()}`;  // BAD - different on server/client
```

---

### Q274. What is the performance cost of Context vs Redux/Zustand?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
**Context**: Every consumer re-renders on ANY value change. No selector support natively. Fine for low-frequency updates (theme, auth) but problematic for high-frequency state (forms, real-time data).

**Redux**: Uses reference equality + selectors. Components only re-render when their selected slice changes. More boilerplate but better performance for complex state.

**Zustand**: Like Redux but minimal. Uses selector subscriptions - components subscribe to specific state slices, re-render only on those changes. No provider needed.

Verdict: Context for static/low-frequency; Zustand/Redux for dynamic/high-frequency state.

#### Code Example / Key Takeaways
```jsx
// Zustand - selector-based, only re-renders on slice change
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  theme: 'dark',
  increment: () => set(s => ({ count: s.count + 1 })),
}));

// Only re-renders when count changes
function Counter() {
  const count = useStore(s => s.count);
  return <div>{count}</div>;
}

// Only re-renders when theme changes
function ThemeButton() {
  const theme = useStore(s => s.theme);
  return <button className={theme}>Theme</button>;
}
```

---

### Q275. How do you optimize React apps for SEO and performance simultaneously?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
SEO and performance align through fast-loading, crawlable content:

1. **SSR/SSG**: Render content server-side for crawlers + fast FCP
2. **Core Web Vitals**: Good LCP/INP/CLS = better rankings
3. **Semantic HTML**: Proper headings, meta tags, structured data
4. **Preload critical resources**: Faster LCP helps SEO
5. **Sitemap + robots.txt**: Help crawlers
6. **Meta tags**: Title, description, Open Graph
7. **Avoid client-only rendering** for important content

Next.js solves both with SSR, metadata API, and image optimization.

#### Code Example / Key Takeaways
```jsx
// Next.js Metadata API (App Router)
export const metadata = {
  title: 'Product Page',
  description: 'Best product ever',
  openGraph: {
    title: 'Product Page',
    images: ['/og-image.jpg'],
  },
};

// SSG for static content (fast + SEO-friendly)
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map(p => ({ id: p.id }));
}
```

---

### Q276. What are web workers and when should you use them with React?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Web Workers run JavaScript in a separate thread, keeping the main thread (UI) responsive. Use them for:

- Heavy computations (sorting, parsing, encryption)
- Data processing (CSV/JSON transformation)
- Image/video processing
- Real-time data transforms

React integration: Use `useWorker` patterns or libraries like `comlink`. Pass serializable data only (no functions/DOM).

The main thread stays free for rendering and user input while workers crunch data.

#### Code Example / Key Takeaways
```jsx
// worker.js
self.onmessage = (e) => {
  const result = heavyCompute(e.data);
  self.postMessage(result);
};

// React component
import { useEffect, useState, useRef } from 'react';

function HeavyComponent() {
  const [result, setResult] = useState(null);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker('/worker.js');
    workerRef.current.onmessage = (e) => setResult(e.data);
    return () => workerRef.current.terminate();
  }, []);

  function process(data) {
    workerRef.current.postMessage(data);
  }

  return <div>{result}</div>;
}
```

---

### Q277. How do you profile and reduce long tasks?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
**Long tasks** (>50ms) block the main thread, hurting INP. To identify:

1. Chrome DevTools Performance tab - look for red "long task" markers
2. `PerformanceObserver` API for `longtask` entries
3. React Profiler - find slow components

Reduction strategies:
- **Break up work**: Process in chunks with `requestIdleCallback`
- **useTransition**: Mark non-urgent updates interruptible
- **Web Workers**: Move computation off main thread
- **Code splitting**: Reduce initial JS parse time
- **Yield to browser**: Split loops with `setTimeout(0)` or scheduler

#### Code Example / Key Takeaways
```jsx
// Detect long tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`Long task: ${entry.duration}ms`);
  }
});
observer.observe({ entryTypes: ['longtask'] });

// Break up loop with yielding
async function processLargeArray(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    results.push(process(items[i]));
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve));  // Yield
    }
  }
  return results;
}
```

---

### Q278. How do you handle expensive third-party library integrations?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Third-party libs (charts, editors, maps) can be heavy and slow. Optimizations:

1. **Lazy load**: `React.lazy` so they load on demand
2. **Dynamic import**: Only load when feature is used
3. **Isolate in iframe/web worker**: Prevent blocking main thread
4. **Memoize instances**: Create once, reuse
5. **Virtualize**: For data-heavy widgets (charts with many points)
6. **Debounce updates**: Avoid re-initializing on every change
7. **Web Worker**: For data processing before sending to lib

#### Code Example / Key Takeaways
```jsx
import { lazy, Suspense, useMemo } from 'react';
import { useRef, useEffect } from 'react';

// Lazy load heavy chart library
const Chart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));

function Dashboard() {
  const chartRef = useRef(null);

  // Initialize once, update data without re-init
  useEffect(() => {
    const chart = initChart(chartRef.current);
    return () => chart.destroy();
  }, []);

  return (
    <Suspense fallback={<Spinner />}>
      <Chart ref={chartRef} data={data} />
    </Suspense>
  );
}
```

---

### Q279. How do you optimize React Native performance? (Bonus cross-platform)
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
React Native shares many React optimization principles but with native specifics:

1. **Use `React.memo`/`useCallback`**: Same as web
2. **Virtualized lists**: `FlatList` instead of `ScrollView` for long lists
3. **Avoid inline functions/styles**: Re-created each render
4. **Use `useNativeDriver`**: Animate on native thread, not JS
5. **Hermes engine**: Faster startup, lower memory
6. **Avoid bridge overload**: Batch native calls
7. **New Architecture (Fabric/TurboModules)**: Direct native communication

#### Code Example / Key Takeaways
```jsx
import { FlatList, Animated, useNativeDriver } from 'react-native';

// Virtualized list - renders only visible items
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <Item item={item} />}
  initialNumToRender={10}
/>

// Animate on native thread
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,  // Critical for performance
}).start();
```

---

### Q280. What is the difference between shouldComponentUpdate and React.memo?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Both control re-rendering but for different paradigms:

**shouldComponentUpdate (Class)**:
- Lifecycle method returning boolean
- `this.props`/`this.state` comparison
- Class components only
- Manual deep/shallow comparison logic

**React.memo (Function)**:
- Higher-order component wrapper
- Automatic shallow prop comparison
- Function components only
- Optional custom comparator

`PureComponent` is the class equivalent of `React.memo` (shallow comparison built-in).

#### Code Example / Key Takeaways
```jsx
// Class: shouldComponentUpdate
class UserCard extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.user.id !== this.props.user.id ||
           nextProps.user.name !== this.props.user.name;
  }
  render() { return <div>{this.props.user.name}</div>; }
}

// Function: React.memo
const UserCard = memo(
  function UserCard({ user }) {
    return <div>{user.name}</div>;
  },
  (prev, next) =>
    prev.user.id === next.user.id &&
    prev.user.name === next.user.name
);
```

---

### Q281. How do you prevent unnecessary re-renders in a context-heavy app?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Context-heavy apps suffer from mass re-renders. Solutions:

1. **Split contexts** by update frequency (static vs dynamic)
2. **Use selectors** (`use-context-selector`, Zustand)
3. **Memoize context value** with `useMemo`
4. **Separate state from dispatch**: Context for state, separate for actions
5. **Move state to leaf components**: Only components that need it
6. **Use external store** (`useSyncExternalStore`) for fine-grained updates

The key insight: context value identity changes → all consumers re-render. Keep value stable.

#### Code Example / Key Takeaways
```jsx
// Pattern: Separate state and actions contexts
const StateContext = createContext();
const DispatchContext = createContext();

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stableDispatch = useMemo(() => dispatch, []);  // Stable ref

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={stableDispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// Components using only dispatch never re-render on state change
function ActionButton() {
  const dispatch = useContext(DispatchContext);
  return <button onClick={() => dispatch({ type: 'INC' })}>+</button>;
}
```

---

### Q282. What is the impact of prop drilling on performance and how do you avoid it?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
Prop drilling (passing props through many intermediate components) doesn't directly hurt performance, but:

1. **Re-renders cascade**: Changing a drilled prop re-renders all intermediate components
2. **Tight coupling**: Hard to optimize isolated subtrees
3. **Maintenance cost**: Changes ripple through many files

Avoid with:
- **Context** (for low-frequency state)
- **Composition** (children/ render props)
- **State management** (Zustand/Redux for high-frequency)
- **Component extraction**: Pass JSX as children instead of props

#### Code Example / Key Takeaways
```jsx
// BAD: Drilling through intermediate components
<Layout user={user}>
  <Page user={user}>
    <Header user={user}>
      <Profile user={user} />  // Only this needs user
    </Header>
  </Page>
</Layout>

// GOOD: Composition - pass as children
<Layout>
  <Page>
    <Header>
      <Profile user={user} />  // Direct
    </Header>
  </Page>
</Layout>

// GOOD: Context for widely-needed state
<UserContext.Provider value={user}>
  <DeepTree />  {/* Profile consumes directly */}
</UserContext.Provider>
```

---

### Q283. How do you optimize images with the Next.js Image component?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Next.js `<Image>` automatically optimizes:

1. **Lazy loading** by default (`loading="lazy"`)
2. **Responsive sizes** via `srcset` (serves correct size)
3. **Modern formats** (WebP/AVIF) automatically
4. **Prevents CLS** with reserved space (requires width/height)
5. **Priority prop** for LCP images (preloads)
6. **Placeholder** for blur-up loading
7. **CDN optimization** via Next.js image optimizer

#### Code Example / Key Takeaways
```jsx
import Image from 'next/image';

// LCP image - prioritize
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority          // Preloads for LCP
/>

// Below-the-fold - lazy by default
<Image
  src="/gallery.jpg"
  alt="Gallery"
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Responsive
<Image
  src="/product.jpg"
  alt="Product"
  sizes="(max-width: 768px) 100vw, 33vw"
  fill              // Fill parent container
/>
```

---

### Q284. What is the performance difference between inline styles and CSS classes?
**Difficulty:** `Basic`
**Category:** Performance & Optimization

#### Answer
**Inline styles** (`style={{}}`):
- Recalculated every render (object creation)
- No CSS cascade, specificity issues
- No pseudo-classes (`:hover`), media queries, keyframes
- Slower for static styles

**CSS classes**:
- Browser-optimized, cached stylesheets
- Support full CSS features
- No per-render object creation
- Better for performance and maintainability

Use inline styles only for dynamic values that can't be pre-computed. Prefer CSS modules/classes for everything else.

#### Code Example / Key Takeaways
```jsx
// BAD: New object every render, no CSS features
function Bad({ active }) {
  return (
    <div style={{
      color: active ? 'red' : 'blue',
      padding: '10px',
    }}>
      Content
    </div>
  );
}

// GOOD: CSS class, computed once, supports :hover
import styles from './Component.module.css';
function Good({ active }) {
  return (
    <div className={`${styles.box} ${active ? styles.active : ''}`}>
      Content
    </div>
  );
}

// OK: Inline only for truly dynamic values
<div style={{ width: `${progress}%` }} />
```

---

### Q285. How do you optimize a React app's initial load time?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Initial load optimization:

1. **Code splitting**: Lazy load routes/features
2. **SSR/SSG**: Send rendered HTML
3. **Bundle size**: Tree shaking, remove unused deps
4. **Preload critical resources**: Fonts, hero images
5. **Compression**: Brotli/Gzip
6. **CDN**: Serve assets close to users
7. **Font optimization**: `font-display: swap`, preload
8. **Eliminate render-blocking JS/CSS**
9. **Service worker / caching**: Cache app shell

Measure with Lighthouse and target < 2.5s LCP.

#### Code Example / Key Takeaways
```jsx
// Preload in index.html
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero.avif" as="image" />
<link rel="preconnect" href="https://api.example.com" />

// Code split routes
const Home = lazy(() => import('./Home'));
const About = lazy(() => import('./About'));

// Manifest for caching
// service-worker.js caches app shell for instant loads
```

---

### Q286. What is the useSyncExternalStore hook and how does it optimize performance?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
`useSyncExternalStore` subscribes to external stores (Redux, Zustand, browser APIs) with safe concurrent rendering. It replaces `useSubscription` and prevents tearing.

Benefits:
1. **Fine-grained subscriptions**: Component re-renders only when its slice changes
2. **Concurrent-safe**: No tearing during interrupts
3. **SSR support**: `getServerSnapshot` for server rendering
4. **No extra re-renders**: Unlike Context, only subscribers update

This is how modern state libs (Zustand, Redux Toolkit) achieve selector-based performance.

#### Code Example / Key Takeaways
```jsx
import { useSyncExternalStore } from 'react';

// Subscribe to window width with fine-grained updates
function useWindowWidth() {
  const subscribe = (callback) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  };

  const getSnapshot = () => window.innerWidth;

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

function ResponsiveComponent() {
  const width = useWindowWidth();  // Only re-renders on width change
  return <div>Width: {width}</div>;
}
```

---

### Q287. How do you detect and prevent layout thrashing in React?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Layout thrashing = interleaving DOM reads (forces reflow) and writes (invalidates layout) in a loop. Each read after a write forces synchronous reflow - very expensive.

Prevention:
1. **Batch reads then writes**: Read all first, then write all
2. **Use `useLayoutEffect` carefully**: Runs synchronously, can cause thrashing
3. **requestAnimationFrame**: Batch DOM operations per frame
4. **Avoid measuring in loops**: Cache measurements
5. **CSS transforms**: Use `transform` (GPU) instead of `top/left`

#### Code Example / Key Takeaways
```jsx
// BAD: Read/write interleaved = forced reflow each iteration
items.forEach(item => {
  const height = item.offsetHeight;  // READ
  item.style.height = height * 2 + 'px';  // WRITE
});

// GOOD: Batch all reads, then all writes
const heights = items.map(item => item.offsetHeight);  // All READS
items.forEach((item, i) => {
  item.style.height = heights[i] * 2 + 'px';  // All WRITES
});

// Better: useLayoutEffect for measurements
useLayoutEffect(() => {
  const heights = items.map(ref => ref.offsetHeight);
  // Batch writes in same frame
}, [items]);
```

---

### Q288. How do you optimize font loading to prevent CLS and improve LCP?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Font loading affects both CLS (FOUT/FOIT reflow) and LCP (text is often LCP element).

Optimizations:
1. **`font-display: swap`**: Show fallback immediately, swap when loaded (prevents invisible text)
2. **Preload critical fonts**: `<link rel="preload" as="font">`
3. **`size-adjust`**: Match fallback font metrics to reduce shift
4. **Self-host fonts**: Avoid third-party requests
5. **Subset fonts**: Only include needed characters (especially for CJK)
6. **Use `next/font`**: Automatic optimization in Next.js

#### Code Example / Key Takeaways
```css
/* font-face with swap + size-adjust */
@font-face {
  font-family: 'Custom';
  src: url('/font.woff2') format('woff2');
  font-display: swap;
  size-adjust: 105%;
  ascent-override: 90%;
}

/* Preload in HTML */
<link
  rel="preload"
  href="/font.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>

/* Next.js automatic font optimization */
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
```

---

### Q289. What is the difference between passive and active event listeners?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Event listeners affect scroll/input performance:

**Passive listeners** (`{ passive: true }`):
- Browser knows listener won't `preventDefault()`
- Allows scrolling without waiting for JS
- Required for `touchstart`/`wheel` in modern browsers
- Improves scroll performance (no blocking)

**Active listeners** (default):
- Browser waits for listener to finish (in case it calls `preventDefault`)
- Can block scrolling if listener is slow

Use passive for scroll/touch/wheel handlers. Next.js sets this automatically for touch events.

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  const handler = (e) => {
    // Reading scroll position - don't preventDefault
    console.log(window.scrollY);
  };

  // Passive: browser can scroll without waiting
  window.addEventListener('scroll', handler, { passive: true });

  return () => window.removeEventListener('scroll', handler);
}, []);

// To prevent default, must be active (not passive)
const blockScroll = (e) => e.preventDefault();
element.addEventListener('touchmove', blockScroll);  // Active
```

---

### Q290. How do you implement infinite scrolling efficiently?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Efficient infinite scroll combines several techniques:

1. **IntersectionObserver**: Detect when sentinel enters viewport (no scroll listeners)
2. **Virtualization**: Only render loaded items (for millions of rows)
3. **Pagination**: Fetch in chunks, not all at once
4. **Debounce fetch**: Avoid duplicate requests
5. **Prefetch next page**: Load before user reaches bottom
6. **Maintain scroll position**: Use keys, avoid layout shift

Avoid scroll event listeners (use IntersectionObserver instead).

#### Code Example / Key Takeaways
```jsx
import { useEffect, useRef, useState } from 'react';

function InfiniteList({ fetchItems }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(p => p + 1);  // Trigger next page load
        }
      },
      { rootMargin: '100px' }  // Prefetch before visible
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchItems(page).then(newItems => setItems(prev => [...prev, ...newItems]));
  }, [page]);

  return (
    <div>
      {items.map(item => <Item key={item.id} {...item} />)}
      <div ref={sentinelRef} />
    </div>
  );
}
```

---

### Q291. How do you optimize React app memory usage?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Memory optimization:

1. **Clean up effects**: Clear timers, unsubscribe, abort fetches
2. **Avoid storing large data in state**: Use refs or external stores
3. **Remove event listeners**: In effect cleanup
4. **Virtualize lists**: Limit DOM nodes (10k items = 10k nodes otherwise)
5. **Debounce expensive computations**: Avoid retaining intermediate arrays
6. **Dispose Web Workers**: `terminate()` when done
7. **Avoid closures capturing large objects**: They prevent GC
8. **Profile with Chrome DevTools Memory tab**: Take heap snapshots

#### Code Example / Key Takeaways
```jsx
// BAD: Closure captures huge array, prevents GC
function ProcessButton({ hugeData }) {
  const handleClick = () => {
    const result = hugeData.filter(/* ... */);  // Captured forever
  };
  return <button onClick={handleClick}>Process</button>;
}

// GOOD: Use ref, process on demand
function ProcessButton({ hugeDataRef }) {
  const handleClick = useCallback(() => {
    const result = hugeDataRef.current.filter(/* ... */);
    // Process and discard immediately
  }, [hugeDataRef]);

  return <button onClick={handleClick}>Process</button>;
}
```

---

### Q292. What are React Server Components and how do they improve performance?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
React Server Components (RSC) render on the server, sending minimal JS to the client. Benefits:

1. **Zero client JS**: Component code never downloaded to browser
2. **Direct backend access**: Query databases without API layer
3. **Automatic code splitting**: Server components excluded from bundle
4. **Smaller bundles**: Only Client Components ship JS
5. **Streaming**: Progressive rendering with Suspense

Tradeoffs: Can't use hooks/state/events (those require Client Components).

#### Code Example / Key Takeaways
```jsx
// Server Component (no 'use client')
// Runs on server, zero JS shipped to client
async function ProductList() {
  const products = await db.products.findMany();  // Direct DB access
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name} - ${p.price}</li>
      ))}
    </ul>
  );
}

// Client Component - needs 'use client'
'use client';
function AddToCart({ productId }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Add</button>;
}
```

---

### Q293. How do you optimize a dashboard with many real-time widgets?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Real-time dashboards with many widgets face re-render storms. Solutions:

1. **Isolate subscriptions**: Each widget subscribes only to its data slice
2. **Virtualize widget grid**: Render only visible widgets
3. **Throttle updates**: Batch WebSocket messages (e.g., 10/sec → 1/sec)
4. **Use external store**: Zustand with selectors (no context re-renders)
5. **memo each widget**: Prevent cross-widget re-renders
6. **Web Worker**: Parse incoming messages off main thread
7. **Skeleton placeholders**: Avoid layout shift during updates

#### Code Example / Key Takeaways
```jsx
import { create } from 'zustand';

const useDashboard = create((set) => ({
  cpu: 0,
  memory: 0,
  network: 0,
  update: (metric, value) => set(s => ({ ...s, [metric]: value })),
}));

// Each widget only re-renders when its metric changes
const CpuWidget = memo(function CpuWidget() {
  const cpu = useDashboard(s => s.cpu);
  return <Gauge value={cpu} label="CPU" />;
});

const MemoryWidget = memo(function MemoryWidget() {
  const memory = useDashboard(s => s.memory);
  return <Gauge value={memory} label="Memory" />;
});
```

---

### Q294. How do you handle large form state without performance issues?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Large forms (50+ fields) re-render entire tree on each keystroke. Solutions:

1. **React Hook Form**: Uncontrolled, uses refs, minimal re-renders
2. **Field-level state**: Each field manages own state
3. **Controlled at section level**: Not entire form
4. **Debounce validation**: Validate on blur, not each keystroke
5. **useDeferredValue**: Defer expensive derived calculations
6. **Split into sub-forms**: Isolate state per section

#### Code Example / Key Takeaways
```jsx
import { useForm, Controller } from 'react-hook-form';

// React Hook Form: uncontrolled, only re-renders on validation/submit
function LargeForm() {
  const { register, control, handleSubmit } = useForm({
    mode: 'onBlur',  // Validate on blur, not each keystroke
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {Array.from({ length: 100 }).map((_, i) => (
        <input
          key={i}
          {...register(`field${i}`, { required: true })}
        />
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

### Q295. What is the performance impact of importing barrel files?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Barrel files (`index.js` that re-exports everything) cause performance issues:

1. **Slower dev startup**: Bundlers must process entire barrel even for one import
2. **Larger initial parse**: All re-exported modules loaded
3. **Circular dependency risk**: Barrels easily create cycles
4. **Tree-shaking complexity**: Harder for bundlers to eliminate unused exports

Mitigations:
- Import directly from specific files (`import X from './X'`)
- Use deep imports (`import { X } from 'lib/X'`)
- Configure bundler for better barrel handling
- Avoid barrels in hot paths

#### Code Example / Key Takeaways
```jsx
// BAD: Imports entire barrel (loads everything)
import { Button, Modal, Table, Chart } from '@company/ui';

// GOOD: Direct import (only loads Button)
import Button from '@company/ui/Button';

// Or named + deep path (better tree-shaking)
import { Button } from '@company/ui/Button';

// Barrel file problem
// index.ts:
export * from './Button';
export * from './Modal';  // All loaded even if unused
export * from './Table';  // All loaded even if unused
```

---

### Q296. How do you use React.Profiler API programmatically?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
`<Profiler>` wraps components and calls a callback on every commit. Useful for:

1. **Production profiling**: Collect metrics in production
2. **Automated performance tests**: Assert render times in CI
3. **Conditional profiling**: Only profile specific subtrees

Callback receives: `id`, `phase` (mount/update), `actualDuration`, `baseDuration`, `startTime`, `commitTime`.

`actualDuration`: time spent rendering this Profiler's subtree
`baseDuration`: estimated time without memoization

#### Code Example / Key Takeaways
```jsx
import { Profiler } from 'react';

function logProfile(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) {
  // Send to analytics
  analytics.track('render', {
    component: id,
    phase,
    duration: actualDuration,
    baseline: baseDuration,
  });

  // Alert if slow
  if (actualDuration > 16) {
    console.warn(`[${id}] Slow render: ${actualDuration}ms`);
  }
}

function App() {
  return (
    <Profiler id="Checkout" onRender={logProfile}>
      <CheckoutFlow />
    </Profiler>
  );
}
```

---

### Q297. How do you optimize animations in React?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
Animation performance principles:

1. **Animate transform/opacity only**: GPU-accelerated, no layout/paint
2. **Avoid animating layout properties**: `width`, `height`, `top`, `left` trigger reflow
3. **Use `will-change`**: Hint browser about upcoming animations
4. **Libraries**: Framer Motion, React Spring (optimized)
5. **CSS animations**: Prefer over JS when possible
6. **useTransition for state-driven anims**: Keep UI responsive
7. **Avoid re-renders during animation**: Animate via refs/CSS

#### Code Example / Key Takeaways
```jsx
import { motion } from 'framer-motion';

// GOOD: Transform/opacity (GPU)
<motion.div
  animate={{ x: 100, opacity: 0.5 }}
  transition={{ duration: 0.3 }}
/>

// BAD: Layout properties (reflow every frame)
<motion.div animate={{ width: 200, marginTop: 50 }} />

// CSS-only animation (best performance)
const spinner = styled.div`
  animation: spin 1s linear infinite;
  will-change: transform;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
```

---

### Q298. What is the difference between useMemo and computed state?
**Difficulty:** `Intermediate`
**Category:** Performance & Optimization

#### Answer
**useMemo**: Memoizes a derived value, recomputes on dep change. Still runs during render.

**Computed state**: Derived via `useState` + `useEffect` or external store. Persists independently.

Key difference: `useMemo` recomputes synchronously during render; computed state updates asynchronously via effects.

Use `useMemo` for pure derivations. Use state/effects when derivation has side effects or needs to persist across unrelated re-renders.

#### Code Example / Key Takeaways
```jsx
// useMemo: Pure derivation during render
function FilteredList({ items, query }) {
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(query)),
    [items, query]
  );
  return <List items={filtered} />;
}

// Computed state: When derivation has side effects
function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Side effect: fetch from API
    fetchResults(query).then(setResults);
  }, [query]);

  return <List items={results} />;
}
```

---

### Q299. How do you implement a performant search-as-you-type feature?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
Performant search requires multiple optimizations:

1. **Debounce input** (200-300ms): Avoid filtering on every keystroke
2. **useDeferredValue**: Keep input responsive while filtering
3. **useMemo for filter**: Cache filtered results
4. **Virtualize results**: For large result sets
5. **Web Worker**: Move filtering off main thread for huge datasets
6. **Abort previous requests**: Cancel stale API searches
7. **Highlight matches via memo**

#### Code Example / Key Takeaways
```jsx
import { useState, useDeferredValue, useMemo, useTransition } from 'react';

function SearchPage({ dataset }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  // Filter only when deferredQuery changes (not on every keystroke)
  const results = useMemo(() => {
    if (!deferredQuery) return [];
    return dataset.filter(item =>
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [deferredQuery, dataset]);

  function onChange(e) {
    const value = e.target.value;
    setQuery(value);  // Immediate (input responsive)
    startTransition(() => {
      // Mark filtering as non-urgent
    });
  }

  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending ? <Spinner /> : <ResultsList results={results} />}
    </>
  );
}
```

---

### Q300. How do you create a performance budget and monitor it in React?
**Difficulty:** `Advanced`
**Category:** Performance & Optimization

#### Answer
A performance budget sets limits for metrics. Monitor continuously:

1. **Define budgets**: Bundle size (e.g., < 200kb JS), LCP < 2.5s, INP < 200ms, CLS < 0.1
2. **CI checks**: Fail build if bundle exceeds budget (size-limit, bundlesize)
3. **Lighthouse CI**: Automated Core Web Vitals checks on every PR
4. **RUM (Real User Monitoring)**: Collect metrics from real users (web-vitals)
5. **Bundle analyzer in CI**: Catch large dependency additions
6. **Alerting**: Notify when metrics regress

#### Code Example / Key Takeaways
```json
// package.json - size-limit config
{
  "size-limit": [
    {
      "path": "dist/main.js",
      "limit": "200 KB"
    },
    {
      "path": "dist/vendor.js",
      "limit": "150 KB"
    }
  ]
}
```

```yaml
# lighthouserc.yml - Lighthouse CI
ci:
  assertions:
    'largest-contentful-paint': ['error', { maxNumericValue: 2500 }]
    'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
    'total-blocking-time': ['error', { maxNumericValue: 300 }]
  budgetPath: './budget.json'
```

```jsx
// RUM: Send Core Web Vitals to analytics
import { onCLS, onINP, onLCP } from 'web-vitals';

function report(metric) {
  navigator.sendBeacon('/analytics', JSON.stringify(metric));
}

onLCP(report);
onINP(report);
onCLS(report);
```
