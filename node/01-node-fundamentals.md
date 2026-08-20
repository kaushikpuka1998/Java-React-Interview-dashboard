# Node.js Fundamentals Interview Questions (Q1 – Q70)

---

### Q1. What is Node.js?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Node.js is a JavaScript runtime built on Chrome's V8 engine that runs JS outside the browser. It uses a single-threaded, event-driven, non-blocking I/O model, making it efficient for I/O-heavy and real-time applications.

#### Code Example
```js
console.log('Hello from Node ' + process.version)
```
---

### Q2. Is Node.js single-threaded or multi-threaded?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Your JavaScript runs on a single main thread (the event loop), but Node offloads blocking work (file I/O, DNS, crypto) to a `libuv` thread pool (default 4 threads). So it is single-threaded for JS execution, multi-threaded under the hood.

#### Code Example
```js
// UV_THREADPOOL_SIZE controls the pool size
process.env.UV_THREADPOOL_SIZE = 8
```
---

### Q3. What is V8?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
V8 is Google's open-source JavaScript engine written in C++. It compiles JS directly to machine code (JIT), and Node embeds it to execute JavaScript. V8 also manages memory and garbage collection.

#### Code Example
```js
console.log(process.versions.v8) // e.g. "12.4.254.21-node.20"
```
---

### Q4. What is libuv?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`libuv` is a C library that gives Node its asynchronous, event-driven capabilities. It provides the event loop, the thread pool, and cross-platform async I/O (file system, TCP/UDP, timers, child processes).

#### Code Example
```js
// crypto.pbkdf2 runs on the libuv thread pool, not the main thread
require('crypto').pbkdf2('pw', 'salt', 100000, 64, 'sha512', () => {})
```
---

### Q5. What is npm?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
npm (Node Package Manager) is the default package manager for Node. It installs dependencies from the npm registry, manages versions via `package.json`, and runs scripts.

#### Code Example
```js
// package.json
{ "scripts": { "start": "node index.js" }, "dependencies": { "express": "^4.19.0" } }
```
---

### Q6. What is the difference between `node index.js` and running in the REPL?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`node index.js` executes a file. Running `node` with no argument starts the REPL (Read-Eval-Print-Loop), an interactive shell for evaluating expressions line by line — useful for quick experiments.

#### Code Example
```js
$ node
> 2 + 2
4
> .exit
```
---

### Q7. What are globals in Node.js?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Globals are objects available everywhere without `require`: `global`, `process`, `console`, `Buffer`, `setTimeout`, `__dirname`, `__filename` (in CommonJS). Unlike the browser, there is no `window`; the global object is `global` (or `globalThis`).

#### Code Example
```js
console.log(__dirname)  // directory of current module
console.log(globalThis === global) // true
```
---

### Q8. What is `process` in Node.js?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`process` is a global providing information and control over the current Node process: `process.argv`, `process.env`, `process.exit()`, `process.cwd()`, and events like `exit` and `uncaughtException`.

#### Code Example
```js
console.log(process.argv)   // [node, script, ...args]
console.log(process.env.NODE_ENV)
```
---

### Q9. What is `process.argv`?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`process.argv` is an array of command-line arguments. Index 0 is the Node executable, index 1 is the script path, and the rest are user arguments.

#### Code Example
```js
// node app.js --name Alice
const args = process.argv.slice(2) // ['--name', 'Alice']
```
---

### Q10. What is `process.env`?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`process.env` holds environment variables as key-value strings. It is used for configuration like ports, API keys, and `NODE_ENV`, keeping secrets out of source code.

#### Code Example
```js
const port = process.env.PORT || 3000
```
---

### Q11. What is the difference between `__dirname` and `process.cwd()`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`__dirname` is the directory of the currently executing file. `process.cwd()` is the directory from which the Node process was launched. They differ when you run a script from another folder.

#### Code Example
```js
// running: cd /home && node /app/index.js
console.log(__dirname)      // /app
console.log(process.cwd())  // /home
```
---

### Q12. What is `NODE_ENV` used for?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`NODE_ENV` is a convention (not built into Node) for signaling the environment: `development`, `production`, or `test`. Frameworks like Express enable optimizations and disable verbose errors when it is `production`.

#### Code Example
```js
if (process.env.NODE_ENV === 'production') app.use(compression())
```
---

### Q13. How do you exit a Node process?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Call `process.exit(code)` — `0` means success, non-zero means failure. Avoid it in servers because it terminates immediately without flushing async work; prefer letting the event loop drain or setting `process.exitCode`.

#### Code Example
```js
process.exitCode = 1 // graceful: exits when loop empties
```
---

### Q14. What is the difference between Node.js and the browser JavaScript environment?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Browsers provide `window`, `document`, and DOM APIs; Node provides `global`, `process`, file system, and network modules. Node has no DOM; browsers cannot access the file system directly. Both use V8 (in Chrome/Node).

#### Code Example
```js
// Node: fs available, document undefined
const fs = require('fs')
```
---

### Q15. What are the different types of Node.js applications?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Common types: REST/GraphQL APIs, real-time apps (chat, WebSockets), CLI tools, microservices, streaming servers, and build tooling. Node excels at I/O-bound and real-time workloads, less so at CPU-bound tasks.

#### Code Example
```js
#!/usr/bin/env node
console.log('A CLI tool')
```
---

### Q16. What is a callback in Node.js?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
A callback is a function passed as an argument to be invoked later, typically when an async operation completes. Node uses the "error-first" callback convention: `(err, data) => {}`.

#### Code Example
```js
require('fs').readFile('a.txt', (err, data) => {
  if (err) return console.error(err)
  console.log(data.toString())
})
```
---

### Q17. What is the error-first callback pattern?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
By convention, the first argument to a Node callback is an error (or `null` if none), and subsequent arguments carry results. This makes error handling consistent across the ecosystem.

#### Code Example
```js
function done(err, result) {
  if (err) throw err
  console.log(result)
}
```
---

### Q18. What is callback hell and how do you avoid it?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
Callback hell is deeply nested callbacks that become hard to read and maintain ("pyramid of doom"). Avoid it with named functions, Promises, or `async/await`.

#### Code Example
```js
// Instead of nesting, chain promises
readFile(a).then(process).then(save).catch(handle)
```
---

### Q19. What is the difference between synchronous and asynchronous functions in Node?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Synchronous functions block the event loop until they finish (e.g., `fs.readFileSync`). Asynchronous functions return immediately and deliver results via callback/Promise, keeping the loop free. Prefer async in servers.

#### Code Example
```js
const data = fs.readFileSync('a.txt')      // blocks
fs.readFile('a.txt', (e, d) => {})          // non-blocking
```
---

### Q20. What is `Buffer` in Node.js?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
A `Buffer` is a fixed-length chunk of raw binary data outside the V8 heap. It is used to handle bytes from files, network streams, and encoding conversions before JS strings existed with binary support.

#### Code Example
```js
const buf = Buffer.from('hi', 'utf8')
console.log(buf)             // <Buffer 68 69>
console.log(buf.toString())  // 'hi'
```
---

### Q21. What is the global object in Node vs the browser?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
In the browser it is `window`; in Node it is `global`. `globalThis` is the standard cross-environment reference to whichever applies. Variables declared with `var` at module scope do NOT attach to `global` in Node (modules are wrapped).

#### Code Example
```js
global.myConfig = { debug: true }
console.log(globalThis.myConfig.debug) // true
```
---

### Q22. Why is Node.js good for I/O-bound tasks but not CPU-bound tasks?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
I/O is offloaded to libuv/OS, so the single JS thread stays free to handle many concurrent requests. CPU-bound work (heavy computation) blocks that one thread, stalling all requests. Offload CPU work to worker threads or a separate service.

#### Code Example
```js
// bad: blocks everyone
for (let i = 0; i < 1e10; i++) {}
```
---

### Q23. What is the `console` module?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`console` provides logging: `log`, `error`, `warn`, `info`, `table`, `time`/`timeEnd`, and `dir`. `console.log` writes to stdout, `console.error` to stderr, which lets you separate logs from errors when piping.

#### Code Example
```js
console.time('t'); doWork(); console.timeEnd('t') // t: 12ms
```
---

### Q24. What is the difference between `stdout` and `stderr`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`process.stdout` is the standard output stream (normal program output); `process.stderr` is for errors and diagnostics. Separating them lets you redirect logs and errors independently (`node app 1>out.log 2>err.log`).

#### Code Example
```js
process.stdout.write('result\n')
process.stderr.write('warning\n')
```
---

### Q25. How do you read user input from the command line?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
Use the built-in `readline` module (or `process.stdin`) to read lines interactively from stdin.

#### Code Example
```js
const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout })
rl.question('Name? ', name => { console.log('Hi ' + name); rl.close() })
```
---

### Q26. What is the module wrapper function in Node?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
Before execution, Node wraps every CommonJS module in a function `(exports, require, module, __filename, __dirname) => {}`. This gives each module its own scope and injects those five variables, which is why they are available without importing.

#### Code Example
```js
(function (exports, require, module, __filename, __dirname) {
  // your module code runs here
})
```
---

### Q27. What is `globalThis`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`globalThis` is a standardized way (ES2020) to access the global object regardless of environment (browser `window`, Node `global`, workers `self`). It improves portability of shared code.

#### Code Example
```js
globalThis.crypto ??= require('crypto').webcrypto
```
---

### Q28. How does Node.js handle concurrency without multiple threads for JS?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
Node uses an event loop plus non-blocking I/O. Instead of one thread per request, a single thread registers callbacks and processes completed I/O events as they arrive, achieving high concurrency with low overhead.

#### Code Example
```js
// thousands of concurrent connections, one JS thread
require('http').createServer((req, res) => res.end('ok')).listen(3000)
```
---

### Q29. What is the difference between `setTimeout(fn, 0)` and `setImmediate(fn)`?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
`setImmediate` runs after the current poll phase (check phase); `setTimeout(fn, 0)` runs in the timers phase after at least 1ms. Inside an I/O callback, `setImmediate` always fires first; at the top level the order is nondeterministic.

#### Code Example
```js
fs.readFile('a', () => {
  setTimeout(() => console.log('timeout'), 0)
  setImmediate(() => console.log('immediate')) // logs first
})
```
---

### Q30. What is `process.nextTick()`?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
`process.nextTick(fn)` queues `fn` to run immediately after the current operation completes, before the event loop continues and before any timers/immediates. Overusing it can starve the loop (I/O never runs).

#### Code Example
```js
console.log('start')
process.nextTick(() => console.log('tick'))
console.log('end') // start, end, tick
```
---

### Q31. What are the phases of the Node.js event loop?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
Phases in order: timers → pending callbacks → idle/prepare → poll → check → close callbacks. Between each phase (and each callback) Node drains the `nextTick` and microtask (Promise) queues.

#### Code Example
```js
// poll = I/O callbacks; check = setImmediate; timers = setTimeout/Interval
```
---

### Q32. What is the difference between CommonJS and ES Modules?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
CommonJS uses `require`/`module.exports`, loads synchronously, and is the historical Node format. ES Modules use `import`/`export`, load asynchronously, support top-level `await`, and are the standard. Node picks the format via `.mjs`/`.cjs` or `"type"` in package.json.

#### Code Example
```js
// CJS
const x = require('./x')
// ESM
import x from './x.js'
```
---

### Q33. How do you enable ES Modules in Node?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
Either use the `.mjs` extension, or set `"type": "module"` in `package.json`. Then use `import`/`export` and include file extensions in relative imports.

#### Code Example
```js
// package.json
{ "type": "module" }
// index.js
import { readFile } from 'node:fs/promises'
```
---

### Q34. What is the `node:` protocol in imports?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
Prefixing a built-in module with `node:` (e.g. `node:fs`) makes it explicit that it is a core module, avoiding ambiguity with a same-named npm package and slightly speeding resolution.

#### Code Example
```js
import { readFile } from 'node:fs/promises'
const os = require('node:os')
```
---

### Q35. What is the difference between `module.exports` and `exports`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`exports` is a reference to `module.exports`. Adding properties to `exports` works, but reassigning `exports = ...` breaks the link — only `module.exports` is actually returned by `require`.

#### Code Example
```js
exports.a = 1            // works
module.exports = { a: 1 } // works
exports = { a: 1 }        // does NOT export
```
---

### Q36. How does `require` resolve a module?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
`require` checks: core modules, then relative/absolute paths (with `.js`, `.json`, `.node` extensions and `index` files), then walks up `node_modules` folders. Resolved modules are cached so subsequent calls return the same instance.

#### Code Example
```js
require('fs')        // core
require('./util')    // relative -> ./util.js or ./util/index.js
require('express')   // node_modules
```
---

### Q37. What is the module cache?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
Node caches modules after first load in `require.cache`, keyed by resolved path. Repeated `require` returns the same exported object (a singleton). Deleting the cache entry forces a reload.

#### Code Example
```js
delete require.cache[require.resolve('./config')]
const fresh = require('./config')
```
---

### Q38. What is a circular dependency and how does Node handle it?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
A circular dependency is when module A requires B and B requires A. Node returns a partially-completed `exports` object to break the cycle, so one side may see an incomplete export. Refactor shared code into a third module to avoid subtle bugs.

#### Code Example
```js
// a.js
exports.done = false
const b = require('./b') // b sees a.done === false here
exports.done = true
```
---

### Q39. What is the difference between `require` and `import`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`require` (CJS) is synchronous, dynamic, and can be called anywhere. `import` (ESM) is static, hoisted, asynchronously resolved, and normally must be top-level (dynamic `import()` returns a Promise). ESM enables tree-shaking.

#### Code Example
```js
const mod = await import('./mod.js') // dynamic ESM
```
---

### Q40. What are Worker Threads?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
The `worker_threads` module runs JavaScript in parallel OS threads with their own event loop and V8 instance. They are ideal for CPU-bound work, communicating via message passing or `SharedArrayBuffer`.

#### Code Example
```js
const { Worker } = require('node:worker_threads')
new Worker('./heavy.js').on('message', console.log)
```
---

### Q41. When would you use Worker Threads vs Child Processes vs Cluster?
**Difficulty:** `Experienced`
**Category:** Node.js Fundamentals

#### Answer
Worker Threads: CPU-bound JS with shared memory, low overhead. Child Processes: run separate programs/scripts with isolated memory. Cluster: fork multiple Node processes sharing a server port to use all CPU cores for I/O-bound servers.

#### Code Example
```js
// Cluster for scaling an HTTP server across cores
const cluster = require('node:cluster')
if (cluster.isPrimary) cluster.fork()
```
---

### Q42. What is the difference between blocking and non-blocking code in practice?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
Blocking calls halt the thread until done, serializing all work; non-blocking calls return control immediately. In a server, one blocking call (e.g., `JSON.parse` of a huge string or `*Sync` I/O) delays every pending request.

#### Code Example
```js
// non-blocking preferred in request handlers
await fs.promises.readFile('big.json')
```
---

### Q43. What is `process.hrtime()` / `performance.now()` used for?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
Both give high-resolution timing for benchmarking. `process.hrtime.bigint()` returns nanoseconds as a BigInt; `perf_hooks.performance.now()` returns fractional milliseconds. Use them instead of `Date.now()` for precise measurements.

#### Code Example
```js
const s = process.hrtime.bigint()
work()
console.log(Number(process.hrtime.bigint() - s) / 1e6, 'ms')
```
---

### Q44. How do you handle uncaught exceptions?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
Listen to `process.on('uncaughtException')` and `process.on('unhandledRejection')` to log and then gracefully shut down. These are last-resort handlers — the process is in an undefined state, so restart rather than continue.

#### Code Example
```js
process.on('uncaughtException', err => { console.error(err); process.exit(1) })
```
---

### Q45. What is the difference between `process.on('exit')` and `process.on('beforeExit')`?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
`beforeExit` fires when the event loop empties and can schedule more async work (won't fire on explicit `process.exit()`). `exit` fires just before the process terminates and only allows synchronous work.

#### Code Example
```js
process.on('exit', code => console.log('exiting', code)) // sync only
```
---

### Q46. What are signals like SIGINT and SIGTERM?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
OS signals notify a process of events: `SIGINT` (Ctrl+C), `SIGTERM` (graceful stop, e.g. from orchestrators). Handling them enables graceful shutdown — closing servers and DB connections before exiting.

#### Code Example
```js
process.on('SIGTERM', async () => { await server.close(); process.exit(0) })
```
---

### Q47. What is graceful shutdown and why does it matter?
**Difficulty:** `Experienced`
**Category:** Node.js Fundamentals

#### Answer
Graceful shutdown stops accepting new requests, finishes in-flight requests, closes DB/socket connections, then exits. It prevents dropped requests and data corruption during deploys or autoscaling.

#### Code Example
```js
process.on('SIGTERM', () => {
  server.close(() => { db.end(); process.exit(0) })
})
```
---

### Q48. How does garbage collection work in Node/V8?
**Difficulty:** `Experienced`
**Category:** Node.js Fundamentals

#### Answer
V8 uses a generational, mark-and-sweep collector. New objects live in the "young generation" (scavenged frequently); survivors are promoted to the "old generation" (collected less often). GC pauses the JS thread briefly ("stop-the-world").

#### Code Example
```js
// run node --expose-gc to call global.gc() manually in tests
if (global.gc) global.gc()
```
---

### Q49. What is a memory leak in Node and how do you detect it?
**Difficulty:** `Experienced`
**Category:** Node.js Fundamentals

#### Answer
A leak is memory that is retained but never released — common causes are unbounded caches, forgotten timers, and lingering event listeners. Detect via heap snapshots (`--inspect` + Chrome DevTools), `process.memoryUsage()`, or tools like clinic.js.

#### Code Example
```js
console.log(process.memoryUsage().heapUsed / 1e6, 'MB')
```
---

### Q50. What is the maximum heap size in Node and how do you change it?
**Difficulty:** `Experienced`
**Category:** Node.js Fundamentals

#### Answer
V8 caps the old-space heap (historically ~1.5–2GB on 64-bit). Raise it with `--max-old-space-size=<MB>`. If you routinely need more, reconsider the design (streaming, pagination) rather than just enlarging the heap.

#### Code Example
```js
$ node --max-old-space-size=4096 app.js
```
---

### Q51. What is the difference between `Buffer.alloc` and `Buffer.allocUnsafe`?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
`Buffer.alloc(n)` returns a zero-filled buffer (safe). `Buffer.allocUnsafe(n)` is faster but may contain old memory contents, which can leak sensitive data if not fully overwritten. Prefer `alloc` unless you immediately fill the buffer.

#### Code Example
```js
const safe = Buffer.alloc(8)        // 00 00 00 00 00 00 00 00
const fast = Buffer.allocUnsafe(8)  // uninitialized bytes
```
---

### Q52. What is the difference between `path.join` and `path.resolve`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`path.join` concatenates segments and normalizes separators. `path.resolve` builds an absolute path by processing segments right-to-left until an absolute path is formed, defaulting to `cwd`. Use them instead of manual string concat for cross-platform safety.

#### Code Example
```js
path.join('a', 'b', '..', 'c')     // 'a/c'
path.resolve('a', '/b', 'c')        // '/b/c'
```
---

### Q53. What is the `util` module used for?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`util` provides helpers: `util.promisify` (callback→Promise), `util.inspect` (deep object formatting), `util.types` (type checks), and `util.format`. It bridges legacy callback APIs to Promises.

#### Code Example
```js
const readFile = require('util').promisify(require('fs').readFile)
await readFile('a.txt')
```
---

### Q54. What does `util.promisify` do?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
It converts an error-first callback function into one that returns a Promise, letting you use `async/await` with legacy APIs.

#### Code Example
```js
const { promisify } = require('util')
const sleep = promisify(setTimeout)
await sleep(1000)
```
---

### Q55. What is the difference between `dependencies` and `devDependencies`?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`dependencies` are needed at runtime (e.g. express). `devDependencies` are only needed during development/build (e.g. jest, eslint, webpack). `npm install --production` skips devDependencies.

#### Code Example
```js
npm install express            // dependencies
npm install --save-dev jest    // devDependencies
```
---

### Q56. What is semantic versioning (semver)?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
Semver is `MAJOR.MINOR.PATCH`: MAJOR for breaking changes, MINOR for backward-compatible features, PATCH for backward-compatible fixes. Ranges: `^1.2.3` allows minor/patch, `~1.2.3` allows patch only.

#### Code Example
```js
"express": "^4.19.0"  // >=4.19.0 <5.0.0
```
---

### Q57. What is `package-lock.json`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`package-lock.json` records the exact resolved version and integrity hash of every installed package (including transitive deps), ensuring reproducible installs across machines and CI. Commit it to source control.

#### Code Example
```js
npm ci  // installs strictly from the lock file
```
---

### Q58. What is the difference between `npm install` and `npm ci`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`npm install` resolves versions and may update the lock file. `npm ci` does a clean, exact install from `package-lock.json` (deletes `node_modules` first), is faster, and is meant for CI/production reproducibility.

#### Code Example
```js
npm ci --omit=dev
```
---

### Q59. What are npm scripts?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Scripts in `package.json` under `"scripts"` are command shortcuts run with `npm run <name>`. `start`, `test`, `stop`, and `restart` can be run without `run`. They can chain via `pre`/`post` hooks.

#### Code Example
```js
"scripts": { "build": "tsc", "prebuild": "rimraf dist" }
```
---

### Q60. What is `npx`?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`npx` runs a package binary without globally installing it, downloading it temporarily if needed. It is handy for one-off tools like scaffolders (`npx create-react-app`).

#### Code Example
```js
npx cowsay "Hello"
```
---

### Q61. What is the difference between local and global npm installs?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
Local installs (`npm install pkg`) go into the project's `node_modules` and are used by that project. Global installs (`-g`) place binaries on the system PATH for CLI use across projects but should be avoided for project dependencies.

#### Code Example
```js
npm install -g nodemon   // CLI available everywhere
```
---

### Q62. What is `engines` in package.json?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
The `engines` field declares which Node/npm versions your package supports. With `engine-strict`, npm errors on incompatible versions, preventing subtle runtime bugs.

#### Code Example
```js
"engines": { "node": ">=18.0.0" }
```
---

### Q63. What are peerDependencies?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
`peerDependencies` declare a package that the host project must provide (e.g. a React plugin needing React). It avoids duplicate/incompatible copies of a shared library. npm 7+ auto-installs them by default.

#### Code Example
```js
"peerDependencies": { "react": ">=17" }
```
---

### Q64. How do you create a custom global module/binary?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
Add a `bin` field pointing to an executable script with a shebang, then install globally or link. This is how CLI tools expose commands.

#### Code Example
```js
// package.json
"bin": { "mytool": "./cli.js" }
// cli.js first line
#!/usr/bin/env node
```
---

### Q65. How does Node handle unhandled promise rejections?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
Since Node 15, an unhandled rejection terminates the process by default (previously a warning). Always attach `.catch` or wrap `await` in try/catch, and add a global `unhandledRejection` handler as a safety net.

#### Code Example
```js
process.on('unhandledRejection', reason => console.error(reason))
```
---

### Q66. What is the `os` module?
**Difficulty:** `Basic`
**Category:** Node.js Fundamentals

#### Answer
`os` exposes operating-system info: CPU count, memory, platform, hostname, network interfaces, and `os.tmpdir()`. It is often used to size worker/cluster pools.

#### Code Example
```js
const os = require('node:os')
console.log(os.cpus().length, 'cores')
```
---

### Q67. What is the difference between `fs.readFile` and `fs.createReadStream`?
**Difficulty:** `Advanced`
**Category:** Node.js Fundamentals

#### Answer
`readFile` loads the entire file into memory before the callback fires — simple but memory-heavy for large files. `createReadStream` reads in chunks, letting you process data incrementally with low, constant memory.

#### Code Example
```js
fs.createReadStream('big.log').pipe(res) // stream to client
```
---

### Q68. What is the purpose of `Buffer.concat`?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`Buffer.concat(list)` joins an array of buffers into one, commonly used to assemble chunks collected from a stream into a complete payload.

#### Code Example
```js
const chunks = []
req.on('data', c => chunks.push(c))
req.on('end', () => console.log(Buffer.concat(chunks).toString()))
```
---

### Q69. What is the difference between `null` and `undefined` handling in Node config?
**Difficulty:** `Intermediate`
**Category:** Node.js Fundamentals

#### Answer
`process.env` values are always strings or `undefined` (never `null`). Comparisons and defaults should account for `undefined`; use `??` for nullish fallback and explicit parsing for numbers/booleans.

#### Code Example
```js
const port = Number(process.env.PORT ?? 3000)
const debug = process.env.DEBUG === 'true'
```
---

### Q70. How do you profile CPU usage of a Node application?
**Difficulty:** `Experienced`
**Category:** Node.js Fundamentals

#### Answer
Use `node --prof` to generate a V8 log then `node --prof-process`, or `--inspect` with Chrome DevTools CPU profiler, or tools like `clinic flame` / `0x` for flame graphs. Profiling reveals hot functions and blocking code.

#### Code Example
```js
$ node --prof app.js
$ node --prof-process isolate-*.log > profile.txt
```
---
