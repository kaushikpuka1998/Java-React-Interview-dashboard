# HLD — Real-Time & High-Scale System Design Interview Questions (Q271–Q285)

*Each answer includes Back-of-the-Envelope estimation and a top-to-bottom architecture flow.*

---

### Q271. Design a real-time chat system.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Clients connect via **WebSocket** to gateway servers; messages persist (per-conversation store) and route to recipients through a **pub/sub backplane** (Redis/Kafka) so a sender on gateway A reaches a recipient on gateway B. Track presence, receipts, unread counts; offline → push. Many gateways + sticky sessions + backplane; shard by conversation. **Challenges**: connection scale, cross-server routing, ordering, receipts, presence, offline delivery, group fan-out.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    50M DAU, ~5M concurrent; 1B msgs/day = ~11,600/sec (peak ~40k)
Conns/node: ~50k → ~100 gateway nodes; msgs 300 B → shard by conversation

── ARCHITECTURE (top → bottom) ──
   ┌──────────┐          ┌──────────┐
   │ Client A │          │ Client B │
   └────┬─────┘          └────▲─────┘
    WebSocket             WebSocket
        ▼                     │
   ┌──────────┐          ┌──────────┐
   │Gateway N1│          │Gateway N2│
   └────┬─────┘          └────▲─────┘
     publish            subscribe
        ▼                     │
   ┌──────────────────────────┴─────┐
   │ Pub/Sub Backplane (Redis/Kafka)│
   └────┬───────────────────────────┘
        ▼
   ┌──────────────┐
   │Message Store │  (sharded by conversation) + offline → push
   └──────────────┘
```

---

### Q272. Design real-time notifications.
**Difficulty:** `Intermediate`
**Category:** Real-Time & High Scale

#### Answer
Deliver to online users **instantly** (WebSocket/SSE push via a connection gateway + backplane) and offline users via **push/email/SMS**. An event → notification service → fan-out to the user's active connections and/or providers. Store notifications for in-app history + unread counts. **Challenges**: online vs offline routing (presence-aware), fan-out to multiple devices, idempotency, ordering, unread-count consistency, provider rate limits/failover.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:  500M notifications/day = ~5,800/sec (peak ~20k); user may have N devices

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Event       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Notif Service │  presence-aware routing
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ online     ▼ offline
 ┌────────────┐┌──────────────┐
 │WebSocket/SSE││Push/Email/SMS│
 │Gateway (+   ││(APNs/FCM)    │
 │backplane)   │└──────────────┘
 └─────┬──────┘
       ▼
 ┌────────────┐
 │In-app store │  history + unread counts (dedupe by id)
 └────────────┘
```

---

### Q273. Design live sports score updates.
**Difficulty:** `Intermediate`
**Category:** Real-Time & High Scale

#### Answer
A high **fan-out, read-heavy** broadcast: a data feed updates scores → a service publishes to a pub/sub layer → millions of clients receive via **WebSocket/SSE** (or CDN-cached short-poll for extreme scale). One-to-many broadcast of the same data → push through a scalable backplane + edge. **Challenges**: massive fan-out (millions concurrent), low latency, connection scaling (or CDN offload), efficient broadcast, match-time spikes.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Viewers:  10M concurrent on a big match; SAME payload to all (broadcast)
Options:  WebSocket/SSE gateways + backplane, OR push to CDN edge (clients poll)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Data Feed   │  (score change)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Score Service │  → publish
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Pub/Sub     │
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────────┐
│Gateway││Gateway││CDN Edge  │  fan-out to millions
│(WS/SSE││(WS/SSE││(cached   │  (same payload)
│)      ││)      ││ poll)    │
└──────┘└──────┘└──────────┘
```

---

### Q274. Design stock price streaming.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Ingest market data (very high throughput) → normalize → publish per-symbol updates → fan-out to subscribed clients via **WebSocket** (subscribe to specific symbols → filter/route). Low latency critical. Fast in-memory pub/sub, **conflation** (send only latest price if a client is slow), per-symbol topics. Partition by symbol. **Challenges**: ultra-low latency, firehose throughput, subscription filtering, conflation/backpressure, tick ordering, fan-out at scale.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Ingest:  millions of ticks/sec (market firehose); latency budget = milliseconds
Conflation: slow client gets LATEST price only (drop intermediate ticks)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Market Data  │  (firehose)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Normalize    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Per-symbol    │  in-memory bus (partitioned by symbol)
   │Pub/Sub       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │WebSocket      │  clients subscribe to symbols (filter/route)
   │Gateways       │  conflation for slow clients (backpressure)
   └──────────────┘
```

---

### Q275. Design a real-time bidding system.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Ad RTB: on an impression, an exchange sends bid requests to many bidders who must respond within **~100ms**; highest bid wins, ad served. Extreme low latency + high throughput (millions auctions/sec). Bidders use fast in-memory lookups (budgets, targeting, ML value) + strict timeouts. Horizontally scaled, regional. **Challenges**: ~100ms budget, massive QPS, real-time budget pacing, ML scoring in budget, timeout drops, budget consistency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Auctions: millions/sec; HARD ~100ms end-to-end budget (drop slow bidders)
Bidders:  in-memory targeting/budget + ML value prediction, regional

── ARCHITECTURE (top → bottom, ~100ms) ──
   ┌──────────────┐
   │  Impression  │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Exchange    │  parallel bid requests (strict timeout)
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Bidder││Bidder││Bidder│  in-memory budget/targeting + ML score
│1     ││2     ││3     │  (respond <100ms or dropped)
└──────┘└──────┘└──────┘
          ▼
   ┌──────────────┐
   │Highest bid   │  → serve ad
   │wins          │
   └──────────────┘
```

---

### Q276. Design an online multiplayer game backend.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Players connect to **game servers** (authoritative for state) via **UDP**/WebSocket; a **matchmaking** service groups players into sessions; each session runs on a server that simulates the game loop and broadcasts state (client-side prediction + server reconciliation hide latency). Many instances, regional (low ping), session-based sharding. **Challenges**: low latency, authoritative state + cheat prevention, skill-based matchmaking, state sync, session scaling, disconnects/reconnects.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Latency:  <50ms ping → regional game servers; tick rate 20-60 Hz
State:    server-authoritative (anti-cheat); client predicts + reconciles

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Players     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Matchmaking   │  (skill-based) → group into session
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Game Server   │  authoritative game loop (regional, low ping)
   │(session,     │  ◄── UDP/WebSocket ──► players
   │ sharded)     │  broadcast state; prediction + reconciliation
   └──────────────┘
Scale: many instances, session sharding.
```

---

### Q277. Design a ride-location tracking system.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Drivers/riders send frequent **location updates** (every few seconds) → high-volume ingest → **geospatial index** (geohash/H3, sharded) for nearby queries + streamed to the paired rider for **live tracking** (WebSocket). Fast in-memory store for latest location + Kafka stream for history. Geo-sharded. **Challenges**: high-frequency ingestion (millions writes), geospatial queries, real-time delivery, conflation (latest only), battery/bandwidth.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Drivers:  5M active × update/4s = ~1.25M writes/sec → store LATEST only (conflate)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Driver/Rider  │  location every 4s
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Ingest (high  │
   │volume)       │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌────────────┐┌──────────────┐
 │Geo Index   ││Kafka Stream  │
 │(geohash/H3,││(history/     │
 │ latest loc)││ analytics)   │
 └─────┬──────┘└──────────────┘
       ▼ WebSocket
 ┌────────────┐
 │Paired Rider │  live tracking
 └────────────┘
```

---

### Q278. Design real-time GPS tracking.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Devices report GPS continuously → ingestion (high write volume) → latest position (Redis) + full history (time-series/Kafka) → serve live positions to dashboards (WebSocket/SSE) + geo-queries (nearby/within-area). **Geofencing** (alert on enter/exit). Partition by device/region. **Challenges**: massive write throughput, geo + geofence queries, real-time delivery, history storage (downsampling), offline buffering, battery/bandwidth.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Devices:  1M × update/5s = ~200k writes/sec; history downsampled + tiered

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Devices     │  GPS coordinates
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Ingest      │
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────┐
 │Redis ││Time-   ││Geofencing│
 │latest││series/ ││(enter/   │
 │pos   ││Kafka   ││ exit)    │
 └──┬───┘└(history)└──────────┘
    ▼ WebSocket/SSE
 ┌──────────┐
 │Dashboards│  + geo-queries (nearby/area)
 └──────────┘
```

---

### Q279. Design a live-streaming platform.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Broadcaster ingests via **RTMP/WebRTC** → transcode (multiple bitrates) → segment into HLS/DASH → **CDN** to viewers (adaptive bitrate). Low-latency: LL-HLS or WebRTC. Separate WebSocket **chat** + viewer counts. CDN handles viewer fan-out; regional ingest + transcode. **Challenges**: latency (HLS ~10s vs LL-HLS/WebRTC ~2s), transcoding at scale, massive fan-out (CDN), ABR, synchronized chat, viral spikes.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Viewers:  1M concurrent per popular stream → CDN fan-out; ~3-6 Mbps/stream
Latency:  HLS ~10s | LL-HLS ~3s | WebRTC ~1s (trade latency vs scale)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Broadcaster  │  RTMP/WebRTC ingest
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Transcode   │  multiple bitrates → HLS/DASH segments
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │     CDN      │  → viewers (adaptive bitrate)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Viewers     │  (+ separate WebSocket chat, viewer counts)
   └──────────────┘
```

---

### Q280. Design Twitch.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
A live-streaming platform tuned for **interactive** streaming: low-latency video (ingest → transcode → CDN with LL-HLS), high-volume real-time **chat** (millions of messages, sharded WebSocket + fan-out), subscriptions/bits/emotes, VOD, recommendations. CDN for video fan-out, sharded chat, regional ingest. **Challenges**: low-latency video at scale, extreme chat fan-out (popular streams → millions of chatters), moderation, monetization, VOD, discovery.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Big stream: millions of viewers (CDN video) + millions of chatters (sharded WS)
Chat fan-out is the hard part (one message → millions of clients)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Broadcaster  │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ video      ▼ chat
 ┌────────────┐┌──────────────┐
 │Transcode → ││Sharded       │
 │CDN (LL-HLS)││WebSocket +   │
 │            ││fan-out       │
 └─────┬──────┘└──────┬───────┘
       ▼              ▼
 ┌──────────┐  ┌──────────────┐
 │Viewers   │  │Chatters      │  subs/bits/emotes, moderation
 └──────────┘  └──────────────┘
VOD recording; recommendations; regional ingest.
```

---

### Q281. Design a real-time analytics platform.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Ingest event streams (Kafka) → **stream processing** (Flink/Kafka Streams) computes real-time aggregations (counts, windows, sessions) → fast OLAP/serving store (Druid/ClickHouse/Pinot) for sub-second dashboards. Raw events → lake for batch/ML (**Lambda/Kappa**). Partition streams, scale processors, columnar serving. **Challenges**: real-time aggregation (windowing + late events), ingestion throughput, low-latency queries (pre-aggregation), high cardinality, EOS aggregation, real-time vs batch accuracy.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Ingest:  millions of events/sec → Kafka partitions; pre-aggregate for sub-sec queries

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Events      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │   Kafka      │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ real-time  ▼ raw
 ┌────────────┐┌──────────────┐
 │Stream Proc ││Data Lake     │  batch/ML
 │(Flink):    ││(S3)          │
 │windowed agg│└──────────────┘
 └─────┬──────┘
       ▼
 ┌────────────┐
 │OLAP Store   │  (Druid/ClickHouse/Pinot) → dashboards (sub-sec)
 └────────────┘
```

---

### Q282. Design a real-time dashboard.
**Difficulty:** `Intermediate`
**Category:** Real-Time & High Scale

#### Answer
Show live metrics that update continuously. Backend aggregates data (from a stream processor / OLAP / metrics system) and **pushes updates** to the browser via **WebSocket/SSE** (or polls a fast query API). Pre-aggregate for low-latency reads; push only **deltas**. Connection gateways for many viewers, cached data, backplane for fan-out. **Challenges**: real-time push scaling, low-latency aggregation, delta updates, number consistency, many concurrent dashboards.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Stream Proc/  │  aggregate metrics (pre-aggregated)
   │OLAP          │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Dashboard     │  compute deltas
   │Service       │
   └──────┬───────┘
     push deltas (WebSocket/SSE)
          ▼
   ┌──────────────┐
   │Browser       │  (+ gateways + backplane for many viewers)
   └──────────────┘
Push DELTAS not full state; pre-aggregate for low latency.
```

---

### Q283. Design millions of WebSocket connections.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Horizontally scale **connection gateways** (event-driven servers — epoll/Netty/Go/Elixir — for high connections-per-node), front with **L4 load balancers** (sticky), use a **pub/sub backplane** (Redis/Kafka) to route between gateways. Track connection→gateway mapping for targeted delivery. Heartbeats + reconnection. **Challenges**: connections-per-node limits (tune OS: fds, memory), cross-gateway routing, presence at scale, heartbeat/dead-connection cleanup, reconnection storms (backoff + jitter).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Conns:   10M connections ÷ 100k/node = ~100 gateway nodes (tune OS fds/memory)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Clients     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │L4 Load Balancer│  sticky by connection
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Gateway││Gateway││Gateway│  event-driven (epoll/Netty/Go/Elixir)
│(50k+  ││conns) ││      │  heartbeats + reconnect (backoff/jitter)
└──┬───┘└──┬───┘└──┬───┘
   └───────┼───────┘
           ▼
   ┌──────────────┐
   │Pub/Sub       │  route cross-gateway + connection→gateway registry
   │Backplane     │
   └──────────────┘
```

---

### Q284. Design presence detection.
**Difficulty:** `Hard`
**Category:** Real-Time & High Scale

#### Answer
Track who's online in real time. On connect, mark online (Redis with **TTL/heartbeat** so a crash auto-expires); on disconnect/heartbeat-miss, mark offline. **Fan-out** presence changes to interested users via pub/sub — but for high-follower users, avoid broadcasting every change (batch, or on-demand query). Redis for state, pub/sub for updates. **Challenges**: accurate online/offline (TTL vs flapping), fan-out (the expensive part — many watchers), state scale, eventual consistency.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Connect     │
   └──────┬───────┘
     SET presence:user TTL (heartbeat refreshes)
          ▼
   ┌──────────────┐
   │Redis         │  key present = online; TTL expiry = offline
   │(presence     │
   │ state)       │
   └──────┬───────┘
     change → publish
          ▼
   ┌──────────────┐
   │Pub/Sub       │  fan-out to watchers (batch / on-demand for high-follower)
   └──────────────┘
Accurate status = TTL tuning (avoid flapping). Fan-out is the expensive part.
```

---

### Q285. Design online/offline user status.
**Difficulty:** `Intermediate`
**Category:** Real-Time & High Scale

#### Answer
A focused presence system: each user's status (online/offline/last-seen) driven by heartbeats in Redis with a TTL; update **last-seen** on disconnect. Expose via query (pull) or push to contacts. To limit fan-out cost, prefer **on-demand queries** (when viewing a chat) over broadcasting every change. **Challenges**: heartbeat accuracy (TTL tuning, flapping), last-seen updates, fan-out vs pull trade-off, privacy (last-seen visibility), read scale.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Heartbeat   │  (while connected)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Redis         │  key refreshed = ONLINE; expires = OFFLINE
   │status + TTL  │  update last-seen on disconnect
   └──────┬───────┘
     read (prefer query-on-view over broadcast)
          ▼
   ┌──────────────┐
   │  Viewer      │  sees online / last-seen (respect privacy settings)
   └──────────────┘
Query-on-view limits fan-out. TTL tuning avoids flapping.
```

---
