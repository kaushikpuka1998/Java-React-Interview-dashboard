# React State Management & Data Fetching Ecosystem

## Interview Questions Q301-Q370

---

### Q301. What is the difference between local state and global state in React?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
Local state is managed within a single component using `useState` or `useReducer` and is only accessible to that component and its children via props. Global state is shared across multiple components in the application, typically managed through Context API or external state management libraries. Local state is ideal for UI-specific concerns like form inputs or toggle states, while global state suits user authentication, themes, or data shared across distant components.

#### Code Example / Key Takeaways
```jsx
// Local state - component-specific
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// Global state via Context
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState({ name: 'John' });
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Dashboard />
    </UserContext.Provider>
  );
}

function Profile() {
  const { user } = useContext(UserContext);
  return <h1>{user.name}</h1>;
}
```
---

### Q302. When should you use Context API versus a dedicated state management library?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Use Context API for low-frequency updates (theme, authentication, locale) where many components need access to rarely-changing data. Avoid Context for high-frequency updates because every consumer re-renders when the context value changes, and you cannot selectively subscribe to parts of the value. Dedicated libraries (Redux, Zustand, Jotai) are better for complex state logic, frequent updates, middleware needs, derived/atomic state, and debugging tools. Reach for Context first for simplicity, then escalate to a library when you hit re-render or scaling pain.

#### Code Example / Key Takeaways
```jsx
// Context: good for static-ish, global config
const ThemeContext = createContext('light');
function Toolbar() {
  const theme = useContext(ThemeContext); // re-renders on any provider value change
  return <div className={theme}>...</div>;
}

// Zustand: selective subscription avoids unnecessary re-renders
const useBearStore = create((set) => ({
  bears: 0,
  fish: 10,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
}));
function BearCount() {
  const bears = useBearStore((s) => s.bears); // only re-renders when bears changes
  return <span>{bears}</span>;
}
```
---

### Q303. What are the main limitations of Context API for state management?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Context has three key limitations: (1) Re-render scope — any change to the provider's value re-renders all consuming components, with no built-in selector to subscribe to a slice. (2) No middleware or side-effect handling — you cannot intercept updates for logging, async, or devtools. (3) Performance and splitting complexity — to mitigate re-renders you must split contexts or memoize, which adds boilerplate. Context is not a replacement for a full store; it's a dependency-injection mechanism.

#### Code Example / Key Takeaways
```jsx
// Problem: changing count re-renders ThemeConsumer too
const Ctx = createContext();
function Provider({ children }) {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState('light');
  return (
    <Ctx.Provider value={{ count, setCount, theme, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}
// Fix: split into separate providers so consumers subscribe narrowly
```
---

### Q304. What is Redux and what problem does it solve?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
Redux is a predictable state container for JavaScript apps based on three principles: a single source of truth (one store), state is read-only (changes only via dispatched actions), and changes are made with pure reducer functions. It solves managing complex shared state across large apps by centralizing it, making state changes traceable and debuggable (time-travel, action logging). It enforces a unidirectional data flow and is framework-agnostic but widely used with React.

#### Code Example / Key Takeaways
```jsx
// Three principles in action
const initialState = { count: 0 };
function counter(state = initialState, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }; // pure, no mutation
    default:
      return state;
  }
}
// Single store = single source of truth; dispatch actions to mutate
```
---

### Q305. Explain the core Redux data flow.
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
The unidirectional flow is: View dispatches an action -> Store passes the action and current state to the root reducer -> Reducer returns a new state -> Store updates and notifies subscribers -> View re-renders with new state. Actions are plain objects describing "what happened" with a `type`; reducers compute the next state. This makes every change explicit and replayable.

#### Code Example / Key Takeaways
```jsx
// 1. Action -> 2. Dispatch -> 3. Reducer -> 4. New State -> 5. Subscribers
store.dispatch({ type: 'ADD_TODO', payload: 'Learn Redux' });
// -> reducer(state, action) -> newState -> components subscribed re-render
```
---

### Q306. What is the difference between Redux Core and Redux Toolkit (RTK)?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Redux Core requires manual boilerplate: hand-written action types, action creators, switch statements in reducers, `combineReducers`, `applyMiddleware`, and configuring the store yourself. Redux Toolkit (RTK) is the official, opinionated wrapper that reduces boilerplate via `createSlice` (generates actions + reducer), `configureStore` (bundles thunk + devtools + good defaults), `createAsyncThunk`, and `createEntityAdapter`. RTK is the recommended approach for all new Redux code; Redux Core is essentially legacy.

#### Code Example / Key Takeaways
```jsx
// Redux Core (verbose)
const INCREMENT = 'INCREMENT';
const increment = () => ({ type: INCREMENT });
function reducer(s = { n: 0 }, a) {
  if (a.type === INCREMENT) return { n: s.n + 1 };
  return s;
}

// RTK (concise, same result)
const slice = createSlice({
  name: 'counter',
  initialState: { n: 0 },
  reducers: { increment: (s) => { s.n++; } },
});
```
---

### Q307. What is `createSlice` in Redux Toolkit and how does it work?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
`createSlice` takes a slice name, initial state, and an object of reducer functions, and automatically generates action creators and action types matching the reducer names. Internally it uses Immer, so you can "mutate" the draft state and it produces an immutable update. It returns `{ name, reducer, actions, caseReducers }`. This eliminates the manual action-type/creator boilerplate and keeps related logic together.

#### Code Example / Key Takeaways
```jsx
import { createSlice } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => {
      state.push(action.payload); // Immer allows "mutation"
    },
    toggle: (state, action) => {
      const todo = state.find(t => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
  },
});

export const { addTodo, toggle } = todosSlice.actions;
export default todosSlice.reducer;
```
---

### Q308. What is Immer and how does Redux Toolkit use it?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Immer is a library that lets you write "mutating" code which it transparently converts into immutable updates using structural sharing. RTK uses Immer inside `createSlice` reducers, so you can write `state.push(...)` or `state.value++` instead of spread operations, and Immer returns a new immutable state. This makes reducers far more concise and less error-prone while preserving immutability guarantees.

#### Code Example / Key Takeaways
```jsx
// Without Immer (manual immutable update)
return { ...state, user: { ...state.user, name: 'A' } };

// With Immer (inside RTK reducer)
reducers: {
  setName: (state, action) => { state.user.name = action.payload; }
}
// Immer produces a new immutable object automatically
```
---

### Q309. How do you configure the Redux store with Redux Toolkit's `configureStore`?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
`configureStore` accepts an object with `reducer` (a single reducer or an object map that it auto-combines), optional `middleware` (defaults include thunk + serializable-check + immutable-check + devtools), `preloadedState`, and `devTools`. Unlike the classic `createStore`, it bundles sensible defaults and warns about non-serializable state, making setup safer and shorter.

#### Code Example / Key Takeaways
```jsx
import { configureStore } from '@reduxjs/toolkit';
import todos from './todosSlice';
import user from './userSlice';

export const store = configureStore({
  reducer: { todos, user },
  devTools: process.env.NODE_ENV !== 'production',
});
// auto-combines reducers, adds thunk + devtools
```
---

### Q310. What is `combineReducers` and when is it needed?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
`combineReducers` merges multiple slice reducers into one root reducer, each managing its own slice of state keyed by name. With RTK's `configureStore` this is automatic when you pass an object map, so you rarely call `combineReducers` directly. It is needed when you want to split state management across feature modules and have each operate independently on its own sub-tree.

#### Code Example / Key Takeaways
```jsx
import { combineReducers } from '@reduxjs/toolkit';
const rootReducer = combineReducers({ todos, user, cart });
// state = { todos: [...], user: {...}, cart: {...} }
```
---

### Q311. What is Redux middleware and what is it used for?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Middleware is a layer between dispatching an action and the moment it reaches the reducer. It can intercept, modify, delay, or short-circuit actions. Common uses: handling async logic (Thunk, Saga), logging, crash reporting, analytics, and enforcing side-effect rules. Middleware is composed into a pipeline; each gets `(store) => (next) => (action) => {...}`.

#### Code Example / Key Takeaways
```jsx
// Custom logging middleware
const logger = (store) => (next) => (action) => {
  console.log('dispatching', action);
  const result = next(action);
  console.log('next state', store.getState());
  return result;
};
```
---

### Q312. Explain Redux Thunk and how it handles async logic.
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Redux Thunk is middleware that lets action creators return a function (a thunk) instead of a plain object. The function receives `dispatch` and `getState`, enabling async flows: perform a request, then dispatch real actions on success/failure. Thunk is included by default in RTK. It's the simplest async pattern but can become hard to test/track for complex flows (where Saga shines).

#### Code Example / Key Takeaways
```jsx
// Plain thunk (RTK includes thunk by default)
export const fetchUser = (id) => async (dispatch) => {
  dispatch(fetchStart());
  try {
    const res = await api.getUser(id);
    dispatch(fetchSuccess(res.data));
  } catch (e) {
    dispatch(fetchError(e.message));
  }
};
```
---

### Q313. What is `createAsyncThunk` in Redux Toolkit?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
`createAsyncThunk` creates a thunk that dispatches `pending`, `fulfilled`, and `rejected` lifecycle actions automatically based on a payload creator's promise. You then handle these in `extraReducers` of a slice via `builder.addCase`. It standardizes async state (`status`, `data`, `error`) and removes the need to write manual loading/error actions.

#### Code Example / Key Takeaways
```jsx
export const fetchPosts = createAsyncThunk(
  'posts/fetch',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.getPosts(userId);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const slice = createSlice({
  name: 'posts',
  initialState: { items: [], status: 'idle' },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchPosts.fulfilled, (s, a) => { s.status = 'idle'; s.items = a.payload; })
      .addCase(fetchPosts.rejected, (s, a) => { s.status = 'error'; s.error = a.payload; });
  },
});
```
---

### Q314. How do you handle loading and error states with `createAsyncThunk`?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Store a `status` (idle/loading/succeeded/failed) and `error` field in the slice. In `extraReducers`, set `status='loading'` on `pending`, set data and `status='succeeded'` on `fulfilled`, and set `error` and `status='failed'` on `rejected`. Components read these to render spinners and error messages. Optionally track `isLoading` per-entity, but a single status works for simple cases.

#### Code Example / Key Takeaways
```jsx
const { status, error, items } = useSelector(s => s.posts);
if (status === 'loading') return <Spinner />;
if (status === 'failed') return <Error msg={error} />;
return <List items={items} />;
```
---

### Q315. What is Redux Saga and how does it differ from Thunk?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Redux Saga uses generator functions to handle complex async side effects, listening for dispatched actions and reacting with `takeLatest`, `takeEvery`, `put`, `call`, `fork`. Unlike Thunk, which co-locates async logic inside action creators as plain functions, Saga decouples side effects into a separate, testable, declarative layer. Saga excels at complex sequences, cancellation, race conditions, and retries, but adds significant boilerplate. Use Thunk/RTK Query for simple async, Saga for orchestration-heavy flows.

#### Code Example / Key Takeaways
```jsx
import { takeLatest, call, put } from 'redux-saga/effects';

function* loadUser(action) {
  try {
    const user = yield call(api.getUser, action.payload);
    yield put(userLoaded(user));
  } catch (e) {
    yield put(userError(e.message));
  }
}
export function* userSaga() {
  yield takeLatest('user/fetch', loadUser); // decoupled from action creators
}
```
---

### Q316. What are the most common Redux Saga effect creators?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
`take`/`takeEvery`/`takeLatest` (wait for / listen to actions), `put` (dispatch action), `call` (call function, blocking), `fork`/`spawn` (non-blocking task), `select` (read state), `race` (run effects, take first to finish), `all` (run in parallel), `delay`/`cancel`. `takeLatest` cancels in-flight tasks for the same action, perfect for search-as-you-type; `all` parallelizes independent fetches.

#### Code Example / Key Takeaways
```jsx
function* root() {
  yield all([
    takeLatest('user/fetch', loadUser),
    takeEvery('log/event', logEvent),
  ]);
}
function* parallel() {
  const [a, b] = yield all([call(fetchA), call(fetchB)]); // runs concurrently
}
```
---

### Q317. When would you choose Redux Saga over RTK Query or Thunk?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Choose Saga when you need complex orchestration: long-running background tasks, cancellation (e.g., debounced search), race conditions, retries with backoff, websocket/event-stream handling, or coordinating multiple dependent side effects. For plain server-state fetching and caching, RTK Query is simpler and handles caching/invalidation for you. For straightforward request-then-dispatch, Thunk suffices. Saga's cost is boilerplate and a steeper learning curve.

#### Code Example / Key Takeaways
```jsx
// Debounced search with cancellation - Saga's strength
function* searchSaga() {
  yield debounce(300, 'search/run', function* (action) {
    const results = yield call(api.search, action.payload);
    yield put(searchDone(results));
  });
}
```
---

### Q318. What is RTK Query and what problem does it solve?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
RTK Query (RTKQ) is RTK's data-fetching and caching layer. It eliminates hand-written data-fetching reducers, thunks, loading/error state, and caching logic by auto-generating hooks (`useGetPostsQuery`). It manages caching, deduplication, background refetch, invalidation, and request lifecycle for you. It's designed for server state (data that lives on the server), not client UI state.

#### Code Example / Key Takeaways
```jsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (build) => ({
    getPosts: build.query({ query: () => 'posts' }),
  }),
});
// Generates: useGetPostsQuery()
```
---

### Q319. How do you create an API slice with `createApi` in RTK Query?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
`createApi` requires `reducerPath`, a `baseQuery` (e.g., `fetchBaseQuery`), and `endpoints` where you define `query` (GET) and `mutation` (POST/PUT/DELETE) endpoints returning hooks. You must add the generated reducer to the store under `reducerPath` and include `api.middleware` in the middleware chain. Each endpoint auto-generates a hook like `useGetXQuery`.

#### Code Example / Key Takeaways
```jsx
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post'],
  endpoints: (build) => ({
    getPosts: build.query({ query: () => '/posts', providesTags: ['Post'] }),
    addPost: build.mutation({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: ['Post'],
    }),
  }),
});
export const { useGetPostsQuery, useAddPostMutation } = api;
```
---

### Q320. How do RTK Query auto-generated hooks work?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
For each endpoint, RTKQ generates a React hook (e.g., `useGetPostsQuery()` or `useAddPostMutation()`). The query hook returns `{ data, isLoading, isFetching, isError, error, refetch }`. The mutation hook returns `[trigger, { data, isLoading, isSuccess }]`. Under the hood they subscribe to the cache via `useSelector` and dispatch fetch lifecycle actions. Calling a query hook triggers a fetch if data isn't cached.

#### Code Example / Key Takeaways
```jsx
function Posts() {
  const { data, isLoading, isError } = useGetPostsQuery();
  const [addPost, { isLoading: saving }] = useAddPostMutation();
  if (isLoading) return <Spinner />;
  return <button onClick={() => addPost({ title: 'Hi' })}>Add</button>;
}
```
---

### Q321. Explain caching in RTK Query.
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
RTKQ caches responses in the store keyed by endpoint + serialized arguments (the "query key"). A query result is served from cache without a new request until it becomes unused (no active subscribers) for `keepUnusedDataFor` (default 60s) and until `staleTime` elapses. While mounted, the same query across components shares one cache entry and dedupes concurrent requests. Re-fetches happen on mount, arg change, `refetch`, or invalidation.

#### Code Example / Key Takeaways
```jsx
// Two components using same args share one network request + one cache entry
const { data: a } = useGetPostQuery(1);
const { data: b } = useGetPostQuery(1); // no duplicate fetch
```
---

### Q322. What are invalidation tags in RTK Query and how do they work?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Tags (`providesTags` on queries, `invalidatesTags` on mutations) link cache entries to logical entities. When a mutation invalidates a tag, RTKQ automatically refetches all active queries that `provide` that tag — keeping server state consistent without manual refetch calls. Tags can be granular (e.g., `{ type: 'Post', id }`) so updating one post only refetches that post's query.

#### Code Example / Key Takeaways
```jsx
getPost: build.query({
  query: (id) => `/posts/${id}`,
  providesTags: (result, err, id) => [{ type: 'Post', id }],
}),
updatePost: build.mutation({
  query: ({ id, ...patch }) => ({ url: `/posts/${id}`, method: 'PATCH', body: patch }),
  invalidatesTags: (result, err, { id }) => [{ type: 'Post', id }],
}),
```
---

### Q323. How do you perform mutations in RTK Query?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Define a `build.mutation` endpoint and destructure its hook (e.g., `useAddPostMutation`). Calling the trigger function returns a promise you can await for the result or error. Mutations do not cache a value but run `invalidatesTags` to refetch dependent queries. You can also use `onQueryStarted` with `updateQueryData` for optimistic updates.

#### Code Example / Key Takeaways
```jsx
const [addPost] = useAddPostMutation();
const handleClick = async () => {
  try {
    await addPost({ title: 'New' }).unwrap(); // unwrap throws on error
  } catch (e) {
    console.error(e);
  }
};
```
---

### Q324. How does RTK Query handle dependent queries?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
A dependent (chained) query only runs when a prior query's data is available. Pass `skip` when the argument isn't ready: `useGetUserQuery(userId, { skip: !userId })`. For deeper chaining, skip the second query until the first resolves, then use its data as the argument. RTKQ also supports `selectFromResult` for derived data and combining queries.

#### Code Example / Key Takeaways
```jsx
const { data: user } = useGetUserQuery(id);
const { data: posts } = useGetPostsQuery(user?.id, {
  skip: !user?.id, // dependent query waits for user
});
```
---

### Q325. What is `selectFromResult` in RTK Query?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
`selectFromResult` lets a query hook return a derived/transformed slice of the cache instead of the whole response, and enables fine-grained re-renders. It receives the full `result` (with `data`, `isLoading`, etc.) and returns a customized object. Useful to avoid re-rendering when unrelated parts of the cache change or to precompute derived values.

#### Code Example / Key Takeaways
```jsx
const { activeOnly } = useGetTodosQuery(undefined, {
  selectFromResult: ({ data }) => ({
    activeOnly: (data ?? []).filter((t) => !t.done),
  }),
});
```
---

### Q326. How do you add RTK Query to an existing Redux store?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Add the API's reducer under its `reducerPath` and insert `api.middleware` into the store's middleware (using `getDefaultMiddleware` concatenation so RTKQ's cache lifecycle actions are handled). Then wrap the app in `<ApiProvider>` or, with React-Redux, rely on the normal `<Provider>`.

#### Code Example / Key Takeaways
```jsx
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    todos,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});
```
---

### Q327. What is the difference between server state and client state?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Server state is data owned by the backend (cached on the client): it's asynchronous, shared across users, potentially stale, and requires fetching/sync. Client state is UI state owned by the frontend: toggles, form inputs, theme, modals. Libraries like RTK Query / React Query manage server state (caching, invalidation, refetch), while Redux/Zustand/Context manage client state. Mixing them causes bugs — keep them separate.

#### Code Example / Key Takeaways
```jsx
// Server state -> TanStack Query / RTK Query
const { data } = useQuery(['user', id], () => fetchUser(id));
// Client state -> useState / Zustand
const [isModalOpen, setOpen] = useState(false);
```
---

### Q328. What is Zustand and why is it popular?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Zustand is a minimal, hook-based state management library. You create a store with `create()` and read state via selectors inside components. It's popular because of tiny boilerplate, no providers, built-in selective subscriptions (preventing unnecessary re-renders), middleware support (persist, devtools, immer), and an approachable mental model compared to Redux. It suits both local and global state.

#### Code Example / Key Takeaways
```jsx
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}));
// No Provider needed; use anywhere
function Counter() {
  const count = useStore((s) => s.count);
  return <button onClick={() => useStore.getState().inc()}>{count}</button>;
}
```
---

### Q329. How do you create a store in Zustand?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
Call `create((set, get) => ({ ...state, ...actions }))`. `set` updates state (partial or function form), `get` reads current state. The returned hook is used to select slices. You can colocate state and actions in one object. No context provider is required — the store is a module-level singleton.

#### Code Example / Key Takeaways
```jsx
const useBearStore = create((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
  removeAll: () => set({ bears: 0 }),
}));
```
---

### Q330. How do selectors work in Zustand and why do they matter for performance?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Selectors are functions passed to the store hook: `useStore((s) => s.x)`. The component re-renders only when the selected value changes (by `Object.is` comparison). This avoids the Context "re-render everything" problem. For derived/object selections, use `useShallow` or return primitives to prevent infinite re-renders from new object references each render.

#### Code Example / Key Takeaways
```jsx
import { useShallow } from 'zustand/react/shallow';

// Safe object selection
const { bears, fish } = useBearStore(useShallow((s) => ({ bears: s.bears, fish: s.fish })));
// Primitive selection re-renders only when value changes
const bears = useBearStore((s) => s.bears);
```
---

### Q331. How do you add middleware to Zustand?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Pass a middleware-wrapped initializer to `create`: `create(persist((set) => ({...}), {name}))`. Zustand ships `persist`, `devtools`, `subscribeWithSelector`, and `immer` middlewares that can be composed with the `compose` utility. Custom middleware follows `(store) => (next) => (partial) => next(partial)`.

#### Code Example / Key Takeaways
```jsx
import { persist, devtools, immer } from 'zustand/middleware';

const useStore = create(
  devtools(
    persist(
      immer((set) => ({ count: 0, inc: () => set((s) => { s.count++; }) })),
      { name: 'counter' }
    )
  )
);
```
---

### Q332. What does the `persist` middleware do in Zustand?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
`persist` automatically saves selected store state to `localStorage` (or a custom storage) and rehydrates on load, keeping client state across page refreshes. You configure `name` and optionally `partialize` (which keys to persist), `version`, and `migrate`. Great for themes, auth tokens, or cart contents without manual sync code.

#### Code Example / Key Takeaways
```jsx
const useStore = create(persist(
  (set) => ({ token: null, setToken: (t) => set({ token: t }) }),
  { name: 'auth', partialize: (s) => ({ token: s.token }) }
));
```
---

### Q333. How does Zustand compare to Redux?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Zustand is simpler and less boilerplate: no actions/types/reducers, no provider, built-in selectors and middleware. Redux (RTK) offers stricter structure, a richer ecosystem (DevTools time-travel, Saga, RTK Query), and is battle-tested for very large teams. Zustand scales well but is less opinionated. Choose Redux for complex, heavily-tooled apps; Zustand for speed and minimalism.

#### Code Example / Key Takeaways
```jsx
// Redux: action + reducer boilerplate (even with RTK slice)
// Zustand: one function, actions inline, no provider
```
---

### Q334. How do you avoid unnecessary re-renders in Zustand?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Select narrowly with primitive selectors, use `useShallow` for object/array selections, avoid returning new references inline, and consider `subscribeWithSelector` for non-React subscriptions. Also avoid putting rapidly-changing large objects in one store slice; split stores if needed. The key is that each component subscribes only to the data it uses.

#### Code Example / Key Takeaways
```jsx
// Bad: new object each render -> infinite loop risk
const data = useStore((s) => ({ a: s.a, b: s.b }));
// Good
const a = useStore((s) => s.a);
const b = useStore((s) => s.b);
// or
const { a, b } = useStore(useShallow((s) => ({ a: s.a, b: s.b })));
```
---

### Q335. What is Jotai and what is atomic state management?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Jotai is a primitive, bottom-up state library built on atoms — the smallest unit of state. Instead of one store, you create independent atoms; components subscribe to only the atoms they read. Derived atoms compute from others. This "atomic" model avoids over-rendering, removes boilerplate, and scales naturally. It's a spiritual successor to Recoil with a simpler API and better maintenance status.

#### Code Example / Key Takeaways
```jsx
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2); // derived

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```
---

### Q336. How do derived atoms work in Jotai?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
A derived (read-only) atom takes a getter: `atom((get) => get(otherAtom) + 1)`. `get` reads other atoms' values and establishes a dependency; when a dependency changes, the derived atom recomputes and its subscribers re-render. You can also create writeable derived atoms with a `set` function for computed mutations. This replaces Redux selectors/reducers with composable units.

#### Code Example / Key Takeaways
```jsx
const priceAtom = atom(10);
const qtyAtom = atom(2);
const totalAtom = atom((get) => get(priceAtom) * get(qtyAtom)); // recomputes on change
```
---

### Q337. What is Recoil and how does it differ from Jotai?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Recoil (by Meta) also used atoms and selectors with a `<RecoilRoot>` provider, and supported atom families and async selectors. It is now in maintenance/limited development. Jotai is lighter, has no provider requirement, a richer middleware/ecosystem, and active maintenance. Both are atomic; Recoil's API (atom, selector, useRecoilState) is similar but Jotai is generally recommended for new projects today.

#### Code Example / Key Takeaways
```jsx
// Recoil (legacy)
const textState = atom({ key: 'text', default: '' });
const charCount = selector({ key: 'count', get: ({ get }) => get(textState).length });
// Jotai equivalent is simpler and actively maintained
```
---

### Q338. What are atom families and when are they useful?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Atom families generate a parametrized atom per key/id (e.g., one atom per todo item) so each entity has isolated, independently-subscribable state. This prevents re-rendering all items when one changes and avoids storing large arrays of objects in a single atom. Supported in Jotai via `atomFamily` (or a map of atoms) and in Recoil as `atomFamily`.

#### Code Example / Key Takeaways
```jsx
import { atomFamily } from 'jotai/utils';
const todoAtomFamily = atomFamily((id) => atom({ id, text: '', done: false }));

function Todo({ id }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id)); // only this item re-renders
  return <input value={todo.text} onChange={(e) => setTodo({ ...todo, text: e.target.value })} />;
}
```
---

### Q339. How do you handle async with Jotai atoms?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Jotai supports async atoms: a `read` function can return a promise, and `useAtom` suspends (with Suspense) or resolves it. Alternatively, use `atomWithQuery` (TanStack Query integration) or `loadable` / `useAtomValue` with Suspense. Async atoms let you colocate data-fetching with state while keeping client/server concerns clear.

#### Code Example / Key Takeaways
```jsx
const userAtom = atom(async (get) => {
  const res = await fetch('/api/user');
  return res.json();
});

function Profile() {
  const user = useAtomValue(userAtom); // suspends until resolved
  return <h1>{user.name}</h1>;
}
```
---

### Q340. What is TanStack Query (React Query) and what is it used for?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
TanStack Query (formerly React Query) is a server-state management library for fetching, caching, synchronizing, and updating async data. It is not for client UI state. It provides `useQuery` (read), `useMutation` (write), automatic caching, background refetching, retries, pagination, and devtools. It dramatically reduces boilerplate for data fetching and keeps server data in sync.

#### Code Example / Key Takeaways
```jsx
import { useQuery } from '@tanstack/react-query';

function User({ id }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()),
  });
  if (isLoading) return <Spinner />;
  return <div>{data.name}</div>;
}
```
---

### Q341. How do you use `useQuery`?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
`useQuery({ queryKey, queryFn, options })` takes a unique `queryKey` (array used for caching/id) and a `queryFn` returning a promise. It returns `{ data, isLoading, isError, error, isFetching, refetch, status }`. On mount it fetches; subsequent identical keys read from cache. Options control stale time, retry, refetch intervals, and enabled flags.

#### Code Example / Key Takeaways
```jsx
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 60_000,
});
```
---

### Q342. What are query keys and why are they important?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Query keys are serializable arrays that uniquely identify a query's cache entry. They must be structured and consistent: `['todos', { status: 'done' }]`. Nested keys let you invalidate by prefix (e.g., `['todos']` invalidates all todo queries). Query keys deterministically serialize, so argument order and shape matter — keep them stable and sort object keys for consistency.

#### Code Example / Key Takeaways
```jsx
// Good: hierarchical, deterministic
['todos', 'list', { page: 1 }]
['todos', 'detail', id]

// Invalidating by prefix refetches all todo queries
queryClient.invalidateQueries({ queryKey: ['todos'] });
```
---

### Q343. How do you use `useMutation`?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
`useMutation({ mutationFn, onSuccess, onError, onSettled })` returns `[mutate, { data, isPending, isError, error }]`. Call `mutate(variables)` to trigger. Use it for POST/PUT/DELETE. In `onSuccess` you typically invalidate queries to refetch server state, or `setQueryData` to update the cache manually (e.g., for optimistic updates).

#### Code Example / Key Takeaways
```jsx
const mutation = useMutation({
  mutationFn: (newTodo) => api.createTodo(newTodo),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
<button onClick={() => mutation.mutate({ title: 'Hi' })}>Add</button>;
```
---

### Q344. Explain cache time vs stale time in React Query.
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
`staleTime` (default 0) is how long fetched data is considered fresh; while fresh, React Query will not refetch on window focus or remount. `gcTime` (garbage collection time, formerly `cacheTime`, default 5 min) is how long inactive (no subscribers) cache entries are kept before being removed. Data can be stale but still in cache; `staleTime` controls refetch behavior, `gcTime` controls memory retention. Set `staleTime` higher to reduce refetches, `gcTime` higher to keep data available offline-ish.

#### Code Example / Key Takeaways
```jsx
useQuery({
  queryKey: ['user', id],
  queryFn: fn,
  staleTime: 5 * 60_000,   // 5 min fresh -> no auto refetch
  gcTime: 30 * 60_000,     // 30 min retained after unmount
});
```
---

### Q345. What are optimistic updates and how do you implement them in React Query?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Optimistic updates reflect the expected server result in the UI immediately, then roll back if the request fails. In React Query: `onMutate` cancels outgoing queries, snapshots previous data via `queryClient.getQueryData`, optimistically `setQueryData`, then in `onError` restores the snapshot, and `onSettled` invalidates to reconcile with server truth. This makes apps feel instant.

#### Code Example / Key Takeaways
```jsx
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const prev = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) =>
      old.map((t) => (t.id === newTodo.id ? { ...t, ...newTodo } : t))
    );
    return { prev };
  },
  onError: (err, newTodo, ctx) => queryClient.setQueryData(['todos'], ctx.prev),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});
```
---

### Q346. How does React Query handle background refetching and stale-while-revalidate?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
By default, React Query refetches stale data in the background on window focus, network reconnect, and remount, while showing cached data immediately (stale-while-revalidate). It only forces a loading spinner on the first fetch; subsequent background refetches set `isFetching` while `data` remains available. This keeps UIs responsive with always-fairly-fresh data. Configure via `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchInterval`.

#### Code Example / Key Takeaways
```jsx
useQuery({
  queryKey: ['news'],
  queryFn: fetchNews,
  refetchOnWindowFocus: true,   // background refresh on tab focus
  refetchInterval: 60_000,      // poll every minute
});
```
---

### Q347. How do you invalidate queries in React Query?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Use `queryClient.invalidateQueries({ queryKey })`. It marks matching queries as stale and triggers a refetch for those currently mounted/observed. You can target a specific key (`['todos', id]`) or a prefix (`['todos']`) to refetch many. After mutations, invalidation is the standard way to reconcile server state without manually updating the cache.

#### Code Example / Key Takeaways
```jsx
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['todos'] });       // refetch all todos
queryClient.invalidateQueries({ queryKey: ['todos', 1] });    // only todo #1
```
---

### Q348. What is the `QueryClient` and `QueryClientProvider`?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
`QueryClient` is the central cache/manager for all queries and mutations. `QueryClientProvider` wires it into the React tree (wrap your app once). You can configure defaults (`defaultOptions`) like `staleTime`/`retry` on the client. It also exposes imperative methods: `invalidateQueries`, `setQueryData`, `getQueryData`, `prefetchQuery`.

#### Code Example / Key Takeaways
```jsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>;
```
---

### Q349. How do you prefetch data with React Query?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Use `queryClient.prefetchQuery({ queryKey, queryFn })` to populate the cache before a component mounts (e.g., on hover or route transition), so the data is instantly available. With SSR you can prefetch on the server and hydrate via `HydrationBoundary` / `dehydrate`. Prefetching improves perceived performance for likely-next views.

#### Code Example / Key Takeaways
```jsx
const queryClient = useQueryClient();
<Link
  onMouseEnter={() => queryClient.prefetchQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })}
/>;
```
---

### Q350. How do you share query results across components without duplicate fetches?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
React Query caches by `queryKey` at the `QueryClient` level, so any component using the same key shares one cache entry and dedupes concurrent requests. Just reuse the same `queryKey` + `queryFn` shape. No context or prop drilling needed — multiple components mounting the same query only trigger a single network call.

#### Code Example / Key Takeaways
```jsx
// Both components mount -> only ONE network request
function Header() { useQuery({ queryKey: ['user'], queryFn }); }
function Sidebar() { useQuery({ queryKey: ['user'], queryFn }); }
```
---

### Q351. What is `keepPreviousData` / placeholder data in React Query?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
`placeholderData: keepPreviousData` keeps the previous query's `data` visible while a new query (e.g., new page/filter) loads, instead of showing a loading state — enabling smooth pagination/infinite scroll. `placeholderData` can also be a function for initial/fallback data. With it, `isPlaceholderData` is true so you can dim stale content.

#### Code Example / Key Takeaways
```jsx
const { data, isPlaceholderData } = useQuery({
  queryKey: ['projects', page],
  queryFn: () => fetchProjects(page),
  placeholderData: keepPreviousData, // no flash of loading on page change
});
```
---

### Q352. How do you paginate data with React Query?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Two common approaches: (1) Manual page keys `['items', page]` with `keepPreviousData` for traditional pagination. (2) `useInfiniteQuery` with `getNextPageParam` for infinite scroll, exposing `fetchNextPage` and a flattened `data.pages`. Choose infinite for feeds, manual for paged tables.

#### Code Example / Key Takeaways
```jsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam = 0 }) => fetchFeed(pageParam),
  initialPageParam: 0,
  getNextPageParam: (last) => last.nextCursor,
});
```
---

### Q353. How does React Query integrate with Redux or Zustand?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Keep server state in React Query and client/UI state in Redux/Zustand — don't duplicate fetched data into Redux. If needed, write mutations/invalidation in RTK Query or React Query, and keep UI flags (modal open, selected tab) in Zustand/Redux. You can call `queryClient` from anywhere, and read React Query cache via selectors if bridging is required, but separation is the recommended architecture.

#### Code Example / Key Takeaways
```jsx
// Client UI state in Zustand, server data in React Query
const isModalOpen = useStore((s) => s.isModalOpen);
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
```
---

### Q354. What are React Query devtools and how do you use them?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
`@tanstack/react-query-devtools` renders a panel showing every query's state (fresh/stale/fetching), cache data, observers, and timing. It helps debug caching, see why a refetch happened, and inspect query keys. Install the package, add `<ReactQueryDevtools />` inside the provider. Essential for understanding cache behavior during development.

#### Code Example / Key Takeaways
```jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>;
```
---

### Q355. How do you handle errors and retries in React Query?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
By default React Query retries failed queries 3 times with exponential backoff. Configure via `retry` (false/number/function), `retryDelay`, and `staleTime`. Surface errors with `isError`/`error` from the hook or via `onError` callbacks. For mutations, handle `onError` to show toasts. Throwing in `queryFn` triggers error state; non-2xx fetch needs manual throw.

#### Code Example / Key Takeaways
```jsx
useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  onError: (err) => toast.error(err.message),
});
```
---

### Q356. What is the difference between Redux Toolkit Query and React Query?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Both solve server-state caching. RTK Query is tightly coupled to Redux (uses the store, reducers, middleware, devtools) and is great if you already use Redux and want one ecosystem. React Query (TanStack) is standalone, framework-agnostic-ish, with richer features (infinite queries, prefetch, devtools, suspense) and no Redux dependency. Choose based on whether you're already in the Redux ecosystem. They're largely interchangeable for fetching/caching.

#### Code Example / Key Takeaways
```jsx
// RTK Query: lives in Redux store, needs reducerPath + middleware
useGetPostsQuery();
// React Query: standalone QueryClientProvider, no store needed
useQuery({ queryKey: ['posts'], queryFn });
```
---

### Q357. How do you use React Query with Suspense?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Set `useQuery({ queryKey, queryFn, suspense: true })` (or global default). With Suspense, the hook throws a promise while loading, so wrap the component in `<Suspense fallback={...}>`. Errors propagate to an error boundary. This lets you use declarative loading boundaries instead of `isLoading` flags. SSR hydration must also support suspense.

#### Code Example / Key Takeaways
```jsx
function User() {
  const { data } = useQuery({ queryKey: ['user'], queryFn, suspense: true });
  return <h1>{data.name}</h1>; // throws promise until resolved
}
<Suspense fallback={<Spinner />}><User /></Suspense>;
```
---

### Q358. What is the `select` option in React Query?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
`select` transforms the query data before returning it: `useQuery({ queryKey, queryFn, select: (data) => data.filter(d => !d.done) })`. It memoizes the transform and prevents re-renders when the derived result is unchanged (by reference). Useful for deriving/formatting without extra state or effects. Note: `select` runs on every render unless the input data changed.

#### Code Example / Key Takeaways
```jsx
const { data: active } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.filter((t) => !t.done),
});
```
---

### Q359. How do you set and get query cache data imperatively?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Use `queryClient.setQueryData(queryKey, updater)` to update a cache entry directly (e.g., append a newly created item without refetch) and `queryClient.getQueryData(queryKey)` to read it. This is common in optimistic updates and after mutations to keep the cache in sync. Keys must match exactly (same serialization) as the original query.

#### Code Example / Key Takeaways
```jsx
queryClient.setQueryData(['todos'], (old = []) => [...old, newTodo]);
const current = queryClient.getQueryData(['todos']);
```
---

### Q360. How do you structure a large Redux application with slices?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Organize by feature (ducks pattern): each feature folder has its slice (`createSlice`), selectors, thunks/RTK Query APIs, and types. Combine via `configureStore`'s reducer map keyed by feature. Use `createEntityAdapter` for normalized collections, `createSelector` (reselect) for memoized derived data, and colocate async via `createAsyncThunk`. Keep cross-feature dependencies minimal and shared data in dedicated slices.

#### Code Example / Key Takeaways
```jsx
// features/todos/todosSlice.js
const todosSlice = createSlice({ name: 'todos', initialState, reducers: {...} });
// store: { reducer: { todos: todosSlice.reducer, user: userSlice.reducer } }
```
---

### Q361. What is `createEntityAdapter` and when should you use it?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
`createEntityAdapter` normalizes a collection into `{ ids: [], entities: {} }` for efficient lookups and updates by id, with prebuilt reducers (`setAll`, `addOne`, `upsertMany`, `removeOne`) and selectors (`selectAll`, `selectById`, `selectIds`). Use it whenever you manage a list of entities fetched from a server — it avoids manual normalization and gives O(1) access.

#### Code Example / Key Takeaways
```jsx
const adapter = createEntityAdapter({ selectId: (u) => u.id });
const slice = createSlice({
  name: 'users',
  initialState: adapter.getInitialState(),
  reducers: {
    usersReceived: adapter.setAll,
    userAdded: adapter.addOne,
  },
});
const selectors = adapter.getSelectors((s) => s.users);
// selectors.selectAll(state) -> array; selectors.selectById(state, id)
```
---

### Q362. What is `reselect` / `createSelector` and why is it used?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
`createSelector` builds memoized selectors: they only recompute when input selectors change (by reference), preventing expensive derivations on every render and avoiding new object references that cause re-renders. RTK re-exports `createSelector`. Use it for filtered/sorted lists or combined slices derived from state. Input selectors read raw state; the output is memoized.

#### Code Example / Key Takeaways
```jsx
import { createSelector } from '@reduxjs/toolkit';
const selectTodos = (s) => s.todos.items;
const selectActive = createSelector(selectTodos, (items) =>
  items.filter((t) => !t.done)
); // recomputes only when items reference changes
```
---

### Q363. How do you connect Redux to React components (`useSelector`, `useDispatch`)?
**Difficulty:** `Basic`
**Category:** State Management & Ecosystem

#### Answer
With React-Redux, `useSelector((state) => state.x)` reads a slice (re-renders when it changes by `Object.is`), and `useDispatch()` returns the dispatch function to send actions. Always select narrowly and return primitives or memoized data to avoid re-render issues. For actions, import them from slices and dispatch directly.

#### Code Example / Key Takeaways
```jsx
import { useSelector, useDispatch } from 'react-redux';
import { increment } from './counterSlice';

function Counter() {
  const count = useSelector((s) => s.counter.n);
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(increment())}>{count}</button>;
}
```
---

### Q364. What are common performance pitfalls with Redux and Context?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
(1) Returning new object/array references from `useSelector`/Context value causes infinite re-renders — use memoized selectors or `useShallow`. (2) Context value object changes re-render all consumers — split contexts or memoize. (3) Dispatching too frequently or storing rapidly-changing data in global state. (4) Connecting too many components broadly. Mitigate with selectors, memoization, and splitting state.

#### Code Example / Key Takeaways
```jsx
// Pitfall: new array each render -> re-render loop
const bad = useSelector((s) => [...s.items]);
// Fix
const items = useSelector((s) => s.items);
```
---

### Q365. How do you test Redux slices and async thunks?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
For slices, call the reducer with initial state and an action, asserting the returned state (pure, easy). For `createAsyncThunk`, test the lifecycle reducers via `extraReducers` by dispatching `pending/fulfilled/rejected` action objects (use `thunk.fulfilled.match`). Integration tests use a real store with `configureStore` and dispatch thunks, possibly mocking the API. RTK's purity makes reducer tests trivial.

#### Code Example / Key Takeaways
```jsx
it('adds todo', () => {
  const state = todosReducer(undefined, addTodo('x'));
  expect(state.items).toHaveLength(1);
});
// async: dispatch real thunk with mocked api, await, assert store state
```
---

### Q366. How do you test React Query hooks?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Use `@testing-library/react`'s `renderHook` wrapped in `QueryClientProvider` (with `retry: false` and a `Wrapper`). Provide a `queryFn` or mock `fetch`. Assert on `result.current.data` after `waitFor`/`findBy`. For mutations, call `result.current.mutate` and await. Isolate cache per test by creating a fresh `QueryClient`. You can also use `queryClient.setQueryData` to seed state.

#### Code Example / Key Takeaways
```jsx
const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);
const { result } = renderHook(() => useQuery({ queryKey: ['x'], queryFn: async () => 1 }), { wrapper });
await waitFor(() => expect(result.current.data).toBe(1));
```
---

### Q367. What is the difference between a selector returning a new object and a primitive, and why does it matter?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
`useSelector((s) => ({ a: s.a, b: s.b }))` returns a new object reference every call, so Redux's default `Object.is` equality always fails → infinite re-render. Returning a primitive (`s.a`) or using `useShallow`/`createSelector` (memoized) prevents this. The rule: selectors should return stable references or be memoized. This applies equally to Zustand and Context-derived values.

#### Code Example / Key Takeaways
```jsx
// Risky
const x = useSelector((s) => ({ a: s.a, b: s.b }));
// Safe
import { useShallow } from 'react-redux';
const x = useSelector(useShallow((s) => ({ a: s.a, b: s.b })));
```
---

### Q368. How do you migrate from Redux Core to Redux Toolkit?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Incrementally: introduce RTK's `configureStore` and keep old reducers (they're still valid reducers). Convert one slice at a time to `createSlice`, replacing hand-written action types/creators with generated ones (keep action type strings stable to avoid breaking existing dispatches). Replace `redux-thunk` manual setup with RTK's built-in thunk. Finally adopt `createAsyncThunk` and `createEntityAdapter` for data slices. RTK is backward compatible with plain reducers, so migration can be gradual.

#### Code Example / Key Takeaways
```jsx
// Old action type 'todos/add' can be reused:
createSlice({ name: 'todos', initialState, reducers: { add: {...} } });
// generates 'todos/add' automatically -> existing dispatches still work
```
---

### Q369. When would you choose Zustand over Redux Toolkit for a new project?
**Difficulty:** `Intermediate`
**Category:** State Management & Ecosystem

#### Answer
Choose Zustand when you want minimal boilerplate, no provider, fast setup, built-in persist/devtools, and a small-to-medium app where the strict structure of Redux isn't needed. Choose Redux Toolkit when you need a battle-tested ecosystem, RTK Query, time-travel devtools, heavy team conventions, or complex middleware/Saga orchestration. Both handle client state well; Zustand wins on simplicity, Redux on tooling/scale.

#### Code Example / Key Takeaways
```jsx
// Zustand: ~5 lines for a global store
const useStore = create((set) => ({ n: 0, inc: () => set((s) => ({ n: s.n + 1 })) }));
// Redux: slice + store + provider + hooks
```
---

### Q370. How do you decide between Context, Redux, Zustand, Jotai, and React Query for a given problem?
**Difficulty:** `Advanced`
**Category:** State Management & Ecosystem

#### Answer
Decision heuristic: (1) Server data (fetching/caching/sync) -> React Query or RTK Query. (2) Rarely-changing global config (theme, auth, locale) -> Context. (3) Simple global client state, low boilerplate -> Zustand. (4) Atomic/fine-grained derived state or component-level isolation -> Jotai/Recoil. (5) Large, complex, team-convention-heavy apps needing devtools/middleware/RTK Query -> Redux Toolkit. Keep server state and client state in separate tools; never put fetched data in Context/Redux unnecessarily.

#### Code Example / Key Takeaways
```jsx
// Server state
useQuery({ queryKey: ['user'], queryFn });
// Client UI state
const theme = useContext(ThemeContext);           // static config
const [open, setOpen] = useStore((s) => s.modal); // Zustand
// Atomic
const [n, setN] = useAtom(countAtom);             // Jotai
// Complex global logic
useSelector((s) => s.counter.n);                  // Redux Toolkit
```
---
"}