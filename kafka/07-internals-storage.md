# Apache Kafka — Internals & Storage Interview Questions (Q228–Q247)

---

### Q228. How does Kafka store records on disk?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
Kafka stores each **partition** as an **append-only commit log** on disk — a directory containing ordered **segment** files. New records are appended sequentially to the active segment (fast sequential I/O); records are never modified in place. Alongside the `.log` files, Kafka keeps offset and timestamp **indexes** for fast lookups. This log-structured design is why Kafka is fast and why it retains/replays data rather than deleting on consume.

#### Code Example / Key Takeaways
```text
/var/kafka/orders-0/
  00000000000000000000.log     <- records appended sequentially
  00000000000000000000.index   <- offset -> file position (sparse)
  00000000000000000000.timeindex<- timestamp -> offset
  00000000000000010000.log     <- next segment (after roll)
```

---

### Q229. What is a log segment and why does Kafka use segments?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
A partition log is split into fixed-size/time **segments** rather than one giant file. Only the newest (active) segment is written; older ones are read-only. Segments make retention and deletion efficient (drop whole old segment files instead of rewriting a huge file), enable per-segment indexing, and bound recovery/compaction work. `segment.bytes` and `segment.ms` control when the active segment **rolls** to a new one.

#### Code Example / Key Takeaways
```text
Segment benefits:
  - delete old data = remove whole segment files (cheap)
  - each segment has its own index (fast lookup)
  - bounded compaction/recovery per segment
segment.bytes (size) / segment.ms (time) trigger rolling to a new active segment.
```

---

### Q230. What is log rolling?
**Difficulty:** `Basic`
**Category:** Internals & Storage

#### Answer
Log rolling is closing the current **active segment** and starting a new one when a threshold is hit — the segment reaches `segment.bytes` in size or `segment.ms` in age. Rolling bounds segment size (so retention/deletion and indexing stay efficient) and lets time-based retention delete older segments. A very large `segment.ms` with low traffic can delay deletion, since retention acts on **closed** segments.

#### Code Example / Key Takeaways
```properties
segment.bytes=1073741824   # roll at 1GB
segment.ms=604800000       # or roll after 7 days
# Retention deletes CLOSED segments -> tune so old data actually ages out.
```

---

### Q231. How do Kafka indexes and the sparse offset index work?
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
Each segment has a **sparse index** mapping *some* offsets to byte positions in the `.log` file (an entry roughly every `index.interval.bytes`, not every record). To find offset N, Kafka binary-searches the index for the nearest lower entry, then scans forward in the log — O(log n) + a small scan, without indexing every record (saving memory). A separate **time index** maps timestamps to offsets for time-based lookups (`offsetsForTimes`).

#### Code Example / Key Takeaways
```text
Sparse offset index (every ~4KB, not every record):
  offset 0    -> byte 0
  offset 512  -> byte 40960
  offset 1024 -> byte 81920
Lookup offset 700: binary-search index -> start at 512@40960 -> scan forward to 700.
Time index: timestamp -> offset (powers offsetsForTimes / time-based seek).
```

---

### Q232. What is the page cache and why does Kafka rely on it?
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
The **page cache** is the OS filesystem cache in RAM. Kafka writes to the log via the page cache (the OS flushes to disk asynchronously) and serves reads from it — recently produced records are usually still in cache, so consumers reading near the tail hit RAM, not disk. Kafka deliberately keeps the JVM heap small and lets the OS manage caching, avoiding duplicate app-level caches and GC pressure. This is central to Kafka's throughput.

#### Code Example / Key Takeaways
```text
Produce -> append to page cache (RAM) -> OS flushes to disk asynchronously
Consume tail -> served from page cache (no disk read)
=> keep JVM heap modest; give the OS lots of RAM for page cache.
```

---

### Q233. What is zero-copy and how does Kafka use it?
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
**Zero-copy** avoids copying data through user space when sending it over the network. Normally serving a file to a socket copies bytes disk→kernel→app→kernel→socket. Kafka uses the OS **`sendfile`** syscall to transfer log data directly from the page cache to the network socket, skipping the app-space copies and context switches. This makes the consumer read path extremely efficient at high throughput.

#### Code Example / Key Takeaways
```text
Without zero-copy: page cache -> app buffer -> socket buffer -> NIC (4 copies, 2+ switches)
With sendfile:     page cache -----------------------> socket/NIC (kernel-only)
=> Kafka serves consumers directly from page cache with minimal CPU.
(TLS/encryption can reduce zero-copy applicability.)
```

---

### Q234. Why is Kafka so fast?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
Several design choices compound: **sequential disk I/O** (append-only log, no random seeks), **page cache** (reads/writes hit RAM, OS-managed), **zero-copy** (`sendfile` on the read path), **batching** (producer/broker amortize per-record overhead), **compression** (less network/disk), **partition parallelism** (scale across cores/brokers), and minimal per-message broker state (consumers own offsets). Together these let commodity hardware sustain very high throughput.

#### Code Example / Key Takeaways
```text
Speed = sequential I/O + page cache + zero-copy + batching + compression
        + partition parallelism + lean broker bookkeeping.
No random disk seeks, no per-message ack tracking on the broker -> high throughput.
```

---

### Q235. What is log compaction and when should you use it?
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
Log compaction (`cleanup.policy=compact`) retains at least the **latest value per key** and eventually removes older superseded values — so the topic becomes a compacted **changelog/snapshot** of current state rather than a time-bounded stream. Use it for **state/changelog** topics: latest config per key, latest account balance, Kafka Streams state, or database change streams where you only need the current value. It runs asynchronously in the background (old values aren't removed instantly).

#### Code Example / Key Takeaways
```text
Before compaction (key -> value):  A=1  B=1  A=2  C=1  A=3  B=2
After compaction (latest per key): A=3  C=1  B=2   (old A=1,A=2,B=1 removed)
Use for: config topics, KTable/Streams state, CDC "current value" streams.
Config: cleanup.policy=compact
```

---

### Q236. What is a tombstone record?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
In a compacted topic, a **tombstone** is a record with a key and a **null value**. It signals **deletion** of that key: after compaction (and a `delete.retention.ms` grace period so consumers can observe it), the key and its prior values are removed from the log. Tombstones are how you delete keys from a compacted (changelog) topic — e.g. reflecting a row deletion in a CDC stream.

#### Code Example / Key Takeaways
```java
// Delete key "A1" from a compacted topic -> send a null-value tombstone
producer.send(new ProducerRecord<>("state", "A1", null));   // tombstone
// After compaction + delete.retention.ms, key "A1" is removed from the log.
```

---

### Q237. What is the log cleaner and dirty ratio?
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
The **log cleaner** is the background component that performs compaction. It works on the "dirty" portion of the log (records after the last clean point) and rewrites segments keeping only the latest value per key. The **dirty ratio** (`min.cleanable.dirty.ratio`) controls when cleaning kicks in — cleaning only when enough dirty data has accumulated to make the work worthwhile (default ~0.5). Tuning it trades compaction frequency/CPU against how promptly stale values are removed.

#### Code Example / Key Takeaways
```properties
min.cleanable.dirty.ratio=0.5   # clean when >=50% of the log is "dirty"
# Lower -> compact more aggressively (fresher state, more CPU)
# Higher -> compact less often (staler tail, less CPU)
# log.cleaner.threads controls cleaner parallelism.
```

---

### Q238. Can a topic use both retention (delete) and compaction?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
Yes — `cleanup.policy=compact,delete` combines both: keep the latest value per key **and** also delete records older than the time/size retention. This is useful when you want a current-state changelog but don't need to keep very old keys forever (bounded compacted topic). With just `compact`, keys are retained indefinitely (until tombstoned); adding `delete` also ages out old data by `retention.ms`/`retention.bytes`.

#### Code Example / Key Takeaways
```properties
cleanup.policy=compact,delete
retention.ms=2592000000     # also drop data older than 30 days
# = latest value per key, but nothing older than 30 days survives.
```

---

### Q239. What are `retention.ms` and `retention.bytes`?
**Difficulty:** `Basic`
**Category:** Internals & Storage

#### Answer
For `cleanup.policy=delete`, these control how long/large a partition's log is kept before old **segments** are deleted:
- **retention.ms**: max age of records (e.g. 7 days) — closed segments older than this are eligible for deletion.
- **retention.bytes**: max size **per partition**; when exceeded, the oldest segments are deleted.

Either (or both) can trigger deletion; the total topic disk use is roughly `retention.bytes × partitions × replication.factor`.

#### Code Example / Key Takeaways
```properties
retention.ms=604800000       # keep 7 days
retention.bytes=10737418240  # or cap each partition at 10GB (whichever hits first)
# Deletion acts on closed segments; disk ≈ retention.bytes × partitions × RF.
```

---

### Q240. What is `segment.bytes` and how does it interact with retention?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
`segment.bytes` is the max size of a single log segment before it rolls. Retention/compaction operate at **segment granularity** — Kafka can only delete a **closed** segment, so segment size affects how finely retention applies. Very large segments mean data ages out in big chunks (and old data lingers until the segment closes); very small segments increase file/handle overhead. Tune it relative to throughput and retention needs.

#### Code Example / Key Takeaways
```text
segment.bytes too large -> old data can't be deleted until the big segment closes
segment.bytes too small -> many files, more open handles / index overhead
Retention deletes whole CLOSED segments -> size affects deletion granularity.
```

---

### Q241. What happens when a record value is null in a compacted vs non-compacted topic?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
- **Compacted topic**: a null value is a **tombstone** — it marks the key for deletion during compaction.
- **Non-compacted (delete) topic**: a null value is just a normal record with no payload; it carries no special deletion meaning and is retained/deleted purely by time/size retention.

So the same null value has very different semantics depending on `cleanup.policy`.

#### Code Example / Key Takeaways
```text
cleanup.policy=compact : key + null value = TOMBSTONE (delete the key)
cleanup.policy=delete  : key + null value = ordinary empty-payload record
Meaning depends on the topic's cleanup policy.
```

---

### Q242. How does partition count impact storage and cluster overhead?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
Each partition (times replication factor) is a set of on-disk log/index files plus in-memory metadata, open file handles, and replication/fetcher connections. More partitions = more parallelism, but also more **memory, file descriptors, controller metadata, longer recovery/leader-election times, and heavier rebalances**. Thousands of unnecessary partitions degrade stability and startup/failover time. Size partitions for real parallelism/throughput needs plus headroom — not "as many as possible."

#### Code Example / Key Takeaways
```text
Per partition-replica cost: log+index files, file handles, memory, fetcher connections.
Too many partitions -> more metadata, slower controller/recovery, heavier rebalances,
                       higher memory & FD usage.
Right-size for throughput/parallelism + growth headroom, not maximal count.
```

---

### Q243. What is disk throughput's role and why monitor disk utilization?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
Brokers write incoming records, replicate to followers, and serve fetches — all disk-bound at volume. If disks are slow or saturated, you get replication lag (followers fall out of ISR), rising produce latency, and consumer lag. A **full disk** causes write failures and broker instability. Monitor disk **utilization, latency, and free space**, use fast disks (SSD/NVMe) sized with headroom, and manage retention/reassignment proactively so partitions don't fill a broker.

#### Code Example / Key Takeaways
```text
Slow/full disk -> ISR shrinks, produce latency up, consumer lag up, write failures.
Monitor: disk %util, I/O latency, free space; alert before full.
Mitigate: SSD/NVMe, size for headroom, tune retention, reassign partitions off hot brokers.
```

---

### Q244. What is the difference between offset and timestamp indexes?
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
- **Offset index** (`.index`): maps a sparse set of **offsets → byte positions** so Kafka can locate a record by offset quickly (used for normal fetches and seeks).
- **Timestamp index** (`.timeindex`): maps **timestamps → offsets** so Kafka can find the first offset at/after a given time — powering `offsetsForTimes()`, time-based retention, and time-based seeking/replay.

Both are per-segment and sparse.

#### Code Example / Key Takeaways
```text
.index      : offset    -> byte position (find record by offset)
.timeindex  : timestamp -> offset        (find record by time; offsetsForTimes)
Both sparse, per segment. Timestamp index enables "replay since T".
```

---

### Q245. What is tiered storage in Kafka?
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
Tiered storage (KIP-405, GA in recent Kafka) lets a broker keep only **recent** log segments on local disk and offload **older** segments to cheaper remote object storage (e.g. S3), while consumers can still read them transparently. This decouples storage from compute — you can retain data for a long time (or "infinitely") without huge local disks, and brokers recover faster (less local data). It's ideal for long-retention/replay use cases at lower cost.

#### Code Example / Key Takeaways
```text
Local disk: hot/recent segments (fast reads)
Remote (S3/object store): older segments (cheap, long retention)
Consumers read both transparently. Benefits: cheaper long retention, faster broker
recovery (smaller local footprint). Enable per-topic (remote.storage.enable).
```

---

### Q246. Why avoid very large Kafka messages, and how do you handle them?
**Difficulty:** `Intermediate`
**Category:** Internals & Storage

#### Answer
Large messages inflate memory (producer/broker/consumer buffers), network and replication cost, latency, and recovery time, and can trip `max.message.bytes`/`max.partition.fetch.bytes` limits. Prefer keeping payloads small: store the large blob externally (S3/blob store) and put a **reference/URL** in the Kafka record (claim-check pattern), or chunk/compress. Raising size limits works but shifts cost onto the whole cluster.

#### Code Example / Key Takeaways
```java
// Claim-check pattern: store the blob externally, publish a small reference
String url = blobStore.put(largePayload);              // S3 etc.
producer.send(new ProducerRecord<>("docs", id,
    "{\"ref\":\"" + url + "\",\"size\":" + largePayload.length + "}"));
// Keeps Kafka records small -> better throughput, memory, replication, recovery.
```

---

### Q247. Exercise — Storage: configure a changelog (state) topic correctly.
**Difficulty:** `Hard`
**Category:** Internals & Storage

#### Answer
A state/changelog topic should be **compacted** (keep latest value per key), with a moderate segment size so compaction runs, `min.insync.replicas=2`/RF=3 for durability, and a `delete.retention.ms` long enough for consumers to observe tombstones before removal. Optionally `compact,delete` to bound very old keys.

#### Code Example / Key Takeaways
```bash
kafka-topics.sh --create --topic account-state \
  --partitions 12 --replication-factor 3 \
  --config cleanup.policy=compact \
  --config min.insync.replicas=2 \
  --config segment.bytes=104857600 \
  --config min.cleanable.dirty.ratio=0.5 \
  --config delete.retention.ms=86400000 \
  --bootstrap-server b:9092
# Latest value per key retained; tombstones remove deleted keys after 1 day.
```

---
