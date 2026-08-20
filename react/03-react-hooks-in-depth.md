# React Hooks In Depth - Interview Questions (Q151-Q230)

---

### Q151. Why must Hooks be called at the top level of a React component?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

Hooks must always be called at the top level of a React function component, never inside loops, conditions, or nested functions. React relies on a linked list internally to track each Hook's state between renders. The order of Hook calls determines which state belongs to which Hook. If a Hook is called conditionally, the order changes between renders, and React assigns state to the wrong Hook, causing unpredictable bugs.

#### Code Example / Key Takeaways

```jsx
// VIOLATION: Hook called conditionally
function BadComponent({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null); // WRONG: conditional hook call
  }
}

// CORRECT: Always call at top level
function GoodComponent({ isLoggedIn }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser().then(setUser);
    }
  }, [isLoggedIn]); // conditional logic INSIDE the hook, not around it
}
```

---

### Q152. Explain the internal mechanism React uses to track Hook calls.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

React maintains a linked list of Hook state slots for each component fiber. When a component first renders, React allocates a slot for each Hook call in order. On subsequent renders, it walks the linked list sequentially, matching each `useState`, `useEffect`, etc. to its corresponding slot. This is why the order and count of Hook calls must remain stable. If a Hook is conditionally skipped, every Hook after it shifts up one slot, and React reads the wrong state values.

#### Code Example / Key Takeaways

```jsx
// Pseudocode of React's internal Hook tracking
// Render 1: useA -> useB -> useC  (slots: [A, B, C])
// Render 2: useA ->      -> useC  (slots: [A, B, C])
//           useA reads slot A (correct)
//           useC reads slot B (WRONG - gets B's old value!)
```

---

### Q153. What is the relationship between custom Hooks and the Rules of Hooks?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

Custom Hooks must follow the same Rules of Hooks as built-in Hooks. They must start with the word `use` (a naming convention so React's linter can enforce rules), and they can only call other Hooks at the top level of the custom Hook function. Custom Hooks are not special at runtime; they are plain JavaScript functions that call Hooks. The `use` prefix signals to developers and the linter that this function follows Hook rules.

#### Code Example / Key Takeaways

```jsx
function useWindowSize() {
  // This is fine because we're at the top level of the custom Hook
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

---

### Q154. What happens if you call Hooks conditionally and how does React ESLint plugin catch this?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

Calling Hooks conditionally causes the "Rules of Hooks" violation. The `eslint-plugin-react-hooks` provides the `exhaustive-deps` rule and the `rules-of-hooks` rule. The `rules-of-hooks` rule statically analyzes your code to detect Hook calls inside conditionals, loops, or nested functions. It reports errors at lint time before the bug manifests at runtime. This is one of the most valuable linting rules in the React ecosystem.

#### Code Example / Key Takeaways

```jsx
// ESLint will flag this with "React Hook 'useState' is called conditionally"
function Component({ showExtra }) {
  const [name, setName] = useState('');
  if (showExtra) {
    const [extra, setExtra] = useState(''); // Lint error!
  }
  const [age, setAge] = useState(0);
}
```

---

### Q155. Compare useState and useReducer: when would you choose one over the other?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useState` is ideal for simple, independent state values (strings, booleans, numbers). `useReducer` is better when you have complex state logic, multiple related state values, or when the next state depends on the previous one. `useReducer` centralizes state transitions in a reducer function, making them predictable and testable. It also avoids the problem of stale closures in setState callbacks since the reducer receives the current state as an argument.

#### Code Example / Key Takeaways

```jsx
// useState for simple state
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// useReducer for complex state with multiple sub-values
function todoReducer(state, action) {
  switch (action.type) {
    case 'add':
      return [...state, action.payload];
    case 'toggle':
      return state.map(todo =>
        todo.id === action.id ? { ...todo, done: !todo.done } : todo
      );
    case 'remove':
      return state.filter(todo => todo.id !== action.id);
    default:
      return state;
  }
}

function TodoList() {
  const [todos, dispatch] = useReducer(todoReducer, []);
  return (
    <>
      <button onClick={() => dispatch({ type: 'add', payload: { id: Date.now(), text: 'New', done: false } })}>
        Add Todo
      </button>
      {todos.map(todo => (
        <div key={todo.id} onClick={() => dispatch({ type: 'toggle', id: todo.id })}>
          {todo.text} - {todo.done ? 'Done' : 'Pending'}
        </div>
      ))}
    </>
  );
}
```

---

### Q156. Can useState receive a function as its initial value? When is this useful?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Yes. Passing a function to `useState` (called a "lazy initializer") causes React to call that function only on the initial render. This is useful when computing the initial state is expensive. Without the lazy initializer, the computation runs on every render even though the result is only used once. The function must be pure and take no arguments.

#### Code Example / Key Takeaways

```jsx
// EXPENSIVE: Computes on every render
function Component1() {
  const [state, setState] = useState(computeExpensiveValue());
}

// OPTIMAL: Computes only on first render
function Component2() {
  const [state, setState] = useState(() => computeExpensiveValue());
}

function computeExpensiveValue() {
  console.log('Computing...');
  return Array.from({ length: 1000000 }, (_, i) => i * 2);
}
```

---

### Q157. What is the difference between setState with a value vs. a function updater?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

When you call `setState(newValue)`, React schedules that exact value for the next state. When you call `setState(prev => newValue)`, React passes the most recent state to the updater function. The function form is essential when the new state depends on the previous state, especially inside closures like event handlers or `useEffect` callbacks that capture stale values. React batches multiple `setState` calls, so the function form ensures each update sees the latest state.

#### Code Example / Key Takeaways

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // WRONG: Stale closure - all three see count=0
  function handleClickThree() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    // Result: count = 1 (not 3!)
  }

  // CORRECT: Each updater sees the latest state
  function handleClickCorrect() {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // Result: count = 3
  }
}
```

---

### Q158. How does batching work with useState and what changed in React 18?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

React batches state updates to avoid unnecessary re-renders. Before React 18, batching only occurred within React event handlers. Inside `setTimeout`, `Promise.then`, or native event handlers, each `setState` triggered a separate re-render. React 18 introduced "automatic batching" which batches all state updates regardless of where they originate (event handlers, timeouts, promises, native events). This is enabled by default with the new root API (`createRoot`).

#### Code Example / Key Takeaways

```jsx
// React 18: This causes only ONE re-render
function handleClick() {
  setTimeout(() => {
    setCount(c => c + 1);  // Batched
    setName('Alice');       // Batched
    setFlag(f => !f);       // Batched
    // Only 1 re-render in React 18 (was 3 in React 17)
  }, 1000);
}

// If you need a synchronous re-render in React 18:
import { flushSync } from 'react-dom';
function handleClick() {
  flushSync(() => {
    setCount(c => c + 1); // Re-render here
  });
  flushSync(() => {
    setName('Alice');      // Another re-render here
  });
}
```

---

### Q159. Explain useEffect dependency array behavior in detail.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

The dependency array controls when `useEffect` runs. With no array, the effect runs after every render. With an empty array `[]`, it runs only once after the initial render. With specific dependencies `[a, b]`, it runs after any render where `a` or `b` has changed. React uses `Object.is` comparison to check if dependencies changed. If you omit a dependency, the effect may use stale values, leading to bugs. The `exhaustive-deps` ESLint rule helps catch missing dependencies.

#### Code Example / Key Takeaways

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // Runs only when userId changes
  useEffect(() => {
    let cancelled = false;
    fetchUser(userId).then(data => {
      if (!cancelled) setUser(data);
    });
    return () => { cancelled = true; };
  }, [userId]); // <-- dependency array

  // WARNING: Every render (no dependency array)
  useEffect(() => {
    document.title = `User: ${user?.name}`;
  });

  // Runs once on mount (empty dependency array)
  useEffect(() => {
    analytics.track('page_view');
  }, []);

  return <div>{user?.name}</div>;
}
```

---

### Q160. What is the purpose of cleanup functions in useEffect?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Cleanup functions prevent memory leaks, remove event listeners, cancel subscriptions, and abort requests. React runs the cleanup function before the effect re-runs (on dependency change) and when the component unmounts. This lifecycle pattern ensures resources are properly released. Notable use cases include clearing timers, unsubscribing from WebSocket connections, removing DOM event listeners, and aborting fetch requests.

#### Code Example / Key Takeaways

```jsx
function Timer({ interval }) {
  useEffect(() => {
    const id = setInterval(() => {
      console.log('tick');
    }, interval);

    // Cleanup: removes the old interval before creating a new one
    return () => clearInterval(id);
  }, [interval]);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(data => console.log(data));

    // Cleanup: abort in-flight request
    return () => controller.abort();
  }, []);
}
```

---

### Q161. What is the execution order of useEffect cleanup and setup?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

When dependencies change, React follows this order: (1) cleanup of the previous render's effect runs, then (2) the new effect runs. On unmount, only cleanup runs. On mount, only setup runs. Multiple effects in the same component run their cleanups first (in declaration order), then their setups (in declaration order). This means cleanup for all effects happens before any new effect setup.

#### Code Example / Key Takeaways

```jsx
useEffect(() => {
  console.log('Effect 1 setup');
  return () => console.log('Effect 1 cleanup');
}, [dep]);

useEffect(() => {
  console.log('Effect 2 setup');
  return () => console.log('Effect 2 cleanup');
}, [dep]);

// On dep change, output order:
// "Effect 1 cleanup" -> "Effect 2 cleanup" -> "Effect 1 setup" -> "Effect 2 setup"

// On unmount:
// "Effect 1 cleanup" -> "Effect 2 cleanup"
```

---

### Q162. Compare useEffect, useLayoutEffect, and useInsertionEffect.

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

- **useEffect**: Runs asynchronously after the browser paints. Use for most side effects (data fetching, subscriptions, logging). Does not block the visual update.
- **useLayoutEffect**: Runs synchronously after DOM mutations but before the browser paints. Use when you need to read or modify layout (measure DOM elements, position tooltips). Blocks painting, so keep it fast.
- **useInsertionEffect** (React 18): Runs synchronously after DOM mutations but before layout effects. Designed specifically for CSS-in-JS libraries to inject `<style>` tags without causing layout recalculations. Rarely used in application code.

#### Code Example / Key Takeaways

```jsx
// useInsertionEffect - for CSS-in-JS libraries
import { useInsertionEffect } from 'react';
function useStyledComponent(styles) {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    return () => style.remove();
  }, [styles]);
}

// useLayoutEffect - for measuring DOM
function Tooltip({ text, targetRef }) {
  const tooltipRef = useRef(null);
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    const target = targetRef.current;
    if (tooltip && target) {
      const rect = target.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 8}px`;
      tooltip.style.left = `${rect.left}px`;
    }
  }, [text, targetRef]);

  return <div ref={tooltipRef} className="tooltip">{text}</div>;
}

// useEffect - standard side effects
function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
}
```

---

### Q163. When would you actually need useLayoutEffect over useEffect?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

You need `useLayoutEffect` when you must measure or mutate the DOM and need the result before the browser paints. Common scenarios: measuring element dimensions for tooltip positioning, preventing visual flicker when changing styles based on measurements, and synchronizing animations. If you use `useEffect` for these, users may see a brief flash of incorrect layout (FOUC) because the browser paints before your measurement-based style is applied.

#### Code Example / Key Takeaways

```jsx
function Popover({ targetRect, children }) {
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Must use useLayoutEffect to avoid visual flicker
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const { height, width } = popover.getBoundingClientRect();
    setPosition({
      top: targetRect.bottom + 8,
      left: targetRect.left + (targetRect.width - width) / 2,
    });
  }, [targetRect]);

  return (
    <div
      ref={popoverRef}
      style={{ position: 'absolute', top: position.top, left: position.left }}
    >
      {children}
    </div>
  );
}
```

---

### Q164. What problem does useInsertionEffect solve and who should use it?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

`useInsertionEffect` solves a specific problem for CSS-in-JS libraries. When a library injects `<style>` tags at render time, it can cause layout thrashing because the browser must recalculate styles after insertion but before paint. `useInsertionEffect` runs after DOM mutations but before `useLayoutEffect`, letting libraries inject styles before layout measurements happen. Application developers rarely need this directly; it is primarily for library authors.

#### Code Example / Key Takeaways

```jsx
// Typical CSS-in-JS library usage (simplified)
import { useInsertionEffect, useRef } from 'react';

let counter = 0;
function useCSS(styleRules) {
  const styleRef = useRef(null);

  useInsertionEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.dataset.css = `css-${counter++}`;
      style.textContent = styleRules;
      document.head.appendChild(style);
      styleRef.current = style;
    }
  }, [styleRules]);

  useInsertionEffect(() => {
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);
}
```

---

### Q165. Explain useMemo in depth and common misuse patterns.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useMemo` caches a computed value between renders. It only recalculates when its dependencies change, using `Object.is` comparison. Common misuse: memoizing simple calculations that are cheap (adds unnecessary overhead), memoizing primitives that React already handles efficiently, and over-memoizing everything "just in case." `useMemo` is valuable for expensive computations, creating stable references for child components, and preventing unnecessary re-renders of memoized children.

#### Code Example / Key Takeaways

```jsx
function DataGrid({ rows, filter }) {
  // GOOD: Expensive computation worth memoizing
  const filteredRows = useMemo(() => {
    return rows.filter(row =>
      row.name.toLowerCase().includes(filter.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, filter]);

  // BAD: Unnecessary memoization (cheap operation)
  const greeting = useMemo(() => `Hello, ${name}!`, [name]); // Overkill

  // GOOD: Stable reference for child component
  const columnConfig = useMemo(() => ({
    sortable: true,
    resizable: true,
    columns: ['id', 'name', 'email'],
  }), []); // Stable across renders, prevents child re-renders

  return <Grid rows={filteredRows} config={columnConfig} />;
}
```

---

### Q166. Explain useCallback in depth and when it matters.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useCallback` returns a memoized version of a callback function. It only creates a new function when its dependencies change. This is useful when passing callbacks to memoized child components (`React.memo`) to prevent unnecessary re-renders. However, `useCallback` adds overhead; if the child is not memoized or the callback is not passed as a prop, `useCallback` provides no benefit. Modern React patterns increasingly favor `useReducer` or state machines over `useCallback`.

#### Code Example / Key Takeaways

```jsx
// Without useCallback - child re-renders every time
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = () => console.log('clicked'); // New reference each render
  return <MemoizedChild onClick={handleClick} />; // Re-renders every time
}

// With useCallback - child skips re-renders
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []); // Stable reference
  return <MemoizedChild onClick={handleClick} />; // Only re-renders when deps change
}

const MemoizedChild = React.memo(({ onClick }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>Click me</button>;
});
```

---

### Q167. When is useCallback NOT worth using?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Skip `useCallback` when: (1) the child component is not wrapped in `React.memo` and the callback is not used as a dependency elsewhere, (2) the component re-renders rarely, (3) the component tree is shallow so re-render cost is negligible, or (4) you're memoizing a function that is recreated on every render due to unstable dependencies. Premature optimization with `useCallback` adds cognitive overhead and can make code harder to read without measurable performance benefit.

#### Code Example / Key Takeaways

```jsx
// NO NEED for useCallback here - SimpleComponent is not memoized
function Parent() {
  const [count, setCount] = useState(0);

  // This useCallback provides zero benefit
  const onClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <SimpleComponent onClick={onClick} />;
}

function SimpleComponent({ onClick }) {
  return <button onClick={onClick}>Click</button>;
  // Re-renders every time Parent re-renders regardless of callback reference
}
```

---

### Q168. Compare useMemo and useCallback. How are they related internally?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useCallback` is essentially `useMemo` for functions. Internally, `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`. Both use the same dependency comparison mechanism (`Object.is`). The key difference: `useMemo` returns the result of calling a function, while `useCallback` returns the function itself. Use `useMemo` for computed values and `useCallback` for stable function references.

#### Code Example / Key Takeaways

```jsx
// These two are equivalent:
const memoizedFn = useCallback(() => doSomething(a, b), [a, b]);
const memoizedFn = useMemo(() => () => doSomething(a, b), [a, b]);

// Practical difference:
// useMemo - caches the RESULT of a computation
const expensiveResult = useMemo(() => computeExpensive(a, b), [a, b]);

// useCallback - caches the FUNCTION itself
const handleSubmit = useCallback((data) => {
  submitForm(data, a, b);
}, [a, b]);
```

---

### Q169. How does React.memo interact with useMemo and useCallback?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`React.memo` performs a shallow comparison of a component's props to determine if it needs to re-render. Without `useMemo`/`useCallback`, new object references and function references created on each render cause `React.memo` to see "changed" props, defeating the purpose. `useCallback` provides stable function references, and `useMemo` provides stable object references, ensuring `React.memo` correctly skips re-renders when the actual values haven't changed.

#### Code Example / Key Takeaways

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // Without useMemo/useCallback, these create new references each render
  // defeating React.memo on ChildComponent
  const config = useMemo(() => ({ theme: 'dark' }), []);
  const handleClick = useCallback(() => {}, []);

  return (
    <>
      <ChildComponent config={config} onClick={handleClick} />
      <input value={text} onChange={e => setText(e.target.value)} />
    </>
  );
}

const ChildComponent = React.memo(({ config, onClick }) => {
  console.log('Child rendered');
  return <div>{config.theme}</div>;
});
// Without useMemo/useCallback on config/onClick, child re-renders on every Parent render
```

---

### Q170. What is useRef and how does it differ from a regular variable?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

`useRef` returns a mutable `.current` property that persists across renders without triggering re-renders when changed. Unlike a regular variable inside a component (which is re-created on each render), the `.current` value survives. Unlike `useState`, changing `.current` does not cause a re-render. This makes `useRef` ideal for storing DOM references, timers, previous values, and any mutable value that should persist but not drive rendering.

#### Code Example / Key Takeaways

```jsx
function Stopwatch() {
  const intervalRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  const start = () => {
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current); // Access persisted value
    intervalRef.current = null;
  };

  return (
    <div>
      <p>Elapsed: {elapsed}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

---

### Q171. How do you access a DOM element using useRef?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

Pass a `useRef` return value to a component's `ref` prop. After the component mounts, `ref.current` contains the underlying DOM node. This is the primary way to interact with DOM elements directly in React: measuring dimensions, focusing inputs, managing scroll positions, or integrating with non-React libraries. The ref is set after the component renders and DOM is committed.

#### Code Example / Key Takeaways

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus the input on mount
    inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = inputRef.current.value;
    console.log('Searching for:', value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} type="search" placeholder="Search..." />
      <button type="submit">Search</button>
    </form>
  );
}
```

---

### Q172. How can useRef be used to store previous values?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

A common pattern uses `useRef` to store the previous render's value by comparing it in a `useLayoutEffect`. Since ref updates don't trigger re-renders, it's the right tool for tracking "what was the value last time." This is useful for animations that transition between states, logging changes, or conditional logic based on previous vs. current values.

#### Code Example / Key Takeaways

```jsx
function usePrevious(value) {
  const ref = useRef();

  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current; // Returns the value from the PREVIOUS render
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Now: {count}, Before: {prevCount}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

---

### Q173. What is the difference between useRef(null) and useRef(undefined)?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Both create a ref with an initial value. The key difference is semantic: `useRef(null)` explicitly signals "no value yet" and is the conventional choice for DOM refs. `useRef(undefined)` works but is less idiomatic. Neither affects rendering or causes bugs. The `.current` property is mutable regardless of initial value. Use `null` for DOM refs and an appropriate initial value (or `undefined`) for general mutable variables.

#### Code Example / Key Takeaways

```jsx
// DOM ref - always use null
const divRef = useRef(null);

// Mutable variable with meaningful initial value
const timerId = useRef(0);

// Mutable variable without initial value
const previousValue = useRef(); // undefined by default

// Both work identically at runtime
useEffect(() => {
  if (divRef.current) { /* DOM node available */ }
  if (previousValue.current !== undefined) { /* has been set */ }
}, []);
```

---

### Q174. Explain useReducer's dispatch mechanism and how it differs from useState.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useReducer` dispatches action objects to a reducer function that returns the next state. Unlike `useState` where you call `setState` directly, `useReducer` separates "what happened" (action) from "how state changes" (reducer). This makes state transitions explicit, testable, and predictable. The reducer is a pure function receiving `(state, action)` and returning new state. `dispatch` is stable across renders (unlike setState, which is also stable, but the reducer pattern adds structure).

#### Code Example / Key Takeaways

```jsx
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return action.initialState;
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, isSubmitted: true };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.error };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function ContactForm() {
  const [state, dispatch] = useReducer(formReducer, {
    name: '', email: '', isSubmitting: false, isSubmitted: false, error: null,
  });

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      dispatch({ type: 'SUBMIT_START' });
      try {
        await submitForm(state);
        dispatch({ type: 'SUBMIT_SUCCESS' });
      } catch (err) {
        dispatch({ type: 'SUBMIT_ERROR', error: err.message });
      }
    }}>
      <input value={state.name} onChange={e => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })} />
    </form>
  );
}
```

---

### Q175. When should you extract logic into a custom Hook?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Extract a custom Hook when you have: (1) component logic that is duplicated across multiple components, (2) complex stateful logic you want to test or reason about independently, (3) side-effect logic that obscures the component's render output, or (4) when you want to follow the "single responsibility" principle at the component level. A custom Hook is just a function that uses other Hooks; the naming convention (`use*`) signals to React's tooling that it follows Hook rules.

#### Code Example / Key Takeaways

```jsx
// Custom Hook: encapsulates data fetching logic
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { if (!cancelled) { setData(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

// Usage: Component is clean and focused on rendering
function UserList() {
  const { data, loading, error } = useFetch('/api/users');

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

---

### Q176. What are the best practices for naming custom Hooks?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

Always prefix custom Hooks with `use`. This is not just convention; it is required for React's linter to enforce the Rules of Hooks. Use descriptive, verb-based names that indicate what the Hook does: `useFetch`, `useLocalStorage`, `useDebounce`. Avoid generic names like `useHelper` or `useUtils`. A good custom Hook name describes the stateful behavior it encapsulates, not the implementation details.

#### Code Example / Key Takeaways

```jsx
// GOOD: Clear purpose in the name
function useDebounce(value, delay) { /* ... */ }
function useMediaQuery(query) { /* ... */ }
function useIntersectionObserver(options) { /* ... */ }
function useLocalStorage(key, initialValue) { /* ... */ }

// BAD: Vague names
function useThing() { /* ... */ }
function useHelper() { /* ... */ }
function useData() { /* ... */ }
```

---

### Q177. Can custom Hooks return anything? What are the conventions?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

Custom Hooks can return any value: primitives, objects, arrays, functions, or combinations. Common conventions: return an array for simple state + setter pairs (mimicking `useState`), return an object when exposing multiple named values, and return a function when the Hook encapsulates an action. The caller decides the naming via destructuring. The Hook's return shape should be documented through consistent, predictable patterns.

#### Code Example / Key Takeaways

```jsx
// Array return - allows custom naming via destructuring (like useState)
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}
const [isOpen, toggleOpen] = useToggle(false);

// Object return - named properties
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return { matches, matchesExplicitly: matches };
}
const { matches: isMobile } = useMediaQuery('(max-width: 768px)');
```

---

### Q178. How do you handle side effects with cleanup in a custom Hook?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Custom Hooks follow the same cleanup pattern as built-in Hooks. Return a cleanup function from `useEffect` inside the custom Hook. The cleanup runs when dependencies change or the component unmounts. Always handle cancellation, cleanup, and resource release in custom Hooks that manage subscriptions, timers, event listeners, or async operations to prevent memory leaks in consuming components.

#### Code Example / Key Takeaways

```jsx
function useEventListener(eventName, handler, element = window) {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    const listener = (event) => savedHandler.current(event);
    element.addEventListener(eventName, listener);
    return () => element.removeEventListener(eventName, listener);
  }, [eventName, element]);
}

// Usage
function Component() {
  useEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  return <div>Press Escape to close</div>;
}
```

---

### Q179. What are common pitfalls when creating custom Hooks?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Common pitfalls include: (1) calling Hooks conditionally inside the custom Hook, (2) not handling cleanup (memory leaks), (3) creating stable identity issues by returning new object/array references on every render, (4) tightly coupling the Hook to specific props rather than accepting flexible parameters, (5) forgetting that the Hook's state is per-component-instance (not shared), and (6) over-abstracting simple logic into a Hook when a utility function suffices.

#### Code Example / Key Takeaways

```jsx
// PITFALL: Returns new reference every render
function useUserData(userId) {
  const [user, setUser] = useState(null);
  // BAD: Creates new object every render
  return { user, setUser };
  // GOOD: Memoize the return value if consumers depend on reference equality
}

// PITFALL: Not handling cleanup
function useInterval(callback, delay) {
  useEffect(() => {
    // BAD: No cleanup - interval leaks
    setInterval(callback, delay);
  }, [callback, delay]);
}

// CORRECT: Cleanup handled
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

---

### Q180. Explain useContext and its performance implications.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useContext` reads the nearest context value from the component tree. The problem: when a context value changes, every component that calls `useContext` for that context re-renders, even if the component only uses part of the value. This is the "context tearing" or "context consumer re-render" problem. Solutions include: splitting contexts by update frequency, memoizing context values in the provider, and using composition to reduce context scope.

#### Code Example / Key Takeaways

```jsx
// PROBLEM: All consumers re-render when ANY value changes
const AppContext = React.createContext();

function AppProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [locale, setLocale] = useState('en');

  // Every context consumer re-renders when any value changes
  return (
    <AppContext.Provider value={{ theme, setTheme, user, setUser, locale, setLocale }}>
      {children}
    </AppContext.Provider>
  );
}

// BETTER: Split into separate contexts
const ThemeContext = React.createContext();
const UserContext = React.createContext();
const LocaleContext = React.createContext();

function AppProvider({ children }) {
  return (
    <ThemeContext.Provider value={useMemo(() => ({ theme, setTheme }), [theme])}>
      <UserContext.Provider value={useMemo(() => ({ user, setUser }), [user])}>
        <LocaleContext.Provider value={useMemo(() => ({ locale, setLocale }), [locale])}>
          {children}
        </LocaleContext.Provider>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}
```

---

### Q181. How can you optimize context performance in React?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Several strategies: (1) Split contexts by update frequency so theme changes don't re-render user-dependent components. (2) Memoize the context value in the provider using `useMemo` to prevent unnecessary re-renders. (3) Move state down and use composition to limit how many components need context. (4) Use state management libraries (Zustand, Jotai) that provide fine-grained subscriptions. (5) Use the "selector" pattern with `useSyncExternalStore` or libraries like `use-context-selector`.

#### Code Example / Key Takeaways

```jsx
// Strategy 1: Memoized context value
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Strategy 2: Split by update frequency
// ThemeContext (rarely changes) vs RealTimeContext (changes frequently)

// Strategy 3: Move state down
function App() {
  return (
    <Header /> {/* Does not need theme context */}
    <main>
      <ThemeProvider>
        <Dashboard /> {/* Needs theme context - scoped here */}
      </ThemeProvider>
    </main>
  );
}
```

---

### Q182. What is the Context Provider pattern and how does it relate to useContext?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

The Provider pattern wraps a subtree of components with a context provider that supplies a value. Any descendant component can access that value via `useContext`. The Provider's value prop is what consumers receive. Providers can be nested, and inner providers override outer ones for the same context. This creates a natural dependency injection system in React without prop drilling.

#### Code Example / Key Takeaways

```jsx
const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback(async (credentials) => {
    const userData = await api.login(credentials);
    setUser(userData);
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Nested override example
function AdminSection() {
  return (
    <AuthProvider> {/* Overrides parent AuthContext */}
      <AdminDashboard />
    </AuthProvider>
  );
}
```

---

### Q183. Explain useImperativeHandle and its use cases.

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

`useImperativeHandle` customizes the instance value exposed when a parent component uses `ref` to access a child component. Instead of exposing the entire DOM node, you expose only specific methods and properties. This follows the principle of minimal exposure and is useful for components that need to provide a programmatic API: form validation, focus management, animation controls. Always pair with `forwardRef`.

#### Code Example / Key Takeaways

```jsx
const FancyInput = forwardRef(function FancyInput({ placeholder }, ref) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { setValue(''); inputRef.current.value = ''; },
    getValue: () => value,
  }), [value]); // Recreate when value changes

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => setValue(e.target.value)}
      placeholder={placeholder}
    />
  );
});

// Parent component
function Parent() {
  const inputRef = useRef();

  return (
    <>
      <FancyInput ref={inputRef} placeholder="Type here" />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
      <button onClick={() => inputRef.current.clear()}>Clear</button>
    </>
  );
}
```

---

### Q184. How does forwardRef work and why is it needed with useImperativeHandle?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

By default, function components don't receive `ref` as a prop. `forwardRef` creates a component that accepts a `ref` parameter and forwards it to a child element. `useImperativeHandle` needs access to the ref to customize what `.current` resolves to. Without `forwardRef`, you can't pass the ref into the component for `useImperativeHandle` to intercept. Note: React 19 eliminates the need for `forwardRef` as `ref` becomes a regular prop.

#### Code Example / Key Takeaways

```jsx
// React 18 pattern: forwardRef required
const TextInput = forwardRef(function TextInput(props, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
  }));

  return <input ref={inputRef} {...props} />;
});

// React 19 pattern: ref is a regular prop
function TextInput({ ref, ...props }) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
  }));

  return <input ref={inputRef} {...props} />;
}
```

---

### Q185. What is useId and when should you use it?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

`useId` generates a unique, stable ID that works consistently between server and client rendering (hydration-safe). It solves the problem of generating unique IDs for accessibility attributes (`htmlFor`, `aria-labelledby`, `aria-describedby`) and form elements. Before `useId`, developers used random IDs or libraries, which caused hydration mismatches in SSR. `useId` returns the same ID on both server and client.

#### Code Example / Key Takeaways

```jsx
function FormField({ label }) {
  const id = useId(); // Unique per component instance, consistent SSR/CSR

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" aria-describedby={`${id}-help`} />
      <span id={`${id}-help`}>Enter your {label.toLowerCase()}</span>
    </div>
  );
}

// Generates IDs like ":r1:", ":r2:", etc.
// Same ID on server and client for hydration safety
```

---

### Q186. What is the difference between useId and a random ID generator?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useId` produces the same ID on server and client, which is essential for hydration. Random generators (`Math.random()`, `uuid`) produce different values on server vs. client, causing hydration mismatches that React warns about and can lead to subtle bugs. `useId` is also React-aware: it generates IDs that don't collide with other `useId` calls in the same render, even across different components.

#### Code Example / Key Takeaways

```jsx
// PROBLEM: Random IDs cause hydration mismatch
function BadField() {
  const id = Math.random().toString(36).substr(2, 9); // Different on server vs client
  return <input id={id} />;
}

// CORRECT: useId is hydration-safe
function GoodField() {
  const id = useId(); // Same value on server and client
  return <input id={id} />;
}

// Can generate multiple related IDs
function GoodField() {
  const id = useId();
  return (
    <>
      <input id={id} aria-describedby={`${id}-error`} />
      <span id={`${id}-error`}>Error message</span>
    </>
  );
}
```

---

### Q187. Can useId be used for list keys? Why or why not?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

No. `useId` should not be used for list keys. Keys should identify list items based on their data (like a database ID), not their position or a generated ID. `useId` generates the same ID for the same component across renders, but it doesn't represent item identity. Using it as a key would cause React to reuse component instances incorrectly when list items reorder, are added, or removed.

#### Code Example / Key Takeaways

```jsx
// WRONG: useId for keys
function BadList({ items }) {
  return items.map(item => {
    const id = useId(); // VIOLATION: Hook called in a loop!
    return <li key={id}>{item.name}</li>;
  });
}

// CORRECT: Use data-based keys
function GoodList({ items }) {
  return items.map(item => (
    <li key={item.id}>{item.name}</li> // Use the item's own ID
  ));
}
```

---

### Q188. Explain useTransition and its benefits for UX.

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

`useTransition` lets you mark state updates as non-urgent transitions, keeping the UI responsive during expensive re-renders. It returns a `startTransition` function and an `isPending` boolean. Inside `startTransition`, React can interrupt the update to handle urgent interactions (typing, clicking). This prevents janky UI when switching between expensive views or filtering large lists.

#### Code Example / Key Takeaways

```jsx
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value); // Urgent: update input immediately

    startTransition(() => {
      setResults(filterLargeList(value)); // Non-urgent: can be interrupted
    });
  };

  return (
    <div>
      <input value={query} onChange={handleSearch} />
      {isPending && <Spinner />}
      <ResultList results={results} />
    </div>
  );
}

function filterLargeList(query) {
  // Expensive computation - won't block input
  return hugeList.filter(item => item.name.includes(query));
}
```

---

### Q189. Explain useDeferredValue and how it differs from useTransition.

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

`useDeferredValue` defers updating a derived value, showing a stale version while the new value is being computed. Unlike `useTransition` (which wraps a state update), `useDeferredValue` takes a value and returns a deferred version of it. It is useful when you can't control the state update (e.g., a prop from a parent). `useTransition` requires a synchronous callback; `useDeferredValue` works with any value source.

#### Code Example / Key Takeaways

```jsx
// useDeferredValue: defers a derived value
function SearchPage({ query }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      <ResultList query={deferredQuery} />
    </div>
  );
}

// useTransition: wraps a state update
function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const selectTab = (nextTab) => {
    startTransition(() => {
      setTab(nextTab);
    });
  };

  return (
    <div>
      <TabBar onSelect={selectTab} />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <TabContent tab={tab} />
      </div>
    </div>
  );
}
```

---

### Q190. What are the prerequisites for using useTransition and useDeferredValue?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Both features require React 18+ and the concurrent rendering mode, which is enabled by default with `createRoot` (the new client root API). If you're using the legacy `ReactDOM.render()`, concurrent features are not available. Both work best with components that have expensive rendering paths. They are not magic performance boosters; they only help when React can interrupt and prioritize rendering work.

#### Code Example / Key Takeaways

```jsx
// Old way: No concurrent features
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// New way: Concurrent features enabled
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Now useTransition and useDeferredValue work
function App() {
  const [isPending, startTransition] = useTransition();
  const deferredValue = useDeferredValue(someValue);
  return <div>{/* ... */}</div>;
}
```

---

### Q191. How does batching work differently inside startTransition?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Inside `startTransition`, all state updates are batched into a single render, and the transition can be interrupted by urgent updates. This is different from React 18's automatic batching, which batches updates but doesn't provide interruption semantics. Transitions are deprioritized, so typing or clicking handlers can update the UI immediately while the transition processes in the background. This is what makes the UI feel responsive during expensive updates.

#### Code Example / Key Takeaways

```jsx
function Tabs() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const onTabSelect = (nextTab) => {
    startTransition(() => {
      // These updates are batched and deprioritized
      setTab(nextTab);
      setFilter(null);
      setSortBy('date');
    });
    // Urgent updates (like hover effects) still process immediately
  };

  return (
    <div>
      <TabBar onSelect={onTabSelect} />
      {isPending ? <LoadingSkeleton /> : <TabContent tab={tab} />}
    </div>
  );
}
```

---

### Q192. Can you nest multiple useTransition calls?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Yes, you can call `useTransition` in multiple components, and each creates its own independent transition. Each component's `isPending` tracks only its own transition's state. However, nested transitions interact: an outer transition can be interrupted by an inner urgent update. This is fine and is by design; transitions form a priority hierarchy.

#### Code Example / Key Takeaways

```jsx
function Parent() {
  const [isPending: parentPending, startTransition: startParent] = useTransition();

  return (
    <div>
      {parentPending && <GlobalSpinner />}
      <ChildA />
      <ChildB />
    </div>
  );
}

function ChildA() {
  const [isPending: childPending, startTransition: startChild] = useTransition();

  return (
    <section style={{ opacity: childPending ? 0.5 : 1 }}>
      <button onClick={() => startChild(() => updateDataA())}>
        Update A
      </button>
    </section>
  );
}
```

---

### Q193. Explain the concept of Suspense-compatible Hooks.

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

React's `use()` hook (React 19) reads a resource (Promise or Context) and can suspend rendering while waiting. This integrates with Suspense boundaries, enabling declarative loading states. Unlike `useEffect` + `useState` for data fetching, `use()` suspends the component tree at the Suspense boundary level, enabling streaming and selective hydration. This is the future of data fetching in React.

#### Code Example / Key Takeaways

```jsx
// React 19: use() for data fetching with Suspense
function UserProfile({ userId }) {
  const user = use(fetchUser(userId)); // Suspends until resolved
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile userId={1} />
    </Suspense>
  );
}

// The entire UserProfile tree is replaced with Spinner
// until fetchUser resolves - no loading states inside component
```

---

### Q194. How does useSyncExternalStore solve the external store problem?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

`useSyncExternalStore` subscribes to an external store and ensures the UI stays consistent with the store's state. It solves tearing issues that occurred in concurrent mode when different components read different versions of an external store during a concurrent render. The three arguments are: `subscribe` (function to listen for changes), `getSnapshot` (function to read current state), and `getServerSnapshot` (for SSR).

#### Code Example / Key Takeaways

```jsx
function useWindowSize() {
  return useSyncExternalStore(
    // Subscribe
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    // Get current snapshot
    () => ({ width: window.innerWidth, height: window.innerHeight }),
    // Server snapshot
    () => ({ width: 0, height: 0 }),
  );
}

// Using a store like Zustand/Redux
function useStore(selector) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
  );
}
```

---

### Q195. What is the difference between useEffect and useLayoutEffect in terms of timing?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

The timing difference is critical. `useLayoutEffect` fires synchronously after all DOM mutations but before the browser paints. `useEffect` fires asynchronously after the browser paints. This means `useLayoutEffect` can read/modify DOM without causing a visible flash, while `useEffect` might show a brief visual artifact if you're measuring or styling based on DOM state. Use `useLayoutEffect` sparingly since it blocks painting.

#### Code Example / Key Takeaways

```jsx
// useLayoutEffect: Blocks paint
function Measure() {
  const [height, setHeight] = useState(0);
  const ref = useRef(null);

  useLayoutEffect(() => {
    // This runs BEFORE the browser paints
    // User never sees height=0
    setHeight(ref.current.getBoundingClientRect().height);
  }, []);

  return <div ref={ref}>Measured content: {height}px</div>;
}

// useEffect: After paint
function MeasureAfterPaint() {
  const [height, setHeight] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    // User may briefly see height=0 before this runs
    setHeight(ref.current.getBoundingClientRect().height);
  }, []);

  return <div ref={ref}>Measured content: {height}px</div>;
}
```

---

### Q196. What is the "stale closure" problem and how do Hooks relate to it?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

A stale closure occurs when a function captures outdated variable values from a previous render. In React, event handlers and effects capture the state and props from the render when they were created. If the component re-renders with new state but the handler still references old state, you get a stale closure bug. This is common with `setTimeout`, `setInterval`, and async callbacks that reference state.

#### Code Example / Key Takeaways

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // STALE CLOSURE: count is always 0
  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // Always logs 0!
      setCount(count + 1); // Always sets to 1!
    }, 1000);
    return () => clearInterval(id);
  }, []); // Empty deps: effect never re-creates

  // FIXED: Use functional update
  useEffect(() => {
    const id = setInterval(() => {
      setCount(prev => prev + 1); // Always uses latest state
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{count}</p>;
}
```

---

### Q197. How do you debug stale closure issues?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Debugging stale closures: (1) Add the dependency to the dependency array so the effect re-creates with fresh values, (2) Use functional state updates (`setState(prev => ...)`), (3) Use a ref to store the latest value (`useRef`), (4) Use the React DevTools Profiler to see how often effects re-run, (5) The ESLint `exhaustive-deps` rule catches many stale closure issues at lint time.

#### Code Example / Key Takeaways

```jsx
function SearchBox({ onSearch }) {
  const [query, setQuery] = useState('');

  // Solution 1: Add dependency
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query); // Fresh query
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]); // Re-create when query or onSearch changes

  // Solution 2: Use ref for latest value
  const latestQuery = useRef(query);
  latestQuery.current = query;

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(latestQuery.current); // Always current
    }, 300);
    return () => clearTimeout(timer);
  }, [onSearch]); // Only re-create when onSearch changes

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

---

### Q198. Explain the dependency array comparison mechanism (Object.is).

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

React uses `Object.is` to compare each dependency value with its previous value. `Object.is` behaves like `===` except for `NaN` (they are equal) and `+0 !== -0`. This means: primitives are compared by value, but objects and arrays are compared by reference. A new `{}` or `[]` created in the parent will always be "different," causing the effect to re-run. This is why you should not create objects or arrays in the dependency array or as inline values passed to `useMemo`/`useCallback`.

#### Code Example / Key Takeaways

```jsx
function Component({ config }) {
  // Object.is({ theme: 'dark' }, { theme: 'dark' }) === false
  // New object created every render = effect always re-runs

  // BAD: Inline object in deps
  useEffect(() => {
    applyTheme(config);
  }, [{ theme: config.theme }]); // New array every render!

  // GOOD: Use primitive values
  useEffect(() => {
    applyTheme(config);
  }, [config.theme]); // String comparison, stable

  // GOOD: Memoize objects in parent
  // Parent:
  const config = useMemo(() => ({ theme: theme }), [theme]);
  useEffect(() => {
    applyTheme(config);
  }, [config]); // Reference comparison, stable when theme unchanged
}
```

---

### Q199. What are the best practices for managing dependency arrays?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Best practices: (1) Always include the `exhaustive-deps` ESLint rule, (2) Use primitive values as dependencies when possible, (3) Memoize objects and functions that appear in dependency arrays, (4) Don't suppress lint warnings with `// eslint-disable` unless absolutely necessary, (5) If an effect needs to run only once, use empty `[]` but ensure the effect doesn't depend on mutable values, (6) Split complex effects so each has minimal, accurate dependencies.

#### Code Example / Key Takeaways

```jsx
// GOOD: Minimal, correct dependencies
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.join();
    return () => conn.leave();
  }, [roomId]); // Only roomId matters for connection

  useEffect(() => {
    document.body.className = theme;
  }, [theme]); // Only theme matters for styling
}

// BAD: Over-broad dependencies
useEffect(() => {
  doSomething(roomId, theme);
}, [roomId, theme]); // Effect re-runs on theme change even though roomId logic is unaffected
// Better: Split into two effects
```

---

### Q200. What is the useRef pattern for avoiding stale closures?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

When you need the latest value of a prop or state inside an effect or callback without re-creating the effect, store it in a ref. The ref's `.current` always reflects the latest value because refs are mutable objects, not captured in closures. This breaks the stale closure pattern while keeping the effect's identity stable.

#### Code Example / Key Takeaways

```jsx
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Always keep the ref up to date
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Stable effect: only re-creates when delay changes
  useEffect(() => {
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Usage
function Counter() {
  const [count, setCount] = useState(0);
  useInterval(() => setCount(c => c + 1), 1000);
  return <h1>{count}</h1>;
}
```

---

### Q201. How do you create a custom Hook that works with both SSR and client rendering?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

For SSR compatibility, your custom Hook must handle the case where browser APIs are unavailable. Check `typeof window !== 'undefined'` before accessing browser APIs, provide server-safe defaults, and use `useSyncExternalStore`'s `getServerSnapshot` parameter for stores. Hooks that depend on `window`, `document`, or `localStorage` need SSR guards.

#### Code Example / Key Takeaways

```jsx
function useMediaQuery(query) {
  const getSnapshot = () => window.matchMedia(query).matches;

  const getServerSnapshot = () => false; // Default for SSR

  const subscribe = (callback) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue; // SSR guard
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    }
  };

  return [storedValue, setValue];
}
```

---

### Q202. Explain how React.memo, useMemo, and useCallback work together for performance optimization.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

These three tools form the "memoization trinity" in React: `React.memo` prevents component re-renders when props haven't changed (shallow comparison), `useMemo` prevents expensive computations from re-running, and `useCallback` prevents function references from changing. They work together: `useCallback` and `useMemo` stabilize references that `React.memo` then correctly identifies as unchanged, skipping the re-render. Without the memoized references, `React.memo` sees new objects/functions and re-renders anyway.

#### Code Example / Key Takeaways

```jsx
// Complete optimization pattern
function ProductList({ products, onSort }) {
  const [sortBy, setSortBy] = useState('name');

  // Memoize expensive computation
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a[sortBy].localeCompare(b[sortBy])),
    [products, sortBy]
  );

  // Memoize callback for child
  const handleProductClick = useCallback((productId) => {
    console.log('Clicked:', productId);
  }, []);

  return (
    <div>
      {sortedProducts.map(product => (
        // ProductCard only re-renders when its specific props change
        <ProductCard
          key={product.id}
          product={product}
          onClick={handleProductClick}
        />
      ))}
    </div>
  );
}

const ProductCard = React.memo(({ product, onClick }) => (
  <div onClick={() => onClick(product.id)}>{product.name}</div>
));
```

---

### Q203. What is the useEffect cleanup race condition and how do you prevent it?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

A race condition occurs in `useEffect` when an async operation completes after a newer request has started. For example, if you fetch data for userId=1, then quickly change to userId=2, the first request might complete after the second, overwriting the correct data. Prevent it using an AbortController to cancel the previous request, or a boolean flag to ignore stale responses.

#### Code Example / Key Takeaways

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setUser(data); // Ignore if stale
      })
      .catch(err => {
        if (err.name !== 'AbortError' && !cancelled) {
          console.error(err);
        }
      });

    return () => {
      cancelled = true;     // Flag to ignore stale response
      controller.abort();   // Cancel in-flight request
    };
  }, [userId]);

  return user ? <div>{user.name}</div> : <Spinner />;
}
```

---

### Q204. How does the React Hook rules linter enforce correctness?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

The `eslint-plugin-react-hooks` enforces two rules: `rules-of-hooks` (ensures Hooks are only called at the top level of components/custom Hooks, never inside conditions, loops, or nested functions) and `exhaustive-deps` (ensures dependency arrays are complete and correct). The plugin performs static analysis of your code at lint time, catching Hook violations before they cause runtime bugs. Both rules are considered essential for any React project.

#### Code Example / Key Takeaways

```jsx
// rules-of-hooks violation (lint error)
function Component({ flag }) {
  if (flag) {
    useEffect(() => {}, []); // ESLint: "Hook called conditionally"
  }
}

// exhaustive-deps violation (lint warning)
function Component({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // ESLint warning: "userId missing from dependency array"
}
```

---

### Q205. Explain the useState functional update pattern and when to use it.

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

The functional update pattern `setState(prev => newValue)` passes the most recent state to a function that computes the next state. Use it when: (1) new state depends on previous state, (2) you're updating state inside a `setTimeout`, `setInterval`, or async callback, (3) multiple `setState` calls need to see the latest value, or (4) you want to avoid including state in dependency arrays of callbacks.

#### Code Example / Key Takeaways

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // Functional update: always uses latest state
  const increment = () => setCount(prev => prev + 1);

  // Multiple updates: each sees latest
  const triple = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // Final count: prevCount + 3
  };

  // Inside async callback
  const incrementAsync = () => {
    setTimeout(() => {
      setCount(prev => prev + 1); // Correct: uses latest state
    }, 1000);
  };

  return <button onClick={triple}>{count}</button>;
}
```

---

### Q206. What is the recommended pattern for complex state with useReducer?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

For complex state, use the "state machine" pattern with useReducer: define all possible states and transitions explicitly, use an enum-like object for action types, keep the reducer pure (no side effects), and separate side effects from state transitions using middleware patterns (like thunks). This makes state transitions predictable, testable, and debuggable.

#### Code Example / Key Takeaways

```jsx
const ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  RETRY: 'RETRY',
};

function asyncReducer(state, action) {
  switch (action.type) {
    case ACTIONS.FETCH_START:
      return { ...state, status: 'loading', error: null };
    case ACTIONS.FETCH_SUCCESS:
      return { ...state, status: 'success', data: action.payload, error: null };
    case ACTIONS.FETCH_ERROR:
      return { ...state, status: 'error', error: action.payload };
    case ACTIONS.RETRY:
      return { ...state, status: 'idle' };
    default:
      throw new Error(`Unhandled action: ${action.type}`);
  }
}

function useAsync(asyncFn, deps) {
  const [state, dispatch] = useReducer(asyncReducer, {
    status: 'idle', data: null, error: null,
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: ACTIONS.FETCH_START });

    asyncFn()
      .then(data => { if (!cancelled) dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: data }); })
      .catch(err => { if (!cancelled) dispatch({ type: ACTIONS.FETCH_ERROR, payload: err }); });

    return () => { cancelled = true; };
  }, deps);

  const retry = () => dispatch({ type: ACTIONS.RETRY });

  return { ...state, retry };
}
```

---

### Q207. How do you share state between sibling components using custom Hooks?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Custom Hooks can share state between siblings by having both components call the same custom Hook with the same arguments, but since each call creates independent state, true sharing requires lifting state up or using context. A pattern for shared state is to create a Hook that reads from a shared store (like Zustand) or use context with a custom Hook as the consumer interface.

#### Code Example / Key Takeaways

```jsx
// Pattern 1: Lift state to common ancestor, pass via custom Hook
function useSharedCounter() {
  // This only works if called within the same component
  const [count, setCount] = useState(0);
  return { count, increment: () => setCount(c => c + 1) };
}

// Pattern 2: Share via context + custom Hook
const CounterContext = createContext();

function CounterProvider({ children }) {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({
    count,
    increment: () => setCount(c => c + 1),
  }), [count]);
  return <CounterContext.Provider value={value}>{children}</CounterContext.Provider>;
}

function useCounter() {
  const context = useContext(CounterContext);
  if (!context) throw new Error('useCounter must be used within CounterProvider');
  return context;
}

// Both components share the same state
function Display() {
  const { count } = useCounter();
  return <span>{count}</span>;
}

function Button() {
  const { increment } = useCounter();
  return <button onClick={increment}>+1</button>;
}
```

---

### Q208. What is the useLayoutEffect measurement pattern and why does it matter?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

The measurement pattern uses `useLayoutEffect` to read DOM measurements (height, width, position) and immediately apply corrective styles before the browser paints. This prevents layout shifts and visual flicker. It is essential for features like tooltips, popovers, dropdown menus, and responsive layouts where you need to know an element's rendered dimensions before positioning another element.

#### Code Example / Key Takeaways

```jsx
function AutoResizeTextarea({ value, onChange }) {
  const textareaRef = useRef(null);
  const [height, setHeight] = useState('auto');

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    // Reset to measure natural height
    textarea.style.height = 'auto';
    const newHeight = textarea.scrollHeight;
    textarea.style.height = `${newHeight}px`;
    setHeight(newHeight);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      style={{ height, overflow: 'hidden' }}
    />
  );
}
```

---

### Q209. How do you test custom Hooks?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Use `@testing-library/react-hooks` (or `renderHook` from `@testing-library/react` v13+). `renderHook` wraps a Hook call in a test component, providing `result.current` for assertions and `rerender` to simulate re-renders with new props. For Hooks with side effects, use `act()` to flush pending state updates. Mock external dependencies (APIs, browser APIs) using `jest.mock` or `msw`.

#### Code Example / Key Takeaways

```jsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => result.current.increment());
    expect(result.current.count).toBe(1);

    act(() => result.current.increment());
    expect(result.current.count).toBe(2);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => result.current.increment());
    act(() => result.current.reset());
    expect(result.current.count).toBe(10);
  });

  it('responds to prop changes', () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) => useCounter(initialValue),
      { initialProps: { initialValue: 0 } }
    );

    rerender({ initialValue: 5 });
    expect(result.current.count).toBe(5);
  });
});
```

---

### Q210. What is the useSyncExternalStore anti-pattern and how to avoid it?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Anti-patterns with `useSyncExternalStore`: (1) Creating `subscribe` and `getSnapshot` inline on every render (causes re-subscription), (2) Not handling the case where the store is not yet available (SSR), (3) Using it for local component state (just use `useState`), (4) Not returning a stable function reference from `subscribe`. Always memoize or define these functions outside the component to avoid unnecessary re-subscriptions.

#### Code Example / Key Takeaways

```jsx
// BAD: Creates new functions every render
function useStore(store) {
  return useSyncExternalStore(
    (callback) => store.subscribe(callback), // New function each render!
    () => store.getState(),                  // New function each render!
  );
}

// CORRECT: Stable function references
function createSubscription(store) {
  return (callback) => {
    store.subscribe(callback);
    return () => store.unsubscribe(callback);
  };
}

const subscribe = createSubscription(store);
const getSnapshot = () => store.getState();

function MyComponent() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return <div>{state.value}</div>;
}
```

---

### Q211. How does useInsertionEffect prevent style recalculation thrashing?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Without `useInsertionEffect`, CSS-in-JS libraries inject `<style>` tags during render (before commit) or in `useLayoutEffect` (after layout). Injecting before commit causes React to see stale styles. Injecting in `useLayoutEffect` means styles are inserted after layout measurement, causing a layout recalculation. `useInsertionEffect` runs after DOM mutation but before layout effects, allowing styles to be injected before layout is measured, eliminating the extra recalculation pass.

#### Code Example / Key Takeaways

```jsx
// Timeline of a render with style injection:
// 1. Render phase (virtual DOM diff)
// 2. Commit phase (DOM mutations)
// 3. useInsertionEffect runs <-- Style injection here
// 4. useLayoutEffect runs <-- Layout measurement here (sees correct styles)
// 5. Browser paints

// Without useInsertionEffect (in useLayoutEffect):
// 1-2. Same
// 3. useLayoutEffect: measures layout (STALE styles)
// 4. Injects styles
// 5. Layout recalculates (WASTED WORK)
// 6. Browser paints
```

---

### Q212. Explain the concept of "effect as synchronization" in React.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

React's `useEffect` documentation describes effects as synchronizing a component with an external system. Rather than thinking of effects as lifecycle methods (componentDidMount, componentDidUpdate, componentWillUnmount), think of them as keeping the component in sync with external state (APIs, subscriptions, DOM). Each effect synchronizes with a specific external system and cleans up when that synchronization is no longer needed.

#### Code Example / Key Takeaways

```jsx
// NOT this (lifecycle thinking):
useEffect(() => {
  // componentDidMount
  const conn = connect(roomId);
  // componentDidUpdate (need to check if roomId changed)
  // componentWillUnmount
  return () => conn.disconnect();
}, [roomId]);

// THIS (synchronization thinking):
useEffect(() => {
  // Synchronize with the chat server for this roomId
  const conn = createConnection(roomId);
  conn.connect();
  // Stop synchronizing (cleanup)
  return () => {
    conn.disconnect();
  };
}, [roomId]); // Re-synchronize when roomId changes
```

---

### Q213. What are the common performance anti-patterns with Hooks?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Common anti-patterns: (1) Memoizing everything without profiling first, (2) Creating objects/arrays inline as `useMemo` dependencies, (3) Using `useCallback` when children aren't memoized, (4) Calling expensive computations inside the render body instead of `useMemo`, (5) Using `useEffect` for derived state (should compute during render), (6) Not splitting context by update frequency, (7) Using `useState` for values that could be derived from other state.

#### Code Example / Key Takeaways

```jsx
// ANTI-PATTERN: useEffect for derived state
function FilteredList({ items, filter }) {
  const [filtered, setFiltered] = useState([]);
  useEffect(() => {
    setFiltered(items.filter(i => i.name.includes(filter))); // Unnecessary
  }, [items, filter]);
  return <List items={filtered} />;
}

// CORRECT: Compute during render
function FilteredList({ items, filter }) {
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter]
  );
  return <List items={filtered} />;
}

// ANTI-PATTERN: Inline object as dependency
useEffect(() => {}, [{ a, b }]); // New array every render!

// CORRECT: Use primitives
useEffect(() => {}, [a, b]); // Value comparison, stable
```

---

### Q214. How do you handle form state with useReducer?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useReducer` excels at managing form state because forms have multiple interdependent fields, validation states, and submission states. The reducer centralizes all form logic: field changes, validation, submission, and reset. Each action type represents a specific form event, making the flow easy to follow and test. This pattern scales better than multiple `useState` calls for complex forms.

#### Code Example / Key Takeaways

```jsx
function useForm(initialValues, validate, onSubmit) {
  const [state, dispatch] = useReducer(formReducer, {
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isSubmitted: false,
  });

  function handleChange(field, value) {
    dispatch({ type: 'SET_FIELD', field, value });
  }

  function handleBlur(field) {
    dispatch({ type: 'SET_TOUCHED', field });
    const errors = validate(state.values);
    dispatch({ type: 'SET_ERRORS', errors });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(state.values);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors });
      return;
    }
    dispatch({ type: 'SUBMIT_START' });
    try {
      await onSubmit(state.values);
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', error: err.message });
    }
  }

  function reset() {
    dispatch({ type: 'RESET', initialValues });
  }

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}
```

---

### Q215. Explain the relationship between useEffect and component lifecycle.

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

While `useEffect` maps conceptually to lifecycle methods, it's more accurately described as synchronization. `useEffect` with `[]` is similar to `componentDidMount`, `useEffect` with dependencies is similar to `componentDidUpdate`, and the cleanup function is similar to `componentWillUnmount`. However, thinking in terms of synchronization is more accurate: effects synchronize with external systems and re-synchronize when dependencies change.

#### Code Example / Key Takeaways

```jsx
// Lifecycle mapping (for reference, not recommended mental model)
function Component({ userId }) {
  // componentDidMount equivalent
  useEffect(() => {
    logMount();
  }, []);

  // componentDidUpdate equivalent (for userId)
  useEffect(() => {
    analytics.track('user_changed', userId);
  }, [userId]);

  // componentWillUnmount equivalent
  useEffect(() => {
    const subscription = subscribe(userId);
    return () => subscription.unsubscribe(); // Cleanup
  }, [userId]);

  // All three in one: mount + update + unmount
  useEffect(() => {
    analytics.track('view', userId);
    return () => analytics.track('unview', userId);
  }, [userId]);
}
```

---

### Q216. What happens if you have multiple useEffect calls in one component?

**Difficulty:** `Basic`
**Category:** React Hooks Deep Dive

#### Answer

Multiple `useEffect` calls are independent and run in declaration order. Each effect handles its own synchronization. This is actually a feature: it allows you to separate concerns, with each effect managing a single external system. Cleanup functions from all effects run in reverse declaration order before the component unmounts or before effects re-run.

#### Code Example / Key Takeaways

```jsx
function ChatRoom({ roomId, theme }) {
  // Effect 1: Connection management
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);

  // Effect 2: Document title
  useEffect(() => {
    document.title = `Chat - Room ${roomId}`;
  }, [roomId]);

  // Effect 3: Theme application
  useEffect(() => {
    document.body.className = theme;
    return () => { document.body.className = ''; };
  }, [theme]);

  // All three are independent, run in order, clean up independently
}
```

---

### Q217. How do you handle errors inside useEffect?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useEffect` callbacks can't use try/catch with async/await directly because the cleanup function can't be an async function. Solutions: (1) Use `.catch()` on promises, (2) Wrap the async logic in an async function called from the effect, (3) Use error boundaries (React 18+) with the `onError` callback, (4) For fetch errors, check `response.ok` and throw. Always handle both network errors and application-level errors.

#### Code Example / Key Takeaways

```jsx
function DataFetcher({ url }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [url]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  return <DataView data={data} />;
}
```

---

### Q218. What is the useEffect event pattern (React canary/experimental)?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

React's experimental `useEffectEvent` hook (not yet stable) allows you to extract "event-like" logic from effects. It creates a function that always sees the latest values of reactive dependencies without being listed as a dependency. This solves the tension between needing the latest values and not wanting the effect to re-run. It is similar to `useRef` for latest values but is designed specifically for effects.

#### Code Example / Key Takeaways

```jsx
// Experimental pattern (not yet stable in React)
import { useEffectEvent } from 'react'; // Experimental

function ChatRoom({ roomId, theme }) {
  const onVisit = useEffectEvent((visitCount) => {
    analytics.track('visit', { roomId, theme, visitCount });
  });

  useEffect(() => {
    let visits = 0;
    const conn = createConnection(roomId);
    conn.on('visit', () => {
      visits++;
      onVisit(visits); // Always sees latest roomId and theme
    });
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]); // onVisit reference is stable, doesn't need to be in deps
}
```

---

### Q219. How do you optimize re-renders caused by context updates?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

Strategies: (1) Split context by update frequency. (2) Memoize the context value with `useMemo`. (3) Move stateful logic into a custom Hook that uses `useSyncExternalStore` for fine-grained subscriptions. (4) Use the "compound component" pattern to reduce context scope. (5) Use state management libraries (Zustand, Jotai) with selector-based subscriptions that only trigger re-renders for specific slices of state.

#### Code Example / Key Takeaways

```jsx
// Strategy: Split context + memoize values
const AuthStateContext = createContext();   // Rarely changes
const AuthActionsContext = createContext(); // Never changes (stable refs)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = useCallback(async (creds) => {
    const u = await api.login(creds);
    setUser(u);
  }, []);
  const logout = useCallback(() => setUser(null), []);

  const stateValue = useMemo(() => ({ user }), [user]);
  const actionsValue = useMemo(() => ({ login, logout }), [login, logout]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

// Components that only need actions won't re-render on user changes
function LogoutButton() {
  const { logout } = useContext(AuthActionsContext); // Stable
  return <button onClick={logout}>Logout</button>;
}
```

---

### Q220. Explain the useEffect vs useLayoutEffect timing diagram.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

The rendering timeline: (1) React renders (virtual DOM diff), (2) React commits DOM changes, (3) `useInsertionEffect` runs (synchronous, for CSS-in-JS), (4) `useLayoutEffect` runs (synchronous, for DOM measurements), (5) Browser paints pixels on screen, (6) `useEffect` runs (asynchronous, for non-blocking side effects). The key insight: `useLayoutEffect` blocks the paint, `useEffect` does not.

#### Code Example / Key Takeaways

```
Render Phase (virtual DOM) 
    |
    v
Commit Phase (DOM mutations)
    |
    v
useInsertionEffect (style injection)
    |
    v
useLayoutEffect (DOM measurement/modification)
    |
    v
Browser Paint  <-- visible to user
    |
    v
useEffect (data fetching, subscriptions, etc.)
```

---

### Q221. How do you handle multiple async operations in useEffect?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

For multiple independent async operations, use separate `useEffect` calls (each handles its own cleanup). For dependent async operations (second depends on first's result), chain them within a single effect using async/await. Always handle cleanup with `cancelled` flags or AbortControllers, and manage loading/error states appropriately for each operation.

#### Code Example / Key Takeaways

```jsx
function Dashboard({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState(null);

  // Independent: parallel fetching
  useEffect(() => {
    let cancelled = false;
    fetchUser(userId).then(data => { if (!cancelled) setUser(data); });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    fetchPosts(userId).then(data => { if (!cancelled) setPosts(data); });
    return () => { cancelled = true; };
  }, [userId]);

  // Dependent: sequential fetching
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const userData = await fetchUser(userId);
      if (cancelled) return;
      setUser(userData);
      const postData = await fetchPosts(userData.postsUrl);
      if (cancelled) return;
      setPosts(postData);
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (!user || !posts) return <Spinner />;
  return <div>{user.name} - {posts.length} posts</div>;
}
```

---

### Q222. What is the difference between refs created by useRef and callback refs?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

`useRef` returns a stable object with a `.current` property. A callback ref is a function that React calls with the DOM node on mount and `null` on unmount. Callback refs are useful when you need to perform cleanup or when the ref callback depends on dynamic values. `useRef` is simpler and more common; callback refs are needed for dynamic ref assignments and cleanup logic tied to the DOM element's lifecycle.

#### Code Example / Key Takeaways

```jsx
// useRef: Simple, stable reference
function Input() {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current.focus(); }, []);
  return <input ref={inputRef} />;
}

// Callback ref: Dynamic, with cleanup
function MeasuredDiv() {
  const [height, setHeight] = useState(0);

  const refCallback = useCallback((node) => {
    if (node !== null) {
      const observer = new ResizeObserver(([entry]) => {
        setHeight(entry.contentRect.height);
      });
      observer.observe(node);
      return () => observer.disconnect(); // Cleanup on unmount
    }
  }, []);

  return <div ref={refCallback}>Height: {height}px</div>;
}
```

---

### Q223. Explain the "use the latest ref" pattern for avoiding stale closures.

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

The "latest ref" pattern stores the most current value of a prop or state in a ref. Since refs are mutable and not captured by closures, the ref always provides the latest value. This is essential for callbacks stored in refs, interval functions, and event handlers that need to reference values that change between renders but shouldn't cause the effect to re-run.

#### Code Example / Key Takeaways

```jsx
function useLatestRef(value) {
  const ref = useRef(value);
  ref.current = value; // Update on every render
  return ref;
}

function useInterval(callback, delay) {
  const latestCallback = useLatestRef(callback);

  useEffect(() => {
    const id = setInterval(() => {
      latestCallback.current(); // Always calls the latest version
    }, delay);
    return () => clearInterval(id);
  }, [delay]); // Only re-runs when delay changes
}

// Usage: callback can change without re-creating the interval
function Timer() {
  const [count, setCount] = useState(0);
  useInterval(() => setCount(c => c + 1), 1000);
  return <p>{count}</p>;
}
```

---

### Q224. How does React ensure Hook stability across renders?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

React ensures Hook stability through its fiber architecture. Each component fiber has a `memoizedState` property pointing to the first Hook's state node. Each Hook state node has a `next` pointer forming a linked list. On re-renders, React walks this list in order, matching each Hook call to its state node. The `dispatch` function from `useState`/`useReducer` is stable across renders because it's bound to the fiber's state node, not captured in closures.

#### Code Example / Key Takeaways

```jsx
// dispatch is stable - safe to omit from dependencies
function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // setCount reference never changes between renders
    const id = setInterval(() => setCount(c => c + 1), 1000);
    return () => clearInterval(id);
  }, []); // No dependency needed for setCount
}

// useMemo and useCallback return stable references when deps don't change
function Component({ theme }) {
  const stableFn = useCallback(() => {}, []); // Always same reference
  const stableObj = useMemo(() => ({ a: 1 }), []); // Always same reference
}
```

---

### Q225. What are the key differences between React 17 and React 18 Hooks behavior?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Key differences: (1) React 18 adds automatic batching for all state updates (not just event handlers), (2) React 18 introduces `useTransition`, `useDeferredValue`, `useId`, and `useSyncExternalStore`, (3) React 18 adds `useInsertionEffect`, (4) React 18's `useId` generates unique IDs for SSR hydration safety, (5) React 18 concurrent features allow transitions to be interrupted, (6) React 18 removes the need for `act()` in most cases for testing.

#### Code Example / Key Takeaways

```jsx
// React 17: Batching only in event handlers
function handleClick() {
  setTimeout(() => {
    setA(1); // Re-render 1
    setB(2); // Re-render 2
  }, 0);
}

// React 18: Automatic batching everywhere
function handleClick() {
  setTimeout(() => {
    setA(1); // Batched
    setB(2); // Batched - only 1 re-render
  }, 0);
}

// New Hooks in React 18
function Component() {
  const [isPending, startTransition] = useTransition();
  const deferredValue = useDeferredValue(value);
  const id = useId();
  const externalState = useSyncExternalStore(subscribe, getSnapshot);
}
```

---

### Q226. Explain the useDeferredValue pattern for search filtering.

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

`useDeferredValue` is ideal for search/filter UIs where typing should feel instant but the filtered results are expensive to compute. The input updates immediately (high priority), while the filtered list updates with a deferred value (low priority). React can interrupt the expensive filter computation if the user types again, keeping the UI responsive. The stale version is shown while the new computation runs.

#### Code Example / Key Takeaways

```jsx
function SearchableList({ items }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const filteredItems = useMemo(
    () => items.filter(item => item.name.toLowerCase().includes(deferredQuery.toLowerCase())),
    [items, deferredQuery]
  );

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 200ms' }}>
        <ItemList items={filteredItems} />
      </div>
      {isStale && <span>Updating...</span>}
    </div>
  );
}
```

---

### Q227. How do you create a useFetch Hook with caching?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

A cached `useFetch` Hook stores responses in a cache (using a Map or similar structure) keyed by URL. On subsequent requests for the same URL, it returns cached data immediately while optionally revalidating in the background. This pattern (stale-while-revalidate) improves perceived performance. Use `useRef` for the cache to avoid re-creating it on renders.

#### Code Example / Key Takeaways

```jsx
const cache = new Map(); // Module-level cache persists across components

function useFetch(url) {
  const [data, setData] = useState(() => cache.get(url) || null);
  const [loading, setLoading] = useState(!cache.has(url));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache.has(url)) {
      setData(cache.get(url));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        cache.set(url, json);
        if (!cancelled) { setData(json); setLoading(false); }
      })
      .catch(err => {
        if (!cancelled) { setError(err.message); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}
```

---

### Q228. What is the useState 18 cheat pattern for computing initial state?

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

When using `useState` with a lazy initializer (function form), you can compute expensive initial state only once. The lazy initializer function runs only during the first render. This is particularly useful for expensive operations like parsing large JSON, computing complex default values, or reading from browser APIs (localStorage). Without the lazy form, the computation runs on every render even though the result is discarded.

#### Code Example / Key Takeaways

```jsx
// EXPENSIVE: Runs on every render
function Component1() {
  const [settings, setSettings] = useState(JSON.parse(localStorage.getItem('settings')));
}

// OPTIMAL: Runs only on first render
function Component2() {
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('settings'));
    } catch {
      return defaultSettings;
    }
  });
}

// Also useful for expensive computations
function Component3() {
  const [matrix, setMatrix] = useState(() => generateLargeMatrix(1000, 1000));
}
```

---

### Q229. Explain how custom Hooks enable code reuse across your application.

**Difficulty:** `Intermediate`
**Category:** React Hooks Deep Dive

#### Answer

Custom Hooks are React's primary mechanism for logic reuse. They solve the problems that mixins, higher-order components, and render props tried to address, but without the wrapper hell or component explosion. A custom Hook encapsulates stateful logic that can be shared across components without changing the component hierarchy. Each call to the Hook gets its own independent state, so multiple components using the same Hook don't share data unless explicitly designed to.

#### Code Example / Key Takeaways

```jsx
// Shared logic across many components
function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(event) {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    }
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Used in a dropdown
function Dropdown({ children }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  useClickOutside(ref, () => setOpen(false));
  return <div ref={ref}>{open && children}</div>;
}

// Used in a modal
function Modal({ children, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  return <div ref={ref} className="modal">{children}</div>;
}
```

---

### Q230. What are the future directions for React Hooks and data fetching?

**Difficulty:** `Advanced`
**Category:** React Hooks Deep Dive

#### Answer

React's future direction includes: (1) The `use()` hook (React 19) for reading resources including promises directly in render with Suspense, (2) Server Components reducing the need for client-side data fetching hooks, (3) React Compiler (formerly React Forget) automatically memoizing components and eliminating the need for manual `useMemo`/`useCallback`, (4) Transition-based data fetching as the default pattern, (5) Potential deprecation of `useEffect` for data fetching in favor of `use()` + Suspense, (6) `useFormStatus` and `useFormState` for form actions integration.

#### Code Example / Key Takeaways

```jsx
// Future: use() with Suspense replaces useEffect for data fetching
function UserProfile({ userId }) {
  const user = use(fetchUser(userId)); // Suspends until resolved
  return <h1>{user.name}</h1>;
}

// Future: Server Components reduce client-side hooks
// app/users/[id]/page.tsx (Server Component)
async function UserPage({ params }) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  return <UserProfile user={user} />; // No useEffect needed
}

// Future: React Compiler eliminates manual memoization
// No need for useMemo/useCallback - compiler handles it automatically
function Component({ data, onClick }) {
  // Compiler auto-memoizes expensive computations
  const processed = expensiveProcess(data);
  // Compiler auto-memoizes callbacks passed to memoized children
  return <MemoizedChild data={processed} onClick={onClick} />;
}
```

---

*This completes the React Hooks In Depth section with 80 interview questions (Q151-Q230) covering Rules of Hooks, useState, useReducer, useEffect mechanics, useLayoutEffect, useInsertionEffect, useMemo, useCallback, useRef, useContext, useImperativeHandle, useId, useTransition, useDeferredValue, useSyncExternalStore, custom Hooks patterns, and future directions.*
