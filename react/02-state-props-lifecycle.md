# React State, Props & Lifecycle — Interview Questions (Q76–Q150)

---

### Q76. What is `useState` and how do you use it?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
`useState` is a Hook that lets you add local state to a function component. It returns a pair: the current state value and a setter function that updates it and re-renders the component. Calling the setter with a new value (different from the current by `Object.is` comparison for primitives) schedules a re-render. State is isolated per component instance, so two `<Counter />` components never share state.

#### Code Example / Key Takeaways
```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // initial value 0

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
// ponytail: useState returns [value, setter]; setter triggers re-render
```

---

### Q77. What is lazy initialization in `useState`?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`useState` accepts either a direct initial value or an initializer function. The function form is only run on the first render, which avoids expensive recomputation on every render. Use it when computing the initial state is costly (e.g., reading from localStorage, parsing JSON, deriving from props). Passing the result directly runs the computation on every render even though it is discarded.

#### Code Example / Key Takeaways
```jsx
import { useState } from 'react';

// Direct value: runs expensiveCalc() on EVERY render
const [a] = useState(expensiveCalc());

// Lazy init: expensiveCalc() runs ONCE
const [b] = useState(() => {
  const saved = localStorage.getItem('todos');
  return saved ? JSON.parse(saved) : [];
});
```

---

### Q78. What are functional updates in `useState`?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
When the next state depends on the previous state, pass a function to the setter: `setState(prev => next)`. React guarantees `prev` is the latest committed state. This avoids stale-closure bugs, especially inside event handlers, async callbacks, intervals, or when multiple state updates are batched in the same render cycle. Using `setCount(count + 1)` twice in the same handler results in only one increment if `count` is stale.

#### Code Example / Key Takeaways
```jsx
const [count, setCount] = useState(0);

// Bug: both use the same stale `count` => only +1
const bad = () => { setCount(count + 1); setCount(count + 1); };

// Correct: each update sees the prior result => +2
const good = () => { setCount(c => c + 1); setCount(c => c + 1); };
```

---

### Q79. How does state batching work in React 18?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
React batches multiple state updates into a single re-render for performance. In React 17 and earlier, batching happened only inside React event handlers, not in promises, setTimeout, or native event callbacks. React 18 extends automatic batching to those async contexts too, using the same reconciler consistently. If you truly need to flush updates synchronously, use `flushSync` from `react-dom` (use sparingly).

#### Code Example / Key Takeaways
```jsx
import { flushSync } from 'react-dom';

setTimeout(() => {
  // React 18: still batched into one re-render
  setA(1);
  setB(2);
}, 1000);

// Escape hatch: forces synchronous flush (rarely needed)
flushSync(() => { setA(1); });
```

---

### Q80. Can you update multiple state variables independently?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Yes. You can call multiple `useState` hooks in one component and update them independently. Each is a separate state slot. React re-renders once after the event handler finishes, applying all queued updates. Keeping state split into the smallest reasonable pieces (rather than one giant object) is usually clearer, though for tightly coupled data a `useReducer` may be better.

#### Code Example / Key Takeaways
```jsx
const [name, setName] = useState('');
const [age, setAge] = useState(0);

function handleSubmit() {
  setName('Ada');
  setAge(36); // both applied, single re-render
}
```

---

### Q81. Why shouldn't you mutate state directly?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
React compares state with `Object.is` to decide whether to re-render and to preserve referential immutability. Mutating an object in place keeps the same reference, so React may skip the update or render stale UI. Always create a new object/array with the change. For arrays use `map`, `filter`, spread; for objects use spread with overrides.

#### Code Example / Key Takeaways
```jsx
const [user, setUser] = useState({ name: 'Ada', age: 36 });

// Wrong: mutate in place, same reference
user.age = 37; setUser(user);

// Right: new object reference
setUser(prev => ({ ...prev, age: 37 }));
```

---

### Q82. What happens when state is set to the same value?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
If you set state to a value that is `Object.is`-equal to the current state, React bails out and does not re-render that component (and its children won't re-render from this update either). For objects/arrays this means a new reference with identical contents still triggers a re-render because the reference differs. This bail-out is a performance optimization; you don't need to guard updates manually.

#### Code Example / Key Takeaways
```jsx
setCount(0);   // if already 0 -> no re-render (primitive, equal)
setObj({ a: 1 }); // new reference -> re-render even if contents same
```

---

### Q83. How do you reset state when a key changes?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
The cleanest way to reset a component's internal state is to change its `key` prop. When React sees a different key, it treats it as a new instance and unmounts the old one, discarding its state, then mounts fresh. This is simpler and more reliable than calling setters in effects. It is especially useful for forms keyed by item id.

#### Code Example / Key Takeaways
```jsx
function Profile({ userId }) {
  // remounts when userId changes -> state resets automatically
  return <UserForm key={userId} userId={userId} />;
}
```

---

### Q84. When should you use `useReducer` instead of `useState`?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Prefer `useReducer` when state transitions are complex, depend on previous state in non-trivial ways, involve multiple sub-values that change together, or when the next state logic is hard to express inline. It centralizes the "how state changes" into a reducer function, making updates predictable and testable, and it scales better than many `useState` calls whose setters must coordinate.

#### Code Example / Key Takeaways
```jsx
const [state, dispatch] = useReducer(reducer, initialState);
// Use when: multiple related values, branching logic, or many event types
```

---

### Q85. How do you write a reducer and dispatch actions?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
A reducer is a pure function `(state, action) => newState`. It must not mutate; return a new state based on `action.type`. `dispatch(action)` sends an action object to the reducer. Actions typically have a `type` string and an optional `payload`. Because the reducer is pure, you can unit test it without rendering.

#### Code Example / Key Takeaways
```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'set':       return { count: action.payload };
    default:          return state;
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: 'increment' });
dispatch({ type: 'set', payload: 10 });
```

---

### Q86. What is lazy initialization in `useReducer`?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`useReducer(reducer, initialArg, init)` accepts an optional third argument `init`, an initializer function. React calls `init(initialArg)` once to compute the initial state. This lets you derive initial state from props or do expensive setup only on first mount, keeping the reducer itself pure. Without it you pass the initial state object directly.

#### Code Example / Key Takeaways
```jsx
function init(initialCount) {
  return { count: initialCount, history: [] };
}
const [state, dispatch] = useReducer(reducer, 0, init); // count from props
```

---

### Q87. How does dispatch behave — is it stable and can it run async?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
`dispatch` from `useReducer` is stable across renders (its identity never changes), so it's safe to omit from `useEffect` dependency arrays or pass to memoized children without breaking `React.memo`. You can dispatch inside async callbacks (e.g., after a fetch resolves). The dispatch enqueues an action; React processes the queue and re-renders. Because dispatch is stable, stale-closure problems with state are avoided.

#### Code Example / Key Takeaways
```jsx
const [state, dispatch] = useReducer(reducer, initial);

useEffect(() => {
  fetchData().then(data => dispatch({ type: 'loaded', data }));
}, []); // dispatch is stable, no need to include it
```

---

### Q88. How do you handle side effects (like fetching) with useReducer?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Reducers must stay pure — no fetching, timers, or randomness inside them. Perform side effects in event handlers or `useEffect`, then `dispatch` an action with the result (or error). Common pattern: dispatch a `pending` action before the request, then `fulfilled`/`rejected` after. This keeps data-fetching logic out of the reducer while the reducer only describes state transitions.

#### Code Example / Key Takeaways
```jsx
function loadUser(id) {
  return async (dispatch) => {            // thunk-like helper
    dispatch({ type: 'load/pending' });
    try {
      const u = await api.getUser(id);
      dispatch({ type: 'load/fulfilled', user: u });
    } catch (e) {
      dispatch({ type: 'load/rejected', error: e.message });
    }
  };
}
```

---

### Q89. What is the `children` prop and how do you use it?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
`children` is a special prop automatically populated with whatever is passed between a component's opening and closing tags. It lets you create composable layout/container components. You can render it directly, or use functions-as-children (render props) to pass data down. It is just a regular prop — it can be a node, array, string, or function.

#### Code Example / Key Takeaways
```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card>
  <h1>Title</h1>
  <p>Body content</p>
</Card>;
```

---

### Q90. How do you set default values for props?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
In function components, set defaults by destructuring with a fallback: `function Greet({ name = 'Guest' }) {}`. The legacy `Component.defaultProps` works for class components but is discouraged for function components in modern React (and ignored for destructured defaults). Default parameters only apply when the prop is `undefined`, not when it's `null` or `false`.

#### Code Example / Key Takeaways
```jsx
function Greet({ name = 'Guest', age = 18 }) {
  return <p>{name} is {age}</p>;
}
// Greet({}) -> "Guest is 18"; Greet({ name: null }) -> "null is 18"
```

---

### Q91. What is prop drilling and what problems does it cause?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Prop drilling is passing data through many intermediate components that don't need it, just to reach a deeply nested child. It couples components, makes refactoring painful, and clutters intermediate signatures. It's fine for one or two levels; beyond that, prefer Context, a state library, or composition (passing elements via `children`/`slots`) to avoid threading props.

#### Code Example / Key Takeaways
```jsx
// Drilling: App -> A -> B -> C all forward `user`
<A user={user} />   // A doesn't use user, just forwards
// Better: Context or render the consumer where data lives
```

---

### Q92. What is the difference between prop drilling and Context?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Prop drilling passes values explicitly through the component tree (explicit, easy to trace, re-renders only where passed). Context provides values implicitly to any descendant without intermediate props (less boilerplate, but every consumer re-renders when the value changes unless split/memoized). Use props for local, explicit data; use Context for truly global or widely-shared state (theme, auth, locale).

#### Code Example / Key Takeaways
```jsx
// Prop drilling: explicit, traceable
<Nav user={user} />

// Context: implicit, avoids drilling but widens coupling
<AuthContext.Provider value={user}><Nav /></AuthContext.Provider>
```

---

### Q93. Can props be mutated? Why not?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Props are read-only from the child's perspective. React enforces a one-way data flow: a parent owns the data and passes it down; a child should never mutate received props because that would break predictability and cause subtle bugs (and in strict mode React may warn). To change data, the parent updates its own state and passes new props. Treat props as immutable inputs.

#### Code Example / Key Takeaways
```jsx
function Child({ user }) {
  // user.name = 'x'; // WRONG: props are read-only
  return <p>{user.name}</p>; // read only
}
```

---

### Q94. How do you type/validate props (PropTypes) in React?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
`prop-types` (a separate package since React 15.5) lets you declare expected types; React logs console warnings in development when props mismatch. It's runtime validation, less powerful than TypeScript but useful in plain JS codebases. Common validators: `PropTypes.string`, `.number`, `.func`, `.arrayOf`, `.shape`, `.oneOf`, and `isRequired`. In TS projects, prefer static types instead.

#### Code Example / Key Takeaways
```jsx
import PropTypes from 'prop-types';

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};
```

---

### Q95. What is `useEffect` and when does it run?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
`useEffect(callback, deps)` runs side effects after render is committed to the screen. With no dependency array it runs after every render; with an empty array `[]` it runs once after the initial mount; with a deps array it runs after mounts and whenever any dependency changes (and after the first render). The callback runs asynchronously after paint, so it's good for data fetching, subscriptions, and DOM measurements that don't block paint.

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]); // runs after mount and whenever count changes
```

---

### Q96. How do you run an effect only on mount?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Pass an empty dependency array `[]`. React then runs the effect once after the first commit and never re-runs it (ignoring dependency changes, because there are none). Be careful: values captured inside are from the first render; if you reference props/state, add them to deps or accept the initial snapshot intentionally.

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  console.log('mounted once');
  // one-time setup (e.g., init third-party lib)
}, []); // mount-only
```

---

### Q97. How do you clean up in `useEffect`?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Return a cleanup function from the effect callback. React runs it before re-running the effect (when deps change) and before unmounting. Use it to unsubscribe, clear timers, remove event listeners, or cancel requests — anything that would otherwise leak or cause errors on stale components. Forgetting cleanup is a common source of memory leaks and "setState on unmounted" warnings.

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(id); // cleanup on unmount / dep change
}, []);
```

---

### Q98. How do you fetch data in `useEffect` safely?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Fetch inside an effect with an empty (or param-based) deps array, and guard against setting state after unmount using an `ignore` flag or `AbortController`. Otherwise a late response can call `setState` on an unmounted component (React warns, and it's a leak). Modern approach: use `AbortController` to cancel the request on cleanup.

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
  return () => controller.abort(); // cancel on unmount / id change
}, [id]);
```

---

### Q99. What happens when dependencies are missing or wrong?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
If you omit a dependency that the effect uses, the effect closes over a stale value and won't re-run when that value changes, causing bugs. The exhaustive-deps ESLint rule flags this. Conversely, including unstable references (new objects/functions each render) causes the effect to run every render. Fix by adding real deps, or memoizing unstable values with `useMemo`/`useCallback`.

#### Code Example / Key Takeaways
```jsx
// Bug: `id` used but not in deps -> never refetches on id change
useEffect(() => { fetchUser(id); }, []); // exhaustive-deps warns
// Fix: add id, or guard intentionally and document why
useEffect(() => { fetchUser(id); }, [id]);
```

---

### Q100. How do you skip effect runs on initial mount?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
There's no built-in "skip first render" flag, but you can use a ref to track whether it's the first run and return early. This is useful when you want to react only to updates, not the initial mount. Alternatively, initialize state from the value so the first effect run is a no-op.

#### Code Example / Key Takeaways
```jsx
const isFirst = useRef(true);
useEffect(() => {
  if (isFirst.current) { isFirst.current = false; return; }
  console.log('updated, not mounted');
}, [value]);
```

---

### Q101. How do multiple effects interact and in what order do they run?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Effects run in the order they are declared, after the render is committed, top to bottom. Cleanups also run in declaration order, before the next set of effects when deps change, and on unmount. You can split concerns into multiple `useEffect` calls (one per logical side effect) rather than cramming everything into one — this is encouraged for clarity.

#### Code Example / Key Takeaways
```jsx
useEffect(() => { /* A: subscribe */ return () => {}; }, []);
useEffect(() => { /* B: sync title */ }, [count]);
// Order: A runs, B runs; on count change: B cleanup -> B re-run
```

---

### Q102. What is the purpose of the dependency array, precisely?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
The dependency array tells React when to re-run the effect: it compares each entry with the previous render's values using `Object.is`. Three cases: no array → every render; `[]` → only after first render; `[a, b]` → after first render and whenever `a` or `b` changes by `Object.is`. Omitting the array when you meant `[]` is a frequent mistake that causes infinite loops with state updates.

#### Code Example / Key Takeaways
```jsx
useEffect(fn);          // every render
useEffect(fn, []);      // mount only
useEffect(fn, [a, b]);  // when a or b change
```

---

### Q103. How do you handle subscriptions in effects?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Subscribe in an effect and return a cleanup that unsubscribes. If the subscription source depends on a prop/state value, include it in deps so React re-subscribes when it changes, and the cleanup prevents overlapping subscriptions. This pattern applies to WebSocket, EventTarget, store subscriptions, etc.

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  const socket = new WebSocket(`/ws/${room}`);
  socket.onmessage = e => setMessages(m => [...m, e.data]);
  return () => socket.close(); // unsubscribe on room change/unmount
}, [room]);
```

---

### Q104. What is the "infinite loop" trap with useEffect and objects?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
If an effect sets state and the dependency is an object/array recreated every render (new reference), the effect runs every render, sets state, triggers re-render, and loops. Also, calling a state setter whose dep is the same object reference but you spread into a new one each time loops. Fix: depend on primitive fields, memoize the object, or compute inside the effect without depending on the whole object.

#### Code Example / Key Takeaways
```jsx
const opts = { limit: 10 }; // new ref every render
useEffect(() => { fetchData(opts); }, [opts]); // loops!
// Fix: useState/useMemo opts, or depend on opts.limit
useEffect(() => { fetchData(opts); }, [opts.limit]);
```

---

### Q105. Can you use effects to sync external stores with React state?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Yes — subscribe in an effect and push external changes into state via setter, with cleanup to unsubscribe. For external stores (Redux, Zustand, browser APIs), React 18 also offers `useSyncExternalStore` which is purpose-built: it reads a snapshot and subscribes safely, handling concurrent rendering and avoiding tearing. Prefer `useSyncExternalStore` over hand-rolled effect subscriptions for stores.

#### Code Example / Key Takeaways
```jsx
import { useSyncExternalStore } from 'react';

const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
// safer than useEffect + setState for external stores
```

---

### Q106. What is the difference between `useEffect` and `useLayoutEffect`?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
`useEffect` runs asynchronously after the browser paints; `useLayoutEffect` runs synchronously after DOM mutations but before the browser paints. Layout effects are for reading layout (e.g., `getBoundingClientRect`) and synchronously re-styling to avoid a visible flash. Because layout effects block paint, overuse hurts performance. For most side effects (fetching, subscriptions) `useEffect` is correct.

#### Code Example / Key Takeaways
```jsx
useLayoutEffect(() => {
  // measure then set position BEFORE paint (no flicker)
  const rect = ref.current.getBoundingClientRect();
  setPos(rect.top);
}, []);
```

---

### Q107. When would you choose `useLayoutEffect` over `useEffect`?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Choose `useLayoutEffect` only when you must read computed layout and make DOM changes (or state changes that affect layout) before the user sees the painted frame — e.g., tooltip positioning, animations that start from a measured size, or avoiding a flash of wrong styles. Otherwise prefer `useEffect` to keep paint fast. On the server, `useLayoutEffect` warns; guard or use `useEffect` there.

#### Code Example / Key Takeaways
```jsx
// Tooltip: measure target, set coordinates, all before paint
useLayoutEffect(() => {
  const { top } = anchorRef.current.getBoundingClientRect();
  tipRef.current.style.top = `${top}px`;
}, [anchor]);
```

---

### Q108. Why does `useLayoutEffect` warn during SSR?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`useLayoutEffect` cannot run on the server because there is no DOM to measure or mutate before paint. React emits a warning during SSR if it's used. The common fix is `useIsomorphicLayoutEffect`: a variable that is `useLayoutEffect` in the browser and `useEffect` on the server. This avoids the warning while keeping layout-sync behavior client-side.

#### Code Example / Key Takeaways
```jsx
import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
```

---

### Q109. What are synthetic events in React?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
React wraps native browser events in a cross-browser `SyntheticEvent` object, normalizing properties (e.g., `event.target`, `event.preventDefault`, `event.stopPropagation`) across browsers. Handlers receive this synthetic event. It behaves like the native event but is pooled in legacy React (see next). In React 17+, events are attached at the root container, not document, and synthetic events are no longer pooled.

#### Code Example / Key Takeaways
```jsx
function Form() {
  return (
    <input
      onChange={e => console.log(e.target.value, e.type)} // SyntheticEvent
    />
  );
}
```

---

### Q110. What was event pooling and is it still a thing?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
In React 16 and earlier, synthetic events were "pooled": after the handler ran, the event object's properties were nullified and the object reused for performance. You had to call `e.persist()` to read it asynchronously. React 17 removed pooling entirely — you can freely access `e` in `setTimeout` or `async` code. Interviewers still ask; the correct modern answer is "pooling was removed in React 17."

#### Code Example / Key Takeaways
```jsx
// React 16: e would be nulled after handler -> needed e.persist()
// React 17+: this just works
onClick={e => setTimeout(() => console.log(e.target), 1000)};
```

---

### Q111. How do you prevent default behavior in React events?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Call `event.preventDefault()` inside the handler — you cannot return `false` to prevent default as in some frameworks. This is essential for forms: `onSubmit` handlers should `preventDefault()` to stop the browser's full-page reload. Likewise `onClick` on links. Note React attaches listeners at the root, but `preventDefault` still works as expected.

#### Code Example / Key Takeaways
```jsx
function Form() {
  const onSubmit = e => {
    e.preventDefault(); // stop page reload
    console.log('handled via JS');
  };
  return <form onSubmit={onSubmit}><button>Go</button></form>;
}
```

---

### Q112. How does event delegation work in React 17+?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Before React 17, React attached a single set of listeners at the `document`. From React 17, it attaches them to the root DOM container where `ReactDOM.render` mounts, so multiple React versions can coexist and events don't leak to the document. Your `onClick` etc. are still dispatched through React's synthetic system; native listeners you add with `addEventListener` on the same element can interleave but React's delegation root differs.

#### Code Example / Key Takeaways
```jsx
// React 17+: delegation root is the app container, not document
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

---

### Q113. How do you pass arguments to event handlers?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Two common ways: wrap in an arrow function `onClick={() => handle(id)}`, or use `bind` `onClick={handle.bind(null, id)}`. The arrow form is idiomatic in modern code. Be mindful that creating a new function each render can hurt memoized children; if needed, use a data attribute or curry the handler and read `e.currentTarget.dataset` instead.

#### Code Example / Key Takeaways
```jsx
<button onClick={() => deleteItem(id)}>Delete</button>
// or read from dataset to avoid new closures:
<button data-id={id} onClick={e => deleteItem(e.currentTarget.dataset.id)} />
```

---

### Q114. What is `useRef` and what is it used for?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
`useRef(initialValue)` returns a mutable object `{ current }` whose identity is stable across renders. Unlike state, changing `ref.current` does NOT trigger a re-render. Use it to hold DOM nodes, timer IDs, previous values, or any mutable value you don't want to cause re-renders. It persists for the component's lifetime and resets only on unmount/remount.

#### Code Example / Key Takeaways
```jsx
const inputRef = useRef(null);
useEffect(() => { inputRef.current?.focus(); }, []);
<input ref={inputRef} />;
```

---

### Q115. How do you access a DOM node via a ref?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Attach a ref object to a built-in element's `ref` attribute; React assigns the DOM node to `ref.current` after mount and sets it to `null` on unmount. You can then read/measure/manipulate the node in effects or handlers. This is the supported imperative escape hatch — prefer declarative rendering, but refs are fine for focus, media playback, measurements.

#### Code Example / Key Takeaways
```jsx
const videoRef = useRef(null);
const play = () => videoRef.current.play();
<video ref={videoRef} src="a.mp4" />;
```

---

### Q116. How do you track a previous value with a ref?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Store the value in a ref and update it after render (in an effect or during render with care). A common custom hook `usePrevious` saves the previous render's value. Use this when you need to compare "before vs after" without adding state that triggers extra renders.

#### Code Example / Key Takeaways
```jsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }); // runs after commit
  return ref.current;
}
const prev = usePrevious(count);
```

---

### Q117. What is `forwardRef` and when do you need it?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Function components don't receive `ref` as a normal prop (it's special). `forwardRef` lets a component accept a ref from its parent and forward it to a child DOM node or component. You need it when building reusable wrappers around inputs, buttons, or libraries where the parent must directly access the underlying node. Class components accept `ref` natively, so only function components need `forwardRef`.

#### Code Example / Key Takeaways
```jsx
const FancyInput = forwardRef((props, ref) => (
  <input ref={ref} className="fancy" {...props} />
));

const ref = useRef();
<FancyInput ref={ref} />; // ref points to the <input>
```

---

### Q118. What is `useImperativeHandle`?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
`useImperativeHandle(ref, createHandle, deps)` customizes the instance value that a parent receives via `ref` when using `forwardRef`. Instead of exposing the whole DOM node, you expose a limited API (e.g., `{ focus, reset }`). Pair it with `forwardRef`. Use sparingly — declarative props are usually better, but imperative handles are handy for focus management or animations.

#### Code Example / Key Takeaways
```jsx
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
  }), []);
  return <input ref={inputRef} />;
});
```

---

### Q119. What's the difference between a ref and state?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
State changes trigger re-renders and are immutable-ish (set via setter); refs are mutable via `.current`, do NOT trigger re-renders, and persist across renders. Use state for anything rendered in the UI; use refs for values you read/write imperatively (DOM nodes, timers, caches, "latest" values in callbacks). Don't use refs to store data that should be reflected in the view.

#### Code Example / Key Takeaways
```jsx
const [open, setOpen] = useState(false); // UI reacts
const timer = useRef();                  // no re-render on change
```

---

### Q120. How do you create and provide context?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Call `createContext(defaultValue)` to make a context object. Wrap descendants in `<Context.Provider value={...}>`. Any component inside can read the value with `useContext`. The `defaultValue` is only used when there is no matching Provider above. Wrap the value in `useMemo` when it's an object to avoid unnecessary consumer re-renders.

#### Code Example / Key Takeaways
```jsx
const ThemeContext = createContext('light');

<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>;
```

---

### Q121. How do you consume context with `useContext`?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Call `useContext(MyContext)` inside a component to get the current value from the nearest Provider above it. It re-renders the component whenever the context value changes. You can consume multiple contexts. Note: `useContext` must be called at the top level of a component, not conditionally.

#### Code Example / Key Takeaways
```jsx
function Toolbar() {
  const theme = useContext(ThemeContext); // nearest Provider value
  return <div className={theme}>...</div>;
}
```

---

### Q122. Does a context value change re-render all consumers?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Yes — every component calling `useContext` for that context re-renders whenever the Provider's `value` changes (by `Object.is`). If you pass a new object/array each render, all consumers re-render even if their slice is unchanged. Mitigate by: memoizing the value with `useMemo`, splitting contexts by concern, or using external stores (`useSyncExternalStore`) for fine-grained updates.

#### Code Example / Key Takeaways
```jsx
// Bad: new object each render -> all consumers re-render
<Ctx.Provider value={{ user, theme }}>

// Better: memoize
const value = useMemo(() => ({ user, theme }), [user, theme]);
<Ctx.Provider value={value}>
```

---

### Q123. How do you avoid unnecessary context re-renders?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Strategies: (1) Memoize the `value` with `useMemo` so identity is stable when contents are equal. (2) Split into multiple smaller contexts (e.g., `UserContext` vs `ThemeContext`) so a theme change doesn't re-render user consumers. (3) Separate the state setter from the value — provide the setter via a stable context and the value via another. (4) For high-frequency updates, use an external store instead of context.

#### Code Example / Key Takeaways
```jsx
const UserCtx = createContext(null);
const UserDispatch = createContext(null); // stable dispatch
// split value (changes) from dispatch (stable) to limit re-renders
```

---

### Q124. Can you have a default value for context without a Provider?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Yes. `createContext(defaultValue)` sets a fallback used when a component consumes the context but no Provider is above it in the tree. It's only a fallback — once a Provider exists, its `value` always wins, even if `undefined`. This is useful for testing components in isolation or for optional contexts.

#### Code Example / Key Takeaways
```jsx
const Ctx = createContext({ lang: 'en' });
// No Provider -> component sees { lang: 'en' }
```

---

### Q125. How do you update context from a consumer?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Context itself is just data; to let consumers update it, lift state to the Provider and pass the setter (or a dispatch) through context too. The provider holds `useState`/`useReducer` and supplies both value and an updater. Consumers call the updater, which changes the Provider's state, which re-renders all consumers. This is the standard "context + reducer" pattern.

#### Code Example / Key Takeaways
```jsx
const [user, setUser] = useState(null);
<AuthContext.Provider value={{ user, setUser }}>
// Consumer: const { setUser } = useContext(AuthContext);
```

---

### Q126. What is the difference between Context and Redux?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Context is a built-in mechanism for passing values down without props; it re-renders all consumers on value change and has no built-in devtools, middleware, or time-travel. Redux is an external state container with a single store, reducers, middleware, selectors, and optimized subscriptions that avoid re-rendering unrelated components. For simple shared state, Context suffices; for complex, high-frequency, or multi-consumer app state, a store with fine-grained subscriptions scales better.

#### Code Example / Key Takeaways
```jsx
// Context: re-renders consumers on any value change
// Redux + useSelector: only re-renders when selected slice changes
```

---

### Q127. How do you provide multiple contexts cleanly?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Nest Providers, but deep nesting is ugly. You can compose them into a single `AppProviders` component that stacks them in a readable order, or use a context-splitting utility. Keep related contexts separate so updates don't cascade. A common pattern: a `Providers` wrapper component used once at the root.

#### Code Example / Key Takeaways
```jsx
function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <I18nProvider>{children}</I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

---

### Q128. Can you consume context conditionally or in loops?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Hooks, including `useContext`, must be called unconditionally at the top level — never inside `if`, loops, or nested functions, or React's hook-order tracking breaks and you'll get errors. To vary behavior, always call `useContext` first, then branch on the resulting value. The "don't call hooks in conditions" rule is strict and non-negotiable.

#### Code Example / Key Takeaways
```jsx
function C() {
  const ctx = useContext(MyCtx); // always called
  if (ctx.enabled) return <On />; // branch AFTER the hook
  return <Off />;
}
```

---

### Q129. What is `React.memo` and how does it work?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`React.memo(Component)` is a higher-order component that memoizes the rendered output, skipping re-renders when the component's props are shallowly equal (`Object.is` per prop) to the previous render. It's a performance optimization for components that re-render often with the same props. It does a shallow comparison; deeply nested objects still trigger re-renders unless their references are stable (via `useMemo`/`useCallback`). It does NOT help if the component uses context or internal state that changes.

#### Code Example / Key Takeaways
```jsx
const Row = React.memo(function Row({ item }) {
  return <li>{item.name}</li>;
});
// Re-renders only when `item` reference changes
```

---

### Q130. What is `useMemo` and when should you use it?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`useMemo(fn, deps)` memoizes the result of a computation, recomputing only when deps change. Use it for expensive calculations (sorting, filtering large arrays, heavy derivations) or to produce stable object/array references passed to memoized children / context. Don't use it for every trivial calculation — the overhead and complexity usually outweigh the gain. Its identity guarantee also helps avoid re-renders.

#### Code Example / Key Takeaways
```jsx
const sorted = useMemo(() => items.slice().sort(byName), [items]);
// recomputes only when `items` changes
```

---

### Q131. What is `useCallback` and how is it different from `useMemo`?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`useCallback(fn, deps)` returns a memoized version of the function itself (stable identity across renders unless deps change). `useMemo` memoizes a value; `useCallback` memoizes a function — in fact `useCallback(fn, deps)` is roughly `useMemo(() => fn, deps)`. Use it to keep stable function identities so memoized children (via `React.memo`) don't re-render, and to keep stable deps in effects.

#### Code Example / Key Takeaways
```jsx
const handleClick = useCallback(() => doThing(id), [id]);
// stable identity unless id changes -> safe for memoized children
```

---

### Q132. How do refs, memo, and callbacks interact to prevent re-renders?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
A memoized child (`React.memo`) re-renders only when its props change by shallow compare. If a parent passes a new inline function or new object each render, the child re-renders despite memoization. Wrap those functions in `useCallback` and objects in `useMemo` to keep references stable. Refs are naturally stable (no re-render on change) but don't trigger child updates. Combine: memo child + stable callbacks + stable value props = minimal re-renders.

#### Code Example / Key Takeaways
```jsx
const onSelect = useCallback(id => setSel(id), []);
const data = useMemo(() => ({ items }), [items]);
<Row onSelect={onSelect} data={data} />; // memoized Row stays put
```

---

### Q133. Are `useMemo`/`useCallback` guarantees or optimizations?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
They are optimizations, not semantic guarantees. React may discard memoized values (e.g., on low-memory situations or in future concurrent features) and recompute. Never rely on them for correctness — only for performance. If a computation must run exactly once or have a guaranteed identity, use `useState` lazy init or refs. Treat memoization as a hint.

#### Code Example / Key Takeaways
```jsx
// WRONG: relying on useMemo for correctness
const list = useMemo(() => fetchList(), []); // may recompute
// RIGHT: side effect in effect + state
```

---

### Q134. How do you profile and find unnecessary re-renders?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Use the React DevTools "Profiler" to record renders and see which components re-rendered and why (it highlights commits and per-component wasted renders). The "Highlight updates" option flashes re-rendering components. For automated detection, the `why-did-you-render` library warns when a component re-renders with equal props. Always measure before optimizing — premature memoization adds complexity.

#### Code Example / Key Takeaways
```jsx
// React DevTools Profiler -> Record -> inspect "re-rendered by"
// why-did-you-render: patches components to log needless renders
```

---

### Q135. When should you NOT use `React.memo`?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Don't memoize when the component is cheap to render (the memo comparison costs more than re-rendering), when it always receives new props anyway (e.g., new inline objects), when it reads context that changes often (memo won't help), or at the very top of a tree that re-renders entirely. Memoization without a stable-prop situation just adds overhead. Measure first.

#### Code Example / Key Takeaways
```jsx
// Pointless: parent always passes new object -> memo never skips
<Row item={{ id, name }} />; // React.memo can't help here
```

---

### Q136. How do you create an error boundary?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Error boundaries are class components implementing `static getDerivedStateFromError(error)` (to render a fallback UI) and/or `componentDidCatch(error, info)` (for logging). They catch errors during rendering, in lifecycle methods, and in constructors of the whole tree below them — but NOT in event handlers, async code, or SSR. Function components cannot be error boundaries (no equivalent Hook), so you still need a class for this.

#### Code Example / Key Takeaways
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { logError(error, info); }
  render() {
    return this.state.hasError ? <Fallback /> : this.props.children;
  }
}
```

---

### Q137. What can't error boundaries catch?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Error boundaries do NOT catch: errors in event handlers, asynchronous code (setTimeout, promises, async/await), server-side rendering, or errors thrown in the boundary itself. For those, use `try/catch` in event handlers/async functions, or error states. This is a common interview trap — boundaries only cover render/lifecycle/constructor phases of descendants.

#### Code Example / Key Takeaways
```jsx
// Event handler error: handle manually, boundary won't catch
const onClick = () => {
  try { risky(); } catch (e) { setError(e); }
};
```

---

### Q138. How do you handle errors in event handlers or async code?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Use plain `try/catch` for synchronous/async logic and local error state to show a message. For async, catch promise rejections and set state (or dispatch an error action). If you want to "rethrow" into a boundary from async, you can store the error and re-throw during render so the nearest boundary catches it. This bridges async failures into the boundary system when desired.

#### Code Example / Key Takeaways
```jsx
const [err, setErr] = useState(null);
useEffect(() => {
  load().catch(setErr);
}, []);
if (err) throw err; // optionally surface to error boundary
```

---

### Q139. What is `React.lazy` and how do you use it?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`React.lazy(() => import('./Heavy'))` lets you code-split a component: it's loaded only when first rendered, returning a Promise that resolves to a module with a default export component. Wrap it in `<Suspense fallback={...}>` to show a placeholder while loading. This reduces initial bundle size. The dynamic `import()` must resolve to a module whose default export is the component.

#### Code Example / Key Takeaways
```jsx
const Heavy = React.lazy(() => import('./Heavy'));

<Suspense fallback={<Spinner />}>
  <Heavy />
</Suspense>;
```

---

### Q140. What is `Suspense` and what does `fallback` do?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
`<Suspense fallback={...}>` shows the `fallback` UI while any component inside it is "suspended" — currently triggered by `React.lazy` code-splitting or data-fetching libraries that integrate with Suspense. When the suspended resource resolves, React swaps in the real content. You can nest Suspense boundaries for granular loading states. Suspense for data (not just lazy) is an evolving feature; the stable use today is with `React.lazy`.

#### Code Example / Key Takeaways
```jsx
<Suspense fallback={<Loading />}>
  <Profile />
  <Posts />
</Suspense>;
```

---

### Q141. Can you use `Suspense` for data fetching?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Yes, but it depends on the data library. Suspense for data is supported by libraries like Relay, React Query (with `useSuspenseQuery`), and `Suspense` integrations — your resource throws a promise that Suspense catches, then renders the fallback. The built-in `fetch` + Suspense isn't stable without a framework (Next.js App Router uses it). For plain `useEffect` fetching, Suspense does NOT apply; you'd use `React.lazy` or a suspense-enabled client.

#### Code Example / Key Takeaways
```jsx
// With a suspense-enabled client:
const data = useSuspenseQuery(key); // throws promise while loading
// Wrapped by <Suspense fallback={<Skeleton />}>
```

---

### Q142. How do error boundaries and Suspense work together?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Place an error boundary OUTSIDE (above) the Suspense boundary so that both lazy-load failures and render errors are caught. A boundary catches errors thrown by a failed lazy import or a component that throws during render; Suspense handles the "still loading" state. Order matters: `<ErrorBoundary><Suspense><Lazy/></Suspense></ErrorBoundary>`. If the lazy import rejects (network error), the boundary shows the fallback, not Suspense.

#### Code Example / Key Takeaways
```jsx
<ErrorBoundary fallback={<LoadFailed />}>
  <Suspense fallback={<Spinner />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>
```

---

### Q143. What is Strict Mode and what does it do?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
`<React.StrictMode>` is a development-only wrapper that activates extra checks and warnings to surface unsafe patterns. It intentionally double-invokes certain functions (render, constructors, some effects' setup+cleanup+setup) to help you find impure code and missing cleanups. It renders components twice, logs deprecated APIs, and detects unsafe lifecycle usage. It has no effect in production — the double-invoke disappears.

#### Code Example / Key Takeaways
```jsx
import { StrictMode } from 'react';
<StrictMode><App /></StrictMode>; // dev-only extra checks
```

---

### Q144. Why does Strict Mode double-invoke effects?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
In development, Strict Mode mounts, unmounts, then remounts each component once to verify that effects clean up properly and can re-create state correctly. It runs setup → cleanup → setup for effects (and runs reducers/state initializers twice). This surfaces missing cleanup (leaks) and impure render logic. If your effect leaks without cleanup, Strict Mode will expose it. Production runs effects once.

#### Code Example / Key Takeaways
```jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // must clean up or Strict Mode leaks
}, []);
// dev: setup, cleanup, setup again
```

---

### Q145. How do you handle the double-render in Strict Mode?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
You generally don't "handle" it — you make your code idempotent and side-effect-free in render. For effects, ensure cleanups fully undo setup so the doubled mount/unmount is harmless. Avoid module-level singletons mutated in effects without cleanup. If you must run something exactly once (e.g., analytics), guard with a ref, but first verify it's truly needed — most double-invoke issues reveal a real missing cleanup.

#### Code Example / Key Takeaways
```jsx
const done = useRef(false);
useEffect(() => {
  if (done.current) return; // guard one-time side effect
  done.current = true;
  initAnalytics();
}, []);
```

---

### Q146. What is the difference between development and production builds?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Development builds include prop-type checks, extra warnings, Strict Mode double-invocation, and detailed error messages — slower and larger. Production builds are minified, strip these dev-only checks, and run effects once. That's why behavior (especially Strict Mode effects) differs between `npm start` and the production bundle. Always test production-like behavior before shipping.

#### Code Example / Key Takeaways
```jsx
// Production: NODE_ENV=production -> no dev warnings, effects run once
// Dev: NODE_ENV=development -> Strict Mode, warnings, double effects
```

---

### Q147. How do you detect Strict Mode issues early?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Keep Strict Mode ON in development (it's on by default in create-react-app / Vite templates). Watch the console for "double-invoke" leaking timers, duplicate subscriptions, or "state updates on unmounted component" warnings — these point to missing cleanups. Write effects that are reversible. Treat any leak exposed in dev as a real bug even if production hides the symptom.

#### Code Example / Key Takeaways
```jsx
// Symptom in Strict Mode: two console logs on mount -> effect not cleaned
useEffect(() => { console.log('sub'); return () => console.log('unsub'); }, []);
```

---

### Q148. Does Strict Mode affect state or context values?
**Difficulty:** `Intermediate`
**Category:** State, Props & Lifecycle

#### Answer
Strict Mode double-invokes render functions and state initializers to check purity, but it does NOT change the actual committed state or context values the user sees — the second render result is what's used. It may call your `useState` initializer or `useReducer` reducer twice in dev to detect impurity, so those must be pure. The user-visible UI is still correct and single.

#### Code Example / Key Takeaways
```jsx
// Reducer/init must be pure: double-invoked in dev
const [s] = useReducer(reducer, 0, init); // init may run twice (dev)
```

---

### Q149. How do you opt out of Strict Mode for a subtree?
**Difficulty:** `Basic`
**Category:** State, Props & Lifecycle

#### Answer
Strict Mode is opt-in per tree. Simply don't wrap a subtree in `<React.StrictMode>`. If the whole app is wrapped, remove the wrapper or wrap only the parts you want checked. There's no per-component "disable" flag — it's all-or-nothing at the wrapper boundary. Most teams keep it on; you'd only remove it when a third-party lib misbehaves under double-invoke.

#### Code Example / Key Takeaways
```jsx
// Remove outer StrictMode to opt a subtree out
<App /> // no StrictMode wrapper = no double-invoke/dev checks
```

---

### Q150. Why might production behave differently than dev with effects?
**Difficulty:** `Advanced`
**Category:** State, Props & Lifecycle

#### Answer
Two main reasons: (1) Strict Mode's double mount/cleanup only happens in dev, so a missing cleanup (leak, duplicate listener, double-subscribe) is hidden in production but exposed in dev. (2) Dev builds run extra validation. If production "works" but dev shows warnings, the dev warning usually indicates a latent bug that production merely tolerates. Always fix the root cause (proper cleanup, purity) rather than disabling Strict Mode.

#### Code Example / Key Takeaways
```jsx
// Bug only visible in dev Strict Mode:
useEffect(() => { window.addEventListener('resize', onResize); }, []);
// no cleanup -> duplicate listeners under Strict Mode; fix with cleanup
useEffect(() => {
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```
