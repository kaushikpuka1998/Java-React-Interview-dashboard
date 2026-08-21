# Apache Kafka — System Design Deep Dive Interview Questions (Q81–Q125)

---

### Q81. Why is Kafka required? What problem does it solve?
**Difficulty:** `Basic`
**Category:** Kafka Fundamentals

#### Answer
As systems grow, one service synchronously calling many others creates tight coupling, cascading failures, and load spikes the downstream can't absorb. Kafka decouples producers from consumers with a durable, high-throughput **event log** in the middle: producers write events and move on; consumers read at their own pace, replay history, and scale independently. It absorbs traffic bursts (buffering), enables multiple independent consumers of the same data, and provides durability/ordering that a simple HTTP call or in-memory queue can't. It's the backbone for event-driven architectures and real-time data pipelines.

#### Code Example / Key Takeaways
```text
Without Kafka:  order-svc --HTTP--> payment, inventory, email, analytics
   -> tight coupling, one slow/downstream failure blocks the order

With Kafka:     order-svc --> [ "orders" log ] --> payment
                                                --> inventory
                                                --> email
                                                --> analytics
   -> producer unaffected by consumers; each consumes independently & can replay
```

---

### Q82. What is the difference between Synchronous and Asynchronous processing in system design?
**Difficulty:** `Basic`
**Category:** Kafka Fundamentals

#### Answer
**Synchronous**: the caller waits for the operation to finish (request/response). Simple and immediate, but the caller's latency and availability are coupled to the callee. **Asynchronous**: the caller hands off work and continues; the result is processed later (via queue/log/callback). It improves throughput, resilience, and load leveling but introduces eventual consistency and more moving parts. Kafka is an async mechanism: producing an event returns quickly while consumers process independently.

#### Code Example / Key Takeaways
```java
// Synchronous: block until payment finishes (coupled latency/availability)
PaymentResult r = paymentClient.charge(order);   // waits

// Asynchronous with Kafka: return immediately; payment happens later
kafka.send("orders", order.getId(), new OrderPlaced(order));  // fire and continue
```

---

### Q83. What are the ways to do asynchronous processing in system design?
**Difficulty:** `Intermediate`
**Category:** Kafka Fundamentals

#### Answer
Common approaches: **background threads/executors** (in-process, lost on crash), **database-backed job tables** (durable, pollable), **message queues** (RabbitMQ/SQS — task distribution, delete on ack), **event streaming logs** (Kafka — retained, replayable, multi-consumer), and **scheduler/cron** for deferred work. Choice depends on durability, ordering, replay, fan-out, and throughput needs. Kafka wins when you need durability + high throughput + multiple independent consumers + replay.

#### Code Example / Key Takeaways
```text
In-process executor  -> fast, NOT durable (lost on crash)
DB job table         -> durable, simple, limited throughput
Message queue        -> load distribution, delete-on-ack, single consumer group
Event streaming(Kafka)-> durable log, replay, many consumer groups, high throughput
```

---

### Q84. What is a Message Queue?
**Difficulty:** `Basic`
**Category:** Messaging Concepts

#### Answer
A message queue is a broker that stores messages produced by senders until consumers process them, decoupling the two in time. Classic queues are **point-to-point**: each message is delivered to exactly one consumer among competing consumers, and is typically **removed after acknowledgement**. This is ideal for distributing tasks/work items (a job should run once). Examples: RabbitMQ, ActiveMQ, Amazon SQS. It does not usually retain history for replay once consumed.

#### Code Example / Key Takeaways
```text
Producer -> [ Queue: m1, m2, m3 ] -> Consumer A gets m1
                                   -> Consumer B gets m2   (competing consumers)
                                   -> Consumer A gets m3
Each message processed ONCE, then deleted on ack. Good for task distribution.
```

---

### Q85. What is Event Streaming?
**Difficulty:** `Intermediate`
**Category:** Messaging Concepts

#### Answer
Event streaming stores an **ordered, immutable, replayable log** of events that happened. Unlike a queue, events are **retained** (by time/size) after being read, so multiple independent consumers can each read the full stream and re-read from any position. It models a continuous flow of facts ("OrderPlaced", "PaymentMade") rather than one-off tasks, enabling stream processing, analytics, event sourcing, and many consumers of the same data. Kafka is the canonical event streaming platform.

#### Code Example / Key Takeaways
```text
Append-only log (retained):  [e0 e1 e2 e3 e4 e5 ...]
   Consumer group A reads from offset 0 ...
   Consumer group B reads the SAME events independently ...
   Either can rewind and replay. Events NOT deleted on read.
```

---

### Q86. What is the difference between a Message Queue and Event Streaming?
**Difficulty:** `Intermediate`
**Category:** Messaging Concepts

#### Answer
- **Consumption**: queue deletes on ack (one consumer wins); stream retains, so many consumer groups each read everything.
- **Replay**: queue can't re-read consumed messages; stream can rewind to any offset.
- **Model**: queue = task distribution (do this once); stream = event log / data pipeline (record of facts).
- **Ordering & scale**: streams order per partition and scale via partitioning; queues distribute across competing consumers.

Use a queue for commands/tasks; use streaming for events consumed by multiple systems and for replay/analytics.

#### Code Example / Key Takeaways
```text
                 Message Queue            Event Streaming (Kafka)
Retention        delete on ack            retained (time/size)
Consumers        one gets each msg        many groups get all msgs
Replay           no                       yes (seek to offset)
Best for         task distribution        event log, pipelines, analytics
```

---

### Q87. Is Kafka a Message Queue or an Event Stream?
**Difficulty:** `Intermediate`
**Category:** Kafka Fundamentals

#### Answer
Kafka is fundamentally an **event streaming platform** (a distributed commit log), but it can *behave like* a message queue. With a single consumer group, partitions are load-balanced among consumers (queue-like, work distribution). With multiple consumer groups, every group gets all messages (pub/sub). The key difference from a classic queue is **retention and replay** — Kafka doesn't delete on consume. So: Kafka is a log that can emulate both queue and pub/sub semantics.

#### Code Example / Key Takeaways
```text
Queue-like:  one consumer group "workers" -> partitions split across its consumers
Pub/Sub:     groups "billing" + "analytics" -> each independently gets ALL events
Difference:  Kafka retains + allows replay; a classic MQ deletes on ack.
```

---

### Q88. What is Kafka?
**Difficulty:** `Basic`
**Category:** Kafka Fundamentals

#### Answer
Apache Kafka is a distributed, fault-tolerant, high-throughput **event streaming platform**. At its core it's an append-only, partitioned **commit log**: producers append events to topics, brokers store them durably and replicated across the cluster, and consumers read them by offset at their own pace. It scales horizontally via partitioning, guarantees ordering per partition, retains data for replay, and handles millions of messages/second. It's used for messaging, activity tracking, log aggregation, stream processing, and as the integration backbone of event-driven systems.

#### Code Example / Key Takeaways
```text
Producers --append--> [ Broker cluster: topics -> partitions (replicated logs) ] --read by offset--> Consumers
Traits: distributed, durable (disk + replication), ordered per partition,
        retained/replayable, horizontally scalable, very high throughput.
```

---

### Q89. What is a Topic in Kafka?
**Difficulty:** `Basic`
**Category:** Kafka Fundamentals

#### Answer
A topic is a named **category/stream** of events — the logical channel producers write to and consumers read from (e.g. `orders`, `payments`). Topics are multi-subscriber (many consumer groups). Physically a topic is split into one or more **partitions** for parallelism and scale, and each partition is replicated for fault tolerance. Topics are append-only and retained by a configurable policy.

#### Code Example / Key Takeaways
```bash
# Create a topic split into 6 partitions, replicated 3x
kafka-topics.sh --create --topic orders \
  --partitions 6 --replication-factor 3 --bootstrap-server broker:9092
```

---

### Q90. Is a Topic the same as an Event?
**Difficulty:** `Basic`
**Category:** Kafka Fundamentals

#### Answer
No. An **event** (record/message) is a single immutable fact — a key, value, timestamp, and headers (e.g. "order A1 placed for $42"). A **topic** is the named log/stream that holds many such events over time. Think of the topic as a table/file and events as the rows/lines appended to it. Producers publish events *to* a topic; consumers read events *from* it.

#### Code Example / Key Takeaways
```text
Topic "orders"  =  the log/stream (a container)
Events in it    =  e0{key:A1,val:placed}  e1{key:A2,val:placed}  e2{key:A1,val:paid}
One topic holds many events; an event is a single record within the topic.
```

---

### Q91. What are Partitions and Brokers in Kafka?
**Difficulty:** `Intermediate`
**Category:** Kafka Architecture

#### Answer
A **partition** is an ordered, immutable, append-only sequence of events within a topic; it's the unit of parallelism and ordering. Each event in a partition has a monotonically increasing **offset**. A **broker** is a Kafka server that stores partitions on disk and serves reads/writes; a cluster has many brokers. Partitions of a topic are distributed across brokers so load and storage spread out, and each partition is replicated to other brokers for fault tolerance. More partitions → more parallel consumers → more throughput.

#### Code Example / Key Takeaways
```text
Topic "orders" (6 partitions) spread across 3 brokers:
  Broker1: P0, P3      Broker2: P1, P4      Broker3: P2, P5
Each partition = ordered log with offsets: P0 -> [o0 o1 o2 o3 ...]
Parallelism = number of partitions (max active consumers per group).
```

---

### Q92. How is ordering guaranteed within a partition?
**Difficulty:** `Intermediate`
**Category:** Kafka Architecture

#### Answer
Kafka guarantees **strict order within a single partition**: events are appended sequentially and assigned increasing offsets, and a consumer reads them in that offset order. Ordering is **not** guaranteed across partitions (they're consumed in parallel). To keep related events ordered, produce them with the **same key** (e.g. `orderId`) so Kafka's default partitioner hashes them to the same partition. Thus "all events for order A1" stay ordered, while different orders spread across partitions for scale.

#### Code Example / Key Takeaways
```java
// Same key -> same partition -> guaranteed order for that key
kafka.send("orders", order.getId(), new OrderPlaced(order));  // A1 -> P2
kafka.send("orders", order.getId(), new OrderPaid(order));    // A1 -> P2 (after placed)
// Different orders (A2, A3) may land on other partitions and be processed in parallel.
```

---

### Q93. What is a Consumer Group and how does rebalancing work?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
A **consumer group** is a set of consumers sharing a `group.id` that cooperatively read a topic: each partition is assigned to exactly **one** consumer in the group, so work is split (parallelism) without duplication. Different groups each get the full stream (pub/sub). **Rebalancing** reassigns partitions when consumers join/leave/crash or partitions change — briefly pausing consumption while ownership is redistributed. Max useful consumers in a group = number of partitions (extra consumers sit idle).

#### Code Example / Key Takeaways
```text
Topic "orders" (4 partitions P0-P3), group "billing" with 2 consumers:
  Consumer1 <- P0, P1        Consumer2 <- P2, P3
Add Consumer3 -> rebalance -> C1<-P0,P3  C2<-P1  C3<-P2
Add a 5th consumer -> it's IDLE (more consumers than partitions).
```

---

### Q94. What is the difference between a Topic and a Partition?
**Difficulty:** `Basic`
**Category:** Kafka Architecture

#### Answer
A **topic** is the logical stream/name; a **partition** is a physical sub-log of that topic. A topic is divided into N partitions to enable parallelism, scaling, and ordering-per-key. Producers pick a partition (by key hash or round-robin); consumers in a group divide partitions among themselves. Ordering is per-partition, not per-topic. So: topic = the whole channel, partition = one ordered shard of it.

#### Code Example / Key Takeaways
```text
Topic "payments"  ── split into ──►  P0: [e0 e1 e2]
                                     P1: [e0 e1]
                                     P2: [e0 e1 e2 e3]
Topic = logical name & retention/config; Partition = ordered unit of storage & parallelism.
```

---

### Q95. How do you add a topic in Kafka and choose its configuration?
**Difficulty:** `Basic`
**Category:** Kafka Operations

#### Answer
Create a topic with a name, partition count, replication factor, and retention settings (or enable auto-creation, discouraged in prod). Partition count sets max parallelism (hard to reduce later); replication factor sets fault tolerance (commonly 3). You can also set retention, cleanup policy (delete vs compact), and min in-sync replicas. Prefer explicit creation with capacity planning.

#### Code Example / Key Takeaways
```bash
kafka-topics.sh --create --topic payments \
  --partitions 12 --replication-factor 3 \
  --config retention.ms=604800000 \        # keep 7 days
  --config min.insync.replicas=2 \
  --bootstrap-server broker:9092
```

---

### Q96. What is an Offset and how do multiple consumers use it?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
An **offset** is the sequential id of a record within a partition (0,1,2,…). Each consumer group tracks its **committed offset** per partition — the position up to which it has processed. Different groups have independent offsets, so they read the same partition at different positions. A consumer can also seek to an arbitrary offset to replay. Offsets are what let Kafka retain data yet give each consumer group its own progress pointer.

#### Code Example / Key Takeaways
```text
Partition P0: [ o0 o1 o2 o3 o4 o5 o6 ]
   group "billing"   committed offset = 5  (will read o5 next)
   group "analytics" committed offset = 2  (will read o2 next)  -- independent
Replay: consumer.seek(P0, 0) re-reads from the beginning.
```

---

### Q97. Where are offsets stored and who stores them?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
Consumer group offsets are stored **in Kafka itself**, in an internal compacted topic named `__consumer_offsets` (keyed by group/topic/partition). The consumer commits offsets there — automatically (`enable.auto.commit`) or manually after processing. Storing offsets in Kafka (rather than the old ZooKeeper approach) makes them durable, replicated, and survivable across consumer restarts and rebalances. You may also manage offsets externally (e.g. in your DB) for exactly-once with your sink.

#### Code Example / Key Takeaways
```java
props.put("enable.auto.commit", "false");    // commit manually after processing
records.forEach(r -> process(r));
consumer.commitSync();                        // writes to __consumer_offsets in Kafka
// On restart/rebalance, the group resumes from its committed offset.
```

---

### Q98. How do consumers actually consume events from Kafka (pull vs push)?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
Kafka consumers **pull** (poll) — they request batches of records from the broker, rather than the broker pushing. Pull lets consumers control their own rate (natural backpressure), batch efficiently, and replay by offset. The consumer runs a poll loop: fetch records, process them, commit offsets, repeat. Brokers don't track per-consumer delivery state (consumers own their offsets), which keeps brokers simple and scalable.

#### Code Example / Key Takeaways
```java
while (running) {
    ConsumerRecords<String, Order> recs = consumer.poll(Duration.ofMillis(200)); // PULL
    for (ConsumerRecord<String, Order> r : recs) {
        process(r.value());              // consumer controls its own pace
    }
    consumer.commitSync();               // advance committed offset
}
```

---

### Q99. What is a Broker and what does it store?
**Difficulty:** `Basic`
**Category:** Kafka Architecture

#### Answer
A **broker** is a single Kafka server in the cluster. It stores partition data as **segment files on disk** (append-only logs plus indexes), serves produce/fetch requests, and hosts a subset of the cluster's partitions and their replicas. What's stored: the actual event records (key, value, timestamp, headers) in ordered segments, plus offset indexes and the internal `__consumer_offsets`/metadata. Brokers rely on the OS page cache and sequential disk I/O for speed. One broker is the **leader** for a partition; others hold **follower** replicas.

#### Code Example / Key Takeaways
```text
Broker disk layout (per partition):
  /orders-0/00000000000000000000.log   <- events appended sequentially
           /00000000000000000000.index <- offset -> byte position
Broker serves: producer appends, consumer fetches, replication to followers.
```

---

### Q100. What is Partition Replication in Kafka?
**Difficulty:** `Intermediate`
**Category:** Kafka Reliability

#### Answer
Each partition is copied to multiple brokers (the **replication factor**, e.g. 3). One replica is the **leader** (handles all reads/writes); the others are **followers** that continuously fetch and stay in sync. Replicas that are caught up form the **ISR (In-Sync Replica)** set. If the leader broker fails, a follower from the ISR is promoted to leader, so no data is lost and the partition stays available. Replication is what makes Kafka fault-tolerant.

#### Code Example / Key Takeaways
```text
Partition orders-0, replication-factor 3:
  Broker1: LEADER (orders-0)   <- producers/consumers talk here
  Broker2: follower (in-sync)  <- fetches from leader
  Broker3: follower (in-sync)
ISR = {B1,B2,B3}. If B1 dies -> B2 or B3 promoted to leader (no data loss).
```

---

### Q101. What are Leader and Follower brokers?
**Difficulty:** `Intermediate`
**Category:** Kafka Reliability

#### Answer
For each partition, exactly one replica is the **leader** and the rest are **followers**. All produce and consume traffic for that partition goes through its leader; followers passively replicate the leader's log to stay in the ISR. Leadership is per-partition, so a single broker can be leader for some partitions and follower for others — spreading load. On leader failure, the controller elects a new leader from the ISR. This design balances load and provides high availability.

#### Code Example / Key Takeaways
```text
Broker1: LEADER of P0, FOLLOWER of P1, P2
Broker2: LEADER of P1, FOLLOWER of P0, P2
Broker3: LEADER of P2, FOLLOWER of P0, P1
-> read/write load for each partition spread across different leaders.
```

---

### Q102. What is Kafka metadata and how is the cluster coordinated?
**Difficulty:** `Hard`
**Category:** Kafka Architecture

#### Answer
Cluster **metadata** describes topics, partitions, replica assignments, leaders, and ISR. A **controller** manages this — historically stored in **ZooKeeper**, but modern Kafka uses **KRaft** (Kafka Raft), where a quorum of controllers stores metadata in an internal Raft log, removing the ZooKeeper dependency. Clients fetch metadata to learn which broker leads each partition, then talk directly to that leader. The controller handles leader election and reacts to broker failures.

#### Code Example / Key Takeaways
```text
Producer/Consumer -> ask any broker for METADATA
   -> "P2 leader = Broker3" -> client connects directly to Broker3 for P2
Controller (KRaft quorum) tracks: topics, partitions, leaders, ISR,
   handles leader election on broker failure. (KRaft replaces ZooKeeper.)
```

---

### Q103. Walk through the complete end-to-end Kafka flow.
**Difficulty:** `Hard`
**Category:** Kafka Architecture

#### Answer
1. Producer serializes an event, picks a partition (key hash or round-robin), and sends it to that partition's **leader** broker.
2. Leader appends it to its log, assigns an **offset**, and followers in the ISR replicate it.
3. Once `acks` conditions are met, the leader acknowledges the producer.
4. The event is retained on disk per the retention policy.
5. Consumers in each group **poll** the leader, read from their committed offset, process, and commit the new offset to `__consumer_offsets`.
6. On broker/consumer failure, leader election / rebalancing keeps things running from the last committed state.

#### Code Example / Key Takeaways
```text
Produce: app -> partition(key) -> LEADER append -> offset -> ISR replicate -> ack
Store:   segment files on disk, retained by policy
Consume: group polls leader from committed offset -> process -> commit offset
Recover: leader dies -> ISR promotion;  consumer dies -> rebalance & resume
```

---

### Q104. Why is ordering guaranteed within a partition but not across partitions?
**Difficulty:** `Intermediate`
**Category:** Kafka Architecture

#### Answer
A partition is a single append-only log written and read sequentially, so its offsets define a total order that consumers follow exactly. Across partitions there is no shared clock or coordination — they're written and consumed **in parallel** on possibly different brokers/consumers, so their relative timing is undefined. That parallelism is exactly what gives Kafka its throughput. If you need global ordering you must use a single partition (losing parallelism) or order by key (same key → same partition → ordered).

#### Code Example / Key Takeaways
```text
Within P0: o0 < o1 < o2      (strict, single sequential log)
P0 and P1 consumed in parallel -> no defined order between P0.o1 and P1.o0
Need order for an entity? key by it -> all its events land in ONE partition.
Need TOTAL order? one partition only (throughput bottleneck).
```

---

### Q105. Can multiple consumers read from the same partition?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
Within **one consumer group**, a partition is assigned to exactly **one** consumer at a time — so two consumers in the same group cannot both read the same partition (this preserves ordering and avoids double-processing). Across **different consumer groups**, yes: each group independently reads the same partition with its own offset. So the answer is "same group: no; different groups: yes." This is how Kafka does both work-splitting and fan-out.

#### Code Example / Key Takeaways
```text
Partition P0:
  group "billing"   -> only Consumer-B1 reads P0 (never two in same group)
  group "analytics" -> Consumer-A1 also reads P0 independently (own offset)
Same group => one consumer per partition; different groups => parallel independent reads.
```

---

### Q106. How many partitions should you choose when defining a topic?
**Difficulty:** `Hard`
**Category:** Kafka Operations

#### Answer
Partitions set max consumer parallelism and throughput, but too many add overhead (more files, longer leader elections, more end-to-end latency, more memory). Estimate from target throughput: `partitions ≈ max(desired_throughput / per_partition_throughput, desired_consumer_parallelism)`. Plan for growth since increasing partitions later changes key→partition mapping (breaking per-key ordering) and you can't easily decrease. Common practice: start with a modest number (e.g. tens) sized to peak consumer count, with headroom.

#### Code Example / Key Takeaways
```text
partitions = max( T_target / T_per_partition , consumers_needed )
e.g. need 600 MB/s, one partition sustains ~50 MB/s -> >= 12 partitions
Also >= max consumers you want in a group.
Caution: adding partitions later re-hashes keys -> breaks existing per-key ordering.
```

---

### Q107. When are events deleted from Kafka?
**Difficulty:** `Intermediate`
**Category:** Kafka Operations

#### Answer
Not on consumption. Kafka deletes by **retention policy**: time-based (`retention.ms`, e.g. 7 days) and/or size-based (`retention.bytes`) — old **segments** are removed once past the limit. Alternatively, with **log compaction** (`cleanup.policy=compact`), Kafka retains at least the latest value per key indefinitely (great for changelogs/state). So events live until retention expires or compaction supersedes them — independent of whether consumers have read them.

#### Code Example / Key Takeaways
```bash
# Time/size retention (delete old data)
--config cleanup.policy=delete --config retention.ms=604800000

# Compaction (keep latest value per key forever) — for changelog/state topics
--config cleanup.policy=compact
```

---

### Q108. What are offset commit strategies and the delivery guarantees (at-most-once, at-least-once, exactly-once)?
**Difficulty:** `Hard`
**Category:** Kafka Reliability

#### Answer
The guarantee depends on **when** you commit the offset relative to processing:
- **At-most-once**: commit **before** processing → if you crash mid-process, the message is lost but never reprocessed.
- **At-least-once**: commit **after** processing → on crash you reprocess (duplicates possible) — the common default; make consumers idempotent.
- **Exactly-once**: no message lost or duplicated — achieved with Kafka **transactions** (idempotent producer + transactional read-process-write) or by atomically storing offset with the result in your sink.

#### Code Example / Key Takeaways
```java
// AT-LEAST-ONCE: process first, then commit (safe default; dedupe downstream)
process(record); consumer.commitSync();

// AT-MOST-ONCE: commit first, then process (loss on crash, no dupes)
consumer.commitSync(); process(record);

// EXACTLY-ONCE: transactional produce+offset commit
producer.initTransactions();
producer.beginTransaction();
producer.send(outRecord);
producer.sendOffsetsToTransaction(offsets, groupMetadata);
producer.commitTransaction();
```

---

### Q109. Exercise — Delivery Guarantees: make an at-least-once consumer idempotent.
**Difficulty:** `Hard`
**Category:** Kafka Reliability

#### Answer
At-least-once means duplicates on retry, so the consumer must dedupe. Track processed event ids (or use the natural business key with an upsert / unique constraint) so reprocessing the same event has no additional effect. Commit offsets only after the idempotent write succeeds.

#### Code Example / Key Takeaways
```java
@KafkaListener(topics = "payments", groupId = "ledger")
void handle(PaymentEvent e, Acknowledgment ack) {
    // Unique constraint on event_id makes the insert idempotent
    int rows = jdbc.update(
        "INSERT INTO ledger(event_id, account, amount) VALUES (?,?,?) " +
        "ON CONFLICT (event_id) DO NOTHING", e.id(), e.account(), e.amount());
    // duplicate -> rows == 0, no double credit
    ack.acknowledge();   // commit only after successful (idempotent) write
}
```

---

### Q110. How do consumers know an event has arrived, and how does Kafka handle a consumer crash?
**Difficulty:** `Intermediate`
**Category:** Kafka Consumers

#### Answer
Consumers **poll** in a loop; the broker returns any records past their fetch offset (they don't get "notified" — they ask). Liveness is tracked via **heartbeats** and `max.poll.interval.ms`: if a consumer stops heartbeating or takes too long between polls (crash/hang), the group coordinator declares it dead and triggers a **rebalance**, reassigning its partitions to surviving consumers. Those consumers resume from the last **committed offset**, so no committed progress is lost (uncommitted work is reprocessed → at-least-once).

#### Code Example / Key Takeaways
```text
Poll loop fetches new records past the committed offset.
Heartbeat thread proves liveness; session.timeout.ms / max.poll.interval.ms bound it.
Consumer crashes -> coordinator times it out -> REBALANCE
   -> its partitions reassigned -> peers resume from last committed offset.
```

---

### Q111. Does every event have an offset, and who assigns it?
**Difficulty:** `Basic`
**Category:** Kafka Architecture

#### Answer
Yes — every record in a partition gets a unique, monotonically increasing **offset**, assigned by the **partition leader broker** at append time (not by the producer). Offsets are per-partition (P0 and P1 both start at 0 independently). This offset is the record's permanent address within that partition and what consumers use to track position and replay.

#### Code Example / Key Takeaways
```text
Producer sends record (no offset yet)
  -> LEADER appends to partition log
  -> LEADER assigns next offset (e.g. 42) and returns it in the ack
Offsets are per-partition & assigned server-side by the leader.
```

---

### Q112. What is Backpressure and how does Kafka handle it?
**Difficulty:** `Hard`
**Category:** Kafka Reliability

#### Answer
Backpressure is when producers generate data faster than consumers can process it. Kafka absorbs it naturally because it's a **durable buffer**: events pile up on disk (bounded by retention), and consumers **pull** at their own pace without being overwhelmed or dropping data (unlike push systems). If consumers fall behind, **consumer lag** grows — the signal to scale out consumers (up to the partition count), optimize processing, or add partitions. The producer side can also apply backpressure via buffer limits (`buffer.memory`, `max.block.ms`).

#### Code Example / Key Takeaways
```text
Producer fast, consumer slow -> events buffered on disk, consumer LAG rises.
Kafka handles it via: durable retention + pull-based consumers (no drop, no overload).
Fix rising lag: add consumers (<= #partitions), speed up processing, add partitions.
Producer backpressure: buffer.memory full -> send() blocks up to max.block.ms.
```

---

### Q113. What does Kafka do when a topic is created?
**Difficulty:** `Intermediate`
**Category:** Kafka Operations

#### Answer
On topic creation the controller: validates config, decides **partition placement** and **replica assignment** across brokers (spreading leaders/followers for balance), elects an initial **leader** per partition, updates cluster **metadata**, and instructs brokers to create the on-disk log directories/segment files for their assigned partitions. Once metadata propagates, producers/consumers can discover leaders and start using the topic.

#### Code Example / Key Takeaways
```text
create topic -> controller assigns partitions+replicas to brokers
             -> elects leader per partition
             -> brokers create /topic-N log dirs (empty segment files)
             -> metadata updated & propagated -> clients can produce/consume
```

---

### Q114. How do you add a consumer group to an existing topic?
**Difficulty:** `Basic`
**Category:** Kafka Operations

#### Answer
You don't pre-create consumer groups — just start consumers with a **new `group.id`** subscribed to the topic. The new group registers with the coordinator and, per `auto.offset.reset`, begins from the **earliest** (replay all retained events) or **latest** (only new events) offset. Because Kafka retains events and groups have independent offsets, adding a group never affects existing ones — a core benefit over queues.

#### Code Example / Key Takeaways
```java
props.put("group.id", "new-analytics");            // brand-new group
props.put("auto.offset.reset", "earliest");        // replay full history
                                                   // ("latest" = only new events)
consumer.subscribe(List.of("orders"));
// Existing groups (billing, etc.) are completely unaffected.
```

---

### Q115. How does Kafka handle a huge number of write operations?
**Difficulty:** `Hard`
**Category:** Kafka Performance

#### Answer
Kafka achieves very high write throughput via: **sequential disk writes** (append-only logs are fast even on spinning disks), **partitioning** (writes spread across many partitions/brokers in parallel), **OS page cache** (writes buffered in memory, flushed by the OS), **zero-copy** reads (`sendfile`) for consumers, **batching + compression** on the producer, and minimal per-message broker bookkeeping (consumers own offsets). Together these let a cluster sustain millions of messages/second.

#### Code Example / Key Takeaways
```text
High write throughput comes from:
  - append-only SEQUENTIAL disk I/O (no random seeks)
  - PARTITIONING -> parallel writes across brokers
  - producer BATCHING + COMPRESSION (fewer, bigger requests)
  - OS PAGE CACHE + zero-copy (sendfile) on read path
  - brokers store little per-message state (consumers track offsets)
```

---

### Q116. What is the Pub-Sub model and how does Kafka relate to it?
**Difficulty:** `Intermediate`
**Category:** Messaging Concepts

#### Answer
Pub-Sub (publish-subscribe) decouples publishers from subscribers via topics: publishers send to a topic, and **all** subscribers to that topic receive the message. Classic pub/sub systems (e.g. Google Pub/Sub, JMS topics) typically push to subscribers and don't retain messages after delivery. Kafka implements pub/sub semantics via **consumer groups** (each group = a subscriber that gets all events) but adds a persistent, replayable log — so it's pub/sub plus durability, ordering, and work-partitioning.

#### Code Example / Key Takeaways
```text
Pub/Sub: publisher -> topic -> every subscriber gets a copy
Kafka:   producer  -> topic -> every consumer GROUP gets all events (pub/sub)
                              within a group, partitions split work (queue-like)
Kafka adds: retention + replay + per-partition ordering + horizontal scale.
```

---

### Q117. Why is Kafka not "just" Pub-Sub?
**Difficulty:** `Intermediate`
**Category:** Messaging Concepts

#### Answer
Because Kafka is a **persistent, ordered log**, not just a message dispatcher. Beyond pub/sub fan-out it provides: **retention & replay** (re-read history, bootstrap new consumers), **per-partition ordering**, **partitioned parallelism** (queue-like work splitting within a group), **offset-based independent progress** per group, and durability/replication. Traditional pub/sub usually pushes and forgets. Kafka's log model also enables stream processing (Kafka Streams), event sourcing, and CDC pipelines — use cases plain pub/sub can't serve.

#### Code Example / Key Takeaways
```text
Plain Pub/Sub          Kafka
push & forget          durable log, replayable
no ordering guarantee  ordered per partition
one delivery, no replay seek to any offset, re-read
subscriber = 1 stream  consumer group = fan-out + internal work split
                       + stream processing, event sourcing, CDC
```

---

### Q118. When should you use Kafka and when a simpler Pub/Sub (or queue)?
**Difficulty:** `Intermediate`
**Category:** Messaging Concepts

#### Answer
Use **Kafka** when you need high throughput, durable/replayable event history, multiple independent consumers, ordering, or stream processing (analytics pipelines, event sourcing, CDC, activity streams). Use a **managed Pub/Sub or queue** (SQS, Google Pub/Sub, RabbitMQ) when you want simple task distribution, request/reply, per-message TTL/priority, or minimal ops overhead and don't need replay/ordering/high fan-out. Don't run Kafka's operational complexity for a low-volume job queue.

#### Code Example / Key Takeaways
```text
Choose Kafka when:            Choose simple Pub/Sub/Queue when:
  high throughput / streams      low-volume task distribution
  replay & retention needed      no replay needed
  many independent consumers     one worker pool
  ordering matters               per-message priority/TTL/delay
  event sourcing / CDC           minimal ops, fully managed
```

---

### Q119. Kafka vs RabbitMQ — what are the key differences?
**Difficulty:** `Hard`
**Category:** Messaging Concepts

#### Answer
- **Model**: Kafka is a durable, partitioned **log** (pull, retained, replayable); RabbitMQ is a **smart broker / message queue** (push, routes via exchanges, deletes on ack).
- **Throughput**: Kafka excels at very high throughput and streaming; RabbitMQ favors flexible routing and lower-latency task delivery.
- **Routing**: RabbitMQ has rich routing (direct/topic/fanout/headers exchanges); Kafka routing is by topic/partition/key.
- **Ordering/replay**: Kafka retains & replays with per-partition order; RabbitMQ generally doesn't replay.
- **Use**: Kafka for event streaming/pipelines; RabbitMQ for complex routing, RPC, and traditional task queues.

#### Code Example / Key Takeaways
```text
                Kafka                         RabbitMQ
Paradigm        distributed log (pull)        message broker/queue (push)
Retention       retained, replayable          deleted on ack
Throughput      very high (streaming)          high (task-oriented)
Routing         topic/partition/key           exchanges (direct/topic/fanout/headers)
Ordering        per partition                 per queue (best-effort)
Best for        streams, pipelines, sourcing  routing, RPC, task queues
```

---

### Q120. Can a partition contain events of multiple topics?
**Difficulty:** `Basic`
**Category:** Kafka Architecture

#### Answer
No. A partition belongs to exactly **one** topic and only holds that topic's events. Topics are isolated units of storage and configuration; each has its own set of partitions. A broker hosts partitions from many topics, but any single partition's log contains records for just one topic.

#### Code Example / Key Takeaways
```text
Topic "orders":   P0, P1, P2   (only order events)
Topic "payments": P0, P1       (only payment events)
A partition = one topic's shard. Never mixed. Broker can host both topics' partitions.
```

---

### Q121. Do you create new partitions for every new topic?
**Difficulty:** `Basic`
**Category:** Kafka Operations

#### Answer
Yes — each topic has its **own** partitions, created when the topic is created (you specify the count). Partitions are not shared between topics. Different topics can have different partition counts based on their throughput/parallelism needs (e.g. `orders`=12, `audit-log`=1). Adding a topic means allocating and placing its partitions/replicas across brokers.

#### Code Example / Key Takeaways
```bash
kafka-topics.sh --create --topic orders   --partitions 12 --replication-factor 3 ...
kafka-topics.sh --create --topic audit    --partitions 1  --replication-factor 3 ...
# Each topic gets its own independent set of partitions, sized per its needs.
```

---

### Q122. Can a consumer consume from multiple topics?
**Difficulty:** `Basic`
**Category:** Kafka Consumers

#### Answer
Yes. A single consumer (and consumer group) can **subscribe to multiple topics** at once (by list or regex pattern). The group coordinator assigns partitions across all subscribed topics among the group's consumers. This is handy for a service reacting to several event streams. Ordering is still only guaranteed per partition, not across topics.

#### Code Example / Key Takeaways
```java
consumer.subscribe(List.of("orders", "payments", "shipments"));   // multiple topics
// or by pattern:
consumer.subscribe(Pattern.compile("audit\\..*"));
// The group's consumers share all partitions of all subscribed topics.
```

---

### Q123. How do large systems like Uber, Amazon, YouTube, and WhatsApp use Kafka?
**Difficulty:** `Intermediate`
**Category:** Kafka Real-World

#### Answer
- **Uber**: Kafka is the real-time backbone — trip events, driver/rider location streams, surge pricing, fraud detection, and analytics pipelines feeding stream processors.
- **Amazon-scale commerce**: order events, inventory updates, clickstream, and decoupling microservices; MSK (managed Kafka) for event-driven services.
- **YouTube/streaming-scale**: activity/view events, recommendations, and log/metric aggregation pipelines.
- **WhatsApp/messaging-scale**: high-throughput message routing, delivery/read receipts, and async fan-out to devices.

Common thread: decoupling producers/consumers, absorbing massive event volume, replayable pipelines, and feeding real-time analytics/ML.

#### Code Example / Key Takeaways
```text
Uber:    location + trip events -> surge pricing, ETA, fraud, analytics
Amazon:  order/inventory/clickstream events -> decoupled microservices, ML
YouTube: views/activity events -> recommendations, metrics aggregation
WhatsApp:message/receipt events -> high-throughput routing & async fan-out
Pattern: durable, replayable event backbone feeding real-time processing.
```

---

### Q124. When should you (and shouldn't you) use Kafka in a system design interview?
**Difficulty:** `Intermediate`
**Category:** Kafka Real-World

#### Answer
**Reach for Kafka** when the design needs: async decoupling at scale, high write/ingest throughput, multiple consumers of the same events, replay/retention, ordering per key, or a streaming/analytics/CDC pipeline. **Avoid it** for simple request/reply, low-volume tasks (a queue or DB job table suffices), when you need strict cross-entity global ordering, or when the added operational complexity isn't justified. In interviews, name the specific property (durability, fan-out, replay, throughput) that makes Kafka the right tool — don't add it reflexively.

#### Code Example / Key Takeaways
```text
Use Kafka in a design when you can point to:
  [ ] high-throughput event ingestion   [ ] many independent consumers
  [ ] replay / retention needed         [ ] per-key ordering
  [ ] stream processing / CDC / sourcing
Skip it for: simple RPC, small task queues, strict global ordering, tiny scale.
Interview tip: justify with the PROPERTY, not the buzzword.
```

---

### Q125. Exercise — Kafka Design: build an order-processing pipeline with ordering and no data loss.
**Difficulty:** `Hard`
**Category:** Kafka Real-World

#### Answer
Key the `orders` topic by `orderId` so all events for an order keep order in one partition. Produce with `acks=all` + idempotent producer for no loss/duplication on the write side. Consumers use at-least-once with idempotent writes (dedupe by event id) and commit offsets after processing. Size partitions to peak consumer parallelism, replication factor 3 with `min.insync.replicas=2` for durability.

#### Code Example / Key Takeaways
```java
// Producer: durable + no dup on retry, ordered per order
props.put("acks", "all");
props.put("enable.idempotence", "true");
props.put("min.insync.replicas", "2");            // topic-side config
kafka.send("orders", order.getId(), event);        // key = orderId -> one partition

// Consumer: at-least-once + idempotent sink, commit after processing
@KafkaListener(topics = "orders", groupId = "fulfillment")
void on(OrderEvent e, Acknowledgment ack) {
    if (dedupe.insertIfAbsent(e.eventId()))        // idempotent
        fulfillment.apply(e);
    ack.acknowledge();                             // commit after success
}
```

---
