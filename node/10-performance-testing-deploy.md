# Performance, Testing & Deployment Interview Questions (Q1 – Q70)

---

### Q1. How do you profile a Node application?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Use `node --prof` + `--prof-process`, the `--inspect` DevTools CPU profiler, or flame-graph tools (`clinic flame`, `0x`) to find hot functions and blocking code.

#### Code Example
```js
$ node --prof app.js && node --prof-process isolate-*.log
```
---

### Q2. What is a flame graph?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
A flame graph visualizes stack samples: width shows time spent, stacking shows call hierarchy. Wide bars at the top are hotspots to optimize.

#### Code Example
```js
$ npx 0x app.js
```
---

### Q3. How do you detect event loop blocking?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Measure event loop delay with `perf_hooks.monitorEventLoopDelay` or a drift timer. High delay means synchronous CPU work is blocking; offload it to worker threads or chunk it.

#### Code Example
```js
const h = require('perf_hooks').monitorEventLoopDelay(); h.enable()
```
---

### Q4. What are common causes of high memory usage?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Unbounded caches, buffering large payloads instead of streaming, retained closures/listeners, global accumulation, and large in-memory data structures. Profile heap snapshots to locate retainers.

#### Code Example
```js
console.log(process.memoryUsage().heapUsed)
```
---

### Q5. How do you take and analyze a heap snapshot?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Start with `--inspect`, capture a heap snapshot in Chrome DevTools (or `v8.writeHeapSnapshot()`), and compare snapshots over time to find objects that grow — the leak's retainers.

#### Code Example
```js
require('v8').writeHeapSnapshot('./heap.heapsnapshot')
```
---

### Q6. How do you scale a Node app across CPU cores?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Run one process per core with the `cluster` module or a process manager (pm2), or run multiple container replicas behind a load balancer. Node's single thread can't use multiple cores alone.

#### Code Example
```js
pm2 start app.js -i max # one instance per core
```
---

### Q7. What is horizontal vs vertical scaling?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Vertical scaling adds resources (CPU/RAM) to one machine (simple but capped). Horizontal scaling adds more machines/instances behind a balancer (elastic, requires statelessness). Node apps typically scale horizontally.

#### Code Example
```js
// stateless app + LB + N replicas -> horizontal scale
```
---

### Q8. How do you offload CPU-bound work?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Move heavy computation to worker threads, a separate service, or a job queue, keeping the main event loop responsive. Never run long synchronous loops in request handlers.

#### Code Example
```js
new Worker('./cpu-task.js', { workerData }).on('message', done)
```
---

### Q9. What is a job queue and when do you use one?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
A job queue (BullMQ/Redis, SQS) defers work to background workers, decoupling request handling from slow tasks (emails, image processing, reports) and enabling retries, rate control, and scaling workers independently.

#### Code Example
```js
await queue.add('email', { to, body })
```
---

### Q10. How do you implement caching to improve performance?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Cache expensive results in memory (`lru-cache`) or Redis with TTLs, use HTTP caching headers/CDN for responses, and memoize pure computations. The hard part is invalidation on data change.

#### Code Example
```js
const cache = new LRUCache({ max: 1000, ttl: 60000 })
```
---

### Q11. What is the difference between in-memory and distributed cache?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
In-memory cache is per-process (fast, but not shared and lost on restart). Distributed cache (Redis) is shared across instances (consistent, survives restarts) at network-call cost. Use in-memory for hot local data, Redis for shared state.

#### Code Example
```js
// L1: process LRU (fast) -> L2: Redis (shared)
```
---

### Q12. How do you reduce startup time / cold starts?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Lazy-load heavy modules, minimize top-level work, reduce dependencies, use snapshots/bundling, and keep instances warm (provisioned concurrency in serverless). Defer non-critical initialization.

#### Code Example
```js
let pdf; function makePdf() { pdf ??= require('pdfkit') } // lazy
```
---

### Q13. What is `--max-old-space-size`?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
It sets V8's old-generation heap limit in MB. Raise it for memory-heavy apps, but prefer streaming/pagination over just enlarging the heap, and match container memory limits.

#### Code Example
```js
node --max-old-space-size=2048 app.js
```
---

### Q14. How do you benchmark code performance?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Use high-resolution timers (`perf_hooks.performance.now()`), run many iterations, warm up the JIT, and use tools like `benchmark.js` or `autocannon` for HTTP load. Beware micro-benchmark pitfalls.

#### Code Example
```js
$ npx autocannon -c 100 -d 10 http://localhost:3000
```
---

### Q15. What is `autocannon` / load testing?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Load testing sends concurrent traffic to measure throughput, latency percentiles, and error rates under stress. It reveals bottlenecks and capacity limits before production traffic does.

#### Code Example
```js
autocannon -c 200 -d 30 http://localhost:3000/api
```
---

### Q16. Why look at latency percentiles (p95/p99) not averages?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Averages hide tail latency; a few slow requests hurt user experience and cascade. p95/p99 show what the worst-served users experience, guiding SLOs and revealing GC pauses or contention.

#### Code Example
```js
// optimize the p99, not just the mean
```
---

### Q17. What is the difference between throughput and latency?
**Difficulty:** `Intermediate`
**Category:** Performance, Testing & Deployment

#### Answer
Latency is the time for one request; throughput is requests handled per unit time. They interact — high concurrency can raise throughput while worsening tail latency. Optimize the one your SLO targets.

#### Code Example
```js
// 1000 req/s throughput, p99 latency 200ms
```
---

### Q18. How do you reduce JSON serialization overhead?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Serialize only needed fields, use schema-based fast serializers (`fast-json-stringify`), stream large responses, and avoid re-stringifying. `JSON.stringify` on huge objects blocks the loop.

#### Code Example
```js
const stringify = fastJson(schema) // precompiled, ~2x faster
```
---

### Q19. What is the unit testing pyramid?
**Difficulty:** `Intermediate`
**Category:** Performance, Testing & Deployment

#### Answer
Many fast unit tests at the base, fewer integration tests in the middle, and few slow end-to-end tests at the top. It balances coverage, speed, and confidence.

#### Code Example
```js
// lots of unit, some integration, few e2e
```
---

### Q20. What testing frameworks are used in Node?
**Difficulty:** `Basic`
**Category:** Performance, Testing & Deployment

#### Answer
Jest (all-in-one), Vitest (fast, ESM/TS), Mocha+Chai, and the built-in `node:test` runner. They provide assertions, mocking, and coverage.

#### Code Example
```js
import { test } from 'node:test'
import assert from 'node:assert'
test('adds', () => assert.equal(1 + 1, 2))
```
---

### Q21. What is the difference between unit, integration, and e2e tests?
**Difficulty:** `Intermediate`
**Category:** Performance, Testing & Deployment

#### Answer
Unit tests isolate one function (mock deps). Integration tests verify components together (e.g. route + DB). E2E tests exercise the whole system as a user would. Each catches different bug classes.

#### Code Example
```js
// unit: service.calc(); integration: POST /orders + db; e2e: browser flow
```
---

### Q22. What is mocking and when do you use it?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Mocking replaces real dependencies (DB, HTTP, time) with controllable fakes to isolate the unit, make tests deterministic/fast, and simulate errors. Over-mocking, however, can make tests brittle and unrealistic.

#### Code Example
```js
jest.spyOn(mailer, 'send').mockResolvedValue(true)
```
---

### Q23. What is the difference between a mock, stub, and spy?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
A stub returns canned values; a spy records how a real/replaced function was called; a mock is a preprogrammed fake with expectations you assert against. Terms overlap across libraries.

#### Code Example
```js
const spy = jest.fn(); handler(spy); expect(spy).toHaveBeenCalledWith(1)
```
---

### Q24. How do you test async code?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Return/await the promise so the runner waits, assert on resolved values or rejections, and use fake timers to control delays without real waiting.

#### Code Example
```js
await expect(fetchUser(1)).resolves.toMatchObject({ id: 1 })
```
---

### Q25. What are fake timers?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Fake timers replace `setTimeout`/`Date` so tests can advance time instantly, testing debounce/retry/scheduling logic without real delays.

#### Code Example
```js
jest.useFakeTimers(); run(); jest.advanceTimersByTime(1000)
```
---

### Q26. What is code coverage and its limits?
**Difficulty:** `Intermediate`
**Category:** Performance, Testing & Deployment

#### Answer
Coverage measures which lines/branches tests execute. High coverage doesn't guarantee correctness (you can execute code without asserting behavior). Use it to find untested areas, not as the sole quality metric.

#### Code Example
```js
$ node --test --experimental-test-coverage
```
---

### Q27. How do you test HTTP endpoints without a real server port?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Export the app and use `supertest`, which spins up the server on an ephemeral port per test, sends requests, and asserts responses — isolated and parallel-safe.

#### Code Example
```js
await request(app).get('/health').expect(200)
```
---

### Q28. How do you isolate database tests?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Use a dedicated test DB (containerized), wrap each test in a transaction that rolls back, or truncate between tests. Avoid shared state so tests are deterministic and parallelizable.

#### Code Example
```js
afterEach(() => db.query('ROLLBACK'))
```
---

### Q29. What is test-driven development (TDD)?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
TDD writes a failing test first, then minimal code to pass, then refactors (red-green-refactor). It drives design, ensures coverage, and provides a safety net for change.

#### Code Example
```js
// 1. write failing test 2. make it pass 3. refactor
```
---

### Q30. What is a flaky test and how do you fix it?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
A flaky test passes/fails nondeterministically, usually from timing, shared state, ordering, or real network. Fix by removing nondeterminism: fake timers, isolate state, mock external calls, and await properly.

#### Code Example
```js
// replace sleep-based waits with deterministic awaits/fake timers
```
---

### Q31. How do you structure a CI pipeline for Node?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
On each push: install with `npm ci`, lint, run tests with coverage, build, and (on main) deploy. Cache dependencies, run stages in parallel, and fail fast on errors.

#### Code Example
```yaml
- run: npm ci
- run: npm test
- run: npm run build
```
---

### Q32. Why use `npm ci` in CI instead of `npm install`?
**Difficulty:** `Intermediate`
**Category:** Performance, Testing & Deployment

#### Answer
`npm ci` installs exactly from the lockfile (deleting `node_modules` first), giving reproducible, faster installs and failing if `package.json` and the lockfile disagree.

#### Code Example
```js
npm ci --omit=dev
```
---

### Q33. How do you containerize a Node app with Docker?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Use an official Node base image, copy `package*.json` and install first (layer caching), copy source, set `NODE_ENV=production`, run as a non-root user, and use a multi-stage build to shrink the image.

#### Code Example
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./ 
RUN npm ci --omit=dev
COPY . .
USER node
CMD ["node", "index.js"]
```
---

### Q34. What is a multi-stage Docker build?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
It uses one stage to build/compile (with dev deps and toolchains) and a slim final stage that copies only the artifacts, producing a smaller, more secure runtime image.

#### Code Example
```dockerfile
FROM node:20 AS build
RUN npm ci && npm run build
FROM node:20-alpine
COPY --from=build /app/dist ./dist
```
---

### Q35. Why run the container as a non-root user?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Running as root increases blast radius if the app is compromised (container escape, file tampering). Use the built-in `node` user or create one, following least privilege.

#### Code Example
```dockerfile
USER node
```
---

### Q36. How do you handle graceful shutdown in Kubernetes?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
K8s sends SIGTERM before killing a pod; handle it to stop accepting traffic (fail readiness), drain in-flight requests, close connections, and exit within `terminationGracePeriodSeconds`.

#### Code Example
```js
process.on('SIGTERM', () => server.close(() => process.exit(0)))
```
---

### Q37. What are liveness and readiness probes?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Liveness checks the process is healthy (restart if not); readiness checks it can serve traffic now (remove from load balancing if not, without restarting). Implement lightweight HTTP endpoints for each.

#### Code Example
```js
app.get('/live', (_, res) => res.end())
app.get('/ready', async (_, res) => (await db.ping()) ? res.end() : res.status(503).end())
```
---

### Q38. How do you achieve zero-downtime deployment?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Use rolling/blue-green/canary deploys behind a load balancer with readiness gating and graceful shutdown, plus backward-compatible DB migrations so old and new versions coexist during rollout.

#### Code Example
```js
// rolling update: new pods pass readiness before old pods drain
```
---

### Q39. What is blue-green deployment?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Two identical environments (blue live, green idle). Deploy to green, test it, then switch traffic instantly. Rollback is switching back. It reduces risk but doubles infrastructure briefly.

#### Code Example
```js
// switch LB target from blue -> green after health checks
```
---

### Q40. What is canary deployment?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Route a small percentage of traffic to the new version, monitor errors/latency, then gradually increase if healthy or roll back if not. It limits the blast radius of bad releases.

#### Code Example
```js
// 5% traffic -> new version, watch metrics, then ramp to 100%
```
---

### Q41. How do you manage configuration across environments?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Follow 12-factor: read all config from environment variables, validate at startup, keep secrets in a secret manager, and never bake env-specific values into images.

#### Code Example
```js
const cfg = envSchema.parse(process.env) // validated config
```
---

### Q42. What is a process manager like pm2?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
pm2 keeps Node processes alive (auto-restart on crash), clusters across cores, does zero-downtime reloads, and centralizes logs/metrics — useful on VMs (containers often use the orchestrator instead).

#### Code Example
```js
pm2 start app.js -i max && pm2 save
```
---

### Q43. How do you handle logging in production?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Use a structured JSON logger (`pino`) writing to stdout, include correlation IDs and levels, avoid logging secrets, and ship logs to a centralized system (ELK/Loki/Datadog) for search and alerting.

#### Code Example
```js
logger.info({ reqId, userId, ms }, 'request completed')
```
---

### Q44. Why log to stdout instead of files in containers?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Containers are ephemeral; files vanish on restart. Writing structured logs to stdout lets the platform collect, aggregate, and route them (12-factor), decoupling apps from log storage.

#### Code Example
```js
logger.info(obj) // -> stdout -> platform log pipeline
```
---

### Q45. What is observability (logs, metrics, traces)?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
The three pillars: logs (discrete events), metrics (aggregated numbers like latency/throughput), and traces (request paths across services). Together they let you understand and debug production behavior.

#### Code Example
```js
metrics.increment('http.requests'); span.end() // metrics + trace
```
---

### Q46. What is distributed tracing?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Tracing propagates a trace/span context (e.g. `traceparent`) across services so you can see a single request's full path and where latency accrues. OpenTelemetry is the standard instrumentation.

#### Code Example
```js
const span = tracer.startSpan('db.query'); await q(); span.end()
```
---

### Q47. How do you collect application metrics?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Expose counters/gauges/histograms (via `prom-client`) at a `/metrics` endpoint scraped by Prometheus, tracking request rate, error rate, latency, and resource usage for dashboards/alerts.

#### Code Example
```js
app.get('/metrics', async (_, res) => res.end(await register.metrics()))
```
---

### Q48. What are the RED and USE metrics methods?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
RED (Rate, Errors, Duration) monitors request-driven services. USE (Utilization, Saturation, Errors) monitors resources (CPU, memory, disk). Together they cover service health and capacity.

#### Code Example
```js
// RED: req/s, error%, p99 latency
```
---

### Q49. How do you set up health-based auto-restart?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Use orchestrator liveness probes or a process manager to restart on crash/hang, plus alerting. Ensure the app crashes on programmer errors (don't swallow) so it can be restarted clean.

#### Code Example
```js
process.on('uncaughtException', e => { log(e); process.exit(1) })
```
---

### Q50. What is a memory leak's symptom in production?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Steadily climbing RSS/heap that never returns to baseline, rising GC frequency/pauses, growing latency, and eventual OOM restarts. Confirm with heap snapshots and monitor `memoryUsage` trends.

#### Code Example
```js
setInterval(() => metric('heap', process.memoryUsage().heapUsed), 10000)
```
---

### Q51. How do you handle secrets in deployment?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Inject secrets at runtime from a secret manager or orchestrator secrets, mount as env/files, restrict access, rotate, and keep them out of images, repos, and logs.

#### Code Example
```js
// K8s: mount Secret as env; app reads process.env at boot
```
---

### Q52. What is the difference between `NODE_ENV=production` effects?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
`production` makes frameworks (Express, React) enable optimizations, disable verbose errors/debug, and cache views. Some libraries change behavior. Always set it in production for performance and safety.

#### Code Example
```js
// Express caches templates; hides stack traces when production
```
---

### Q53. How do you minimize Docker image size?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Use slim/alpine bases, multi-stage builds, `npm ci --omit=dev`, `.dockerignore` to exclude junk, and combine/clean layers. Smaller images deploy faster and reduce attack surface.

#### Code Example
```js
// .dockerignore: node_modules, .git, tests
```
---

### Q54. How do you handle database migrations during deploy?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Run migrations as a separate, idempotent step before/at rollout, keep them backward-compatible for rolling deploys, and avoid destructive changes until old code is fully retired.

#### Code Example
```js
npx prisma migrate deploy # in CI/CD before app rollout
```
---

### Q55. What is feature flagging?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
Feature flags gate functionality at runtime so you can deploy code dark, roll out gradually, A/B test, and kill features instantly without redeploying. Decouples deploy from release.

#### Code Example
```js
if (flags.isEnabled('new-checkout', user)) return newCheckout()
```
---

### Q56. How do you implement graceful degradation?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
When a dependency fails, serve reduced functionality (cached/stale data, defaults, skipped non-critical features) instead of a full outage, using timeouts, circuit breakers, and fallbacks.

#### Code Example
```js
const recs = await getRecs().catch(() => []) // degrade, don't fail page
```
---

### Q57. What is a circuit breaker in deployment resilience?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
It trips open after repeated failures to a dependency, failing fast and giving it time to recover, then half-opens to test before closing. It prevents cascading failures and resource exhaustion.

#### Code Example
```js
breaker.fire(request).catch(() => fallback())
```
---

### Q58. How do you handle configuration reload without restart?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Watch a config source (file/consul) or receive a signal (`SIGHUP`) to reload settings into memory, applying changes atomically. Keep it optional; some changes still need a restart.

#### Code Example
```js
process.on('SIGHUP', () => reloadConfig())
```
---

### Q59. What are the benefits of serverless for Node?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Serverless (Lambda/Cloud Functions) auto-scales, bills per invocation, and removes server management — great for spiky/event-driven workloads. Trade-offs: cold starts, execution limits, and statelessness.

#### Code Example
```js
export const handler = async (event) => ({ statusCode: 200, body: 'ok' })
```
---

### Q60. What causes cold starts and how do you reduce them?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Cold starts are the latency of initializing a new function instance (runtime + deps + init code). Reduce by shrinking bundle/deps, lazy-loading, provisioned concurrency, and keeping functions warm.

#### Code Example
```js
// move heavy require() inside handler only if rarely used
```
---

### Q61. How do you handle stateful connections in serverless?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Reuse connections across invocations by declaring them outside the handler, use connection proxies (RDS Proxy) to avoid exhausting DB connections from many concurrent instances, and prefer HTTP/serverless-friendly data stores.

#### Code Example
```js
const db = connect() // module scope: reused on warm invocations
export const handler = async () => db.query(...)
```
---

### Q62. What is the twelve-factor app methodology?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
A set of practices for scalable, portable services: config in env, stateless processes, backing services as attached resources, logs to stdout, dev/prod parity, explicit dependencies, and disposability.

#### Code Example
```js
// config via env, stateless, logs to stdout -> 12-factor
```
---

### Q63. How do you keep processes stateless for scaling?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Store session/state in external stores (Redis/DB), not process memory, so any instance can serve any request and instances can be added/removed freely without sticky sessions.

#### Code Example
```js
app.use(session({ store: new RedisStore({ client }) }))
```
---

### Q64. How do you run smoke tests after deployment?
**Difficulty:** `Advanced`
**Category:** Performance, Testing & Deployment

#### Answer
After deploy, hit critical endpoints (health, key user flows) against the live environment to confirm it works before shifting full traffic; roll back automatically if smoke tests fail.

#### Code Example
```js
await request('https://staging').get('/health').expect(200)
```
---

### Q65. How do you profile production safely?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Use low-overhead continuous profilers (Pyroscope, cloud profilers) or sampled `--inspect` on one instance, capture on-demand heap/CPU snapshots, and prefer metrics/traces to avoid impacting all traffic.

#### Code Example
```js
process.on('SIGUSR2', () => require('v8').writeHeapSnapshot())
```
---

### Q66. What is the difference between `dependencies` size and runtime performance?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
More/larger dependencies slow installs, cold starts, and increase attack surface, but don't necessarily slow steady-state runtime. Trim unused deps for faster deploys and security, independent of hot-path speed.

#### Code Example
```js
npx depcheck # remove unused deps
```
---

### Q67. How do you set up alerting?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Alert on symptoms users feel (error rate, latency SLO breaches, saturation) rather than every metric, with thresholds and routing to on-call. Avoid noisy alerts that cause fatigue.

#### Code Example
```js
// alert if p99 latency > 500ms for 5m OR error rate > 1%
```
---

### Q68. What is an SLO/SLA/SLI?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
An SLI is a measured indicator (e.g. success rate). An SLO is the internal target (e.g. 99.9%). An SLA is the external contractual promise with penalties. Error budgets derive from SLOs to balance reliability vs velocity.

#### Code Example
```js
// SLI: successful requests / total; SLO: 99.9% monthly
```
---

### Q69. How do you roll back a bad deployment?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Redeploy the previous known-good image/version (kept immutable and tagged), verify with smoke tests, and ensure DB migrations were backward-compatible so rollback doesn't corrupt data.

#### Code Example
```js
kubectl rollout undo deployment/app
```
---

### Q70. How do you ensure database changes are rollback-safe?
**Difficulty:** `Experienced`
**Category:** Performance, Testing & Deployment

#### Answer
Use expand-contract: add new columns/tables (expand), deploy code using both old and new, backfill, then remove old (contract) only after the new version is stable. Never drop/rename in the same release as the code change.

#### Code Example
```js
// release1: add column; release2: use it; release3: drop old column
```
---
