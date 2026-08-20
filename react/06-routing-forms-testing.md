# React Interview Questions: Routing, Forms & Testing

---

### Q371. What is React Router and why is it necessary for SPAs?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
React Router is the standard routing library for React applications. It enables client-side routing in Single Page Applications (SPAs) by synchronizing the UI with the URL without making full page requests to the server. Without a router, an SPA would show the same UI regardless of the URL, making bookmarking, sharing links, and browser navigation impossible. React Router provides declarative routing through components, allowing you to map URL paths to specific React components.

#### Code Example / Key Takeaways
```jsx
// Without React Router - URL never changes UI
function App() {
  return <HomePage />; // Always shows HomePage regardless of URL
}

// With React Router - URL drives UI
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/about' element={<AboutPage />} />
        <Route path='/users/:id' element={<UserProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
```
---

### Q372. What is the difference between BrowserRouter, HashRouter, and MemoryRouter?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
- BrowserRouter uses the HTML5 History API to keep UI in sync with the URL, producing clean URLs like /users/123. It requires server-side configuration so that deep links resolve to index.html.
- HashRouter stores the location in the URL hash (#/users/123). It works on any static host without server configuration and is useful for legacy browsers, but creates uglier URLs and the hash is never sent to the server.
- MemoryRouter keeps history in memory (no URL change). It is ideal for tests, React Native, and server-side rendering where there is no browser history.

#### Code Example / Key Takeaways
```jsx
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';

// Production web app
<BrowserRouter><App /></BrowserRouter>;

// Static host with no server rewrites
<HashRouter><App /></HashRouter>;

// Tests / non-browser environments
<MemoryRouter initialEntries={['/users/1']}><App /></MemoryRouter>;
```
---

### Q373. How do you define routes in React Router v6 with Routes and Route?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
In v6, routes are defined using the `<Routes>` component which replaces the older `<Switch>`. You nest `<Route>` elements with a `path` and an `element`. The `Routes` component renders the first matching route. Paths are relative and you can nest routes to build layouts. There is no longer an `exact` prop, because v6 does ranking/score-based matching automatically and uses the most specific match.

#### Code Example / Key Takeaways
```jsx
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Layout />}>
        <Route index element={<Home />} />
        <Route path='about' element={<About />} />
        <Route path='users/:id' element={<UserProfile />} />
        <Route path='*' element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```
---

### Q374. What is the difference between Link, NavLink, and useNavigate?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
- `<Link>` renders an accessible anchor that performs client-side navigation via the History API without a full reload.
- `<NavLink>` is a special Link that adds styling hooks (className or style functions) when the link is active, perfect for navigation menus.
- `useNavigate()` is a hook returning a function used for imperative navigation inside event handlers or effects (e.g., redirect after a form submit).

#### Code Example / Key Takeaways
```jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';

function Nav() {
  const navigate = useNavigate();
  return (
    <nav>
      <NavLink to='/' style={({ isActive }) => ({ color: isActive ? 'red' : 'black' })}>Home</NavLink>
      <Link to='/about'>About</Link>
      <button onClick={() => navigate('/login')}>Go login</button>
    </nav>
  );
}
```
---

### Q375. How do you read route parameters with useParams?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
`useParams()` is a hook that returns an object of key/value pairs of the dynamic segments defined in the route path. For a route defined as /users/:id, the component rendered at that route can read the id via useParams(). Values are always strings and must be type-coerced when needed.

#### Code Example / Key Takeaways
```jsx
import { useParams } from 'react-router-dom';

function UserProfile() {
  const { id, tab } = useParams(); // for path /users/:id/:tab
  return <h1>User {id}, tab {tab}</h1>;
}
```
---

### Q376. How do you read and update query strings with useSearchParams?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
`useSearchParams()` is a hook that returns a tuple: the current URLSearchParams and a setter function. It behaves like useState but is backed by the URL query string. You read values with `.get('key')`, and update them via the setter which accepts a URLSearchParams instance or a function. This makes shareable, bookmarkable filters and pagination state a natural fit for the URL.

#### Code Example / Key Takeaways
```jsx
import { useSearchParams } from 'react-router-dom';

function Products() {
  const [params, setParams] = useSearchParams();
  const page = params.get('page') ?? '1';
  const q = params.get('q') ?? '';

  const onSearch = (text) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('q', text);
      next.set('page', '1');
      return next;
    });
  };

  return <input defaultValue={q} onChange={e => onSearch(e.target.value)} />;
}
```
---

### Q377. What changed from React Router v5 to v6?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Key v5 to v6 changes: `Switch` was replaced by `Routes`; routes are now defined with `element` prop instead of `component`/`render`; the `exact` prop was removed because v6 uses ranked matching; nested routes use relative paths and a parent layout with `<Outlet/>`; `useHistory` became `useNavigate`; redirects use `<Navigate>` or the `navigate` function; and `useRoutes` allows defining routes as JavaScript objects for better composition.

#### Code Example / Key Takeaways
```jsx
// v5
<Switch>
  <Route exact path='/' component={Home} />
  <Redirect to='/login' />
</Switch>

// v6
<Routes>
  <Route path='/' element={<Home />} />
  <Route path='/login' element={<Navigate to='/dashboard' replace />} />
</Routes>
```
---

### Q378. How do you create nested routes and use Outlet?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Nested routes let a parent route render a layout while child routes render inside it via `<Outlet />`. You define children as nested `<Route>` elements. The parent component places `<Outlet />` where the child should appear. This avoids repeating shared UI like navbars and sidebars across pages.

#### Code Example / Key Takeaways
```jsx
function Dashboard() {
  return (
    <div>
      <Sidebar />
      <Outlet /> {/* child route renders here */}
    </div>
  );
}

<Routes>
  <Route path='dashboard' element={<Dashboard />}>
    <Route index element={<Overview />} />
    <Route path='stats' element={<Stats />} />
  </Route>
</Routes>
```
---

### Q379. How do you implement protected (authenticated) routes in React Router v6?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
A common pattern is a wrapper component, often called `<RequireAuth>`, that checks an auth state and either renders `<Outlet/>` (allowing children to render) or redirects to a login page using `<Navigate replace />`. The protected route is then placed in the tree with the wrapper as its element and the real pages as children. Using `replace` prevents the protected URL from staying in history after redirect.

#### Code Example / Key Takeaways
```jsx
function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.user) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }
  return <Outlet />;
}

<Route element={<RequireAuth />}>
  <Route path='profile' element={<Profile />} />
  <Route path='settings' element={<Settings />} />
</Route>
```
---

### Q380. What are loaders and actions in React Router (data routers)?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Data routers (created via `createBrowserRouter` / `RouterProvider`) let you define `loader` and `action` functions on routes. A `loader` runs before rendering to fetch data, returning a promise that the component reads with `useLoaderData()`. An `action` handles mutations (often from forms) and runs on submission. This co-locates data fetching and mutations with routes and supports pending/error states via `useNavigation()` and `errorElement`.

#### Code Example / Key Takeaways
```jsx
const router = createBrowserRouter([
  {
    path: '/users/:id',
    element: <User />,
    loader: async ({ params }) => fetchUser(params.id),
    action: async ({ request, params }) => updateUser(params.id, await request.formData()),
    errorElement: <ErrorPage />,
  },
]);
```

---

### Q381. How do you access loader data with useLoaderData and redirect with loaders?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Inside a component rendered by a route with a loader, call `useLoaderData()` to get the value the loader returned. Loaders can also call the `redirect()` helper to send the user elsewhere (e.g., to login when unauthenticated) instead of returning data. The redirected response is handled by the router automatically.

#### Code Example / Key Takeaways
```jsx
import { useLoaderData, redirect } from 'react-router-dom';

export async function loader({ request }) {
  const user = await getSession(request);
  if (!user) return redirect('/login');
  return user;
}

function Account() {
  const user = useLoaderData();
  return <h1>{user.name}</h1>;
}
```
---

### Q382. What is the purpose of the Form component in React Router and how does it relate to actions?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
React Router's `<Form>` component is a drop-in replacement for the HTML `<form>` that intercepts submission and sends the data to the route's `action` instead of causing a navigation/document reload. It uses the method (GET/POST) and action (defaults to the current route). Combined with `action` functions and `useNavigation`, you get progressive-enhancement-friendly forms with built-in pending states.

#### Code Example / Key Takeaways
```jsx
import { Form, useNavigation } from 'react-router-dom';

function NewPost() {
  const nav = useNavigation();
  const submitting = nav.state === 'submitting';
  return (
    <Form method='post'>
      <input name='title' />
      <button disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
    </Form>
  );
}
```
---

### Q383. How do you handle errors in routes using errorElement and useRouteError?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Each route can declare an `errorElement` which renders when its loader, action, or component throws. Inside that element, `useRouteError()` returns the thrown value so you can show a meaningful message. A root `errorElement` catches errors for the whole tree. This replaces try/catch sprawl with a declarative, per-route error boundary.

#### Code Example / Key Takeaways
```jsx
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} {error.statusText}</h1>;
  }
  return <h1>Oops: {error.message}</h1>;
}
```
---

### Q384. How does useNavigation help with loading and submitting states?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
`useNavigation()` returns the current navigation state of the router: `idle`, `loading`, or `submitting`. You use it to show spinners or disable buttons while loaders are running or forms are being submitted. `navigation.location` tells you the destination during a transition, which is handy for optimistic highlighting of the next route.

#### Code Example / Key Takeaways
```jsx
function Layout() {
  const nav = useNavigation();
  return (
    <div>
      {nav.state === 'loading' && <GlobalSpinner />}
      <Outlet />
    </div>
  );
}
```
---

### Q385. What is the difference between useLocation, useNavigate, and useMatch?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
- `useLocation()` returns the current location object ({ pathname, search, hash, state }) and is useful for reading the full URL or reacting to changes.
- `useNavigate()` returns a function to programmatically change the route.
- `useMatch(pattern)` returns match data if the current location matches a given path pattern, useful for conditional logic without rendering a Route.

#### Code Example / Key Takeaways
```jsx
const location = useLocation();
const navigate = useNavigate();
const match = useMatch('/users/:id');
console.log(location.search, match?.params.id);
```
---

### Q386. How do you pass state through navigation and read it at the destination?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
You can attach a `state` object when navigating via `<Link to='..' state={{ from: 'home' }}>` or `navigate('/x', { state })`. At the destination, `useLocation().state` exposes it. This is ideal for transient data like "redirect back to" URLs or modal context without putting it in the query string.

#### Code Example / Key Takeaways
```jsx
<Link to='/checkout' state={{ productId: 42 }}>Buy</Link>;

function Checkout() {
  const { state } = useLocation();
  return <p>Product: {state?.productId}</p>;
}
```
---

### Q387. How do you handle redirects with the Navigate component and replace?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
`<Navigate to='/path' />` renders and immediately navigates to the target. The `replace` prop replaces the current entry in history instead of pushing a new one, which is what you want after a login redirect so the user does not bounce back to the protected page on "back". You can also drive it conditionally.

#### Code Example / Key Takeaways
```jsx
function OldRoute() {
  return <Navigate to='/new-route' replace />;
}
```
---

### Q388. What is a controlled component in React forms?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
A controlled component is a form input whose value is driven by React state. You set `value={state}` and update state in an `onChange` handler. React becomes the single source of truth, which makes validation, conditional UI, and formatting straightforward. The trade-off is more re-renders, though for typical forms this is negligible.

#### Code Example / Key Takeaways
```jsx
function Controlled() {
  const [name, setName] = useState('');
  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```
---

### Q389. What is an uncontrolled component and when would you use one?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
An uncontrolled component stores its own state in the DOM. You read values via a ref (`inputRef.current.value`) rather than React state. It is useful for simple forms, integrating with non-React libraries, large forms where you want to avoid many re-renders, or using native features like file inputs. The default value is set with `defaultValue`/`defaultChecked`.

#### Code Example / Key Takeaways
```jsx
function Uncontrolled() {
  const ref = useRef(null);
  const submit = () => alert(ref.current.value);
  return <input ref={ref} defaultValue='initial' />;
}
```
---

### Q390. Compare controlled vs uncontrolled components with pros and cons.
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Controlled components keep form state in React, enabling instant validation, conditional fields, and dynamic formatting, but cause a re-render per keystroke. Uncontrolled components keep state in the DOM, reducing re-renders and easing integration with third-party widgets, but you must imperatively query values and get validation only on submit. Rule of thumb: use controlled for interactive forms, uncontrolled for performance-sensitive or simple/embedded cases.

#### Code Example / Key Takeaways
```jsx
// Controlled: validation as you type
const [email, setEmail] = useState('');
const invalid = !email.includes('@');

// Uncontrolled: read once at submit
const ref = useRef();
const onSubmit = () => console.log(ref.current.value);
```

---

### Q391. What is React Hook Form and why is it performant?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
React Hook Form (RHF) is a library for building forms with minimal re-renders. Unlike controlled inputs that re-render on every keystroke, RHF uses uncontrolled inputs registered via `ref` and reads values on demand, subscribing components selectively to only the fields they care about. It uses native validation and isolates re-renders to individual inputs through its subscription model, which makes it fast even with large forms.

#### Code Example / Key Takeaways
```jsx
// RHF avoids re-rendering the whole form on each keystroke
const { register, handleSubmit } = useForm();
const onSubmit = (data) => console.log(data);
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email')} />
</form>;
```
---

### Q392. How do you build a form with useForm, register, and handleSubmit?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Call `useForm()` to get `register`, `handleSubmit`, `formState`, etc. Spread `register('name')` onto each input to wire it up. `handleSubmit(onValid, onInvalid)` wraps your submit handler and runs validation before calling onValid with the form values. RHF collects all registered values for you, no manual state needed.

#### Code Example / Key Takeaways
```jsx
import { useForm } from 'react-hook-form';

function Signup() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const submit = (data) => console.log(data);
  return (
    <form onSubmit={handleSubmit(submit)}>
      <input {...register('email', { required: 'Email required' })} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type='submit'>Go</button>
    </form>
  );
}
```
---

### Q393. Explain formState in React Hook Form (errors, isSubmitting, isValid, dirtyFields).
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
`formState` is a proxy object exposing form status: `errors` holds validation messages, `isSubmitting` is true during async submission, `isValid` reflects whether the form passes validation, `dirtyFields` marks which fields changed, and `isDirty`/`touchedFields` track interaction. Because formState is a proxy, you must destructure the fields you use so RHF subscribes to them and triggers re-renders correctly.

#### Code Example / Key Takeaways
```jsx
const { formState: { errors, isSubmitting, isValid } } = useForm({ mode: 'onChange' });
// Destructure to subscribe; isSubmitting drives the button spinner
```
---

### Q394. How do you validate with React Hook Form rules and with a schema (zodResolver)?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
RHF supports inline rules via `register('field', { required, minLength, pattern })`. For complex validation, you use a resolver (e.g., `@hookform/resolvers/zod` with `zodResolver(schema)`). A Zod schema centralizes types and validation, giving you end-to-end type safety and reusable, composable rules that also validate server payloads.

#### Code Example / Key Takeaways
```jsx
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({ email: z.string().email(), age: z.number().min(18) });
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```
---

### Q395. What are the performance benefits of React Hook Form compared to controlled forms?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
RHF minimizes re-renders by using uncontrolled inputs and a ref-based registry, so typing in one field does not re-render the whole component. It isolates subscriptions so only components reading a given field re-render. Controlled forms re-render the parent on every keystroke. For large forms, RHF's approach yields significantly better input latency and lower memory churn.

#### Code Example / Key Takeaways
```jsx
// Controlled: every keystroke re-renders App
const [v, setV] = useState('');
<input value={v} onChange={e => setV(e.target.value)} />;

// RHF: input value lives in DOM ref; no re-render per keystroke
<input {...register('name')} />;
```
---

### Q396. How do you use Formik for form state and validation?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Formik manages form state, validation, and submission. You use `useFormik()` or the `<Formik>` component with `initialValues`, `onSubmit`, and `validate` (or a validation schema). `values`, `errors`, `touched`, and `handleChange`/`handleSubmit` come from Formik. It is a controlled approach, so it re-renders on each change, which is simpler to reason about but heavier for large forms than RHF.

#### Code Example / Key Takeaways
```jsx
import { useFormik } from 'formik';

function Form() {
  const f = useFormik({
    initialValues: { email: '' },
    validate: (v) => (!v.email ? { email: 'Required' } : {}),
    onSubmit: (v) => console.log(v),
  });
  return (
    <form onSubmit={f.handleSubmit}>
      <input name='email' value={f.values.email} onChange={f.handleChange} />
      {f.errors.email && f.touched.email && <span>{f.errors.email}</span>}
    </form>
  );
}
```
---

### Q397. How do you validate with Yup and Formik?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Yup is a schema builder that pairs naturally with Formik via the `validationSchema` prop. Formik runs the schema on change/blur and populates `errors`/`touched`. This keeps validation declarative and reusable. The same schema can validate on the server, preventing drift between client and API.

#### Code Example / Key Takeaways
```jsx
import * as Yup from 'yup';

const schema = Yup.object({
  email: Yup.string().email('Invalid').required('Required'),
  password: Yup.string().min(8, 'Too short'),
});

<Formik validationSchema={schema} initialValues={{ email: '', password: '' }} onSubmit={...}>
  {/* render props give values, errors, touched */}
</Formik>;
```
---

### Q398. Zod vs Yup: when would you choose one for form validation?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Zod is TypeScript-first: its schemas infer static types automatically (`z.infer`), making it ideal in TS projects and with RHF's resolver. Yup is older, mature, and has a fluent API widely used with Formik. Choose Zod when you want type inference and composable schemas in a TS codebase; choose Yup for existing Formik setups or when you prefer its API ergonomics. Both validate at runtime.

#### Code Example / Key Takeaways
```ts
// Zod infers the type
const schema = z.object({ email: z.string().email() });
type Form = z.infer<typeof schema>; // { email: string }
```
---

### Q399. How do you build dynamic / field-array forms with React Hook Form's useFieldArray?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
`useFieldArray({ control, name })` manages arrays of fields with `fields`, `append`, `remove`, and `insert`. It returns stable `id`s for keys. This is how you build repeatable rows (e.g., todo lists, invoice line items) without manually managing array state, and RHF tracks each sub-field's registration automatically.

#### Code Example / Key Takeaways
```jsx
const { control, register } = useForm({ defaultValues: { items: [{ name: '' }] } });
const { fields, append, remove } = useFieldArray({ control, name: 'items' });

fields.map((field, i) => (
  <div key={field.id}>
    <input {...register(`items.${i}.name`)} />
    <button type='button' onClick={() => remove(i)}>x</button>
  </div>
));
<button type='button' onClick={() => append({ name: '' })}>Add</button>;
```
---

### Q400. How do you handle file uploads in React forms?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
File inputs are inherently uncontrolled because `value` cannot be set for security reasons. Read the selected file from `event.target.files[0]`. With RHF, register the input and read `data.file[0]`. Upload via FormData: append the file and POST with `multipart/form-data`. Always validate type and size before uploading, and show upload progress with XHR or a fetch wrapper.

#### Code Example / Key Takeaways
```jsx
const onSubmit = async (data) => {
  const fd = new FormData();
  fd.append('avatar', data.avatar[0]);
  await fetch('/upload', { method: 'POST', body: fd });
};
<input type='file' {...register('avatar', { validate: f => f[0]?.size < 1e6 || 'Too big' })} />;
```

---

### Q401. How do you reset a form and set default values in React Hook Form?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
Pass `defaultValues` to `useForm()` for initial values. Use `reset(values)` to programmatically clear or repopulate the form, e.g., after a successful submit or when loading data to edit. `reset()` with no args restores defaults. Note that RHF uses uncontrolled inputs, so defaultValues only apply on mount unless you call reset.

#### Code Example / Key Takeaways
```jsx
const { reset, handleSubmit } = useForm({ defaultValues: { name: '' } });
const submit = (data) => { console.log(data); reset(); };
// To load existing record:
useEffect(() => { if (user) reset(user); }, [user, reset]);
```
---

### Q402. How do you watch form values with the watch method?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
`watch(name?)` returns the current value(s) of fields and subscribes the component to changes, causing re-renders when watched fields change (a trade-off versus register, which does not re-render). Use it when UI depends on a value (e.g., showing a password strength meter or conditional field). For non-reactive reads, use `getValues()`.

#### Code Example / Key Takeaways
```jsx
const { register, watch } = useForm();
const pw = watch('password');
return (
  <>
    <input {...register('password')} />
    <Meter strength={pw?.length ?? 0} />
  </>
);
```
---

### Q403. How do you do conditional / dependent fields in a form?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Use `watch()` (RHF) or the controlled value (Formik) to read one field and conditionally render another. For validation dependencies, reference other fields inside resolver rules or the validate function. Avoid mounting/unmounting inputs you want to preserve; instead use conditional rendering with keys or `shouldUnregister` carefully so values do not leak.

#### Code Example / Key Takeaways
```jsx
const country = watch('country');
return (
  <> 
    <select {...register('country')}>...</select>
    {country === 'US' && <input {...register('state')} placeholder='State' />}
  </>
);
```
---

### Q404. What are the best practices for accessible forms (labels, aria, errors)?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Always associate labels with inputs via `htmlFor`/`id` or wrap them. Use `aria-invalid` and `aria-describedby` to connect error messages to inputs for screen readers. Announce errors with `role='alert'` or `aria-live`. Group related controls with `fieldset`/`legend`. Provide clear, specific error text and visible focus styles. Accessible forms improve usability for everyone and are legally required in many contexts.

#### Code Example / Key Takeaways
```jsx
<label htmlFor='email'>Email</label>
<input id='email' aria-invalid={!!errors.email} aria-describedby='email-err' {...register('email')} />
{errors.email && <span id='email-err' role='alert'>{errors.email.message}</span>}
```
---

### Q405. How do you test a React component with React Testing Library and Jest?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
RTL promotes testing from the user's perspective. Render the component with `render(<Comp />)`, query DOM nodes the way a user finds them (`screen.getByRole`, `getByLabelText`, `getByText`), interact with `userEvent`, and assert on the resulting DOM. Avoid testing implementation details (internal state, method calls). Jest provides the runner, matchers, and mocking utilities.

#### Code Example / Key Takeaways
```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('shows greeting', async () => {
  render(<Greeting name='Ada' />);
  expect(screen.getByText('Hello Ada')).toBeInTheDocument();
});
```
---

### Q406. Explain the difference between getBy*, queryBy*, and findBy* queries.
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
- `getBy*` returns the matching node or throws immediately if not found (or if multiple match). Use for elements that should be present synchronously.
- `queryBy*` returns the node or null, never throws. Use for asserting absence (e.g., element removed).
- `findBy*` returns a promise that resolves when the element appears; use for async content (after fetch/timeout). There are also `getAllBy`/`queryAllBy`/`findAllBy` variants.

#### Code Example / Key Takeaways
```jsx
screen.getByText('Saved');          // must exist now
expect(screen.queryByText('Error')).toBeNull(); // must be absent
await screen.findByText('Loaded');  // appears async
```
---

### Q407. How do you simulate user interactions with userEvent?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
`@testing-library/user-event` provides realistic interaction simulation: `userEvent.click(el)`, `userEvent.type(input, 'text')`, `userEvent.selectOptions`. Prefer it over `fireEvent` because it dispatches the full sequence of events (focus, keydown, input, change) like a real browser. In v14, create an instance `const user = userEvent.setup()` (often in `beforeEach`) and await its methods.

#### Code Example / Key Takeaways
```jsx
const user = userEvent.setup();
await user.type(screen.getByLabelText('Email'), 'a@b.com');
await user.click(screen.getByRole('button', { name: 'Submit' }));
```
---

### Q408. How do you test a controlled form with React Testing Library?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Render the form, query the input by role/label, type into it with `userEvent.type`, click submit, then assert the expected outcome (e.g., success message or that the onSubmit handler was called with the typed value). If onSubmit is a mock prop, assert it was called with the correct data. Keep assertions about what the user sees, not internal state.

#### Code Example / Key Takeaways
```jsx
const onSubmit = jest.fn();
render(<Login onSubmit={onSubmit} />);
await user.type(screen.getByLabelText(/email/i), 'a@b.com');
await user.click(screen.getByRole('button', { name: /sign in/i }));
expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }));
```
---

### Q409. How do you test a React Hook Form component?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Treat it like any form: register inputs with proper labels/names so they are queryable. Type into fields and submit, then assert the resulting DOM or the mocked submit handler. To test validation, submit empty required fields and assert the error message appears (`getByText`/`findByText`). Access `handleSubmit`'s resolved data via a mock passed to the component or by asserting side effects.

#### Code Example / Key Takeaways
```jsx
render(<Signup />);
await user.click(screen.getByRole('button', { name: /submit/i }));
expect(await screen.findByText(/email required/i)).toBeInTheDocument();
await user.type(screen.getByLabelText(/email/i), 'a@b.com');
// ... fill rest, submit, assert success
```
---

### Q410. How do you mock API calls in tests using MSW (Mock Service Worker)?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
MSW intercepts network requests at the service worker (or node) level, so your component code uses real fetch/XHR unmodified. You define `handlers` with `http.get/post` returning mocked responses, set up a `server` in `beforeAll`/`afterEach`/`afterAll`, and optionally override per test with `server.use()`. This avoids mocking fetch internals and tests real request/response flows.

#### Code Example / Key Takeaways
```js
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/user', () => HttpResponse.json({ id: 1, name: 'Ada' }))
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### Q411. How do you test async behavior (loading / data fetching) in components?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Render the component, assert the loading state is shown (e.g., a spinner via `getByText('Loading')`), then await the async update with `findBy*` which retries until the resolved content appears. Use `waitFor` for states not tied to a specific element. Provide mocked data (MSW or a mocked module) so the test is deterministic and fast.

#### Code Example / Key Takeaways
```jsx
render(<UserList />);
expect(screen.getByText(/loading/i)).toBeInTheDocument();
expect(await screen.findByText('Ada')).toBeInTheDocument();
```
---

### Q412. Why should you avoid testing implementation details, and what is the "user event" testing philosophy?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Testing implementation details (internal state, private methods, props of children) makes tests brittle: refactors that preserve behavior break them. RTL's philosophy is to test as a user would, querying by accessible role/text and asserting visible outcomes. This gives confidence that the feature works for real users and keeps tests resilient to internal rewrites.

#### Code Example / Key Takeaways
```jsx
// Avoid: testing internal state
// expect(wrapper.state('open')).toBe(true);
// Prefer: testing what the user sees
expect(screen.getByRole('dialog')).toBeInTheDocument();
```
---

### Q413. How do you test routing and navigation with React Router in components?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Wrap the component in a `<MemoryRouter>` with `initialEntries` to control the starting URL. Provide route definitions so links/navigation render the right destinations, then assert navigation happened (e.g., the new page's text appears). Use `initialEntries={['/users/1']}` to test a dynamic param route. For hooks like `useNavigate`, render within the router and assert location changes via a test component that reads `useLocation`.

#### Code Example / Key Takeaways
```jsx
render(
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/about' element={<About />} />
    </Routes>
  </MemoryRouter>
);
await user.click(screen.getByRole('link', { name: /about/i }));
expect(screen.getByText(/about page/i)).toBeInTheDocument();
```
---

### Q414. How do you render a component that uses useParams / useNavigate in tests?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Route hooks require a Router context. Render the component inside `<MemoryRouter initialEntries={['/users/42']}>` with a `<Routes><Route path='/users/:id' element={<YourComp/>} /></Routes>`. Then `useParams()` returns `{ id: '42' }`. For `useNavigate`, click a button that navigates and assert the destination renders, or use a spy on navigate via a custom wrapper.

#### Code Example / Key Takeaways
```jsx
render(
  <MemoryRouter initialEntries={['/users/42']}>
    <Routes><Route path='/users/:id' element={<UserProfile />} /></Routes>
  </MemoryRouter>
);
expect(screen.getByText('User 42')).toBeInTheDocument();
```
---

### Q415. How do you mock modules with Jest (jest.mock) for testing?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
`jest.mock('module')` replaces a module with a mock for the whole test file; `jest.mock('module', () => ({ ... }), { virtual: true })` lets you supply a factory. Use `jest.fn()` for functions and control return values per test. Mock components you don't want to render (e.g., heavy charts) to keep tests focused. Remember hoisting: `jest.mock` calls are hoisted to the top regardless of placement.

#### Code Example / Key Takeaways
```jsx
jest.mock('../api', () => ({ fetchUser: jest.fn() }));
import { fetchUser } from '../api';
fetchUser.mockResolvedValue({ name: 'Ada' });
```
---

### Q416. What is the role of cleanup() and why does RTL auto-cleanup?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
`cleanup()` unmounts React trees rendered by RTL and removes them from the DOM. Without it, multiple renders in different tests would accumulate nodes and leak state/listeners. RTL auto-configures `afterEach(cleanup)` via its Jest setup, so you usually don't call it manually. It also resets `jest` mocks if configured. Disabling it is rarely needed.

#### Code Example / Key Takeaways
```js
// Usually automatic via jest.setup with @testing-library/react
import '@testing-library/react'; // exports cleanup, auto-wired by jest config
```
---

### Q417. How do you use jest.fn() spies and assertions like toHaveBeenCalledWith?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
`jest.fn()` creates a mock function you can pass as a callback/prop. Assertions verify behavior: `toHaveBeenCalled()`, `toHaveBeenCalledWith(args)`, `toHaveBeenCalledTimes(n)`, and `expect.any(Function)`. Inspect calls with `mock.calls`. This is how you test that a child invoked a parent handler with the right payload without rendering the parent's logic.

#### Code Example / Key Takeaways
```jsx
const onSave = jest.fn();
render(<Editor onSave={onSave} />);
await user.click(screen.getByRole('button', { name: /save/i }));
expect(onSave).toHaveBeenCalledTimes(1);
expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
```
---

### Q418. How do you test custom hooks with renderHook and act?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
`@testing-library/react`'s `renderHook` renders a hook in a test harness and returns `{ result, rerender, unmount }`. Read the latest value via `result.current`. Wrap state-changing interactions in `act()` (userEvent and fireEvent already wrap in act) so React flushes updates before you assert. For hooks needing context (router, query client), pass a `wrapper` option.

#### Code Example / Key Takeaways
```jsx
const { result } = renderHook(() => useCounter());
act(() => { result.current.increment(); });
expect(result.current.count).toBe(1);
```
---

### Q419. How do you test error states and error boundaries?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
For a thrown render error, wrap the component in an Error Boundary and assert the fallback UI renders. For data-fetch errors, mock the API to reject and assert the error message appears (using `findBy*` to await it). React 18 `render` does not catch errors during render; use `react-error-boundary`'s `ErrorBoundary` or a custom class boundary as the wrapper in tests.

#### Code Example / Key Takeaways
```jsx
server.use(http.get('/api', () => HttpResponse.error()));
render(<User />);
expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
```
---

### Q420. What is the difference between fireEvent and userEvent?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
`fireEvent` dispatches a single synthetic event immediately (e.g., `fireEvent.change(input, { target: { value: 'x' } })`). `userEvent` simulates the full, realistic sequence of browser events (pointer down/up, focus, key events, input, change) and is async. Prefer `userEvent` for behavior fidelity; use `fireEvent` when you need a quick, synchronous, single-event dispatch or to avoid async overhead.

#### Code Example / Key Takeaways
```jsx
// fireEvent: fast, single event
fireEvent.change(input, { target: { value: 'a' } });

// userEvent: realistic, async
await user.type(input, 'a');
```

---

### Q421. How do you use waitFor to assert on eventually-updated DOM?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
`waitFor(callback, options)` retries the callback until it stops throwing or times out (default 1000ms). Use it when an assertion depends on async side effects not tied to a single query, such as a value updated after a promise resolves. Prefer `findBy*` when waiting for an element to appear because it's more concise; reach for `waitFor` when the condition is custom (e.g., attribute toggles).

#### Code Example / Key Takeaways
```jsx
await waitFor(() => expect(screen.getByRole('status')).toHaveClass('done'));
```
---

### Q422. How do you query elements by role, label, text, and test id?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
RTL queries in order of preference: `getByRole` (most accessible, matches ARIA role), `getByLabelText` (form inputs), `getByPlaceholderText`, `getByText` (non-interactive text), `getByDisplayValue` (input value), and lastly `getByTestId` (only when no accessible alternative exists). Prioritize role/label queries because they reflect what users and assistive tech actually encounter.

#### Code Example / Key Takeaways
```jsx
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByText('Welcome');
screen.getByTestId('custom-widget');
```
---

### Q423. How do you test conditional rendering with queryBy?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
Use `queryBy*` to assert an element is absent (returns null instead of throwing). A common pattern: render, trigger an action that should remove a node, then `expect(screen.queryByText('Old')).not.toBeInTheDocument()`. Pair with `getBy*` to assert presence before removal. This avoids false positives from `getBy` throwing on the wrong assertion.

#### Code Example / Key Takeaways
```jsx
expect(screen.getByText('Banner')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /dismiss/i }));
expect(screen.queryByText('Banner')).not.toBeInTheDocument();
```
---

### Q424. How do you test a component that uses React Router's Loader/Action?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Use `createMemoryRouter(routes, { initialEntries })` and render with `<RouterProvider router={router} />`. Mock the loader/action dependencies (API module) so they resolve deterministically. Await `findBy*` to assert loaded data or submitted results. Because the data router handles promises, wrap assertions in async and use `findBy`/`waitFor` for the resolved state.

#### Code Example / Key Takeaways
```jsx
const router = createMemoryRouter(routes, { initialEntries: ['/users/1'] });
render(<RouterProvider router={router} />);
expect(await screen.findByText('Ada')).toBeInTheDocument();
```
---

### Q425. How do you set up a test environment for React (jsdom, jest config, setup file)?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Configure Jest with `testEnvironment: 'jsdom'` so DOM APIs exist, add `setupFilesAfterEach` pointing to a setup file that imports `@testing-library/jest-dom` (for matchers like `toBeInTheDocument`) and configures automatic cleanup. Use `ts-jest` or Babel for TS/JSX. MSW and matchMedia/localStorage polyfills are added in the setup as needed.

#### Code Example / Key Takeaways
```js
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['<rootDir>/jest.setup.js'],
};
// jest.setup.js
import '@testing-library/jest-dom';
```
---

### Q426. How do you handle timer-based code (setTimeout) in tests with fake timers?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Use Jest fake timers: `jest.useFakeTimers()` in setup, then `jest.advanceTimersByTime(ms)` or `jest.runOnlyPendingTimers()` inside `act()` to move time forward deterministically. This avoids real waits. Be careful combining fake timers with `userEvent` (use `jest.useFakeTimers({ advanceTimers: true })` and the modern async userEvent with `advanceTimers`).

#### Code Example / Key Takeaways
```jsx
jest.useFakeTimers();
act(() => { render(<Toast />); });
act(() => { jest.advanceTimersByTime(3000); });
expect(screen.queryByText('Saved')).not.toBeInTheDocument();
```
---

### Q427. How do you test form validation error messages?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Submit the form (or blur a field) to trigger validation, then assert the error text appears. Use `findByText` because validation may be async (especially with schema resolvers). Ensure error elements have stable, queryable text and ideally `role='alert'`. For RHF/Formik, the error only shows after submit (or touched) unless you set mode to onChange.

#### Code Example / Key Takeaways
```jsx
await user.click(screen.getByRole('button', { name: /submit/i }));
expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
```
---

### Q428. How do you test that a form submits the correct data?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Pass a `jest.fn()` as the submit handler (or mock the API), fill fields realistically with `userEvent.type`, click submit, and assert the handler received the expected payload via `toHaveBeenCalledWith`. For real network submission, mock the endpoint with MSW and assert the request body or the resulting UI state (success message).

#### Code Example / Key Takeaways
```jsx
const onSubmit = jest.fn();
render(<Form onSubmit={onSubmit} />);
await user.type(screen.getByLabelText(/name/i), 'Ada');
await user.click(screen.getByRole('button', { name: /save/i }));
expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' });
```
---

### Q429. How do you test React Router navigation side effects (redirect after login)?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Render the login flow inside a `MemoryRouter` with route definitions for both `/login` and the post-login destination (e.g., `/dashboard`). After submitting valid credentials (mock the auth API), assert the dashboard content is now rendered, proving navigation occurred. Alternatively, spy on `useNavigate` via a wrapper component to assert it was called with the expected path.

#### Code Example / Key Takeaways
```jsx
render(
  <MemoryRouter initialEntries={['/login']}>
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route path='/dashboard' element={<h1>Dashboard</h1>} />
    </Routes>
  </MemoryRouter>
);
await user.type(screen.getByLabelText(/email/i), 'a@b.com');
await user.click(screen.getByRole('button', { name: /login/i }));
expect(await screen.findByText('Dashboard')).toBeInTheDocument();
```
---

### Q430. How do you mock fetch or axios in a test?
**Difficulty:** `Intermediate`
**Category:** Routing, Forms & Testing

#### Answer
Prefer MSW for intercepting at the network layer so your code uses real fetch/axios unchanged. Alternatively, `jest.mock('axios')` and provide resolved/rejected values per test. For global fetch, you can spy: `jest.spyOn(global, 'fetch').mockResolvedValue({ json: async () => data })`. MSW is more faithful; module mocks are simpler for unit isolation.

#### Code Example / Key Takeaways
```jsx
jest.mock('axios');
import axios from 'axios';
axios.get.mockResolvedValue({ data: { name: 'Ada' } });
```

---

### Q431. What is the purpose of screen and why prefer it over container queries?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
`screen` is an object containing all the queries bound to `document.body`, so you don't need the `container` or `baseElement` returned by `render`. Using `screen.getBy*` keeps queries in the global document, matches how users see the page, and makes refactoring easier (you don't pass containers around). It's the recommended default in modern RTL.

#### Code Example / Key Takeaways
```jsx
const { container } = render(<App />); // older style
// Prefer:
render(<App />);
screen.getByText('Hello');
```
---

### Q432. How do you test input change and prevent default behavior?
**Difficulty:** `Basic`
**Category:** Routing, Forms & Testing

#### Answer
With `userEvent.type` into a labelled input, the component's `onChange`/`register` handles updates and React's synthetic event system calls `preventDefault` internally for controlled flows. In tests you don't call preventDefault manually; you just simulate realistic typing and submission. If testing a raw handler, `fireEvent.submit(form)` triggers the submit and React Router's Form prevents the native reload automatically.

#### Code Example / Key Takeaways
```jsx
await user.type(screen.getByLabelText(/search/i), 'react');
await user.click(screen.getByRole('button', { name: /go/i }));
// assert search results; no manual preventDefault needed
```
---

### Q433. How do you test React Hook Form's useFieldArray (dynamic rows)?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Render the form, query the initial row inputs, type into them, click "Add" to append a row, assert a new row appears (e.g., one more inputs or a count), fill it, submit, and assert the handler receives an array with both rows. Use `findAllByLabelText` to count repeated fields. Because RHF uses uncontrolled inputs, query by name/label, not by controlled value.

#### Code Example / Key Takeaways
```jsx
const rows = await screen.findAllByLabelText(/item name/i);
expect(rows).toHaveLength(1);
await user.click(screen.getByRole('button', { name: /add/i }));
expect(await screen.findAllByLabelText(/item name/i)).toHaveLength(2);
```
---

### Q434. How do you write a test for a protected route redirect?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Render the protected route tree inside a `MemoryRouter` where the auth context reports an unauthenticated user. Include both the protected page route and the `/login` route. After render (and any effect), assert the login page content is shown rather than the protected content, proving the `<RequireAuth>` redirect fired. Spy on `useNavigate` if you want to assert the call instead.

#### Code Example / Key Takeaways
```jsx
render(
  <AuthContext.Provider value={{ user: null }}>
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path='/profile' element={<Profile />} />
        </Route>
        <Route path='/login' element={<h1>Login</h1>} />
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>
);
expect(screen.getByText('Login')).toBeInTheDocument();
expect(screen.queryByText('Profile')).not.toBeInTheDocument();
```
---

### Q435. What are best practices for organizing and writing maintainable tests?
**Difficulty:** `Advanced`
**Category:** Routing, Forms & Testing

#### Answer
Follow the "Arrange, Act, Assert" structure per test. Query by accessibility (role/label) over test ids. Test behavior, not implementation. Keep tests isolated with cleanup and per-test mocks (reset handlers). Co-locate tests with components. Use shared custom render wrappers (with providers/router) to reduce boilerplate. Mock at the boundary (network, modules), not internal logic. Aim for fast, deterministic, readable tests over 100% coverage of trivial code.

#### Code Example / Key Takeaways
```jsx
// custom render with providers reused across tests
const customRender = (ui, { route = '/' } = {}) =>
  render(<Providers><MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter></Providers>);
export * from '@testing-library/react';
export { customRender as render };
```
---

## Summary
This section covered **65 interview questions (Q371–Q435)** across three pillars of production React:

- **Routing (Q371–Q387, Q413–Q414, Q424, Q429, Q434):** React Router v6+ fundamentals (`BrowserRouter`, `Routes`/`Route`, `Link`/`NavLink`/`useNavigate`), dynamic params (`useParams`), query strings (`useSearchParams`), nested routes with `Outlet`, protected routes, data routers with loaders/actions, `errorElement`, and `useNavigation`.
- **Forms (Q388–Q412 region, Q401–Q410, Q427–Q428, Q433):** Controlled vs uncontrolled components, React Hook Form (`useForm`, `register`, `handleSubmit`, `formState`, resolvers, `useFieldArray`), Formik with Yup/Zod validation, accessibility, dynamic fields, and file uploads.
- **Testing (Q405–Q420, Q421–Q432, Q435):** Jest + React Testing Library, `render`/`screen`, `getBy`/`queryBy`/`findBy`, `userEvent` vs `fireEvent`, MSW for API mocking, custom hook testing, timers, error boundaries, and maintainable test organization.
