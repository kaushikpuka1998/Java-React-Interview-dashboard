# Apache Kafka — Production, System Design & Security Interview Questions (Q288–Q312)

---

### Q288. How would you design an order-event system with Kafka?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
Create an `orders` topic partitioned by **order/customer id** (so per-order events stay ordered), RF=3 with `min.insync.replicas=2`, and **idempotent producers** (`acks=all`). Each downstream capability (payment, inventory, shipping, analytics) is its own **consumer group**, so they consume independently and can replay. Add **retry topics + DLT** for failures, **idempotent consumers** for at-least-once safety, **schema governance** (Schema Registry) for contracts, and full **monitoring** (lag, under-replicated). Use the outbox pattern if orders originate in a database.

#### Code Example / Key Takeaways
```text
Topic: orders (key=orderId, RF=3, min.insync=2), producer acks=all + idempotent
Consumers (independent groups): payment | inventory | shipping | analytics
Reliability: retry topics + DLT, idempotent consumers, Schema Registry contracts
Origin in DB? -> outbox pattern + CDC. Monitor: lag, ISR, offline partitions.
```

---

### Q289. How would you guarantee ordering of events for a single order?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
Use the **orderId as the Kafka key**, so all events for that order hash to the **same partition**, where Kafka guarantees offset order. A single consumer in the group owns that partition and processes its events sequentially. Keep the producer **idempotent** (so retries don't reorder), and avoid re-partitioning the topic later (which would break the key→partition mapping). Different orders spread across partitions for parallelism.

#### Code Example / Key Takeaways
```java
// All events for one order -> same partition -> ordered
kafka.send(new ProducerRecord<>("orders", order.getId(), new OrderPlaced(order)));
kafka.send(new ProducerRecord<>("orders", order.getId(), new OrderPaid(order)));
// enable.idempotence=true preserves order on retry; don't re-partition later.
```

---

### Q290. How would you prevent duplicate payment processing?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
Since delivery is at-least-once, dedupe on an **idempotency key** (payment/event id) with a durable **uniqueness check**: attempt to insert the key; if it already exists, skip the charge and return the prior result. Alternatively use a transactional/EOS pipeline for Kafka-internal steps, but the external payment side still needs an idempotency key. Combine with `acks=all` + idempotent producer upstream so you don't create duplicate events in the first place.

#### Code Example / Key Takeaways
```java
@KafkaListener(topics = "payments", groupId = "payment-processor")
void handle(PaymentCommand cmd) {
    boolean first = payments.recordIfNew(cmd.idempotencyKey());  // unique constraint
    if (first) gateway.charge(cmd);                              // charge once only
    // duplicate delivery -> recordIfNew=false -> no second charge.
}
```

---

### Q291. How would you handle a failed consumer in production?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
Rely on **consumer group coordination**: when a consumer dies, the coordinator times it out and **reassigns** its partitions to healthy members, which resume from the last **committed offset**. Design for this: at-least-once + idempotent processing (so reprocessing is safe), bounded retries + DLT for poison records, static membership/cooperative rebalancing to minimize disruption, health checks/auto-restart (k8s), and alerting on lag and rebalance rate.

#### Code Example / Key Takeaways
```text
Consumer fails -> coordinator reassigns partitions -> peers resume from committed offset.
Make it safe: idempotent processing, retries + DLT, static membership + cooperative assignor,
k8s liveness/restart, alert on lag & rebalance frequency.
```

---

### Q292. How would you design retry topics with backoff?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
Use **tiered retry topics** with increasing delays (e.g. `orders.retry.5s`, `orders.retry.1m`, `orders.retry.10m`): a failed record is republished to the next retry tier; a consumer for that tier waits the delay (or uses a scheduler) before reprocessing. After exhausting tiers, route to the **DLT**. Track attempt count in headers. Spring Kafka's `@RetryableTopic` automates this (non-blocking retries) so a poison record doesn't block the main partition.

#### Code Example / Key Takeaways
```java
// Spring Kafka non-blocking retries -> auto-creates retry topics + DLT
@RetryableTopic(attempts = "4",
    backoff = @Backoff(delay = 5000, multiplier = 3.0),   // 5s, 15s, 45s
    dltStrategy = DltStrategy.FAIL_ON_ERROR)
@KafkaListener(topics = "orders", groupId = "fulfillment")
void handle(Order o) { process(o); }   // failures flow to retry topics then DLT
```

---

### Q293. What is a DLT replay strategy?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
A DLT replay is the controlled reprocessing of dead-lettered records after the root cause is fixed. Steps: **inspect** the failures (headers carry original topic/offset/error), **fix** the underlying bug/data or a downstream dependency, **validate** the records, then **republish** selected records to the original (or a dedicated recovery) topic with **safeguards** — deduplication (idempotency), rate limiting (don't flood), and monitoring. Never blindly replay everything; curate and throttle.

#### Code Example / Key Takeaways
```text
1) Inspect DLT records (orig-topic/offset/error headers)
2) Fix root cause (bug/data/downstream)
3) Validate records
4) Republish selected records to source/recovery topic
   with: idempotency (dedupe), rate limiting, monitoring, rollback plan.
```

---

### Q294. How do you choose the partition count for a topic?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
Estimate from: target **throughput** ÷ per-partition throughput, required **consumer parallelism** (partitions ≥ max consumers), **broker capacity** (partitions per broker limits), expected **growth**, **recovery/rebalance** cost (more partitions = slower), and **ordering** needs (keys spread across partitions). Pick the max of the throughput- and parallelism-driven numbers, add headroom, but avoid excessive counts. Remember you can increase but not easily decrease, and increasing changes key mapping.

#### Code Example / Key Takeaways
```text
partitions = max( throughput_target / per_partition_throughput , consumers_needed )
             + growth headroom
Constraints: broker partition limits, recovery/rebalance time, key-ordering effects.
Increase possible (breaks key mapping); decrease NOT supported -> size with care.
```

---

### Q295. Can partition count be increased or decreased, and what are the effects?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
- **Increase**: supported (`kafka-topics.sh --alter --partitions N`), but it **changes `hash(key) % partitions`**, so existing keyed records stay in old partitions while new ones map differently — **breaking per-key ordering** across the change and re-skewing distribution.
- **Decrease**: **not supported** in place; you must create a new topic with fewer partitions and **migrate/replicate** data, then switch producers/consumers.

Plan partitions up front to avoid both problems.

#### Code Example / Key Takeaways
```bash
# Increase (careful: re-hashes keys, breaks per-key ordering going forward)
kafka-topics.sh --alter --topic orders --partitions 24 --bootstrap-server b:9092
# Decrease: NOT supported -> create new topic + migrate data + cut over.
```

---

### Q296. How would you design Kafka for 1 million events per second?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
Partition heavily for parallelism, spread across many brokers on fast disks/NICs, and tune the pipeline: producer **batching + compression** (lz4/zstd), large `buffer.memory`, adequate `linger.ms`; consumers scaled to partition count with big fetches; RF=3 with enough replication throughput; sufficient `num.io.threads`/network threads; and OS/page-cache-friendly config. Size CPU/network/disk to the sustained rate with headroom, and **benchmark** (`kafka-producer/consumer-perf-test`) before production. Consider tiered storage for long retention.

#### Code Example / Key Takeaways
```text
1M events/s blueprint:
  - many partitions across many brokers (parallelism)
  - producers: batch + zstd/lz4 compression, big buffer, linger.ms tuned
  - consumers scaled to #partitions, large fetches
  - RF=3, enough replica-fetch + io/network threads
  - fast NVMe, big page cache, sized network
  - BENCHMARK before prod; tiered storage for long retention.
```

---

### Q297. How do you secure Kafka (encryption, authentication, authorization)?
**Difficulty:** `Hard`
**Category:** Security

#### Answer
Three layers:
- **Encryption in transit**: **TLS** on broker listeners (and inter-broker) so data on the wire is encrypted.
- **Authentication**: **SASL** (SCRAM, GSSAPI/Kerberos, OAUTHBEARER) or **mTLS** to verify client/broker identity.
- **Authorization**: **ACLs** granting specific principals rights on specific resources (topics, groups) with least privilege.

Add network isolation, secrets management, quotas, and audit logging. Never run production Kafka open/unauthenticated.

#### Code Example / Key Takeaways
```properties
# Broker: TLS + SASL/SCRAM
listeners=SASL_SSL://:9093
security.inter.broker.protocol=SASL_SSL
sasl.enabled.mechanisms=SCRAM-SHA-512
ssl.keystore.location=/certs/broker.keystore.jks
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
# + ACLs per principal, least privilege.
```

---

### Q298. What is a Kafka ACL and how do you apply least privilege?
**Difficulty:** `Intermediate`
**Category:** Security

#### Answer
An **ACL (Access Control List)** rule defines that a **principal** (authenticated identity) is Allowed/Denied a specific **operation** (Read, Write, Describe, Create…) on a **resource** (topic, consumer group, cluster), optionally scoped by host. Least privilege means granting each service only what it needs — e.g. the order service can **Write** `orders` and **Read** its own group, nothing else. Manage with `kafka-acls.sh`.

#### Code Example / Key Takeaways
```bash
# Allow only the payment service to READ 'orders' via its group
kafka-acls.sh --bootstrap-server b:9093 --add \
  --allow-principal User:payment-svc \
  --operation Read --topic orders \
  --group payment-processor
# Grant only what each principal needs (Write/Read/Describe on specific resources).
```

---

### Q299. What is the difference between SASL, TLS, and mTLS in Kafka?
**Difficulty:** `Hard`
**Category:** Security

#### Answer
- **TLS**: encrypts the connection and authenticates the **server** to the client (broker identity + confidentiality/integrity).
- **SASL**: an **authentication** framework for the **client** (mechanisms: SCRAM = username/password hashed, GSSAPI = Kerberos, OAUTHBEARER = tokens); usually layered over TLS (`SASL_SSL`).
- **mTLS (mutual TLS)**: both client **and** server present certificates, so TLS itself authenticates the client — an alternative to SASL for client identity.

Common setups: `SASL_SSL` (SASL auth + TLS encryption) or mTLS.

#### Code Example / Key Takeaways
```text
TLS   : encrypt + authenticate the SERVER (broker)
SASL  : authenticate the CLIENT (SCRAM/Kerberos/OAuth), usually over TLS = SASL_SSL
mTLS  : both sides present certs -> TLS authenticates the client too (no SASL needed)
Pick SASL_SSL or mTLS depending on your identity/PKI strategy.
```

---

### Q300. How would you migrate from RabbitMQ to Kafka?
**Difficulty:** `Hard`
**Category:** Migration

#### Answer
Map RabbitMQ **queues/exchanges** to Kafka **topics/partitions**, redesigning routing (RabbitMQ's rich exchange routing → topic + key + consumer-side filtering). Establish **consumer groups**, preserve **ordering** requirements via keys, and handle at-least-once + idempotency differences. Migrate incrementally: **dual-run or bridge** (a connector/relay copies messages both ways), validate semantics and throughput, then **cut over** producers and consumers gradually with rollback capability. Don't forget DLQ→DLT and monitoring parity.

#### Code Example / Key Takeaways
```text
RabbitMQ -> Kafka mapping:
  queue/exchange -> topic (+ partitions/keys); routing keys -> topic/key + filtering
  consumers -> consumer groups; DLQ -> DLT
Strategy: bridge/dual-run -> validate ordering/throughput/semantics -> gradual cutover
          -> keep rollback path. Add idempotency for at-least-once.
```

---

### Q301. How would you migrate Kafka topics safely (repartition / cluster move)?
**Difficulty:** `Hard`
**Category:** Migration

#### Answer
Create the **target topic** (new partition count/config or new cluster), **replicate/copy** data (MirrorMaker 2 for cross-cluster, or a stream job), **validate** offsets, schema compatibility, and ordering requirements, then **switch producers and consumers gradually** — often producing to both during a transition — while retaining a **rollback** path. For partition-count changes, remember key mapping changes, so plan for consumers to handle the transition. Verify lag and data completeness before decommissioning the source.

#### Code Example / Key Takeaways
```text
1) create target topic/cluster (new config)
2) replicate data (MirrorMaker 2 / stream copy)
3) validate offsets, schema, ordering, completeness
4) switch producers/consumers gradually (dual-produce during transition)
5) keep rollback; decommission source only after verification.
```

---

### Q302. What is MirrorMaker 2 and when do you use it?
**Difficulty:** `Hard`
**Category:** Migration

#### Answer
**MirrorMaker 2** (built on Kafka Connect) replicates **topics and consumer-group offsets** between Kafka clusters, with topic renaming/prefixing and offset translation. Use it for **cross-datacenter/region replication**, **disaster recovery** (active-passive or active-active), **cluster migration**, or aggregating data from many clusters into one. It handles the plumbing (offset sync so consumers can fail over to the target cluster near their last position).

#### Code Example / Key Takeaways
```text
MirrorMaker 2 (on Kafka Connect):
  replicates topics + consumer-group offsets across clusters, with offset translation.
Use for: DR (active-passive/active-active), cross-region, migration, aggregation.
Renames topics (e.g. source-cluster.orders) to avoid collisions.
```

---

### Q303. Why run multiple Kafka clusters?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
Reasons: **disaster recovery** (a standby cluster in another region), **geographic distribution** (low-latency local clusters + replication), **isolation** (separate workloads/teams/tenants, or prod vs analytics to protect SLAs), **compliance/data residency**, and **independent scaling/upgrades**. The trade-off is operational complexity and cross-cluster replication (MirrorMaker 2) with its own lag/consistency considerations. Prefer one cluster until a concrete driver justifies more.

#### Code Example / Key Takeaways
```text
Multiple clusters for: DR, geo-distribution, workload/tenant isolation,
                       compliance/data residency, independent scaling/upgrades.
Cost: cross-cluster replication (MM2), operational overhead.
Default to one cluster until a real driver appears.
```

---

### Q304. What is disaster recovery in Kafka (RPO/RTO)?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
DR is a tested strategy to restore Kafka service/data after a cluster or region failure, built on cross-region **replication** (MirrorMaker 2), backups, and infrastructure automation. It's defined by two objectives:
- **RPO (Recovery Point Objective)**: max acceptable **data loss** (in time/events) — driven by replication lag.
- **RTO (Recovery Time Objective)**: max acceptable **downtime** to restore service — driven by failover automation.

Design (active-passive vs active-active), replicate offsets so consumers resume near their position, and **regularly test** failover.

#### Code Example / Key Takeaways
```text
DR = replicate (MM2) + backups + automation + tested failover.
RPO: how much data you can lose (bounded by replication lag) -> smaller = more replication.
RTO: how fast you recover (bounded by failover automation).
Replicate offsets so consumers resume near their last position. Test DR regularly.
```

---

### Q305. What is RPO vs RTO?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
- **RPO (Recovery Point Objective)**: the maximum acceptable amount of **data loss**, measured in time or events — "we can afford to lose at most 5 minutes of data." Lower RPO needs more frequent/synchronous replication.
- **RTO (Recovery Time Objective)**: the maximum acceptable **time to restore** service after a failure — "we must be back within 15 minutes." Lower RTO needs more automation and warm standby.

RPO is about data; RTO is about time. Both drive DR design and cost.

#### Code Example / Key Takeaways
```text
RPO = data loss tolerance (time/events)  -> replication frequency/lag
RTO = downtime tolerance (time)          -> failover automation / warm standby
Tighter RPO/RTO = more cost. Define both explicitly per system criticality.
```

---

### Q306. How do you handle a Kafka broker running out of disk?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
A full disk causes **write failures**, replication stalls, and broker instability — a serious incident. Prevent it: **alert early** on disk %/free space, right-size **retention** (time/size) so data ages out, spread partitions (avoid hot brokers via reassignment), and provision headroom. To recover: reduce retention temporarily, delete/reassign partitions to other brokers, add capacity, or (last resort) remove old segments carefully. Consider **tiered storage** to offload old data and shrink local footprint.

#### Code Example / Key Takeaways
```text
Prevent: alert on disk free%, tune retention.ms/bytes, balance partitions, headroom.
Recover: lower retention, reassign partitions off the hot broker, add disk/brokers.
Long-term: tiered storage offloads old segments to object storage.
Full disk -> write failures + instability -> treat as a real incident.
```

---

### Q307. How do you secure Kafka topics with least privilege in a multi-team cluster?
**Difficulty:** `Hard`
**Category:** Security

#### Answer
Give each team/service a distinct **authenticated principal** (SASL/mTLS), grant **topic-scoped ACLs** (Write to topics they own, Read to topics they consume, Describe as needed) and **group-scoped** ACLs for their consumer groups, and deny by default. Use **prefixed topic naming** + ACL patterns for whole domains, enforce **schema governance** for shared topics, apply **quotas** to prevent noisy neighbors, and audit access. This isolates teams and limits blast radius.

#### Code Example / Key Takeaways
```bash
# Team owns 'team-a.*' topics: write to own, read via own groups; default deny
kafka-acls.sh --add --allow-principal User:team-a \
  --operation Write --operation Describe \
  --resource-pattern-type prefixed --topic team-a.
kafka-acls.sh --add --allow-principal User:team-a \
  --operation Read --resource-pattern-type prefixed --group team-a.
# + quotas per principal, schema governance for shared topics, audit logging.
```

---

### Q308. How would you handle poison messages in a production pipeline?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
Detect repeated failures on a record, apply **bounded retries** with backoff (via retry topics or a retry framework), then **isolate** it to a **dead-letter topic** so it doesn't block the partition (avoid infinite inline retries that stall consumption and grow lag). Attach failure context, **alert**, and provide a **replay/remediation** path once the cause is fixed. Combine with idempotent processing so retries/replays are safe.

#### Code Example / Key Takeaways
```text
Poison record -> bounded retries (backoff via retry topics)
             -> exhausted? route to DLT (don't block the partition)
             -> alert + attach context (offset/error) + replay after fix.
Never infinite inline retry (stalls partition, grows lag). Keep processing idempotent.
```

---

### Q309. How do you monitor and alert on a production Kafka cluster?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
Export broker/client **JMX metrics** to Prometheus (via JMX exporter) and visualize in Grafana. Alert on: **consumer lag** trend, **under-replicated** and **offline** partitions, **ISR shrink** rate, **controller** changes, **request latency/queue time**, **disk** free/latency, **CPU/GC**, and **error rates**. Add consumer-lag exporters (Burrow/kafka-lag-exporter) and broker health checks. Alert on user-facing symptoms plus leading indicators, with runbooks per alert.

#### Code Example / Key Takeaways
```text
Pipeline: broker/client JMX -> Prometheus (JMX exporter) -> Grafana + Alertmanager.
Alert on: lag trend, UnderReplicated/Offline partitions, ISR shrinks, controller changes,
          request latency/queue time, disk free, CPU/GC, error rates.
Add: kafka-lag-exporter/Burrow, health checks, per-alert runbooks.
```

---

### Q310. How do you perform a rolling upgrade of a Kafka cluster with zero downtime?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
Upgrade **one broker at a time**: ensure all partitions are fully replicated (no under-replicated partitions) and leadership can move off the broker, then stop, upgrade, restart, wait for it to rejoin the ISR and re-balance leadership before moving to the next. Follow version-specific steps for `inter.broker.protocol.version` / `log.message.format.version` (bump only after all brokers are upgraded). RF≥3 and `min.insync.replicas=2` keep partitions available throughout. Monitor URP/lag between steps.

#### Code Example / Key Takeaways
```text
Per broker, one at a time:
  1) confirm 0 under-replicated partitions
  2) (leadership moves off automatically) stop -> upgrade -> start
  3) wait: rejoin ISR + leadership rebalance -> then next broker
Bump inter.broker.protocol.version AFTER all brokers upgraded.
RF>=3 + min.insync=2 keep it available. Watch URP/lag between steps.
```

---

### Q311. How do you troubleshoot under-replicated partitions?
**Difficulty:** `Hard`
**Category:** System Design

#### Answer
Under-replicated partitions mean followers can't keep up. Check the affected **broker(s)** health: **disk latency/space**, **network** saturation, **CPU/GC** pauses, **replication traffic** (throttles too low, too few `num.replica.fetchers`), failed disks, and recent broker events (restarts, reassignments). Correlate with `IsrShrinksPerSec` and controller logs. Fix the bottleneck (faster disk/network, more fetchers, remove throttle, replace failed disk) so followers rejoin the ISR.

#### Code Example / Key Takeaways
```text
URP > 0 -> follower(s) lagging. Check on the affected brokers:
  disk latency/space, network saturation, CPU/GC, replication throttle,
  num.replica.fetchers, failed disks, recent restarts/reassignments.
Correlate: IsrShrinksPerSec, controller logs. Fix bottleneck -> ISR recovers.
```

---

### Q312. How would you explain Kafka end-to-end in an SDE-2 / system-design interview?
**Difficulty:** `Intermediate`
**Category:** System Design

#### Answer
Give the flow and the trade-offs: producers write keyed records to a **topic's partitions** (leader broker), which are **replicated** to followers (ISR) for durability; **consumer groups** read partitions (one owner per partition) tracking **offsets**, enabling independent, replayable consumption. Cover **ordering** (per partition), **delivery semantics** (at-least-once + idempotency, or EOS/transactions), **failure handling** (leader election, rebalancing, DLT), and **production trade-offs** (partition count, RF/min.insync, retention, monitoring, security). Anchor with a concrete example (order pipeline).

#### Code Example / Key Takeaways
```text
Story arc for the interview:
  producer -> keyed record -> partition leader -> replicate to ISR (durability)
  consumer group -> one owner/partition -> offsets -> independent, replayable reads
  ordering per partition; delivery = at-least-once+idempotency or EOS
  failures: leader election, rebalancing, retry+DLT
  trade-offs: partitions, RF/min.insync, retention, monitoring, security
  ground it in an example (order-event pipeline).
```

---
