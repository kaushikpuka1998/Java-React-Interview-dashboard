# Streams, Buffers & Events Interview Questions (Q1 – Q70)

---

### Q1. What is a stream in Node.js?
**Difficulty:** `Basic`
**Category:** Streams, Buffers & Events

#### Answer
A stream is an abstraction for reading or writing data piece by piece (chunks) instead of all at once. It enables processing large data with constant, low memory and supports composition via piping.

#### Code Example
```js
fs.createReadStream('big.txt').pipe(process.stdout)
```
---

### Q2. What are the four types of streams?
**Difficulty:** `Basic`
**Category:** Streams, Buffers & Events

#### Answer
Readable (source, e.g. file read), Writable (sink, e.g. file write), Duplex (both, e.g. TCP socket), and Transform (duplex that modifies data, e.g. gzip).

#### Code Example
```js
const gzip = require('zlib').createGzip() // Transform stream
```
---

### Q3. What is the advantage of streams over reading a whole file?
**Difficulty:** `Basic`
**Category:** Streams, Buffers & Events

#### Answer
Streams use constant memory regardless of file size and start producing output immediately (lower latency), whereas buffering the whole file consumes memory proportional to its size and delays processing until fully loaded.

#### Code Example
```js
fs.createReadStream('10gb.log').pipe(res) // won't blow up memory
```
---

### Q4. What is `pipe()`?
**Difficulty:** `Basic`
**Category:** Streams, Buffers & Events

#### Answer
`pipe()` connects a readable stream to a writable one, automatically forwarding data and handling backpressure. It returns the destination so pipes can be chained.

#### Code Example
```js
readable.pipe(transform).pipe(writable)
```
---

### Q5. What is backpressure in streams?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
Backpressure occurs when a writable can't consume data as fast as a readable produces it. `write()` returns `false` when its buffer is full; the readable should pause until the `drain` event. `pipe` handles this automatically.

#### Code Example
```js
if (!dest.write(chunk)) src.pause()
dest.on('drain', () => src.resume())
```
---

### Q6. What are flowing and paused modes of readable streams?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
In flowing mode data is pushed via `data` events as fast as possible; in paused mode you pull via `read()`. Adding a `data` listener or calling `pipe`/`resume` switches to flowing; `pause()` switches back.

#### Code Example
```js
stream.on('data', chunk => {}) // flowing mode
```
---

### Q7. What is `highWaterMark`?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`highWaterMark` is the internal buffer size threshold (bytes for binary, count for object mode). It controls when a stream signals backpressure and how much it buffers before pausing the source.

#### Code Example
```js
fs.createReadStream('f', { highWaterMark: 64 * 1024 }) // 64KB chunks
```
---

### Q8. What is object mode in streams?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
By default streams handle strings/Buffers. In object mode (`objectMode: true`) they can push/consume arbitrary JS objects, useful for record pipelines (e.g. DB rows, parsed CSV lines).

#### Code Example
```js
new Readable({ objectMode: true, read() { this.push({ id: 1 }) } })
```
---

### Q9. How do you create a custom Readable stream?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Extend `Readable` (or pass options to its constructor) and implement `_read()`, calling `this.push(chunk)` to emit data and `this.push(null)` to signal EOF.

#### Code Example
```js
const { Readable } = require('stream')
const r = new Readable({ read() { this.push('hi'); this.push(null) } })
```
---

### Q10. How do you create a custom Writable stream?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Implement `_write(chunk, encoding, callback)`, doing the work and calling `callback()` when ready for more (or with an error). The callback drives backpressure.

#### Code Example
```js
const { Writable } = require('stream')
new Writable({ write(chunk, enc, cb) { console.log(chunk.toString()); cb() } })
```
---

### Q11. How do you create a Transform stream?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Implement `_transform(chunk, enc, callback)` to process input and `push` output, calling `callback` when done. Optionally `_flush` for trailing data.

#### Code Example
```js
const { Transform } = require('stream')
new Transform({ transform(c, e, cb) { cb(null, c.toString().toUpperCase()) } })
```
---

### Q12. What is `stream.pipeline()` and why prefer it over `pipe`?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
`pipeline` chains streams and propagates errors and cleanup automatically; plain `pipe` does not forward errors or destroy streams on failure, risking leaks. Always use `pipeline` for multi-stage pipes.

#### Code Example
```js
const { pipeline } = require('stream/promises')
await pipeline(fs.createReadStream('a'), gzip, fs.createWriteStream('a.gz'))
```
---

### Q13. Why is error handling important with `pipe`?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`pipe` doesn't destroy the source when the destination errors (or vice versa), leaking file descriptors/memory. You must attach `error` handlers on every stream, or use `pipeline` which handles it.

#### Code Example
```js
src.on('error', onErr); dest.on('error', onErr) // or use pipeline
```
---

### Q14. How do you convert a stream to a string/buffer?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
Collect chunks and concatenate, or use the helper `stream/consumers` (`text`, `buffer`, `json`) in modern Node.

#### Code Example
```js
const { text } = require('stream/consumers')
const body = await text(req)
```
---

### Q15. What is the difference between `stream.Readable.from()` and manual streams?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`Readable.from(iterable)` builds a readable stream from any (async) iterable/generator without implementing `_read`, greatly simplifying custom sources.

#### Code Example
```js
const r = Readable.from(async function* () { yield 'a'; yield 'b' }())
```
---

### Q16. What is a Buffer and how is it different from an array?
**Difficulty:** `Basic`
**Category:** Streams, Buffers & Events

#### Answer
A Buffer is a fixed-size raw memory region for bytes, stored outside the V8 heap. Unlike arrays it can't grow, holds only 0–255 byte values, and is optimized for binary/encoding operations.

#### Code Example
```js
const b = Buffer.from([104, 105])
console.log(b.toString()) // 'hi'
```
---

### Q17. How do you convert between Buffers and strings with encodings?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
`Buffer.from(str, encoding)` encodes; `buf.toString(encoding)` decodes. Supported encodings include `utf8`, `hex`, `base64`, `ascii`, `latin1`.

#### Code Example
```js
Buffer.from('hi').toString('base64') // 'aGk='
Buffer.from('aGk=', 'base64').toString() // 'hi'
```
---

### Q18. What is the risk of `Buffer.allocUnsafe`?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
It returns uninitialized memory that may contain old data (including secrets from prior allocations). It's faster but must be fully overwritten before use or exposure. Prefer `Buffer.alloc` when in doubt.

#### Code Example
```js
const b = Buffer.allocUnsafe(16); b.fill(0) // sanitize before use
```
---

### Q19. How do you handle a chunk split across multi-byte characters?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
A UTF-8 character may straddle two chunks; decoding each chunk independently corrupts it. Use `string_decoder.StringDecoder`, which buffers incomplete multi-byte sequences until complete.

#### Code Example
```js
const dec = new (require('string_decoder').StringDecoder)('utf8')
stream.on('data', c => output += dec.write(c))
```
---

### Q20. What is `Buffer.byteLength` vs `String.length`?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
`String.length` counts UTF-16 code units; `Buffer.byteLength(str)` counts actual bytes in a given encoding. They differ for non-ASCII text — important for Content-Length headers.

#### Code Example
```js
'é'.length              // 1
Buffer.byteLength('é')  // 2 (UTF-8)
```
---

### Q21. What is the EventEmitter?
**Difficulty:** `Basic`
**Category:** Streams, Buffers & Events

#### Answer
`EventEmitter` is the core class for the observer pattern in Node. Objects emit named events and listeners subscribe via `on`. Streams, servers, and many core APIs are EventEmitters.

#### Code Example
```js
const e = new (require('events'))()
e.on('greet', name => console.log('Hi ' + name))
e.emit('greet', 'Ada')
```
---

### Q22. What is the difference between `on` and `once`?
**Difficulty:** `Basic`
**Category:** Streams, Buffers & Events

#### Answer
`on` registers a listener that fires every time the event is emitted; `once` fires only the first time then auto-removes itself.

#### Code Example
```js
server.once('listening', () => console.log('ready')) // one-time
```
---

### Q23. How do you remove event listeners?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
Use `removeListener(event, fn)`/`off` with the same function reference, or `removeAllListeners(event)`. You must keep a reference to the original function to remove it.

#### Code Example
```js
const fn = () => {}
e.on('x', fn); e.off('x', fn)
```
---

### Q24. What is the max listeners warning?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
By default an emitter warns after 10 listeners for one event (a leak heuristic). Genuine cases can raise it with `setMaxListeners(n)`; unexpected growth usually signals a listener leak.

#### Code Example
```js
emitter.setMaxListeners(20)
```
---

### Q25. What is an EventEmitter memory leak?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Repeatedly adding listeners without removing them (e.g. per request) accumulates them, retaining closures/memory and eventually degrading performance. Fix by using `once`, removing listeners, or `AbortSignal`.

#### Code Example
```js
emitter.on('data', handler, { signal: controller.signal }) // auto-cleanup
```
---

### Q26. How do you emit an error event correctly?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Emit `'error'` with an `Error` object. If no listener is registered for `'error'`, Node throws and crashes the process — so always attach an error listener on emitters/streams.

#### Code Example
```js
emitter.on('error', e => log(e))
emitter.emit('error', new Error('boom'))
```
---

### Q27. What is the order of listener invocation?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
Listeners for an event run synchronously in registration order. `prependListener` adds to the front. Emitting is synchronous — all listeners run before `emit` returns.

#### Code Example
```js
e.on('x', () => console.log(1)); e.prependListener('x', () => console.log(0))
e.emit('x') // 0 then 1
```
---

### Q28. Is `emit` synchronous or asynchronous?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`emit` is synchronous: it calls listeners immediately and in order. To defer, wrap listener bodies in `setImmediate`/`queueMicrotask`. This sync nature can surprise developers expecting async behavior.

#### Code Example
```js
e.emit('x'); console.log('after') // all 'x' listeners ran before 'after'
```
---

### Q29. How do you wait for an event as a Promise?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Use `events.once(emitter, name)` which returns a Promise resolving with the event args, or `events.on` for an async iterator of events.

#### Code Example
```js
const { once } = require('events')
const [data] = await once(stream, 'data')
```
---

### Q30. How do you iterate events with `for await`?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
`events.on(emitter, name)` returns an async iterator yielding event arguments, letting you consume a stream of events sequentially with backpressure.

#### Code Example
```js
for await (const [msg] of events.on(socket, 'message')) handle(msg)
```
---

### Q31. What is the `close` event on a stream?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
`close` fires when a stream and its underlying resource (file descriptor) are fully closed. `end` (readable) or `finish` (writable) fire earlier when data is done but before resources are released.

#### Code Example
```js
ws.on('finish', () => console.log('data flushed'))
ws.on('close', () => console.log('fd closed'))
```
---

### Q32. What is the difference between `end` and `finish` events?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`end` fires on a readable when there is no more data to consume. `finish` fires on a writable after `end()` is called and all data is flushed to the underlying system.

#### Code Example
```js
readable.on('end', () => {})
writable.on('finish', () => {})
```
---

### Q33. How do you handle large file uploads with streams?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Pipe the incoming request stream directly to disk or storage instead of buffering it in memory, using `pipeline` for error handling and enforcing size limits to avoid abuse.

#### Code Example
```js
await pipeline(req, fs.createWriteStream('/uploads/file'))
```
---

### Q34. How do you compress data on the fly with streams?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Insert a `zlib` transform (gzip/brotli) between source and destination in a pipeline, compressing chunk by chunk without loading the whole payload.

#### Code Example
```js
await pipeline(fs.createReadStream('a'), zlib.createBrotliCompress(), fs.createWriteStream('a.br'))
```
---

### Q35. What is `stream.finished()`?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`stream.finished(stream, cb)` invokes the callback when a stream is no longer readable/writable or errors, giving a reliable single completion signal across stream types.

#### Code Example
```js
const { finished } = require('stream/promises')
await finished(readable)
```
---

### Q36. How do you tee/duplicate a stream to two destinations?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Use `stream.PassThrough` or pipe the source to multiple writables (via `pipe` twice or a fan-out transform). Note both destinations share backpressure — the slowest paces the source.

#### Code Example
```js
const pass = new PassThrough()
src.pipe(pass); pass.pipe(fileA); pass.pipe(fileB)
```
---

### Q37. What is a PassThrough stream?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`PassThrough` is a trivial Transform that forwards input unchanged. It is handy as a placeholder, for measuring throughput, or for connecting/adapting pipelines.

#### Code Example
```js
const pt = new (require('stream').PassThrough)()
```
---

### Q38. How do you measure throughput of a stream?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Insert a Transform (or PassThrough with a `data` listener) that counts bytes over time to compute bytes/sec, then forwards chunks unchanged.

#### Code Example
```js
let bytes = 0
stream.on('data', c => bytes += c.length)
```
---

### Q39. What is the difference between `write()` returning true/false?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`write()` returns `true` if the chunk fit in the buffer (keep writing) and `false` if the buffer exceeded `highWaterMark` (stop and wait for `drain`). Ignoring `false` causes unbounded memory growth.

#### Code Example
```js
if (!ws.write(chunk)) await once(ws, 'drain')
```
---

### Q40. How do you convert an async generator into a readable stream?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Pass the async generator to `Readable.from`, which pulls values on demand and applies backpressure automatically.

#### Code Example
```js
const stream = Readable.from(rowsGenerator())
stream.pipe(res)
```
---

### Q41. What is the `data`, `end`, `error` lifecycle of a readable?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
`data` fires for each chunk (flowing mode), `end` when all data is consumed, and `error` on failure. Always handle `error`; missing it can crash the process.

#### Code Example
```js
r.on('data', d => {}).on('end', () => {}).on('error', e => {})
```
---

### Q42. How do you enforce a max size when buffering a stream?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Track accumulated bytes as chunks arrive and destroy the stream with an error once a limit is exceeded, preventing memory-exhaustion attacks (e.g. huge request bodies).

#### Code Example
```js
let size = 0
req.on('data', c => { size += c.length; if (size > MAX) req.destroy(new Error('too large')) })
```
---

### Q43. What is the difference between Duplex and Transform streams?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
A Duplex has independent readable and writable sides (e.g. a socket: what you read isn't what you write). A Transform's output is a function of its input (e.g. compression) — the two sides are linked.

#### Code Example
```js
// TCP socket = Duplex; zlib.createGzip() = Transform
```
---

### Q44. How do you gracefully destroy a stream?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Call `stream.destroy(err?)` to close it and release resources, optionally emitting an error. It stops further reads/writes and triggers cleanup. Prefer this over leaving streams open.

#### Code Example
```js
readable.destroy() // release fd, stop emitting
```
---

### Q45. What is the `readableEnded` / `writableFinished` property?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
These booleans report whether the stream has finished reading/writing, useful for state checks without relying solely on events.

#### Code Example
```js
if (ws.writableFinished) console.log('all written')
```
---

### Q46. How do you pipe with transformation and error handling in one call?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Use the promise-based `pipeline` with all stages; it awaits completion and rejects on any stage error, cleaning up every stream.

#### Code Example
```js
await pipeline(source, decompress, parse, writeToDb)
```
---

### Q47. What is chunked transfer and how do streams relate?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
HTTP chunked transfer sends a response in pieces without a known total length. Node streams map naturally onto this: piping a readable to the response emits chunks with `Transfer-Encoding: chunked`.

#### Code Example
```js
fs.createReadStream('video.mp4').pipe(res) // chunked automatically
```
---

### Q48. How do you implement range requests (partial content) with streams?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Parse the `Range` header, respond with 206 and `Content-Range`, and stream only the requested byte range via `createReadStream(path, { start, end })`.

#### Code Example
```js
fs.createReadStream(file, { start, end }).pipe(res.writeHead(206, headers))
```
---

### Q49. What is the `cork`/`uncork` mechanism?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
`cork()` buffers multiple `write()` calls and flushes them together on `uncork()`, reducing syscalls when writing many small chunks — a batching optimization.

#### Code Example
```js
socket.cork(); socket.write('a'); socket.write('b'); socket.uncork()
```
---

### Q50. How do you compose reusable stream transforms?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Build small Transform factories and combine them in a `pipeline`, or use `stream.compose()` (modern Node) to merge several into one reusable stream.

#### Code Example
```js
const combined = compose(parseJson, validate, enrich)
await pipeline(source, combined, sink)
```
---

### Q51. What is the difference between `Buffer.copy` and `Buffer.slice`?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
`slice`/`subarray` returns a view sharing the same memory (mutations affect the original). `copy` writes bytes into a separate target buffer (independent memory). Choose based on whether you need isolation.

#### Code Example
```js
const view = buf.subarray(0, 4) // shares memory
buf.copy(target)                 // independent copy
```
---

### Q52. How do you read a binary file structure with Buffers?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Use typed read methods (`readUInt32BE`, `readInt16LE`, etc.) at byte offsets to parse headers/fields, respecting endianness.

#### Code Example
```js
const magic = buf.readUInt32BE(0)
const width = buf.readUInt16LE(4)
```
---

### Q53. What is endianness and why does it matter for Buffers?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Endianness is byte order for multi-byte numbers: big-endian (most significant first) vs little-endian. Reading with the wrong order yields garbage, so binary protocols specify it and you use the matching `BE`/`LE` methods.

#### Code Example
```js
buf.readUInt16BE(0) // big-endian
buf.readUInt16LE(0) // little-endian
```
---

### Q54. How do you handle newline-delimited data from a stream?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Use `readline.createInterface` over the stream, or a Transform that buffers until it sees `\n`, emitting complete lines. Naive chunk splitting breaks lines that span chunks.

#### Code Example
```js
const rl = readline.createInterface({ input: fs.createReadStream('log') })
for await (const line of rl) process(line)
```
---

### Q55. What is `readline` used for besides input?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
`readline` reads any readable line by line (files, sockets), supports async iteration, and offers interactive prompts/history for CLIs.

#### Code Example
```js
for await (const line of readline.createInterface({ input: stream })) {}
```
---

### Q56. How do you signal end-of-stream from a custom readable?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Call `this.push(null)` to indicate no more data; consumers then receive the `end` event. Failing to push null leaves consumers hanging.

#### Code Example
```js
read() { if (done) this.push(null); else this.push(nextChunk()) }
```
---

### Q57. What causes "write after end" errors?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Calling `write()` on a writable after `end()` has been called throws/emits an error. It usually indicates a logic bug where writes race with stream termination.

#### Code Example
```js
ws.end('last'); ws.write('oops') // Error: write after end
```
---

### Q58. How do you throttle a stream's rate?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Insert a Transform that delays chunk passthrough (using timers) to cap bytes/sec, applying backpressure to the source. Useful for bandwidth limiting.

#### Code Example
```js
new Transform({ transform(c, e, cb) { setTimeout(() => cb(null, c), delay) } })
```
---

### Q59. What is the relationship between HTTP req/res and streams?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
`req` (IncomingMessage) is a Readable stream of the request body; `res` (ServerResponse) is a Writable stream for the response. This is why you can pipe files directly to `res`.

#### Code Example
```js
req.pipe(fs.createWriteStream('body.txt'))
```
---

### Q60. How do you handle stream errors in an Express route?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Attach an `error` handler (or use `pipeline`) and forward to Express's error middleware via `next(err)`; also ensure the response is ended/destroyed to avoid hanging connections.

#### Code Example
```js
pipeline(readStream, res, err => { if (err) next(err) })
```
---

### Q61. What is `Symbol.asyncIterator` on streams?
**Difficulty:** `Advanced`
**Category:** Streams, Buffers & Events

#### Answer
Readable streams implement `Symbol.asyncIterator`, so `for await (const chunk of stream)` works out of the box, consuming chunks with backpressure and stopping on `end`/`error`.

#### Code Example
```js
for await (const chunk of fs.createReadStream('f')) total += chunk.length
```
---

### Q62. How do Web Streams differ from Node streams?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Web Streams (`ReadableStream`/`WritableStream`) are the WHATWG standard also available in Node for cross-platform code (e.g. `fetch` bodies). Node provides adapters (`Readable.fromWeb`/`toWeb`) to interoperate.

#### Code Example
```js
const nodeStream = require('stream').Readable.fromWeb(webReadable)
```
---

### Q63. How do you avoid loading a whole JSON array into memory?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Use a streaming JSON parser (e.g. a Transform that emits each array element) so you process records incrementally instead of `JSON.parse` on the entire file.

#### Code Example
```js
pipeline(fs.createReadStream('big.json'), streamArrayParser(), handleEach)
```
---

### Q64. What is the difference between `pause()`/`resume()` and `cork()`/`uncork()`?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
`pause`/`resume` control a readable's flow (whether it emits data). `cork`/`uncork` batch writes on a writable to reduce syscalls. Different sides, different purposes.

#### Code Example
```js
readable.pause() // stop reading
writable.cork()  // batch writes
```
---

### Q65. How do you propagate an abort into a stream pipeline?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Pass an `AbortSignal` to `pipeline`'s options; aborting destroys all streams and rejects the pipeline, enabling cancellable transfers.

#### Code Example
```js
await pipeline(src, dst, { signal: controller.signal })
```
---

### Q66. What are common causes of stream memory leaks?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Ignoring backpressure, not destroying streams on error, unbounded internal buffering (object mode without highWaterMark), and accumulating chunks in arrays. Use `pipeline` and honor `write()`'s return value.

#### Code Example
```js
// leak: chunks.push(c) forever without consuming
```
---

### Q67. How do you implement a rate-limited log writer with streams?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Write to a writable file stream and rely on backpressure; batch with `cork`/`uncork` and rotate files by size/time to bound disk usage.

#### Code Example
```js
logStream.cork(); for (const l of batch) logStream.write(l + '\n'); logStream.uncork()
```
---

### Q68. What is the difference between `Buffer.from(string)` and `Buffer.from(array)`?
**Difficulty:** `Intermediate`
**Category:** Streams, Buffers & Events

#### Answer
`Buffer.from(string, enc)` encodes text into bytes. `Buffer.from(array)` treats each element as a byte value (0–255). They produce different bytes for the same-looking input.

#### Code Example
```js
Buffer.from('123')          // <Buffer 31 32 33>
Buffer.from([1, 2, 3])      // <Buffer 01 02 03>
```
---

### Q69. How do you detect the end of an EventEmitter-based protocol?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
Listen for the protocol's terminal event (`end`, `close`, or a custom `done`), and guard against emitting after termination. Combine with timeouts to detect stalled peers.

#### Code Example
```js
socket.on('end', cleanup); socket.on('close', cleanup)
```
---

### Q70. When should you NOT use streams?
**Difficulty:** `Experienced`
**Category:** Streams, Buffers & Events

#### Answer
For small payloads that fit comfortably in memory, streams add complexity and overhead for little benefit — just buffer and process directly. Use streams when data is large, unbounded, or benefits from incremental/low-latency processing.

#### Code Example
```js
const cfg = JSON.parse(await fs.promises.readFile('config.json')) // fine, small
```
---
