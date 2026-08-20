# React Interview Questions: Core React, JSX & Virtual DOM

### Q1. What is React and why was it created?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
React is an open-source JavaScript library for building user interfaces, created by Facebook (Meta) and released in 2013. Jordan Walke developed it to address the pain points of building complex, data-driven UIs at scale.

Before React, developers dealt with two major problems: (1) the DOM was slow to manipulate directly, and (2) keeping the UI in sync with application state was error-prone and verbose. React introduced a declarative model where developers describe *what* the UI should look like for any given state, and React handles *how* to update the DOM efficiently.

Key design decisions:
- **Component-based architecture**: UIs built from small, reusable, self-contained pieces.
- **Virtual DOM**: An in-memory representation of the real DOM enabling efficient updates.
- **One-way data flow**: Data flows downward through props, making the data flow predictable.
- **JSX**: A syntax extension letting you write HTML-like code in JavaScript.

React is a view layer library. It does not enforce a full framework structure and can be paired with routing, state management, and other libraries as needed.

#### Code Example / Key Takeaways
```jsx
// React is declarative: describe WHAT the UI should look like
function Greeting({ userName }) {
  return <h1>Welcome, {userName}!</h1>;
}

// You never manually call document.getElementById or element.innerHTML
// React figures out the minimal DOM changes needed
function App() {
  const [name, setName] = React.useState('Alice');
  return (
    <div>
      <Greeting userName={name} />
      <button onClick={() => setName('Bob')}>Change Name</button>
    </div>
  );
}
```
---

### Q2. What is the Virtual DOM and how does it work?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
The Virtual DOM (VDOM) is a lightweight JavaScript object representation of the real DOM. When React renders a component, it builds a tree of plain JS objects (React elements) describing the UI. On a state or prop change, React creates a new VDOM tree and compares it to the previous one via **diffing** (reconciliation). It then computes the minimal set of changes and applies only those to the real DOM in a batch.

This matters because direct DOM operations are expensive (they trigger layout, reflow, and repaint). By batching and minimizing real DOM writes, React keeps UIs fast even under frequent updates.

Important nuance: the VDOM is *not* faster than the real DOM per se; the real win is avoiding unnecessary DOM mutations and batching updates intelligently.

#### Code Example / Key Takeaways
```jsx
// A "Virtual DOM" node is just a plain JS object
const vdomNode = {
  type: 'div',
  props: { className: 'greeting', children: 'Hello' },
};

// React.createElement produces plain objects (the VDOM)
const element = React.createElement('div', { className: 'greeting' }, 'Hello');
console.log(element);
// { type: 'div', props: { className: 'greeting', children: 'Hello' }, ... }
```
---

### Q3. What are the advantages of the Virtual DOM?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
The Virtual DOM provides several concrete advantages:
1. **Performance via batching**: React groups multiple state updates and flushes them together, reducing DOM operations.
2. **Minimal updates**: The diffing algorithm only patches changed nodes rather than re-rendering the whole tree.
3. **Declarative programming**: You write what the UI should be; React handles the imperative DOM updates.
4. **Cross-platform rendering**: The same React element tree can render to the DOM (ReactDOM), Native (React Native), or even canvas — the VDOM is platform-agnostic.
5. **Predictability**: Diffing is deterministic, making UI behavior easier to reason about and test.

A common misconception is that VDOM makes every app automatically fast. In reality, unnecessary re-renders, large component trees, and heavy computations still cause slowness; the VDOM only optimizes the DOM-write layer.

#### Code Example / Key Takeaways
```jsx
// Multiple state updates are batched in React 18 (automatic batching)
function Counter() {
  const [a, setA] = React.useState(0);
  const [b, setB] = React.useState(0);
  function handleClick() {
    setA(a + 1);
    setB(b + 1); // Only ONE re-render of the DOM, not two
  }
  return <button onClick={handleClick}>{a} {b}</button>;
}
```
---

### Q4. What is React Fiber and how does it relate to reconciliation?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
React Fiber is React's **reconciliation algorithm rewrite** (introduced in React 16). The old "stack reconciler" was synchronous and recursive — once it started, it couldn't be interrupted. This caused dropped frames on complex UIs.

Fiber reimagines reconciliation as **incremental work** that can be paused, resumed, and prioritized. A "fiber" is a JavaScript object representing a unit of work (roughly one component). Each fiber has:
- `type`, `stateNode`, `return`, `child`, `sibling` (tree links)
- `alternate` (the current vs. work-in-progress fiber)
- `effectTag` (what DOM mutations to perform)
- `lanes` / `priority` (when this work should run)

The Fiber architecture enables:
- **Concurrent features** (React 18): `useTransition`, `useDeferredValue`, Suspense
- **Time-slicing**: Low-priority work yields to high-priority (user input)
- **Error boundaries**: Errors can be caught at any fiber level
- **Return points**: Components can return arrays, strings, or null without wrappers

#### Code Example / Key Takeaways
```jsx
// Fiber work loop (simplified conceptual view)
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && finishedWork) {
    commitRoot(); // Apply DOM changes
  }
}

// Fiber priority lanes (conceptual)
const SyncLane = 1;        // High: click, typing
const DefaultLane = 2;     // Normal: data fetching
const IdleLane = 4;        // Low: background analytics
```
---

### Q5. Explain the reconciliation (diffing) algorithm in React.
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Reconciliation is the process React uses to update the DOM efficiently. When a component re-renders, React produces a new element tree and reconciles it with the previous one. The diffing algorithm is based on two key assumptions for performance:

1. **Different element types produce different trees**: If the root element type changes (e.g., `<div>` to `<span>`), React tears down the old subtree entirely and builds a new one. No diffing of children occurs.

2. **Lists use `key` props for identity**: Children of the same type are diffed by their `key`. React matches elements with the same key across renders to preserve state and DOM nodes; without stable keys it falls back to positional matching, which causes bugs (see Q on keys).

The algorithm is **O(n)** (not O(n³) of a general tree-diff algorithm) because it never compares two trees of different branches — it assumes components at the same level produce similar structure.

Three sub-steps during reconciliation:
- **Element type changed** → unmount old, mount new (state lost).
- **Element type same (DOM)** → keep node, update only changed attributes.
- **Element type same (component)** → update props, re-render children, keep state.

#### Code Example / Key Takeaways
```jsx
// Case 1: Different types -> full remount (state of <Counter/> is lost)
function App({ useButton }) {
  return useButton ? <button>Click</button> : <div>Click</div>;
}

// Case 2: Same type -> only attributes update, node reused
function App({ title }) {
  return <h1 className="title">{title}</h1>; // DOM node reused, text updated
}
```
---

### Q6. What is the difference between the Virtual DOM and the Shadow DOM?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
These are completely unrelated concepts that happen to share the word "DOM":

| Aspect | Virtual DOM | Shadow DOM |
|--------|-------------|------------|
| Origin | React library concept | Web standard (W3C) |
| Purpose | Optimize UI re-rendering | Encapsulate styles/markup in components |
| Scope | A JS object tree of the UI | A real DOM subtree with style isolation |
| Who uses it | React, Vue, etc. | Native web components, Lit |

The **Shadow DOM** is a browser feature that lets you attach a hidden, encapsulated DOM tree to an element so that CSS and JS don't leak in or out. The **Virtual DOM** is a purely JS-level abstraction with no browser involvement — it never touches rendering isolation.

#### Code Example / Key Takeaways
```jsx
// Virtual DOM: a JS object, not real DOM
const vdom = React.createElement('div', null, 'Hi');

// Shadow DOM: a real browser feature (works in plain JS, no React)
const host = document.createElement('div');
const shadow = host.attachShadow({ mode: 'open' });
shadow.innerHTML = '<style>h1 { color: red; }</style><h1>Scoped</h1>';
// Styles here do NOT affect the rest of the page
```
---

### Q7. What is JSX and why is it used in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
JSX (JavaScript XML) is a syntax extension for JavaScript that lets you write HTML-like markup directly inside JS files. It's not required to use React — you could call `React.createElement` directly — but it makes component structure far more readable and visually matches the output.

JSX provides:
- **Familiarity**: UI structure looks like HTML.
- **Composition**: Nesting components reads naturally.
- **Expressiveness**: You can embed any JS expression in `{ }`.
- **Compile-time checks**: Static analysis tools can catch typos in element names.

JSX is NOT valid JavaScript — it must be transformed (by Babel, SWC, or the TypeScript compiler) into `React.createElement()` calls (or the newer automatic JSX runtime) before the browser can run it.

#### Code Example / Key Takeaways
```jsx
// JSX - what you write
const element = <h1 className="greeting">Hello, world!</h1>;

// What it compiles to (classic transform):
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, world!'
);
```
---

### Q8. How does JSX get transformed under the hood? (createElement / JSX transform)
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
JSX is syntax sugar. A compiler (Babel/SWC/TS) transforms it. There are two transforms:

**Classic Transform** (React 16 and earlier default):
```jsx
const el = <div className="a">Hi</div>;
// becomes:
const el = React.createElement('div', { className: 'a' }, 'Hi');
```
This requires `React` in scope.

**Automatic Runtime** (React 17+, the default now): The compiler imports a function from `react/jsx-runtime` automatically, so you no longer need to `import React` to use JSX.
```jsx
// <div className="a">Hi</div>
import { jsx as _jsx } from "react/jsx-runtime";
const el = _jsx("div", { className: "a", children: "Hi" });
```

`React.createElement(type, props, ...children)` returns a plain object:
```
{ $$typeof: Symbol(react.element), type, props: {children, ...}, key, ref }
```
This object is a **React element** — the smallest building block of the VDOM.

#### Code Example / Key Takeaways
```jsx
// Children can be passed variadically:
React.createElement('ul', null,
  React.createElement('li', null, 'A'),
  React.createElement('li', null, 'B')
);
// JSX equivalent:
// <ul><li>A</li><li>B</li></ul>

// Elements are just objects describing what to render
const el = <span>x</span>;
console.log(el.$$typeof); // Symbol(react.element)
```
---

### Q9. What is the difference between React.createElement and JSX?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
There is **no functional difference** at runtime — JSX compiles to `React.createElement` (or the automatic runtime). JSX is purely a developer-experience improvement. Both produce identical React element objects.

Trade-offs:
- **JSX**: Readable, visual, matches HTML structure, easier to maintain for complex trees. But requires a build step and can hide what's happening.
- **createElement**: Verbose, nested function calls become unreadable, but explicit and needs no special syntax (useful in environments without JSX support, or for programmatic/dynamic element creation).

Modern best practice is almost always JSX, except for very dynamic trees where you build elements in loops/conditionals in plain JS.

#### Code Example / Key Takeaways
```jsx
// Equivalent representations

// 1. JSX
const a = (
  <div className="box" onClick={handleClick}>
    <span>Text</span>
  </div>
);

// 2. createElement
const b = React.createElement(
  'div',
  { className: 'box', onClick: handleClick },
  React.createElement('span', null, 'Text')
);
// a and b describe the exact same UI
```
---

### Q10. What is a React element vs a React component vs an instance?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
These three terms are often confused:

- **React Element**: A plain object describing what to render (`{ type, props, key, ref }`). It is immutable and is what `createElement`/`JSX` return. Elements are not components.
- **React Component**: A function or class that, given props, returns a React element (or tree of them). It's a blueprint, not a rendered thing.
- **Component Instance**: The internal Fiber/state object React creates to track a mounted component. For function components, you don't get a direct handle to the instance; for class components, `this` refers to it. The DOM node is also a separate concept.

Think: element = instruction, component = function, instance = the running record React keeps.

#### Code Example / Key Takeaways
```jsx
// Component (a function/blueprint)
function Button({ label }) {
  return <button>{label}</button>; // returns an element
}

// Element (an instruction object created when you write JSX)
const el = <Button label="Save" />; // equals createElement(Button, {label:'Save'})

// Instance: React internally creates one when <Button/> mounts (no direct handle)
```
---

### Q11. What are Functional Components and Class Components in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
React supports two ways to define components:

**Functional Components** (modern, recommended):
- Plain JavaScript functions that accept `props` and return JSX.
- Can use Hooks (`useState`, `useEffect`, etc.) for state and side effects.
- Simpler, easier to test, no `this` binding issues.
- Smaller bundle size after minification (no class boilerplate).

**Class Components** (legacy):
- ES6 classes extending `React.Component`.
- Have `this.props`, `this.state`, lifecycle methods (`componentDidMount`, etc.).
- `this` binding required in constructors or via class fields.
- Still supported but not recommended for new code.

As of React 18, both are officially supported. Function components + Hooks are the present and future.

#### Code Example / Key Takeaways
```jsx
// Functional component (modern)
function Greeting({ name }) {
  const [count, setCount] = React.useState(0);
  return <div>Hello {name}, clicked {count} times</div>;
}

// Class component (legacy)
class Greeting extends React.Component {
  state = { count: 0 };
  render() {
    return <div>Hello {this.props.name}, clicked {this.state.count} times</div>;
  }
}
```
---

### Q12. What is the difference between Functional and Class Components?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Beyond syntax, key differences:

| Aspect | Functional | Class |
|--------|-----------|-------|
| State | `useState` (multiple) | single `this.state` object |
| Side effects | `useEffect` | lifecycle (`componentDidMount`, etc.) |
| `this` | none | required, binding headaches |
| State updates | functional updater `setX(prev => prev+1)` | `this.setState({x: this.state.x+1})` |
| Performance | No instance allocation overhead | instances created |
| Code reuse | Custom Hooks | HOCs / render props |
| Error handling | Error boundaries still need classes | `componentDidCatch` |

Functional components can now do everything class components can (including error boundaries via libraries, though React's built-in error boundary still requires a class). They are the recommended default.

#### Code Example / Key Takeaways
```jsx
// Side effect comparison
function Func() {
  React.useEffect(() => {
    const id = setInterval(() => {}, 1000);
    return () => clearInterval(id); // cleanup
  }, []);
  return null;
}

class Cls extends React.Component {
  componentDidMount() { this.id = setInterval(() => {}, 1000); }
  componentWillUnmount() { clearInterval(this.id); }
  render() { return null; }
}
```
---

### Q13. Can a functional component fully replace a class component? Are there exceptions?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
For 99% of cases, yes. Hooks cover state, side effects, context, refs, memoization, and even `getSnapshotBeforeUpdate`/`componentDidUpdate`-style logic. The one notable exception historically is **Error Boundaries**: React's `componentDidCatch` / `getDerivedStateFromError` can ONLY be implemented in a class component. There is no `useErrorBoundary` hook built into React.

That said, you typically need just one tiny class-based error boundary in an entire app, and community libraries wrap it for you. All other lifecycle behaviors map cleanly to Hooks:
- `componentDidMount` → `useEffect(fn, [])`
- `componentDidUpdate` → `useEffect(fn, [deps])`
- `shouldComponentUpdate` → `React.memo` / `useMemo`
- `getDerivedStateFromProps` → `useState` + `useEffect` or derived state directly in render

#### Code Example / Key Takeaways
```jsx
// The one thing still needing a class: Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { logError(error, info); }
  render() {
    return this.state.hasError ? <Fallback /> : this.props.children;
  }
}
// Wrap any tree: <ErrorBoundary><App/></ErrorBoundary>
```
---

### Q14. What are Props in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
Props (short for "properties") are read-only inputs passed from a parent component to a child. They flow **downward** (one-way data flow). A child can never modify its own props; it can only use them to render. If a child needs to influence the parent's data, the parent passes down a callback function as a prop.

Props can be of any type: strings, numbers, objects, arrays, functions, even other React elements (children). Because props are immutable from the child's perspective, React can optimize rendering and treat components as pure functions of their props.

#### Code Example / Key Takeaways
```jsx
// Parent passes props down
function Parent() {
  const user = { name: 'Ada', age: 36 };
  return <Profile user={user} onEdit={() => save(user)} />;
}

// Child receives and uses props (read-only!)
function Profile({ user, onEdit }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <button onClick={onEdit}>Edit</button>
      {/* user.name = 'Bob' would throw or be ignored; never mutate props */}
    </div>
  );
}
```
---

### Q15. What is State in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
State is a component's private, mutable data that affects what is rendered. When state changes (via a setter from `useState`), React re-renders that component (and its children, unless memoized). Unlike props, state is owned and controlled by the component itself.

Key rules:
- Never mutate state directly (`state.count++` is wrong). Always use the setter.
- Treat state as immutable; replace it with a new object/array.
- State updates may be asynchronous/batched, so don't rely on the value right after calling the setter.
- State is local: only the component that owns it (and its descendants via props/callbacks) can read or change it.

#### Code Example / Key Takeaways
```jsx
function Counter() {
  const [count, setCount] = React.useState(0); // initial state

  function increment() {
    // CORRECT: use the setter (functional form for latest value)
    setCount(prev => prev + 1);

    // WRONG: mutating state directly does not trigger re-render
    // count++; // never do this
  }
  return <button onClick={increment}>{count}</button>;
}
```
---

### Q16. What is the difference between Props and State?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
| Aspect | Props | State |
|--------|-------|-------|
| Ownership | Parent owns it; child receives it | Component owns it itself |
| Mutability | Immutable from child's view | Mutable via setter |
| Purpose | Configure/feed data into a component | Track changing data internal to component |
| Trigger re-render | When parent re-renders | When setter called |
| Source of truth | Parent decides | Component decides |

A helpful mental model: **props are like function arguments; state is like a variable declared inside the function**. Both are inputs to render; re-render happens when either changes.

Another nuance: you can "lift state up" so that what was state in a child becomes a prop passed from the parent — this is how sibling components share data.

#### Code Example / Key Takeaways
```jsx
// Props: passed in, read-only
function Child({ value }) { return <p>{value}</p>; }

// State: owned, mutable
function Parent() {
  const [value, setValue] = React.useState(0);
  return <Child value={value} />; // state of Parent becomes prop of Child
}
```
---

### Q17. Why is immutability important in React?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
React relies on reference equality to detect changes. When you call a state setter, React compares the new state to the old. If you mutate an object/array in place, its reference stays the same, so React may **skip the re-render** because `prevState === nextState`.

Immutability guarantees:
1. **Correct change detection**: A new reference always signals a change.
2. **Time-travel debugging**: Libraries like Redux DevTools rely on snapshotting previous states; mutation breaks that.
3. **Predictable re-renders**: Memoized components (`React.memo`, `useMemo`) only re-render when inputs change by reference.
4. **Concurrency safety**: React 18 concurrent features may read the same state at multiple points; mutation risks tearing.

Rule: always create a new object/array when updating state.

#### Code Example / Key Takeaways
```jsx
function TodoList() {
  const [todos, setTodos] = React.useState([{ id: 1, text: 'a' }]);

  // WRONG - mutates, reference unchanged, may not re-render
  function badAdd() {
    todos.push({ id: 2, text: 'b' });
    setTodos(todos);
  }

  // CORRECT - new array reference
  function goodAdd() {
    setTodos(prev => [...prev, { id: 2, text: 'b' }]);
  }

  // CORRECT - new object for nested update
  function updateFirst() {
    setTodos(prev => prev.map((t, i) =>
      i === 0 ? { ...t, text: 'updated' } : t
    ));
  }
}
```
---

### Q18. What are Controlled and Uncontrolled Components?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
**Controlled Components**: Form inputs whose value is driven by React state. The input's `value` (or `checked`) prop is set from state, and every change updates that state via `onChange`. React is the single source of truth.

**Uncontrolled Components**: Form inputs that manage their own state internally via the DOM. You access their value using a `ref` when needed (e.g., on submit). The DOM is the source of truth.

Controlled components are preferred for most cases because they enable validation, formatting, disabling, and conditional behavior in React logic. Uncontrolled are simpler for simple forms, file inputs (`<input type="file">`), or integrating non-React libraries.

#### Code Example / Key Takeaways
```jsx
// Controlled: React owns the value
function Controlled() {
  const [name, setName] = React.useState('');
  return <input value={name} onChange={e => setName(e.target.value)} />;
}

// Uncontrolled: DOM owns the value, read via ref on submit
function Uncontrolled() {
  const inputRef = React.useRef(null);
  function handleSubmit(e) {
    e.preventDefault();
    console.log(inputRef.current.value);
  }
  return <form onSubmit={handleSubmit}><input ref={inputRef} /></form>;
}
```
---

### Q19. When should you use Controlled vs Uncontrolled components?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Use **Controlled** when:
- You need instant validation/feedback as the user types.
- The input value affects other parts of the UI (e.g., a live preview, disabling a submit button).
- You need to enforce formatting (uppercase, mask digits).
- You want a single predictable source of truth and easier testing.

Use **Uncontrolled** when:
- You have a simple form with a few fields and no live cross-field logic.
- You need a `<input type="file">` (always uncontrolled — its value can't be set programmatically for security).
- You're integrating a third-party DOM library (e.g., a datepicker) that manages its own input.
- You want to reduce re-renders for very high-frequency input (though debouncing a controlled input is usually better).

A middle ground: `defaultValue` / `defaultChecked` give uncontrolled inputs an initial value set by React without taking over updates.

#### Code Example / Key Takeaways
```jsx
// Hybrid: uncontrolled with a sensible initial value via defaultValue
function Form() {
  return <input defaultValue="starter" />; // DOM controls updates
}

// Controlled with validation
function EmailField() {
  const [email, setEmail] = React.useState('');
  const valid = /^[^@]+@[^@]+$/.test(email);
  return (
    <>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {email && !valid && <span>Invalid email</span>}
    </>
  );
}
```
---

### Q20. Why are keys important in React lists, and why is using the array index dangerous?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Keys help React identify which items in a list have changed, been added, or removed across renders. During reconciliation, React matches children by key rather than by position. With a stable, unique key, React can move/reuse DOM nodes correctly and preserve component state.

Using the **array index as a key is dangerous** when the list is reordered, filtered, or items are inserted/removed. Because the index changes as the list changes, items get mismatched: a component that should keep its state gets a different key, causing:
- Loss of local component state (input values, scroll position).
- Incorrect association between DOM and state.
- Subtle UI bugs (a checkbox checked on item A suddenly appears on item B).

Index keys are acceptable **only** for static lists that never reorder, filter, or add/remove items. Otherwise use a stable unique id.

#### Code Example / Key Takeaways
```jsx
const todos = [{ id: 'a', text: 'Buy milk' }, { id: 'b', text: 'Walk dog' }];

// GOOD: stable unique id
todos.map(t => <li key={t.id}>{t.text}</li>);

// BAD: index changes when list mutates
todos.map((t, i) => <li key={i}>{t.text}</li>);
// If you delete index 0, the old index-1 item now has key 0 -> state mismatch
```
---

### Q21. What happens if you don't provide a key to a list item?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
React will still render the list but will emit a warning: "Each child in a list should have a unique 'key' prop." Without keys, React falls back to positional (index) matching. As explained in Q20, positional matching causes state mismatches when the list changes. The key must be on the **innermost element returned by the map**, not on the `<div>` wrapping the loop.

Keys only need to be unique among siblings — they don't need to be globally unique across the whole app. Never use `Math.random()` as a key (it changes every render, defeating the purpose).

#### Code Example / Key Takeaways
```jsx
// WRONG - warning, and no key on the mapped element
{items.map(item => (
  <div key={item.id}> {/* key here is ignored for the list item itself */}
    {item.name}
  </div>
))}

// CORRECT - key on the element returned by map
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```
---

### Q22. What is a React Fragment and when should you use it?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
A **Fragment** (`<>...</>` or `<React.Fragment>...</React.Fragment>`) lets a component return multiple sibling elements without wrapping them in an extra DOM node. This keeps the DOM shallow and avoids invalid HTML (e.g., a `<div>` inside a `<table>` or `<ul>`).

Use fragments when:
- You need to return multiple elements from a component.
- A wrapper `<div>` would break semantics or CSS.
- You want to avoid unnecessary depth in the DOM tree.

The shorthand `<>...</>` is syntactic sugar for `<React.Fragment>...</React.Fragment>`. It does not create a DOM node.

#### Code Example / Key Takeaways
```jsx
// Without fragment: adds extra <div> to DOM
function Bad() { return <div><td>1</td><td>2</td></div>; }

// With fragment: no extra node
function Good() {
  return (
    <>
      <td>1</td>
      <td>2</td>
    </>
  );
}

// Explicit form needed when you need a key (see Q23)
function GoodWithKey({ items }) {
  return (
    <React.Fragment>
      {items.map(item => <React.Fragment key={item.id}><td>{item.a}</td><td>{item.b}</td></React.Fragment>)}
    </React.Fragment>
  );
}
```
---

### Q23. How do you use a Fragment with a key?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
The shorthand `<>...</>` syntax **cannot** accept a `key` prop. To use a key on a fragment — which you need when mapping fragments in a list — you must use the **explicit** `<React.Fragment key={...}>` form. This is extremely common in tables where each row must render multiple `<td>`s without a wrapping `<div>` but still needs a key.

Under the hood, `React.Fragment` is just another element type; the reconciler treats it as a no-op DOM node, but it still carries a `key` used for list diffing.

#### Code Example / Key Takeaways
```jsx
// Shorthand cannot take a key -> this would warn/break
// {items.map(item => <>{item.a}{item.b}</>)} // no key allowed

// Explicit form with key:
function TableBody({ rows }) {
  return (
    <tbody>
      {rows.map(row => (
        <React.Fragment key={row.id}>
          <td>{row.name}</td>
          <td>{row.age}</td>
        </React.Fragment>
      ))}
    </tbody>
  );
}
```
---

### Q24. What are the different patterns for conditional rendering in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
Common patterns, from most to least common:

1. **Inline ternary**: `{condition ? <A /> : <B />}`
2. **Logical &&**: `{condition && <A />}` (renders nothing if falsy)
3. **Early return**: `if (!condition) return null; return <A />;` (at top of component)
4. **Switch/ternary chain**: for multiple mutually exclusive states
5. **Higher-order / wrapper components**: e.g., `<AuthGate><Dashboard/></AuthGate>`
6. **Render props / children as function**: `<Wrapper>{isLoading ? <Spinner/> : <Content/>}</Wrapper>`

Notes:
- `&&` can render `0` as `0` if the left side is `0` (a number). Use `condition > 0 && ...` or `Boolean(condition) && ...`.
- `null`, `undefined`, `false`, `true` render nothing (useful for `&&`).
- Prefer early returns for complex conditionals — they avoid nested JSX and improve readability.

#### Code Example / Key Takeaways
```jsx
function Status({ user }) {
  if (!user) return <Login />;
  if (user.isAdmin) return <AdminPanel />;
  return <Dashboard />;
}

// Gotcha: 0 renders as "0"
{count && <span>{count}</span>} // if count=0, renders "0"!
{count > 0 && <span>{count}</span>} // safe
```
---

### Q25. What is the difference between `&&` and ternary conditional rendering?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
- **`condition && <X />`**: Renders `<X />` when truthy; when falsy renders the falsy value (`false`, `null`, `undefined` render nothing, but `0` or `''` render literally). Best for "show or hide" with no else branch.
- **`condition ? <X /> : <Y />`**: Always renders exactly one branch — ideal when you have both an "if" and "else" path (including an explicit `: null`).

Choose `&&` when there is no else. Choose ternary when you need an explicit else (even `: null`). Avoid deeply nested ternaries; extract to a variable or early return for readability.

#### Code Example / Key Takeaways
```jsx
// Ternary: always one branch
{isLoggedIn ? <LogoutButton /> : <LoginButton />}

// && : only-if, else renders nothing (unless 0/'' )
{showBanner && <Banner />}

// Bad: nested ternary hard to read
{isLoading ? <Spinner/> : error ? <Error/> : <Data/>}
// Better: extract or early-return
```
---

### Q26. How do you handle multiple conditions (more than two branches) in JSX?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
For more than two branches, several clean approaches exist:

1. **Extract to a variable** (most readable): compute `const content = ...` before `return`, then render `{content}`.
2. **Lookup object/map**: `const views = { loading: <Spinner/>, error: <Error/>, ready: <Data/> }; return views[state];`
3. **Early returns** in the component body.
4. **Switch statement** in a helper function that returns JSX.

Avoid chaining multiple ternaries inline; it becomes unreadable and error-prone. The object-map approach is especially clean when branches are independent of order.

#### Code Example / Key Takeaways
```jsx
function Panel({ status }) {
  const views = {
    loading: <Spinner />,
    error: <ErrorBox />,
    empty: <EmptyState />,
    ready: <Data />,
  };
  return <section>{views[status] ?? <ErrorBox />}</section>;
}

// Or early returns:
function Panel2({ status }) {
  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <ErrorBox />;
  return <Data />;
}
```
---

### Q27. How are events handled in React compared to plain HTML/JavaScript?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
React implements a **synthetic event system**. Differences from native DOM events:

1. **Naming**: React uses **camelCase** (`onClick`, `onSubmit`) vs HTML's lowercase (`onclick`).
2. **Handler value**: You pass a **function** as the handler, not a string (`onClick={handleClick}` vs `onclick="handleClick()"`).
3. **SyntheticEvent**: React wraps native events in a cross-browser `SyntheticEvent` object that normalizes behavior across browsers. Events are pooled in older versions (React 16 and earlier pooled objects for performance; React 17+ no longer pools).
4. **Delegation**: React 17+ attaches listeners to the root container, not `document`. This makes event handling more predictable and allows multiple React versions on one page.
5. **`this` binding**: In class components you must bind handlers (or use class fields / arrow functions).

#### Code Example / Key Takeaways
```jsx
// HTML
// <button onclick="handleClick()">Click</button>

// React
function Button() {
  function handleClick(e) {
    e.preventDefault(); // SyntheticEvent, cross-browser
    console.log('clicked');
  }
  return <button onClick={handleClick}>Click</button>;
}
```
---

### Q28. What is the SyntheticEvent in React?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
`SyntheticEvent` is React's cross-browser wrapper around the native browser event. It provides a consistent API regardless of browser quirks, exposing standard methods like `preventDefault()`, `stopPropagation()`, `target`, `currentTarget`, `nativeEvent`, and `type`.

Key points:
- It is a **normalized** object — same interface in all browsers.
- **Event pooling** (React <17): event objects were reused for performance; you had to call `e.persist()` to access them asynchronously. **React 17+ removed pooling**, so async access works normally.
- `e.nativeEvent` gives the underlying browser event when you need low-level access.
- React 17+ attaches root listeners at the React root container, not `document`, fixing issues with event ordering across React trees.

#### Code Example / Key Takeaways
```jsx
function Form() {
  function onSubmit(e) {
    e.preventDefault();          // works in all browsers
    const value = e.target.value; // normalized target
    // e.nativeEvent gives the raw DOM event if needed
    console.log(e.nativeEvent);
  }
  return <form onSubmit={onSubmit}><input /></form>;
}
```
---

### Q29. How does event delegation work in React?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
React uses **event delegation**: instead of attaching a listener to every element, it attaches a single listener per event type at the root (in React 17+, the root container; previously `document`). When an event fires, it bubbles up to the root, React looks up the internal fiber tree to find which component owns the handler, and dispatches the synthetic event.

Benefits:
- **Performance**: Fewer actual DOM listeners (memory savings).
- **New components**: No need to re-attach listeners when components mount — they just register their handlers with React's internal system.
- **Consistent behavior**: Works uniformly across all components.

This is why `e.stopPropagation()` in React doesn't stop native handlers on non-React elements outside the React root, and why `e.nativeEvent.stopImmediatePropagation()` is needed for that.

#### Code Example / Key Takeaways
```jsx
// One listener on root handles ALL onClick in the tree
// React internally maps: fiber -> handlers
function App() {
  return (
    <div> {/* root container */}
      <Button /> {/* no real DOM listener added here */}
    </div>
  );
}
```
---

### Q30. What is the difference between passing a function vs a string as an event handler?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
In HTML you pass a **string** of code: `onclick="alert('hi')"`. In JSX you pass a **function reference**: `onClick={handleClick}`. Passing a string in JSX would just set the prop to a string and never be called. Passing a function means React will invoke it with a `SyntheticEvent` when the event fires.

A common mistake: `onClick={handleClick()}` (with parentheses) calls the function **immediately during render** and passes its *return value* as the handler — usually `undefined` or an unwanted result. Always pass the reference: `onClick={handleClick}`. If you need arguments, use an arrow: `onClick={() => handleClick(id)}`.

#### Code Example / Key Takeaways
```jsx
const handleClick = (id) => console.log(id);

// WRONG: invoked during render
<button onClick={handleClick(id)}>X</button>

// CORRECT: arrow preserves lazy invocation
<button onClick={() => handleClick(id)}>X</button>

// CORRECT: no-arg reference
<button onClick={handleClick}>X</button>
```
---

### Q31. How do you pass arguments to event handlers in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
You wrap the handler in an arrow function so it is called with both the event and your custom argument: `onClick={(e) => handle(id, e)}`. Two patterns:

1. **Inline arrow** (most common): `onClick={(e) => deleteItem(id, e)}`.
2. **`bind`**: `onClick={deleteItem.bind(this, id)}` (used historically with class components; arrow is cleaner now).

Avoid defining a new function on every render inside a large list if performance is critical — but for typical UIs the cost is negligible. If profiling shows issues, use a data attribute: read `e.target.dataset.id` inside one stable handler.

#### Code Example / Key Takeaways
```jsx
function List({ items, onDelete }) {
  return items.map(item => (
    <li key={item.id}>
      {item.name}
      <button onClick={(e) => onDelete(item.id, e)}>Delete</button>
    </li>
  ));
}
```
---

### Q32. Why does React use camelCase event names like `onClick` instead of `onclick`?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
React props are JavaScript identifiers, and JavaScript convention (and JSX) uses camelCase. Since JSX is essentially JavaScript, `onClick` must be camelCase to be valid and consistent with the rest of the JS ecosystem (`onMouseEnter`, `onKeyDown`). HTML attributes are case-insensitive and use lowercase (`onclick`), but in JSX you're writing JS expressions, not HTML strings — so the DOM `onclick` lowercase convention doesn't apply. React's event system maps these camelCase props to the correct native event types internally.

#### Code Example / Key Takeaways
```jsx
// Valid JSX (camelCase)
<button onClick={fn} onMouseEnter={fn} onKeyDown={fn}>X</button>

// INVALID in JSX (this would be treated as unknown prop / not an event)
// <button onclick={fn}>X</button>
```
---

### Q33. What is `React.createElement` signature and return value?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Signature: `React.createElement(type, props, ...children)`.

- `type`: a string (`'div'`) for host elements, or a function/class component, or another React element type (Fragment, etc.).
- `props`: an object of attributes; `null` or `undefined` is allowed (treated as empty). `key` and `ref` are special — extracted out, not in `props`.
- `children`: any number of child elements, strings, or arrays, flattened into `props.children`.

Return value: a **React element** object: `{ $$typeof: Symbol.for('react.element'), type, key, ref, props, _owner }`. It is a plain description of the UI — not a rendered instance. React uses it to build the fiber tree during render.

#### Code Example / Key Takeaways
```jsx
const el = React.createElement('button', { className: 'btn' }, 'Click');
// = JSX: <button className="btn">Click</button>
// el = {
//   $$typeof: Symbol(react.element),
//   type: 'button',
//   key: null, ref: null,
//   props: { className: 'btn', children: 'Click' }
// }
```
---

### Q34. What is `$$typeof` on a React element and why does it exist?
**Difficulty:** `Advanced`
**Category:** React Basics & JSX

#### Answer
`$$typeof` is a property on every React element set to `Symbol.for('react.element')`. Its purpose is **security/XSS protection**. 

When React renders, it trusts the structure you give it. If an attacker could inject a plain JSON object that *looks* like a React element (e.g., `{ type: 'div', props: {...} }`), React might treat it as a valid element and render it — a classic XSS vector via `JSON.parse` from an untrusted API.

Because `Symbol.for('react.element')` **cannot be recreated via JSON** (Symbols don't survive serialization), a malicious object from `JSON.parse` will never have a valid `$$typeof`, and React will throw instead of rendering it. This is a deliberate guard against server-injected fake elements.

#### Code Example / Key Takeaways
```jsx
const el = <div>hi</div>;
console.log(el.$$typeof); // Symbol(react.element)
console.log(el.$$typeof === Symbol.for('react.element')); // true

// Attacker JSON cannot forge this:
const fake = JSON.parse('{"type":"script","props":{"dangerouslySetInnerHTML":{"__html":"<script>evil</script>"}}}');
// fake.$$typeof === undefined -> React rejects it
```
---

### Q35. Explain the difference between the classic and automatic JSX runtime.
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
**Classic runtime** (pre-React 17 default): JSX compiles to `React.createElement(...)`, so `React` must be in scope in every file using JSX. This led to the ubiquitous `import React from 'react'` even when you never referenced `React` directly.

**Automatic runtime** (React 17+ default in modern toolchains): The compiler auto-imports from `react/jsx-runtime` (functions `jsx`, `jsxs`, `Fragment`). You no longer need to import `React` just to use JSX. This reduces bundle size slightly and removes a common source of "React is not defined" errors.

Modern tools (Babel `preset-react` with `runtime: 'automatic'`, Next.js, Vite, Create React App) use automatic by default. The produced elements are functionally identical.

#### Code Example / Key Takeaways
```jsx
// Automatic runtime: NO need to import React
export function Hi() {
  return <h1>Hello</h1>;
}
// compiles to: import { jsx } from "react/jsx-runtime";
//   jsx("h1", { children: "Hello" });

// Classic runtime: requires React in scope
import React from 'react';
export function Hi() { return <h1>Hello</h1>; }
```
---

### Q36. How does React render a component for the first time (mount)?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
On mount:
1. **Render phase**: React calls the component function (or `render()` for class), producing a tree of React elements. It recursively reconciles these against "nothing" (the empty tree) and builds the fiber tree, marking each fiber with an effect (e.g., `Placement`).
2. **Commit phase**: React takes the finished work and applies it to the real DOM in one synchronous pass — inserting new nodes, running `useLayoutEffect`/`componentDidMount`.
3. **Browser paint**: The browser paints the updated DOM.
4. **Passive effects**: `useEffect` callbacks run asynchronously after paint.

The render phase is pure and may be interrupted (concurrent mode); the commit phase is synchronous and not interruptible.

#### Code Example / Key Takeaways
```jsx
function App() {
  React.useEffect(() => {
    console.log('passive effect (after paint)');
  }, []);
  React.useLayoutEffect(() => {
    console.log('layout effect (before paint)');
  }, []);
  console.log('render');
  return <h1>Hi</h1>;
}
// Order on mount: render -> layout effect -> paint -> passive effect
```
---

### Q37. What is the difference between the render phase and the commit phase?
**Difficulty:** `Advanced`
**Category:** React Basics & JSX

#### Answer
- **Render phase** (reconciliation): React calls component bodies and `render()`, diffs the new element tree against the previous, and decides what changes are needed. It is **pure and can be paused, abandoned, or restarted** (especially in concurrent mode). No DOM mutations happen here.
- **Commit phase**: React applies the computed changes to the real DOM (insertions, updates, deletions), then runs layout effects and, after paint, passive effects. It is **synchronous and not interruptible** — once a commit starts, it must finish to keep the UI consistent.

Implication: never put side effects (network calls, subscriptions) in the render phase (component body). Use `useEffect`/`useLayoutEffect`. Side effects in render can run multiple times due to interruptions.

#### Code Example / Key Takeaways
```jsx
function Bad() {
  // SIDE EFFECT IN RENDER - runs twice in StrictMode, may be interrupted
  fetch('/api').then(r => r.json()); // never do this
  return <div />;
}

function Good() {
  React.useEffect(() => {            // side effect in commit phase
    fetch('/api').then(r => r.json());
  }, []);
  return <div />;
}
```
---

### Q38. What does "React re-renders a component" actually mean?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
"Re-render" means React **calls the component function again** (or `render()`), producing a new React element tree. It does NOT mean the DOM is updated directly. After the function returns, React reconciles the new tree against the previous one and applies only the *differences* to the real DOM.

Key clarifications:
- Re-render != DOM update. A re-render may produce identical output and result in zero DOM mutations (React bails out where possible, although it still ran the function).
- A component re-renders when its state changes, its parent re-renders (unless memoized), or its context value changes.
- "Render" is cheap; the expensive part is the reconeneration + DOM writes, which React optimizes.

#### Code Example / Key Takeaways
```jsx
function Child({ value }) {
  console.log('Child rendered'); // logs on every parent render
  return <p>{value}</p>;
}

function Parent() {
  const [n, setN] = React.useState(0);
  return (
    <div>
      <button onClick={() => setN(n + 1)}>inc</button>
      <Child value="static" /> {/* re-renders too, though value unchanged */}
    </div>
  );
}
```
---

### Q39. Why can't you use `if` statements or loops directly inside JSX?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
JSX is an expression that compiles to a function call returning an element. Inside JSX, the `{ }` braces accept a **JavaScript expression** (something that evaluates to a value), not a statement. `if`, `for`, `while` are statements and cannot appear directly inside `{ }`. 

To use conditional logic, use expressions: ternaries, `&&`, or compute a variable beforehand. To repeat, use `.map()` (an expression returning an array) rather than `for`. You *can* use `if`/`for` in the **component body** outside JSX — that's the correct place for statements.

#### Code Example / Key Takeaways
```jsx
function List({ items }) {
  // OK: statements go in the body
  const rows = [];
  for (const item of items) {
    rows.push(<li key={item.id}>{item.text}</li>);
  }

  // OK inside JSX: .map is an expression
  return <ul>{items.map(i => <li key={i.id}>{i.text}</li>)}</ul>;

  // WRONG inside JSX: if/for are statements
  // return <ul>{ for (...) {} }</ul>;
}
```
---

### Q40. What can you put inside `{ }` in JSX?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
Inside `{ }` you can place **any JavaScript expression** that evaluates to a value:
- Variables: `{name}`
- Function calls: `{formatDate(date)}`
- Ternaries: `{isLoading ? <Spinner /> : <Content />}`
- `&&` / `||`: `{items.length && <List items={items} />}`
- Objects/arrays: `{style}` (as a prop), `{children}` (nested)
- Template literals: `{'Hello ' + name}`

You CANNOT place statements (`if`, `for`, `const x = 1`), but you can wrap statements in an IIFE if desperate (not recommended). Also `undefined`, `null`, `true`, `false` render nothing — useful for conditional rendering.

#### Code Example / Key Takeaways
```jsx
const user = { name: 'Ada', roles: ['admin', 'editor'] };

function Card() {
  return (
    <div className="card">
      <h2>{user.name}</h2>                    {/* variable */}
      <p>{user.name.toUpperCase()}</p>        {/* method call */}
      <p>{`Hello, ${user.name}`}</p>          {/* template literal */}
      {user.roles.length > 0 && <Badge />}   {/* logical && */}
      {user.roles.map(r => <span key={r}>{r}</span>)} {/* array from map */}
    </div>
  );
}
```
---

### Q41. What are the rules of JSX?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
1. **Single root element**: A component must return exactly one parent element (or Fragment). JSX cannot return multiple siblings without a wrapper.
2. **Close all tags**: Self-close (`<img />`) or have a closing tag (`<div></div>`). No unclosed tags.
3. **camelCase for attributes**: `className`, `htmlFor`, `onClick`, `tabIndex`, not `class`, `for`, `onclick`.
4. **Expressions in `{ }`**: Only JavaScript expressions, no statements.
5. **Keys for lists**: Each item in a list needs a unique `key` prop on the top-level element.
6. **HTML entities**: Use Unicode or numbers (`©` or `&copy;`) not `&copy;` directly in text (JSX is not HTML).
7. **Comments**: Use `{/* comment */}` inside JSX children, not `<!-- -->`.

#### Code Example / Key Takeaways
```jsx
function App() {
  return (
    <>           // Fragment: single root without extra DOM node
      <input className="input" htmlFor="name" />
      <button onClick={fn} tabIndex={0}>Go</button>
      {items.map(i => <li key={i.id}>{i.name}</li>)}
    </>
  );
}
```
---

### Q42. What is the difference between `className` and `class` in JSX?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
`class` is a reserved keyword in JavaScript (ES6 classes). Since JSX compiles to JavaScript, you cannot use `class` as a prop name. React uses `className` instead, which maps directly to the DOM `class` attribute. Similarly, `for` becomes `htmlFor` (because `for` is a loop keyword). This is a JSX-to-JS compilation constraint, not a React runtime constraint.

#### Code Example / Key Takeaways
```jsx
// WRONG: 'class' is a reserved word in JS
// <div class="box">Hi</div>

// CORRECT:
<div className="box">Hi</div>

// CORRECT for <label>:
<label htmlFor="input-id">Label</label>
```
---

### Q43. What is `children` in React and how does it work?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
`children` is a special prop automatically populated with whatever content you place between a component's opening and closing tags. It enables **component composition** — a parent passes arbitrary content to a child component, which decides where to render it.

`children` can be a single element, an array of elements, a string, number, or even a function (render props pattern). React provides `React.Children` utilities to iterate/manipulate it safely without assuming its type.

#### Code Example / Key Takeaways
```jsx
function Card({ children, title }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="content">{children}</div>
    </div>
  );
}

// Usage: content between tags becomes children
<Card title="Welcome">
  <p>This is the children!</p>
  <button>Click</button>
</Card>

// Inside Card, children = [<p>..., <button>...]
```
---

### Q44. What is prop drilling and why can it be a problem?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Prop drilling means passing data through multiple layers of components just so a deeply nested component can use it. The intermediate components don't need the data; they merely forward it.

Problems:
- Components become tightly coupled to data they don't use.
- Refactoring becomes harder because many component signatures change.
- Reusable components become less reusable because they accept irrelevant props.

Solutions depend on scale:
- For 1-2 levels: props are fine — don't over-engineer.
- For many levels or global-ish data: use Context, state management, or component composition (pass the ready-made child instead of raw props).

#### Code Example / Key Takeaways
```jsx
// Prop drilling: Layout and Sidebar don't care about user, but must forward it
function App() { return <Layout user={user} />; }
function Layout({ user }) { return <Sidebar user={user} />; }
function Sidebar({ user }) { return <UserAvatar user={user} />; }

// Composition alternative:
function App() {
  return <Layout sidebar={<UserAvatar user={user} />} />;
}
function Layout({ sidebar }) { return <aside>{sidebar}</aside>; }
```
---

### Q45. What is lifting state up in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
Lifting state up means moving state from a child component to the closest common parent so multiple sibling components can share it. Since React data flows down through props, siblings cannot directly share state. The parent owns the state and passes values/callbacks down.

Use it when two or more components need to read or update the same data. Don't lift state higher than necessary; putting everything at the top causes unnecessary re-renders and makes data flow harder to follow.

#### Code Example / Key Takeaways
```jsx
function Parent() {
  const [text, setText] = React.useState('');
  return (
    <>
      <Input value={text} onChange={setText} />
      <Preview value={text} />
    </>
  );
}
function Input({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}
function Preview({ value }) { return <p>{value}</p>; }
```
---

### Q46. What is one-way data flow in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
One-way data flow means data moves from parent to child via props, never upward directly. A child can request a change by calling a function prop, but the parent decides whether and how to update state. After the parent state changes, new props flow downward again.

This model makes UIs predictable: for any state, the rendered UI is deterministic. It also makes debugging easier because you can trace data from its source downward through the component tree.

#### Code Example / Key Takeaways
```jsx
function Parent() {
  const [count, setCount] = React.useState(0);
  return <Child count={count} onIncrement={() => setCount(c => c + 1)} />;
}
function Child({ count, onIncrement }) {
  return <button onClick={onIncrement}>{count}</button>;
}
// Child does not mutate Parent's state; it asks Parent to update via callback
```
---

### Q47. What does it mean that React components should be pure?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
A pure component returns the same JSX for the same props/state and does not cause side effects during render. Rendering should be a calculation, not an action. This matters because React may render components multiple times, skip commits, or restart renders under Strict Mode and concurrent rendering.

Avoid in render:
- Mutating props/state/global variables
- Network requests
- Subscriptions
- Timers
- DOM manipulation
- Random IDs without stable hooks

Side effects belong in event handlers or effects (`useEffect`, `useLayoutEffect`).

#### Code Example / Key Takeaways
```jsx
// Bad: mutation in render
function Bad({ items }) {
  items.push('extra');
  return <ul>{items.map(x => <li key={x}>{x}</li>)}</ul>;
}

// Good: derive new values without mutating input
function Good({ items }) {
  const displayItems = [...items, 'extra'];
  return <ul>{displayItems.map(x => <li key={x}>{x}</li>)}</ul>;
}
```
---

### Q48. What is Strict Mode in React?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
`React.StrictMode` is a development-only wrapper that helps detect unsafe patterns. It does not render UI and has no production effect. In React 18, Strict Mode intentionally double-invokes certain functions (component render, state initializer, effect setup/cleanup) in development to expose accidental side effects.

It helps detect:
- Impure rendering
- Missing effect cleanup
- Deprecated APIs
- Unsafe lifecycle methods
- Legacy string refs

If code breaks under Strict Mode, the code likely has side effects in the wrong place or missing cleanup.

#### Code Example / Key Takeaways
```jsx
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// In dev, effects may run setup -> cleanup -> setup to verify cleanup logic
```
---

### Q49. What is the difference between `null`, `false`, `undefined`, and an empty string in JSX rendering?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
React renders `null`, `undefined`, `true`, and `false` as nothing. Numbers and strings render as text nodes. This is why conditional rendering often returns `null` to show nothing.

Gotchas:
- `0` renders visibly as `0`, so `count && <Badge />` can accidentally render `0`.
- Empty string `''` technically renders an empty text node, usually invisible.
- Returning `undefined` from a component is allowed in modern React, but returning `null` is clearer and intentional.

#### Code Example / Key Takeaways
```jsx
function Demo({ count }) {
  return (
    <div>
      {false}{null}{undefined}{true} {/* renders nothing */}
      {0}                            {/* renders 0 */}
      {count > 0 && <span>{count}</span>} {/* safe */}
    </div>
  );
}
```
---

### Q50. How do you render lists in React?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
Lists are rendered by transforming an array of data into an array of React elements, usually using `.map()`. Each rendered item must have a stable `key` prop so React can track identity across re-renders.

Avoid mutating the source array in render (`sort`, `reverse`, `splice`) unless you copy it first, because props/state should be immutable. Use `filter`, `map`, and `slice` which return new arrays.

#### Code Example / Key Takeaways
```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}

// Sort safely: copy first
const sorted = [...todos].sort((a, b) => a.text.localeCompare(b.text));
```
---

### Q51. What is the purpose of `key` beyond removing warnings?
**Difficulty:** `Advanced`
**Category:** React Basics & JSX

#### Answer
A key defines a component's identity among siblings. React uses it to decide whether to preserve an existing fiber and its state or unmount it and mount a new one. Therefore changing a key intentionally resets all state in that subtree; keeping a key preserves it. Keys are reconciliation hints, not props delivered to the component.

#### Code Example / Key Takeaways
```jsx
function Form({ userId }) {
  return <UserForm key={userId} userId={userId} />; // reset form when user changes
}
```
---

### Q52. Why does React not pass `key` and `ref` through props?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
`key` and `ref` are special fields consumed by React's reconciler and ref system. They are metadata about an element, not ordinary component input, so React removes them before constructing `props`. Reading `props.key` or `props.ref` produces a warning. If a component needs the value, pass a separately named prop.

#### Code Example / Key Takeaways
```jsx
function Row({ id }) { return <div>{id}</div>; }
<Row key={item.id} id={item.id} />; // key identifies; id is component data
```
---

### Q53. How can changing a key reset component state?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
State belongs to a component's position and identity in the rendered tree. A different key gives React a different identity, so it unmounts the old component and mounts a fresh one. This is useful for clearing forms or restarting animations, but accidental key changes lose state and effects.

#### Code Example / Key Takeaways
```jsx
function App({ userId }) {
  return <ChatInput key={userId} />; // fresh draft for each user
}
```
---

### Q54. What is conditional component mounting versus hiding?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
`{open && <Panel />}` unmounts Panel when false: its state is destroyed and effects clean up. Rendering `<Panel hidden={!open} />` keeps it mounted, preserving state and effects while CSS/HTML hides it. Choose unmounting for expensive or inactive content; choose hiding when preserving user input or subscriptions is required.

#### Code Example / Key Takeaways
```jsx
{open ? <Editor /> : null}       // unmounts
<Editor hidden={!open} />        // remains mounted
```
---

### Q55. What is the difference between an element type and an element instance?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
A type is the component function/class or host tag such as `'div'`; an element is the immutable description created by JSX. React creates and tracks runtime fibers internally when elements mount. You normally work with elements and components, not instances.

#### Code Example / Key Takeaways
```jsx
function Button() { return <button>OK</button>; }
const element = <Button />; // description
// Button is the type; React creates its internal mounted fiber
```
---

### Q56. Why must component names start with an uppercase letter?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
JSX uses capitalization to distinguish user components from intrinsic DOM tags. `<button>` compiles with the string type `'button'`, while `<Button>` compiles with the variable `Button`. Lowercase custom names are treated as unknown HTML tags and won't invoke the component function.

#### Code Example / Key Takeaways
```jsx
function Profile() { return <p>Profile</p>; }
<Profile />; // component
<profile />; // treated as an intrinsic tag, not Profile
```
---

### Q57. How do you spread props in JSX?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
`<Component {...obj} />` copies enumerable properties from `obj` into props. Explicit props after the spread override earlier values; therefore spread order matters. Avoid blindly forwarding unknown props to DOM elements because React may warn or create invalid attributes. Destructure and forward only intended values at component boundaries.

#### Code Example / Key Takeaways
```jsx
const common = { type: 'button', disabled: false };
<button {...common} disabled={isBusy}>Save</button> // explicit wins
```
---

### Q58. What is the difference between `defaultValue` and `value`?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
`value` makes an input controlled: React remains the source of truth and must update it through `onChange`. `defaultValue` sets only the initial DOM value; afterward the browser owns it, making the input uncontrolled. Changing `defaultValue` after mount does not update the current value.

#### Code Example / Key Takeaways
```jsx
<input value={name} onChange={e => setName(e.target.value)} />
<input defaultValue="Initial" ref={inputRef} />
```
---

### Q59. Why is a file input always uncontrolled?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Browsers prohibit scripts from setting a file input's selected path for security and privacy. React therefore cannot control its `value`; use a ref and read `input.files` after a change or submit event. You can reset it by changing the DOM value to an empty string or remounting with a new key.

#### Code Example / Key Takeaways
```jsx
function Upload() {
  const ref = React.useRef(null);
  return <input type="file" ref={ref} onChange={() => console.log(ref.current.files)} />;
}
```
---

### Q60. How does React handle boolean and custom attributes?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
Boolean DOM properties use JSX booleans: `<button disabled={true}>`. For a boolean attribute, `disabled` is present when true and omitted when false. Custom data and accessibility attributes retain lowercase hyphenated spelling (`data-id`, `aria-label`). Unknown ordinary attributes are supported in modern React but should represent valid HTML or data.

#### Code Example / Key Takeaways
```jsx
<button disabled={loading} aria-label="Save" data-testid="save">Save</button>
```
---

### Q61. What is the difference between `onChange` in React and HTML?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
React's `onChange` is normalized to provide immediate updates for text inputs as the user types, unlike traditional HTML's change event which historically fires on blur for text fields. For checkboxes, use `e.target.checked`; for text controls, use `e.target.value`. React still exposes a synthetic event with standard cancellation and propagation methods.

#### Code Example / Key Takeaways
```jsx
<input value={text} onChange={e => setText(e.target.value)} />
<input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />
```
---

### Q62. How do `preventDefault` and `stopPropagation` differ?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
`preventDefault()` cancels the browser's default action, such as following a link or submitting a form. `stopPropagation()` prevents the event from traveling to ancestor handlers during capture/bubble phases. They solve different problems and can be used together. Neither stops other handlers on the same element in every native scenario; `stopImmediatePropagation` is a lower-level native API.

#### Code Example / Key Takeaways
```jsx
<form onSubmit={e => { e.preventDefault(); save(); }}>
  <button type="submit">Save</button>
</form>
<div onClick={() => console.log('parent')}>
  <button onClick={e => { e.stopPropagation(); }}>Child</button>
</div>
```
---

### Q63. What are capture and bubble phases in React events?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
An event travels down the tree in the capture phase, reaches its target, then travels upward in the bubble phase. React's normal `onClick` handlers run during bubbling. Appending `Capture` (`onClickCapture`) runs during capture, before the target and bubble handlers. Capture is useful for global logging or policies that must observe events before children stop propagation.

#### Code Example / Key Takeaways
```jsx
<div onClickCapture={() => console.log('capture')} onClick={() => console.log('bubble')}>
  <button onClick={() => console.log('target')}>Go</button>
</div>
// capture -> target -> bubble
```
---

### Q64. How do you handle keyboard events accessibly?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Prefer native interactive elements (`button`, `a`, `input`) because browsers provide keyboard and accessibility behavior automatically. Use `onKeyDown`/`onKeyUp` only when needed, inspect `event.key`, and avoid replacing a button with a clickable `div`. If a custom widget is unavoidable, provide focusability, appropriate ARIA roles, and equivalent keyboard behavior.

#### Code Example / Key Takeaways
```jsx
<button onKeyDown={e => e.key === 'Escape' && close()} onClick={close}>Close</button>
```
---

### Q65. What is a ref and how does it differ from state?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
A ref (`useRef`) stores a mutable value whose changes do not trigger re-renders. Its `.current` survives renders and is commonly used for DOM nodes, timers, previous values, and imperative APIs. State is for data that affects displayed output; refs are for values React doesn't need to render.

#### Code Example / Key Takeaways
```jsx
function Focus() {
  const input = React.useRef(null);
  return <><input ref={input} /><button onClick={() => input.current.focus()}>Focus</button></>;
}
```
---

### Q66. What is `React.memo` and when should it be used?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
`React.memo` wraps a function component and skips rendering it when its props are shallowly equal to the previous props. It is a performance optimization, not a correctness feature. It does not prevent re-renders from the component's own state or consumed context, and a new object/function prop each render defeats shallow equality.

Use it after profiling shows a frequently rendered, expensive child receives unchanged props. Do not wrap every component by default; the comparison itself and code complexity have costs.

#### Code Example / Key Takeaways
```jsx
const ListItem = React.memo(function ListItem({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});
```
---

### Q67. What is the difference between `useMemo` and `React.memo`?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
`React.memo(Component)` memoizes a **component's render** based on its props. `useMemo(factory, deps)` memoizes a **computed value inside a component** until dependencies change. Neither should be used to make code correct; both are optimizations and may be removed if the value is not expensive or stable identity is unnecessary.

#### Code Example / Key Takeaways
```jsx
const Chart = React.memo(function Chart({ points }) { return <svg />; });
function Dashboard({ data }) {
  const sorted = React.useMemo(() => [...data].sort(byDate), [data]);
  return <Chart points={sorted} />;
}
```
---

### Q68. How can unnecessary re-renders happen in a React tree?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
A component re-renders when its state changes, its parent renders, or a consumed context value changes. Common avoidable causes include creating new object/array/function props on every parent render, putting state too high in the tree, changing keys, and broad context values that update frequently. A re-render is not automatically a bug; measure with the Profiler before optimizing.

#### Code Example / Key Takeaways
```jsx
function Parent({ theme }) {
  const [count, setCount] = React.useState(0);
  const options = React.useMemo(() => ({ theme }), [theme]);
  const onSave = React.useCallback(() => save(), []);
  return <ExpensiveChild options={options} onSave={onSave} />;
}
```
---

### Q69. What is `ReactDOM.createRoot` and how does it differ from `ReactDOM.render`?
**Difficulty:** `Basic`
**Category:** React Basics & JSX

#### Answer
`createRoot` is the React 18 client entry point and enables the concurrent renderer and React 18 features such as automatic batching and transitions. `ReactDOM.render` is the legacy React 17 API; it remains for compatibility but opts the tree into legacy behavior and is deprecated for new applications. A root should normally be created once per DOM container.

#### Code Example / Key Takeaways
```jsx
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
// Later: root.unmount();
```
---

### Q70. What is automatic batching in React 18?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
Batching groups multiple state updates into one render. React 18 with `createRoot` extends automatic batching beyond React event handlers to timeouts, promises, and native events. This reduces work and avoids intermediate UI states. If an update must be committed synchronously (rare), `flushSync` can opt out, but it should not be used casually because it blocks scheduling.

#### Code Example / Key Takeaways
```jsx
function Example() {
  const [a, setA] = React.useState(0);
  const [b, setB] = React.useState(0);
  function later() {
    setTimeout(() => {
      setA(x => x + 1);
      setB(x => x + 1); // one render in React 18 createRoot
    }, 0);
  }
  return <button onClick={later}>{a + b}</button>;
}
```
---

### Q71. What is `useTransition` and how does it affect rendering priority?
**Difficulty:** `Advanced`
**Category:** React Basics & JSX

#### Answer
`useTransition` marks state updates as non-urgent. Urgent updates such as typing remain responsive while React works on the transition in the background. It returns `isPending` and `startTransition`. Transition updates can be interrupted and restarted; they are not a replacement for debouncing network requests or for showing a loading state.

#### Code Example / Key Takeaways
```jsx
function Search({ items }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState(items);
  const [isPending, startTransition] = React.useTransition();
  function change(e) {
    const value = e.target.value;
    setQuery(value); // urgent: keep input responsive
    startTransition(() => setResults(filter(items, value))); // non-urgent
  }
  return <><input value={query} onChange={change} />{isPending && <span>Updating...</span>}</>;
}
```
---

### Q72. What is `useDeferredValue` and when might it help?
**Difficulty:** `Advanced`
**Category:** React Basics & JSX

#### Answer
`useDeferredValue(value)` returns a deferred version of a value that may lag behind the current one while urgent work (such as typing) stays responsive. React first renders with the old deferred value, then updates the expensive consumer at lower priority. It is useful when you don't control the state update that produces the value; use `useTransition` when you do control the update.

#### Code Example / Key Takeaways
```jsx
function SearchResults({ query }) {
  const deferredQuery = React.useDeferredValue(query);
  const results = useMemo(() => expensiveFilter(deferredQuery), [deferredQuery]);
  return <Results items={results} />;
}
```
---

### Q73. What is an Error Boundary and why is it relevant to component trees?
**Difficulty:** `Intermediate`
**Category:** React Basics & JSX

#### Answer
An Error Boundary is a class component that catches JavaScript errors during rendering, lifecycle methods, and constructors in its descendant tree, then displays fallback UI and can log the error. It does not catch errors in event handlers, asynchronous callbacks, server rendering, or errors thrown by the boundary itself; handle those separately.

Boundaries isolate failures so one broken panel does not blank the whole application. Place them around meaningful independent UI regions.

#### Code Example / Key Takeaways
```jsx
class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { report(error, info); }
  render() { return this.state.error ? <p>Failed to load.</p> : this.props.children; }
}
```
---

### Q74. How does React handle an element type change during reconciliation?
**Difficulty:** `Advanced`
**Category:** React Basics & JSX

#### Answer
If an element's type changes at the same tree position — for example, from `<Counter />` to `<Other />`, or `<div>` to `<span>` — React treats the old subtree and new subtree as unrelated. It unmounts the old tree (running cleanup and losing state) and mounts the new one. If the type stays the same, React updates props and reconciles descendants, preserving state where identity/keys match.

#### Code Example / Key Takeaways
```jsx
function Screen({ compact }) {
  // toggling type remounts the subtree
  return compact ? <CompactPanel /> : <FullPanel />;
}
```
---

### Q75. What are the most important Core React and JSX principles to remember?
**Difficulty:** `Advanced`
**Category:** React Basics & JSX

#### Answer
A strong interview summary is:
- Describe UI declaratively; React reconciles element trees and commits minimal DOM changes.
- JSX is syntax that compiles to `createElement` or the automatic JSX runtime.
- Components should be pure; put side effects in event handlers/effects.
- Props flow down and are read-only; state is owned and updated through setters.
- Treat state and props as immutable so reference equality and memoization remain reliable.
- Use stable, data-derived keys for lists; indexes are unsafe for mutable lists.
- Use controlled inputs when React needs to own form state; refs/uncontrolled inputs when the DOM should own it.
- Fragments group siblings without extra DOM; explicit fragments are required for keyed fragment lists.
- React events use camelCase handlers and SyntheticEvents, with capture and bubbling behavior.
- Optimize only after measuring; Fiber, batching, transitions, and memoization help, but correctness and clear data flow come first.

#### Code Example / Key Takeaways
```jsx
function TodoApp({ initialTodos }) {
  const [todos, setTodos] = React.useState(initialTodos);
  const [text, setText] = React.useState('');

  function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setTodos(prev => [...prev, { id: crypto.randomUUID(), text }]);
    setText('');
  }

  return (
    <>
      <form onSubmit={add}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
      </ul>
    </>
  );
}
```
---
