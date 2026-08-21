# Apache Kafka — Producers Interview Questions (Q126–Q147)

---

### Q126. What is KafkaProducer and is it thread-safe?
**Difficulty:** `Basic`
**Category:** Kafka Producers

#### Answer
`KafkaProducer` is the client applications use to publish records to Kafka. It **is thread-safe** and is designed to be shared across threads — creating one producer per application (not per request/thread) is the recommended pattern, since it maintains connection pools, batching buffers, and metadata that are expensive to recreate. Internally it batches records per partition and sends them asynchronously via an I/O thread.

#### Code Example / Key Takeaways
```java
// One shared, thread-safe producer for the whole app
Properties p = new Properties();
p.put("bootstrap.servers", "broker:9092");
p.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
p.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
KafkaProducer<String,String> producer = new KafkaProducer<>(p);  // share across threads
```

---

### Q127. Is `send()` synchronous or asynchronous, and how do you wait for the result?
**Difficulty:** `Basic`
**Category:** Kafka Producers

#### Answer
`send()` is **asynchronous**: it adds the record to the in-memory accumulator (batched per partition) and returns a `Future<RecordMetadata>` immediately; the actual network send happens on a background I/O thread. You can make it effectively synchronous by calling `.get()` on the future (blocks until ack), or pass a **callback** for non-blocking completion handling. Blocking per-record kills throughput — prefer callbacks or `flush()` at checkpoints.

#### Code Example / Key Takeaways
```java
// Async with callback (preferred — high throughput)
producer.send(new ProducerRecord<>("orders", orderId, json), (meta, ex) -> {
    if (ex != null) log.error("send failed", ex);
    else log.info("sent to {}-{}@{}", meta.topic(), meta.partition(), meta.offset());
});

// Synchronous (blocks — use sparingly)
RecordMetadata meta = producer.send(record).get();  // waits for ack
```

---

### Q128. Explain the `acks` setting (0, 1, all) and which is strongest.
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
`acks` controls how many acknowledgements the producer waits for before considering a write successful:
- **acks=0**: fire-and-forget; no ack. Lowest latency, but records can be lost silently.
- **acks=1**: the **leader** acks after writing to its local log; if the leader dies before followers replicate, the record can be lost.
- **acks=all** (-1): the leader waits until all **in-sync replicas** (per `min.insync.replicas`) have the record. Strongest durability, highest latency.

For no data loss use **acks=all** with `min.insync.replicas=2` and replication factor 3.

#### Code Example / Key Takeaways
```java
p.put("acks", "all");                 // strongest: wait for in-sync replicas
p.put("enable.idempotence", "true");  // no duplicates on retry
// Topic side: min.insync.replicas=2, replication.factor=3
// acks=0 -> may lose data; acks=1 -> lose if leader fails pre-replication
```

---

### Q129. What is `min.insync.replicas` and what happens if the ISR falls below it?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
`min.insync.replicas` is the minimum number of in-sync replicas that must acknowledge an **acks=all** write for it to succeed. It's a durability guardrail: with RF=3 and `min.insync.replicas=2`, a write needs the leader + at least one follower in sync. If the ISR shrinks below this (brokers down/lagging), acks=all writes **fail** with `NotEnoughReplicas`/`NotEnoughReplicasAfterAppend` — Kafka refuses to accept data it can't durably replicate (choosing consistency over availability for that partition).

#### Code Example / Key Takeaways
```text
RF=3, min.insync.replicas=2, acks=all:
  ISR = {leader, f1, f2}  -> writes succeed
  ISR = {leader, f1}      -> writes still succeed (2 >= 2)
  ISR = {leader}          -> writes FAIL (NotEnoughReplicas) until a follower re-syncs
Guardrail: never ack data that isn't replicated enough to survive a broker loss.
```

---

### Q130. Explain producer batching: `batch.size` and `linger.ms`.
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
The producer groups records destined for the same partition into **batches** to amortize network/protocol overhead. `batch.size` is the max bytes per batch (per partition) before it's sent; `linger.ms` is how long the producer waits for more records to fill a batch before sending, even if `batch.size` isn't reached. Increasing `linger.ms` (e.g. 5–20ms) trades a little latency for much higher throughput and better compression. `batch.size=0` disables batching.

#### Code Example / Key Takeaways
```java
p.put("batch.size", 32 * 1024);   // 32KB target batch per partition
p.put("linger.ms", 10);           // wait up to 10ms to fill the batch
// Bigger batches + small linger -> fewer, larger requests -> higher throughput.
// linger.ms=0 (default) sends ASAP -> lowest latency, smaller batches.
```

---

### Q131. What is producer compression and what are the trade-offs?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
`compression.type` (none, gzip, snappy, lz4, zstd) compresses record **batches** before sending. It reduces network bandwidth and disk storage (broker stores them compressed) and often *increases* throughput, at the cost of CPU. Compression works best with batching (bigger batches compress better). **lz4** and **zstd** are usually the best balance (zstd = best ratio, lz4 = fastest); gzip has high ratio but more CPU.

#### Code Example / Key Takeaways
```java
p.put("compression.type", "zstd");   // great ratio; lz4 = fastest
p.put("linger.ms", 10);              // batching amplifies compression benefit
// Trade-off: less network/disk, more CPU. Broker stores batches compressed,
// and consumers decompress — end-to-end savings.
```

---

### Q132. What is the idempotent producer and why is it important?
**Difficulty:** `Hard`
**Category:** Kafka Producers

#### Answer
`enable.idempotence=true` makes the producer **exactly-once per partition within a session**: the broker deduplicates retried records so a network retry can't create duplicates. It works by assigning each producer a **PID (producer id)** and a monotonic **sequence number** per partition; the broker rejects duplicates/out-of-order sequences. This fixes the classic "retry after a lost ack creates a duplicate" problem. Enabling it also enforces safe settings (`acks=all`, bounded in-flight). It's the default in recent Kafka and a prerequisite for transactions.

#### Code Example / Key Takeaways
```java
p.put("enable.idempotence", "true");   // PID + per-partition sequence numbers
// Implies acks=all, retries>0, max.in.flight<=5 -> no duplicates from retries,
// and preserves ordering even with retries. Basis for EOS/transactions.
```

---

### Q133. What is `max.in.flight.requests.per.connection` and how does it affect ordering?
**Difficulty:** `Hard`
**Category:** Kafka Producers

#### Answer
It caps the number of unacknowledged produce requests per broker connection. Higher values improve throughput (more parallel in-flight requests) but, **without idempotence**, a retry of an earlier failed request can land *after* a later successful one — reordering records within a partition. With `enable.idempotence=true`, Kafka preserves ordering even with up to 5 in-flight requests (it tracks sequence numbers). Without idempotence, set it to 1 if strict ordering matters.

#### Code Example / Key Takeaways
```java
// Safe ordering + throughput:
p.put("enable.idempotence", "true");
p.put("max.in.flight.requests.per.connection", "5");   // ordering still preserved

// Without idempotence, only in.flight=1 guarantees no reordering on retry.
```

---

### Q134. Explain the producer timeout/retry settings: `delivery.timeout.ms`, `retries`, `retry.backoff.ms`, `max.block.ms`.
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
- **delivery.timeout.ms**: the total upper bound for a record from `send()` to success/failure, including batching, network, and all retries. This is the primary knob to bound delivery.
- **retries**: how many times transient errors are retried (default high; usually leave it and bound via `delivery.timeout.ms`).
- **retry.backoff.ms**: delay between retries (avoids hammering).
- **max.block.ms**: how long `send()`/`partitionsFor()` may block waiting for metadata or free buffer space before throwing.

#### Code Example / Key Takeaways
```java
p.put("delivery.timeout.ms", 120000);  // total budget incl. retries (2 min)
p.put("retry.backoff.ms", 100);        // wait between retries
p.put("max.block.ms", 60000);          // send() blocks max 60s for buffer/metadata
// retries is bounded in practice by delivery.timeout.ms.
```

---

### Q135. What is `buffer.memory` and what happens when the buffer fills?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
`buffer.memory` is the total memory the producer uses to buffer unsent records waiting to be batched/sent. If the app produces faster than the broker can accept (or the network is slow), the buffer fills; then `send()` **blocks** up to `max.block.ms` waiting for space, and throws `TimeoutException` if it can't get any — a form of producer-side backpressure. Size it for your throughput × latency; monitor `buffer-available-bytes`.

#### Code Example / Key Takeaways
```java
p.put("buffer.memory", 64 * 1024 * 1024);  // 64MB of send buffer
p.put("max.block.ms", 5000);               // block up to 5s when buffer is full
// Buffer full + slow broker -> send() blocks (backpressure) -> then throws.
```

---

### Q136. How does the partitioner decide which partition a record goes to?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
The **partitioner** picks the target partition. If the record has a **key**, the default partitioner hashes it (murmur2) modulo partition count → same key always maps to the same partition (preserving per-key order). If the **key is null**, modern Kafka uses a **sticky partitioner**: it fills one partition's batch, then switches, spreading load while keeping batches efficient. You can also supply an explicit partition or a custom `Partitioner`.

#### Code Example / Key Takeaways
```java
// Keyed -> deterministic partition (order preserved per key)
producer.send(new ProducerRecord<>("orders", order.getId(), json)); // hash(key)%N

// Null key -> sticky partitioner spreads records across partitions in batches
producer.send(new ProducerRecord<>("logs", null, line));

// Custom: p.put("partitioner.class", "com.acme.MyPartitioner");
```

---

### Q137. How does changing the partition count affect keyed records?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
Keyed partitioning uses `hash(key) % partitionCount`, so **increasing the partition count changes the mapping** — a key that went to partition 2 may now go to partition 5. This breaks the "all events for key K are in one partition, in order" guarantee across the change: old events for K sit in the old partition, new ones in a different partition, so a consumer can see them out of order relative to each other. Plan partition counts ahead; if you must grow, be aware ordering-sensitive keys are affected.

#### Code Example / Key Takeaways
```text
Before (4 partitions): hash("A1") % 4 = 2  -> partition 2
After  (6 partitions): hash("A1") % 6 = 5  -> partition 5
=> "A1" history split across P2 (old) and P5 (new) -> per-key ordering broken.
Mitigation: size partitions up front; or use a custom partitioner stable to growth.
```

---

### Q138. What is a producer interceptor and when would you use one?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
A `ProducerInterceptor` is a client-side hook that can inspect or modify records **before they're sent** (`onSend`) and observe the result **after acknowledgement** (`onAcknowledgement`). Uses: injecting tracing/correlation headers, standardized metrics, auditing, or lightweight transformation — cross-cutting concerns applied centrally without changing business code. Keep them fast and side-effect-light (they run on the calling thread / I/O path).

#### Code Example / Key Takeaways
```java
public class TracingInterceptor implements ProducerInterceptor<String,String> {
    public ProducerRecord<String,String> onSend(ProducerRecord<String,String> r) {
        r.headers().add("trace-id", currentTraceId().getBytes());   // inject header
        return r;
    }
    public void onAcknowledgement(RecordMetadata m, Exception e) { /* metrics */ }
    public void configure(Map<String,?> c) {} public void close() {}
}
// p.put("interceptor.classes", "com.acme.TracingInterceptor");
```

---

### Q139. How do you serialize keys and values, and how does Avro/Schema Registry fit in?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
Producers convert objects to bytes via a **Serializer** (`key.serializer`, `value.serializer`). Built-ins: String, ByteArray, Integer, etc. For evolving structured events, use a schema-based serializer (Avro/Protobuf/JSON Schema) backed by a **Schema Registry**, which stores schemas and enforces compatibility — the message carries a small schema id, not the full schema, keeping payloads compact and contracts safe.

#### Code Example / Key Takeaways
```java
p.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
p.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");
p.put("schema.registry.url", "http://schema-registry:8081");
// Payload = [magic byte][schema id][avro bytes] -> compact + registry-validated.
```

---

### Q140. How do you improve producer throughput vs latency?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
- **Throughput**: larger `batch.size`, some `linger.ms` (5–20ms), compression (lz4/zstd), enough `buffer.memory`, efficient serialization, and adequate partitions for parallelism.
- **Latency**: small/zero `linger.ms`, smaller batches, avoid synchronous `.get()` per record, keep brokers unsaturated, and don't over-set `acks` beyond your durability need.

These pull in opposite directions — tune to your SLA. Benchmark with `kafka-producer-perf-test`.

#### Code Example / Key Takeaways
```text
Throughput-tuned          Latency-tuned
batch.size high (32-64KB) batch.size small
linger.ms 10-20           linger.ms 0
compression zstd/lz4      compression off/lz4
acks=all (durable)        acks=1 (if loss-tolerant)
more partitions           fewer hops, unsaturated brokers
```

---

### Q141. What is `transactional.id` and what does it enable?
**Difficulty:** `Hard`
**Category:** Kafka Producers

#### Answer
`transactional.id` is a **stable, unique producer identity** that enables Kafka **transactions** (atomic multi-partition/topic writes + consumed-offset commits) and **producer fencing**. When a producer with a given transactional.id starts, it "fences" any older instance with the same id (bumps the epoch), so a zombie/restarted producer can't corrupt the stream. It's required for exactly-once semantics (EOS) that span produce + offset-commit.

#### Code Example / Key Takeaways
```java
p.put("transactional.id", "order-processor-1");  // stable per logical producer
p.put("enable.idempotence", "true");
KafkaProducer<String,String> producer = new KafkaProducer<>(p);
producer.initTransactions();     // fences older instances with the same id
// See transactions section for beginTransaction/commit flow.
```

---

### Q142. How do you write an atomic transactional produce?
**Difficulty:** `Hard`
**Category:** Kafka Producers

#### Answer
With a transactional producer, wrap sends (and optionally consumed-offset commits) in `beginTransaction()` … `commitTransaction()`. All records become visible atomically to `read_committed` consumers; on error you `abortTransaction()` and nothing is exposed. This gives all-or-nothing writes across multiple partitions/topics.

#### Code Example / Key Takeaways
```java
producer.initTransactions();
try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("orders", id, order));
    producer.send(new ProducerRecord<>("audit", id, audit));   // multi-topic atomic
    producer.commitTransaction();     // both visible together, or neither
} catch (KafkaException e) {
    producer.abortTransaction();      // read_committed consumers never see these
}
```

---

### Q143. What is the difference between `flush()` and `close()` on a producer?
**Difficulty:** `Basic`
**Category:** Kafka Producers

#### Answer
`flush()` blocks until all buffered records have been sent and acknowledged (or failed) — useful at checkpoints to ensure delivery without shutting down. `close()` flushes remaining records and then releases resources (connections, I/O thread); after close the producer is unusable. Always `close()` on shutdown (try-with-resources) to avoid losing buffered records.

#### Code Example / Key Takeaways
```java
try (KafkaProducer<String,String> producer = new KafkaProducer<>(p)) {
    producer.send(record);
    producer.flush();     // ensure sent up to this point (producer still usable)
} // close() here: flushes remaining + frees resources
```

---

### Q144. How do producers discover which broker leads a partition?
**Difficulty:** `Intermediate`
**Category:** Kafka Producers

#### Answer
On startup the producer connects to a `bootstrap.servers` broker and fetches **cluster metadata** (topics, partitions, and each partition's current leader). It caches this and sends each record directly to the **leader** of its target partition. Metadata is refreshed periodically (`metadata.max.age.ms`) and immediately on errors like `NotLeaderForPartition` (e.g. after a leader election), so the producer re-routes to the new leader automatically.

#### Code Example / Key Takeaways
```text
producer -> bootstrap broker -> METADATA {orders: P0 leader=B1, P1 leader=B2, ...}
send(record for P1) -> connect directly to B2 (P1's leader)
Leader changes -> NotLeaderForPartition -> refresh metadata -> route to new leader.
```

---

### Q145. Exercise — Producer: configure a producer for zero data loss and no duplicates.
**Difficulty:** `Hard`
**Category:** Kafka Producers

#### Answer
Combine strong acks, idempotence, and topic-side ISR requirements. `acks=all` + `min.insync.replicas=2` (RF=3) guarantees durability; `enable.idempotence=true` guarantees no duplicates from retries; a generous `delivery.timeout.ms` survives transient issues; key by the entity for ordering.

#### Code Example / Key Takeaways
```java
Properties p = new Properties();
p.put("bootstrap.servers", "b1:9092,b2:9092,b3:9092");
p.put("acks", "all");                    // durability
p.put("enable.idempotence", "true");     // no duplicates + ordering on retry
p.put("retries", Integer.MAX_VALUE);
p.put("delivery.timeout.ms", 120000);
p.put("compression.type", "zstd");
// Topic: replication.factor=3, min.insync.replicas=2
producer.send(new ProducerRecord<>("orders", order.getId(), json));  // ordered per order
```

---

### Q146. What is `client.id` and why set it?
**Difficulty:** `Basic`
**Category:** Kafka Producers

#### Answer
`client.id` is a logical name the client sends with every request. It doesn't affect delivery, but it's invaluable for **observability and control**: broker-side metrics, request logs, and quotas can be attributed per `client.id`, so you can identify which application/instance is producing load or hitting limits. Set a meaningful, stable value per service/instance.

#### Code Example / Key Takeaways
```java
p.put("client.id", "checkout-service-pod-7");
// Shows up in broker metrics/logs and enables per-client quotas & troubleshooting.
```

---

### Q147. How do you handle producer errors (retriable vs non-retriable)?
**Difficulty:** `Hard`
**Category:** Kafka Producers

#### Answer
Kafka distinguishes **retriable** exceptions (transient — `NotEnoughReplicas`, `LeaderNotAvailable`, timeouts) which the client retries automatically within `delivery.timeout.ms`, from **non-retriable** ones (permanent — `RecordTooLargeException`, `SerializationException`, `AuthorizationException`) which fail immediately and must be handled by the app. In the callback, check the exception type: log/deadletter non-retriable failures; rely on built-in retries for transient ones, and alert if delivery ultimately times out.

#### Code Example / Key Takeaways
```java
producer.send(record, (meta, ex) -> {
    if (ex == null) return;
    if (ex instanceof RetriableException) {
        // Kafka already retries these up to delivery.timeout.ms; just log/metric
        log.warn("retriable produce error", ex);
    } else {
        // Permanent: too large / serialization / authz -> dead-letter or alert
        deadLetter(record, ex);
    }
});
```

---
