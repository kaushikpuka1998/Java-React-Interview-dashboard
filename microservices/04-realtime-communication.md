# System Design — Real-Time Communication (Polling, WebSocket, SSE, WebRTC) Interview Questions (Q71–Q95)

---

### Q71. What is Short Polling and what are its drawbacks?
**Difficulty:** `Basic`
**Category:** Real-Time Communication

#### Answer
Short polling is the client repeatedly sending requests at a fixed interval (e.g. every 3s) asking "any new data?". The server responds immediately with data or an empty result. It's trivial to implement over plain HTTP and needs no special server support. Drawbacks: most requests return nothing (wasted bandwidth/CPU), there's inherent latency up to the polling interval, and it scales poorly (N clients × frequency = constant load even when idle). Use it only for low-frequency, latency-tolerant updates.

#### Code Example / Key Takeaways
```js
// Client asks on a fixed interval regardless of whether data changed
setInterval(async () => {
  const res = await fetch('/api/notifications')
  const data = await res.json()
  if (data.length) render(data)        // most polls return [] -> wasted calls
}, 3000)                               // latency up to 3s, constant load
```

---

### Q72. What is Long Polling and how does it improve on short polling?
**Difficulty:** `Intermediate`
**Category:** Real-Time Communication

#### Answer
In long polling the client sends a request and the server **holds it open** until data is available (or a timeout), then responds; the client immediately re-requests. This gives near-real-time delivery without constant empty responses — the connection only returns when there's something to send. It works over standard HTTP (firewall/proxy friendly). Drawbacks: a held request consumes a server connection/thread (use async/non-blocking servers), reconnection overhead per message, and it's still request/response (half-duplex), not true push.

#### Code Example / Key Takeaways
```js
// Client: re-issues the request as soon as the server responds
async function poll() {
  try {
    const res = await fetch('/api/updates')   // server holds this until data/timeout
    if (res.ok) handle(await res.json())
  } finally {
    poll()                                     // immediately wait for the next event
  }
}
poll()
```
```java
// Server: hold the request asynchronously, complete it when an event arrives
@GetMapping("/api/updates")
DeferredResult<Update> updates() {
    DeferredResult<Update> out = new DeferredResult<>(30_000L); // timeout
    subscribers.add(out);                       // completed later by publisher
    return out;
}
```

---

### Q73. What is Server-Sent Events (SSE) and when is it a good fit?
**Difficulty:** `Intermediate`
**Category:** Real-Time Communication

#### Answer
SSE is a standard for **server-to-client streaming** over a single long-lived HTTP connection using the `text/event-stream` content type. The server pushes messages as they occur; the browser's `EventSource` auto-reconnects and can resume via `Last-Event-ID`. It's one-directional (server→client only), text-based, and simpler than WebSocket (plain HTTP, works with existing infra). Ideal for feeds, notifications, live scores, or progress updates where the client only receives. For bidirectional/binary needs, use WebSocket.

#### Code Example / Key Takeaways
```js
// Client — built-in reconnection, no library needed
const es = new EventSource('/api/stream')
es.onmessage = e => render(JSON.parse(e.data))
es.addEventListener('price', e => updatePrice(JSON.parse(e.data)))
```
```java
// Server (Spring) — push events over one connection
@GetMapping(value = "/api/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<ServerSentEvent<Price>> stream() {
    return prices.map(p -> ServerSentEvent.builder(p).event("price").id(p.id()).build());
}
```

---

### Q74. What are WebSockets and how do they differ from HTTP?
**Difficulty:** `Intermediate`
**Category:** Real-Time Communication

#### Answer
WebSocket is a protocol providing a **full-duplex, persistent** TCP connection between client and server. It starts as an HTTP request with an `Upgrade: websocket` header (the handshake), then switches protocols; afterward both sides can send messages any time with low overhead (small frames, no repeated headers). Unlike HTTP's request/response, either side can push. It supports text and binary. Ideal for chat, multiplayer games, collaborative editing, and live trading. Costs: stateful connections complicate load balancing/scaling and need heartbeats + reconnection logic.

#### Code Example / Key Takeaways
```js
// After the HTTP Upgrade handshake, both sides push freely
const ws = new WebSocket('wss://example.com/chat')
ws.onopen = () => ws.send(JSON.stringify({ type: 'join', room: 'general' }))
ws.onmessage = e => appendMessage(JSON.parse(e.data))   // server can push anytime
// Client can also send anytime — full-duplex, unlike request/response HTTP
```

---

### Q75. What is WebRTC and when would you use it?
**Difficulty:** `Hard`
**Category:** Real-Time Communication

#### Answer
WebRTC enables **peer-to-peer**, low-latency audio/video/data directly between browsers (no media relay through your server in the common case). Key pieces: **getUserMedia** (capture), **RTCPeerConnection** (the P2P media/data channel over UDP/SRTP), **ICE/STUN/TURN** (NAT traversal — STUN discovers public IPs, TURN relays when P2P fails), and a **signaling** channel (you build this, often via WebSocket) to exchange SDP offers/answers and ICE candidates. Use it for video calls, live streaming, screen sharing, and P2P file transfer. It's complex and needs STUN/TURN infrastructure.

#### Code Example / Key Takeaways
```js
const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
// 1. Signaling (via YOUR channel, e.g. WebSocket) exchanges these:
const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
signal.send({ sdp: offer })                       // -> peer
pc.onicecandidate = e => e.candidate && signal.send({ ice: e.candidate })
// 2. Media/data then flows peer-to-peer, not through your server:
pc.ontrack = e => remoteVideo.srcObject = e.streams[0]
```

---

### Q76. Compare Short Polling, Long Polling, SSE, and WebSocket.
**Difficulty:** `Intermediate`
**Category:** Real-Time Communication

#### Answer
- **Short polling**: client pulls on an interval. Simple; high latency + waste. Low-frequency updates.
- **Long polling**: server holds request until data. Near real-time over HTTP; connection churn. Fallback when WebSocket unavailable.
- **SSE**: server→client stream over HTTP; auto-reconnect; text only, one-way. Feeds/notifications.
- **WebSocket**: full-duplex persistent connection; binary+text; lowest overhead per message; stateful, harder to scale. Chat/games/collab.

Rule: one-way server push → SSE; two-way interactive → WebSocket; must work through restrictive proxies with minimal setup → long polling; trivial/rare updates → short polling; P2P media → WebRTC.

#### Code Example / Key Takeaways
```text
                  Direction     Transport   Latency   Complexity  Best for
Short polling     C->S pull     HTTP        high      very low    rare updates
Long polling      C<->S (held)  HTTP        low-med   low         WS fallback
SSE               S->C stream   HTTP        low       low         feeds/notifs
WebSocket         C<->S duplex  TCP(ws)     lowest    medium      chat/games
WebRTC            P2P           UDP/SRTP    lowest    high        video/voice
```

---

### Q77. How do you scale WebSocket connections across many servers?
**Difficulty:** `Hard`
**Category:** Real-Time Communication

#### Answer
WebSockets are **stateful**: a connection lives on one server, so a message from user A (on server 1) to user B (on server 2) needs cross-server routing. Solutions: a **pub/sub backplane** (Redis Pub/Sub, Kafka, NATS) so any server can broadcast to connections held elsewhere; **sticky sessions** at the load balancer so a client stays on its server; store connection→server mappings for targeted delivery; and scale horizontally with connection limits per node. Add heartbeats (ping/pong) to detect dead connections and clean up.

#### Code Example / Key Takeaways
```js
// Backplane: publish to Redis; every app server subscribes and pushes to its local sockets
redisPub.publish('room:general', JSON.stringify(msg))       // from server 1

redisSub.subscribe('room:general')
redisSub.on('message', (_ch, payload) => {
  const msg = JSON.parse(payload)
  for (const ws of localSocketsInRoom('general')) ws.send(payload) // on every server
})
// LB uses sticky sessions so a client's frames land on the server holding its socket.
```

---

### Q78. How do you handle reconnection and heartbeats for persistent connections?
**Difficulty:** `Intermediate`
**Category:** Real-Time Communication

#### Answer
Networks drop; persistent connections must detect death and recover. Use **heartbeats** (periodic ping/pong) to detect a half-open connection faster than TCP timeouts. On disconnect, **reconnect with exponential backoff + jitter** to avoid thundering herds. Preserve continuity: resume from a last-seen id/offset (SSE `Last-Event-ID`, or an app-level sequence) so no messages are lost or duplicated. Make message handling idempotent since reconnection can replay.

#### Code Example / Key Takeaways
```js
let delay = 1000
function connect() {
  const ws = new WebSocket(`wss://x/stream?since=${lastSeenId}`) // resume point
  const hb = setInterval(() => ws.readyState === 1 && ws.send('ping'), 15000)
  ws.onmessage = e => { if (e.data !== 'pong') { lastSeenId = handle(e.data); } }
  ws.onclose = () => {
    clearInterval(hb)
    setTimeout(connect, Math.min(delay *= 2, 30000) + Math.random() * 1000) // backoff+jitter
  }
  ws.onopen = () => { delay = 1000 }
}
connect()
```

---

### Q79. What is HTTP/2 Server Push and gRPC streaming, versus WebSocket?
**Difficulty:** `Hard`
**Category:** Real-Time Communication

#### Answer
- **HTTP/2 server push** lets a server proactively send resources it knows the client will need (mostly for assets; largely deprecated in browsers). It is *not* a general real-time messaging channel.
- **gRPC streaming** (over HTTP/2) offers server-streaming, client-streaming, and bidirectional streaming with typed messages — great for service-to-service real-time and mobile, but limited in browsers without gRPC-Web.
- **WebSocket** is the browser-native choice for arbitrary bidirectional app messaging.

Use gRPC streaming internally between services; WebSocket/SSE at the browser edge.

#### Code Example / Key Takeaways
```protobuf
// gRPC bidirectional streaming — typed, multiplexed over HTTP/2
service Chat {
  rpc Connect (stream ClientMsg) returns (stream ServerMsg);  // both directions stream
}
```
```java
// Server-streaming example
StreamObserver<ServerMsg> obs = ...;
prices.forEach(p -> obs.onNext(ServerMsg.newBuilder().setPrice(p).build()));
obs.onCompleted();
```

---

### Q80. Exercise — Real-Time Communication: choose the right technique for a live system.
**Difficulty:** `Intermediate`
**Category:** Real-Time Communication

#### Answer
Match the requirement to the mechanism. Examples: a stock **ticker** (server→client only) → SSE; a **chat app** (two-way, text/binary) → WebSocket + Redis backplane; a **video call** → WebRTC with a WebSocket signaling channel; a legacy dashboard behind strict proxies needing occasional updates → long polling; a rarely-changing status badge → short polling. Justify by direction, latency, scale, and infra constraints.

#### Code Example / Key Takeaways
```text
Requirement                     -> Choice
live prices (one-way)           -> SSE (auto-reconnect, HTTP-simple)
chat / collaboration (two-way)  -> WebSocket + pub/sub backplane
video / voice call              -> WebRTC (P2P) + WebSocket signaling
progress bar of a long job      -> SSE or long polling
occasional status refresh       -> short polling
service-to-service streaming    -> gRPC bidirectional streaming
```

---
