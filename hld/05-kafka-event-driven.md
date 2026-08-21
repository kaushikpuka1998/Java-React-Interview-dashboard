# HLD — Kafka & Event-Driven System Design Interview Questions (Q161–Q185)

*Each answer includes a top-to-bottom flow (and Back-of-the-Envelope estimation where it's a scalable pipeline).*

---

### Q161. Design an event-driven order system using Kafka.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
The order service publishes `OrderPlaced` to an `orders` topic (keyed by orderId for ordering). Downstream services each consume as their own **consumer group**: payment charges, inventory reserves, shipping schedules, notifications email — reacting independently and emitting their own events. Use the **outbox pattern** so the DB write and event publish are atomic. Reliability via idempotent consumers, retry topics + DLT. **Challenges**: eventual consistency, ordering per order (key), idempotency, multi-step flow (Saga).

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Order Service│  write order + outbox (same DB tx)
   └──────┬───────┘
     CDC/Debezium
          ▼
   ┌──────────────┐
   │Kafka "orders"│  key = orderId (per-order ordering)
   └──────┬───────┘
   ┌──────┼──────────┬───────────┐
   ▼      ▼          ▼           ▼
┌──────┐┌──────┐┌────────┐┌──────────┐
│Payment││Invent││Shipping││Notify    │  each = own consumer group
│(charge││ory   ││(sched) ││(email)   │  (independent, replayable)
│)      ││(rsrv)││        ││          │
└──────┘└──────┘└────────┘└──────────┘
Idempotent consumers + retry/DLT. Multi-step consistency via Saga.
```

---

### Q162. Design an order-processing pipeline.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
A staged pipeline: `orders` → validation → payment → fulfillment → shipping, each stage a consumer that processes and emits the next event (or an orchestrator drives it). Persist state per stage; use **Saga** compensations on failure (refund if fulfillment fails after payment). Idempotent stages, retry topics + DLT, monitor lag per stage. **Challenges**: partial failures + compensation, exactly-once effects, ordering per order, backpressure between stages, observability.

#### Code Example / Key Takeaways
```text
── PIPELINE (top → bottom) ──
   ┌──────────────┐
   │  orders      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Validate    │──► emit event
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Payment     │──► emit event
   └──────┬───────┘
          ▼ (fulfillment fails?)
   ┌──────────────┐        ┌──────────────┐
   │  Fulfillment │───────►│ COMPENSATE   │  (Saga: refund/release)
   └──────┬───────┘        └──────────────┘
          ▼
   ┌──────────────┐
   │  Shipping    │
   └──────────────┘
Idempotent stages + retry/DLT. Trace order across stages; monitor per-stage lag.
```

---

### Q163. Design a Kafka-based notification system.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Producers publish notification events to Kafka; per-channel consumer groups (push, email, SMS, in-app) consume and call providers, honoring preferences + templates. Kafka decouples producers from delivery and absorbs spikes; each channel scales by partition count. Retry topics + DLT for provider failures; idempotency (dedupe by notification id). **Challenges**: per-channel scaling, provider rate limits, idempotency, preferences/opt-out, priority (separate topics), delivery-status tracking.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:  500M notifications/day = ~5,800/sec (peak ~20k); 1 event → up to 4 channels

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Producers   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Kafka         │  (decouple + absorb spikes)
   │"notifications"│
   └──────┬───────┘
   ┌──────┼──────────┬───────────┐
   ▼      ▼          ▼           ▼
┌──────┐┌──────┐┌──────┐┌──────────┐
│Push  ││Email ││ SMS  ││In-App    │  per-channel groups (scale by partitions)
│group ││group ││group ││group     │  → providers (retry/DLT + dedupe)
└──────┘└──────┘└──────┘└──────────┘
Honor preferences/opt-out; priority via separate topics; track status.
```

---

### Q164. Design a Kafka-based logging pipeline.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Apps/agents produce structured logs to a Kafka `logs` topic (buffer absorbing bursts, decoupling producers from the indexer); stream processors parse/enrich (service, trace id), then sink to Elasticsearch/Loki (+ cold object storage). Kibana/Grafana query. Partition by service/host; indexer scales out. **Challenges**: huge write volume (Kafka buffers), indexer lag (Kafka retains), sampling noisy logs, PII scrubbing, retention/cost tiering.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:  1M lines/sec × 500 B = ~43 TB/day → Kafka buffers, ES hot 7d, cold tier after

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Apps/Agents   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Kafka "logs"  │  (buffer, absorb bursts; indexer can lag)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Stream        │  parse/enrich (+ trace id), scrub PII, sample
   │Processor     │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌────────────┐┌──────────────┐
 │ES/Loki(hot)││Object Storage│
 └─────┬──────┘│(cold)        │
       ▼       └──────────────┘
 ┌────────────┐
 │Kibana/Grafana│
 └────────────┘
```

---

### Q165. Design a Kafka-based analytics pipeline.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Ingest events (clicks, views, transactions) into Kafka; a **stream processor** (Kafka Streams/Flink) does real-time aggregations (counts, sessions, windows) → serving store (Druid/ClickHouse/Redis) for dashboards; also sink raw events to a **data lake/warehouse** (S3 + Spark/BigQuery) for batch/ML. **Lambda/Kappa** architecture. **Challenges**: real-time vs batch consistency, windowing + late events, EOS aggregation, high cardinality, schema evolution.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (Kappa/Lambda, top → bottom) ──
   ┌──────────────┐
   │ Events       │  (clicks/views/transactions)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │   Kafka      │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ real-time  ▼ raw
 ┌────────────┐┌──────────────┐
 │Stream Proc ││Data Lake/    │
 │(Flink):    ││Warehouse     │
 │windowed agg││(S3/BigQuery) │  batch/ML
 └─────┬──────┘└──────────────┘
       ▼
 ┌────────────┐
 │Serving Store│  (Druid/ClickHouse) → dashboards (sub-sec)
 └────────────┘
Handle late events, EOS aggregation, schema evolution.
```

---

### Q166. Design Kafka consumer scaling.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Scale a consumer group by adding consumers, but effective parallelism is **capped at the partition count** (extra consumers idle). Size partitions for peak parallelism up front. At the cap, add partitions (mind key-ordering) or parallelize within a consumer (worker threads, preserving offset correctness). Cooperative rebalancing + static membership for smooth scaling. **Challenges**: partition-count ceiling, rebalance disruption, hot partitions, offset correctness with intra-consumer parallelism.

#### Code Example / Key Takeaways
```text
── PARTITION → CONSUMER MAPPING ──
   Topic (6 partitions P0-P5), consumer group:
   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
   │ P0   ││ P1   ││ P2   ││ P3   ││ P4   ││ P5   │
   └──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘
      ▼       ▼       ▼       ▼       ▼       ▼
   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
   │ C1   ││ C2   ││ C3   ││ C4   ││ C5   ││ C6   │  (max = #partitions)
   └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
   C7 → IDLE (no partition). Hit cap → add partitions or intra-consumer workers.
Cooperative rebalancing + static membership = smooth scaling.
```

---

### Q167. Design a Kafka partitioning strategy.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Choose a **key** that (a) preserves ordering where needed (same entity → same partition) and (b) distributes load evenly (high cardinality, no skew). Key by `orderId`/`userId`. Partition count from throughput + consumer parallelism + headroom. Avoid low-cardinality keys (hot partitions). Salt hot keys (sacrificing strict per-key order). **Challenges**: ordering vs even distribution, hot partitions from skew, partition-count sizing (increasing re-hashes keys), null-key behavior.

#### Code Example / Key Takeaways
```text
── KEY → PARTITION ──
   ┌──────────────┐
   │  Producer    │  key = orderId
   └──────┬───────┘
     hash(key) % partitions
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│ P0   ││ P1   ││ P2   │  same key → same partition (ordered)
└──────┘└──────┘└──────┘
Good key: high cardinality + no skew + preserves entity order.
Hot key → salt into sub-keys (loses strict order). Increasing partitions re-hashes.
```

---

### Q168. Design a Kafka consumer group architecture.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Model each independent app/purpose as its own **consumer group** (each gets all events, own offsets); scale within a group by adding consumers. Use **CooperativeSticky** assignor + **static membership** for stable rebalances, commit offsets after processing (at-least-once) with idempotency, and handle rebalances via listeners (commit on revoke). **Challenges**: partition-count ceiling, rebalance disruption, offset correctness, hot partitions, group isolation (independent offsets).

#### Code Example / Key Takeaways
```text
── ONE GROUP PER PURPOSE (top → bottom) ──
   ┌──────────────┐
   │Topic "orders"│  (all events)
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────────┐
│Group ││Group ││Group     │  each gets ALL events, OWN offsets
│billing││audit ││analytics │  (isolated — one slow group ≠ affects others)
└──────┘└──────┘└──────────┘
Scale within group (add consumers). CooperativeSticky + static membership.
Commit after processing + idempotent; commit-on-revoke listener.
```

---

### Q169. Design Kafka retry topics.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
For transient failures, republish to **tiered retry topics** with increasing delays (`retry-5s`, `retry-1m`, `retry-10m`) instead of blocking the main partition; a consumer per tier waits the delay before reprocessing. After exhausting tiers → **DLT**. Track attempts in headers. Spring's `@RetryableTopic` automates non-blocking retries. **Challenges**: implementing delay, idempotency, retry storms (backoff + jitter), non-blocking main flow.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ main topic   │
   └──────┬───────┘  transient fail
          ▼
   ┌──────────────┐
   │ retry-5s     │  (wait 5s, reprocess)
   └──────┬───────┘  fail
          ▼
   ┌──────────────┐
   │ retry-1m     │
   └──────┬───────┘  fail
          ▼
   ┌──────────────┐
   │ retry-10m    │
   └──────┬───────┘  exhausted
          ▼
   ┌──────────────┐
   │    DLT       │
   └──────────────┘
Non-blocking (main partition keeps flowing). Spring: @RetryableTopic.
```

---

### Q170. Design Kafka dead-letter topics.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Route records that fail after bounded retries to a **DLT** so they don't block the partition. Include failure context in headers (orig topic/partition/offset, exception, timestamp). Monitor/alert on DLT growth. **Curated replay**: fix root cause, validate, republish to source with dedup + rate limiting. **Challenges**: transient vs permanent classification, no infinite retries (stall partition), safe replay (idempotency).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Consumer     │  retries exhausted
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    DLT       │  + headers (orig topic/offset/error/ts)
   │(main partition│
   │ unblocked)   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Alert + Replay│  fix cause → validate → republish (dedup + rate limit)
   └──────────────┘
Classify transient vs permanent; never infinite-retry inline.
```

---

### Q171. Design Kafka message ordering.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Kafka guarantees order **within a partition** only. Keep related events ordered via the **same key** (entity id) → same partition. Enable the **idempotent producer** so retries don't reorder. Strict **global** ordering → single partition (throughput bottleneck), usually avoided; prefer per-key. One consumer per partition per group processes sequentially. **Challenges**: no cross-partition ordering, retries reordering (idempotence), increasing partitions changes key mapping.

#### Code Example / Key Takeaways
```text
── ORDERING GUARANTEE ──
   Partition P2: [ e0 → e1 → e2 → e3 ]   (strict order within partition)
   P0, P1, P2 consumed IN PARALLEL → no order across partitions

   Same key "A1" → always P2 → ordered:
   ┌──────────────┐
   │OrderPlaced(A1)│──┐
   ├──────────────┤  ├─► P2 (sequential)
   │OrderPaid(A1)  │──┘
   └──────────────┘
Idempotent producer preserves order on retry. Global order = single partition.
```

---

### Q172. Design exactly-once Kafka processing.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
For read-process-write within Kafka, use **transactions**: idempotent + transactional producer (`transactional.id`), consume with `isolation.level=read_committed` + auto-commit off, atomically produce outputs + commit offsets via `sendOffsetsToTransaction`. Kafka Streams: `processing.guarantee=exactly_once_v2`. External side effects → **idempotency keys** at the sink. **Challenges**: transaction overhead/latency, LSO read delay, Kafka txn can't span a DB (idempotent sink/outbox), producer fencing.

#### Code Example / Key Takeaways
```text
── TRANSACTIONAL READ-PROCESS-WRITE (top → bottom) ──
   ┌──────────────┐
   │Consumer      │  read_committed, auto-commit OFF
   └──────┬───────┘
          ▼ beginTransaction()
   ┌──────────────┐
   │Process       │
   └──────┬───────┘
          ▼ atomic
   ┌──────────────┐
   │Produce output│  + sendOffsetsToTransaction(offsets)
   └──────┬───────┘
          ▼ commitTransaction()  (output + input offsets ATOMIC)
   ┌──────────────┐
   │Output Topic  │
   └──────────────┘
Kafka Streams: exactly_once_v2. External side effects → idempotency key/outbox.
```

---

### Q173. Design at-least-once processing.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Process the record **first, then commit** the offset — a crash before commit re-reads (never lost, possible duplicates). The common default. Pair with **idempotent processing** (dedupe by event id / unique constraint / upsert). Manual commits (auto-commit off), retry topics + DLT. **Challenges**: duplicates on retry/rebalance (idempotency), commit timing, commit after full batch.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  poll()      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  PROCESS     │  (idempotent: dedupe by event id / upsert)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  COMMIT      │  (after processing → no loss, possible dup)
   └──────────────┘
Crash before commit → re-read (dup, handled by idempotency). Auto-commit OFF.
```

---

### Q174. Design at-most-once processing.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Commit the offset **before** processing — a crash mid-processing skips the record: **no duplicates, but possible loss**. Only for loss-tolerant data (metrics, telemetry) where duplicates are worse than gaps. Simplest/fastest but rarely wanted for important data. **Challenges**: accepting data loss; recognizing when acceptable (rarely for business-critical → use at-least-once + idempotency).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  poll()      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  COMMIT      │  (BEFORE processing)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  PROCESS     │  crash here → record SKIPPED (loss, no dup)
   └──────────────┘
Only for loss-tolerant data (metrics/telemetry). Not for business-critical events.
```

---

### Q175. Design duplicate-event handling.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
At-least-once produces duplicates (retries, rebalances); consumers must **dedupe**: attach a unique **event id**, track processed ids (durable dedup store / DB unique constraint), skip seen ids. Or **upserts** (write final state) / version checks (ignore stale). **Challenges**: dedup store size/TTL, ordering vs dedup, exactly-once effects without transactions, durability across restarts.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Event(id)    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ seen id?     │  (durable dedup store / unique constraint)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ yes        ▼ no
 ┌──────┐   ┌──────────────┐
 │ skip │   │process +     │
 │      │   │record id     │
 └──────┘   └──────────────┘
Or upsert (state not delta) / version check. Dedup store must be durable.
```

---

### Q176. Design event replay.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Kafka **retains** events, so reprocess history: reset a group's offsets (earliest, a specific offset, or a timestamp via `offsetsForTimes`) and re-consume. Uses: rebuild a broken read model, backfill a new consumer, bug recovery. Consumers must be **idempotent** (replay re-applies); use a separate group/topic to avoid disrupting live processing. **Challenges**: idempotency, side effects (no re-charge/re-email), replay volume/time, isolation from prod.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Kafka topic   │  (retained events — replayable)
   │[e0...eN]     │
   └──────┬───────┘
     reset group offset (earliest / offset / timestamp)
          ▼
   ┌──────────────┐
   │Replay Consumer│  (SEPARATE group — isolate from live)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Rebuild read  │  model / backfill / recover
   │model         │
   └──────────────┘
MUST be idempotent (replay duplicates). Guard side effects (no re-charge/email).
```

---

### Q177. Design event versioning.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Events are immutable and long-lived, so schemas evolve. Version with **schema (Avro/Protobuf) + Schema Registry** enforcing compatibility; make changes **additive** (new optional fields with defaults; avoid removing/renaming). Consumers tolerate unknown fields, upcast old events to the new shape. **Challenges**: backward/forward compatibility (old + new coexist), never break existing consumers, upcasting, deploy-order coordination.

#### Code Example / Key Takeaways
```text
── VERSIONED EVENTS (flow) ──
   ┌──────────────┐
   │Schema Registry│  enforce compatibility on register
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Producer      │  v1 → v2 = ADDITIVE (new optional field + default)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Consumer      │  tolerate unknown fields; upcast old → new shape
   └──────────────┘
No rename/remove/retype. Deploy order per compatibility mode.
```

---

### Q178. Design schema evolution.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Evolve contracts safely via a Schema Registry with an enforced **compatibility mode**: **backward** (new schema reads old → upgrade consumers first), **forward** (old reads new → upgrade producers first), or **full**. Additive changes (optional + defaults); avoid renames/removals/type changes. Validate in CI before rollout. **Challenges**: choosing compatibility mode, deploy order, breaking changes (new topic + migration), pre-deploy testing.

#### Code Example / Key Takeaways
```text
── COMPATIBILITY MODES ──
   ┌──────────────────────────────────────┐
   │ BACKWARD: new schema reads OLD data    │
   │   → upgrade CONSUMERS first            │
   ├──────────────────────────────────────┤
   │ FORWARD: old schema reads NEW data     │
   │   → upgrade PRODUCERS first            │
   ├──────────────────────────────────────┤
   │ FULL: both directions hold             │
   └──────────────────────────────────────┘
Additive only. Validate in CI. Breaking change → new topic + migrate.
```

---

### Q179. Design a Schema Registry architecture.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
A central service storing versioned schemas per subject (topic), enforcing **compatibility** on registration, returning a numeric **schema id**. Producers register/validate + embed only the id (`[magic][id][payload]`); consumers fetch (cache) the schema by id. Store durably (compacted Kafka topic), replicate for HA. **Challenges**: availability (on the serialization critical path → cache + HA), compatibility enforcement, subject naming, governance.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Producer      │  register/validate schema → get schema id
   └──────┬───────┘
     message = [magic byte][schema id][payload]
          ▼
   ┌──────────────┐
   │Kafka         │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Consumer      │  read id → fetch+CACHE schema → deserialize
   └──────┬───────┘
          ▲
   ┌──────┴───────┐
   │Schema Registry│  subject → versioned schemas + compatibility (HA, cached)
   └──────────────┘
```

---

### Q180. Design Kafka disaster recovery.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Replicate topics (+ consumer offsets) to a **secondary cluster** in another region via **MirrorMaker 2** (active-passive/active-active). Define **RPO** (bounded by replication lag) + **RTO** (failover automation). On disaster, redirect clients to the secondary; offset translation lets consumers resume near their position. Rack/AZ awareness within a cluster + regular DR drills. **Challenges**: replication lag, offset translation, consumer failover, active-active split-brain, testing.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Primary Cluster│  (region A)
   │(topics+offsets)│
   └──────┬───────┘
     MirrorMaker 2 (replicate + offset translation)
          ▼
   ┌──────────────┐
   │Secondary     │  (region B) — standby
   │Cluster       │
   └──────┬───────┘
     disaster → redirect clients
          ▼
   ┌──────────────┐
   │Consumers      │  resume near last position (translated offsets)
   └──────────────┘
RPO = replication lag; RTO = failover automation. Test DR drills.
```

---

### Q181. Design cross-region Kafka replication.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Use **MirrorMaker 2** (Connect-based) to replicate topics between regional clusters with topic renaming/prefixing + **offset translation**. Patterns: **aggregation** (many → one), **active-passive** (DR), **active-active** (bidirectional — loop-safe via naming). Async replication → lag, bandwidth cost. **Challenges**: replication lag, avoiding loops (active-active), offset translation, cross-region bandwidth/cost, schema/registry replication.

#### Code Example / Key Takeaways
```text
── PATTERNS ──
   Aggregation (N→1):
     RegionA.orders ─┐
     RegionB.orders ─┼─► Central Cluster
     RegionC.orders ─┘
   Active-Passive (DR):
     Primary ──MM2──► Secondary (standby)
   Active-Active (bidirectional, loop-safe naming):
     A.orders ◄──MM2──► B.orders
Async → lag. Watch: loops, offset translation, bandwidth/cost, schema replication.
```

---

### Q182. Design an outbox pattern using Kafka.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
Solve the **dual-write problem**: write the business row + an `outbox` event row in the **same DB transaction**; a relay or **CDC** (Debezium) tails the outbox and publishes committed rows to Kafka. Makes the DB write + event intent atomic (no lost/orphaned events). At-least-once → consumers dedupe. **Challenges**: CDC/relay reliability, at-least-once (idempotent consumers), outbox cleanup, ordering (by id/key), publish-lag monitoring.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Service      │  SAME DB TX:
   │              │    INSERT business row
   │              │    INSERT outbox(event)
   └──────┬───────┘
     commit (atomic — no dual write)
          ▼
   ┌──────────────┐
   │ Outbox Table │
   └──────┬───────┘
     CDC/Debezium tails committed rows
          ▼
   ┌──────────────┐
   │    Kafka     │  → consumers (dedupe, at-least-once)
   └──────────────┘
Cleanup outbox; order by id/key; monitor CDC/publish lag.
```

---

### Q183. Design CDC-based event streaming.
**Difficulty:** `Hard`
**Category:** Kafka & Event-Driven

#### Answer
**Change Data Capture** streams a DB's committed changes (inserts/updates/deletes) as events by tailing its **transaction log** (binlog/WAL) via Debezium → Kafka — no app changes, low latency, no dual-write. Downstream: read models, cache/search sync, analytics, outbox. Emit before/after images. **Challenges**: snapshot→stream handoff, DDL changes, deletes (tombstones), ordering per key, downstream idempotency, source log retention.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Database    │  commits (insert/update/delete)
   └──────┬───────┘
     tail transaction log (binlog/WAL)
          ▼
   ┌──────────────┐
   │  Debezium    │  change events (before/after, op)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    Kafka     │
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────────┐
│Read  ││Cache/││Analytics │  no app change, low latency
│Models││Search││/Outbox   │
└──────┘└──────┘└──────────┘
Snapshot→stream handoff; deletes → tombstones; downstream idempotency.
```

---

### Q184. Design Kafka-based cache invalidation.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Publish data-change events (from CDC or the writing service) to a Kafka topic; each app instance/cache node consumes and **invalidates/updates** the relevant entries — decoupled, scalable, near-real-time across many nodes. Better than TTL-only (fresher) or direct calls (coupled). **Challenges**: eventual consistency (brief staleness), idempotent/order-tolerant invalidation (versions), all nodes consume (own consumer per node), missed events (fallback TTL).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Data Change   │  (writer or CDC)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Kafka         │
   │"invalidations"│
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Cache ││Cache ││Cache │  every node consumes → evict/update key
│Node A││Node B││Node C│  (own consumer per node = broadcast)
└──────┘└──────┘└──────┘
Version-guard invalidations (order-tolerant); fallback TTL for missed events.
```

---

### Q185. Design Kafka-based microservice communication.
**Difficulty:** `Intermediate`
**Category:** Kafka & Event-Driven

#### Answer
Services communicate **asynchronously via events** on Kafka instead of direct sync calls: a service publishes domain events; interested services subscribe (own groups). Gives loose coupling, resilience (a down consumer lags then catches up), spike absorption, easy new consumers. Sync (REST/gRPC) only where an immediate response is required. **Challenges**: eventual consistency, idempotent + order-tolerant consumers, schema versioning, tracing across async hops, async vs sync choice.

#### Code Example / Key Takeaways
```text
── EVENT-DRIVEN COMMUNICATION (top → bottom) ──
   ┌──────────────┐
   │ Service A    │  publish domain event
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    Kafka     │
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────────┐
│Svc B ││Svc C ││Svc D     │  subscribe (own groups)
└──────┘└──────┘└──────────┘
Loose coupling; down consumer catches up; spike absorption; easy new consumers.
Sync (REST/gRPC) only when immediate response needed.
```

---
