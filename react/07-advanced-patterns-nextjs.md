# React Interview Questions: Advanced Design Patterns & Next.js

### Q436 - Q500

---

### Q436. What is a Higher-Order Component (HOC) and when would you use one?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
A Higher-Order Component is a function that takes a component and returns a new, enhanced component. HOCs are a pattern for reusing component logic without duplication. They follow composition over inheritance. Typical uses: authentication guards, data fetching, logging, theming, and error/loading wrappers. The HOC does not mutate the wrapped component; it composes a new one.

#### Code Example / Key Takeaways
```jsx
// A simple HOC that adds a loading indicator
function withLoading(WrappedComponent) {
  return function WithLoading({ isLoading, ...props }) {
    if (isLoading) return <div>Loading...</div>;
    return <WrappedComponent {...props} />;
  };
}

const UserListWithLoading = withLoading(UserList);
<UserListWithLoading isLoading={loading} users={users} />;
```

---

### Q437. What are the caveats and best practices when using HOCs?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
HOCs wrap, never mutate, the input component. They must forward unknown props (`...props`) and `ref`s to the wrapped component. They can break if composed deeply (wrapper chains) and can cause prop name collisions. Always set a meaningful `displayName` for debugging. Avoid using HOCs inside the render method (creates a new component each render, remounting the tree). Prefer composing with `compose()` from a utility library.

#### Code Example / Key Takeaways
```jsx
// Anti-pattern: creating the HOC inside render remounts on every render
render() {
  const Enhanced = withLogging(MyComponent); // new type each render!
  return <Enhanced />;
}

// Best practice: define HOCs outside the component
const Enhanced = compose(withLoading, withAuth)(MyComponent);
Enhanced.displayName = 'WithAuth(WithLoading(MyComponent))';
```

---

### Q438. How do you preserve displayName and forward refs through an HOC?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Wrapped components lose their name in DevTools unless you set `displayName`. Refs passed to the enhanced component won't reach the inner component unless you use `React.forwardRef`. Combine both so the HOC is transparent and supports imperative handles.

#### Code Example / Key Takeaways
```jsx
function withMouse(WrappedComponent) {
  const DisplayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  const Component = React.forwardRef((props, ref) => {
    const [pos, setPos] = React.useState({ x: 0, y: 0 });
    return <WrappedComponent ref={ref} mouse={pos} {...props} />;
  });
  Component.displayName = `withMouse(${DisplayName})`;
  return Component;
}
```

---

### Q439. What is the Render Props pattern?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
A render prop is a prop whose value is a function that returns a React element. It lets a component share its internal state or logic with its parent, which decides what to render. This is a flexible alternative to HOCs when you need fine-grained control over the rendered output and want to avoid wrapper nesting.

#### Code Example / Key Takeaways
```jsx
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };
  handleMove = (e) => this.setState({ x: e.clientX, y: e.clientY });
  render() {
    return (
      <div onMouseMove={this.handleMove}>
        {this.props.render(this.state)}
      </div>
    );
  }
}

<MouseTracker render={({ x, y }) => <h1>Cursor at {x},{y}</h1>} />;
```

---

### Q440. Show a practical Render Props example for data fetching.
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
Render props shine for cross-cutting state like data fetching or hover. The container manages loading/error/data and calls the render function with the result. The consumer renders exactly what it wants, including custom loading and error UI.

#### Code Example / Key Takeaways
```jsx
function Fetch({ url, children }) {
  const [state, setState] = React.useState({ data: null, loading: true, error: null });
  React.useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ error, loading: false, data: null }));
  }, [url]);
  return children(state);
}

<Fetch url='/api/user'>
  {({ data, loading, error }) =>
    loading ? <Spinner /> : error ? <Error /> : <Profile data={data} />
  }
</Fetch>;
```

---

### Q441. Render Props vs the `children`-as-function pattern — what is the difference?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
They are the same idea; the only difference is which prop holds the function. Using `children` as a function reads naturally (`<Comp>{(api)=>...}</Comp>`) and is the most common form. A named prop like `render` makes the intent explicit. Both avoid HOC nesting and make the data flow visible in JSX.

#### Code Example / Key Takeaways
```jsx
// children as function
<Toggle>{({ on, toggle }) => <button onClick={toggle}>{on ? 'On' : 'Off'}</button>}</Toggle>

// named render prop
<Toggle render={({ on, toggle }) => <Switch on={on} onClick={toggle} />} />
```

---

### Q442. What is the Compound Components pattern?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Compound components are several components that work together and share implicit state, while letting the parent control the structure/composition. Instead of one big configurable component, you expose `Menu`, `Menu.Item`, `Menu.Button`. This gives a declarative, flexible API and hides coordination logic via context.

#### Code Example / Key Takeaways
```jsx
function Select({ children }) {
  const [open, setOpen] = React.useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}
Select.Trigger = function Trigger({ children }) {
  const { open, setOpen } = React.useContext(Ctx);
  return <button onClick={() => setOpen(!open)}>{children}</button>;
};
Select.List = function List({ children }) {
  const { open } = React.useContext(Ctx);
  return open ? <ul>{children}</ul> : null;
};
```

---

### Q443. Build a working Compound Components example with context.
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Use a context to share state among sibling subcomponents so consumers can reorder or omit parts freely. The parent sets up the provider; subcomponents read/write via `useContext`. This keeps the public API expressive (`<Tabs><Tabs.List/>...</Tabs>`).

#### Code Example / Key Takeaways
```jsx
const TabsCtx = React.createContext(null);
function Tabs({ children }) {
  const [active, setActive] = React.useState(0);
  return <TabsCtx.Provider value={{ active, setActive }}>{children}</TabsCtx.Provider>;
}
Tabs.List = ({ children }) => <div role='tablist'>{children}</div>;
Tabs.Tab = ({ index, children }) => {
  const { active, setActive } = React.useContext(TabsCtx);
  return <button aria-selected={active === index} onClick={() => setActive(index)}>{children}</button>;
};
Tabs.Panel = ({ index, children }) => {
  const { active } = React.useContext(TabsCtx);
  return active === index ? <div role='tabpanel'>{children}</div> : null;
};
```

---

### Q444. How do you make Compound Components resilient to missing subcomponents?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Guard against misuse: throw helpful errors when a subcomponent is rendered outside its parent, and document required context. You can also expose a hook (`useTabs`) for advanced consumers. Clear runtime errors beat silent failures when the pattern is misused.

#### Code Example / Key Takeaways
```jsx
function useTabsCtx() {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error('Tabs.Tab must be used within <Tabs>');
  return ctx;
}
// Then each subcomponent calls useTabsCtx() instead of useContext directly.
```

---

### Q445. What is the Control Props pattern?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Control Props let the parent fully control a component's state from outside while still supporting an uncontrolled (internal-state) mode. The component is "controlled" if the relevant prop is provided, otherwise it manages its own state. This mirrors React's own controlled inputs and offers maximum flexibility.

#### Code Example / Key Takeaways
```jsx
function Toggle({ on, defaultOn = false, onChange }) {
  const [internal, setInternal] = React.useState(defaultOn);
  const isControlled = on !== undefined;
  const current = isControlled ? on : internal;
  const toggle = () => {
    const next = !current;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  return <button onClick={toggle}>{current ? 'On' : 'Off'}</button>;
}
```

---

### Q446. Show the Control Props pattern handling both controlled and uncontrolled usage.
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Detect control by checking whether the prop is `undefined`. When controlled, ignore internal state and render the prop; when uncontrolled, keep internal state and call the optional callback. This single component supports `<Toggle on={x}/>` and `<Toggle defaultOn onChange={...}/>`.

#### Code Example / Key Takeaways
```jsx
function useControllableState({ value, defaultValue, onChange }) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : uncontrolled;
  const set = (next) => {
    if (!isControlled) setUncontrolled(next);
    onChange?.(next);
  };
  return [current, set];
}
```

---

### Q447. HOC vs Render Props vs Custom Hooks — when to use which?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
Custom hooks are now the default for sharing stateful logic because they avoid extra component tree layers and are easiest to compose. Use Render Props when the consumer needs to control rendering output. Use HOCs for cross-cutting concerns that wrap a component's contract (auth, error boundary adapters). Prefer hooks; reach for render props/HOCs only when hooks can't express the need.

#### Code Example / Key Takeaways
```jsx
// Hook: best default
function useMouse() {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  React.useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return pos;
}
```

---

### Q448. What are React Server Components (RSC)?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
RSC are components that render on the server (or at build time) and send a lightweight serialized description to the client instead of JavaScript. They can access server-only resources (databases, filesystem, secrets) directly and ship zero client JS. They enable a smaller bundle and better initial load. They cannot use state, effects, or browser-only APIs.

#### Code Example / Key Takeaways
```jsx
// app/page.js  (Server Component by default)
import { db } from '@/lib/db';
export default async function Page() {
  const posts = await db.post.findMany();
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

---

### Q449. What does the `'use client'` directive do?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
`'use client'` marks a module boundary: everything below it (and imported into it) becomes a Client Component, rendered on the server for the initial HTML but hydrated and interactive in the browser. Use it only where you need state, effects, event handlers, or browser APIs. Server Components can import Client Components, but not the reverse across the boundary (props passed must be serializable).

#### Code Example / Key Takeaways
```jsx
'use client';
import { useState } from 'react';
export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

---

### Q450. What are the rules and limitations of Server vs Client Components?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Server Components: no hooks/state/effects, no event handlers, can be async, may use server-only code. Client Components: support interactivity, run in the browser, but increase JS shipped. You cannot import a Server Component into a Client Component directly; instead pass it as `children`/props. Props crossing the boundary must be serializable (no functions, classes, or non-JSON values).

#### Code Example / Key Takeaways
```jsx
// app/layout.js (Server)
import ClientNav from './ClientNav'; // ok: server imports client
export default function Layout({ children }) {
  return <html><body><ClientNav />{children}</body></html>;
}
// Passing a server component into a client one via children:
<ClientShell><ServerContent /></ClientShell> // ServerContent rendered on server
```

---

### Q451. How do you pass a Server Component into a Client Component?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
You can't import a Server Component into a Client Component, but you can pass it as a `children` or prop from a Server Component that renders both. The Server Component creates the element and hands it down; the Client Component receives it as a serialized React node and renders it. This is the canonical "escape hatch" for mixing the two.

#### Code Example / Key Takeaways
```jsx
// ServerComponent.js (Server)
import ClientCard from './ClientCard';
import ServerChart from './ServerChart'; // heavy server work
export default function Page() {
  return <ClientCard title='Report'><ServerChart /></ClientCard>;
}
// ClientCard.js ('use client')
export default function ClientCard({ title, children }) {
  const [open, setOpen] = useState(true);
  return <div><h2>{title}</h2>{open && children}</div>;
}
```

---

### Q452. Can Client Components be rendered on the server? Explain the two-pass rendering.
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Yes. Client Components still render to HTML on the server for the initial response (so content is visible without JS), then hydrate in the browser to become interactive. The server pass produces static markup; the client pass attaches listeners. This is why `'use client'` ≠ "server-side rendering is skipped" — it means "also runs on the client."

#### Code Example / Key Takeaways
```jsx
// Both passes happen: server renders markup, client hydrates.
'use client';
export default function Badge({ label }) {
  // Renders to HTML on server, then hydrates on client
  return <span className='badge'>{label}</span>;
}
```

---

### Q453. What is the Next.js App Router and how does it differ from the Pages Router?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
The App Router (Next 13+) uses a `app/` directory with file-system routing, React Server Components by default, nested layouts, and colocated `loading`/`error`/`not-found` files. The older Pages Router (`pages/`) renders everything as Client Components by default with `getStaticProps`/`getServerSideProps`. App Router enables more granular server/client splits and streaming.

#### Code Example / Key Takeaways
```text
app/
  layout.js          // root layout (required)
  page.js            // route /
  dashboard/
    layout.js        // nested layout
    page.js          // route /dashboard
    loading.js       // streaming fallback
    error.js         // error boundary
```

---

### Q454. Explain Layouts in the App Router.
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
A `layout.js` wraps its segment and all nested segments, persisting state and avoiding remounts on navigation between sibling routes. The root layout must define `<html>` and `<body>`. Layouts are Server Components by default and receive `children`. Nested layouts compose, so shared UI (nav, sidebar) stays mounted.

#### Code Example / Key Takeaways
```jsx
// app/dashboard/layout.js
export default function DashboardLayout({ children }) {
  return (
    <section>
      <Sidebar />
      <main>{children}</main>
    </section>
  );
}
```

---

### Q455. How do nested layouts preserve state across navigations?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
The App Router keeps parent layouts mounted while only the changed segment re-renders. Because the layout component instance is not discarded on navigation, any state held in a layout (or a client island within it) persists, and client-side navigation does not refetch the layout. This gives SPA-like feel with server rendering.

#### Code Example / Key Takeaways
```jsx
// app/layout.js keeps nav mounted; navigating /a -> /b
// only the page segment changes, layout state (e.g. open menu) survives.
```

---

### Q456. What are Pages in the App Router and how are they defined?
**Difficulty:** `Basic`
**Category:** Advanced Patterns & Next.js

#### Answer
A `page.js` file defines the UI for a route segment and is always the leaf of a route. By default it's a Server Component and can be async. There is one `page.js` per folder; the folder structure maps to the URL. Pages receive `params` and `searchParams` (in async form in recent Next versions).

#### Code Example / Key Takeaways
```jsx
// app/products/[id]/page.js
export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  return <h1>{product.name}</h1>;
}
```

---

### Q457. How does Loading UI (`loading.js`) work with Suspense?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
`loading.js` creates a Suspense boundary around the page. While the page's async work (data, streaming) is pending, Next shows the loading UI instantly, then swaps in the resolved content. This enables streaming SSR without manually wrapping each component in `<Suspense>`. It applies at the segment level.

#### Code Example / Key Takeaways
```jsx
// app/dashboard/loading.js
export default function Loading() {
  return <Skeleton />;
}
// Next wraps the page in <Suspense fallback={<Loading/>}>
```

---

### Q458. How do Error Boundaries work in the App Router (`error.js`)?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
`error.js` is a Client Component that catches errors thrown in its segment (and below) and renders a fallback. It must accept `error` and `reset` props. It does not catch errors in the root layout or in `error.js` itself. You can nest error boundaries for granular recovery; `reset` re-renders the segment.

#### Code Example / Key Takeaways
```jsx
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

### Q459. What is `global-error.js` and when is it used?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
`global-error.js` catches errors in the root layout (which `error.js` cannot). It must render its own `<html>` and `<body>` because it replaces the whole document on failure. It's the last-resort boundary for catastrophic errors outside normal segments.

#### Code Example / Key Takeaways
```jsx
'use client';
export default function GlobalError({ error, reset }) {
  return (
    <html><body>
      <h1>Fatal error</h1>
      <button onClick={reset}>Reload</button>
    </body></html>
  );
}
```

---

### Q460. What is `not-found.js` and how do you trigger a 404?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
`not-found.js` renders a custom 404 UI for a segment. Call the `notFound()` helper from `next/navigation` inside a Server or Client Component to trigger it and return a 404 status. Without a segment-level file, the root `not-found.js` (or Next's default) is used.

#### Code Example / Key Takeaways
```jsx
import { notFound } from 'next/navigation';
export default async function Page({ params }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();
  return <Profile user={user} />;
}
```

---

### Q461. How do Route Handlers work in the App Router?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
Route Handlers live in `app/api/.../route.js` and let you build backend endpoints using Web `Request`/`Response`. Export named functions per HTTP method (`GET`, `POST`, `PUT`, `DELETE`, etc.). They run on the server and support caching, dynamic behavior, and streaming. They replace API routes from the Pages Router.

#### Code Example / Key Takeaways
```jsx
// app/api/posts/route.js
import { NextResponse } from 'next/server';
export async function GET() {
  const posts = await getPosts();
  return NextResponse.json(posts);
}
export async function POST(req) {
  const body = await req.json();
  const created = await createPost(body);
  return NextResponse.json(created, { status: 201 });
}
```

---

### Q462. How do you handle dynamic route parameters in Route Handlers?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
Use folder segments with brackets, e.g. `app/api/posts/[id]/route.js`, and read `params` (now async in recent versions) from the second argument of the handler. Validate and parse the id before use, and return 404s for missing records.

#### Code Example / Key Takeaways
```jsx
// app/api/posts/[id]/route.js
export async function GET(req, { params }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return new Response('Not found', { status: 404 });
  return Response.json(post);
}
```

---

### Q463. What are Server Actions in Next.js?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Server Actions are async functions that run on the server and can be invoked directly from Client Components (via form actions or event handlers) without writing a manual API route. They are defined with `'use server'` and can mutate data, call databases, and revalidate caches. They use the same RPC mechanism as form submissions, making mutations simple and secure by default.

#### Code Example / Key Takeaways
```jsx
// app/actions.js
'use server';
export async function createTodo(formData) {
  const title = formData.get('title');
  await db.todo.create({ data: { title } });
  revalidatePath('/todos');
}
```

---

### Q464. How do you call a Server Action from a form?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Pass the action to a form's `action` prop. The framework serializes the FormData and calls the server function, then can revalidate and redirect. For progressive enhancement, this works even without JavaScript. Use `useFormState`/`useActionState` to capture return values and pending state.

#### Code Example / Key Takeaways
```jsx
'use client';
import { useFormStatus } from 'react-dom';
function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}
// <form action={createTodo}><input name='title'/><Submit/></form>
```

---

### Q465. What is `'use server'` vs `'use client'`?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
`'use client'` marks a module as a Client Component boundary (runs/hydrates in browser). `'use server'` marks a function (or module of functions) as a Server Action callable from the client; these functions must be async, serializable in/out, and cannot return non-serializable values. Both are directives that define execution environment, but they serve opposite directions.

---

### Q466. How do you revalidate cached data after a Server Action?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Use `revalidatePath(path)` to purge the cache for a specific route, or `revalidateTag(tag)` to invalidate data fetched with that tag (via `fetch(url, { next: { tags } })`). After mutation, revalidating ensures the next render reflects fresh data without a full deploy. You can also `redirect()` after success.

#### Code Example / Key Takeaways
```jsx
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';
export async function likePost(id) {
  await db.like.create({ data: { postId: id } });
  revalidateTag(`post-${id}`);
  revalidatePath('/feed');
}
```

---

### Q467. Can Server Actions accept non-form data arguments?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Yes. When invoked programmatically (e.g., `onClick={() => action(id)}`), Server Actions can take any serializable arguments (strings, numbers, plain objects, arrays). When used as a form `action`, the argument is `FormData`. Avoid passing functions, class instances, or unsanitized client input.

#### Code Example / Key Takeaways
```jsx
'use server';
export async function deleteItem(id: string) {
  await db.item.delete({ where: { id } });
  revalidatePath('/items');
}
// Client: <button onClick={() => deleteItem(item.id)}>x</button>
```

---

### Q468. Explain the difference between Server Actions and Route Handlers.
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Route Handlers are explicit HTTP endpoints (useful for external clients, webhooks, non-Next consumers). Server Actions are RPC-style functions tightly coupled to the React tree, enabling progressive-enhancement forms and automatic serialization. Use Route Handlers when you need a public API; use Server Actions for app-internal mutations from forms/UI.

#### Code Example / Key Takeaways
```text
Need a public REST/JSON endpoint?  -> Route Handler (app/api/...)
Need to mutate from a form in the tree? -> Server Action ('use server')
```

---

### Q469. What is Client-Side Rendering (CSR)?
**Difficulty:** `Basic`
**Category:** Advanced Patterns & Next.js

#### Answer
CSR renders the app in the browser: the server sends a minimal HTML shell plus a JS bundle, and React builds the DOM on the client. It's simple and great for highly interactive dashboards behind auth, but has slower first paint and weaker SEO since content isn't in the initial HTML.

#### Code Example / Key Takeaways
```jsx
// A pure client app (e.g. CRA): browser downloads JS, then renders
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

---

### Q470. What is Server-Side Rendering (SSR) and how is it done in Next.js?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
SSR renders each request on the server into full HTML, sent to the client, then hydrated. In the App Router, any dynamic Server Component is effectively SSR'd per request. In the Pages Router you use `getServerSideProps`. Benefits: fast first paint and good SEO. Cost: higher server CPU per request.

#### Code Example / Key Takeaways
```jsx
// App Router: dynamic, runs per request
export const dynamic = 'force-dynamic';
export default async function Page() {
  const data = await fetchData(); // executed on each request
  return <List data={data} />;
}
```

---

### Q471. What is Static Site Generation (SSG)?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
SSG pre-renders pages at build time into static HTML, served from CDN. It's the fastest and most scalable option, ideal for content that doesn't change per user/request (docs, blogs, marketing). In the App Router, components without dynamic data are static by default; in Pages Router use `getStaticProps`.

#### Code Example / Key Takeaways
```jsx
// App Router: static by default (no dynamic functions used)
export default async function Page() {
  const posts = await getPosts(); // fetched once at build
  return <Feed posts={posts} />;
}
```

---

### Q472. What is Incremental Static Regeneration (ISR)?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
ISR lets you keep SSG's speed while updating static content after deploy, without rebuilding the whole site. You set a `revalidate` interval; after it elapses, the next request regenerates the page in the background. In App Router, use `export const revalidate = 60` or `fetch(..., { next: { revalidate: 60 } })`.

#### Code Example / Key Takeaways
```jsx
// App Router ISR
export const revalidate = 60; // seconds
export default async function Page() {
  const data = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 },
  }).then((r) => r.json());
  return <Feed data={data} />;
}
```

---

### Q473. What is Streaming SSR and how does Suspense enable it?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Streaming SSR sends HTML in chunks as data becomes ready, instead of blocking the whole page. Wrap slow parts in `<Suspense>` (or `loading.js`); the shell streams first, then the suspended content fills in. This improves Time to First Byte and perceived performance. It's a core feature of RSC and the App Router.

#### Code Example / Key Takeaways
```jsx
import { Suspense } from 'react';
export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments /> {/* async, streams in later */}
      </Suspense>
    </div>
  );
}
```

---

### Q474. How do you choose between CSR, SSR, SSG, and ISR?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Pick by data freshness and audience. SSG for static, public, SEO-critical content at scale. ISR for content that changes occasionally. SSR for per-request, personalized, or frequently changing data. CSR for private, highly interactive, behind-login apps where SEO is irrelevant. Often a single app mixes them per route.

#### Code Example / Key Takeaways
```text
Docs/marketing  -> SSG (or ISR)
User dashboard  -> CSR or SSR (per-user)
News feed       -> SSR or ISR
Admin tool      -> CSR
```

---

### Q475. What is Partial Prerendering (PPR) in Next.js?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
PPR (experimental) combines static and dynamic rendering in one request: the static shell is prerendered at build time while dynamic holes are streamed in at request time, using Suspense boundaries to mark what's dynamic. It gives SSG speed with SSR flexibility. Enable via `experimental.ppr = true` (canary/experimental).

#### Code Example / Key Takeaways
```jsx
// app/page.js with Suspense marking dynamic content
export default function Page() {
  return (
    <>
      <StaticHeader />
      <Suspense fallback={<CartSkeleton />}>
        <DynamicCart /> {/* dynamic, streamed at request time */}
      </Suspense>
    </>
  );
}
```

---

### Q476. What is the difference between `<Suspense>` and `loading.js`?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
`<Suspense>` is a React primitive you place manually around any async subtree for streaming. `loading.js` is a Next.js convenience that automatically wraps a route segment's page in a Suspense boundary with its own fallback. Use `<Suspense>` for fine-grained control within a page; use `loading.js` for segment-level loading states.

#### Code Example / Key Takeaways
```jsx
// loading.js => automatic <Suspense fallback={<Loading/>}> around page
// Manual control inside a page:
<Suspense fallback={<ChartSkeleton/>}><ExpensiveChart/></Suspense>
```

---

### Q477. What are Micro-frontends and why use them?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Micro-frontends split a frontend into independently developed, deployed, and owned pieces (by team/domain), composed into one app at runtime or build time. Benefits: team autonomy, independent deploys, tech heterogeneity. Costs: complexity, duplicated dependencies, runtime coordination, and consistency challenges. Use only at organizational scale where the benefits outweigh overhead.

#### Code Example / Key Takeaways
```text
Team A -> Cart app (React 18)
Team B -> Search app (React 19)
Shell  -> composes both via Module Federation
```

---

### Q478. What is Module Federation and how does it enable Micro-frontends?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Module Federation (Webpack 5 / Rspack / Turbopack support evolving) lets multiple builds expose and consume modules at runtime. A "host" app loads "remote" components over the network without a build-time dependency. This is the most common Micro-frontend mechanism, enabling separate deploy cycles and shared, lazily-loaded code.

#### Code Example / Key Takeaways
```js
// webpack.config.js (host)
new ModuleFederationPlugin({
  name: 'host',
  remotes: { cart: 'cart@https://cart.app/mf-manifest.json' },
});
// Usage in React: const Cart = React.lazy(() => import('cart/Cart'));
```

---

### Q479. How do you load a remote Micro-frontend component in React?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Lazily import the remote module and render it inside `<Suspense>`. The remote must be reachable and expose the component via its Module Federation config. Wrap with error handling so a remote failure degrades gracefully rather than crashing the whole shell.

#### Code Example / Key Takeaways
```jsx
const RemoteCart = React.lazy(() => import('cart/Cart'));
function Shell() {
  return (
    <ErrorBoundary fallback={<p>Cart unavailable</p>}>
      <Suspense fallback={<Spinner />}>
        <RemoteCart />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

### Q480. What are the challenges of sharing state and dependencies in Micro-frontends?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Key challenges: duplicated libraries (multiple React copies → broken context/hooks), version skew, shared auth/session, global CSS conflicts, and consistent design systems. Mitigate by singletons (`shared` config), runtime shared libraries, event-bus or URL-based cross-app communication, and a federated design system. Avoid sharing mutable global state directly.

#### Code Example / Key Takeaways
```js
// Prevent duplicate React with singletons
shared: { react: { singleton: true, requiredVersion: '^18.0.0' } }
```

---

### Q481. How do you implement a shared design system across Micro-frontends?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Publish the design system as a standalone package (npm, internal registry) and mark it as a `shared` singleton in Module Federation so all remotes use the exact same instance. Alternatively, serve it from a CDN with import maps. This guarantees a single theme, components, and tokens across all apps without bundling duplicates.

#### Code Example / Key Takeaways
```js
// webpack.config.js (each app)
new ModuleFederationPlugin({
  shared: {
    '@company/design-system': { singleton: true, eager: true },
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});
```

---

### Q482. What are the tradeoffs of Runtime vs Build-time Micro-frontend integration?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Runtime (Module Federation): independent deploys, hot swaps, but runtime complexity, network latency, and duplicate risk. Build-time (monorepo, Nx, Turborepo): single build, zero duplication, atomic deploys, but all teams blocked by one pipeline and must coordinate versions. Most orgs start with build-time and adopt runtime only when deploy independence becomes a real bottleneck.

#### Code Example / Key Takeaways
```text
Build-time: Nx, Turborepo, Yarn workspaces - simpler, fewer footguns
Runtime: Module Federation - true team autonomy, more complex ops
```

---

### Q483. How do you handle authentication and session sharing in Micro-frontends?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Keep auth state in a shared, trusted layer (HTTP-only cookies, a tiny auth MFE, or a JWT in localStorage). Don't share the whole auth object across remotes; instead, each remote validates the token or calls a `/me` endpoint. The shell app holds the session cookie and passes auth headers to backend calls. Avoid syncing auth state via events between remotes.

#### Code Example / Key Takeaways
```jsx
// Shell sets auth cookie on login; each remote reads it or calls auth-service
// Don't: RemoteA.onLogin(() => RemoteB.updateUser(...))
// Do:    Cookie set by shell -> all requests include it automatically
```

---

### Q484. What is the `next/dynamic` import and when to use it?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
`next/dynamic` is Next's wrapper around `React.lazy` + `Suspense` with SSR control. Use it to code-split heavy components (charts, editors) so their JS loads only when needed. The `ssr: false` option forces client-only rendering, useful for components that use `window` or are incompatible with server rendering.

#### Code Example / Key Takeaways
```jsx
import dynamic from 'next/dynamic';
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false, // skip SSR, client-only
});
```

---

### Q485. How do you use `React.Suspense` with `next/dynamic` for code-splitting?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
Wrap the dynamic import in `<Suspense>` to show a fallback while the chunk loads. The `loading` option in `next/dynamic` is a shorthand for this. The component only mounts after the chunk is downloaded and parsed, keeping initial bundle small.

#### Code Example / Key Takeaways
```jsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
const Editor = dynamic(() => import('./Editor'));
export default function Page() {
  return (
    <Suspense fallback={<p>Loading editor...</p>}>
      <Editor />
    </Suspense>
  );
}
```

---

### Q486. What is the `use` hook (React 19) and how does it relate to Suspense?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
`use(promise)` reads the resolved value of a promise, suspending if it's not ready. It works in Server Components (replaces `await` with readable composition) and Client Components (lets you kick off fetch early and read later). It integrates with Suspense boundaries and enables streaming with less boilerplate than `await` in async components.

#### Code Example / Key Takeaways
```jsx
import { use } from 'react';
// Server Component - use reads a promise, suspends if pending
function Post({ promise }) {
  const post = use(promise);
  return <article>{post.title}</article>;
}
// Client Component - fetch starts early, read suspends
const promise = fetch('/api/post/1').then((r) => r.json());
function ClientPost() {
  const post = use(promise);
  return <h1>{post.title}</h1>;
}
```

---

### Q487. How do you optimize bundle size in a Next.js App Router application?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Use RSC by default (zero client JS), split heavy UI with `dynamic` + `ssr: false`, import only needed lodash/date-fns parts, enable `optimizePackageImports` in `next.config.js`, audit with `@next/bundle-analyzer`, prefer native browser APIs, and keep Client Components small and leaf-only. Tree-shaking and granular imports are your biggest levers.

#### Code Example / Key Takeaways
```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['lodash', 'date-fns', 'react-icons'],
  },
};
```

---

### Q488. What is `optimizePackageImports` and how does it work?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
`optimizePackageImports` in `next.config.js` tells Next's compiler (Turbopack/SWC) to transform barrel-file imports like `import { A, B } from 'lib'` into direct imports (`import A from 'lib/A'`) for specified packages. This improves tree-shaking and reduces bundle size without changing source code. It works for popular icon/utility libraries out of the box.

#### Code Example / Key Takeaways
```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['@mui/icons-material', 'lucide-react', 'date-fns'],
  },
};
// import { Add, Delete } from '@mui/icons/material'
// -> auto-rewritten to direct imports
```

---

### Q489. How do you measure and improve Core Web Vitals in Next.js?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Use Vercel Speed Insights, web-vitals library, or Chrome DevTools. Key levers: RSC/SSR for LCP (fast HTML), `next/image` for CLS/LCP, font optimization (`next/font`), code-splitting for INP, streaming with Suspense, ISR for cache hits, and reducing third-party scripts. Set budgets in CI to catch regressions.

#### Code Example / Key Takeaways
```jsx
import Image from 'next/image';
import { Inter } from 'next/font/google';
const font = Inter({ subsets: ['latin'], display: 'swap' });
// Use <Image priority /> for above-fold LCP
```

---

### Q490. What is the `next/font` optimization and why use it?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
`next/font` self-hosts Google/Adobe fonts at build time, strips unused glyphs, inlines CSS, and prevents layout shift (`display: swap`). No external font requests = faster LCP, zero CLS from fonts, and privacy compliance (no Google Fonts requests). Works in RSC and Client Components.

#### Code Example / Key Takeaways
```jsx
import { Roboto } from 'next/font/google';
const roboto = Roboto({ subsets: ['latin'], display: 'swap', variable: '--font-roboto' });
export default function Layout({ children }) {
  return <html className={roboto.variable}>{children}</html>;
}
```

---

### Q491. How do you use `next/image` for optimal image loading?
**Difficulty:** `Intermediate`
**Category:** Advanced Patterns & Next.js

#### Answer
`next/image` automatically optimizes, resizes, and serves modern formats (AVIF/WebP) on demand. It prevents CLS with explicit dimensions, lazy-loads below-fold, and supports `priority` for above-fold images. Configure `remotePatterns` for external sources. It replaces manual `img` tags entirely.

#### Code Example / Key Takeaways
```jsx
import Image from 'next/image';
<Image src='/hero.jpg' alt='Hero' width={1200} height={600} priority />
// For remote: next.config.js -> images: { remotePatterns: [{ hostname: 'cdn.example.com' }] }
```

---

### Q492. What is the `Middleware` in Next.js and how does it differ from Server Components?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Middleware runs before the request reaches the route, at the Edge. It can rewrite, redirect, modify headers, or respond directly. It's not a React component; it has no access to React context or Server Component data. Use it for auth checks, i18n routing, bot protection, A/B testing, or geolocation — anything that must run before rendering.

#### Code Example / Key Takeaways
```js
// middleware.ts
import { NextResponse } from 'next/server';
export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin') && !req.cookies.get('admin')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };
```

---

### Q493. How do you implement internationalization (i18n) with the App Router?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Use a `[locale]` segment (e.g., `app/[locale]/page.js`) to capture the locale in `params`. Generate static params for known locales. Use a dictionary per locale (JSON/TS modules) or a library like `next-intl`. Middleware can redirect `/` to the default locale. Avoid the old `next.config.js` i18n; the App Router handles it via file structure.

#### Code Example / Key Takeaways
```jsx
// app/[locale]/page.js
import { getDict } from '@/lib/dict';
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}
export default async function Page({ params }) {
  const dict = await getDict((await params).locale);
  return <h1>{dict.welcome}</h1>;
}
```

---

### Q494. What are Parallel Routes in the App Router?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Parallel routes (slots) let you render multiple pages simultaneously in the same layout using named folders `@folder`. Each slot has its own loading/error state and can be navigated independently (e.g., modal, sidebar, tabs). Define `default.js` for unmatched slots. They enable complex UIs without a single page owning all content.

#### Code Example / Key Takeaways
```text
app/
  layout.js
  @modal/
    default.js    // shown when no modal active
    settings/
      page.js
  @sidebar/
    default.js
    page.js
// layout.js receives { children, modal, sidebar }
```

---

### Q495. What are Intercepting Routes and when would you use them?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Intercepting routes ( `(..)` and `(...)` folders) let you show a different UI for a route while keeping the same URL — e.g., open a photo in a modal from the feed, but `/photo/1` still works as a standalone page on direct load/refresh. Use for modals, drawers, or preview overlays without breaking deep links.

#### Code Example / Key Takeaways
```text
app/
  feed/
    page.js           // feed
    (..)photo/[id]/   // intercepts /photo/:id, shows modal
      page.js
  photo/
    [id]/
      page.js         // standalone photo page
// Click feed link -> modal; refresh -> full page
```

---

### Q496. How do you secure Server Actions against CSRF and malicious input?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Next.js Server Actions include built-in CSRF protection (origin/header checks) and only accept same-origin requests by default. Validate all inputs with Zod/Valibot inside the action. Use `await` on `headers()`/`cookies()` to read auth. Never trust client data; treat actions like public API endpoints. Rate-limit via middleware if needed.

#### Code Example / Key Takeaways
```jsx
'use server';
import { z } from 'zod';
const schema = z.object({ title: z.string().min(3).max(100) });
export async function createPost(formData) {
  const data = schema.parse(Object.fromEntries(formData));
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return db.post.create({ data: { ...data, authorId: session.userId } });
}
```

---

### Q497. What are the performance implications of using many Client Components?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Each `'use client'` boundary adds its component subtree to the client bundle. Deeply nested client trees ship more JS, increase hydration cost, and reduce streaming benefits. Keep Client Components as leaf nodes (buttons, forms, small widgets) and push data fetching up to Server Components. Audit with bundle analyzer; consolidate and lift client boundaries where possible.

#### Code Example / Key Takeaways
```text
Bad: <ClientLayout><ClientSidebar><ClientFeed><ClientCard/></ClientFeed></ClientSidebar></ClientLayout>
// All client, huge bundle
Good: <ServerLayout><ServerSidebar/><ServerFeed><ClientCard/></ServerFeed></ServerLayout>
// Only Card is client
```

---

### Q498. How do you test Server Components and Server Actions?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Server Components: test via Next.js testing utilities (render to HTML string, assert output) or integration tests with Playwright/Cypress against a running dev server. Server Actions: test the action logic directly (it's just an async function) by calling it with mock data and asserting DB calls, revalidations, and return values. Mock `next/cache` and DB.

#### Code Example / Key Takeaways
```jsx
// Test Server Action directly
import { createPost } from '@/actions';
jest.mock('@/lib/db', () => ({ post: { create: jest.fn() } }));
test('creates post', async () => {
  const fd = new FormData(); fd.set('title', 'Hello');
  await createPost(fd);
  expect(db.post.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hello' }));
});
```

---

### Q499. What is the difference between `revalidatePath` and `revalidateTag`?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
`revalidatePath(path)` invalidates cached output for a specific route (page/layout). `revalidateTag(tag)` invalidates all `fetch` calls that were tagged with that tag, regardless of which route uses them. Tags enable granular, cross-route invalidation (e.g., invalidate all "product-123" data across the app). Paths are simpler for page-level refresh.

#### Code Example / Key Takeaways
```jsx
// Tag-based (fine-grained, cross-route)
fetch(url, { next: { tags: ['post-1'] } });
revalidateTag('post-1'); // invalidates everywhere that tag is used
// Path-based (page-level)
revalidatePath('/posts/1'); // invalidates only that route's cache
```

---

### Q500. What are the key considerations when migrating from Pages Router to App Router?
**Difficulty:** `Advanced`
**Category:** Advanced Patterns & Next.js

#### Answer
Migrate incrementally: both routers can coexist. Convert leaf pages first. Replace `getStaticProps`/`getServerSideProps` with async RSC or `fetch` with cache options. Move data fetching into components. Replace `_app.js`/_`document.js` with `app/layout.js`. Convert API routes to Route Handlers. Audit `use client` boundaries; many Pages Router components can become Server Components. Test each route for hydration errors, dynamic usage, and streaming behavior.

#### Code Example / Key Takeaways
```text
Pages -> App migration checklist:
1. Add app/ dir alongside pages/
2. Migrate leaf pages to async Server Components
3. Replace getStaticProps with fetch({ next: { revalidate } })
4. Replace getServerSideProps with dynamic = 'force-dynamic'
5. Convert _app/_document to root layout.js
6. Move API routes to app/api/.../route.js
7. Audit and minimize 'use client' usage
8. Enable static optimization where possible
```
