# HLD — Database & Storage Design Interview Questions (Q131–Q160)

*Each answer includes a top-to-bottom flow (and Back-of-the-Envelope estimation where it's a scalable system).*

---

### Q131. Design a scalable relational database architecture.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Start with a primary + **read replicas** (scale reads, HA), add **caching** (Redis) for hot reads, then **partition/shard** by a good key when writes/storage exceed one node. Use connection pooling, indexing, and a proxy for read/write splitting. For further scale, denormalize hot paths and offload analytics to a warehouse. **Challenges**: write scaling (sharding → lose cross-shard joins/txn), replication lag, hot shards, schema migrations at scale. Keep strong consistency where it matters.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   App        │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Proxy (R/W    │  writes → primary ; reads → replicas
   │ split)       │
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────┐
 │Redis ││PRIMARY ││Read      │
 │Cache ││(writes)││Replicas  │
 └──────┘└───┬────┘└──────────┘
     shard when writes/storage exceed one node
             ▼
      ┌──────────────┐
      │Shard1..N     │  (lose cross-shard joins/txn)
      └──────────────┘
```

---

### Q132. Design a NoSQL database architecture.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Choose a model by access pattern: **key-value** (fast lookups), **document** (flexible aggregates), **wide-column** (huge write scale, Cassandra), **graph** (relationships). Partition via **consistent hashing**, **replicate** each partition (quorum R/W for tunable consistency), design the schema around queries (denormalize, no joins). Add nodes → ring rebalances. **Challenges**: eventual consistency (tune with quorums), no joins, hot partitions, model/partition-key choice.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │  key → consistent hash
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Node A││Node B││Node C│  each partition replicated (quorum R/W)
│      ││      ││      │  R + W > N → strong; else eventual
└──────┘└──────┘└──────┘
Model: key-value | document | wide-column | graph. Schema = query-driven (denormalize).
Add nodes → ring rebalances. Watch hot partitions.
```

---

### Q133. Design a time-series database.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Optimized for append-heavy, time-ordered data (metrics, IoT). Store points `(series, timestamp, value)`; partition by **time windows** (+ series), keep time-sorted for fast range scans, **downsample** old data with tiered retention (hot/cold). Compress heavily (delta/columnar). **Challenges**: extreme write throughput (LSM), high cardinality, efficient time-range + aggregation queries, retention/downsampling. (InfluxDB/TimescaleDB/Prometheus.)

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Ingest:  1M metrics/sec × 20 B (delta-compressed) → ~1.7 TB/day → downsample + tier

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Metrics/IoT  │  point(series, ts, value)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Ingest (LSM,  │  append-optimized, time-sorted
   │ append)      │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ recent     ▼ old
 ┌──────────┐┌──────────────┐
 │Hot (fine ││Cold (downsam-│
 │ granular)││ pled rollups)│
 └──────────┘└──────────────┘
Partition by time window (+ series). Heavy compression. Watch cardinality.
```

---

### Q134. Design a key-value store.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Map keys to values with O(1) get/put. **Partition** via consistent hashing, **replicate** to N nodes (quorum R/W), store on disk with an **LSM-tree** (write-optimized) or B-tree + memtable + WAL. Gossip for membership. **Challenges**: partitioning + rebalancing, replication + consistency (quorum/vector clocks), durability (WAL), compaction (LSM), hot keys. (DynamoDB/Cassandra.)

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  key → consistent hash
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Node  ││Node  ││Node  │  N replicas each (quorum R/W)
│      ││      ││      │  conflicts: vector clocks / LWW
└───┬──┘└──────┘└──────┘
    ▼ per node storage
 ┌──────────────┐
 │Memtable → WAL│  → LSM-tree (SSTables) + compaction
 └──────────────┘
Gossip membership. Watch: rebalancing, compaction, hot keys.
```

---

### Q135. Design a document database.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Store schema-flexible **documents** (JSON/BSON) keyed by id, grouped in collections, with **secondary indexes**. **Shard** by a shard key (hash/range) across nodes, **replicate** each shard (replica set) for HA. Documents store aggregates together (fewer joins). **Challenges**: shard-key choice (hot shards), index vs write cost, limited multi-doc transactions, unindexed-field query performance. (MongoDB.)

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  query by id / indexed field
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Router (mongos)│  shard by key
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Shard1││Shard2││Shard3│  each = replica set (HA)
│(JSON ││      ││      │  + secondary indexes
│docs) ││      ││      │
└──────┘└──────┘└──────┘
Aggregates stored together → fewer joins. Index fields you query.
```

---

### Q136. Design a distributed database.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Combine **partitioning** (shard for scale) + **replication** (copies per shard, HA) + a **consistency protocol** (quorum or consensus like Raft/Paxos) + a **query router** that locates data and runs distributed queries/txns. Decide CAP per workload. **Challenges**: distributed transactions (2PC/Saga), cross-shard queries, consistency vs availability, rebalancing, clock coordination. (Spanner/CockroachDB = distributed ACID via consensus + synced clocks.)

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Query Router  │  locate data + distributed query/txn
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Shard1││Shard2││Shard3│  each replicated + consensus (Raft)
│ ┌──┐ ││ ┌──┐ ││ ┌──┐ │
│ │R1│ ││ │R1│ ││ │R1│ │  R1/R2/R3 agree via Raft/Paxos
│ │R2│ ││ │R2│ ││ │R2│ │
│ └──┘ ││ └──┘ ││ └──┘ │
└──────┘└──────┘└──────┘
Distributed txn: 2PC/Saga or consensus. CAP choice per workload.
```

---

### Q137. Design a search system using Elasticsearch.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Ingest documents → **inverted index** (term → doc list) sharded + replicated. Queries fan out to shards, each returns top matches (BM25), results merged/ranked. Keep the source of truth in a primary DB and **sync** to the index async (Kafka/CDC). Shard by index; replicas for query throughput. **Challenges**: index/DB sync (eventual consistency), relevance tuning, analyzers, aggregations/facets, reindexing.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Primary DB   │  (source of truth)
   └──────┬───────┘
     async sync (Kafka/CDC)
          ▼
   ┌──────────────┐
   │ Indexer      │  build inverted index (term → docs)
   └──────┬───────┘
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Shard1││Shard2││Shard3│  each + replicas (query throughput)
└──────┘└──────┘└──────┘
          ▲ query fans out → merge/rank (BM25)
   ┌──────┴───────┐
   │  Search API  │
   └──────────────┘
```

---

### Q138. Design an autocomplete system.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Return top suggestions for a prefix with very low latency. Build a **trie** where each node stores the top-K completions (precomputed by popularity), or a completion suggester. Serve from memory/cache; update popularity async from query logs. Shard the trie by prefix; edge-cache hot prefixes. **Challenges**: sub-100ms latency, ranking (frequency + recency + personalization), typo tolerance, streaming updates, multi-language.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Latency:  <100ms per keystroke → in-memory trie + edge cache
Updates:  popularity from query-log stream (async, not per-request)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  types prefix "lap"
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Edge Cache    │  (hot prefixes)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Trie Service  │  node "lap" → top-K [laptop, lapland...]
   │(in-memory,   │
   │ sharded by   │
   │ prefix)      │
   └──────┬───────┘
          ▲ update popularity
   ┌──────┴───────┐
   │Query-Log     │  (async stream)
   │Stream        │
   └──────────────┘
```

---

### Q139. Design a full-text search system.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Tokenize/normalize text (lowercase, stemming, stop-words) → **inverted index** (term → postings with positions) → query by looking up terms, intersecting/scoring (BM25), supporting phrase/boolean/fuzzy. Sharded + replicated. Index async from a DB. **Challenges**: relevance ranking, analyzers/language, index size, near-real-time indexing, source-DB consistency.

#### Code Example / Key Takeaways
```text
── PIPELINE (top → bottom) ──
   ┌──────────────┐
   │  Document    │  "The quick brown fox"
   └──────┬───────┘
     tokenize + normalize (stem, stopwords)
          ▼
   ┌──────────────┐
   │Inverted Index│  quick → [doc1@2, doc7@5]
   │(term→postings│  brown → [doc1@3, doc3@1]
   │ + positions) │
   └──────┬───────┘
     query → lookup terms → intersect/score (BM25)
          ▼
   ┌──────────────┐
   │Ranked Results│  phrase / boolean / fuzzy
   └──────────────┘
Sharded + replicated. Index async from DB. NRT indexing.
```

---

### Q140. Design a product search engine (e-commerce).
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Combine full-text search (Elasticsearch) + **faceted filtering** (category/price/brand via aggregations) + **ranking** (relevance + business signals: popularity, margin, availability, personalization) + **autocomplete**. Index products async from the catalog DB (Kafka/CDC). Handle typos (fuzzy), synonyms, out-of-stock demotion. Shard, cache facets/queries, precompute rankings. **Challenges**: relevance + business rules, facet performance, freshness, personalization, query understanding.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Catalog DB   │
   └──────┬───────┘
     async index (Kafka/CDC)
          ▼
   ┌──────────────┐
   │Elasticsearch │  inverted index + facet aggregations
   └──────┬───────┘
          ▲ query
   ┌──────┴───────┐
   │Search Service│  relevance + BUSINESS signals (popularity/
   │              │  margin/availability/personalization)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Results:      │  ranked + facets (category/price/brand)
   │ + autocomplete│  typo/synonym; demote out-of-stock
   └──────────────┘
```

---

### Q141. Design a recommendation storage system.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Separate offline **computation** (batch/streaming ML pipeline → recs per user/item) from online **serving** (fast lookup). Store precomputed recs in a low-latency KV store (`user_id → [item ids]`, Redis/DynamoDB) for O(1) reads; features/embeddings in a feature store; optional real-time re-rank. Shard by user; recompute periodically + incremental stream updates. **Challenges**: freshness (batch lag), huge user×item storage, cold start, serving latency.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ML Pipeline   │  (batch/stream) → recs per user
   │(OFFLINE)     │
   └──────┬───────┘
     precompute
          ▼
   ┌──────────────┐
   │KV Store      │  user_id → [item ids]  (O(1) read)
   │(Redis/DynamoDB│  sharded by user
   │, ONLINE)     │
   └──────┬───────┘
          ▲ serve
   ┌──────┴───────┐
   │Serving + real│  optional real-time re-rank (feature store)
   │-time re-rank │
   └──────────────┘
Recompute periodically + incremental stream updates.
```

---

### Q142. Design a database backup system.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Combine **full backups** (periodic snapshots) + **incremental/differential** + continuous **WAL/binlog archiving** for point-in-time recovery (PITR). Store in durable, versioned object storage (S3), encrypted, cross-region. Automate + **verify (test restores!)** + retention. **Challenges**: minimal performance impact (snapshot from a replica), transaction-consistent snapshots, verification, retention/cost, RPO via WAL frequency.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Replica     │  (backup from replica → low impact)
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────┐
 │Full  ││Increm- ││WAL/binlog│
 │snap- ││ental   ││archive   │  (continuous → PITR)
 │shot  ││        ││          │
 └───┬──┘└───┬────┘└────┬─────┘
     └───────┼──────────┘
             ▼
      ┌──────────────┐
      │S3 (versioned,│  encrypted, cross-region
      │ tiered)      │
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │VERIFY (test  │  a backup you can't restore is useless!
      │ restores)    │
      └──────────────┘
RPO = WAL archive frequency.
```

---

### Q143. Design a database restore system.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Restore = load latest **full backup** → apply **incrementals** → replay **WAL/binlog** to a target time (PITR). Provision a new instance, restore, validate, repoint clients. Support restoring to a timestamp (before an accidental delete). **Challenges**: **RTO** (restore speed — parallelize, snapshots), correctness/validation, PITR precision, restoring at scale, testing restores regularly.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Full Backup   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Apply         │  incrementals
   │Incrementals  │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Replay WAL    │  → target timestamp (PITR, "before bad delete")
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Validate →    │  repoint clients
   │Repoint       │
   └──────────────┘
RTO = restore speed (parallelize, snapshots). Test restores regularly!
```

---

### Q144. Design a database migration architecture.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Migrate between databases/schemas/systems with minimal risk. Phases: **dual-write** or **CDC replication** source→target, **backfill** history, **verify** (counts/checksums), then **cut over** reads then writes gradually, keeping a **rollback** path. Versioned schema tools (Flyway/Liquibase). **Challenges**: zero-downtime cutover, source/target consistency (CDC lag), validation, rollback safety, schema differences.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Source DB    │
   └──────┬───────┘
     backfill history + CDC/dual-write (keep in sync)
          ▼
   ┌──────────────┐
   │ Target DB    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Verify (counts│  / checksums)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Shift reads → │  then shift writes (gradual) → decommission source
   └──────────────┘
Keep rollback path. Schema: Flyway/Liquibase.
```

---

### Q145. Design a zero-downtime database migration.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Keep the app running via **expand-migrate-contract**: (1) **expand** — add new schema/column alongside old (backward compatible); (2) **dual-write** + backfill + verify; (3) **migrate reads** to new; (4) **contract** — remove old once unused. For system moves, CDC replication + gradual cutover. **Challenges**: backward-compatible changes, dual-write consistency, backfill without locking (batched), verification, reversible steps.

#### Code Example / Key Takeaways
```text
── EXPAND-MIGRATE-CONTRACT (top → bottom) ──
   ┌──────────────┐
   │1. EXPAND     │  add new col/schema (backward-compatible)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │2. DUAL-WRITE │  write old + new; backfill old data (batched); verify
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │3. MIGRATE    │  switch reads to new
   │   READS      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │4. CONTRACT   │  drop old (once nothing uses it)
   └──────────────┘
App never stops. Every step reversible.
```

---

### Q146. Design an online schema migration.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Alter large tables without locking/downtime. Naive `ALTER TABLE` locks; tools (gh-ost, pt-online-schema-change) create a **shadow copy** with the new schema, **copy rows in batches**, capture live changes (triggers/binlog), then atomically **swap** tables. Or expand-contract with additive changes. **Challenges**: no long locks (batched copy), sync during copy, atomic swap, FK/replication interactions, rollback.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Create Shadow │  table with NEW schema
   │Table         │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Copy rows in  │  + capture live changes (triggers/binlog)
   │batches       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Atomic RENAME │  swap shadow ↔ original
   │swap          │
   └──────────────┘
Tools: gh-ost, pt-online-schema-change. No long locks.
```

---

### Q147. Design data archiving.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Move old, rarely-accessed data out of the hot operational DB into cheaper **cold storage** (warehouse/object storage) to keep the primary lean. A scheduled job selects data past a retention/age threshold, copies to the archive (time-partitioned), verifies, then deletes from the primary. Keep a query/restore path. **Challenges**: archive criteria, queryability, referential integrity, verify-before-delete, compliance.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Hot Primary DB│
   └──────┬───────┘
     scheduled job: select data older than threshold
          ▼
   ┌──────────────┐
   │Copy to Cold  │  (S3/warehouse, time-partitioned)
   │Store         │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Verify → Delete│  from primary (keeps hot DB lean)
   │from primary  │
   └──────────────┘
Keep query/restore path for archived data.
```

---

### Q148. Design cold storage.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Store infrequently-accessed data very cheaply, trading retrieval speed/cost for storage cost (S3 Glacier). Write-once, rarely read, with **retrieval latency** (min–hours) + per-retrieval cost. **Lifecycle policies** auto-move data hot→warm→cold by age/access. Uses: backups, archives, compliance, logs. **Challenges**: retrieval latency/cost, lifecycle policy design, restorability, cost vs access.

#### Code Example / Key Takeaways
```text
── LIFECYCLE TIERING (top → bottom, by age) ──
   ┌──────────────┐
   │HOT (S3 Std)  │  frequent access, instant, $$$
   └──────┬───────┘  after 30d
          ▼
   ┌──────────────┐
   │WARM (S3 IA)  │  occasional, instant, $$
   └──────┬───────┘  after 90d
          ▼
   ┌──────────────┐
   │COLD (Glacier)│  rare, minutes-hours retrieval, $
   └──────────────┘
Auto lifecycle policies by age/access. Plan retrieval latency/cost.
```

---

### Q149. Design object storage similar to S3.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Store immutable **objects** in **buckets**, keyed, with metadata. Core: a **metadata service** (bucket/key → location, size, checksum, ACL) + a **storage layer** that chunks objects and **replicates/erasure-codes** them across nodes/AZs for 11-nines durability. Versioning, lifecycle tiering, REST API. Partition metadata, distribute chunks. **Challenges**: durability (erasure coding), metadata consistency, huge scale, multipart uploads, availability. Serve via CDN.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Durability: 11 nines via erasure coding (e.g. 10 data + 4 parity) across AZs
Scale:    exabytes; partition metadata, distribute chunks

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  PUT/GET bucket/key
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Metadata      │  bucket/key → chunk locations, checksum, ACL, version
   │Service       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Storage Nodes │  object → chunks → erasure-coded across AZs
   │(chunks)      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │     CDN      │  (hot objects)
   └──────────────┘
```

---

### Q150. Design a distributed file system.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Store large files across many nodes with a POSIX-like/blob interface. Split files into **blocks/chunks**, replicate each across data nodes, and use a **metadata/name node** mapping files → block locations. Clients read/write blocks directly from data nodes (parallel throughput). **Challenges**: metadata scale + HA (single NameNode = classic SPOF), block replication on failure, consistency, sequential throughput. (HDFS/GFS.)

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  (1) ask NameNode for block locations
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  NameNode    │  file → [block locations] (metadata; HA needed — SPOF)
   └──────┬───────┘
     (2) read/write blocks DIRECTLY (parallel)
   ┌──────┼──────────┐
   ▼      ▼          ▼
┌──────┐┌──────┐┌──────┐
│Data  ││Data  ││Data  │  block replicated 3× across nodes
│Node 1││Node 2││Node 3│  re-replicate on failure
└──────┘└──────┘└──────┘
File → 128MB blocks. (HDFS/GFS)
```

---

### Q151. Design a large-file upload system.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Use **multipart/chunked upload**: the client splits the file into parts, uploads each in parallel (direct to object storage via pre-signed URLs), and the service assembles on completion. Track session + received parts. Enables parallelism, retrying only failed parts, huge files. **Challenges**: assembling parts, retrying failed chunks, resumability, per-part checksums, cleaning up abandoned uploads.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Client      │  split file into N parts
   └──────┬───────┘
     init multipart → get session + pre-signed URLs
          ▼
   ┌──────────────┐
   │Upload parts  │  IN PARALLEL, direct to S3 (retry failed parts)
   │1..N          │
   └──────┬───────┘
     all parts done
          ▼
   ┌──────────────┐
   │Complete →    │  S3 assembles parts into one object
   │Assemble      │
   └──────────────┘
Per-part checksums. Clean up abandoned uploads.
```

---

### Q152. Design resumable file uploads.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Let an interrupted upload continue rather than restart. Client creates an upload **session** (server records id + total size + chunk size); uploads chunks with offset/index; server persists which chunks are received. On resume, client asks which chunks are missing and uploads only those. Complete when all arrive. **Challenges**: tracking received chunks, per-chunk integrity, session expiry, concurrent chunks, idempotent chunk writes. (tus / S3 multipart.)

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Create Session│  {id, totalSize, chunkSize}
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Upload chunks │  by index; server records received set
   └──────┬───────┘
     interrupted!
          ▼
   ┌──────────────┐
   │RESUME: "which│  chunks missing?" → upload only those
   │missing?"     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Complete when │  all chunks present
   │all present   │
   └──────────────┘
Idempotent chunk writes + checksums; session expiry cleanup.
```

---

### Q153. Design file deduplication.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Avoid storing identical data twice. Compute a **content hash** (SHA-256) of a file (or of chunks for partial dedup); before storing, check if the hash exists — if so, add a reference instead of storing again. Store hash→location + reference counts (delete only when refs hit zero). Chunk-level dedup catches partial overlaps (backups). **Challenges**: hash collisions (strong hashes), content-defined chunking, ref counting, hashing cost.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │ Upload file  │
   └──────┬───────┘
     hash chunks (SHA-256)
          ▼
   ┌──────────────┐
   │Hash exists?  │  (lookup hash → location)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ yes        ▼ no
 ┌──────────┐ ┌──────────────┐
 │add ref   │ │store bytes + │
 │(ref++)   │ │record hash   │
 │skip bytes│ └──────────────┘
 └──────────┘
Delete data only when ref count = 0. Chunk-level → partial overlap dedup.
```

---

### Q154. Design content-addressable storage.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Address data by its **content hash** rather than location/name: `store(data) → hash`, `get(hash) → data`. Identical data → one address (auto dedup); immutable (change → new hash); integrity verifiable (rehash + compare). Used in Git, IPFS, Docker layers. **Challenges**: hash choice (collision-resistant), garbage collection (unreferenced objects), no in-place updates (versioning via new hashes), name→hash mapping (separate layer).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  store(data) │
   └──────┬───────┘
     address = hash(content)  (SHA-256)
          ▼
   ┌──────────────┐
   │Store keyed by│  hash → immutable, auto-dedup, verifiable
   │HASH          │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │get(hash)     │  → data (rehash to verify integrity)
   └──────────────┘
Names map to hashes separately. GC unreferenced objects. (Git/IPFS/Docker)
```

---

### Q155. Design a blob storage service.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Store binary large objects (images, videos, docs) with put/get/delete. Metadata (id, size, content-type, owner, checksum) in a DB; bytes in a distributed storage layer (replicated/erasure-coded). Serve via signed URLs + CDN. Multipart uploads + lifecycle tiering. **Challenges**: durability (replication/erasure coding), large uploads (multipart/resumable), access control (signed URLs), CDN integration, cost/tiering. (A focused object store.)

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  put/get/delete (signed URL)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ metadata   ▼ bytes
 ┌──────────┐┌──────────────┐
 │Metadata  ││Storage Layer │  (replicated / erasure-coded)
 │DB(id,size││              │
 │,type,ACL)││              │
 └──────────┘└──────┬───────┘
                    ▼
             ┌──────────────┐
             │     CDN      │  (serve hot blobs)
             └──────────────┘
Multipart for large blobs; lifecycle tiering.
```

---

### Q156. Design database partitioning.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Split a large table for manageability + performance. **Horizontal** (rows): partition by range/hash/list on a key (e.g. date, region) → queries hit one partition (**partition pruning**), old partitions dropped/archived cheaply. **Vertical** (columns): split rarely-used/large columns out. Within one DB (partitions) or across DBs (sharding). **Challenges**: partition-key choice, cross-partition queries, rebalancing, per-partition indexes/constraints.

#### Code Example / Key Takeaways
```text
── TWO TYPES ──
   ┌──────────────────────────────────────┐
   │ HORIZONTAL (rows): partition by key   │
   │   orders_2023 | orders_2024 | orders_2025
   │   → partition pruning; drop old cheaply
   ├──────────────────────────────────────┤
   │ VERTICAL (columns): split by feature   │
   │   users_core | users_profile_blob      │
   └──────────────────────────────────────┘
Within one DB (table partitions) or across DBs (sharding).
Challenges: key choice, cross-partition queries, rebalancing.
```

---

### Q157. Design read/write splitting.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Route **writes** to the primary and **reads** to replicas to scale read-heavy workloads. A proxy (ProxySQL) or driver/app logic directs by query type (write/txn → primary; read-only → replica, load-balanced). Handle **replication lag**: read-your-writes → send a user's reads to primary briefly after a write. **Challenges**: staleness, correct routing (avoid stale reads for critical data), lag monitoring, failover.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   App        │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Proxy (ProxySQL│  route by query type
   │)             │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ write/txn  ▼ read-only
 ┌──────────┐┌──────────────┐
 │ PRIMARY  ││Replicas      │  (load-balanced)
 └──────────┘└──────────────┘
Read-your-writes → pin reads to primary briefly post-write. Monitor lag.
```

---

### Q158. Design CQRS architecture.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Separate the **write model** (commands, normalized, validated, consistency-focused) from the **read model** (queries, denormalized, per-view), kept in sync via events. Writes emit events; projectors update read models (possibly different DBs). **Benefits**: independent read/write scaling, tailored read models, pairs with event sourcing. **Challenges**: eventual consistency between sides, complexity, idempotent projectors. Use only where read/write needs diverge.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Command     │  (write intent)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Write Model   │  normalized, validated → emit event
   └──────┬───────┘
     event
          ▼
   ┌──────────────┐
   │  Projector   │  update read model (idempotent)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Read Model    │  denormalized (fast queries)
   └──────────────┘
Scale reads/writes independently. Cost: eventual consistency + complexity.
```

---

### Q159. Design event sourcing.
**Difficulty:** `Hard`
**Category:** Database & Storage

#### Answer
Store state as an **immutable, ordered log of events** rather than current state; rebuild state by replaying events. Gives audit trail, time-travel, retroactive projections. Use **snapshots** to avoid replaying millions of events. Pairs with **CQRS** (events feed read models). **Challenges**: querying current state (fold/snapshots + read models), event schema/versioning (events live forever), eventual consistency, complexity. Append-only (never mutate/delete events).

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │  Command     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Event Store   │  append events: Deposited(+100), Withdrawn(-30)...
   │(immutable log)│  (never mutate/delete)
   └──────┬───────┘
     state = fold(events)  (+ periodic snapshots)
          ▼
   ┌──────────────┐
   │Current State │  = snapshot + replay events after it
   └──────────────┘
Audit trail + time-travel + retroactive projections. Pairs with CQRS.
```

---

### Q160. Design a polyglot persistence architecture.
**Difficulty:** `Intermediate`
**Category:** Database & Storage

#### Answer
Use different databases per workload's access pattern — a natural consequence of database-per-service. PostgreSQL for orders (ACID), MongoDB for catalog (flexible docs), Redis for sessions/cache, Elasticsearch for search, Cassandra for high-write events, Neo4j for relationships. **Benefit**: fit-for-purpose storage. **Challenges**: ops overhead (backups/expertise/monitoring per engine), cross-store consistency (sync via events/CDC), avoiding sprawl (standardize on a small set).

#### Code Example / Key Takeaways
```text
── FIT-FOR-PURPOSE (per service) ──
   ┌──────────────────────────────────────┐
   │ orders    → PostgreSQL  (ACID)         │
   │ catalog   → MongoDB     (flexible docs)│
   │ sessions  → Redis       (cache, TTL)   │
   │ search    → Elasticsearch (full-text)  │
   │ events    → Cassandra   (high write)   │
   │ social    → Neo4j       (relationships)│
   └──────────────────────────────────────┘
Cross-store consistency via events/CDC. Cost: ops overhead per engine.
Standardize on a small approved set (avoid sprawl).
```

---
