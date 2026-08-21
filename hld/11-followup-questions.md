# HLD — Interview Follow-Up Questions (Q301–Q350)

*The questions interviewers ask about almost any system-design problem. Learn to answer these for every design.*

---

### Q301. What are the functional requirements?
**Difficulty:** `Basic`
**Category:** Follow-Up Questions

#### Answer
Functional requirements define **what the system does** — the features and behaviors (e.g. for a URL shortener: shorten a URL, redirect, custom aliases, analytics). Clarify them first to scope the design and avoid over/under-building. In an interview, list the core features and explicitly **defer** out-of-scope ones ("I'll focus on shorten + redirect; analytics is out of scope for now"). This drives the API and data model.

#### Code Example / Key Takeaways
```text
Functional = WHAT it does (features/behaviors). List core features + defer non-core explicitly.
URL shortener: create short link, redirect, (optional) custom alias, expiry, analytics.
Drives the API surface + data model. Always clarify before designing.
```

---

### Q302. What are the non-functional requirements?
**Difficulty:** `Basic`
**Category:** Follow-Up Questions

#### Answer
Non-functional requirements define **how well** the system performs: scalability (RPS/users), availability (nines), latency (p99), consistency, durability, security, and cost. These drive the architecture far more than features do — a URL shortener that's read-heavy at 100k RPS with 99.99% availability needs caching, replication, and CDN. Always quantify them (numbers, not "fast"/"scalable").

#### Code Example / Key Takeaways
```text
Non-functional = HOW WELL: scalability (RPS/users), availability (nines), latency (p99),
   consistency, durability, security, cost. QUANTIFY (numbers, not adjectives).
These drive architecture more than features. Clarify early.
```

---

### Q303. What assumptions are you making?
**Difficulty:** `Basic`
**Category:** Follow-Up Questions

#### Answer
State assumptions explicitly to bound the problem and show reasoning: scale (users, RPS), read/write ratio, data size, growth, and constraints (budget, latency, regions). E.g. "Assume 100M users, 10:1 read:write, ~1KB per record, single-region to start." Assumptions let you do capacity estimation and justify choices; the interviewer will correct you if they differ, which is fine — it shows structured thinking.

#### Code Example / Key Takeaways
```text
State assumptions to bound the problem: users, RPS, read:write, data size, growth, constraints.
E.g. "100M users, 10:1 read:write, 1KB/record, single-region first."
Enables capacity math + justifies choices; interviewer corrects if needed.
```

---

### Q304. How many users (scale)?
**Difficulty:** `Basic`
**Category:** Follow-Up Questions

#### Answer
Establish the user scale to size everything downstream. Distinguish total registered users vs concurrent/active. A system for 1M users differs vastly from 1B (single-region + one DB vs multi-region + sharding + CDN). Ask for the number (or assume one) and derive DAU/MAU, RPS, and storage from it. Scale is the primary driver of architectural complexity.

#### Code Example / Key Takeaways
```text
Total users vs concurrent/active. 1M -> simple (single region, one DB); 1B -> sharding + multi-region + CDN.
Derive DAU/MAU -> RPS -> storage. Scale = primary driver of complexity. Ask or assume a number.
```

---

### Q305. What is the DAU/MAU?
**Difficulty:** `Basic`
**Category:** Follow-Up Questions

#### Answer
DAU (Daily Active Users) / MAU (Monthly Active Users) measure real load, not just registrations. They drive RPS and storage estimates. E.g. 100M DAU, each doing 10 actions/day → 1B requests/day → ~11.5k RPS average (and 2-5× at peak). Use DAU × actions-per-user to estimate request volume, and DAU × data-per-user for storage growth. Active users, not total, determine capacity.

#### Code Example / Key Takeaways
```text
DAU/MAU = real load. 100M DAU × 10 actions/day = 1B req/day ≈ 11.5k RPS avg (peak 2-5×).
Requests ≈ DAU × actions/user. Storage growth ≈ DAU × data/user. Size capacity from active users.
```

---

### Q306. How many requests per second (RPS)?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Estimate average RPS = total daily requests ÷ 86,400 seconds. E.g. 1B requests/day ÷ 86,400 ≈ 11.5k RPS average. This sizes your service fleet, database, and caching. Always compute peak too (see next) — average RPS under-provisions. RPS drives horizontal scaling (how many stateless instances), DB throughput (reads/writes per sec), and cache sizing.

#### Code Example / Key Takeaways
```text
Avg RPS = daily requests / 86,400. 1B/day ≈ 11.5k RPS avg.
Sizes: service fleet, DB throughput, cache. Always also compute PEAK (avg under-provisions).
```

---

### Q307. What is the peak RPS?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Peak RPS is what you must actually provision for — it's typically **2-5× (or more) the average** due to daily cycles, time zones, and events (flash sales, viral moments can spike 10-100×). Size capacity + autoscaling headroom for peak, not average, or you'll fall over exactly when it matters. E.g. 11.5k avg → provision for ~50k peak + burst headroom. Handle extreme spikes with queues, rate limiting, and load shedding.

#### Code Example / Key Takeaways
```text
Peak ≈ 2-5× avg (events/viral: 10-100×). PROVISION for peak, not average (+ autoscaling headroom).
11.5k avg -> plan ~50k peak. Extreme spikes: queues, rate limiting, load shedding, waiting rooms.
```

---

### Q308. What is the read/write ratio?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
The read:write ratio shapes the architecture. **Read-heavy** (e.g. 100:1 — social feeds, URL shorteners) → invest in caching, read replicas, CDN, denormalized read models. **Write-heavy** (e.g. logging, IoT, analytics) → optimize ingestion (LSM stores, Kafka buffering, sharding writes, async processing). Most user-facing systems are read-heavy. Always ask/assume this ratio — it decides where you spend your scaling effort.

#### Code Example / Key Takeaways
```text
Read-heavy (100:1, feeds/URLs) -> caching + read replicas + CDN + denormalized reads.
Write-heavy (logs/IoT/analytics) -> LSM stores, Kafka buffering, shard writes, async processing.
Ratio decides where scaling effort goes. Most user-facing systems are read-heavy.
```

---

### Q309. How much data is generated per day?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Estimate daily data = writes/day × average record size (plus media). E.g. 100M new records/day × 1KB = 100GB/day. This drives storage capacity, database choice (can one node hold it? need sharding?), retention policy, and cost. Include replication factor (×3) and indexes (overhead). Combine with growth to project storage over years (see next). Data volume is a key scaling constraint.

#### Code Example / Key Takeaways
```text
Daily data = writes/day × avg record size (+ media). 100M × 1KB = 100GB/day.
Multiply by replication (×3) + index overhead. Drives storage, DB choice (shard?), retention, cost.
```

---

### Q310. What is the storage requirement after 5 years?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Project cumulative storage: daily data × 365 × 5 (× replication factor, + indexes/overhead), accounting for growth. E.g. 100GB/day × 365 × 5 ≈ 182TB raw, ~550TB with 3× replication. This determines whether you need sharding (no single node holds it), tiering (hot/cold, archive old data), and the storage budget. Long-term projection justifies partitioning and lifecycle/retention decisions up front.

#### Code Example / Key Takeaways
```text
5-yr storage ≈ daily data × 365 × 5 × replication (+ index overhead + growth).
100GB/day -> ~182TB raw, ~550TB at 3× replication -> needs sharding + hot/cold tiering + archival.
Long-term projection justifies partitioning + lifecycle decisions.
```

---

### Q311. What is the latency requirement?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Define target latency, usually at **percentiles** (p50/p95/**p99**) not average — tail latency is what users feel. E.g. "p99 < 200ms for reads." Latency targets drive caching (avoid slow DB hits), CDN/edge (reduce network distance), data locality (co-locate/regional), avoiding chatty sync calls (aggregate), and async processing (move slow work off the request path). Tight latency = more caching, fewer hops, and regional deployment.

#### Code Example / Key Takeaways
```text
Target by percentile (p50/p95/p99), not average — tail latency is what users feel. e.g. "p99 < 200ms".
Achieve via: caching, CDN/edge, data locality/regional, fewer sync hops (aggregate), async slow work.
```

---

### Q312. What availability do you need?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Pick a target in "nines" based on business criticality: 99.9% (~8.7h/yr) for internal tools, 99.99% (~52min/yr) for most consumer apps, 99.999% (~5min/yr) for critical infra/payments. Higher availability = eliminating SPOFs, multi-AZ/region redundancy, automated failover, and zero-downtime deploys — each nine costs significantly more. Match the target to the cost of downtime; don't over-engineer availability where it isn't needed.

#### Code Example / Key Takeaways
```text
99.9% (~8.7h/yr) internal | 99.99% (~52min/yr) consumer | 99.999% (~5min/yr) critical/payments.
Higher nines = no SPOF + multi-region redundancy + auto-failover + zero-downtime deploys (costs more each nine).
Match target to cost of downtime; don't over-engineer.
```

---

### Q313. What happens if one service goes down?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Design so a single service failure is **contained**, not catastrophic: run multiple instances (redundancy → traffic reroutes to healthy ones), use **circuit breakers** (fail fast when a dependency is down), **timeouts** (don't hang), **graceful degradation** (drop the non-critical feature, keep core working), and **retries** for transient issues. Distinguish critical vs optional dependencies — an optional one (recommendations) degrades; a critical one (payment) needs failover. Answer with: redundancy + isolation + degradation.

#### Code Example / Key Takeaways
```text
One service down -> contained, not catastrophic: redundant instances (reroute) + circuit breaker + timeout
   + graceful degradation (optional dep off, core works) + retries.
Critical dep -> failover; optional dep -> degrade. Isolation limits blast radius.
```

---

### Q314. What happens if the database goes down?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
The DB is often the most critical component, so: run **replicas** with **automated failover** (promote a replica → primary, repoint via proxy/discovery), use **multi-AZ** so an AZ loss doesn't take it out, and serve reads from replicas/cache during a primary failure. A cache can absorb reads temporarily (cache-aside → DB outage = more misses, not total failure). For writes, queue them (if the write path can be async) or degrade gracefully. **Avoid split-brain** on failover (fencing).

#### Code Example / Key Takeaways
```text
DB down -> replicas + automated failover (promote replica, repoint clients) + multi-AZ.
Reads: serve from replicas/cache. Writes: queue (if async-able) or degrade. Prevent split-brain (fencing).
Cache absorbs reads during primary loss (cache-aside = more misses, not outage).
```

---

### Q315. What happens if Redis (cache) goes down?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
With **cache-aside**, a Redis outage means reads fall through to the database — higher latency and DB load, but not a total failure (design the DB to survive the added load, or the cache miss storm). Mitigate: Redis **replication + cluster** (HA, so it rarely fully fails), a **local/in-process cache** as a second layer, and **request coalescing/singleflight** to prevent a thundering herd hammering the DB on cold cache. Never let the cache be a hard dependency — it should be an optimization.

#### Code Example / Key Takeaways
```text
Cache-aside + Redis down -> reads hit DB (slower, more load) but not fatal. Ensure DB can absorb it.
Mitigate: Redis cluster/replication (HA), local L1 cache, singleflight (avoid herd on cold cache).
Cache = optimization, not a hard dependency.
```

---

### Q316. What happens if Kafka goes down?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Kafka is usually **replicated** (RF=3, multi-broker/AZ), so a broker loss triggers leader election and continues — full-cluster failure is rare. If it does: producers **buffer** locally (bounded by `buffer.memory`, then block/fail — decide to block or drop per use case) and consumers pause (resume from committed offsets, no data loss due to retention). For critical writes, the **outbox pattern** keeps events in the DB until Kafka recovers. Design producers to handle unavailability (retry/buffer/degrade) and consumers to resume cleanly.

#### Code Example / Key Takeaways
```text
Kafka replicated (RF=3, multi-AZ) -> broker loss survives via leader election. Full outage rare.
Producers: buffer (bounded) then block/drop per use case; outbox keeps events in DB until recovery.
Consumers: pause, resume from committed offset (retention -> no loss). Design for unavailability.
```

---

### Q317. How do you scale horizontally?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Add more instances and distribute load — the foundation of scale. Prerequisites: **stateless services** (any instance serves any request; externalize state to Redis/DB), a **load balancer**, and **partitioned data** (shard so the DB isn't a bottleneck). Add autoscaling (scale with load), caching (reduce backend load), and async processing (offload spikes). For stateful components (DBs), scale via sharding + replication. Answer: stateless tier + LB + sharded data + autoscaling.

#### Code Example / Key Takeaways
```text
Horizontal scale = more instances + LB. Needs: stateless services (externalize state), sharded data, autoscaling.
Reduce backend load with caching + async processing. Stateful (DB) scales via sharding + replication.
```

---

### Q318. Where would you use caching?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Cache at multiple layers to cut latency and backend load: **CDN/edge** (static assets, some dynamic), **client/browser**, **API gateway** (response cache), **application cache** (Redis for hot DB reads, sessions, computed results), and **database** (query/result cache, buffer pool). Cache read-heavy, expensive-to-compute, and slow-to-fetch data. Each layer catches more before hitting the origin. Answer with the layered picture, not just "use Redis."

#### Code Example / Key Takeaways
```text
Layered caching: CDN/edge -> client -> API gateway -> app cache (Redis) -> DB cache/buffer pool.
Cache: read-heavy, expensive-to-compute, slow-to-fetch data. Each layer offloads the origin.
```

---

### Q319. What would you cache?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Cache data that is **read-frequently, changes rarely, and is expensive to fetch/compute**: hot DB rows, computed aggregates (counts, rankings), session/auth data, rendered pages/fragments, static assets (CDN), and results of slow queries or external API calls. Don't cache rarely-read or highly-volatile data (low hit rate, constant invalidation), or sensitive data without care. Prioritize by (access frequency × fetch cost). Answer: hot, expensive, slowly-changing data.

#### Code Example / Key Takeaways
```text
Cache: hot rows, computed aggregates, sessions/auth, rendered fragments, static assets, slow-query/API results.
Don't cache: rarely-read or highly-volatile data (low hit rate / constant invalidation).
Prioritize by access frequency × fetch cost.
```

---

### Q320. How do you invalidate the cache?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Choose per data's staleness tolerance: **TTL** (expire after N seconds — simple, bounded staleness, good default), **write-through/explicit invalidation** (delete/update the key on write — fresh, needs write hooks), or **event-based** (invalidate via CDC/Kafka change events — scales across nodes). Combine (TTL as a safety net + event-based for freshness). Watch for the **thundering herd** on invalidation (singleflight) and cross-node invalidation (pub/sub). Answer: TTL + explicit/event-based, matched to freshness needs.

#### Code Example / Key Takeaways
```text
TTL (bounded staleness, simple default) | explicit invalidation on write (fresh) | event-based (CDC/Kafka, cross-node).
Combine: event-based for freshness + TTL safety net. Guard thundering herd (singleflight); cross-node via pub/sub.
Match strategy to data's staleness tolerance.
```

---

### Q321. SQL or NoSQL — and why?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Decide from data + access patterns: **SQL** for structured, relational, transactional data needing ACID/joins/strong consistency (payments, orders, inventory). **NoSQL** for large scale, flexible/semi-structured data, high write throughput, or specific access patterns (document, key-value, wide-column, graph). Many systems use **both** (polyglot persistence): SQL for transactions, NoSQL for scale/flexibility. Justify with the specific need (consistency? scale? flexibility? relationships?), not preference. Often the answer is "SQL for core transactions, NoSQL where scale/pattern demands it."

#### Code Example / Key Takeaways
```text
SQL: relational, ACID, joins, strong consistency (payments/orders/inventory).
NoSQL: scale, flexible schema, high write, specific pattern (document/KV/wide-column/graph).
Often BOTH (polyglot). Justify by need: consistency vs scale vs flexibility vs relationships.
```

---

### Q322. How would you partition the database?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
**Horizontally shard** by a key so no single node holds everything. Strategies: **hash** (even distribution, no range scans), **range** (range queries, risk hotspots), **directory** (flexible lookup), or **consistent hashing** (minimal reshuffle on scaling). Pick a shard key with **high cardinality + even access** (e.g. user_id). Also consider **vertical** partitioning (split columns/features). Plan for cross-shard queries (avoid or scatter-gather) and resharding. Answer: shard by a well-chosen key, with a strategy fitting the query pattern.

#### Code Example / Key Takeaways
```text
Horizontal shard by key: hash (even) | range (scans, hotspot risk) | directory | consistent hashing (easy resharding).
Shard key: high cardinality + even access (e.g. user_id). Avoid cross-shard joins; plan resharding.
```

---

### Q323. How would you choose the shard key?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
A good shard key has: **high cardinality** (many distinct values → even spread), **uniform access** (no hotspots), and aligns with the **most common query** (so queries hit one shard, avoiding scatter-gather). E.g. `user_id` for user-centric data. Avoid low-cardinality (few values → imbalance) or monotonic keys (timestamps → all writes hit one shard). If queries span keys, you may need a composite key or secondary index. The key choice determines whether sharding actually helps or creates hot shards.

#### Code Example / Key Takeaways
```text
Good shard key: high cardinality + uniform access + matches common query (single-shard lookups).
Avoid: low cardinality (imbalance), monotonic/timestamp (all writes -> one shard).
e.g. user_id for user-centric data. Bad key -> hot shards + scatter-gather.
```

---

### Q324. What happens when a shard becomes hot?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
A hot shard (disproportionate load — bad key or a viral entity) becomes a bottleneck while others idle. Fixes: **split** the hot shard (rebalance its key range to new shards), **choose a better shard key** (higher cardinality), **salt** hot keys (spread one key across shards, sacrificing single-shard queries), add a **cache** in front of the hot data, or use **read replicas** for the hot shard. Consistent hashing eases rebalancing. Answer: rebalance/split + better key + caching + salting.

#### Code Example / Key Takeaways
```text
Hot shard -> bottleneck. Fixes: split/rebalance the shard (consistent hashing), better shard key,
   salt hot keys (spread, loses single-shard query), cache the hot data, read replicas for it.
Root cause is usually key choice or a viral entity.
```

---

### Q325. How do you handle hot keys?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
A hot key (one item getting massive traffic — a viral post, a celebrity) overloads its shard/cache node. Mitigate: **cache** it aggressively (even replicate the hot key across cache nodes or use a local in-process cache), **salt/shard** the key into sub-keys to spread writes (e.g. distributed counter shards), add **read replicas**, and use **request coalescing** (singleflight) so concurrent requests for it hit the backend once. For counters, use sharded/approximate counting. Answer: cache + replicate + salt + coalesce.

#### Code Example / Key Takeaways
```text
Hot key -> overloads one node. Mitigate: aggressive cache (+ replicate hot key / local L1), salt into sub-keys
   (spread writes, e.g. sharded counter), read replicas, singleflight (coalesce concurrent requests).
Counters -> sharded/approximate.
```

---

### Q326. How do you handle duplicate requests?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Duplicates arise from client retries, network timeouts, and at-least-once delivery. Make operations **idempotent**: attach a unique **idempotency key** (request id), track processed keys (dedup store / DB unique constraint), and on a duplicate return the stored result without re-executing. For reads it's harmless; for writes/side-effects it's essential (no double charge/order). Alternatively use **upserts** (write final state) so reprocessing is a no-op. Answer: idempotency keys + dedup store.

#### Code Example / Key Takeaways
```text
Duplicates (retries/timeouts/at-least-once) -> idempotency key + dedup store (unique constraint):
   seen? return stored result : process + record. Or upsert (state, not delta) = no-op on replay.
Essential for writes/side-effects (no double charge).
```

---

### Q327. How do you make APIs idempotent?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Client sends a unique **Idempotency-Key** header per operation; the server, in a transaction, inserts the key (unique constraint) — if new, process and store the result against the key; if it exists, return the stored result without re-executing. Handle in-progress duplicates with a lock/"processing" state. GET/PUT/DELETE are naturally idempotent; POST needs the key. Set a key TTL. This makes retries safe. Answer: idempotency key + atomic dedup + return cached result.

#### Code Example / Key Takeaways
```text
Idempotency-Key header. Server (tx): INSERT key (unique) -> new? process + store result : return stored result.
In-progress dup -> lock/"processing". GET/PUT/DELETE naturally idempotent; POST needs the key. Key TTL.
```

---

### Q328. How do you handle retries?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Retry only **transient** failures (timeouts, 503, network) and only **idempotent** operations (or use idempotency keys). Use **exponential backoff + jitter** (avoid hammering + thundering herd), cap total attempts/time, and don't retry terminal errors (400/validation/declined). Pair with a **circuit breaker** so retries don't prolong an outage. For unknown outcomes (timeout after sending), **query status** before retrying. Answer: bounded, backoff+jitter, idempotent-only, transient-only, + circuit breaker.

#### Code Example / Key Takeaways
```text
Retry: transient errors only, idempotent ops only, exponential backoff + jitter, bounded attempts.
Don't retry terminal errors. Add circuit breaker (don't prolong outages). Unknown outcome -> query status first.
```

---

### Q329. How do you prevent retry storms?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
A retry storm = many clients retrying simultaneously, overwhelming a recovering service. Prevent with: **exponential backoff + jitter** (spread retries out, break synchronization), **circuit breakers** (stop calling a failing service entirely), **retry budgets** (cap the % of traffic that is retries — e.g. max 10%), **load shedding** at the server (reject excess early), and idempotency (so failed retries don't corrupt). Jitter is the key ingredient — without it, backoff still synchronizes. Answer: jitter + circuit breaker + retry budget + load shedding.

#### Code Example / Key Takeaways
```text
Retry storm = synchronized retries overwhelm recovery. Prevent: backoff + JITTER (de-sync), circuit breakers,
   retry budgets (cap retry % of traffic), server-side load shedding. Jitter is essential.
```

---

### Q330. How do you handle message duplication?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
At-least-once delivery (Kafka, queues) produces duplicates on retries/rebalances. Handle with **idempotent consumers**: attach a unique event id, track processed ids (dedup store / DB unique constraint), and skip already-seen ids. Or use **upserts** (write final state) / version checks so reprocessing is harmless. For Kafka-internal exactly-once, use transactions. Ensure the dedup store is **durable** (survives restarts), not in-memory. Answer: unique event id + durable dedup, or idempotent upserts.

#### Code Example / Key Takeaways
```text
At-least-once -> duplicates. Idempotent consumer: unique event id + durable dedup store (unique constraint) -> skip seen.
Or upsert / version check (reprocessing harmless). Kafka-internal EOS via transactions. Dedup store must be durable.
```

---

### Q331. How do you guarantee ordering?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Order is guaranteed within a **partition/queue**, not globally. To keep related events ordered, route them to the same partition via a **key** (entity id → same partition → sequential processing by one consumer). Enable **idempotent producers** so retries don't reorder. For strict **global** ordering, use a single partition (throughput bottleneck) or sequence numbers + reordering at the consumer. Usually per-key ordering is sufficient. Answer: key-based partitioning for per-entity order; global ordering is expensive (single partition).

#### Code Example / Key Takeaways
```text
Order guaranteed per partition. Key by entity (orderId) -> same partition -> sequential -> per-entity order.
Idempotent producer avoids reorder on retry. Global order = single partition (bottleneck) or seq# + reorder.
Prefer per-key ordering (sufficient for most).
```

---

### Q332. At-most-once, at-least-once, or exactly-once?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
- **At-most-once**: no duplicates, possible loss (commit before processing) — only for loss-tolerant data.
- **At-least-once**: no loss, possible duplicates (commit after processing) — the common default; pair with idempotency.
- **Exactly-once**: no loss, no duplicates — via Kafka transactions (read-process-write) or idempotency keys for effects; more overhead.

Most systems choose **at-least-once + idempotent processing** (achieves exactly-once effects simply). Answer: at-least-once + idempotency is the pragmatic default; true exactly-once only where required.

#### Code Example / Key Takeaways
```text
at-most-once (no dup, may lose) | at-least-once (no loss, may dup) | exactly-once (neither, costly).
Pragmatic default: at-least-once + idempotency = exactly-once EFFECTS, simply.
True EOS (transactions) only where genuinely required.
```

---

### Q333. How do you handle failures (general)?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Assume any component can fail and design for **contained, recoverable** failure: **redundancy** (no SPOF), **timeouts** (fail fast), **retries with backoff** (transient), **circuit breakers** (stop calling failing deps), **bulkheads** (isolate resources), **graceful degradation** (drop non-critical features), **failover** (promote standbys), and **idempotency** (safe retries). Add monitoring/alerting + automated recovery. Distinguish critical vs optional dependencies. Answer with this layered resilience toolkit, applied per dependency.

#### Code Example / Key Takeaways
```text
Assume failure. Toolkit: redundancy (no SPOF), timeouts, retry+backoff, circuit breaker, bulkhead,
   graceful degradation, failover, idempotency + monitoring/auto-recovery.
Critical dep -> failover; optional dep -> degrade. Keep blast radius small.
```

---

### Q334. How do you monitor the system?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Use the **three pillars**: **metrics** (time-series: RED — Rate/Errors/Duration, and USE — Utilization/Saturation/Errors — via Prometheus/Grafana), **logs** (structured, centralized — ELK/Loki), and **traces** (distributed tracing across services — OpenTelemetry/Jaeger), correlated by trace id. Add **health checks** (liveness/readiness), **SLOs + alerting** on user-facing symptoms (error rate, latency), and dashboards. Alert on symptoms users feel plus leading indicators (saturation, disk). Answer: metrics + logs + traces + health checks + SLO-based alerting.

#### Code Example / Key Takeaways
```text
3 pillars: metrics (RED/USE, Prometheus) + logs (structured, ELK/Loki) + traces (OpenTelemetry/Jaeger), correlated by trace id.
+ health checks (liveness/readiness) + SLO-based alerting (on user-facing symptoms + leading indicators) + dashboards.
```

---

### Q335. What metrics would you collect?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
- **RED** (per service): **R**ate (RPS), **E**rrors (error rate), **D**uration (latency p50/p95/p99).
- **USE** (per resource): **U**tilization, **S**aturation, **E**rrors (CPU, memory, disk, network).
- Plus **business metrics** (orders/sec, signups), **dependency health** (DB connections, queue depth/lag, cache hit rate), and **saturation signals** (thread pools, connection pools).

Focus on user-facing signals (latency, errors) + capacity signals (saturation). Answer: RED + USE + business + dependency metrics.

#### Code Example / Key Takeaways
```text
RED (service): Rate, Errors, Duration (p50/p95/p99). USE (resource): Utilization, Saturation, Errors.
+ business (orders/sec), dependency health (queue lag, cache hit rate, DB connections), saturation (pools).
Focus: user-facing (latency/errors) + capacity (saturation).
```

---

### Q336. How would you trace requests?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Use **distributed tracing**: generate a **trace id** at the edge, propagate it on every call (W3C `traceparent` header, across sync and async/Kafka hops), and have each service emit **spans** (with parent-child links) to a collector (OpenTelemetry → Jaeger/Tempo). The UI reconstructs the end-to-end request path with per-hop latency, pinpointing bottlenecks and failures. Correlate traces with logs/metrics via the trace id. Use **sampling** to control volume. Answer: trace id propagation + spans + OpenTelemetry + sampling.

#### Code Example / Key Takeaways
```text
Trace id at edge -> propagate (traceparent) across all hops (sync + async) -> each service emits spans -> collector (Jaeger).
End-to-end latency waterfall; correlate with logs/metrics by trace id; sample to control volume. (OpenTelemetry)
```

---

### Q337. How would you deploy it?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Use **CI/CD**: automated build → test → deploy pipeline, containerized (Docker) and orchestrated (Kubernetes), with **immutable artifacts** promoted across environments (dev→staging→prod). Deploy via **rolling/blue-green/canary** for zero downtime (see next), gated by automated tests + health checks, with automated rollback on failure. Externalize config (12-factor) and use feature flags to decouple deploy from release. Answer: CI/CD + containers/orchestration + progressive rollout + automated rollback.

#### Code Example / Key Takeaways
```text
CI/CD: build -> test -> deploy (containerized, orchestrated by k8s). Immutable artifacts promoted dev->staging->prod.
Rolling/blue-green/canary (zero downtime) + health-gated + auto-rollback. Externalized config + feature flags.
```

---

### Q338. How would you perform zero-downtime deployment?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Deploy without dropping traffic using: **rolling** (replace instances gradually, health-checked), **blue-green** (run new version alongside old, switch traffic at once, instant rollback), or **canary** (route a small % to the new version, watch metrics, ramp up). Prerequisites: **backward-compatible** API/DB changes (old + new coexist — expand/contract migrations), health/readiness checks (only route to ready instances), and automated rollback. Feature flags decouple deploy from release. Answer: rolling/blue-green/canary + backward compatibility + health checks + rollback.

#### Code Example / Key Takeaways
```text
Rolling (gradual, health-checked) | Blue-green (switch at once, instant rollback) | Canary (small % -> ramp on good metrics).
Requires: backward-compatible API/DB (expand/contract), readiness checks, auto-rollback, feature flags.
Old + new must coexist during rollout.
```

---

### Q339. How would you handle a traffic spike?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Absorb and shed: **autoscaling** (add instances on load — but it has lag, so pre-warm for known events), **caching + CDN** (serve without hitting the backend), **queues** (buffer writes, process async — load leveling), **rate limiting + load shedding** (reject/queue excess to protect the core), and a **virtual waiting room** for extreme events (flash sales). Provision headroom for known peaks; degrade gracefully under extreme load. Answer: autoscale + cache/CDN + queue buffering + rate limit/shed + waiting room.

#### Code Example / Key Takeaways
```text
Spike -> autoscale (pre-warm for known events) + cache/CDN (offload) + queues (buffer writes, level load)
   + rate limit/load shedding (protect core) + virtual waiting room (extreme events).
Provision headroom for known peaks; degrade gracefully.
```

---

### Q340. How would you design disaster recovery?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Define **RPO** (max data loss) and **RTO** (max downtime), then build to meet them: cross-region **replication/backups**, infrastructure automation (IaC), and a **failover** strategy sized to cost/speed — backup-restore (cheap, slow), pilot light, warm standby, or active-active (fast, costly). **Test regularly** (DR drills/GameDays) — untested DR fails. Ensure surviving capacity, avoid split-brain, and automate promotion + traffic rerouting. Answer: RPO/RTO-driven, cross-region replication + failover strategy + tested drills.

#### Code Example / Key Takeaways
```text
Define RPO (data loss) + RTO (downtime). Build: cross-region replication/backups + IaC + failover strategy.
Strategy by cost/speed: backup-restore < pilot-light < warm-standby < active-active. TEST (DR drills/GameDay).
Avoid split-brain; ensure surviving capacity; automate promotion + reroute.
```

---

### Q341. What is your RPO?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
RPO (Recovery Point Objective) = the **maximum acceptable data loss**, measured in time (e.g. "at most 5 minutes"). It's driven by **replication/backup frequency**: continuous/synchronous replication → near-zero RPO (no loss, higher cost/latency); periodic backups → RPO = backup interval. Set it by how much data loss the business can tolerate — payments need ~zero RPO; analytics can tolerate more. Answer: define RPO from data-loss tolerance, meet it via replication frequency.

#### Code Example / Key Takeaways
```text
RPO = max acceptable DATA LOSS (in time). Sync replication -> ~0 RPO (costly); periodic backup -> RPO = interval.
Payments -> ~0 RPO; analytics -> minutes/hours OK. Set from business data-loss tolerance.
```

---

### Q342. What is your RTO?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
RTO (Recovery Time Objective) = the **maximum acceptable downtime** to restore service after a failure (e.g. "back within 15 minutes"). It's driven by **failover automation** and standby readiness: active-active → near-zero RTO (instant); warm standby → minutes; backup-restore → hours. Lower RTO costs more (warm/hot standby, automation). Set it by how long the business can tolerate being down. Answer: define RTO from downtime tolerance, meet it via failover automation/standby.

#### Code Example / Key Takeaways
```text
RTO = max acceptable DOWNTIME to recover. Active-active -> ~0 RTO; warm standby -> minutes; backup-restore -> hours.
Lower RTO = more cost (hot standby + automation). Set from business downtime tolerance.
```

---

### Q343. How would you make it multi-region?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Deploy the full stack in multiple regions and route users to the nearest healthy one (GeoDNS/global LB). The hard part is **data**: pick active-passive (one write region + async replication — simpler) or active-active (multi-region writes + conflict resolution — complex), and set per-dataset consistency (strong for money → pin to a region; eventual for feeds → replicate freely). Regional caches, cross-region replication with defined RPO/RTO, and failover. Answer: full stack per region + global routing + a data-consistency strategy per dataset.

#### Code Example / Key Takeaways
```text
Full stack per region + global routing to nearest healthy region. Data is the hard part:
   active-passive (1 writer + async) or active-active (multi-write + conflict resolution);
   per-dataset consistency (money = strong/pinned; feeds = eventual). Regional caches; cross-region replication (RPO/RTO).
```

---

### Q344. Active-active or active-passive?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
- **Active-passive**: one region serves, standby replicates + waits. Simpler (single writer → no conflicts), but idle capacity and failover downtime (RTO). Good default for most.
- **Active-active**: all regions serve reads+writes. Low latency everywhere, full HA, no idle capacity — but needs multi-master conflict resolution and is complex. Best for global scale / eventually-consistent data.

Choose by RTO needs, write-conflict tolerance, and cost. Answer: active-passive for simplicity, active-active for global low-latency + HA (at the cost of conflict handling).

#### Code Example / Key Takeaways
```text
Active-passive: 1 writer + standby -> simple (no conflicts), idle capacity + failover RTO. Good default.
Active-active: all regions read+write -> low latency + full HA, but multi-master conflict resolution + complexity.
Choose by RTO, conflict tolerance, cost.
```

---

### Q345. What consistency model do you choose?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Choose **per dataset**, not globally: **strong consistency** where correctness is critical (money, inventory, uniqueness, locks) — accept higher latency/lower availability (CP); **eventual consistency** where staleness is tolerable (feeds, counts, caches, presence) — gain availability/latency (AP). Many systems mix both. Justify with the CAP trade-off and the business need. Answer: strong where correctness matters, eventual where availability/latency matter — decided per data, not one-size-fits-all.

#### Code Example / Key Takeaways
```text
Choose PER dataset: strong (money/inventory/uniqueness/locks -> CP, higher latency) vs eventual (feeds/counts/caches -> AP, available).
Mix both in one system. Justify via CAP + business need. Not one-size-fits-all.
```

---

### Q346. Where can eventual consistency be accepted?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Accept eventual consistency where brief staleness is harmless: **social feeds/timelines** (a post appearing a second late is fine), **like/view counts** (approximate is OK), **caches** (bounded staleness via TTL), **search indexes** (slight indexing lag), **recommendations**, **presence/last-seen**, and **analytics dashboards**. These favor availability + low latency over instant correctness. Give honest UX where needed ("processing"). Answer: non-critical, staleness-tolerant, read-heavy data — feeds, counts, caches, search, presence.

#### Code Example / Key Takeaways
```text
Eventual OK: feeds/timelines, like/view counts, caches (TTL), search indexes, recommendations, presence, analytics.
Brief staleness harmless -> favor availability + latency. Honest UX ("processing") where user-visible.
```

---

### Q347. Where is strong consistency mandatory?
**Difficulty:** `Intermediate`
**Category:** Follow-Up Questions

#### Answer
Strong consistency is mandatory where stale/conflicting data causes real harm: **money/payments/balances** (no double-spend), **inventory** (no overselling), **uniqueness constraints** (usernames, seat/booking allocation), **distributed locks/leader election**, and **config/coordination**. These need ACID transactions, quorum/consensus, and accept the CP trade-off (latency/availability). Answer: money, inventory, uniqueness, locks, coordination — anywhere a wrong read causes incorrect actions or lost money.

#### Code Example / Key Takeaways
```text
Strong required: money/balances (no double-spend), inventory (no oversell), uniqueness (usernames/seats),
   locks/leader election, config/coordination. Use ACID + quorum/consensus (accept CP trade-off).
Rule: anywhere a stale read causes wrong actions or lost money.
```

---

### Q348. What are the bottlenecks?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Identify where the system will saturate first: usually the **database** (single writer, hot shard, connection limits), then **network** (bandwidth, chatty calls), **cache** (hot keys), **single-threaded/stateful components**, **external dependencies** (rate limits), and **shared resources** (locks, coordination). Analyze the critical path and the highest-traffic data. Mitigate: caching, sharding, replication, async, and removing coordination. In an interview, proactively call out the likely bottleneck and how you'd address it. Answer: DB first (usually), then network/cache/hot keys/coordination.

#### Code Example / Key Takeaways
```text
Likely bottlenecks: DB (single writer/hot shard/connections) -> network (chatty/bandwidth) -> cache (hot keys)
   -> stateful/single-threaded parts -> external deps (rate limits) -> locks/coordination.
Mitigate: cache, shard, replicate, async, remove coordination. Call it out proactively.
```

---

### Q349. What is the single point of failure?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
A SPOF is any component whose failure takes down the whole system — a single database primary, one load balancer, one cache node, a single region, or a coordination service. Eliminate each with **redundancy**: replicas + failover (DB), multiple LBs (+ DNS/anycast), cache clustering, multi-AZ/region, and consensus-based coordination (quorum). Audit the architecture component by component asking "what if this dies?" Answer: proactively identify each SPOF and pair it with a redundancy/failover strategy — a good design has none.

#### Code Example / Key Takeaways
```text
SPOF = component whose failure kills the system (single DB primary, one LB, one cache, one region, coordinator).
Eliminate via redundancy: DB replicas + failover, multiple LBs + DNS, cache cluster, multi-AZ/region, consensus quorum.
Audit "what if this dies?" per component. Good design = no SPOF.
```

---

### Q350. How would you reduce cost?
**Difficulty:** `Hard`
**Category:** Follow-Up Questions

#### Answer
Optimize without sacrificing SLAs: **autoscaling + scale-to-zero** (pay for actual load, not peak), **caching/CDN** (fewer expensive backend/DB calls), **storage tiering** (hot→cold/archive, compression, retention/lifecycle policies), **right-sizing** instances (avoid over-provisioning), **reserved/spot** capacity for predictable/interruptible workloads, **efficient data formats** (compression, columnar), and reducing cross-region/egress traffic (a big cloud cost). Measure cost per request/tenant and target the biggest line items. Answer: autoscale + cache + tier storage + right-size + reserved/spot + cut egress.

#### Code Example / Key Takeaways
```text
Cut cost w/o breaking SLAs: autoscale/scale-to-zero (pay for load), cache/CDN (fewer DB/egress calls),
   storage tiering + compression + retention, right-size instances, reserved/spot capacity, reduce cross-region/egress.
Measure cost per request/tenant; target biggest line items.
```

---
