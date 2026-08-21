# HLD — Advanced Distributed Systems Interview Questions (Q246–Q270)

*Each answer includes a top-to-bottom diagram of the concept/flow.*

---

### Q246. Explain the CAP theorem through system design.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
CAP states that during a **network partition (P)**, a distributed system can guarantee either **Consistency (C)** (every read sees the latest write) or **Availability (A)** (every request gets a response), not both. Partitions are unavoidable, so the real choice is **CP** (reject/block to stay consistent — banks, config) vs **AP** (serve possibly-stale data to stay available — feeds, carts). Without a partition you can have both; CAP only forces the trade-off during partitions.

#### Code Example / Key Takeaways
```text
── DURING A PARTITION (choose one) ──
   ┌──────────────┐
   │Network       │  splits cluster into two sides
   │Partition (P) │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ choose CP  ▼ choose AP
 ┌────────────┐┌──────────────┐
 │Consistency ││Availability  │
 │reject/block││always answer,│
 │(no stale)  ││may be stale  │
 │banks/config││feeds/carts   │
 └────────────┘└──────────────┘
No partition → both C and A achievable. CAP = partition-time trade-off.
```

---

### Q247. Design a CP system.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
A CP system prioritizes **consistency** over availability during partitions — refuses/blocks operations that can't be made consistent rather than risk stale data. Achieve with **consensus** (Raft/Paxos) + **quorum** writes/reads, so a minority partition can't accept writes (becomes unavailable). Use for money, inventory, locks, config, leader election. **Challenges**: reduced availability during partitions, latency (consensus round-trips), quorum sizing. (ZooKeeper/etcd/Spanner.)

#### Code Example / Key Takeaways
```text
── PARTITION BEHAVIOR (top → bottom) ──
   ┌──────────────┐
   │  Partition   │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ majority   ▼ minority
 ┌────────────┐┌──────────────┐
 │has quorum  ││NO quorum     │
 │→ accepts   ││→ REJECTS     │  (unavailable, but consistent)
 │writes      ││writes        │
 └────────────┘└──────────────┘
Consensus (Raft/Paxos) + majority quorum. Use: money, locks, config.
Cost: availability + latency during partitions.
```

---

### Q248. Design an AP system.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
An AP system prioritizes **availability** — every node answers even during a partition, accepting data may be **stale/divergent**, reconciling later (eventual consistency + conflict resolution: LWW, vector clocks, CRDTs). Leaderless/multi-master replication + low quorums (write any node). Use for feeds, carts, DNS, caches, presence. **Challenges**: conflict resolution, eventual consistency (stale/out-of-order), read-repair/anti-entropy. (DynamoDB/Cassandra.)

#### Code Example / Key Takeaways
```text
── PARTITION BEHAVIOR (top → bottom) ──
   ┌──────────────┐
   │  Partition   │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ side A     ▼ side B
 ┌────────────┐┌──────────────┐
 │accepts     ││accepts       │  BOTH stay available
 │writes      ││writes        │  (may diverge)
 └─────┬──────┘└──────┬───────┘
       └──────┬───────┘
     partition heals
              ▼
   ┌──────────────┐
   │Reconcile     │  LWW / vector clocks / CRDTs (converge)
   └──────────────┘
Use: feeds, carts, DNS, caches. Cost: staleness + conflicts.
```

---

### Q249. Design eventual consistency.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Replicas may diverge briefly but **converge** once writes stop propagating. Achieve via async replication + conflict resolution (LWW/vector clocks/CRDTs) + anti-entropy (read-repair, background sync, Merkle trees). Honest UX ("processing"). Use where brief staleness is acceptable (feeds, counts, caches). **Challenges**: conflict resolution, session guarantees (read-your-writes), anti-entropy, idempotent + order-tolerant consumers. Convergence, not instant agreement.

#### Code Example / Key Takeaways
```text
── CONVERGENCE (top → bottom) ──
   ┌──────────────┐
   │  Write to    │  Replica A
   │  Replica A   │
   └──────┬───────┘
     async replicate (B, C lag briefly)
          ▼
   ┌──────────────┐
   │Replicas      │  A, B, C temporarily DIVERGE
   │diverge       │
   └──────┬───────┘
     anti-entropy (read-repair, Merkle sync)
          ▼
   ┌──────────────┐
   │CONVERGE      │  all replicas equal (conflict resolution: LWW/CRDT)
   └──────────────┘
Session guarantees (read-your-writes) as needed.
```

---

### Q250. Design strong consistency.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Every read reflects the latest committed write (linearizability) — as if a single copy. Achieve via single-leader + synchronous replication, or **consensus** (Raft/Paxos) + **majority quorum** (R + W > N). Costs: higher latency (coordination) + lower availability during partitions (CP). Use for money, inventory, locks, uniqueness. **Challenges**: latency, availability trade-off (CAP), leader bottleneck/failover, coordination overhead.

#### Code Example / Key Takeaways
```text
── LINEARIZABLE WRITE (top → bottom) ──
   ┌──────────────┐
   │  Write       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Leader        │  append → replicate synchronously
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Replica 1 ││Replica 2 │  wait for MAJORITY ack (R + W > N)
└──────────┘└──────────┘
          ▼
   ┌──────────────┐
   │Commit → every│  read now sees latest write
   │read sees it  │
   └──────────────┘
Cost: latency (coordination) + CP availability trade-off.
```

---

### Q251. Design quorum-based reads/writes.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
With N replicas, a write needs **W** acks and a read queries **R** replicas. If **R + W > N**, quorums overlap → a read always sees the latest write (strong consistency). Tune: `W=N` (durable, slow), `R=1` (fast, weak), or `R=W=majority` (balanced). **Challenges**: choosing R/W (consistency vs latency), stale replicas (read-repair), version conflicts (vector clocks), availability (need W/R nodes up).

#### Code Example / Key Takeaways
```text
── R + W > N → OVERLAP (N=3, W=2, R=2) ──
   Write to W=2:          Read from R=2:
   ┌────┐┌────┐┌────┐     ┌────┐┌────┐┌────┐
   │ R1 ││ R2 ││ R3 │     │ R1 ││ R2 ││ R3 │
   │ ✓  ││ ✓  ││    │     │ ✓  ││    ││ ✓  │
   └────┘└────┘└────┘     └────┘└────┘└────┘
   W={R1,R2}              R={R1,R3}
   Overlap = R1 → read sees the latest write ✓
Tune: R=W=majority (balanced) | W=N (durable) | R=1 (fast, weak).
```

---

### Q252. Design a consensus system.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Consensus makes nodes **agree on a single value/log order** despite failures — the foundation of leader election, replicated state machines, distributed locks. **Paxos** (classic) / **Raft** (understandable: leader + log replication + majority commit). A value commits once a **majority** acknowledges, surviving minority failures. **Challenges**: correctness under failures/partitions (majority quorum, no split-brain), leader election/failover, log replication, latency, majority-up requirement. (etcd/ZooKeeper/Spanner.)

#### Code Example / Key Takeaways
```text
── COMMIT ON MAJORITY (top → bottom) ──
   ┌──────────────┐
   │  Client      │  propose value
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Leader      │  append to log → replicate
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Follower 1││Follower 2│  ack
└──────────┘└──────────┘
          ▼
   ┌──────────────┐
   │COMMIT (once  │  majority acked → survives minority failure
   │majority ack) │
   └──────────────┘
No split-brain (majority quorum). Needs majority up.
```

---

### Q253. Explain Raft-based architecture.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Raft = **leader election** (majority vote per term; heartbeats maintain), **log replication** (clients send commands to leader → appends → replicates; commits on majority), **safety** (terms + log-matching → only up-to-date nodes win elections, committed entries persist). Leader failure → new election picks a follower with the latest log. **Challenges**: failover speed, majority availability, log compaction/snapshots, membership changes. (etcd/Consul/CockroachDB.)

#### Code Example / Key Takeaways
```text
── RAFT (three parts) ──
   ┌──────────────┐
   │1. LEADER      │  nodes vote (majority) per term; leader heartbeats
   │   ELECTION   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │2. LOG         │  client → leader appends → replicate to followers
   │   REPLICATION│  → commit on majority
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │3. SAFETY      │  terms + log-matching; leader dies → re-elect
   │              │  node with latest log
   └──────────────┘
Snapshots for log compaction. Needs majority up.
```

---

### Q254. Design a ZooKeeper-like coordination system.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
A coordination service: small, strongly-consistent hierarchical KV store (znodes) with **watches**, **ephemeral nodes** (auto-deleted on session end), **sequential nodes** — primitives for locks, leader election, config, discovery, membership. Backed by consensus (ZAB/Raft) across an odd ensemble (majority quorum). **Challenges**: strong consistency + availability (CP), watch delivery, session/ephemeral management, read scaling (observers), keeping data small.

#### Code Example / Key Takeaways
```text
── ZNODE TREE + PRIMITIVES ──
   ┌──────────────┐
   │Ensemble      │  odd # nodes, consensus (ZAB/Raft), majority quorum
   └──────┬───────┘
          ▼
   /  (znode tree, strongly consistent)
   ├── /locks/       → ephemeral + sequential → distributed lock
   ├── /election/    → ephemeral → leader election
   ├── /config/      → watches → config + notification
   └── /services/    → ephemeral → discovery + membership
Ephemeral node auto-deletes when client session ends. Keep data small (CP).
```

---

### Q255. Design a distributed lock service at scale.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Mutual exclusion across many clients/resources at scale. Use a coordination service (**etcd/ZooKeeper**) with **leases** (auto-expire on failure) + **fencing tokens** (monotonic ids so a paused-then-resumed holder can't act after losing the lock), or Redis for speed. Shard locks; clients renew via heartbeat. **Challenges**: safety under GC pauses (fencing essential), lease TTL vs long tasks, coordination bottleneck (sharding), split-brain, lock-service failover.

#### Code Example / Key Takeaways
```text
── FENCING TOKEN SAFETY (top → bottom) ──
   ┌──────────────┐
   │Client A      │  acquire lock → gets fencing token 33
   └──────┬───────┘
     A pauses (GC) → lease expires
          ▼
   ┌──────────────┐
   │Client B      │  acquires lock → fencing token 34
   └──────┬───────┘
     A resumes, tries to write with token 33
          ▼
   ┌──────────────┐
   │Resource      │  rejects token 33 < 34 (stale holder blocked)
   └──────────────┘
Lease auto-expires on crash; shard locks for scale. (etcd/ZooKeeper)
```

---

### Q256. Design a distributed transaction system.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Coordinate an atomic operation across services/DBs. Options: **2PC** (prepare→commit; atomic but blocking, coordinator SPOF), **Saga** (local transactions + compensations; available, eventually consistent, no locks), or a **distributed ACID DB** (Spanner/CockroachDB). Microservices prefer Sagas + idempotency over 2PC. **Challenges**: atomicity (2PC blocking vs Saga eventual), failure handling (compensations), consistency vs availability, coordinator reliability, idempotency.

#### Code Example / Key Takeaways
```text
── THREE OPTIONS ──
   ┌──────────────────────────────────────┐
   │ 2PC: prepare → commit (atomic, but     │
   │   BLOCKING, coordinator SPOF, slow)    │
   ├──────────────────────────────────────┤
   │ SAGA: local txns + compensations       │
   │   (available, eventual, no locks) ✓    │
   ├──────────────────────────────────────┤
   │ Distributed ACID DB (Spanner/          │
   │   CockroachDB): consensus + clocks     │
   └──────────────────────────────────────┘
Microservices → Saga + idempotency. 2PC only for strict atomicity.
```

---

### Q257. Design two-phase commit (2PC).
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
A coordinator drives atomic commit in two phases: **Phase 1 (prepare)** — ask all participants to prepare + vote (lock resources, log, reply yes/no); **Phase 2 (commit/abort)** — all yes → commit, else abort. Guarantees atomicity. **Weaknesses**: **blocking** (coordinator crash after prepare → participants hold locks indefinitely), latency, reduced availability, coordinator SPOF. 3PC/consensus mitigate. Rarely used at high scale.

#### Code Example / Key Takeaways
```text
── TWO PHASES (top → bottom) ──
   ┌──────────────┐
   │Coordinator   │
   └──────┬───────┘
     PHASE 1: "prepare?"
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Participant││Participant│  lock + vote yes/no
│1 (yes)   ││2 (yes)   │
└──────────┘└──────────┘
     all yes?
          ▼
   ┌──────────────┐
   │Coordinator   │  PHASE 2: "commit" (else "abort")
   └──────────────┘
BLOCKING: coordinator crash after prepare → locks held. SPOF. Avoid at scale.
```

---

### Q258. Design Saga orchestration.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
A central **orchestrator** drives a distributed transaction as local steps, explicitly calling each service; on failure, invokes **compensating** actions (semantic rollback). Persists Saga state (resumable). E.g. book trip: reserve flight → hotel → charge; charge fails → cancel hotel + flight. **Benefits**: central visibility, easy to change flow. **Challenges**: orchestrator coupling, compensation design, idempotency, durable state, compensation failures.

#### Code Example / Key Takeaways
```text
── ORCHESTRATED SAGA (top → bottom) ──
   ┌──────────────┐
   │ Orchestrator │  (persists state, resumable)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │reserve flight│  ✓
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │reserve hotel │  ✓
   └──────┬───────┘
          ▼
   ┌──────────────┐        ┌──────────────┐
   │  charge      │──fail─►│COMPENSATE:   │  cancel hotel + flight
   └──────────────┘        └──────────────┘
Central visibility/monitoring. Idempotent steps.
```

---

### Q259. Design Saga choreography.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
No central coordinator — each service reacts to events and emits its own, driving the flow implicitly. E.g. OrderPlaced → payment → PaymentCompleted → inventory → Reserved → shipping; on failure, a service emits a failure event triggering **compensating** reactions upstream. **Benefits**: loose coupling, no bottleneck, scalable. **Challenges**: implicit flow (hard to trace), event cycles, harder to change, compensation correctness, idempotency. Simple flows → choreography; complex → orchestration.

#### Code Example / Key Takeaways
```text
── CHOREOGRAPHED SAGA (event chain, top → bottom) ──
   ┌──────────────┐
   │OrderPlaced   │
   └──────┬───────┘
          ▼ (event)
   ┌──────────────┐
   │Payment →     │  emits PaymentCompleted
   └──────┬───────┘
          ▼ (event)
   ┌──────────────┐
   │Inventory →   │  emits Reserved
   └──────┬───────┘
          ▼ (event)
   ┌──────────────┐
   │Shipping      │
   └──────────────┘
Failure event → compensations upstream. Loose coupling, no bottleneck,
but implicit flow (hard to trace).
```

---

### Q260. Design a transactional outbox.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Solve the **dual-write problem**: write the business row + an `outbox` event row in the **same DB transaction**; a relay or **CDC** (Debezium) reads committed outbox rows, publishes to the broker, marks them sent. Atomic write; at-least-once publish → consumers dedupe. **Challenges**: relay/CDC reliability, at-least-once (idempotent consumers), outbox cleanup, ordering (by id/aggregate), publish-lag monitoring.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Service      │  SAME DB TX: business row + outbox(event)
   └──────┬───────┘
     commit (atomic — no dual write)
          ▼
   ┌──────────────┐
   │ Outbox Table │
   └──────┬───────┘
     relay/CDC reads committed rows
          ▼
   ┌──────────────┐
   │  Broker      │  → mark sent; consumers dedupe (at-least-once)
   └──────────────┘
Cleanup outbox; order by id/aggregate; monitor publish lag.
```

---

### Q261. Design change-data-capture architecture.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
CDC streams a DB's committed changes as events by reading its **transaction log** (binlog/WAL) via Debezium → Kafka — no app changes, low latency. Downstream: read models, cache/search sync, analytics, outbox. Initial snapshot then streaming. **Challenges**: snapshot→stream handoff, schema/DDL changes, deletes (tombstones), ordering per key, downstream idempotency, source log retention, lag.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Database    │  commits (insert/update/delete)
   └──────┬───────┘
     tail transaction log (binlog/WAL)
          ▼
   ┌──────────────┐
   │  Debezium    │  → change events (before/after)
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
```

---

### Q262. Design a globally distributed database.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Store/serve data across regions for low latency + resilience. Options: **partition by region** (data near users) + cross-region replication; or a **globally consistent DB** (Spanner: Paxos-replicated shards + TrueTime; CockroachDB). Local reads; writes coordinate per consistency need. **Challenges**: cross-region latency (consensus is expensive globally), consistency vs latency (relax to per-region strong + global eventual), residency, multi-region conflicts, failover.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Global Routing│  → nearest region (local reads)
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Region US ││Region EU │  data partitioned by region
│ ┌──────┐ ││ ┌──────┐ │  OR globally-consistent (Spanner TrueTime)
│ │Shard │◄┼┼►│Shard │ │  cross-region replication (consensus)
│ └──────┘ ││ └──────┘ │
└──────────┘└──────────┘
Strong global consistency = high latency. Relax where possible.
```

---

### Q263. Design multi-region writes.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Allow writes in multiple regions (active-active). Approaches: **home-region ownership** per key (route writes there → no conflicts), **multi-master + conflict resolution** (LWW/CRDT) for eventual data, or **cross-region consensus** (strong but slow). **Challenges**: write conflicts (resolution), consistency vs latency, global invariants, replication lag, split-brain.

#### Code Example / Key Takeaways
```text
── THREE APPROACHES ──
   ┌──────────────────────────────────────┐
   │ HOME-REGION ownership per key:         │
   │   route writes to key's home → NO      │
   │   conflicts (best for strong data) ✓   │
   ├──────────────────────────────────────┤
   │ MULTI-MASTER + conflict resolution     │
   │   (LWW/CRDT) → eventual data           │
   ├──────────────────────────────────────┤
   │ CROSS-REGION consensus → strong but    │
   │   SLOW (global round-trips)            │
   └──────────────────────────────────────┘
Challenges: conflicts, latency, invariants, split-brain.
```

---

### Q264. Design global database replication.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Replicate across regions so each serves local reads and survives a region loss. **Async** (fast writes, lag/loss risk — common) vs **sync** (no loss, high latency — sparingly). Topologies: active-passive (primary + async replicas) or active-active (multi-master + conflict resolution). Rack/AZ + region awareness. **Challenges**: lag (stale reads, RPO), cross-region bandwidth/cost, conflicts, per-dataset consistency, failover automation.

#### Code Example / Key Takeaways
```text
── TOPOLOGIES (top → bottom) ──
   ┌──────────────────────────────────────┐
   │ ACTIVE-PASSIVE:                        │
   │   Primary ──async──► Replica (standby) │
   │   (fast writes; failover = promote)    │
   ├──────────────────────────────────────┤
   │ ACTIVE-ACTIVE:                         │
   │   Region A ◄──► Region B (multi-master)│
   │   + conflict resolution                │
   └──────────────────────────────────────┘
Async (lag/loss) vs sync (no loss, slow). RPO = replication lag.
```

---

### Q265. Design conflict resolution.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Resolve concurrent-write divergence deterministically: **LWW** (by timestamp — simple, lossy), **vector clocks** (detect concurrency → surface conflicts), **CRDTs** (mathematically merge — counters/sets/sequences), or **app-level merge** (domain logic). Choose by data semantics. **Challenges**: LWW data loss (clock skew), concurrency detection (vector clocks), CRDT fit (not all data), merge correctness, predictable outcomes.

#### Code Example / Key Takeaways
```text
── STRATEGIES (top → bottom) ──
   ┌──────────────────────────────────────┐
   │ LWW: keep write with latest timestamp  │
   │   (simple, but LOSES data; clock skew) │
   ├──────────────────────────────────────┤
   │ VECTOR CLOCKS: detect concurrency →    │
   │   surface conflict to app/user         │
   ├──────────────────────────────────────┤
   │ CRDTs: auto-merge (counters/sets/seq)  │
   │   → no conflicts, no loss ✓            │
   ├──────────────────────────────────────┤
   │ APP-LEVEL MERGE: domain-specific logic │
   └──────────────────────────────────────┘
Choose by data semantics.
```

---

### Q266. Design disaster recovery.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
DR restores service/data after a region/DC outage per **RPO** (max data loss) + **RTO** (max downtime). Cross-region **replication/backups** + IaC automation + a **failover strategy**: backup-restore (cheap, slow), pilot light, warm standby, or active-active (fast, costly). **Test regularly** — untested DR fails. **Challenges**: meeting RPO/RTO, post-failover consistency, split-brain, cost vs speed, tested failover.

#### Code Example / Key Takeaways
```text
── STRATEGIES (cost ↑ / recovery-time ↓) ──
   ┌──────────────────────────────────────┐
   │ backup-restore  → cheapest, slow (hrs) │
   │ pilot light     → core running, scale up│
   │ warm standby    → running smaller copy  │
   │ active-active   → instant, costliest    │
   └──────────────────────────────────────┘
RPO = replication frequency; RTO = failover automation.
TEST with drills (untested DR fails when needed).
```

---

### Q267. Design backup across multiple regions.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Store backups in **multiple regions** so a single region loss doesn't destroy them. Take backups (full + incremental + WAL), replicate to geographically separate object storage, encrypt, version, lifecycle-tier. **Verify** with periodic cross-region test restores. **Challenges**: transfer cost/time, encryption/access, restorability verification, retention/compliance, RPO, isolation (separate accounts/regions).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Backups       │  full + incremental + WAL
   └──────┬───────┘
     replicate cross-region (encrypted, versioned)
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Region A  ││Region B  │  ISOLATED (separate account) so one
│backup    ││backup    │  failure can't destroy both
└──────────┘└──────────┘
          ▼
   ┌──────────────┐
   │Verify (cross-│  region test restore)
   │region)       │
   └──────────────┘
```

---

### Q268. Design an active-active global system.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
All regions serve reads **and** writes → low latency, full HA (region loss sheds its share), no idle capacity. Requires multi-region data: **home-region ownership** (no conflicts) or **multi-master + conflict resolution** (CRDT/LWW); strong data may pin to a region. GeoDNS routes to nearest healthy region. **Challenges**: write conflicts, replication lag, global invariants (uniqueness), split-brain, residency.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │GeoDNS        │  → nearest HEALTHY region (both R + W)
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐   ┌──────────┐
│Region A  │◄─►│Region B  │  BOTH read + write; region loss
│(R + W)   │   │(R + W)   │  → survivors absorb load (no idle)
└──────────┘   └──────────┘
Data: home-region ownership (no conflicts) or multi-master + CRDT/LWW.
Challenges: conflicts, lag, global invariants, split-brain.
```

---

### Q269. Design a system with five-nines availability.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
99.999% = ~5 min/yr — **eliminate SPOFs** at every layer: redundant stateless services (multi-AZ + multi-region), replicated DBs + fast auto-failover, health-checked LBs, graceful degradation, circuit breakers, **zero-downtime deploys** (rolling/blue-green/canary). Rigorous monitoring/alerting, auto-recovery, chaos testing, tested DR. **Challenges**: no SPOF anywhere (hardest), fast failover (RTO seconds), rolling deploys, graceful degradation, redundancy cost. Availability = redundancy × automation × testing.

#### Code Example / Key Takeaways
```text
── NO SPOF AT ANY LAYER (top → bottom) ──
   ┌──────────────┐
   │Global routing│  multi-region, health-aware
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Health-checked│  LBs (redundant)
   │LBs           │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Stateless svc │  multi-AZ + multi-region + autoscale
   │(redundant)   │  + circuit breakers + graceful degradation
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Replicated DB │  fast auto-failover
   └──────────────┘
+ zero-downtime deploys + monitoring + chaos + tested DR.
Availability = redundancy × automation × testing.
```

---

### Q270. Design a system that survives an entire region failure.
**Difficulty:** `Hard`
**Category:** Advanced Distributed Systems

#### Answer
Deploy across **multiple regions** + cross-region replication + global routing that **fails traffic away** from a dead region (GeoDNS/health checks). Active-active (instant, costly — survivors absorb load) or active-passive (promote standby — some RTO). Ensure **capacity headroom** (survivors handle 100%). Bounded RPO; GameDay-test failover. **Challenges**: capacity planning, post-failover consistency (RPO), reroute speed (DNS TTL/anycast), split-brain, stateful sessions, cost.

#### Code Example / Key Takeaways
```text
── REGION FAILOVER (top → bottom) ──
   ┌──────────────┐
   │Global Routing│  health checks detect dead region
   └──────┬───────┘
     Region A DOWN → fail traffic away
   ┌──────┴──────┐
   ▼ (dead)      ▼
┌──────────┐   ┌──────────┐
│Region A  │   │Region B  │  absorbs 100% load
│  ✗       │   │(headroom)│  (must be pre-sized!)
└──────────┘   └──────────┘
Active-active (instant) or active-passive (promote, some RTO).
Bounded RPO; GameDay-test. Challenges: capacity, reroute speed, split-brain.
```

---
