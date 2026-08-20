# HTTP & Networking Interview Questions (Q1 – Q70)

---

### Q1. How do you create an HTTP server in Node?
**Difficulty:** `Basic`
**Category:** HTTP & Networking

#### Answer
Use the `http` module's `createServer`, passing a handler `(req, res)`, then call `listen(port)`. `req` is a readable stream, `res` is a writable stream.

#### Code Example
```js
require('http').createServer((req, res) => res.end('Hello')).listen(3000)
```
---

### Q2. What are `req` and `res` in an HTTP handler?
**Difficulty:** `Basic`
**Category:** HTTP & Networking

#### Answer
`req` is an `IncomingMessage` (readable stream) with method, url, and headers. `res` is a `ServerResponse` (writable stream) used to set status/headers and send the body.

#### Code Example
```js
(req, res) => { console.log(req.method, req.url); res.end() }
```
---

### Q3. How do you read the request body?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
The body arrives as stream chunks. Collect `data` events into buffers and concatenate on `end`, then parse. Frameworks/`body-parser` do this for you with size limits.

#### Code Example
```js
const chunks = []
req.on('data', c => chunks.push(c)).on('end', () => {
  const body = Buffer.concat(chunks).toString()
})
```
---

### Q4. How do you send a JSON response?
**Difficulty:** `Basic`
**Category:** HTTP & Networking

#### Answer
Set `Content-Type: application/json`, then write `JSON.stringify(data)`. Set an appropriate status code first.

#### Code Example
```js
res.writeHead(200, { 'Content-Type': 'application/json' })
res.end(JSON.stringify({ ok: true }))
```
---

### Q5. What are HTTP status codes and their categories?
**Difficulty:** `Basic`
**Category:** HTTP & Networking

#### Answer
1xx informational, 2xx success (200 OK, 201 Created), 3xx redirect (301, 304), 4xx client error (400, 401, 403, 404), 5xx server error (500, 503). Use them accurately so clients/caches behave correctly.

#### Code Example
```js
res.statusCode = 404; res.end('Not Found')
```
---

### Q6. What is the difference between 401 and 403?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
401 Unauthorized means authentication is missing/invalid (who are you?). 403 Forbidden means you're authenticated but lack permission (you can't do this). 

#### Code Example
```js
if (!user) return res.status(401).end()
if (!user.isAdmin) return res.status(403).end()
```
---

### Q7. How do you set response headers?
**Difficulty:** `Basic`
**Category:** HTTP & Networking

#### Answer
Use `res.setHeader(name, value)` before sending the body, or pass a headers object to `res.writeHead`. Headers can't change after the first byte of the body is written.

#### Code Example
```js
res.setHeader('Cache-Control', 'no-store')
```
---

### Q8. How do you make an outbound HTTP request in Node?
**Difficulty:** `Basic`
**Category:** HTTP & Networking

#### Answer
Use the global `fetch` (built into modern Node), or the lower-level `http`/`https` modules, or libraries like `axios`/`undici`.

#### Code Example
```js
const data = await fetch('https://api.example.com').then(r => r.json())
```
---

### Q9. What is `undici`?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
`undici` is Node's modern, high-performance HTTP/1.1 client (the engine behind global `fetch`). It offers connection pooling, pipelining, and low overhead compared to the legacy `http` client.

#### Code Example
```js
import { request } from 'undici'
const { body } = await request('https://api.example.com')
```
---

### Q10. How do you handle query parameters?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
Parse the URL with the `URL`/`URLSearchParams` API. `req.url` is just a path+query string; construct a full URL to read `searchParams`.

#### Code Example
```js
const url = new URL(req.url, `http://${req.headers.host}`)
const page = url.searchParams.get('page')
```
---

### Q11. What is the `URL` and `URLSearchParams` API?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
The WHATWG `URL` class parses and builds URLs (protocol, host, pathname, search). `URLSearchParams` parses/serializes query strings and handles encoding, replacing the legacy `url.parse`/`querystring`.

#### Code Example
```js
const u = new URL('https://x.com/a?b=1&b=2')
u.searchParams.getAll('b') // ['1','2']
```
---

### Q12. How do you handle different HTTP methods without a framework?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
Branch on `req.method` and `req.url` in the handler. This is verbose, which is why routers/frameworks (Express) exist.

#### Code Example
```js
if (req.method === 'POST' && req.url === '/users') createUser(req, res)
```
---

### Q13. What is the difference between HTTP/1.1 and HTTP/2?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
HTTP/2 multiplexes many requests over one connection (no head-of-line blocking at HTTP level), compresses headers (HPACK), and supports server push. HTTP/1.1 uses one request per connection (or limited pipelining). Node's `http2` module supports it.

#### Code Example
```js
require('http2').createSecureServer(opts, handler).listen(443)
```
---

### Q14. What is keep-alive and why does it matter?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Keep-alive reuses a TCP connection for multiple requests, avoiding repeated handshake overhead and improving throughput/latency. Node clients should enable an agent with keep-alive for outbound calls.

#### Code Example
```js
const agent = new http.Agent({ keepAlive: true })
```
---

### Q15. What is an HTTP Agent and connection pooling?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
An Agent manages a pool of sockets for outbound requests, reusing connections (keep-alive) and limiting concurrency (`maxSockets`). Proper pooling prevents socket exhaustion under load.

#### Code Example
```js
new http.Agent({ keepAlive: true, maxSockets: 100 })
```
---

### Q16. How do you handle timeouts on HTTP requests?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Set a request/socket timeout so slow or dead peers don't hang forever. With `fetch`, use `AbortSignal.timeout`; with `http`, set `req.setTimeout` and handle the `timeout` event.

#### Code Example
```js
await fetch(url, { signal: AbortSignal.timeout(5000) })
```
---

### Q17. How do you set server-side timeouts to protect against slow clients?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Configure `server.requestTimeout`, `server.headersTimeout`, and `server.keepAliveTimeout` to bound how long clients can hold connections, mitigating slowloris-style attacks.

#### Code Example
```js
server.requestTimeout = 30000
server.headersTimeout = 10000
```
---

### Q18. What is a slowloris attack?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Slowloris opens many connections and sends headers/body extremely slowly, tying up server resources until it can't serve legitimate clients. Mitigate with header/request timeouts, connection limits, and a reverse proxy.

#### Code Example
```js
server.headersTimeout = 5000 // drop slow header senders
```
---

### Q19. How do you implement graceful shutdown of an HTTP server?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
On SIGTERM, call `server.close()` to stop accepting new connections and wait for in-flight requests to finish, then close DB connections and exit. Add a timeout to force-close lingering keep-alive sockets.

#### Code Example
```js
process.on('SIGTERM', () => server.close(() => process.exit(0)))
```
---

### Q20. What is CORS and how do you enable it?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
CORS (Cross-Origin Resource Sharing) lets a browser call an API on a different origin, controlled by `Access-Control-*` response headers. The server whitelists origins/methods/headers; preflight `OPTIONS` requests check permission first.

#### Code Example
```js
res.setHeader('Access-Control-Allow-Origin', 'https://app.com')
```
---

### Q21. What is a CORS preflight request?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
For "non-simple" requests (custom headers, methods like PUT/DELETE), the browser first sends an `OPTIONS` preflight asking whether the actual request is allowed. The server must respond with the appropriate `Access-Control-Allow-*` headers.

#### Code Example
```js
if (req.method === 'OPTIONS') { res.writeHead(204, corsHeaders).end() }
```
---

### Q22. How do you serve static files?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
Map the URL to a safe file path (guard against traversal), stream the file to `res` with the right `Content-Type`, and set caching headers. Express uses `express.static`.

#### Code Example
```js
app.use(express.static('public', { maxAge: '1d' }))
```
---

### Q23. How do you handle file downloads with correct headers?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Set `Content-Disposition: attachment; filename=...`, the correct `Content-Type`, and stream the file. `Content-Length` (if known) enables progress bars.

#### Code Example
```js
res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"')
fs.createReadStream(path).pipe(res)
```
---

### Q24. What is chunked transfer encoding?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
When the total body size is unknown, the server sends it in chunks with `Transfer-Encoding: chunked` and no `Content-Length`. Piping a stream to `res` uses this automatically.

#### Code Example
```js
stream.pipe(res) // Transfer-Encoding: chunked
```
---

### Q25. How do you implement Server-Sent Events (SSE)?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Respond with `Content-Type: text/event-stream`, keep the connection open, and write `data: ...\n\n` messages. SSE is a simple one-way server→client push over HTTP.

#### Code Example
```js
res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' })
setInterval(() => res.write(`data: ${Date.now()}\n\n`), 1000)
```
---

### Q26. What is the difference between SSE and WebSockets?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
SSE is one-way (server→client), text-only, over plain HTTP with auto-reconnect. WebSockets are full-duplex, binary-capable, over a dedicated upgraded connection. Use SSE for simple feeds, WebSockets for interactive/bidirectional apps.

#### Code Example
```js
// SSE: EventSource; WebSocket: bidirectional ws://
```
---

### Q27. How do WebSockets work in Node?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
A WebSocket starts as an HTTP `Upgrade` request, then switches to a persistent full-duplex TCP channel. Libraries like `ws` or `socket.io` handle the handshake and framing.

#### Code Example
```js
const wss = new (require('ws').Server)({ port: 8080 })
wss.on('connection', ws => ws.on('message', m => ws.send('echo ' + m)))
```
---

### Q28. What is the WebSocket handshake?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
The client sends an HTTP request with `Upgrade: websocket` and a `Sec-WebSocket-Key`; the server responds 101 Switching Protocols with a derived `Sec-WebSocket-Accept`. After that, both sides exchange WebSocket frames.

#### Code Example
```js
server.on('upgrade', (req, socket, head) => wss.handleUpgrade(req, socket, head, cb))
```
---

### Q29. How do you create a raw TCP server?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Use the `net` module's `createServer`, which gives a Duplex socket per connection for reading/writing raw bytes — the foundation beneath HTTP.

#### Code Example
```js
require('net').createServer(sock => sock.pipe(sock)).listen(9000) // echo
```
---

### Q30. What is the difference between TCP and UDP in Node?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
`net` provides reliable, ordered TCP streams. `dgram` provides UDP: connectionless, unordered, no delivery guarantee, but low latency — good for telemetry, gaming, DNS.

#### Code Example
```js
const udp = require('dgram').createSocket('udp4')
udp.send('ping', 41234, 'host')
```
---

### Q31. How do you handle DNS lookups?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
The `dns` module resolves hostnames. `dns.lookup` uses the OS resolver (thread pool), while `dns.resolve*` query DNS servers directly. Caching lookups reduces latency.

#### Code Example
```js
const { address } = await require('dns').promises.lookup('example.com')
```
---

### Q32. Why can `dns.lookup` block the thread pool?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
`dns.lookup` calls the synchronous OS resolver (`getaddrinfo`) on a libuv thread-pool thread. Many concurrent lookups can saturate the default 4-thread pool, delaying other pool work (fs, crypto). Increase `UV_THREADPOOL_SIZE` or cache DNS.

#### Code Example
```js
process.env.UV_THREADPOOL_SIZE = 16
```
---

### Q33. How do you implement HTTPS in Node?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Use `https.createServer` with a TLS key and certificate. In production, TLS is often terminated at a reverse proxy/load balancer instead of in Node.

#### Code Example
```js
https.createServer({ key, cert }, handler).listen(443)
```
---

### Q34. What is TLS termination and where should it happen?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
TLS termination is decrypting HTTPS traffic. It commonly happens at a load balancer/reverse proxy (nginx, ALB) which forwards plain HTTP to Node, simplifying cert management and offloading crypto from the app.

#### Code Example
```js
// nginx terminates TLS -> proxies to http://localhost:3000
```
---

### Q35. How do you trust the `X-Forwarded-For` header safely?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Behind a proxy, the client IP is in `X-Forwarded-For`, but it's spoofable if you trust it blindly. Configure trusted proxies (Express `trust proxy`) so only your infra's forwarded values are honored.

#### Code Example
```js
app.set('trust proxy', 'loopback, 10.0.0.0/8')
```
---

### Q36. How do you handle large request bodies safely?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Enforce a max body size and reject/destroy oversized requests to prevent memory exhaustion. Body parsers accept a `limit` option; for streaming uploads, count bytes and abort past the limit.

#### Code Example
```js
app.use(express.json({ limit: '1mb' }))
```
---

### Q37. What is HTTP pipelining?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Pipelining sends multiple HTTP/1.1 requests without waiting for responses, which must return in order (causing head-of-line blocking). Rarely used; HTTP/2 multiplexing solved the underlying need.

#### Code Example
```js
// HTTP/2 multiplexing supersedes HTTP/1.1 pipelining
```
---

### Q38. How do you proxy a request through Node?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Forward the incoming request to an upstream and pipe the upstream response back, copying relevant headers. Libraries like `http-proxy` handle edge cases (websockets, headers, errors).

#### Code Example
```js
const upstream = http.request(target, up => up.pipe(res))
req.pipe(upstream)
```
---

### Q39. What are hop-by-hop vs end-to-end headers?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Hop-by-hop headers (`Connection`, `Keep-Alive`, `Transfer-Encoding`) apply to a single connection and must not be forwarded by proxies. End-to-end headers are passed through unchanged. Proxies must strip hop-by-hop headers.

#### Code Example
```js
delete headers['connection']; delete headers['transfer-encoding']
```
---

### Q40. How do you implement rate limiting?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Track request counts per client (IP/key) in a window using a counter store (in-memory for one instance, Redis for many), and return 429 when the limit is exceeded. Algorithms: fixed window, sliding window, token bucket.

#### Code Example
```js
app.use(rateLimit({ windowMs: 60000, max: 100 }))
```
---

### Q41. What is the token bucket algorithm?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Tokens refill at a fixed rate up to a capacity; each request consumes one. Requests proceed if a token is available, else are throttled. It permits bursts up to the bucket size while enforcing an average rate.

#### Code Example
```js
tokens = Math.min(cap, tokens + elapsed * rate); if (tokens >= 1) { tokens--; allow() }
```
---

### Q42. How do you implement retries with idempotency?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Retry only idempotent operations (GET/PUT/DELETE) or use an idempotency key so the server dedupes repeated POSTs. Retrying non-idempotent calls blindly can duplicate side effects.

#### Code Example
```js
fetch(url, { method: 'POST', headers: { 'Idempotency-Key': uuid } })
```
---

### Q43. What is a circuit breaker?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
A circuit breaker stops calling a failing dependency after a threshold of errors (open state), failing fast to protect resources, then periodically probes (half-open) before resuming (closed). It prevents cascading failures.

#### Code Example
```js
if (breaker.isOpen()) throw new Error('circuit open')
```
---

### Q44. How do you handle streaming responses from an upstream API?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Pipe the upstream response stream directly to your client response so you don't buffer the whole payload, preserving low memory and latency.

#### Code Example
```js
const upstream = await fetch(url)
Readable.fromWeb(upstream.body).pipe(res)
```
---

### Q45. What is `Content-Type` negotiation?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Content negotiation picks a response format based on the client's `Accept` header (JSON, XML, HTML). The server inspects `Accept` and responds with the best supported representation and matching `Content-Type`.

#### Code Example
```js
res.format({ json: () => res.json(data), html: () => res.render('view', data) })
```
---

### Q46. How do you set cookies from a Node server?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
Send a `Set-Cookie` header with attributes like `HttpOnly`, `Secure`, `SameSite`, `Max-Age`, and `Path`. `HttpOnly`+`Secure`+`SameSite` protect against XSS/CSRF theft.

#### Code Example
```js
res.setHeader('Set-Cookie', 'sid=abc; HttpOnly; Secure; SameSite=Strict')
```
---

### Q47. What does the `SameSite` cookie attribute do?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
`SameSite` controls whether cookies are sent on cross-site requests: `Strict` (never), `Lax` (top-level navigations only), `None` (always, requires `Secure`). It mitigates CSRF.

#### Code Example
```js
'session=x; SameSite=Lax; Secure'
```
---

### Q48. How do you compress HTTP responses?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Check the client's `Accept-Encoding`, pipe the body through gzip/brotli, and set `Content-Encoding`. Middleware (`compression`) automates this; often done at the proxy instead.

#### Code Example
```js
app.use(require('compression')())
```
---

### Q49. What is ETag and conditional requests?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
An `ETag` is a content fingerprint. Clients send `If-None-Match`; if unchanged, the server returns `304 Not Modified` with no body, saving bandwidth. `Last-Modified`/`If-Modified-Since` work similarly by date.

#### Code Example
```js
if (req.headers['if-none-match'] === etag) return res.writeHead(304).end()
```
---

### Q50. How do you implement HTTP caching headers?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Use `Cache-Control` (`max-age`, `no-store`, `private`, `immutable`) to instruct browsers/CDNs, plus validators (`ETag`, `Last-Modified`) for revalidation. Correct caching cuts load and latency.

#### Code Example
```js
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
```
---

### Q51. What is a reverse proxy and why use one in front of Node?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
A reverse proxy (nginx, HAProxy) sits in front of Node to terminate TLS, serve static files, load-balance across instances, buffer slow clients, and add caching/compression — offloading concerns from the app.

#### Code Example
```js
// nginx: proxy_pass http://localhost:3000
```
---

### Q52. How do you handle sticky sessions behind a load balancer?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Sticky sessions pin a client to one instance (via cookie/IP hash) so in-memory session state works. Better: make servers stateless with a shared session store (Redis) so any instance can serve any request.

#### Code Example
```js
app.use(session({ store: new RedisStore({ client }) })) // no stickiness needed
```
---

### Q53. What is HTTP long polling?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Long polling holds a request open until the server has data (or a timeout), then the client immediately re-requests. It simulates push over plain HTTP but is less efficient than SSE/WebSockets.

#### Code Example
```js
// server holds res until an event, then res.json(update)
```
---

### Q54. How do you validate and sanitize incoming request data?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Validate structure/types against a schema (zod, Joi) at the boundary, reject invalid input with 400, and sanitize to prevent injection. Never trust client data.

#### Code Example
```js
const body = schema.parse(req.body) // throws on invalid input
```
---

### Q55. What is the difference between `res.end` and `res.write`?
**Difficulty:** `Intermediate`
**Category:** HTTP & Networking

#### Answer
`res.write` sends a body chunk and keeps the response open; `res.end` optionally sends a final chunk and closes the response. You can call `write` many times then `end` once.

#### Code Example
```js
res.write('part1'); res.write('part2'); res.end()
```
---

### Q56. How do you avoid "headers already sent" errors?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Once the body/headers are sent, don't set headers or send another response. Guard with `res.headersSent`, and always `return` after sending to avoid falling through to more response code.

#### Code Example
```js
if (err) return res.status(500).end() // return prevents double-send
```
---

### Q57. How do you stream a video with range support?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Parse the `Range` header, respond with 206 Partial Content, `Content-Range`, and `Accept-Ranges: bytes`, then stream the requested byte slice. This enables seeking in media players.

#### Code Example
```js
res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}` })
fs.createReadStream(file, { start, end }).pipe(res)
```
---

### Q58. What is HSTS?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
HTTP Strict Transport Security (`Strict-Transport-Security` header) tells browsers to only use HTTPS for your domain for a duration, preventing protocol-downgrade and SSL-strip attacks.

#### Code Example
```js
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
```
---

### Q59. How do you handle multipart/form-data uploads?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Parse the multipart body with a streaming parser (`busboy`, `multer`) that separates fields and files, streaming files to storage rather than buffering. Enforce size/type limits.

#### Code Example
```js
app.post('/upload', multer({ dest: 'uploads/' }).single('file'), handler)
```
---

### Q60. What is `keepAliveTimeout` and why tune it behind a load balancer?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
`keepAliveTimeout` is how long Node keeps an idle connection open. It should be slightly longer than the upstream load balancer's idle timeout to avoid races where the LB reuses a socket Node just closed (causing 502s).

#### Code Example
```js
server.keepAliveTimeout = 65000 // > ALB's 60s
```
---

### Q61. How do you detect and handle a dropped client connection?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Listen for `req.on('close')` / `res.on('close')` (or an AbortSignal) to know the client disconnected, then stop expensive work and release resources for that request.

#### Code Example
```js
req.on('close', () => controller.abort()) // cancel work if client left
```
---

### Q62. What is HTTP/3 and QUIC?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
HTTP/3 runs over QUIC (a UDP-based transport) instead of TCP, eliminating TCP head-of-line blocking, enabling faster connection setup (0-RTT), and better mobility. Node support is experimental/via proxies.

#### Code Example
```js
// typically terminated at a CDN/edge; Node speaks HTTP/1.1 or /2 upstream
```
---

### Q63. How do you implement request tracing/correlation IDs?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Generate or propagate a correlation ID (from `X-Request-Id`/`traceparent`) per request, store it in `AsyncLocalStorage`, and include it in all logs and downstream calls to trace a request across services.

#### Code Example
```js
const id = req.headers['x-request-id'] ?? crypto.randomUUID()
als.run({ id }, () => next())
```
---

### Q64. How do you secure HTTP headers?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Set defensive headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, HSTS. Middleware like `helmet` applies sensible defaults.

#### Code Example
```js
app.use(require('helmet')())
```
---

### Q65. What is `Content-Security-Policy`?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
CSP restricts which sources scripts/styles/images can load from, mitigating XSS and data injection. It's declared via a header listing allowed origins per resource type.

#### Code Example
```js
res.setHeader('Content-Security-Policy', "default-src 'self'")
```
---

### Q66. How do you handle concurrent connections limit?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Set `server.maxConnections`, use a reverse proxy for buffering, scale horizontally with cluster/instances, and cap outbound `maxSockets`. Monitor `server.getConnections()` to observe load.

#### Code Example
```js
server.maxConnections = 10000
```
---

### Q67. What is the difference between `http` and `https` Agent?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Both pool sockets, but the `https.Agent` also manages TLS session parameters and can reuse TLS sessions. Use the matching agent for the protocol; mixing them breaks connection reuse.

#### Code Example
```js
const agent = new https.Agent({ keepAlive: true })
```
---

### Q68. How do you make outbound requests resilient?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Combine timeouts, retries with backoff+jitter (idempotent only), circuit breakers, connection pooling, and bulkheads (concurrency limits). This prevents a slow dependency from taking down your service.

#### Code Example
```js
await retry(() => fetch(url, { signal: AbortSignal.timeout(3000) }), { retries: 3 })
```
---

### Q69. How do you test HTTP endpoints?
**Difficulty:** `Advanced`
**Category:** HTTP & Networking

#### Answer
Use `supertest` (or Node's `fetch` against an ephemeral port) to send requests to the app instance and assert on status, headers, and body — without a real network or fixed port.

#### Code Example
```js
await request(app).get('/health').expect(200)
```
---

### Q70. How do you detect and prevent SSRF?
**Difficulty:** `Experienced`
**Category:** HTTP & Networking

#### Answer
Server-Side Request Forgery tricks your server into fetching internal/unintended URLs. Prevent by validating/whitelisting outbound hosts, blocking private IP ranges and redirects to them, and never fetching raw user-supplied URLs.

#### Code Example
```js
if (isPrivateIp(new URL(userUrl).hostname)) throw new Error('blocked')
```
---
