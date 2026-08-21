# Apache Kafka — Replication & Reliability Interview Questions (Q188–Q207)

---

### Q188. What is leader election and when does it happen?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
Leader election chooses which replica becomes the **leader** of a partition when the current leader becomes unavailable (broker failure, restart, or maintenance). The controller picks an eligible replica — normally one that's **in-sync (ISR)** so no committed data is lost — and updates metadata; producers/consumers then refresh and talk to the new leader. Elections also happen for load balancing (preferred-leader election).

#### Code Example / Key Takeaways
```text
Leader broker fails -> controller detects -> picks an ISR replica as new leader
-> metadata updated -> clients refresh -> traffic resumes on new leader.
```

---

### Q189. What is a preferred leader and preferred-leader election?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
The **preferred leader** is the **first replica** listed in a partition's replica assignment. Kafka tries to keep it as the leader so leadership is spread evenly across brokers. After failures/restarts, leadership can drift and concentrate on a few brokers; **preferred-leader election** (auto or via `kafka-leader-election.sh`) restores the balanced distribution, avoiding hot brokers.

#### Code Example / Key Takeaways
```bash
# Rebalance leadership back to preferred replicas
kafka-leader-election.sh --bootstrap-server b:9092 \
  --election-type PREFERRED --all-topic-partitions
# auto.leader.rebalance.enable=true does this periodically.
```

---

### Q190. What is unclean leader election and why is it dangerous?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
Unclean leader election allows an **out-of-sync** replica to become leader when no in-sync replica is available. It keeps the partition **available**, but the new leader lacks the latest committed records that were only on the failed leader → **data loss** and log divergence. It's an availability-vs-durability trade-off; most durable setups keep `unclean.leader.election.enable=false` and accept temporary unavailability rather than silent loss.

#### Code Example / Key Takeaways
```text
unclean.leader.election.enable=false (durable default):
  no ISR available -> partition stays OFFLINE until an ISR returns (no loss)
=true (availability-first):
  out-of-sync replica becomes leader -> partition available BUT data loss possible.
```

---

### Q191. What is the high watermark and why can't consumers read past it?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
The **high watermark (HW)** is the highest offset that has been replicated to all required in-sync replicas — i.e. the boundary of **committed** data. Normal consumers can only read **up to** the HW, because records beyond it exist only on the leader and aren't yet durably replicated; exposing them would risk showing data that could be lost in a leader failover. The **Log End Offset (LEO)** is the leader's actual end (≥ HW).

#### Code Example / Key Takeaways
```text
Leader log:  [........ HW=180 ..... LEO=185 ]
              committed(<=180) : readable by consumers (replicated to ISR)
              181..185         : on leader only, NOT yet readable (unreplicated)
HW advances as followers catch up. read_committed also respects the LSO.
```

---

### Q192. What is the leader epoch and what problem does it solve?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
A **leader epoch** is a monotonically increasing number identifying each leadership term of a partition. It's stamped on the log so replicas and consumers can detect **stale leaders** and reconcile logs correctly after failovers. Before leader epochs, a follower recovering after a leader change could truncate/keep the wrong records (data loss/divergence); epochs let a replica ask "what was the log end at epoch N?" and truncate precisely, ensuring consistent recovery.

#### Code Example / Key Takeaways
```text
Each leadership term -> new epoch (0,1,2,...). Records carry the epoch.
On failover, a follower uses OffsetsForLeaderEpoch to find the exact divergence point
-> truncates only what's invalid -> no over/under truncation -> consistent logs.
```

---

### Q193. What is log truncation and when does it occur?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
Log truncation removes records from a **replica** when its log diverges from the current leader's valid history — typically after a leader change where a former leader had unreplicated records that the new leader never received. Using leader epochs, the replica finds the divergence offset and truncates everything after it, then re-fetches the correct records from the new leader. This keeps all replicas consistent (at the cost of dropping never-committed records).

#### Code Example / Key Takeaways
```text
Old leader had offsets up to 185 (HW was 180). It fails; new leader ends at 180.
Old broker returns as follower -> detects divergence at 181 via leader epoch
-> truncates 181..185 -> re-replicates from the new leader. Consistent again.
```

---

### Q194. What causes replicas to fall out of the ISR?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
A follower leaves the ISR when it can't keep up with the leader within `replica.lag.time.max.ms` — usually due to **slow disks**, **network issues**, an **overloaded broker** (CPU/GC), or insufficient replica-fetch throughput. Shrinking ISR reduces fault tolerance and can block acks=all writes if it drops below `min.insync.replicas`. Monitor `UnderReplicatedPartitions` and `IsrShrinksPerSec`.

#### Code Example / Key Takeaways
```text
Follower can't catch up within replica.lag.time.max.ms -> removed from ISR.
Common causes: slow/failing disk, network saturation, broker CPU/GC, fetch backlog.
Impact: less fault tolerance; acks=all may fail if ISR < min.insync.replicas.
```

---

### Q195. What is an under-replicated partition and why does it matter?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
An under-replicated partition has fewer in-sync replicas than its replication factor — some replicas are lagging or down. It signals **degraded fault tolerance** (you're closer to data loss/unavailability) and often precedes bigger problems. `UnderReplicatedPartitions > 0` is a standard alerting metric; investigate broker health, disk, and network. It's not immediate data loss, but a warning that redundancy is compromised.

#### Code Example / Key Takeaways
```bash
kafka-topics.sh --bootstrap-server b:9092 --describe --under-replicated-partitions
# Any output = replicas lagging/down -> reduced redundancy. Alert on this metric.
```

---

### Q196. What is an offline partition and why is it serious?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
An offline partition has **no available leader** — all its replicas are down or none is eligible. Clients can't produce to or consume from it, so that slice of the topic is completely unavailable (and with `unclean.leader.election.enable=false`, it stays offline until an ISR returns). `OfflinePartitionsCount > 0` is a critical alert indicating data unavailability, usually from multiple broker failures or disk loss.

#### Code Example / Key Takeaways
```text
OfflinePartitionsCount > 0  =>  partition has NO leader  =>  no reads/writes.
Causes: all replicas down, or no ISR eligible with unclean election disabled.
Critical alert -> restore brokers / replicas to bring the partition back online.
```

---

### Q197. What is rack awareness and why use it?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
Rack awareness (`broker.rack`) makes Kafka place a partition's replicas across **different failure domains** (racks / availability zones) rather than all in one. So a single rack/AZ outage can't take down all replicas of any partition — the partition stays available via replicas in surviving zones. Essential for cloud multi-AZ durability. Consumers can also fetch from a same-rack replica to save cross-AZ bandwidth (follower fetching).

#### Code Example / Key Takeaways
```properties
# broker config
broker.rack=us-east-1a
# Kafka spreads RF=3 replicas across a,b,c zones -> one AZ down != data loss.
# Consumers can use rack-aware follower fetching to reduce cross-AZ traffic.
```

---

### Q198. What is the difference between replication factor and min.insync.replicas?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
- **replication.factor** (topic): how many **copies** of each partition exist (durability ceiling). RF=3 → 3 replicas.
- **min.insync.replicas** (topic/broker): how many replicas must be **in sync** for an acks=all write to succeed (durability floor at write time).

RF sets total redundancy; `min.insync.replicas` sets the minimum you require to be caught up when acknowledging. Typical durable combo: RF=3, min.insync.replicas=2 (tolerates one broker loss while still accepting writes).

#### Code Example / Key Takeaways
```text
RF=3               -> 3 replicas exist (can lose up to 2 and not lose data)
min.insync=2       -> acks=all needs >=2 in-sync to accept a write
Combo RF=3/min=2   -> survive 1 broker down AND still accept writes; block if 2 down.
```

---

### Q199. What is a replica fetcher and how do followers stay in sync?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
Each follower runs **replica fetcher** threads that continuously pull records from the partition **leader** (just like a consumer), appending them to their local log and reporting their fetch position. The leader tracks each follower's progress; followers within `replica.lag.time.max.ms` stay in the ISR. Fetcher throughput (threads, network, disk) determines how quickly followers catch up and whether they stay in sync under load.

#### Code Example / Key Takeaways
```text
Follower's ReplicaFetcherThread --fetch--> Leader --records--> follower log
Leader tracks follower offsets -> those caught up within replica.lag.time.max.ms = ISR.
Tune num.replica.fetchers / network for replication throughput under load.
```

---

### Q200. What is controller failover and the KRaft quorum?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
The **controller** manages cluster metadata and partition leadership. In **KRaft** mode, a set of controller nodes forms a **Raft quorum** that stores metadata in an internal replicated log (no ZooKeeper). One controller is active; if it fails, the quorum elects another and the new controller has the full metadata log — fast, consistent **controller failover**. This scales metadata handling and removes the old ZooKeeper dependency and its failure modes.

#### Code Example / Key Takeaways
```text
KRaft: N controllers -> Raft quorum -> replicated metadata log (topics, leaders, ISR).
Active controller fails -> quorum elects a new active controller (has full log)
-> no ZooKeeper, faster metadata, consistent failover.
```

---

### Q201. What is partition reassignment and why do it?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
Partition reassignment moves partition **replicas between brokers** to rebalance storage and load — e.g. after adding new brokers, decommissioning old ones, or when some brokers are hot. It's done with `kafka-reassign-partitions.sh` (generate a plan, execute, verify), and Kafka copies data to the new replicas before switching. Throttle it (`--throttle`) so replication traffic doesn't overwhelm the cluster during the move.

#### Code Example / Key Takeaways
```bash
# Move replicas to balance a new broker in (throttled)
kafka-reassign-partitions.sh --bootstrap-server b:9092 \
  --reassignment-json-file plan.json --execute --throttle 50000000
kafka-reassign-partitions.sh --bootstrap-server b:9092 \
  --reassignment-json-file plan.json --verify
```

---

### Q202. How does Kafka handle a broker failure end-to-end?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
When a broker fails: the controller detects it (session loss), triggers **leader election** for all partitions the broker led (promoting ISR replicas), and updates metadata. Producers/consumers get `NotLeaderForPartition`, refresh metadata, and reconnect to the new leaders — continuing seamlessly if enough replicas remain. Partitions where the failed broker held the **only** in-sync replica may go offline until it recovers (with unclean election disabled). Under-replicated partitions re-sync when the broker returns.

#### Code Example / Key Takeaways
```text
Broker down -> controller detects -> elect new leaders from ISR -> update metadata
Clients get NotLeaderForPartition -> refresh -> reconnect to new leaders -> continue.
If failed broker had sole ISR for a partition -> offline until recovery (no unclean loss).
```

---

### Q203. What is the difference between LEO, HW, and LSO?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
- **LEO (Log End Offset)**: the offset after the last record in a replica's log (the leader's LEO is where new writes land).
- **HW (High Watermark)**: the highest offset replicated to the ISR — the max normal consumers can read.
- **LSO (Last Stable Offset)**: for transactions — the offset below which all transactional records are decided (committed/aborted); `read_committed` consumers can't read past it.

HW ≤ LEO; LSO ≤ HW when open transactions exist.

#### Code Example / Key Takeaways
```text
LEO : leader's next-write position (log end)
HW  : replicated-to-ISR boundary (readable limit for consumers)
LSO : transaction-decided boundary (readable limit for read_committed)
Relationship: LSO <= HW <= LEO
```

---

### Q204. How do you improve Kafka availability and durability together?
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
Layer the guarantees: **RF ≥ 3** across **rack/AZ-aware** brokers; **min.insync.replicas=2** with **acks=all** (durability without single-broker fragility); **unclean.leader.election.enable=false** (no silent loss); enough brokers to tolerate failures with capacity to spare; **monitoring** of under-replicated/offline partitions and ISR changes; and **tested failover/DR** procedures. Balance: too-strict settings hurt availability, too-loose risk loss — tune to your RPO/RTO.

#### Code Example / Key Takeaways
```text
Durable + available baseline:
  replication.factor=3, spread across AZs (broker.rack)
  min.insync.replicas=2, producer acks=all
  unclean.leader.election.enable=false
  monitor: UnderReplicated/Offline partitions, IsrShrinks, controller changes
  practice failover + DR (RPO/RTO defined and tested).
```

---

### Q205. Why can't all replicas be on the same broker?
**Difficulty:** `Basic`
**Category:** Replication & Reliability

#### Answer
Replication exists to survive **broker failure**, so Kafka deliberately places each partition's replicas on **different brokers** — putting them all on one broker would defeat the purpose (that broker dying loses every copy). The controller's replica-placement algorithm enforces this (and rack awareness spreads them across zones too). You can't have replication factor higher than the number of brokers.

#### Code Example / Key Takeaways
```text
RF=3 requires >= 3 brokers; each replica on a DISTINCT broker.
All-on-one-broker would mean one failure = total loss -> Kafka forbids it.
Rack awareness extends this to distinct AZs/racks.
```

---

### Q206. What is `replica.lag.time.max.ms`?
**Difficulty:** `Intermediate`
**Category:** Replication & Reliability

#### Answer
It's the maximum time a follower can go without fully catching up to the leader before it's removed from the ISR. Rather than lagging by a message count (the old `replica.lag.max.messages`, which misbehaved under bursts), Kafka uses time: a follower that hasn't caught up to the leader's log end within this window is considered out of sync. Tuning it trades ISR stability against how quickly you detect a genuinely slow replica.

#### Code Example / Key Takeaways
```properties
replica.lag.time.max.ms=30000   # follower must catch up within 30s or leave ISR
# Time-based (not message-count) -> tolerant of bursts, catches truly slow replicas.
```

---

### Q207. Exercise — Reliability: configure a topic to survive one AZ failure with no data loss.
**Difficulty:** `Hard`
**Category:** Replication & Reliability

#### Answer
Use RF=3 spread across three AZs (rack awareness), `min.insync.replicas=2`, producers with `acks=all` and idempotence, and disable unclean leader election. Losing one AZ leaves 2 replicas (still ≥ min.insync), so writes continue and no committed data is lost.

#### Code Example / Key Takeaways
```bash
kafka-topics.sh --create --topic orders \
  --partitions 12 --replication-factor 3 \
  --config min.insync.replicas=2 \
  --config unclean.leader.election.enable=false \
  --bootstrap-server b:9092
# Brokers in 3 AZs via broker.rack; producers: acks=all, enable.idempotence=true.
# One AZ down -> 2 ISR remain (>= min.insync) -> writes continue, zero loss.
```

---
