# Apache Kafka — Performance & Tuning Interview Questions (Q248–Q262)

---

### Q248. How do you improve producer throughput and reduce latency (trade-offs)?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
**Throughput**: larger `batch.size`, some `linger.ms` (5–20ms), compression (lz4/zstd), sufficient `buffer.memory`, efficient serialization, and enough partitions. **Latency**: small/zero `linger.ms`, smaller batches, avoid per-record `.get()`, keep brokers unsaturated, and don't over-tighten `acks` beyond need. They trade against each other — a small `linger.ms` often improves throughput at negligible latency cost, which is a common sweet spot.

#### Code Example / Key Takeaways
```java
// Balanced throughput-leaning producer
p.put("batch.size", 32768);
p.put("linger.ms", 10);
p.put("compression.type", "lz4");
p.put("buffer.memory", 67108864);
// Latency-critical: linger.ms=0, smaller batches, unsaturated brokers.
```

---

### Q249. How do you improve consumer throughput?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
Increase parallelism (more consumers up to partition count), fetch larger batches (`fetch.min.bytes`, `max.partition.fetch.bytes`, `max.poll.records`), optimize processing (batch downstream writes, async I/O, avoid per-record network calls), use efficient deserialization, and offload heavy work off the poll thread. Ensure partition count supports the parallelism you need; a hot partition caps a single consumer regardless of tuning.

#### Code Example / Key Takeaways
```text
Consumer throughput levers:
  - more consumers (<= #partitions)
  - bigger fetches: fetch.min.bytes, max.partition.fetch.bytes, max.poll.records
  - faster processing: batch DB writes, async, dedupe network calls
  - efficient deserialization
  - offload processing to workers (keep poll() responsive)
```

---

### Q250. What is backpressure and how do consumers apply it?
**Difficulty:** `Hard`
**Category:** Performance & Tuning

#### Answer
Backpressure is throttling intake when downstream processing can't keep up, to avoid unbounded memory growth or overload. Kafka's **pull** model gives natural backpressure (consumers fetch at their pace). To apply it explicitly: bound in-flight work queues, **pause** partitions when the downstream is saturated (and resume later), limit concurrent processing, and control poll/commit cadence. Crucially, keep calling `poll()` while paused so heartbeats continue and you don't get kicked from the group.

#### Code Example / Key Takeaways
```java
if (workQueue.size() > HIGH_WATERMARK)
    consumer.pause(consumer.assignment());     // stop fetching, keep heartbeating
consumer.poll(Duration.ofMillis(200));         // still poll -> stay in group
if (workQueue.size() < LOW_WATERMARK)
    consumer.resume(consumer.assignment());
```

---

### Q251. What causes high producer latency?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
Common causes: **broker overload** (CPU/disk/network saturation), **network latency**, **insufficient replication capacity** (acks=all waiting on slow followers), **too-large `linger.ms`**/over-batching, **retries** from transient errors, **slow disks** (fsync/page-cache pressure), and **GC pauses** on broker or client. Diagnose with producer metrics (`request-latency-avg`, `record-queue-time`) and broker request-latency/queue-time metrics.

#### Code Example / Key Takeaways
```text
High produce latency -> check:
  broker CPU/disk/network saturation, request queue time
  acks=all waiting on lagging followers (ISR health)
  linger.ms too high / batches too big
  retries (transient errors), GC pauses (client & broker)
Metrics: request-latency-avg, record-queue-time-avg, RequestQueueTimeMs.
```

---

### Q252. What causes high consumer lag and how do you troubleshoot it?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
Causes: too few consumers, slow per-record processing, downstream bottlenecks (DB/API), frequent rebalances, large messages, hot partitions, or broker/network issues. Troubleshoot by checking **per-partition** lag (is it one partition = hot key?), consumer processing time, rebalance/generation churn, broker health, and downstream latency. Fix the specific bottleneck: add consumers/partitions, speed processing, stabilize rebalances, or rebalance the hot key.

#### Code Example / Key Takeaways
```text
Lag rising -> localize:
  one partition hot? -> keying/partition problem
  all partitions?   -> too few consumers / slow processing / downstream slow
  oscillating?      -> rebalance storm
Check: per-partition LAG, processing time, rebalances, broker health, downstream.
```

---

### Q253. What is a hot partition and how do you fix it?
**Difficulty:** `Hard`
**Category:** Performance & Tuning

#### Answer
A hot partition receives disproportionately more traffic than others — usually because many records share the **same key** (or a low-cardinality key), and keyed partitioning routes them all to one partition. Its consumer becomes a bottleneck while others idle. Fixes: choose a **higher-cardinality key**, **salt** hot keys (append a suffix to spread them, at the cost of per-key ordering), use a custom partitioner, or increase partitions. The root cause is key distribution, not consumer count.

#### Code Example / Key Takeaways
```java
// Salting a hot key to spread load (sacrifices strict per-key ordering)
String saltedKey = hotKey + "#" + (counter++ % SALT_BUCKETS);
producer.send(new ProducerRecord<>("events", saltedKey, value));
// Better keys / more cardinality / custom partitioner also fix hot partitions.
// Adding consumers alone does NOT help a single hot partition.
```

---

### Q254. Can one key be spread across partitions automatically?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
No — the whole point of keying is that a given key maps deterministically to **one** partition (to preserve order). Kafka won't split one key across partitions while keeping that guarantee. If a single key is too hot, you must do **application-level sharding**: salt the key into sub-keys (e.g. `user#0`, `user#1`), accepting that ordering is now only preserved within each sub-key, and your consumer merges/handles them accordingly.

#### Code Example / Key Takeaways
```text
Same key -> same partition (ordering guarantee) -> can't auto-split.
To spread a hot key: app-level sharding via salting:
  "user42" -> "user42#0".."user42#N"  (N partitions possible)
Cost: ordering preserved only within each salted sub-key, not across them.
```

---

### Q255. What are broker network threads and request handler threads?
**Difficulty:** `Hard`
**Category:** Performance & Tuning

#### Answer
A broker separates I/O concerns:
- **Network threads** (`num.network.threads`): accept connections, read requests off sockets, and write responses — they don't do the actual work, they hand requests to a queue.
- **Request handler threads** (`num.io.threads`): pull from the request queue and **process** produce/fetch/etc., touching the log/page cache.

If either pool is undersized, requests queue up (high **request queue time**), raising latency. Tune to CPU/core count and load.

#### Code Example / Key Takeaways
```properties
num.network.threads=3   # accept/read/write sockets, enqueue requests
num.io.threads=8        # process requests (produce/fetch) -> touch log/page cache
# High RequestQueueTimeMs -> handlers saturated (raise num.io.threads / add brokers).
```

---

### Q256. Why monitor request queue time and what does high queue time indicate?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
**Request queue time** is how long a request waits between being read by a network thread and being picked up by a handler thread. High queue time means the handler pool (`num.io.threads`) is **saturated** — the broker is CPU/IO-bound and can't keep up — which shows up as elevated end-to-end produce/fetch latency. It's an early saturation signal; respond by adding I/O threads, reducing load, or adding brokers/partitions to spread work.

#### Code Example / Key Takeaways
```text
Request lifecycle: socket -> network thread -> REQUEST QUEUE -> handler thread -> log
High RequestQueueTimeMs = handlers saturated -> broker overloaded.
Fix: increase num.io.threads, reduce load, scale out brokers/partitions.
```

---

### Q257. What key metrics should Kafka operators monitor?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
Track: **throughput** (bytes/records in/out), **request latency** and **queue time**, **consumer lag** (per group/partition), **under-replicated partitions** and **offline partitions**, **ISR shrink/expand rate**, **controller changes**, **disk %util/latency/free**, **CPU/GC**, **network**, and **error rates** (failed produce/fetch, `NotEnoughReplicas`). Alert on symptoms users feel (lag, latency, offline partitions) plus leading indicators (under-replicated, disk filling).

#### Code Example / Key Takeaways
```text
Golden signals:
  consumer LAG, UnderReplicatedPartitions, OfflinePartitionsCount
  request latency + queue time, ISR shrink/expand, controller changes
  disk %util/free, CPU/GC, network, error rates (NotEnoughReplicas, failed produce)
Alert on user-facing (lag/latency/offline) + leading (under-replicated/disk).
```

---

### Q258. What is end-to-end latency and how do you diagnose slow consumers?
**Difficulty:** `Hard`
**Category:** Performance & Tuning

#### Answer
**End-to-end latency** is the time from a record being produced to a consumer successfully processing it (produce + broker/replication + fetch + processing). To diagnose slow consumers, break it down: measure consumer **processing time per record**, poll behavior (are you hitting `max.poll.interval.ms`?), fetch metrics, **lag** trend, downstream dependency latency, plus GC/CPU on the consumer and broker health. Isolate whether the delay is in fetching, processing, or downstream.

#### Code Example / Key Takeaways
```text
E2E latency = produce -> broker+replicate -> fetch -> process.
Slow consumer? measure:
  per-record processing time, downstream call latency, GC pauses, CPU
  poll interval violations, fetch throughput, lag trend, broker health
Isolate the stage (fetch vs process vs downstream) before tuning.
```

---

### Q259. What are message size limits and what happens with oversized messages?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
Size is bounded at multiple layers: broker `message.max.bytes` (and topic `max.message.bytes`), producer `max.request.size`, and consumer `max.partition.fetch.bytes`/`fetch.max.bytes`. An oversized record is **rejected** by whichever limit it exceeds — the producer throws `RecordTooLargeException`, or the broker rejects it, or a consumer can't fetch a record larger than its fetch limit (stall). Keep all three consistent, and prefer the claim-check pattern for genuinely large payloads.

#### Code Example / Key Takeaways
```text
Producer max.request.size  -----\
Broker/topic max.message.bytes ---> all must agree; exceed one -> reject/stall
Consumer max.partition.fetch.bytes -/
Oversized -> RecordTooLargeException / broker reject / consumer can't fetch.
Prefer external blob + reference (claim-check) over huge messages.
```

---

### Q260. Which compression algorithm should you choose?
**Difficulty:** `Intermediate`
**Category:** Performance & Tuning

#### Answer
- **lz4**: very fast, moderate ratio — great default for latency-sensitive, high-throughput.
- **zstd**: best compression ratio with good speed (tunable level) — great for saving network/disk, slightly more CPU.
- **snappy**: fast, moderate ratio (older common choice).
- **gzip**: highest ratio but most CPU/slowest — use when bandwidth is the tight constraint.

Choose by workload: CPU-abundant + bandwidth-tight → zstd/gzip; latency-critical → lz4. Bigger batches compress better.

#### Code Example / Key Takeaways
```text
lz4   : fast, moderate ratio  -> low-latency default
zstd  : best ratio, good speed -> save network/disk (a bit more CPU)
snappy: fast, moderate         -> legacy common
gzip  : best ratio (old), high CPU -> bandwidth-constrained only
Batch more (linger.ms) -> better compression regardless of codec.
```

---

### Q261. How do you tune request timeouts and socket buffers?
**Difficulty:** `Hard`
**Category:** Performance & Tuning

#### Answer
- **request.timeout.ms**: how long a client waits for a broker response before retrying/failing; too low causes spurious retries under load, too high delays failure detection.
- **socket.send/receive.buffer.bytes** (client and broker): TCP buffer sizes; larger buffers improve throughput on high-bandwidth/high-latency (high BDP) links (e.g. cross-region replication). Set them to match the bandwidth-delay product.

Tune together with `delivery.timeout.ms` (producer) and replication settings for WAN links.

#### Code Example / Key Takeaways
```properties
request.timeout.ms=30000                 # wait for broker response before retry
socket.send.buffer.bytes=1048576         # bigger TCP buffers for high-BDP links
socket.receive.buffer.bytes=1048576      # (e.g. cross-region replication)
# Match buffers to bandwidth-delay product; don't set request.timeout too low.
```

---

### Q262. Exercise — Tuning: configure producer + topic for a high-throughput pipeline.
**Difficulty:** `Hard`
**Category:** Performance & Tuning

#### Answer
Maximize batching and parallelism while keeping durability: sizable batches with a small linger, zstd compression, ample buffer, acks=all with idempotence, and a topic with enough partitions and RF=3/min.insync=2. Benchmark with `kafka-producer-perf-test` before production.

#### Code Example / Key Takeaways
```java
p.put("batch.size", 65536);           // 64KB batches
p.put("linger.ms", 15);               // fill batches
p.put("compression.type", "zstd");    // save network/disk
p.put("buffer.memory", 134217728);    // 128MB
p.put("acks", "all");
p.put("enable.idempotence", "true");
// Topic: --partitions 24 --replication-factor 3 --config min.insync.replicas=2
// Validate: kafka-producer-perf-test.sh --num-records ... --throughput -1
```

---
