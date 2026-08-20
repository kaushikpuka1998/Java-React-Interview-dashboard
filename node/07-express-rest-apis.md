# Express & REST APIs Interview Questions (Q1 – Q70)

---

### Q1. What is Express.js?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
Express is a minimal, unopinionated web framework for Node that provides routing, middleware, and helpers over the raw `http` module, simplifying building APIs and web apps.

#### Code Example
```js
const app = require('express')()
app.get('/', (req, res) => res.send('Hello'))
app.listen(3000)
```
---

### Q2. What is middleware in Express?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
Middleware are functions `(req, res, next)` that run in order on the request pipeline. They can modify req/res, end the response, or call `next()` to pass control. Used for logging, auth, parsing, etc.

#### Code Example
```js
app.use((req, res, next) => { req.time = Date.now(); next() })
```
---

### Q3. What is the role of `next()`?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
`next()` passes control to the next middleware/route handler. `next(err)` skips to error-handling middleware. Forgetting to call `next()` or send a response leaves the request hanging.

#### Code Example
```js
app.use((req, res, next) => auth(req) ? next() : res.status(401).end())
```
---

### Q4. What are the types of middleware?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
Application-level (`app.use`), router-level (`router.use`), built-in (`express.json`, `express.static`), third-party (`cors`, `helmet`), and error-handling (four-arg `(err, req, res, next)`).

#### Code Example
```js
app.use(express.json())            // built-in
app.use('/api', apiRouter)         // router-level
```
---

### Q5. How does Express match routes?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
Express matches by HTTP method and path pattern in the order routes/middleware are registered. The first matching handler that responds (without `next`) wins. Order matters.

#### Code Example
```js
app.get('/users/:id', handler) // matches GET /users/42
```
---

### Q6. What are route parameters?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
Route params are named URL segments (`:id`) captured into `req.params`. They identify resources in RESTful paths.

#### Code Example
```js
app.get('/users/:id', (req, res) => res.send(req.params.id))
```
---

### Q7. What is the difference between `req.params`, `req.query`, and `req.body`?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
`req.params` holds URL path params (`/users/:id`), `req.query` holds the query string (`?page=2`), and `req.body` holds the parsed request body (needs a body-parsing middleware).

#### Code Example
```js
// GET /users/5?full=true  body {name}
req.params.id // '5'
req.query.full // 'true'
```
---

### Q8. How do you parse JSON request bodies?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
Add `express.json()` middleware, which reads and parses `application/json` bodies into `req.body`. Set a `limit` to bound size.

#### Code Example
```js
app.use(express.json({ limit: '1mb' }))
```
---

### Q9. What is a Router in Express?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
`express.Router()` is a mini-app for grouping related routes and middleware into a modular, mountable unit, keeping large apps organized.

#### Code Example
```js
const r = express.Router()
r.get('/', list); app.use('/products', r)
```
---

### Q10. How do you handle errors in Express?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
Define error-handling middleware with four arguments `(err, req, res, next)` after all routes. Pass errors via `next(err)`; Express routes them to this handler.

#### Code Example
```js
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }))
```
---

### Q11. How do you handle errors in async route handlers?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
In Express 4, thrown errors in async handlers aren't caught automatically — wrap handlers to forward rejections to `next`, or use a wrapper/`express-async-errors`. Express 5 handles rejected promises natively.

#### Code Example
```js
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
app.get('/x', wrap(async (req, res) => { await work(); res.end() }))
```
---

### Q12. What are the principles of REST?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
REST is stateless, resource-oriented (nouns as URIs), uses standard HTTP methods/status codes, supports a uniform interface, and is cacheable. Each request carries all needed context; the server holds no client session state.

#### Code Example
```js
// GET /orders/1  (resource), not GET /getOrder?id=1 (RPC)
```
---

### Q13. How do HTTP methods map to CRUD?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
GET=read, POST=create, PUT=replace/update, PATCH=partial update, DELETE=remove. Using them semantically enables caching, idempotency, and predictable APIs.

#### Code Example
```js
app.post('/users', create)
app.patch('/users/:id', update)
```
---

### Q14. What is idempotency and which methods are idempotent?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
An idempotent method produces the same result whether called once or many times. GET, PUT, DELETE, HEAD are idempotent; POST is not (each call creates a new resource). This matters for safe retries.

#### Code Example
```js
// PUT /users/5 with same body -> same final state every time
```
---

### Q15. What is the difference between PUT and PATCH?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
PUT replaces the entire resource (idempotent full update); PATCH applies a partial modification. Sending only changed fields to PUT can wipe omitted fields.

#### Code Example
```js
app.put('/users/:id', replaceUser)   // full
app.patch('/users/:id', patchUser)    // partial
```
---

### Q16. How do you version a REST API?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Common approaches: URL prefix (`/v1/...`), a custom header, or media-type versioning (`Accept: application/vnd.api.v2+json`). Versioning lets you evolve without breaking existing clients.

#### Code Example
```js
app.use('/v1', v1Router); app.use('/v2', v2Router)
```
---

### Q17. What status code should a successful POST return?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
201 Created with a `Location` header pointing to the new resource (and often the created body). 200 is acceptable if no resource is created; 204 for success with no content.

#### Code Example
```js
res.status(201).location(`/users/${id}`).json(user)
```
---

### Q18. How do you implement pagination?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Offset-based (`?page&limit`) is simple but slow/inconsistent on large/changing data. Cursor-based (`?after=<id>`) is stable and efficient for large sets. Return metadata (next cursor/total).

#### Code Example
```js
const rows = await db.find({ _id: { $gt: cursor } }).limit(limit)
```
---

### Q19. Why is cursor pagination better than offset for large datasets?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Offset requires the DB to scan and skip N rows (slow as N grows) and can skip/duplicate items when data changes between pages. Cursors seek directly via an indexed key, giving stable, O(log n) navigation.

#### Code Example
```js
// WHERE id > :cursor ORDER BY id LIMIT :n  (uses index, no skip)
```
---

### Q20. How do you validate request input in Express?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Validate against a schema (zod/Joi/express-validator) in middleware, rejecting invalid requests with 400 and clear error details before they reach business logic.

#### Code Example
```js
app.post('/u', (req, res, next) => { req.body = schema.parse(req.body); next() })
```
---

### Q21. How do you structure a scalable Express app?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Layer by responsibility: routes/controllers (HTTP), services (business logic), repositories (data access), and organize by feature. Keep handlers thin, put logic in services, and centralize error/validation handling.

#### Code Example
```js
// routes -> controller -> service -> repository -> db
```
---

### Q22. What is the difference between `app.use` and `app.get`?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
`app.use` mounts middleware for all methods (and matches path prefixes). `app.get` (and other verbs) registers a handler for a specific method and exact-ish path.

#### Code Example
```js
app.use('/api', logger)     // all methods under /api
app.get('/api/users', list) // only GET
```
---

### Q23. How do you serve a REST API and a SPA together?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Mount API routes first, serve static assets, then add a catch-all that returns `index.html` for client-side routing (excluding API paths).

#### Code Example
```js
app.use('/api', api)
app.use(express.static('dist'))
app.get('*', (req, res) => res.sendFile('index.html'))
```
---

### Q24. What is HATEOAS?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Hypermedia As The Engine Of Application State: responses include links to related actions/resources, so clients navigate the API dynamically rather than hardcoding URLs. It is the highest REST maturity level, rarely fully adopted.

#### Code Example
```js
res.json({ id, _links: { self: `/orders/${id}`, cancel: `/orders/${id}/cancel` } })
```
---

### Q25. How do you handle 404 for unknown routes?
**Difficulty:** `Basic`
**Category:** Express & REST APIs

#### Answer
Add a final catch-all middleware after all routes that responds with 404, since a request reaching it matched nothing earlier.

#### Code Example
```js
app.use((req, res) => res.status(404).json({ error: 'Not found' }))
```
---

### Q26. What is CORS middleware and how do you configure it?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
The `cors` middleware sets `Access-Control-*` headers and handles preflight. Configure allowed origins, methods, and credentials explicitly rather than using a wildcard with credentials.

#### Code Example
```js
app.use(cors({ origin: 'https://app.com', credentials: true }))
```
---

### Q27. How do you implement authentication middleware?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Write middleware that reads a token/cookie, verifies it, attaches the user to `req`, and calls `next()` or returns 401. Apply it to protected routers.

#### Code Example
```js
function auth(req, res, next) {
  try { req.user = verify(req.headers.authorization); next() }
  catch { res.status(401).end() }
}
```
---

### Q28. How do you implement role-based authorization?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
After authentication, add middleware that checks the user's role/permissions against the route's requirement, returning 403 if insufficient.

#### Code Example
```js
const requireRole = role => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).end()
app.delete('/users/:id', auth, requireRole('admin'), remove)
```
---

### Q29. What is the difference between authentication and authorization?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
Authentication verifies identity (who you are); authorization determines access (what you may do). You authenticate first, then authorize per resource/action.

#### Code Example
```js
app.use(authenticate) // who
app.use('/admin', authorizeAdmin) // what
```
---

### Q30. How do you handle request logging?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
Use `morgan` for HTTP access logs or a structured logger (`pino`) in middleware capturing method, path, status, and latency. Add a correlation ID for tracing.

#### Code Example
```js
app.use(require('morgan')('combined'))
```
---

### Q31. How do you set response compression?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
Add the `compression` middleware to gzip/deflate responses based on `Accept-Encoding`. Often skipped in favor of proxy-level compression.

#### Code Example
```js
app.use(require('compression')())
```
---

### Q32. What is the order of middleware execution and why does it matter?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Middleware runs top-to-bottom as registered. Placement matters: body parsers before handlers that need `req.body`, auth before protected routes, error handler last. Wrong order causes bugs (e.g. missing body).

#### Code Example
```js
app.use(express.json()) // must come before routes using req.body
```
---

### Q33. How do you mount sub-applications?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
An Express app or Router can be mounted at a path with `app.use('/path', subApp)`, giving modular composition and independent middleware per mount.

#### Code Example
```js
app.use('/admin', adminApp)
```
---

### Q34. How do you implement API rate limiting in Express?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Use `express-rate-limit` with a shared store (Redis) for multi-instance correctness, returning 429 with `Retry-After` when limits are hit.

#### Code Example
```js
app.use(rateLimit({ windowMs: 60000, max: 100, store: redisStore }))
```
---

### Q35. What is the `trust proxy` setting?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
`app.set('trust proxy', ...)` tells Express to trust `X-Forwarded-*` headers from your proxy so `req.ip`, protocol, and secure-cookie logic reflect the real client. Misconfiguring it lets clients spoof their IP.

#### Code Example
```js
app.set('trust proxy', 1) // trust first proxy hop
```
---

### Q36. How do you handle file uploads in Express?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Use `multer` (multipart parser) to stream files to disk/memory/cloud with size and type limits, exposing files on `req.file`/`req.files`.

#### Code Example
```js
app.post('/avatar', multer({ limits: { fileSize: 2e6 } }).single('img'), save)
```
---

### Q37. How do you send different content types?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
`res.json()` sends JSON, `res.send()` infers type, `res.sendFile()` streams files, `res.render()` renders templates, and `res.type()` sets the `Content-Type` explicitly.

#### Code Example
```js
res.type('text/csv').send(csvString)
```
---

### Q38. What is content negotiation in Express?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
`res.format()` picks a handler based on the client's `Accept` header, serving JSON, HTML, or other representations of the same resource.

#### Code Example
```js
res.format({ 'application/json': () => res.json(x), 'text/html': () => res.render('x', x) })
```
---

### Q39. How do you implement idempotency keys for POST requests?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Store the result keyed by a client-supplied `Idempotency-Key`; on repeat, return the cached response instead of reprocessing. Prevents duplicate charges/orders on retries.

#### Code Example
```js
const cached = await store.get(req.headers['idempotency-key'])
if (cached) return res.json(cached)
```
---

### Q40. How do you structure error responses consistently?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Use a standard error shape (code, message, details) and centralize it in error middleware. Consider RFC 7807 "problem+json". Avoid leaking stack traces in production.

#### Code Example
```js
res.status(422).json({ type: 'validation', errors: [{ field: 'email', msg: 'invalid' }] })
```
---

### Q41. What is the difference between operational and programmer errors?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Operational errors are expected runtime conditions (invalid input, 404, timeouts) you handle and recover from. Programmer errors are bugs (undefined access) that should crash and be fixed, not caught-and-ignored.

#### Code Example
```js
if (!user) throw new NotFoundError() // operational -> 404
```
---

### Q42. How do you handle graceful shutdown in Express?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Capture the `http.Server` from `app.listen`, and on SIGTERM call `server.close()` to drain connections, close DB pools, then exit. Use a timeout to force-close if needed.

#### Code Example
```js
const server = app.listen(3000)
process.on('SIGTERM', () => server.close(() => process.exit(0)))
```
---

### Q43. What is `express.static` and how do you cache it?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
`express.static` serves files from a directory with proper `Content-Type` and caching. Set `maxAge`/`immutable` for hashed assets, and `etag` for revalidation.

#### Code Example
```js
app.use(express.static('public', { maxAge: '1y', immutable: true }))
```
---

### Q44. How do you protect against common web vulnerabilities in Express?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Use `helmet` for secure headers, validate/sanitize input, parameterized DB queries, `cors` with a strict origin list, rate limiting, CSRF protection for cookie auth, and never trust client data.

#### Code Example
```js
app.use(helmet()); app.use(express.json({ limit: '100kb' }))
```
---

### Q45. What is CSRF and how do you prevent it?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
CSRF tricks an authenticated browser into making unwanted requests using its cookies. Prevent with `SameSite` cookies, anti-CSRF tokens (double-submit/synchronizer), and requiring a custom header for state-changing requests. Token/header auth (not cookies) is inherently less exposed.

#### Code Example
```js
app.use(csrf()); // and send token to client for form submissions
```
---

### Q46. How do you handle long-running requests without blocking?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Return 202 Accepted immediately, enqueue the job to a background worker/queue, and let clients poll a status endpoint or receive a webhook. Don't hold the HTTP connection for minutes.

#### Code Example
```js
app.post('/reports', (req, res) => { queue.add(req.body); res.status(202).json({ jobId }) })
```
---

### Q47. What is the difference between `res.send`, `res.json`, and `res.end`?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
`res.json` serializes to JSON and sets the header. `res.send` handles strings/buffers/objects, inferring type. `res.end` (from core) sends raw data without Express conveniences. Prefer `json` for APIs.

#### Code Example
```js
res.json({ ok: true }) // sets application/json + stringifies
```
---

### Q48. How do you implement API documentation?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Describe endpoints with an OpenAPI/Swagger spec and serve interactive docs (`swagger-ui-express`). Generating the spec from code/annotations keeps docs in sync.

#### Code Example
```js
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))
```
---

### Q49. What is the difference between REST and GraphQL?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
REST exposes fixed resource endpoints; clients may over/under-fetch. GraphQL exposes one endpoint where clients request exactly the fields they need, avoiding round-trips but adding query-complexity and caching challenges.

#### Code Example
```js
// GraphQL: query { user(id:1){ name orders{ total } } }
```
---

### Q50. How do you handle nested/related resources in REST?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Model relationships in the URL hierarchy (`/users/:id/orders`), keep nesting shallow (usually one level), and offer filtering/embedding via query params to avoid many round-trips.

#### Code Example
```js
app.get('/users/:id/orders', listUserOrders)
```
---

### Q51. What is the N+1 problem in APIs and how do you fix it?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Fetching a list then querying related data per item causes N+1 queries. Fix by batching (one `IN` query), joins, or a DataLoader that coalesces per-request lookups.

#### Code Example
```js
const orders = await db.orders.find({ userId: { $in: ids } }) // one query
```
---

### Q52. How do you implement filtering, sorting, and field selection?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Parse query params (`?status=open&sort=-createdAt&fields=id,name`), whitelist allowed fields to prevent injection, and translate them to safe DB queries.

#### Code Example
```js
const sort = allowedSort[req.query.sort] ?? { createdAt: -1 }
```
---

### Q53. What are webhooks and how do you handle them securely?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Webhooks are server-to-server HTTP callbacks on events. Secure them by verifying a signature (HMAC of the raw body with a shared secret), checking timestamps to prevent replay, and responding fast (queue processing).

#### Code Example
```js
const sig = hmac(secret, req.rawBody)
if (sig !== req.headers['x-signature']) return res.status(400).end()
```
---

### Q54. Why do you need the raw body for webhook signature verification?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Signatures are computed over exact raw bytes; JSON parsing/reserialization changes whitespace/key order and breaks verification. Capture `req.rawBody` (via a `verify` callback) before parsing.

#### Code Example
```js
express.json({ verify: (req, res, buf) => { req.rawBody = buf } })
```
---

### Q55. How do you handle concurrent updates (optimistic locking)?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Include a version/`ETag`; on update, require it via `If-Match` and reject with 409/412 if it no longer matches, preventing lost updates from concurrent writers.

#### Code Example
```js
const r = await db.update({ id, version }, { $set: data, $inc: { version: 1 } })
if (!r.matchedCount) return res.status(409).end()
```
---

### Q56. What is the difference between synchronous and event-driven API design?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Synchronous request/response returns results immediately, coupling caller and service. Event-driven (queues/pub-sub) decouples them: producers emit events, consumers process asynchronously, improving resilience and scalability at the cost of eventual consistency.

#### Code Example
```js
await queue.publish('order.created', order) // async, decoupled
```
---

### Q57. How do you implement health check endpoints?
**Difficulty:** `Intermediate`
**Category:** Express & REST APIs

#### Answer
Expose `/health` (liveness: process up) and `/ready` (readiness: dependencies like DB reachable). Orchestrators use these to route traffic and restart unhealthy instances.

#### Code Example
```js
app.get('/health', (req, res) => res.json({ status: 'ok' }))
```
---

### Q58. What is the difference between liveness and readiness probes?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Liveness checks if the process is alive (restart if not). Readiness checks if it can serve traffic now (e.g. DB connected, warmed up). Failing readiness removes the pod from load balancing without restarting it.

#### Code Example
```js
app.get('/ready', async (req, res) => (await db.ping()) ? res.end() : res.status(503).end())
```
---

### Q59. How do you handle timeouts on Express routes?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Set server-level timeouts and per-request guards (e.g. `connect-timeout` or an AbortSignal), responding 503/504 and aborting downstream work when exceeded so slow handlers don't pile up.

#### Code Example
```js
req.setTimeout(10000, () => res.status(503).end())
```
---

### Q60. How do you test Express routes?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Export the `app` (without calling `listen`) and drive it with `supertest`, asserting status/body. Mock external services and use a test database.

#### Code Example
```js
await request(app).post('/users').send({ name: 'A' }).expect(201)
```
---

### Q61. What is dependency injection in Express services?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Pass dependencies (DB, config, clients) into services/route factories instead of importing them internally. This decouples layers, eases testing with mocks, and avoids hidden global state.

#### Code Example
```js
const makeUserRoutes = ({ db }) => { const r = Router(); r.get('/', () => db.users()); return r }
```
---

### Q62. How do you handle multi-tenancy in an API?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Identify the tenant (subdomain/header/token claim) in middleware, then scope every query/resource to that tenant. Enforce isolation at the data layer so tenants can never read each other's data.

#### Code Example
```js
app.use((req, res, next) => { req.tenantId = req.user.tenantId; next() })
```
---

### Q63. What is API gateway pattern?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
An API gateway is a single entry point that routes to backend services and handles cross-cutting concerns (auth, rate limiting, aggregation, TLS). It simplifies clients and centralizes policy in a microservices system.

#### Code Example
```js
// gateway -> /users -> user-service, /orders -> order-service
```
---

### Q64. How do you implement request validation errors with clear messages?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
Validate with a schema, catch validation errors in middleware, and map them to a 400/422 response listing each failing field and reason, aiding client debugging.

#### Code Example
```js
catch (e) { if (e instanceof ZodError) res.status(422).json({ errors: e.issues }) }
```
---

### Q65. What is the difference between `app.listen` and using an http server directly?
**Difficulty:** `Advanced`
**Category:** Express & REST APIs

#### Answer
`app.listen` is a shortcut that creates an `http.Server` internally. Creating the server yourself (`http.createServer(app)`) is needed when you also attach WebSockets or HTTP/2, or want the server reference for graceful shutdown.

#### Code Example
```js
const server = http.createServer(app); wss.attach(server); server.listen(3000)
```
---

### Q66. How do you handle streaming responses in Express?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Pipe a readable stream to `res` (which is writable), setting appropriate headers. Use `pipeline` for error handling so failures clean up and reach the error handler.

#### Code Example
```js
pipeline(fs.createReadStream('big.csv'), res, err => err && next(err))
```
---

### Q67. What are the security implications of `express.json()` limits?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Without a `limit`, a huge JSON body can exhaust memory (DoS). Setting a conservative `limit` rejects oversized payloads early with 413. Also beware deeply nested JSON causing CPU spikes on parse.

#### Code Example
```js
app.use(express.json({ limit: '100kb' }))
```
---

### Q68. How do you migrate from Express 4 to 5?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Express 5 auto-handles rejected promises in handlers, changes some path-matching (`*` syntax), and removes deprecated APIs. Review async error handling, update wildcard routes, and test middleware order.

#### Code Example
```js
// Express 5: async errors propagate to error middleware automatically
app.get('/x', async (req, res) => { await work(); res.end() })
```
---

### Q69. What are alternatives to Express and why choose them?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Fastify (faster, schema-based validation/serialization), Koa (async middleware, minimal), NestJS (opinionated, DI, TypeScript), Hapi (config-centric). Choose based on performance, structure, and TypeScript needs.

#### Code Example
```js
// Fastify: built-in JSON schema validation & fast serialization
fastify.post('/u', { schema }, handler)
```
---

### Q70. How do you achieve zero-downtime deploys for an Express API?
**Difficulty:** `Experienced`
**Category:** Express & REST APIs

#### Answer
Run multiple instances behind a load balancer, roll out new instances while draining old ones (readiness probes + graceful shutdown), and keep DB migrations backward-compatible so old and new code coexist during rollout.

#### Code Example
```js
// LB removes instance on /ready 503, then SIGTERM -> server.close() drains
```
---
