# Apache Kafka — Consumers & Offsets Interview Questions (Q148–Q170)

---

### Q148. What is KafkaConsumer and why does it use `poll()`?
**Difficulty:** `Basic`
**Category:** Kafka Consumers

#### Answer
`KafkaConsumer` subscribes to topics and reads records. It is **not thread-safe** (one consumer per thread). It's built around a `poll()` loop: `poll()` fetches batches of records **and** drives group coordination — sending heartbeats, handling rebalances, and updating offsets. Not calling `poll()` regularly (long processing) makes the group think the consumer died. So `poll()` is both "get data" and "prove I'm alive."

#### Code Example / Key Takeaways
```java
consumer.subscribe(List.of("orders"));
while (running) {
    ConsumerRecords<String,String> recs = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String,String> r : recs) process(r);
    consumer.commitSync();
}
// poll() = fetch records + heartbeat + rebalance handling (liveness). Keep calling it.
```

---

### Q149. What is the difference between auto commit and manual commit?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
- **Auto commit** (`enable.auto.commit=true`): the consumer periodically (`auto.commit.interval.ms`) commits the latest polled offsets in the background. Simple, but risky — offsets can be committed before your processing finishes, so a crash can **lose** records (they're marked done but weren't processed).
- **Manual commit** (`false`): the app commits **after** it has successfully processed, tying offset progress to business success — the standard for at-least-once. More control, slightly more code.

#### Code Example / Key Takeaways
```java
p.put("enable.auto.commit", "false");   // control offset progress explicitly
for (var r : recs) process(r);          // process FIRST
consumer.commitSync();                   // then commit -> at-least-once
// Auto-commit can advance offsets before processing completes -> possible loss.
```

---

### Q150. What is the difference between `commitSync()` and `commitAsync()`?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
- **commitSync()**: blocks until the broker confirms the commit, retries automatically on retriable errors — safe but adds latency.
- **commitAsync()**: fires the commit and returns immediately with an optional callback — higher throughput but no automatic retry (a later commit supersedes a failed earlier one).

Common pattern: `commitAsync()` in the loop for speed, and a final `commitSync()` in a `finally`/on shutdown to guarantee the last offsets are durably committed.

#### Code Example / Key Takeaways
```java
try {
    while (running) {
        var recs = consumer.poll(Duration.ofMillis(500));
        recs.forEach(this::process);
        consumer.commitAsync();          // fast, no retry
    }
} finally {
    consumer.commitSync();               // ensure final offsets are committed
    consumer.close();
}
```

---

### Q151. What is `auto.offset.reset` (earliest / latest / none)?
**Difficulty:** `Basic`
**Category:** Kafka Consumers

#### Answer
It decides where a consumer starts when there's **no valid committed offset** (new group, or the committed offset expired):
- **earliest**: start from the oldest retained record (replay all available history).
- **latest** (default): start from the end — only new records after the consumer joins.
- **none**: throw an exception, forcing the app to decide.

It only applies when no committed offset exists; otherwise the consumer resumes from its commit.

#### Code Example / Key Takeaways
```java
p.put("group.id", "analytics");
p.put("auto.offset.reset", "earliest");   // new group replays full history
// "latest" -> only new events; "none" -> error if no committed offset.
// Ignored once the group has a committed offset (resumes from there).
```

---

### Q152. What are the offset-commit failure scenarios (before vs after processing)?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
- **Commit before processing**: if the consumer crashes after committing but before finishing, on restart it resumes past those records → they're **skipped** (at-most-once, possible data loss).
- **Commit after processing**: if it crashes after processing but before committing, on restart it **re-reads** them → possible **duplicates** (at-least-once).

There's no free lunch: choose at-least-once + idempotent processing (common), or transactions for exactly-once.

#### Code Example / Key Takeaways
```java
// AT-LEAST-ONCE (recommended default): process then commit -> dup-safe via idempotency
process(r); consumer.commitSync();

// AT-MOST-ONCE: commit then process -> loss on crash, never duplicates
consumer.commitSync(); process(r);
```

---

### Q153. What is consumer lag and why does it matter?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
Consumer lag = (latest offset in a partition) − (consumer group's committed offset) — i.e. how many records the group hasn't processed yet. It's the key health metric: steady/low lag means consumers keep up; growing lag means they're falling behind (slow processing, too few consumers, a hot partition, or downstream bottlenecks). Alert on lag trend, not just absolute value.

#### Code Example / Key Takeaways
```bash
kafka-consumer-groups.sh --bootstrap-server b:9092 \
  --describe --group billing
# TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# orders 0          10450           10480           30   <- 30 records behind
```

---

### Q154. How do you reduce consumer lag?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
- **Add consumers** to the group — but effective parallelism is capped at the **partition count** (extra consumers idle).
- **Add partitions** if you've hit that cap (mind key-ordering effects).
- **Speed up processing**: batch downstream writes, async I/O, remove per-record network calls.
- **Tune fetching**: larger `max.poll.records`, `fetch.min.bytes` for throughput.
- **Offload heavy work** to a worker pool while keeping `poll()` responsive.

#### Code Example / Key Takeaways
```text
Lag rising -> in order of impact:
  1) more consumers (up to #partitions)
  2) faster processing (batch writes, async, dedupe network calls)
  3) more partitions (if at consumer cap)
  4) tune max.poll.records / fetch.min.bytes
  5) offload processing to worker threads (keep poll() alive)
```

---

### Q155. Explain the fetch-tuning settings: `fetch.min.bytes`, `fetch.max.wait.ms`, `max.partition.fetch.bytes`, `max.poll.records`.
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
- **fetch.min.bytes**: broker waits until it has at least this many bytes before responding — bigger = fewer, larger fetches (throughput) at some latency cost.
- **fetch.max.wait.ms**: max time the broker waits to satisfy `fetch.min.bytes` before replying anyway (bounds latency).
- **max.partition.fetch.bytes**: max data returned per partition per fetch (memory bound).
- **max.poll.records**: max records `poll()` returns per call — controls processing batch size and helps avoid `max.poll.interval.ms` violations.

#### Code Example / Key Takeaways
```java
p.put("fetch.min.bytes", 64 * 1024);        // wait for 64KB -> fewer round-trips
p.put("fetch.max.wait.ms", 500);            // but no longer than 500ms
p.put("max.partition.fetch.bytes", 1048576);// 1MB/partition cap
p.put("max.poll.records", 500);             // process 500 per poll -> keep poll() timely
```

---

### Q156. What is a poison message and how do you handle it?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
A poison message is a record that **repeatedly fails** processing (bad schema, corrupt data, a bug), blocking the partition if you keep retrying it forever. Handle it with: **bounded retries** (with backoff), then route it to a **dead-letter topic (DLT)** so the partition can proceed, plus alerting and a replay/remediation path. Never infinite-retry inline — one poison record can halt an entire partition and grow lag.

#### Code Example / Key Takeaways
```java
try {
    process(r);
} catch (Exception e) {
    if (r.headers().lastHeader("retries") == null || retriesLeft(r) > 0) {
        sendToRetryTopic(r);            // bounded retries with delay
    } else {
        sendToDeadLetterTopic(r, e);    // give up -> DLT, alert, don't block partition
    }
}
consumer.commitSync();  // move past it so the partition keeps flowing
```

---

### Q157. What is a Dead-Letter Topic (DLT) and a replay strategy?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
A DLT is a dedicated topic where records that can't be processed after retries are parked for investigation, so the main flow isn't blocked. Include failure metadata (original topic/partition/offset, exception, timestamp) in headers. **Replay**: diagnose and fix the root cause (bug/data), validate the record, then republish selected records back to the original (or a controlled recovery) topic — with safeguards (dedup, rate limiting) so replay doesn't cause new problems.

#### Code Example / Key Takeaways
```java
// Producing to DLT with context
ProducerRecord<String,String> dlt = new ProducerRecord<>("orders.DLT", r.key(), r.value());
dlt.headers().add("orig-topic", r.topic().getBytes());
dlt.headers().add("orig-offset", Long.toString(r.offset()).getBytes());
dlt.headers().add("error", e.getMessage().getBytes());
producer.send(dlt);
// Replay: fix cause -> validate -> republish to source topic with dedup safeguards.
```

---

### Q158. How do you commit specific offsets manually (per partition)?
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
`commitSync(Map<TopicPartition, OffsetAndMetadata>)` lets you commit exact offsets rather than "everything polled." You commit **next offset to read** = last processed offset + 1. This is useful for fine-grained control (e.g. commit per partition as each finishes, or commit mid-batch after a checkpoint).

#### Code Example / Key Takeaways
```java
Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
for (ConsumerRecord<String,String> r : recs) {
    process(r);
    offsets.put(new TopicPartition(r.topic(), r.partition()),
                new OffsetAndMetadata(r.offset() + 1));   // commit NEXT offset
}
consumer.commitSync(offsets);   // precise, per-partition commit
```

---

### Q159. How do you seek to a specific offset or timestamp (replay)?
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
Use `seek()` to reposition a consumer: `seekToBeginning()`/`seekToEnd()` for extremes, `seek(partition, offset)` for an exact offset, or `offsetsForTimes()` to translate a timestamp into offsets and seek there — enabling time-based replay ("reprocess everything since 2am"). Seeking must happen after partitions are assigned (after a `poll()` or in a rebalance callback).

#### Code Example / Key Takeaways
```java
// Replay from a point in time
long since = Instant.now().minus(Duration.ofHours(2)).toEpochMilli();
var tp = new TopicPartition("orders", 0);
Map<TopicPartition,Long> query = Map.of(tp, since);
OffsetAndTimestamp ot = consumer.offsetsForTimes(query).get(tp);
if (ot != null) consumer.seek(tp, ot.offset());   // reprocess from 2h ago
```

---

### Q160. What is the difference between `subscribe()` and `assign()`?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
- **subscribe(topics)**: joins a **consumer group**; Kafka dynamically assigns partitions and rebalances as members change. Use for scalable, auto-balanced consumption.
- **assign(partitions)**: **manually** pins specific partitions to this consumer — no group management, no rebalancing, no automatic offset ownership by group coordination. Use for precise control (e.g. reading one partition, custom frameworks). You can't mix them on one consumer.

#### Code Example / Key Takeaways
```java
// Group-managed, auto-balanced:
consumer.subscribe(List.of("orders"));

// Manual, fixed assignment (no rebalancing):
consumer.assign(List.of(new TopicPartition("orders", 3)));
```

---

### Q161. Can one consumer read multiple partitions? Can one partition go to multiple consumers in a group?
**Difficulty:** `Basic`
**Category:** Kafka Consumers

#### Answer
Yes — a single consumer can be assigned **many** partitions (it round-robins across them in `poll()`). But within **one consumer group**, a partition is owned by exactly **one** consumer at a time — never two simultaneously — which preserves per-partition ordering and avoids double processing. Across different groups, the same partition is read independently by each group.

#### Code Example / Key Takeaways
```text
Group "billing", topic with P0-P3, 2 consumers:
  C1 <- P0, P1     C2 <- P2, P3      (one consumer, many partitions: OK)
Never: P0 -> C1 AND C2 in the same group (one owner per partition per group).
```

---

### Q162. How do you pause and resume partitions for backpressure?
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
`consumer.pause(partitions)` stops fetching records for those partitions while still calling `poll()` (so heartbeats continue and the consumer isn't kicked from the group); `resume()` re-enables them. This is the correct way to apply **backpressure** when a downstream is overwhelmed — you keep the consumer alive without pulling more data than you can handle, avoiding `max.poll.interval.ms` violations.

#### Code Example / Key Takeaways
```java
if (downstreamQueue.isFull()) {
    consumer.pause(consumer.assignment());   // stop fetching, keep heartbeating
}
var recs = consumer.poll(Duration.ofMillis(200));  // still poll -> stays in group
if (downstreamQueue.hasCapacity()) {
    consumer.resume(consumer.assignment());  // start fetching again
}
```

---

### Q163. What is `read_committed` vs `read_uncommitted` isolation level?
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
For consumers reading topics written by **transactional** producers:
- **read_uncommitted** (default): returns all records, including those from open or **aborted** transactions.
- **read_committed**: returns only records from **committed** transactions; it buffers and hides aborted/in-flight transactional records, and won't advance past the last stable offset. Required for exactly-once reads.

#### Code Example / Key Takeaways
```java
p.put("isolation.level", "read_committed");
// Consumer sees ONLY committed transactional records; aborted ones are invisible.
// Needed downstream of transactional/EOS producers.
```

---

### Q164. What happens when a consumer crashes before committing?
**Difficulty:** `Basic`
**Category:** Kafka Consumers

#### Answer
The group coordinator detects the failure (missed heartbeats / `session.timeout.ms` or a `max.poll.interval.ms` violation), triggers a **rebalance**, and reassigns the dead consumer's partitions to surviving members. Those consumers **resume from the last committed offset**, so any records processed-but-not-committed are re-read (duplicates possible → at-least-once). No committed progress is lost.

#### Code Example / Key Takeaways
```text
Consumer crashes -> misses heartbeats -> coordinator times it out -> REBALANCE
-> its partitions reassigned -> peers resume from last COMMITTED offset
-> uncommitted-but-processed records are reprocessed (idempotency handles dupes).
```

---

### Q165. How do you gracefully shut down a consumer?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
Signal the poll loop to stop (a flag), call `consumer.wakeup()` from another thread to interrupt a blocking `poll()` (throws `WakeupException`), then commit final offsets and `close()` (which also leaves the group promptly, triggering a faster rebalance than a timeout). Graceful shutdown avoids reprocessing and reduces rebalance disruption.

#### Code Example / Key Takeaways
```java
// Shutdown hook / other thread:
running = false;
consumer.wakeup();                      // interrupts a blocked poll()

// In the loop:
try {
    while (running) { var r = consumer.poll(Duration.ofMillis(500)); /* ... */ }
} catch (WakeupException ignore) {      // expected on shutdown
} finally {
    consumer.commitSync();              // final offsets
    consumer.close();                   // leaves group -> fast rebalance
}
```

---

### Q166. What is the difference between committed offset, current position, and high watermark?
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
- **Position**: the offset of the next record this consumer will fetch (advances as you poll).
- **Committed offset**: the last offset durably saved for the group in `__consumer_offsets` — the resume point after a crash/rebalance.
- **High watermark**: the highest offset replicated to enough ISRs; consumers can't read beyond it (in read_committed, the last stable offset applies).

Position ≥ committed (you may have polled ahead of what you committed); high watermark bounds what's readable.

#### Code Example / Key Takeaways
```text
Partition log: [ ... committed=100 ... position=150 ... highWatermark=180 ... LEO=185 ]
committed(100)  : resume point after restart (group offset)
position(150)   : next fetch for this running consumer
highWatermark(180): max readable (replicated to ISR)
LEO(185)        : leader's log end (not yet fully replicated)
```

---

### Q167. How do you process records concurrently while keeping offsets correct?
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
Since `KafkaConsumer` is single-threaded, to parallelize heavy processing you hand records to a worker pool — but then you must only commit an offset once **all records up to it** are done, or you risk committing past unfinished work (loss on crash). Track completion per partition and commit the highest **contiguous** completed offset. Pause partitions if workers fall behind. Frameworks like Spring Kafka's concurrent listener or a per-key executor simplify this.

#### Code Example / Key Takeaways
```java
// Commit only the highest CONTIGUOUS completed offset per partition
var completed = new ConcurrentSkipListSet<Long>();
for (var r : recs) pool.submit(() -> { process(r); completed.add(r.offset()); });
// after draining/checkpoint: find max contiguous offset from base, commit offset+1
long commitUpTo = highestContiguous(completed, baseOffset);
consumer.commitSync(Map.of(tp, new OffsetAndMetadata(commitUpTo + 1)));
// Pause the partition if the worker queue backs up (backpressure).
```

---

### Q168. What is `group.instance.id` (static membership) and why use it?
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
Setting a stable `group.instance.id` makes a consumer a **static member**. When it restarts (e.g. a rolling deploy) within `session.timeout.ms`, the coordinator recognizes it and **skips the rebalance**, giving back the same partitions — avoiding the churn (and lag spikes) that dynamic membership causes on every restart. Ideal for stateful consumers and frequent deployments.

#### Code Example / Key Takeaways
```java
p.put("group.instance.id", "consumer-pod-3");   // stable identity -> static member
p.put("session.timeout.ms", "45000");
// Restart within the session -> no rebalance, same partitions reassigned.
```

---

### Q169. How do you consume from multiple topics with one consumer?
**Difficulty:** `Basic`
**Category:** Kafka Consumers

#### Answer
Subscribe to a list of topics or a regex pattern; the group coordinator assigns partitions across all subscribed topics among the group's members. One `poll()` returns records from any of them — inspect `record.topic()` to route. Ordering remains per-partition only, never across topics.

#### Code Example / Key Takeaways
```java
consumer.subscribe(List.of("orders", "payments"));          // explicit list
// or by pattern:
consumer.subscribe(Pattern.compile("events\\..*"));         // all events.* topics

for (var r : consumer.poll(Duration.ofMillis(500)))
    switch (r.topic()) { case "orders" -> onOrder(r); case "payments" -> onPay(r); }
```

---

### Q170. Exercise — Consumer: build a robust at-least-once consumer with retries and DLT.
**Difficulty:** `Hard`
**Category:** Kafka Consumers

#### Answer
Disable auto-commit, process then commit (at-least-once), make processing idempotent (dedupe by event id), bound retries with backoff, route permanent failures to a DLT so the partition isn't blocked, and commit after handling each batch. Use `wakeup()` for graceful shutdown.

#### Code Example / Key Takeaways
```java
p.put("enable.auto.commit", "false");
consumer.subscribe(List.of("orders"));
while (running) {
    var recs = consumer.poll(Duration.ofMillis(500));
    for (var r : recs) {
        try {
            if (dedupe.add(eventId(r))) process(r);      // idempotent
        } catch (Exception e) {
            if (retriesLeft(r) > 0) sendToRetryTopic(r); // bounded backoff retries
            else                    sendToDlt(r, e);     // permanent -> DLT, don't block
        }
    }
    consumer.commitSync();                                // commit after the batch
}
```

---
