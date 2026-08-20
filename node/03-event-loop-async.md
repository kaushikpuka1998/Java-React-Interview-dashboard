# Event Loop & Async Interview Questions (Q1 – Q70)

---

### Q1. What is the event loop in Node.js?
**Difficulty:** `Basic`
**Category:** Event Loop & Async

#### Answer
The event loop is the mechanism that lets Node perform non-blocking I/O on a single thread. It continuously checks queues for completed operations and runs their callbacks, phase by phase, until there is no more work.

#### Code Example
```js
setTimeout(() => console.log('later'), 0)
console.log('now') // 'now' then 'later'
```
---

### Q2. What are the main phases of the event loop?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
Timers (setTimeout/setInterval), pending callbacks, idle/prepare (internal), poll (I/O callbacks), check (setImmediate), and close callbacks. The loop cycles through these in order.

#### Code Example
```js
// poll -> check -> close, then back to timers on the next tick
```
---

### Q3. What is the poll phase?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
The poll phase retrieves new I/O events and executes their callbacks. If no timers are pending, it may block here waiting for I/O; if `setImmediate` callbacks are queued, it ends and moves to the check phase.

#### Code Example
```js
fs.readFile('a', () => console.log('poll phase callback'))
```
---

### Q4. What is the check phase?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
The check phase runs `setImmediate` callbacks immediately after the poll phase completes. It is designed to run code right after I/O callbacks in the same loop iteration.

#### Code Example
```js
setImmediate(() => console.log('check phase'))
```
---

### Q5. What is the difference between microtasks and macrotasks?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Macrotasks are event-loop phase callbacks (timers, I/O, setImmediate). Microtasks are `process.nextTick` and resolved Promise callbacks. Microtasks run after each macrotask/operation and are fully drained before the loop proceeds — so they can starve I/O.

#### Code Example
```js
setTimeout(() => console.log('macro'))
Promise.resolve().then(() => console.log('micro')) // micro first
```
---

### Q6. What is the order between `process.nextTick` and Promises?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Both are microtasks, but the `nextTick` queue is drained before the Promise microtask queue after each operation. So `nextTick` callbacks run before `.then` callbacks.

#### Code Example
```js
Promise.resolve().then(() => console.log('promise'))
process.nextTick(() => console.log('nextTick')) // nextTick prints first
```
---

### Q7. Why can `process.nextTick` starve the event loop?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
The entire nextTick queue is drained before the loop advances to the next phase. If a nextTick callback keeps scheduling more nextTicks, I/O and timers never run — the loop is starved.

#### Code Example
```js
function loop() { process.nextTick(loop) } // blocks all I/O forever
```
---

### Q8. What is a Promise?
**Difficulty:** `Basic`
**Category:** Event Loop & Async

#### Answer
A Promise represents the eventual result of an async operation, with states pending, fulfilled, or rejected. You consume it with `.then`/`.catch`/`.finally` or `await`.

#### Code Example
```js
const p = new Promise((resolve, reject) => resolve(42))
p.then(v => console.log(v)) // 42
```
---

### Q9. What are the three states of a Promise?
**Difficulty:** `Basic`
**Category:** Event Loop & Async

#### Answer
Pending (initial), fulfilled (resolved with a value), and rejected (failed with a reason). Once settled (fulfilled/rejected), a Promise is immutable.

#### Code Example
```js
Promise.reject(new Error('x')).catch(e => console.log(e.message))
```
---

### Q10. What is `async/await`?
**Difficulty:** `Basic`
**Category:** Event Loop & Async

#### Answer
`async` functions return Promises; `await` pauses execution until a Promise settles, letting you write asynchronous code that reads synchronously. Errors are caught with try/catch.

#### Code Example
```js
async function main() {
  const data = await fetch('/api').then(r => r.json())
  return data
}
```
---

### Q11. Does `await` block the event loop?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
No. `await` suspends only the current async function and returns control to the event loop, which continues handling other work. It is cooperative, not blocking.

#### Code Example
```js
async function h() { await db.query() /* loop free meanwhile */ }
```
---

### Q12. How do you run async operations in parallel?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
Start the operations first (don't await sequentially), then await them together with `Promise.all`. Awaiting one at a time serializes them unnecessarily.

#### Code Example
```js
const [a, b] = await Promise.all([fetchA(), fetchB()])
```
---

### Q13. What is the difference between `Promise.all` and `Promise.allSettled`?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
`Promise.all` rejects as soon as any promise rejects (fail-fast). `Promise.allSettled` waits for all and returns each result's status/value/reason, never rejecting — ideal when partial failures are acceptable.

#### Code Example
```js
const results = await Promise.allSettled([a(), b()])
// [{status:'fulfilled',value}, {status:'rejected',reason}]
```
---

### Q14. What does `Promise.race` do?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
`Promise.race` settles as soon as the first input promise settles (fulfilled or rejected), adopting its outcome. Common for timeouts.

#### Code Example
```js
await Promise.race([fetchData(), timeout(5000)])
```
---

### Q15. What does `Promise.any` do?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
`Promise.any` fulfills with the first fulfilled promise, ignoring rejections. It rejects only if all reject, throwing an `AggregateError`. Useful for "first success wins".

#### Code Example
```js
const fastest = await Promise.any([mirror1(), mirror2()])
```
---

### Q16. How do you implement a timeout for a Promise?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Race the operation against a promise that rejects after a delay, or use `AbortController` with `AbortSignal.timeout`. The latter can actually cancel the underlying operation.

#### Code Example
```js
const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
```
---

### Q17. What is an AbortController?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
`AbortController` provides an `AbortSignal` to cancel async operations (fetch, streams, timers). Calling `abort()` triggers the signal, and supporting APIs reject with an `AbortError`.

#### Code Example
```js
const ac = new AbortController()
setTimeout(() => ac.abort(), 100)
await fetch(url, { signal: ac.signal })
```
---

### Q18. What is the difference between `setTimeout` and `setInterval`?
**Difficulty:** `Basic`
**Category:** Event Loop & Async

#### Answer
`setTimeout` runs a callback once after a delay. `setInterval` runs it repeatedly at a fixed interval until cleared. Long-running work in an interval can overlap; a self-rescheduling timeout avoids that.

#### Code Example
```js
const id = setInterval(tick, 1000)
clearInterval(id)
```
---

### Q19. Why might `setTimeout(fn, 1000)` fire later than 1000ms?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Timers specify a minimum delay, not exact timing. If the event loop is busy (blocking code, backed-up phases), the callback runs only when the loop reaches the timers phase after the delay elapses.

#### Code Example
```js
setTimeout(() => console.log('maybe >1000ms'), 1000)
blockCpuFor2Seconds()
```
---

### Q20. What is the difference between `setImmediate` and `setTimeout(fn, 0)` again inside I/O?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Within an I/O callback (poll phase), `setImmediate` always runs before `setTimeout(fn,0)` because the check phase follows poll in the same iteration, whereas the timer must wait for the next timers phase.

#### Code Example
```js
fs.readFile('f', () => {
  setImmediate(() => console.log('1'))
  setTimeout(() => console.log('2'), 0)
})
```
---

### Q21. What happens if you don't await a Promise?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
The code continues without waiting; the Promise runs in the background ("fire and forget"). If it rejects and nothing handles it, you get an unhandled rejection (which can crash the process in modern Node).

#### Code Example
```js
saveLog() // not awaited: errors become unhandled rejections
```
---

### Q22. How do you convert a callback-based function to a Promise?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
Wrap it in `new Promise`, resolving/rejecting in the callback, or use `util.promisify` for error-first callbacks.

#### Code Example
```js
const wait = ms => new Promise(res => setTimeout(res, ms))
await wait(500)
```
---

### Q23. What is the difference between concurrency and parallelism in Node?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Concurrency is managing many tasks by interleaving them on one thread (Node's default for I/O). Parallelism is executing tasks simultaneously on multiple cores (worker threads/cluster). Node gives concurrency for free, parallelism only with extra threads/processes.

#### Code Example
```js
// concurrency: many awaits interleaved on one thread
await Promise.all(urls.map(fetch))
```
---

### Q24. How do you limit concurrency of async tasks?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Process items in batches or use a concurrency-limited pool (e.g. `p-limit`) so you don't launch thousands of simultaneous operations that exhaust memory, sockets, or DB connections.

#### Code Example
```js
const limit = pLimit(5)
await Promise.all(items.map(i => limit(() => process(i))))
```
---

### Q25. What is a race condition in async code and how do you prevent it?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
A race condition occurs when overlapping async operations interleave in an unexpected order, corrupting shared state. Prevent it with locks/mutexes, atomic DB operations, queues, or by serializing critical sections.

#### Code Example
```js
// atomic increment avoids read-modify-write race
await db.collection('c').updateOne({_id}, { $inc: { count: 1 } })
```
---

### Q26. What does `Promise.resolve()` do?
**Difficulty:** `Basic`
**Category:** Event Loop & Async

#### Answer
It returns a Promise already fulfilled with the given value (or the same promise if you pass one). Useful for normalizing sync/async values and starting a microtask chain.

#### Code Example
```js
Promise.resolve(5).then(console.log) // 5
```
---

### Q27. What is promise chaining?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
Each `.then` returns a new Promise, so you can chain sequential steps. Returning a value passes it on; returning a Promise waits for it; throwing routes to the next `.catch`.

#### Code Example
```js
fetch(url).then(r => r.json()).then(d => d.id).catch(console.error)
```
---

### Q28. What is the difference between returning and awaiting inside a promise chain?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
In `.then`, returning a Promise makes the chain wait for it; not returning it "floats" the inner promise and its errors escape the chain. Always return inner promises.

#### Code Example
```js
.then(() => save())   // waits & propagates errors
.then(() => { save() }) // floats: errors lost
```
---

### Q29. How does error handling work with async/await?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
Wrap awaited calls in try/catch; a rejected awaited Promise throws. You can also `.catch` on the async function's returned Promise. Uncaught rejections propagate up.

#### Code Example
```js
try { await risky() } catch (e) { handle(e) }
```
---

### Q30. What is `finally` used for in Promises?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
`.finally(fn)` (or try/finally with await) runs cleanup regardless of success/failure, without altering the result — good for releasing resources like connections or spinners.

#### Code Example
```js
try { await work() } finally { spinner.stop() }
```
---

### Q31. What is the difference between sequential and concurrent awaits?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
Sequential awaits run one after another (total = sum of times). Concurrent starts them together and awaits with `Promise.all` (total ≈ max time). Use concurrency when tasks are independent.

#### Code Example
```js
// slow: a then b
const a = await getA(); const b = await getB()
// fast: both at once
const [x, y] = await Promise.all([getA(), getB()])
```
---

### Q32. How do you handle errors in `Promise.all`?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
`Promise.all` rejects on the first failure, discarding other results. Wrap each promise to catch individually, or use `Promise.allSettled` to inspect all outcomes.

#### Code Example
```js
const safe = ps.map(p => p.catch(e => ({ error: e })))
const results = await Promise.all(safe)
```
---

### Q33. What is an async iterator?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
An async iterator produces values over time via `Symbol.asyncIterator`, consumed with `for await...of`. It underpins async generators and streams, letting you loop over asynchronously arriving data.

#### Code Example
```js
for await (const chunk of readableStream) process(chunk)
```
---

### Q34. What is an async generator?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
An `async function*` yields values asynchronously, awaiting between yields. It is ideal for streaming/paginated data with backpressure-friendly consumption via `for await`.

#### Code Example
```js
async function* pages(url) {
  let next = url
  while (next) { const p = await fetchPage(next); yield p.items; next = p.next }
}
```
---

### Q35. How does `for await...of` work?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
It iterates an async iterable, awaiting each `next()` result before the loop body runs. It reads streams/async generators sequentially with automatic backpressure.

#### Code Example
```js
for await (const line of readLines(file)) console.log(line)
```
---

### Q36. What is the difference between `map` with async and `for await`?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
`array.map(async ...)` starts all operations concurrently and returns Promises (await with `Promise.all`). `for await` processes items sequentially. Choose based on whether you need concurrency or ordering/backpressure.

#### Code Example
```js
await Promise.all(items.map(async i => process(i))) // concurrent
for (const i of items) await process(i)              // sequential
```
---

### Q37. Why should you avoid `await` inside a `forEach`?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
`Array.forEach` ignores the returned Promise, so it does not wait — the loop finishes before async work completes, and errors are lost. Use `for...of` with await or `Promise.all` with `map`.

#### Code Example
```js
items.forEach(async i => await save(i)) // does NOT wait
for (const i of items) await save(i)     // correct
```
---

### Q38. What is a deferred/lazy Promise pattern?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
A deferred exposes `resolve`/`reject` outside the executor so external code can settle the Promise later — useful for bridging event-based APIs. `Promise.withResolvers()` standardizes this.

#### Code Example
```js
const { promise, resolve } = Promise.withResolvers()
emitter.once('ready', resolve)
await promise
```
---

### Q39. What happens to a thrown error in an async function?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
It becomes a rejected Promise returned by that async function. Callers must catch it via try/catch on await or `.catch`; otherwise it surfaces as an unhandled rejection.

#### Code Example
```js
async function f() { throw new Error('x') }
f().catch(e => console.log(e.message)) // 'x'
```
---

### Q40. What is the microtask queue drain guarantee?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
After each macrotask (and after synchronous script completes), the engine drains the entire microtask queue before rendering/next macrotask. New microtasks scheduled during draining are also run in the same drain.

#### Code Example
```js
Promise.resolve().then(() => Promise.resolve().then(() => console.log('still same drain')))
```
---

### Q41. How do you make a synchronous-looking retry with backoff?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Loop with await, catching failures, and sleep with exponential backoff (plus jitter) between attempts up to a max. This smooths transient failures without hammering a service.

#### Code Example
```js
for (let i = 0; i < 5; i++) {
  try { return await call() } catch { await sleep(2 ** i * 100) }
}
```
---

### Q42. What is the thundering herd problem and how does jitter help?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Thundering herd is many clients retrying at the same instant after a failure, overwhelming the recovering service. Adding random jitter to backoff spreads retries over time, smoothing the load.

#### Code Example
```js
const delay = base * 2 ** attempt + Math.random() * 100 // jitter
```
---

### Q43. How do timers behave with `unref()`?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Calling `.unref()` on a timer lets the process exit even if the timer is still pending — it no longer keeps the event loop alive. `ref()` restores the keep-alive behavior.

#### Code Example
```js
const t = setInterval(poll, 1000)
t.unref() // won't prevent process exit
```
---

### Q44. What keeps the Node process alive?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Pending "refs": active timers, open sockets/servers, pending I/O, and open handles keep the event loop running. When none remain, the loop empties and the process exits.

#### Code Example
```js
setTimeout(() => {}, 100000) // keeps process alive for 100s
```
---

### Q45. What is `queueMicrotask`?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
`queueMicrotask(fn)` schedules a microtask directly, running after the current task before the next macrotask — like `Promise.resolve().then` but clearer and without creating a Promise.

#### Code Example
```js
queueMicrotask(() => console.log('runs before timers'))
```
---

### Q46. How do you debounce an async function?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Delay execution until calls stop for a quiet period by clearing and resetting a timer each call. For async, also cancel or ignore stale in-flight results.

#### Code Example
```js
function debounce(fn, ms) {
  let t
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}
```
---

### Q47. How do you throttle async calls?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Throttling limits execution to at most once per interval regardless of call frequency, using a timestamp or a leading/trailing timer. Good for rate-limiting expensive operations.

#### Code Example
```js
let last = 0
const throttled = fn => (...a) => { const n = Date.now(); if (n - last > 1000) { last = n; fn(...a) } }
```
---

### Q48. What is memoization of async functions?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Cache the returned Promise (not just the value) keyed by args, so concurrent identical calls share one in-flight request (request coalescing). Evict on error or TTL.

#### Code Example
```js
const cache = new Map()
const get = k => cache.get(k) ?? cache.set(k, fetchData(k)).get(k)
```
---

### Q49. What is the difference between eager and lazy evaluation of Promises?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Promises are eager: the executor runs immediately when created, even before `await`. To defer work, wrap it in a function (thunk) and call it when needed.

#### Code Example
```js
const eager = fetch(url)        // request already sent
const lazy = () => fetch(url)   // sent only when called
```
---

### Q50. How do you detect and fix event loop lag?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Measure lag with `perf_hooks.monitorEventLoopDelay` or a timer-drift check. High lag means blocking (CPU-bound sync code); fix by offloading to worker threads, chunking work, or streaming.

#### Code Example
```js
const h = require('perf_hooks').monitorEventLoopDelay(); h.enable()
setInterval(() => console.log(h.mean / 1e6, 'ms lag'), 1000)
```
---

### Q51. What is backpressure in async data flow?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Backpressure is signaling a fast producer to slow down when a slow consumer can't keep up, preventing unbounded memory growth. Streams and async iterators implement it; `for await` respects it naturally.

#### Code Example
```js
for await (const chunk of source) await slowConsumer(chunk) // paced
```
---

### Q52. Why is mixing callbacks and Promises for the same operation dangerous?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
A function should not both call a callback and return a Promise, or it may resolve twice / double-run logic. Choose one contract to avoid subtle double-execution bugs.

#### Code Example
```js
// bad: resolves via callback AND promise
function f(cb) { return new Promise(res => { cb(); res() }) }
```
---

### Q53. What is a semaphore and when do you use it in Node?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
A semaphore limits how many async operations run concurrently by handing out a fixed number of permits. Use it to cap DB connections, file handles, or outbound requests.

#### Code Example
```js
const sem = new Semaphore(10)
await sem.acquire(); try { await doWork() } finally { sem.release() }
```
---

### Q54. How do you cancel an in-flight async operation?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Pass an `AbortSignal` to APIs that support it and call `controller.abort()`. For custom code, check `signal.aborted` at checkpoints and reject with an `AbortError`.

#### Code Example
```js
if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
```
---

### Q55. What is the difference between `process.nextTick` recursion and `setImmediate` recursion?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Recursive `nextTick` blocks the loop (microtasks never yield to I/O). Recursive `setImmediate` yields between iterations, letting I/O and timers run — safer for chunking long work.

#### Code Example
```js
function chunk() { doPart(); if (more) setImmediate(chunk) } // non-blocking
```
---

### Q56. How do you break a long CPU task without blocking the loop?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Split the work into slices and yield to the loop between slices via `setImmediate`/`await new Promise(setImmediate)`, or move it entirely to a worker thread for true parallelism.

#### Code Example
```js
for (let i = 0; i < n; i += 1000) { processSlice(i); await new Promise(setImmediate) }
```
---

### Q57. What is a Promise's "resolution" vs "fulfillment"?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Resolving a Promise locks in its fate — which may be fulfillment with a value or, if resolved with another thenable, following that thenable (possibly ending in rejection). Fulfillment specifically means settled with a value.

#### Code Example
```js
new Promise(res => res(Promise.reject('x'))).catch(console.log) // 'x'
```
---

### Q58. What happens if you `await` a non-Promise value?
**Difficulty:** `Intermediate`
**Category:** Event Loop & Async

#### Answer
`await` wraps non-thenables in `Promise.resolve`, so it returns the value on the next microtask. It still yields to the microtask queue even for plain values.

#### Code Example
```js
const x = await 5 // x === 5, but resolves asynchronously
```
---

### Q59. How do you implement a simple async queue?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Keep a promise chain; each enqueued task appends `.then(task)` so tasks run strictly one after another, serializing access to a shared resource.

#### Code Example
```js
let tail = Promise.resolve()
const enqueue = task => (tail = tail.then(task))
```
---

### Q60. What is the difference between `Promise.all` fail-fast and gathering all errors?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Fail-fast (`Promise.all`) stops at the first rejection — good when any failure invalidates the batch. Gathering (`allSettled`) collects every outcome — good for reporting which items succeeded/failed.

#### Code Example
```js
const outcomes = await Promise.allSettled(jobs)
const failed = outcomes.filter(o => o.status === 'rejected')
```
---

### Q61. How does async context propagate across awaits?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Local variables persist across `await` because the function's state is preserved. For cross-call context (like request IDs), use `AsyncLocalStorage`, which maintains context through async chains.

#### Code Example
```js
als.run({ reqId }, async () => { await handler() /* als.getStore().reqId available */ })
```
---

### Q62. What is `AsyncLocalStorage`?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
`AsyncLocalStorage` (from `async_hooks`) stores data that stays associated with an async execution chain, like thread-local storage. It is commonly used for per-request logging context without passing it everywhere.

#### Code Example
```js
const als = new AsyncLocalStorage()
als.run(store, () => { /* store available in all awaited callees */ })
```
---

### Q63. What are async hooks?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
`async_hooks` lets you track the lifecycle of async resources (init, before, after, destroy). It powers context propagation and diagnostics but has performance overhead, so use sparingly in production.

#### Code Example
```js
const hook = require('async_hooks').createHook({ init() {} })
hook.enable()
```
---

### Q64. Why is `Promise.all` order preserved even if tasks finish out of order?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
`Promise.all` returns results in input order regardless of completion order, because it stores each result at its index. Only timing differs, not the result array's ordering.

#### Code Example
```js
await Promise.all([slow(), fast()]) // [slowResult, fastResult]
```
---

### Q65. What is a leaked Promise and how does it happen?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
A leaked Promise is one that never settles (e.g. awaiting an event that never fires), leaving the awaiting code stuck and holding resources. Add timeouts/AbortSignals to guarantee settlement.

#### Code Example
```js
await new Promise(() => {}) // never resolves -> leak
```
---

### Q66. How do you test asynchronous code?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Return or await the Promise in the test so the runner waits for completion, use fake timers to control delays, and assert on resolved values or rejections.

#### Code Example
```js
test('resolves', async () => { await expect(fetchUser(1)).resolves.toHaveProperty('id') })
```
---

### Q67. What is the difference between `setTimeout` in Node and the browser?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Node's `setTimeout` returns a `Timeout` object (with `ref`/`unref`), not a number, and integrates with libuv's timers phase. The browser returns a numeric id and clamps nested timeouts to 4ms.

#### Code Example
```js
const t = setTimeout(fn, 100) // Timeout object in Node
t.unref()
```
---

### Q68. How do you flatten nested async results cleanly?
**Difficulty:** `Advanced`
**Category:** Event Loop & Async

#### Answer
Use await to avoid nested `.then`, and `Promise.all` with `flat`/`flatMap` to combine arrays of async results into one list.

#### Code Example
```js
const nested = await Promise.all(groups.map(g => fetchItems(g)))
const all = nested.flat()
```
---

### Q69. What is the cost of creating many Promises?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Each Promise allocates memory and schedules microtasks; creating millions at once causes GC pressure and memory spikes. Batch/stream work and limit concurrency instead of materializing everything up front.

#### Code Example
```js
// avoid: urls.map(fetch) for 1M urls; use a bounded pool
```
---

### Q70. How do you ensure ordered processing of a stream of async events?
**Difficulty:** `Experienced`
**Category:** Event Loop & Async

#### Answer
Serialize with an async queue or `for await`, or tag events with sequence numbers and reorder. Concurrency without ordering guarantees can interleave results unpredictably.

#### Code Example
```js
for await (const event of eventStream) await handleInOrder(event)
```
---
