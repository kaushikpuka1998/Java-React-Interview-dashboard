# HLD — Core Distributed Systems Interview Questions (Q81–Q130)

*Each answer includes a top-to-bottom flow (and Back-of-the-Envelope estimation where it's a scalable system).*

---

### Q81. Design a distributed cache.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Partition the keyspace across cache nodes using **consistent hashing** (so adding/removing a node reshuffles minimal keys), replicate each partition for availability, and route clients via a hash of the key. Support TTL/eviction (LRU/LFU), cache-aside reads, and invalidation. **Scale**: add nodes → ring rebalances; replicas serve reads and enable failover. **Challenges**: hot keys (replicate/local-cache them), consistency vs freshness, node failure handling, and cache stampede (locks/singleflight). Redis Cluster is a real implementation.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Reads:    1M ops/sec → sharded across N nodes (~50k/node)
Memory:   1 TB working set → ~10 nodes × 128 GB (+ replicas)
Hit rate: target >90% → sized to hold hot 10-20% of data

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │  hash(key) → route
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Consistent    │  ring: key → node (minimal reshuffle on change)
   │Hash Router   │
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Node A││Node B││Node C│  each + replica (failover)
│(LRU  ││      ││      │
│ +TTL)││      ││      │
└──────┘└──────┘└──────┘
Hot key → replicate / local cache. Stampede → singleflight. (Redis Cluster)
```

---

### Q82. Design a distributed rate limiter.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Keep counters in a **shared store (Redis)** keyed by client so the limit holds across all app instances. Use **token bucket** or **sliding-window** logic executed atomically (Redis Lua script / `INCR` + `EXPIRE`). Return 429 + `Retry-After` when exceeded. **Scale**: Redis cluster shards by key; for extreme scale, allow slight approximation (local buckets + async sync). **Challenges**: atomicity, clock skew, hot keys, accuracy-vs-latency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Checks:   every request → 1 Redis op (atomic Lua) → ~500k/sec
State:    per client key ~50 B → millions of clients = few GB (sharded)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Request    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ API Instance │
   └──────┬───────┘
     atomic check (Lua)
          ▼
   ┌──────────────┐
   │ Redis (shared│  token-bucket/sliding-window per client key
   │ , sharded)   │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────┐   ┌──────────┐
 │Allow │   │429 + Retry│
 │      │   │-After    │
 └──────┘   └──────────┘
Extreme scale → local buckets + async sync (approximate).
```

---

### Q83. Design a token bucket rate limiter.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Each client has a bucket with `capacity` tokens that refills at `rate` tokens/sec. A request consumes one token if available; else it's rejected (429). Allows **bursts** up to capacity while enforcing an average rate. Store `{tokens, lastRefill}` per client (Redis); on each request compute refill = elapsed × rate, cap at capacity, then consume — atomically. Simple, efficient, burst-friendly (the most common choice).

#### Code Example / Key Takeaways
```text
── ALGORITHM + FLOW (top → bottom) ──
State per client: { tokens, lastRefill }
   ┌──────────────┐
   │   Request    │
   └──────┬───────┘
          ▼
   ┌──────────────────────────────┐
   │ refill = (now - lastRefill)×rate │
   │ tokens = min(capacity, tokens+refill) │
   └──────┬───────────────────────┘
          ▼
   ┌──────────────┐
   │ tokens >= 1 ?│
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ yes        ▼ no
 ┌──────────┐ ┌──────┐
 │tokens--; │ │ 429  │
 │ allow    │ │      │
 └──────────┘ └──────┘
Bursts up to capacity; avg = rate. Atomic in Redis (Lua).
```

---

### Q84. Design a sliding-window rate limiter.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Fixed-window counters have a boundary problem (2× burst at the edge). **Sliding-window log** stores request timestamps in a sorted set and counts those within the last window — accurate but memory-heavy. **Sliding-window counter** approximates by weighting previous + current fixed windows by overlap — accurate enough and cheap. Both keyed per client in Redis. Counter for scale, log for strict accuracy.

#### Code Example / Key Takeaways
```text
── THREE APPROACHES ──
   ┌──────────────────────────────────────────┐
   │ Fixed window: count/window → 2× burst at edge (cheap, inaccurate)
   ├──────────────────────────────────────────┤
   │ Sliding LOG: sorted set of timestamps      │
   │   count in [now-window, now] → accurate, heavy memory
   ├──────────────────────────────────────────┤
   │ Sliding COUNTER: weight(prev, cur) by overlap
   │   → accurate + cheap (recommended)         │
   └──────────────────────────────────────────┘
Keyed per client in Redis. Pick counter for scale, log for strict accuracy.
```

---

### Q85. Design a distributed lock.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Ensures only one process holds a resource across machines. **Redis `SET key value NX PX ttl`** (acquire if absent, TTL auto-releases a crashed holder); release only if you own it (compare value via Lua). Stronger: **ZooKeeper/etcd** (ephemeral nodes/leases + Raft). Include a **fencing token** (monotonic id) so a paused-then-resumed holder can't act after losing the lock. **Challenges**: TTL vs long tasks, clock skew, safety under GC pauses.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Process A   │
   └──────┬───────┘
     SET lock:res <A> NX PX 30000  (acquire if absent, TTL)
          ▼
   ┌──────────────┐
   │ Lock Store   │  (Redis / etcd / ZooKeeper)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ acquired   ▼ held by other
 ┌──────────┐ ┌──────────┐
 │do work + │ │ wait /   │
 │renew lease│ │ retry    │
 │+ FENCING │ │          │
 │TOKEN     │ └──────────┘
 └────┬─────┘
      ▼
   release: Lua → delete only if value == A
Fencing token prevents stale holder acting after lease loss. Crash → TTL frees lock.
```

---

### Q86. Design a leader-election system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Elect one coordinator among nodes so work isn't duplicated (single scheduler, write master). Nodes race to create an ephemeral lock/lease in a **coordination service** (ZooKeeper/etcd/Consul); the winner is leader and renews via heartbeat; if it dies, the lease expires and another node wins. Raft/Paxos underpin this. **Fencing tokens** prevent split-brain. **Challenges**: split-brain avoidance, failover speed, lease/heartbeat tuning.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  Node 1  │ │  Node 2  │ │  Node 3  │  race to acquire lease
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        └───────┬────┴────────────┘
                ▼
        ┌──────────────┐
        │Coordination  │  ephemeral lease (etcd/ZooKeeper, Raft)
        │Service       │
        └──────┬───────┘
          winner
                ▼
        ┌──────────────┐
        │  LEADER      │  heartbeats to renew lease
        └──────┬───────┘
          leader dies → lease expires
                ▼
        ┌──────────────┐
        │ Re-election  │  another node wins (+ fencing token)
        └──────────────┘
```

---

### Q87. Design a distributed ID generator.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Generate unique, roughly time-ordered IDs across many nodes without per-ID coordination. Options: **UUID** (no coordination, random/large, not sortable), **DB auto-increment** (bottleneck/SPOF), **ticket server ranges** (each node gets a block), or **Snowflake** (64-bit: timestamp + machine id + sequence — sortable, high throughput, decentralized). Snowflake is the standard. **Challenges**: clock skew, coordination-free uniqueness, ordering.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Throughput: Snowflake = 4096 ids/ms/node × 1024 nodes = ~4B ids/sec
No coordination per id (local generation) → scales linearly

── OPTIONS (top → bottom) ──
   ┌──────────────────────────────────────┐
   │ UUID         → no coord, NOT sortable, 128-bit
   ├──────────────────────────────────────┤
   │ DB auto-inc  → simple, but SPOF/bottleneck
   ├──────────────────────────────────────┤
   │ Range alloc  → node reserves block [1000-1999], local
   ├──────────────────────────────────────┤
   │ SNOWFLAKE    → [timestamp|machineId|seq] local, sortable ✓
   └──────────────────────────────────────┘
Snowflake = decentralized + time-sortable + high throughput.
```

---

### Q88. Design Twitter Snowflake-like ID generation.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
A 64-bit ID = 1 sign bit + **41 bits timestamp** (~69 years) + **10 bits machine id** (1024 nodes) + **12 bits sequence** (4096 ids/ms/node). Each node: take current ms; if same ms as last, increment sequence (wait for next ms on overflow), else reset. Unique, time-sortable, ~4M ids/sec/node, no central coordination. **Challenges**: clock going backwards (reject/wait), machine-id assignment, epoch choice.

#### Code Example / Key Takeaways
```text
── 64-BIT LAYOUT ──
 ┌─┬───────────────────┬──────────┬────────────┐
 │0│ 41-bit timestamp  │10 machine│ 12 sequence│
 │ │ (ms since epoch)  │ id (1024)│ (4096/ms)  │
 └─┴───────────────────┴──────────┴────────────┘

── GENERATION FLOW (top → bottom) ──
   ┌──────────────┐
   │ now = ms     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ now == last? │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ yes        ▼ no
 ┌──────────┐ ┌──────────┐
 │seq++     │ │seq = 0   │
 │(overflow │ │last = now│
 │→wait ms) │ └──────────┘
 └────┬─────┘
      ▼
   id = (ts<<22) | (machineId<<12) | seq
Clock backwards → reject/wait. ~4M ids/sec/node, sortable.
```

---

### Q89. Design a service discovery system.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
A **registry** (HA, on etcd/Consul/ZooKeeper) stores instances (name → host:port + health). Instances **register** on startup + send **heartbeats**; the registry evicts non-reporting ones. Clients discover via query (client-side) or a router/DNS resolves (server-side). Replicate the registry (consensus); cache lookups (TTL). **Challenges**: registry availability (critical infra), stale entries, health accuracy, fast propagation.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Instance    │  (1) REGISTER {name, host:port, health} + heartbeat
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Registry    │  (HA, consensus-backed) — evicts dead instances
   │ name→[hosts] │
   └──────┬───────┘
          ▲ (2) query "healthy 'orders' instances?"
   ┌──────┴───────┐
   │   Caller     │  → [ip1, ip2] → load balance (cache w/ TTL)
   └──────────────┘
Client-side: caller queries + LBs. Server-side: LB/DNS resolves. (Eureka/Consul)
```

---

### Q90. Design a configuration service.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Centralized store for app/env config with **versioning**, **dynamic updates** (watch/poll), rollback, access control. Built on a consistent store (etcd/Consul/DB); clients cache locally + subscribe to changes so updates apply without redeploy. Read-heavy → cache + edge. **Challenges**: consistency/propagation, validation before apply, env overrides, secrets (Vault), audit.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Admin / API  │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Config Store │  versioned (rollback), validated, audited
   └──────┬───────┘
     watch/stream changes
          ▼
   ┌──────────────┐
   │Service + Local│  cache (fast reads; serve last-known if store down)
   │Cache          │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    Vault     │  (secrets — separate, encrypted)
   └──────────────┘
Dynamic refresh without redeploy.
```

---

### Q91. Design a centralized logging system.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Agents ship structured logs → **Kafka buffer** → processors (parse/enrich, add service + trace id) → searchable store (Elasticsearch/Loki) → UI (Kibana/Grafana). Kafka absorbs bursts. Index sharding, hot/warm/cold tiers, sampling. **Challenges**: huge write volume, retention cost, structured + correlatable logs, PII scrubbing, query performance.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   1M lines/sec × 500 B = ~43 TB/day → Kafka buffers, ES hot 7d, cold tier after

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Hosts + Agent │  (Filebeat/Fluentd)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    Kafka     │  (buffer, absorb bursts)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Processors  │  parse/enrich (+ trace id), scrub PII
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌────────────┐┌──────────────┐
 │Elasticsearch││Object Storage│
 │(hot, 7d)   ││(cold tier)   │
 └─────┬──────┘└──────────────┘
       ▼
 ┌────────────┐
 │Kibana/Grafana│  query by trace id
 └────────────┘
```

---

### Q92. Design a metrics collection system.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Services expose metrics; a collector **scrapes** (Prometheus pull) or receives **pushed** metrics → **time-series DB** → dashboard (Grafana) + alerting. Labels/tags for dimensions. TSDB with downsampling/retention tiers, federation/sharding, long-term storage (Thanos/Cortex/M3). **Challenges**: high cardinality (label explosion), storage cost, aggregation, SLO alerting.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Services    │  expose /metrics (counters, gauges, histograms)
   └──────┬───────┘
     scrape (pull) or push
          ▼
   ┌──────────────┐
   │ Prometheus   │  (+ Thanos/Cortex for long-term & scale)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Time-Series DB│  downsampling + retention tiers
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌────────┐ ┌──────────┐
 │Grafana │ │Alerting  │  (SLO-based)
 │(dash)  │ │          │
 └────────┘ └──────────┘
Watch: cardinality explosion (labels), storage cost.
```

---

### Q93. Design a distributed tracing system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Instrument services to generate **spans** linked by a **trace id** propagated across calls (W3C `traceparent`). Spans exported (OpenTelemetry) → collector → storage (Jaeger/Tempo) → UI (end-to-end trace + per-hop latency). **Sampling** (head/tail) controls volume; async export. **Challenges**: context propagation (sync/async), sampling strategy, clock skew, storage cost. Correlate with logs/metrics via trace id.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Edge / API  │  generate trace id (traceparent)
   └──────┬───────┘
     propagate id on every call
          ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ Service A    │─►│ Service B    │─►│ Service C    │
   │ span         │  │ span (child) │  │ span (child) │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          └──────── export spans ─────────────┘
                ▼
        ┌──────────────┐
        │  Collector   │  (OpenTelemetry) + SAMPLING (head/tail)
        └──────┬───────┘
                ▼
        ┌──────────────┐
        │Jaeger/Tempo  │  → UI (latency waterfall)
        └──────────────┘
Correlate with logs/metrics by trace id.
```

---

### Q94. Design an event-driven architecture.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Components communicate by producing/consuming **events** via a broker (Kafka) rather than direct calls — loose coupling, scalability, real-time reactions. Producers emit domain events (past tense, immutable, versioned); consumers react + may emit their own. Patterns: notification, state transfer, event sourcing, CQRS. **Challenges**: eventual consistency, idempotent/order-tolerant consumers, schema versioning, observability across async hops.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Producer    │  emit domain event (OrderPlaced)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Broker (Kafka)│
   └──────┬───────┘
   ┌──────┼──────────┬───────────┐
   ▼      ▼          ▼           ▼
┌──────┐┌──────┐┌────────┐┌──────────┐
│Payment││Invent││Notify  ││Analytics │  independent consumers
│       ││ory   ││        ││          │  (react + may emit events)
└──────┘└──────┘└────────┘└──────────┘
Add consumers freely (loose coupling). Idempotent + order-tolerant. Trace async hops.
```

---

### Q95. Design a publish-subscribe system.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Publishers send to **topics** without knowing subscribers; the broker delivers each message to **all** subscribers (fan-out). Core: topic registry, subscription management, delivery (push/pull) + acks/retries. Partition topics for parallelism, replicate for HA, buffer for slow subscribers. **Challenges**: delivery guarantees (at-least-once + idempotency), slow/failed subscribers (backpressure, DLQ), ordering, durable vs ephemeral subs.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Publisher   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Broker (topic,│  partitioned + replicated
   │ subscriptions)│
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────────┐
│Sub A ││Sub B ││Sub C     │  ALL receive (fan-out) + ack/retry
└──────┘└──────┘└──────────┘
Slow sub → backpressure/DLQ. (Kafka/Google Pub/Sub)
```

---

### Q96. Design a message broker.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Accepts messages, stores durably, delivers with guarantees. Core: **queues/topics**, durable storage (append log or persistent queue), **partitioning** (scale), **replication** (HA), consumer tracking (offsets/acks), routing (exchanges). Delivery semantics (at-least-once), retries, DLQ, backpressure. **Challenges**: durability vs throughput, ordering, exactly-once, failover. Decide log (streaming) vs queue (routing) model first.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Producers   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │   Broker     │  durable store (log or queue)
   │  ┌────────┐  │  partitioned + replicated (HA)
   │  │Partition│ │  routing, offsets/acks, DLQ, backpressure
   │  └────────┘  │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Consumers   │  (offsets/acks, at-least-once)
   └──────────────┘
Decide model: log/streaming (Kafka) vs smart-routing queue (RabbitMQ).
```

---

### Q97. Design a Kafka-like system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Topics as **partitioned append-only logs**; producers append to a partition (by key hash) on the **leader broker**; partitions **replicated** to followers (ISR); consumers **pull** by offset within **consumer groups** (one consumer/partition). Retain by time/size (replayable). Metadata/leadership via controller (Raft/KRaft). **Challenges**: ordering (per partition), replication + leader election, offsets, high-throughput sequential I/O + zero-copy, exactly-once.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Producer    │  hash(key) → partition
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Leader Broker │  append to partition log
   │  (partition) │
   └──────┬───────┘
     replicate to ISR
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Follower 1││Follower 2│  (ISR — durability)
└──────────┘└──────────┘
          ▲ pull by offset
   ┌──────┴───────┐
   │Consumer Group│  1 consumer / partition; retain → replay
   └──────────────┘
Controller (KRaft) = metadata/leaders. Ordering per partition.
```

---

### Q98. Design a RabbitMQ-like system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
A **smart broker** with **exchanges** (direct/topic/fanout/headers) routing messages to bound **queues**; consumers subscribe + ack; unacked/failed → requeue or **DLQ**. Push to consumers (competing consumers per queue), delete on ack. Durability (persistent queues), clustering + mirrored queues (HA), flow control. **Challenges**: routing flexibility vs throughput, ordering, ack/redelivery correctness, HA.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Producer    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  EXCHANGE    │  (direct/topic/fanout/headers)
   └──────┬───────┘
     bindings route to queues
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Queue1││Queue2││ DLQ  │  (unacked → requeue/DLQ)
└──┬───┘└──┬───┘└──────┘
   ▼       ▼
┌──────┐┌──────┐
│Consumer│Consumer  push + delete-on-ack (competing)
└──────┘└──────┘
Rich routing vs Kafka's log/replay. HA: mirrored queues.
```

---

### Q99. Design a dead-letter queue system.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Captures messages that repeatedly fail (after bounded retries) so they don't block the main queue/partition. On failure, increment an attempt counter; once exhausted, route the message + failure context (original topic, error, timestamp) to a **DLQ** for investigation. Provide a **replay** path after fixing the cause. **Challenges**: transient vs permanent failures, no infinite retries, alerting on DLQ growth, safe curated replay.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Consumer    │  process message
   └──────┬───────┘
     fail?
          ▼
   ┌──────────────┐
   │ retries left?│  (bounded, backoff)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ yes        ▼ no (exhausted)
 ┌──────────┐ ┌──────────────┐
 │ retry    │ │   DLQ        │  + error context (orig topic/offset/error)
 │          │ │ (main flow   │
 └──────────┘ │  unblocked)  │
              └──────┬───────┘
                     ▼
              ┌──────────────┐
              │Alert + Replay│  fix cause → dedup + rate-limit replay
              └──────────────┘
```

---

### Q100. Design a retry queue.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
For transient failures, republish to a **retry queue/topic** with a delay, then reprocess (non-blocking). **Tiered retry topics** with increasing delays (5s, 1m, 10m) so a failing message doesn't block the main partition; after exhausting tiers → DLQ. Track attempt count. **Challenges**: implementing delay, avoiding retry storms (backoff + jitter), idempotent processing (retries duplicate).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Main Topic   │
   └──────┬───────┘
     transient fail
          ▼
   ┌──────────────┐
   │ retry.5s     │  (delay, reprocess)
   └──────┬───────┘  fail
          ▼
   ┌──────────────┐
   │ retry.1m     │
   └──────┬───────┘  fail
          ▼
   ┌──────────────┐
   │ retry.10m    │
   └──────┬───────┘  exhausted
          ▼
   ┌──────────────┐
   │    DLQ       │
   └──────────────┘
Non-blocking (main keeps flowing). Idempotent processing; backoff + jitter.
```

---

### Q101. Design a delayed message system.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Deliver a message only after a delay / at a future time. Approaches: **delay queue** (SQS delay, RabbitMQ TTL + DLX), **scheduled store** (Redis sorted set keyed by delivery time, poller dispatches due), or a timing-wheel. Kafka (no native delay) → per-delay topics or external scheduler. Shard by time bucket. **Challenges**: timing accuracy, scale of pending, exactly-once dispatch, clock reliability.

#### Code Example / Key Takeaways
```text
── FLOW (Redis sorted-set approach, top → bottom) ──
   ┌──────────────┐
   │  Producer    │  ZADD delayed <deliverAt> <msg>
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Redis Sorted  │  score = deliverAt (sharded by time bucket)
   │Set           │
   └──────┬───────┘
     poller (every 1s)
          ▼
   ┌──────────────┐
   │  Poller      │  ZRANGEBYSCORE 0..now → dispatch → ZREM
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Downstream    │
   └──────────────┘
Alt: SQS delay / RabbitMQ TTL+DLX / timing wheel / per-delay Kafka topics.
```

---

### Q102. Design an exactly-once processing system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
True end-to-end exactly-once is hard; achieve exactly-once **effects** via at-least-once delivery + **idempotency**. Within Kafka: **transactions** (idempotent producer + transactional offset commits + read_committed). For external side effects: **idempotency keys** + dedup store, or the **outbox pattern**. **Challenges**: no distributed magic — make operations idempotent or use transactions within one system; cross-system → dedup at the sink.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Message     │  (unique event id)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Consumer     │
   └──────┬───────┘
     seen event id?
          ▼
   ┌──────────────┐
   │ Dedup Store  │  (unique constraint)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ new        ▼ duplicate
 ┌──────────┐ ┌──────┐
 │process + │ │ skip │
 │record id │ │      │
 └──────────┘ └──────┘
Kafka-internal: transactions (idempotent producer + tx offsets + read_committed).
External: idempotency key / outbox. Exactly-once EFFECTS, not magic.
```

---

### Q103. Design an idempotent payment API.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Client sends a unique **Idempotency-Key** per attempt. Server: in a transaction, insert the key (unique constraint); if new → process + store result; if it exists → **return stored result** without charging again. Makes retries (timeouts, network) safe — no double charge. **Challenges**: atomic key-insert + charge, in-progress duplicates (lock/"processing"), key TTL, provider-side idempotency alignment.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Client      │  (+ Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Payment API   │  INSERT key (unique, transactional)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ new        ▼ exists
 ┌──────────┐ ┌──────────────┐
 │charge +  │ │return stored │  (no re-charge)
 │store     │ │result        │
 │result    │ └──────────────┘
 └──────────┘
In-progress dup → lock / "processing". Align with provider idempotency.
```

---

### Q104. Design an idempotent API gateway.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
The gateway deduplicates at the edge: for requests with an **Idempotency-Key**, check a shared store (Redis) — if seen, return the cached response; else forward to backend, then cache the response (with TTL). Protects non-idempotent backends from client retries centrally. **Challenges**: only cache idempotent-eligible methods, concurrent duplicates (lock), key scoping (per endpoint/user), TTL vs correctness.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Client      │  (+ Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ API Gateway  │  check Redis for key
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ cached     ▼ new
 ┌──────────┐ ┌──────────────┐
 │return    │ │forward → back│
 │cached    │ │end → cache   │
 │response  │ │response (TTL)│
 └──────────┘ └──────────────┘
Lock on concurrent dup. Scope key per endpoint/user.
```

---

### Q105. Design a distributed scheduler.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Schedule and dispatch jobs reliably across nodes at scale. Store jobs with `next_run_at` (indexed); scheduler instances **atomically claim** due jobs (`SELECT ... FOR UPDATE SKIP LOCKED` or distributed lock/leader) to avoid double-dispatch, then enqueue to workers. Track status + retries; handle missed runs. **Challenges**: exactly-once dispatch, HA (no scheduler SPOF), clock sync, hotspots at popular times.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Jobs:   10M scheduled; ~100k fire/min = ~1,700/sec; index on next_run_at

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Job DB     │  Job(next_run_at, status), index(next_run_at)
   └──────┬───────┘
     poll due (atomic claim)
          ▼
   ┌──────────────┐
   │ Schedulers   │  FOR UPDATE SKIP LOCKED (no double-dispatch)
   │ (N replicas) │
   └──────┬───────┘
     enqueue
          ▼
   ┌──────────────┐
   │    Queue     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │   Workers    │  execute → status; retries + missed-run catch-up
   └──────────────┘
```

---

### Q106. Design a cron-job platform.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Multi-tenant cron: users define cron expressions; the platform computes each job's next fire time; a distributed scheduler dispatches due jobs to isolated workers, tracking history + retries. Store `{cron, next_run_at, owner}`; recompute after each run. Atomic claim / leader election → no duplicate fires. **Challenges**: exactly-once firing, tenant isolation + quotas, missed-run policy, TZ/DST, observability, scale.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  User (cron  │  define "0 9 * * *"
   │  expression) │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Job Store   │  {cronExpr, next_run_at, owner}
   └──────┬───────┘
     scheduler claims due (atomic → no duplicate fire)
          ▼
   ┌──────────────┐
   │  Scheduler   │  after run → recompute next_run_at + record history
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Isolated      │  (tenant quotas / bulkheads)
   │Workers       │
   └──────────────┘
TZ/DST handling; missed-run catch-up vs skip.
```

---

### Q107. Design a workflow orchestration system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Coordinate multi-step, long-running workflows with dependencies, retries, compensation. A central **orchestrator** runs a workflow definition (DAG/state machine), persisting state after each step (resumable), invoking activities with retries + timeouts; compensation (Saga) on failure. Partition workflows, durable state store, worker pools. **Challenges**: durable state + exactly-once steps, long-running timers, versioning definitions, visibility. (Temporal, Step Functions.)

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Orchestrator │  runs DAG / state machine
   └──────┬───────┘
     persist state after each step (resumable)
          ▼
   ┌──────────────┐
   │  Step 1      │──► activity (retry/timeout)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Step 2      │──► activity
   └──────┬───────┘
     failure?
          ▼
   ┌──────────────┐
   │ Compensate   │  (Saga: undo prior steps)
   └──────────────┘
Durable state store; versioned definitions. (Temporal/Step Functions)
```

---

### Q108. Design a distributed task queue.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Producers enqueue tasks to a broker (Redis/RabbitMQ/Kafka/SQS); a pool of **workers** consume + process concurrently, scaling horizontally (competing consumers). Track status, retries + DLQ, priorities, delayed tasks. Partition/shard the queue; add workers up to partition count. **Challenges**: at-least-once + idempotent tasks, priorities, backpressure, visibility timeout (redeliver on crash), monitoring queue depth. (Celery/Sidekiq/BullMQ.)

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Producers   │  enqueue task
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Queue/Broker  │  (priorities, delayed, DLQ)
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Worker││Worker││Worker│  competing consumers (scale out)
└──────┘└──────┘└──────┘
Visibility timeout → redeliver if worker dies. Idempotent tasks. Monitor depth.
```

---

### Q109. Design a background-job processing system.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Offload slow/async work (emails, image processing, reports) from the request path: enqueue → workers process later → update status. Job persistence, retries + backoff, DLQ, scheduling/delays, progress tracking. Horizontal workers, priority queues, resource isolation (bulkheads per job type). **Challenges**: idempotency, long jobs (checkpointing), failure isolation, observability, graceful shutdown.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Request     │  enqueue job → respond NOW
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Job Queue   │  (per job type — bulkheads)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Workers     │  process async → update status
   └──────┬───────┘
     fail → retries/backoff → DLQ
          ▼
   ┌──────────────┐
   │Status + Progress│  checkpoint long jobs; graceful shutdown
   └──────────────┘
```

---

### Q110. Design a webhook delivery system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Deliver event notifications to customer HTTP endpoints reliably. On an event, enqueue a delivery job; workers POST the payload (HMAC-signed), expect 2xx, and on failure **retry with exponential backoff** up to N attempts, then DLQ + alert. Store attempts/status; support replay. Queue + worker pool, per-endpoint rate limiting. **Challenges**: unreliable endpoints (retries, circuit-break), ordering, at-least-once + idempotency (send event id), SSRF protection, delivery monitoring.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Events:  100M webhooks/day = ~1,160/sec; retries multiply attempts

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Event       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Delivery Queue│
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Workers     │  POST (HMAC-signed) → expect 2xx
   └──────┬───────┘
     fail → retry (exp backoff, N attempts)
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Customer      │        │DLQ + Alert   │  (exhausted)
   │Endpoint      │        └──────────────┘
   └──────────────┘
Send event id (customer dedup); per-endpoint rate limit; SSRF guard; replay.
```

---

### Q111. Design a webhook retry mechanism.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
On failed delivery (non-2xx/timeout), schedule a retry with **exponential backoff + jitter** (1m, 5m, 30m, 2h, 6h) up to a max, via a delayed/scheduled queue. Track attempt count + next-attempt time. After exhausting retries → failed → DLQ + notify (offer manual replay). **Circuit-break** persistently-down endpoints. **Challenges**: delayed retries, idempotency (event id), retry storms, customer visibility/replay.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Delivery Fail│  (non-2xx / timeout)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Schedule Retry│  exp backoff + jitter: 1m → 5m → 30m → 2h → 6h
   │(delayed queue)│
   └──────┬───────┘
     exhausted?
          ▼
   ┌──────────────┐
   │Failed → DLQ  │  + notify + manual replay
   └──────────────┘
Circuit-break dead endpoints. Send event id → customer dedup.
```

---

### Q112. Design an API gateway for microservices.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Single entry point: routing (via service discovery), **authN/authZ** (JWT), **rate limiting**, TLS, request/response transformation, aggregation, caching, observability. Deploy **horizontally scaled + HA** behind an LB (no SPOF). **Challenges**: keep it thin, latency overhead (one hop), bottleneck risk (scale it), consistent auth, versioning/routing, resilience (circuit breakers to backends).

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Load Balancer │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ API Gateway  │  authN/Z, rate limit, TLS, transform, aggregate, cache
   │ (scaled, HA) │  emits logs/traces/metrics
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────────┐
│order ││user  ││payment   │  (via discovery; circuit-break)
│svc   ││svc   ││svc       │
└──────┘└──────┘└──────────┘
Keep thin (no business logic); version routes.
```

---

### Q113. Design a Backend-for-Frontend (BFF) architecture.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
A dedicated backend per client type (web, iOS, Android) that **aggregates and shapes** data for that frontend — trimming fields, batching calls, adapting to device — so clients make one tailored call. Each BFF owned by the frontend team. **Benefits**: optimized payloads, fewer round-trips, independent iteration. **Challenges**: duplicated aggregation across BFFs, keep BFFs thin, versioning per client.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────┐  ┌──────────┐
   │Mobile App│  │ Web App  │
   └────┬─────┘  └────┬─────┘
        ▼             ▼
   ┌──────────┐  ┌──────────┐
   │Mobile BFF│  │ Web BFF  │  (aggregate + shape per client)
   └────┬─────┘  └────┬─────┘
        └──────┬──────┘
               ▼
   ┌──────────────────────────┐
   │ user-svc, order-svc,     │
   │ promo-svc                │
   └──────────────────────────┘
One tailored call, trimmed payload. Each BFF owned by its frontend team.
```

---

### Q114. Design a service mesh architecture.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Handles service-to-service comms via **sidecar proxies** (Envoy) next to each service, moving cross-cutting concerns — mTLS, retries, timeouts, circuit breaking, load balancing, canary, telemetry — out of app code into the platform, configured declaratively. A **control plane** configures the **data plane** (sidecars). **Benefits**: consistent, language-agnostic resilience/security/observability. **Challenges**: complexity, per-hop latency, ops overhead. (Istio/Linkerd.)

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Control Plane │  (Istio) — configures sidecars declaratively
   └──────┬───────┘
     push config
   ┌──────┴─────────────┐
   ▼                    ▼
┌──────────────┐  ┌──────────────┐
│ Service A    │  │ Service B    │
│ ┌──────────┐ │  │ ┌──────────┐ │
│ │Envoy     │◄┼──┼►│Envoy     │ │  sidecars: mTLS, retries, circuit
│ │sidecar   │ │  │ │sidecar   │ │  breaking, LB, telemetry
│ └──────────┘ │  │ └──────────┘ │
└──────────────┘  └──────────────┘
No app code changes. Cost: complexity + per-hop latency.
```

---

### Q115. Design a circuit-breaker service.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Wrap calls with a state machine tracking failures: **Closed** (calls pass, count failures/slow calls in a window), **Open** (threshold crossed → short-circuit to fallback for a cooldown), **Half-Open** (a few trial calls; success → Closed, failure → Open). Emit metrics, provide fallbacks. **Challenges**: threshold/window tuning, per-dependency isolation, distributed vs per-instance state, combining with retries/bulkheads. (Resilience4j/Hystrix.)

#### Code Example / Key Takeaways
```text
── STATE MACHINE (flow) ──
   ┌──────────────┐
   │   CLOSED     │  calls pass; count failures in window
   └──────┬───────┘
     failure rate > threshold
          ▼
   ┌──────────────┐
   │    OPEN      │  fail fast → fallback (cooldown)
   └──────┬───────┘
     after cooldown
          ▼
   ┌──────────────┐
   │  HALF-OPEN   │  allow trial calls
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ success    ▼ fail
 ┌──────┐    ┌──────┐
 │CLOSED│    │ OPEN │
 └──────┘    └──────┘
Per-dependency breaker + fallback + metrics.
```

---

### Q116. Design a distributed configuration cache.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Cache config locally in each service instance for **low-latency reads**, synced with a central store via **watch/subscribe** (push) or short-TTL polling. On change, the store notifies subscribers, which update their local cache atomically. **Benefits**: no per-read network call, resilience (serve last-known if store down). **Challenges**: propagation speed/consistency, versioning (atomic apply), validation, store outages (stale-but-available).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Central Config│  (source of truth)
   │Store         │
   └──────┬───────┘
     push / watch changes
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Inst A││Inst B││Inst C│  each: LOCAL cache (atomic swap on change)
│cache ││cache ││cache │
└──────┘└──────┘└──────┘
Reads hit local cache (fast). Store down → serve last-known (resilient).
```

---

### Q117. Design a global traffic routing system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Route users to the best region using **GeoDNS** or **anycast** (nearest by topology), with **health-aware** routing (fail away from unhealthy regions) and **weighted** routing (canary, migration). A global LB (Route 53 + accelerators) considers latency, geography, health. **Challenges**: failover speed (DNS TTL vs anycast), latency-routing accuracy, data locality/consistency, sticky routing, DDoS absorption.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │   User       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │GeoDNS/Anycast│  latency + geo + health + weights
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Region││Region││Region│  (unhealthy → traffic fails away)
│ US   ││ EU   ││ APAC │
└──────┘└──────┘└──────┘
Weighted routing for canary/migration. DDoS absorbed at edge.
```

---

### Q118. Design a multi-region application.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Deploy the full stack in multiple regions for low latency + resilience; route users to the nearest healthy region. The hard part is **data**: active-passive (one write region + async replication) or active-active (multi-region writes + conflict resolution); per-dataset consistency (strong for money, eventual for feeds). Replicate DBs cross-region; regional caches. **Challenges**: replication lag, cross-region consistency/conflicts, failover (RPO/RTO), data residency, cost.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Global Routing│  → nearest healthy region
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Region US ││Region EU │  full stack each (services + cache + DB)
│ ┌──────┐ ││ ┌──────┐ │
│ │ DB   │◄┼┼►│ DB   │ │  cross-region replication
│ └──────┘ ││ └──────┘ │
└──────────┘└──────────┘
Data: active-passive OR active-active. Per-dataset consistency (money=strong).
```

---

### Q119. Design an active-active architecture.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
All regions serve **reads and writes** simultaneously — max availability, low latency (local writes), no idle capacity. Needs **multi-master data**: conflict resolution (LWW, CRDTs, app-merge), per-region write acceptance, async cross-region replication. Best for eventually-consistent data; for money, pin each account to a home region. **Challenges**: write conflicts, replication lag, global invariants, split-brain.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Global Routing│  users → nearest region (both R + W)
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐   ┌──────────┐
│Region A  │◄─►│Region B  │  BOTH accept writes (multi-master)
│(R + W)   │   │(R + W)   │  async replication + conflict resolution
└──────────┘   └──────────┘
Conflicts: LWW / CRDT / app-merge. Money → pin account to home region.
```

---

### Q120. Design an active-passive architecture.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
One **active** (primary) region serves all traffic; a **passive** (standby) region replicates + waits to take over. Simpler than active-active (single writer → no conflicts), but idle standby + failover downtime (RPO = replication lag; RTO = failover time). Warm standby for faster failover. **Challenges**: failover automation + testing, replication lag (RPO), cutover speed (RTO), split-brain avoidance.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Global Routing│  → active region
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Active Region │  serves ALL traffic (single writer)
   │ (primary)    │
   └──────┬───────┘
     async replicate
          ▼
   ┌──────────────┐
   │Passive Region│  standby (replicates, waits)
   │ (warm)       │
   └──────────────┘
Failover → promote passive. RPO = lag; RTO = failover time. Test DR!
```

---

### Q121. Design database failover.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Detect primary failure (health checks), then **promote a replica** to primary and repoint clients (via proxy/DNS/discovery, not hardcoded IPs). Semi-sync replication to a standby minimizes data loss. Automate with a manager (Patroni, RDS Multi-AZ, Orchestrator) that handles election + prevents **split-brain** (fence the old primary). **Challenges**: split-brain, async data loss, fast repointing, tested automation.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Health Monitor│  (Patroni/RDS) detects primary failure
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │FENCE old     │  (prevent split-brain)
   │primary       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Promote replica│  → new primary
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Repoint clients│  (proxy/DNS/discovery, NOT hardcoded IPs)
   └──────────────┘
Semi-sync replica minimizes data loss.
```

---

### Q122. Design database replication.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Copy data from a primary to replicas for HA + read scaling. **Synchronous**: wait for replica ack (no loss, higher latency); **asynchronous**: return immediately (fast, may lag/lose); **semi-sync**: wait for ≥1 replica (balance). WAL/binlog shipping. Route writes→primary, reads→replicas. **Challenges**: replication lag (stale reads, read-your-writes), failover, multi-master conflicts, lag monitoring.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Writes      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │   PRIMARY    │  ships WAL/binlog
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Replica 1 ││Replica 2 │  serve READS
└──────────┘└──────────┘
Sync (no loss, slow) | async (fast, lag) | semi-sync (balance). Monitor lag.
```

---

### Q123. Design read replicas.
**Difficulty:** `Intermediate`
**Category:** Distributed Systems

#### Answer
Add replica DBs that asynchronously copy the primary and serve **read-only** traffic, scaling reads + offloading analytics/backups. A routing layer sends writes→primary, reads→replicas (load-balanced). Handle **replication lag**: for read-your-writes, route a user's reads to primary briefly after a write. **Challenges**: staleness, routing logic, lag monitoring, rebalancing read load.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Router/Proxy  │  writes → primary ; reads → replicas
   └──────┬───────┘
   ┌──────┴──────┐
   ▼ writes      ▼ reads (load-balanced)
┌──────────┐┌──────────────┐
│ PRIMARY  ││Replica 1..N  │  (+ analytics/backups)
└──────────┘└──────────────┘
Read-your-writes: pin user to primary briefly post-write. Monitor lag.
```

---

### Q124. Design database sharding.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Partition data across independent DBs by a **shard key** to scale writes/storage. Strategies: **hash** (even spread), **range** (range queries, hotspot risk), **directory** (flexible lookup), **consistent hashing** (minimal reshuffle). A router maps keys→shards; each shard replicated. **Challenges**: high-cardinality/even-access shard key; **hot shards**; cross-shard queries/joins/txns; resharding/rebalancing.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Shard Router  │  shard = f(shard_key)
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Shard1││Shard2││Shard3│  each replicated (HA)
│(A-H) ││(I-P) ││(Q-Z) │
└──────┘└──────┘└──────┘
Strategy: hash | range | directory | consistent hash. Avoid cross-shard JOIN/txn.
```

---

### Q125. Design consistent hashing.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Map both nodes and keys onto a hash ring; a key is owned by the first node **clockwise** from its hash. Adding/removing a node only remaps keys between it and its neighbor (≈1/N), vs `hash % N` which remaps almost everything. **Virtual nodes** (many ring positions per physical node) give even distribution + smooth rebalancing. Used in caches, sharded DBs, LBs. **Challenges**: even distribution (vnodes), replication (next K nodes), churn.

#### Code Example / Key Takeaways
```text
── HASH RING (clockwise ownership) ──
              0/360°
          ┌─────────┐
     NodeC│    •keyX│ → owned by first node clockwise (NodeA)
          │ •NodeA  │
   270° ──┤         ├── 90°
          │  NodeB• │
          │•keyY    │
          └─────────┘
             180°
Add/remove node → only ~1/N keys move (vs hash%N remaps all).
Virtual nodes → even spread. Replicas = next K distinct nodes.
```

---

### Q126. Design a shard rebalancing system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
When shards become uneven (hot shards) or capacity changes, redistribute data with **minimal movement + no downtime**. Use consistent hashing (or shard-map) so only affected ranges move; migrate in background (copy → dual-write/verify → cut over routing → delete old), throttled. **Challenges**: online migration, consistency during move (dual-write), avoiding rebalance hotspots, atomic routing update.

#### Code Example / Key Takeaways
```text
── MIGRATION FLOW (top → bottom) ──
   ┌──────────────┐
   │Detect hot/   │  imbalance → pick key ranges to move
   │imbalanced    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Copy data     │  (background, throttled)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Dual-write +  │  keep old + new consistent
   │verify        │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Switch routing│  (atomic) → drop old
   └──────────────┘
No downtime; consistency during move.
```

---

### Q127. Design a distributed counter.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Counting at scale (likes, views) with a single row is a write hotspot. Solutions: **sharded counters** (N sub-counters, increment a random shard, sum on read), **Redis INCR** (atomic, shard by key), or **approximate** (HyperLogLog for uniques, or Kafka-buffered increments flushed in batches). Trade exactness/latency for throughput. **Challenges**: write contention (sharding), read cost (sum shards / cached total), eventual consistency, hot keys.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Hot item:  100k likes/min = ~1,700/sec on ONE counter → shard into N sub-counters

── ARCHITECTURE (sharded counter) ──
   ┌──────────────┐
   │  Increment   │  → random of N shards
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Shard0││Shard1││ShardN│  (Redis INCR — no single-row contention)
└──────┘└──────┘└──────┘
   read = SUM(shards)  (or cached total)
Approximate: HyperLogLog (uniques) / Kafka-buffered batched flush.
```

---

### Q128. Design a distributed sequence generator.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Generate monotonic/unique sequences without a single-row bottleneck. Options: **range allocation** (each node reserves a block from a central allocator, serves locally, refills when low), **Snowflake** (time-ordered, decentralized), or **DB sequence** (simple, bottleneck at scale). Strict global monotonicity needs coordination (bottleneck); for scale relax to "unique + roughly ordered." **Challenges**: contention vs strict ordering, gaps (range blocks), coordinator HA.

#### Code Example / Key Takeaways
```text
── RANGE ALLOCATOR (flow) ──
   ┌──────────────┐
   │Central       │  hands out blocks
   │Allocator     │
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Node A    ││Node B    │
│block     ││block     │  serve ids locally (refill when low)
│[1000-1999]││[2000-2999]│
└──────────┘└──────────┘
Rare coordination. Strict global monotonic → needs coordination (bottleneck).
Alt: Snowflake (time-ordered, decentralized). Blocks leave gaps.
```

---

### Q129. Design a distributed semaphore.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
Limit concurrent access to **N permits** across a cluster (e.g. max 10 workers hitting an API). Maintain a permit count in a coordination store: acquire = atomically decrement if >0 (with a **TTL/lease** so a crashed holder auto-releases); release = increment. Redis (Lua) or ZooKeeper/etcd. **Challenges**: atomicity, leaked permits (leases + reconciliation), fairness/queuing, thundering herd on release.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Worker      │  acquire permit
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Permit Store  │  atomic: if count>0 → count-- + lease TTL
   │(count = N)   │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ got permit ▼ none
 ┌──────────┐ ┌──────┐
 │do work → │ │ wait │
 │release   │ │/queue│
 │(count++) │ └──────┘
 └──────────┘
Crash → lease expires → permit reclaimed. (Redis Lua / etcd)
```

---

### Q130. Design a distributed lease system.
**Difficulty:** `Hard`
**Category:** Distributed Systems

#### Answer
A lease grants time-bounded ownership of a resource (lock, leadership, partition) that **auto-expires** unless renewed via heartbeat — so a crashed holder's lease lapses and others take over. Store `{resource, owner, expiry}` in a consistent store (etcd/ZooKeeper); owner renews before expiry; on expiry, resource is free. Pair with **fencing tokens** so a paused holder can't act after its lease lapsed. **Challenges**: clock skew, renewal timing, split-brain (fencing).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Client A    │  acquire lease {resource, A, expiry}
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Lease Store   │  (etcd/ZooKeeper)
   └──────┬───────┘
     A renews via heartbeat before expiry
          ▼
   ┌──────────────┐
   │ A crashes    │  → no renewal → lease expires
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Client B      │  acquires freed lease (+ fencing token)
   └──────────────┘
Fencing token → stale holder can't act after lease loss.
```

---
