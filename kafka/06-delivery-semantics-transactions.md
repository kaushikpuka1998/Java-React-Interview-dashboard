# Apache Kafka — Delivery Semantics & Transactions Interview Questions (Q208–Q227)

---

### Q208. What are the three delivery semantics (at-most-once, at-least-once, exactly-once)?
**Difficulty:** `Intermediate`
**Category:** Delivery Semantics

#### Answer
- **At-most-once**: each record is processed 0 or 1 times — no duplicates, but possible **loss** (commit offset before processing).
- **At-least-once**: each record is processed 1+ times — no loss, but possible **duplicates** (commit after processing). The common default; pair with idempotency.
- **Exactly-once**: each record's effect is applied exactly once within a transactional boundary — no loss, no duplicates, but more complexity/overhead (Kafka transactions).

#### Code Example / Key Takeaways
```text
                 Loss?   Duplicate?   How
at-most-once      yes      no         commit offset BEFORE processing
at-least-once     no       yes        commit AFTER processing (+ idempotency)
exactly-once      no       no         Kafka transactions (EOS) / idempotent sink
```

---

### Q209. Does Kafka provide exactly-once automatically for every app?
**Difficulty:** `Intermediate`
**Category:** Delivery Semantics

#### Answer
No. Kafka **can** provide exactly-once **semantics (EOS)**, but only for the specific pattern of **read-process-write within Kafka**, and only when configured for it: idempotent + transactional producer, `read_committed` consumer, and transactional offset commits (or Kafka Streams with `processing.guarantee=exactly_once_v2`). It does **not** automatically make arbitrary side effects (external DB/API calls) exactly-once — those need idempotency keys or the outbox pattern.

#### Code Example / Key Takeaways
```text
EOS applies to: consume -> transform -> produce (+ commit offsets) WITHIN Kafka.
Requires: enable.idempotence, transactional.id, sendOffsetsToTransaction,
          consumer isolation.level=read_committed  (or Kafka Streams EOS).
External side effects (DB/HTTP) still need idempotency keys / outbox.
```

---

### Q210. What is a Kafka transaction and what does it guarantee?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
A Kafka transaction atomically groups **multiple produces** (across partitions/topics) **and** the **commit of consumed offsets** into one all-or-nothing unit. On commit, all produced records and the offset advance become visible together to `read_committed` consumers; on abort, none do. This solves the "wrote output but didn't commit input offset (or vice versa)" failure, enabling exactly-once read-process-write pipelines.

#### Code Example / Key Takeaways
```java
producer.initTransactions();
producer.beginTransaction();
producer.send(new ProducerRecord<>("output", key, transformed));
producer.sendOffsetsToTransaction(consumedOffsets, consumer.groupMetadata());
producer.commitTransaction();   // output + input-offset advance become atomic
// On error: producer.abortTransaction();  -> neither is visible.
```

---

### Q211. What is `transactional.id` and producer fencing?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
`transactional.id` is a stable identity for a transactional producer. When a new producer instance with the same id calls `initTransactions()`, the transaction coordinator **bumps the epoch**, **fencing** any older instance — an old/zombie producer with a stale epoch gets `ProducerFencedException` and can no longer write. This prevents a hung-then-resumed producer from corrupting the stream after a new instance took over (critical during failover/redeploy).

#### Code Example / Key Takeaways
```java
p.put("transactional.id", "order-processor");   // stable per logical producer
producer.initTransactions();  // bumps epoch -> older instance is FENCED
// Zombie old producer -> ProducerFencedException on send/commit -> must stop.
```

---

### Q212. What is `sendOffsetsToTransaction` and why combine offsets with output?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
`sendOffsetsToTransaction(offsets, groupMetadata)` includes the consumer's **input offsets** in the same transaction as the produced **output**. Committing them together guarantees that output is published **iff** the corresponding input offset advances — eliminating the two classic failure windows (output written but offset not committed → duplicates on restart; offset committed but output lost → data loss). This is the core of Kafka's read-process-write exactly-once.

#### Code Example / Key Takeaways
```java
Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
for (var r : recs) {
    producer.send(new ProducerRecord<>("out", transform(r.value())));
    offsets.put(new TopicPartition(r.topic(), r.partition()),
                new OffsetAndMetadata(r.offset() + 1));
}
producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());
producer.commitTransaction();  // output + offsets atomic -> no dup / no loss
```

---

### Q213. What is `isolation.level` and how do read_committed consumers work?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
`isolation.level=read_committed` makes a consumer read only records from **committed** transactions; it buffers transactional records and only delivers them once it sees the commit marker, hiding aborted ones, and never reads past the **Last Stable Offset (LSO)**. `read_uncommitted` (default) delivers everything, including aborted-transaction records. Use `read_committed` downstream of any transactional producer to get exactly-once reads.

#### Code Example / Key Takeaways
```java
p.put("isolation.level", "read_committed");
// Sees only committed transactional records; aborted ones filtered out;
// won't advance past LSO while a transaction is still open.
// read_uncommitted -> may deliver records that later get aborted.
```

---

### Q214. What is an aborted transaction and what happens to its records?
**Difficulty:** `Intermediate`
**Category:** Transactions

#### Answer
An aborted transaction is one that didn't commit — the app called `abortTransaction()`, the producer crashed, or the transaction timed out. Its records were physically written to the log (they occupy offsets) but are marked aborted via a control marker; **`read_committed` consumers skip them entirely**. `read_uncommitted` consumers would still see them. Aborting is how you cleanly discard partial work in a transaction.

#### Code Example / Key Takeaways
```text
beginTransaction -> send A, B -> error -> abortTransaction()
Log physically has A,B + ABORT marker.
read_committed consumers: never see A,B.
read_uncommitted consumers: see A,B (unsafe for EOS).
```

---

### Q215. What is the transaction coordinator and transaction log?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
The **transaction coordinator** is a broker (chosen by hashing `transactional.id`) that manages a transactional producer's state — assigning epochs, tracking which partitions are in a transaction, and driving commit/abort (writing control markers to the data partitions). It persists state in the internal **transaction log** (`__transaction_state`), a replicated compacted topic, so transactions can be recovered and completed consistently after coordinator failover.

#### Code Example / Key Takeaways
```text
transactional.id -> hash -> __transaction_state partition -> coordinator broker
Coordinator: assigns PID/epoch, tracks partitions in the txn, commits/aborts,
             writes markers, persists state in __transaction_state (durable).
Coordinator failover -> recover in-flight txns from the transaction log.
```

---

### Q216. What is idempotent processing and why does at-least-once need it?
**Difficulty:** `Intermediate`
**Category:** Delivery Semantics

#### Answer
Idempotent processing means applying the same record multiple times yields the **same final result** as applying it once. Since at-least-once delivery can redeliver records (crash between processing and commit), non-idempotent side effects (e.g. "add $10") would double-apply. Make operations idempotent via **unique event IDs + a dedup store**, **database unique constraints/upserts**, or naturally idempotent operations (set-to-value rather than increment).

#### Code Example / Key Takeaways
```java
// Dedup by event id -> reprocessing has no extra effect
int rows = jdbc.update(
  "INSERT INTO applied(event_id) VALUES (?) ON CONFLICT DO NOTHING", r_eventId);
if (rows == 1) applyBusinessEffect(r);   // only first time
// Or upsert to a target state instead of incrementing.
```

---

### Q217. What is the dual-write problem and how does the outbox pattern solve it?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
The **dual-write problem**: updating your database and publishing to Kafka are two separate operations, so a crash between them leaves them inconsistent (DB updated but event lost, or vice versa) — Kafka transactions can't span an external DB. The **Transactional Outbox** writes the business row **and** an `outbox` event row in the **same DB transaction**; a relay or **CDC** (Debezium) then publishes committed outbox rows to Kafka. The write is atomic; delivery is at-least-once (consumers dedupe).

#### Code Example / Key Takeaways
```java
@Transactional
void placeOrder(Order o) {
    orderRepo.save(o);                                    // business row
    outboxRepo.save(new Outbox("Order", o.id(), "OrderPlaced", json(o))); // same tx
}
// CDC/Debezium tails the outbox table -> publishes to Kafka after commit.
// No dual write -> no lost/orphaned events. Consumers dedupe (at-least-once).
```

---

### Q218. Can a Kafka transaction span an external database?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
No — Kafka transactions are **only** atomic across Kafka partitions/topics and Kafka offset commits. They can't make an external DB write atomic with a Kafka publish. To coordinate Kafka with a database you use application-level patterns: the **outbox pattern** (DB + event in one DB tx, then CDC to Kafka), **idempotent consumers** (dedup on the DB side), or, rarely, a distributed-transaction/2PC approach (usually avoided for performance/availability).

#### Code Example / Key Takeaways
```text
Kafka txn scope = Kafka topics/partitions + consumer offsets ONLY.
Kafka + external DB atomicity -> use:
  - Outbox pattern (DB tx writes event; CDC publishes)
  - Idempotent consumer (dedup on DB unique key)
  - (rarely) 2PC/Saga for cross-system coordination
```

---

### Q219. What is an idempotency key and how do you use it?
**Difficulty:** `Intermediate`
**Category:** Delivery Semantics

#### Answer
An idempotency key is a unique business identifier (order id, request id, event id) used to detect and safely ignore **duplicate** operations. Store processed keys with a **unique constraint**; on a duplicate, the insert fails/no-ops and you return the prior result instead of re-executing. It's the practical way to make at-least-once delivery safe for non-idempotent actions like payments.

#### Code Example / Key Takeaways
```sql
CREATE TABLE processed (idempotency_key TEXT PRIMARY KEY, result JSONB);
-- First call inserts and runs; a retry conflicts -> return stored result, no re-charge.
INSERT INTO processed(idempotency_key, result) VALUES ($1,$2)
ON CONFLICT (idempotency_key) DO NOTHING;
```

---

### Q220. What is a producer sequence number and how does it prevent duplicates?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
With idempotence enabled, each producer gets a **PID** and assigns a monotonically increasing **sequence number** per partition to every record. The broker tracks the last sequence it accepted per (PID, partition); it **rejects duplicates** (a re-sent sequence it already has) and **out-of-order** writes. So if an ack is lost and the producer retries, the broker recognizes the duplicate sequence and doesn't append it again — no duplicate record from retries.

#### Code Example / Key Takeaways
```text
Producer (PID=42) -> partition 0: seq 0,1,2,3...
Broker remembers last accepted seq per (PID, partition).
Retry re-sends seq 2 -> broker sees duplicate -> ignores (returns success), no dup.
Out-of-order seq -> OutOfOrderSequenceException.
```

---

### Q221. What is EOS (Exactly-Once Semantics) `v2` and how is it enabled?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
EOS is Kafka's transactional mechanism for exactly-once **read-process-write**. `v2` (default in modern Kafka) is more efficient than v1 — it scales to many partitions per transaction with less coordinator overhead. In raw clients you enable it with idempotent + transactional producer and `sendOffsetsToTransaction`; in **Kafka Streams** you simply set `processing.guarantee=exactly_once_v2` and the library handles transactions, offsets, and state-store consistency for you.

#### Code Example / Key Takeaways
```java
// Kafka Streams — one line gives EOS across input offsets, output, and state stores
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, "exactly_once_v2");
// Raw clients: enable.idempotence + transactional.id + sendOffsetsToTransaction.
```

---

### Q222. What happens if a transactional producer crashes mid-transaction?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
The in-flight transaction is not committed, so its records stay **invisible** to `read_committed` consumers. The coordinator will **abort** it (either when the new producer instance fences the old one via `initTransactions()`, or when `transaction.timeout.ms` expires). Because commit is atomic, there's no partial visibility — downstream never sees half a transaction. The restarted producer starts clean with a bumped epoch.

#### Code Example / Key Takeaways
```text
Crash during txn -> not committed -> read_committed consumers see nothing.
Coordinator aborts it: on new producer initTransactions() (fencing) OR on
transaction.timeout.ms. Restarted producer resumes with a new epoch, clean state.
```

---

### Q223. What is `transaction.timeout.ms`?
**Difficulty:** `Intermediate`
**Category:** Transactions

#### Answer
It's the maximum time a transaction may stay open before the coordinator **aborts** it automatically. This prevents a hung producer from holding a transaction (and blocking `read_committed` consumers past the LSO) forever. It must be ≤ the broker's `transaction.max.timeout.ms`. Set it long enough for your processing batch but short enough that a stuck producer is cleaned up promptly.

#### Code Example / Key Takeaways
```java
p.put("transaction.timeout.ms", 60000);   // abort if not committed within 60s
// Guards against stuck transactions blocking read_committed consumers.
// Must be <= broker transaction.max.timeout.ms.
```

---

### Q224. When should you use Kafka transactions, and what's the cost?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
Use transactions when you genuinely need **atomic multi-partition/topic writes** and **exactly-once read-process-write within Kafka** (e.g. streaming aggregations, financial event pipelines). Costs: added latency (commit round-trips + markers), throughput overhead, operational complexity, and the LSO delay for read_committed consumers. If at-least-once + idempotent consumers suffice (often they do), prefer that simpler path; reserve transactions for true exactly-once requirements.

#### Code Example / Key Takeaways
```text
Use transactions when: atomic multi-topic writes OR EOS read-process-write in Kafka.
Costs: extra latency (commit markers), lower throughput, complexity, LSO read delay.
If idempotent at-least-once is enough -> use it (simpler, faster). Don't over-adopt EOS.
```

---

### Q225. How do you make a consumer idempotent without transactions?
**Difficulty:** `Intermediate`
**Category:** Delivery Semantics

#### Answer
Store a unique event id per record with a DB **unique constraint** (or key-set); process only if the insert succeeds, so reprocessing after a crash is a no-op. Alternatively use **upserts** (write final state, not deltas) so applying twice is harmless, or check current state before acting. This achieves effective exactly-once **effects** with plain at-least-once delivery and no transactional overhead — the most common production approach.

#### Code Example / Key Takeaways
```java
@KafkaListener(topics = "payments", groupId = "ledger")
void handle(Payment p) {
    boolean fresh = ledger.recordIfNew(p.eventId());   // unique constraint
    if (fresh) ledger.credit(p.account(), p.amount()); // only once
    // duplicate delivery -> recordIfNew returns false -> skipped. No transactions needed.
}
```

---

### Q226. What is the difference between idempotent producer and transactional producer?
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
- **Idempotent producer** (`enable.idempotence=true`): prevents **duplicates from retries** and preserves ordering — but only within a single producer session, per partition. No cross-partition atomicity.
- **Transactional producer** (adds `transactional.id` + the transaction API): builds on idempotence to give **atomic multi-partition/topic writes**, **offset+output atomicity**, and **fencing** across sessions — i.e. full EOS.

Idempotence = no dup retries; transactions = atomic units + exactly-once pipelines.

#### Code Example / Key Takeaways
```text
Idempotent producer:  no duplicate on retry, ordered, single-session, per-partition.
Transactional producer: idempotence + atomic across partitions/topics + offsets
                        + cross-session fencing = exactly-once read-process-write.
```

---

### Q227. Exercise — Transactions: implement an exactly-once read-process-write loop.
**Difficulty:** `Hard`
**Category:** Transactions

#### Answer
Configure a transactional producer and a `read_committed` consumer (auto-commit off). In each batch: begin a transaction, produce transformed outputs, add the consumed offsets to the transaction, and commit — so input consumption and output production are atomic. Abort on any error.

#### Code Example / Key Takeaways
```java
producer.initTransactions();
while (running) {
    var recs = consumer.poll(Duration.ofMillis(500));
    if (recs.isEmpty()) continue;
    try {
        producer.beginTransaction();
        var offsets = new HashMap<TopicPartition, OffsetAndMetadata>();
        for (var r : recs) {
            producer.send(new ProducerRecord<>("out", transform(r.value())));
            offsets.put(new TopicPartition(r.topic(), r.partition()),
                        new OffsetAndMetadata(r.offset() + 1));
        }
        producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());
        producer.commitTransaction();          // atomic: output + input offsets
    } catch (Exception e) {
        producer.abortTransaction();           // nothing visible downstream
    }
}
// consumer: isolation.level=read_committed, enable.auto.commit=false
```

---
