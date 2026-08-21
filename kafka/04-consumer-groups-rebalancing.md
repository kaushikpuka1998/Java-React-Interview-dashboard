# Apache Kafka — Consumer Groups & Rebalancing Interview Questions (Q171–Q187)

---

### Q171. What is a rebalance and why does it happen?
**Difficulty:** `Basic`
**Category:** Rebalancing

#### Answer
A rebalance is the redistribution of a topic's partitions among the consumers in a group. It's triggered when group membership or metadata changes: a consumer **joins** or **leaves**, a consumer **fails** (missed heartbeats / poll timeout), the **subscription** changes, or the **partition count** changes. During a rebalance, partition ownership is recalculated so every partition has exactly one owner.

#### Code Example / Key Takeaways
```text
Triggers: consumer join/leave, consumer crash (timeout), subscription change,
          partition count change.
Effect:   partitions reassigned among current members (one owner each).
```

---

### Q172. What happens during a rebalance and why can it hurt?
**Difficulty:** `Intermediate`
**Category:** Rebalancing

#### Answer
In the traditional **eager** protocol, all consumers **revoke all** their partitions, then the coordinator computes new assignments and hands them out — a "stop-the-world" pause where **no processing happens** and lag spikes. In-flight work may be reprocessed if offsets weren't committed before revocation. Frequent or slow rebalances are a top cause of latency and duplicate processing, which is why cooperative rebalancing and static membership exist to minimize them.

#### Code Example / Key Takeaways
```text
Eager rebalance timeline:
  all consumers revoke ALL partitions  -> processing STOPS (lag rises)
  coordinator computes assignment      -> hands out new partitions
  consumers resume from committed offsets (uncommitted work reprocessed)
Minimize with: commit-on-revoke, cooperative assignor, static membership.
```

---

### Q173. What is the group coordinator?
**Difficulty:** `Intermediate`
**Category:** Rebalancing

#### Answer
The group coordinator is a **broker** that manages a consumer group's membership and committed offsets. It's the broker that owns the `__consumer_offsets` partition for that group (chosen by hashing the group id). It receives heartbeats, detects failures, drives the rebalance protocol (assigning a group leader consumer to compute the assignment), and stores committed offsets. Each group has exactly one coordinator at a time.

#### Code Example / Key Takeaways
```text
group.id -> hash -> __consumer_offsets partition -> that partition's leader broker
           = the group COORDINATOR
Coordinator duties: membership, heartbeats, failure detection, offset commits,
                    orchestrating rebalances.
```

---

### Q174. Compare RangeAssignor, RoundRobinAssignor, StickyAssignor, and CooperativeStickyAssignor.
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
- **RangeAssignor** (default legacy): assigns contiguous ranges per topic — can imbalance when partition counts differ across topics.
- **RoundRobinAssignor**: distributes all partitions round-robin across consumers — more even, but reshuffles a lot on change.
- **StickyAssignor**: balances **and** tries to keep prior assignments stable across rebalances (less movement).
- **CooperativeStickyAssignor** (recommended): sticky **and** cooperative — revokes only the partitions that must move, without stopping everything (incremental rebalancing).

#### Code Example / Key Takeaways
```java
p.put("partition.assignment.strategy",
      "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");
// Range: per-topic ranges (simple, can imbalance)
// RoundRobin: even spread, more churn
// Sticky: minimal movement
// CooperativeSticky: minimal movement + no stop-the-world (best default)
```

---

### Q175. What is the difference between eager and cooperative (incremental) rebalancing?
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
- **Eager**: every consumer revokes **all** partitions at the start of the rebalance, then gets new ones — full stop-the-world pause.
- **Cooperative (incremental)**: only the partitions that actually need to move are revoked; consumers keep processing the partitions they retain. It takes an extra rebalance round but avoids the global pause, drastically reducing disruption during scaling and rolling deploys.

Cooperative is enabled via `CooperativeStickyAssignor`.

#### Code Example / Key Takeaways
```text
Eager:       revoke ALL -> reassign ALL           (everyone pauses)
Cooperative: revoke only moving partitions        (retained partitions keep flowing)
             -> shorter effective pause, smoother scaling/deploys
```

---

### Q176. What is static membership and how does it reduce rebalances?
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
By assigning a stable `group.instance.id`, a consumer becomes a **static member**. On restart within `session.timeout.ms` (e.g. a rolling deployment or a brief crash), the coordinator recognizes the returning member and **reassigns its previous partitions without a rebalance**. This eliminates the two rebalances (leave + rejoin) that dynamic members trigger on every restart — critical for stateful consumers and frequent deploys.

#### Code Example / Key Takeaways
```java
p.put("group.instance.id", "worker-3");   // static identity
p.put("session.timeout.ms", "45000");     // grace window for restart
// Restart within 45s -> coordinator skips rebalance, returns same partitions.
```

---

### Q177. What are the rebalance listener callbacks (onPartitionsRevoked / Assigned / Lost)?
**Difficulty:** `Intermediate`
**Category:** Rebalancing

#### Answer
A `ConsumerRebalanceListener` lets you react around ownership changes:
- **onPartitionsRevoked**: called **before** losing partitions — commit offsets and flush state here so nothing is reprocessed/lost.
- **onPartitionsAssigned**: called after getting partitions — initialize state, seek to custom offsets.
- **onPartitionsLost**: ownership lost **without** a clean revocation opportunity (e.g. fell out of the group) — clean up without assuming you can commit.

#### Code Example / Key Takeaways
```java
consumer.subscribe(List.of("orders"), new ConsumerRebalanceListener() {
    public void onPartitionsRevoked(Collection<TopicPartition> p) {
        consumer.commitSync();          // commit BEFORE giving up partitions
    }
    public void onPartitionsAssigned(Collection<TopicPartition> p) {
        // init state / seek to custom offsets
    }
    public void onPartitionsLost(Collection<TopicPartition> p) {
        cleanupWithoutCommit();         // lost ungracefully
    }
});
```

---

### Q178. Why can long processing cause rebalances, and how do you handle it?
**Difficulty:** `Intermediate`
**Category:** Rebalancing

#### Answer
If your processing between `poll()` calls exceeds `max.poll.interval.ms`, the coordinator assumes the consumer is dead and rebalances its partitions away — then your commit fails and work is reprocessed. Fixes: lower `max.poll.records` (smaller batches), raise `max.poll.interval.ms` if work is legitimately long, or offload processing to worker threads while continuing to `poll()` (and pause partitions for backpressure).

#### Code Example / Key Takeaways
```java
p.put("max.poll.records", 100);          // smaller batches -> poll() returns sooner
p.put("max.poll.interval.ms", 300000);   // allow longer processing if needed
// Or: hand records to a worker pool, keep calling poll(), pause/resume for backpressure.
```

---

### Q179. What is a rebalance storm and how do you diagnose it?
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
A rebalance storm is repeated, rapid rebalances that stall the group — usually caused by unstable consumers (crashing/restarting), `max.poll.interval.ms`/`session.timeout.ms` violations from slow processing or GC pauses, aggressive autoscaling, or misconfiguration. Diagnose via consumer/coordinator logs (frequent "Revoking/Rejoining"), group generation churning, poll-interval violations, and deployment timing. Fix with static membership, cooperative assignor, tuned timeouts, and stable processing.

#### Code Example / Key Takeaways
```text
Symptoms: constant "(Re-)joining group", generation number climbing, lag oscillating.
Causes:   crash loops, GC/processing > max.poll.interval.ms, flapping autoscaling.
Fixes:    static membership, CooperativeStickyAssignor, raise timeouts, fix GC/processing,
          stabilize deployments (avoid rapid pod churn).
```

---

### Q180. What is group generation and how does it prevent stale commits?
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
Each successful rebalance increments the group's **generation** (a version number). Consumers carry their generation when committing offsets; the coordinator **rejects commits from an outdated generation** (`CommitFailedException`), preventing a slow/zombie consumer that already lost its partitions from overwriting the current owner's offsets. This is a key correctness guard during rebalances.

#### Code Example / Key Takeaways
```text
Rebalance -> generation 5 -> 6
Zombie consumer (still on gen 5) tries commitSync() -> REJECTED (CommitFailedException)
=> stale member can't clobber the new owner's committed offsets.
```

---

### Q181. Can two groups have different offsets for the same partition?
**Difficulty:** `Basic`
**Category:** Rebalancing

#### Answer
Yes — offsets are tracked **per consumer group per partition**, independently. Group A can be at offset 100 while group B is at offset 500 on the same partition, each replaying/consuming at its own pace. This is what enables multiple independent applications (billing, analytics, search indexing) to consume the same topic without interfering.

#### Code Example / Key Takeaways
```text
Partition orders-0:
  group "billing"   committed offset = 100
  group "analytics" committed offset = 500   (independent)
Same data, separate progress -> fan-out to many apps.
```

---

### Q182. How do you scale consumers and what limits parallelism?
**Difficulty:** `Intermediate`
**Category:** Rebalancing

#### Answer
Scale by adding consumers to the group; Kafka rebalances partitions across them. But **effective parallelism is capped by the partition count** — with 6 partitions, a 7th consumer sits idle. So plan partition count for peak parallelism up front. Beyond that, options are: add partitions (mind key ordering), or parallelize within a consumer via worker threads while preserving offset correctness.

#### Code Example / Key Takeaways
```text
Topic with 6 partitions:
  up to 6 active consumers (1 partition each)
  7th+ consumer = IDLE (no partition to own)
=> max group parallelism = #partitions. Size partitions for peak scale.
```

---

### Q183. What is the difference between `session.timeout.ms` and `max.poll.interval.ms`?
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
- **session.timeout.ms**: if the coordinator receives no **heartbeat** within this window, the consumer is considered dead. Heartbeats are sent by a background thread (`heartbeat.interval.ms`), independent of processing.
- **max.poll.interval.ms**: the max time allowed **between `poll()` calls**; exceeding it means processing is stuck, so the consumer leaves the group even if heartbeats were fine.

Session timeout detects a crashed **process**; poll interval detects **stuck processing**.

#### Code Example / Key Takeaways
```text
session.timeout.ms   -> no HEARTBEAT (process/network dead) -> removed
max.poll.interval.ms -> no POLL (processing too slow/hung)  -> removed
heartbeat runs in background; poll cadence reflects processing speed.
```

---

### Q184. How do you monitor a consumer group's health?
**Difficulty:** `Intermediate`
**Category:** Rebalancing

#### Answer
Watch: **consumer lag** per partition (are we keeping up?), **rebalance frequency/duration** (stability), **partition assignment balance** (hot consumers?), **commit failures** (`CommitFailedException`), and **liveness** (heartbeats, poll interval). Use `kafka-consumer-groups.sh --describe`, JMX metrics, or Burrow/Kafka-lag-exporter feeding Prometheus/Grafana with alerts on lag trend and rebalance rate.

#### Code Example / Key Takeaways
```bash
kafka-consumer-groups.sh --bootstrap-server b:9092 --describe --group billing
# Watch: LAG per partition, CONSUMER-ID assignment, whether group state is "Stable"
# Alert on: rising lag, frequent rebalances, CommitFailedException rate.
```

---

### Q185. Can a single process consume for multiple groups?
**Difficulty:** `Intermediate`
**Category:** Rebalancing

#### Answer
A single `KafkaConsumer` instance belongs to exactly **one** group (its `group.id`). But one **process** can create multiple `KafkaConsumer` instances, each with a different `group.id`, to participate in several groups simultaneously (each on its own thread, since consumers aren't thread-safe). This is common when one service needs independent offset tracks for different purposes.

#### Code Example / Key Takeaways
```java
// Two independent consumers in one process, different groups:
var c1 = new KafkaConsumer<>(propsWithGroup("billing"));    // own offsets
var c2 = new KafkaConsumer<>(propsWithGroup("audit"));      // own offsets
// Run each in its own thread (KafkaConsumer is not thread-safe).
```

---

### Q186. What is partition assignment fairness and how do hot consumers arise?
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
The assignor spreads partition **count** evenly, but not partition **load** — if some partitions carry far more traffic (a hot key skews data into one partition), the consumer owning it becomes a hot consumer while others idle. The fix is upstream: better keying/partitioning to spread load, or increasing partitions, since the assignor can't rebalance by throughput. RoundRobin/CooperativeSticky help with count fairness, not data skew.

#### Code Example / Key Takeaways
```text
Even partition COUNT ≠ even LOAD.
Hot key -> one partition gets most records -> its consumer is overloaded.
Fix at the source: improve key cardinality/partitioning; add partitions;
                   split/salt hot keys. Assignor can't fix data skew.
```

---

### Q187. Exercise — Rebalancing: configure a group for smooth rolling deployments.
**Difficulty:** `Hard`
**Category:** Rebalancing

#### Answer
Combine **static membership** (skip rebalance on restart), the **cooperative sticky assignor** (incremental, no stop-the-world), sensible timeouts, and **commit-on-revoke** in a rebalance listener. Together these make rolling restarts nearly rebalance-free and prevent reprocessing.

#### Code Example / Key Takeaways
```java
p.put("group.instance.id", System.getenv("POD_NAME"));   // static member
p.put("partition.assignment.strategy",
      "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");
p.put("session.timeout.ms", "45000");
p.put("max.poll.interval.ms", "300000");
consumer.subscribe(List.of("orders"), new ConsumerRebalanceListener() {
    public void onPartitionsRevoked(Collection<TopicPartition> tp){ consumer.commitSync(); }
    public void onPartitionsAssigned(Collection<TopicPartition> tp){}
});
// Rolling restart within session timeout -> minimal/no rebalance, no reprocessing.
```

---
