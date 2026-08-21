# Apache Kafka — Connect, Streams & Schema Registry Interview Questions (Q263–Q287)

---

### Q263. What is Kafka Connect?
**Difficulty:** `Intermediate`
**Category:** Kafka Connect

#### Answer
Kafka Connect is a framework for reliably streaming data **between Kafka and external systems** without writing custom producer/consumer code. **Source connectors** ingest from external systems (databases, files, queues) into Kafka; **sink connectors** export from Kafka to external systems (databases, search, object stores). It handles scaling, parallelism (tasks), offset tracking, retries, and fault tolerance declaratively via configuration, so integrations are config, not code.

#### Code Example / Key Takeaways
```json
// Sink connector: stream a Kafka topic into a JDBC database (config, not code)
{
  "name": "orders-jdbc-sink",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
    "topics": "orders",
    "connection.url": "jdbc:postgresql://db:5432/warehouse",
    "tasks.max": "4",
    "insert.mode": "upsert", "pk.mode": "record_key"
  }
}
```

---

### Q264. What is the difference between a source and a sink connector?
**Difficulty:** `Basic`
**Category:** Kafka Connect

#### Answer
- **Source connector**: reads from an external system and **publishes** the data into Kafka topics (e.g. Debezium capturing DB changes → Kafka).
- **Sink connector**: **consumes** from Kafka topics and writes the data to an external system (e.g. Kafka → Elasticsearch/S3/JDBC).

Source = into Kafka; sink = out of Kafka. Both run on the Connect runtime and split work into tasks.

#### Code Example / Key Takeaways
```text
Source: external system --> [source connector] --> Kafka topic
Sink:   Kafka topic --> [sink connector] --> external system
Debezium (CDC) = source; JDBC/Elasticsearch/S3 sinks = out of Kafka.
```

---

### Q265. What is a connector task and how does parallelism work in Connect?
**Difficulty:** `Intermediate`
**Category:** Kafka Connect

#### Answer
A connector's work is divided into **tasks** — the unit of parallelism. `tasks.max` sets the upper bound; the connector decides how to split work (e.g. a source assigns table/partition ranges to tasks; a sink's tasks map to topic partitions like consumers in a group). Tasks are distributed across Connect **workers** in distributed mode, so scaling = more tasks across more workers, bounded by the data's natural parallelism (e.g. partition count for sinks).

#### Code Example / Key Takeaways
```text
Connector -> splits into tasks (tasks.max) -> distributed across workers.
Sink tasks behave like a consumer group: parallelism <= topic partition count.
Source tasks: connector-defined split (tables, shards, partitions).
```

---

### Q266. What is the difference between standalone and distributed mode in Kafka Connect?
**Difficulty:** `Intermediate`
**Category:** Kafka Connect

#### Answer
- **Standalone**: a single worker process, config in local files, offsets in a local file. Simple — good for development, testing, or a single-machine pipeline. No fault tolerance.
- **Distributed**: multiple workers form a cluster, coordinating via Kafka (config, offsets, and status stored in internal Kafka topics). Connectors/tasks are balanced across workers and **rebalance on failure** — fault-tolerant and scalable. Use distributed for production.

#### Code Example / Key Takeaways
```text
Standalone: 1 worker, file-based config/offsets -> dev/test, no HA.
Distributed: worker cluster, config/offset/status in Kafka topics -> HA + scale,
             manage connectors via REST API, auto rebalancing on worker failure.
```

---

### Q267. What is a converter in Kafka Connect?
**Difficulty:** `Intermediate`
**Category:** Kafka Connect

#### Answer
A **converter** translates between Connect's internal data representation and the **serialized bytes** stored in Kafka. `key.converter`/`value.converter` decide the wire format — e.g. `AvroConverter`, `JsonConverter`, `ProtobufConverter`, `StringConverter`. It's separate from the connector logic, so the same connector can produce/consume Avro or JSON just by changing the converter. Schema-aware converters integrate with Schema Registry for compatibility.

#### Code Example / Key Takeaways
```properties
value.converter=io.confluent.connect.avro.AvroConverter
value.converter.schema.registry.url=http://schema-registry:8081
# Converter = serialization format (Avro/JSON/Protobuf/String), independent of connector.
```

---

### Q268. What is a Single Message Transform (SMT) in Kafka Connect?
**Difficulty:** `Hard`
**Category:** Kafka Connect

#### Answer
SMTs are lightweight, per-record transformations applied **inline** in the Connect pipeline (source before writing to Kafka, or sink before writing out) — without a separate stream-processing app. Common SMTs: rename/mask/drop fields, add headers, route to topics, extract a field as the key, or convert timestamps. They're for simple transformations; heavier logic belongs in Kafka Streams/ksqlDB.

#### Code Example / Key Takeaways
```properties
# Mask a PII field and route by topic prefix, inline in the connector
transforms=mask,route
transforms.mask.type=org.apache.kafka.connect.transforms.MaskField$Value
transforms.mask.fields=ssn
transforms.route.type=org.apache.kafka.connect.transforms.RegexRouter
transforms.route.regex=(.*)
transforms.route.replacement=warehouse_$1
```

---

### Q269. What is the Schema Registry and why use schemas?
**Difficulty:** `Intermediate`
**Category:** Schema Registry

#### Answer
A **Schema Registry** centrally stores and versions the schemas (Avro/Protobuf/JSON Schema) for topic data and enforces **compatibility** rules on new versions. Producers register/validate schemas and send only a compact **schema id** in each message; consumers fetch the schema by id to deserialize. Benefits: explicit, enforceable **data contracts**, safe schema evolution, smaller payloads, and prevention of breaking changes between independently-deployed producers and consumers.

#### Code Example / Key Takeaways
```text
Producer -> register/validate schema -> message = [magic][schema-id][payload]
Consumer -> read schema-id -> fetch schema from registry -> deserialize
Registry enforces compatibility -> producers/consumers evolve safely, payloads stay small.
```

---

### Q270. What are Avro, Protobuf, and JSON Schema, and how do they compare?
**Difficulty:** `Intermediate`
**Category:** Schema Registry

#### Answer
All are schema-based formats used with the Schema Registry:
- **Avro**: compact binary, schema travels by id, excellent for evolution; the traditional Kafka default.
- **Protobuf**: compact binary, strong cross-language tooling and typed stubs, good for gRPC-adjacent stacks.
- **JSON Schema**: human-readable JSON with a validation schema; larger payloads but easy to inspect/debug.

Choose Avro/Protobuf for efficiency at scale, JSON Schema for readability/interoperability.

#### Code Example / Key Takeaways
```text
Avro        : compact binary, great evolution, classic Kafka choice
Protobuf    : compact binary, strong typed codegen, cross-language
JSON Schema : readable JSON, larger, easy to debug/interoperate
All integrate with Schema Registry + compatibility rules.
```

---

### Q271. What is schema compatibility (backward, forward, full)?
**Difficulty:** `Hard`
**Category:** Schema Registry

#### Answer
Compatibility rules govern whether a new schema version can coexist with existing producers/consumers:
- **Backward**: new schema can read data written with the **old** schema (safe to upgrade **consumers** first) — e.g. add optional field with default, remove a field.
- **Forward**: old schema can read data written with the **new** schema (safe to upgrade **producers** first) — e.g. add a field, remove optional.
- **Full**: both backward and forward.

The registry rejects incompatible changes, protecting the pipeline.

#### Code Example / Key Takeaways
```text
Backward: new consumer reads old data  -> upgrade consumers first (add field w/ default)
Forward:  old consumer reads new data  -> upgrade producers first
Full:     both directions hold
Registry enforces the chosen mode -> incompatible schema change = rejected.
```

---

### Q272. What is Kafka Streams and when would you choose it?
**Difficulty:** `Intermediate`
**Category:** Kafka Streams

#### Answer
Kafka Streams is a **Java library** (not a separate cluster) for building stream-processing apps directly on Kafka topics — filtering, mapping, aggregations, joins, and windowing — with fault tolerance, state stores, and exactly-once. You deploy it as a normal application (it scales by running more instances, which share partitions like a consumer group). Choose it for Kafka-native transformations when you don't want to operate a separate framework (Flink/Spark); choose those for very large, cross-source, or complex processing.

#### Code Example / Key Takeaways
```java
StreamsBuilder b = new StreamsBuilder();
b.stream("orders", Consumed.with(Serdes.String(), orderSerde))
 .filter((k, o) -> o.total() > 100)
 .mapValues(Order::summary)
 .to("big-orders");
new KafkaStreams(b.build(), props).start();   // just a library, deploy as an app
```

---

### Q273. What is the difference between KStream, KTable, and GlobalKTable?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
- **KStream**: an unbounded **stream of records** (event/append semantics) — each record is an independent fact.
- **KTable**: a **changelog table** — keys map to their **latest value** (upsert/update semantics), backed by a compacted changelog; partitioned like the source.
- **GlobalKTable**: a KTable **fully replicated to every instance**, so any instance can do lookups against the whole table (good for small reference/dimension data and non-co-partitioned joins).

#### Code Example / Key Takeaways
```text
KStream      : insert-only event stream        (each record = an event)
KTable        : latest value per key (upsert)   (changelog-backed, partitioned)
GlobalKTable  : full copy on every instance     (small lookup/reference data)
Stream = facts; Table = current state; GlobalKTable = broadcast state for joins.
```

---

### Q274. What is a state store in Kafka Streams and how is it made fault-tolerant?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
A **state store** is local, durable storage (RocksDB by default, or in-memory) used for stateful operations — aggregations, joins, windowed counts. To survive failures, each store is backed by a **changelog topic** in Kafka: every state update is also written there (compacted). If an instance dies and its partitions move, the new instance **restores** the state by replaying the changelog. **Standby replicas** can pre-warm state to speed failover.

#### Code Example / Key Takeaways
```text
Stateful op -> update local RocksDB store -> also append to CHANGELOG topic (compacted)
Instance fails -> partition moves -> new instance replays changelog to rebuild state.
num.standby.replicas > 0 -> warm standby -> faster failover (less restore time).
```

---

### Q275. What is a repartition topic and a changelog topic in Kafka Streams?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
- **Repartition topic**: an internal topic Streams creates when an operation (e.g. a key change before an aggregation/join) requires records to be **re-distributed by a new key** so downstream operations are correctly co-partitioned.
- **Changelog topic**: an internal compacted topic that **persists state-store updates** for fault-tolerant recovery (see Q274).

Both are managed automatically; they consume Kafka storage, so be mindful of them at scale.

#### Code Example / Key Takeaways
```text
Repartition topic: created on selectKey/groupBy re-keying -> ensures co-partitioning
Changelog topic  : persists state store -> enables recovery of aggregations/joins
Both internal & auto-managed (named <app-id>-<store/op>-...). Watch their storage.
```

---

### Q276. What is windowing (tumbling, hopping, session)?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
Windowing groups stream events into bounded time buckets for aggregation:
- **Tumbling**: fixed-size, **non-overlapping** windows (e.g. every 1 min). Each event in exactly one window.
- **Hopping**: fixed-size windows that **advance by a hop** smaller than the size, so they **overlap** (e.g. 5-min window every 1 min).
- **Session**: **dynamic** windows defined by activity separated by an **inactivity gap** — great for user sessions.

Handle late events with a grace period.

#### Code Example / Key Takeaways
```java
// Tumbling: count per 1-minute non-overlapping window
stream.groupByKey()
      .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofSeconds(10)))
      .count();
// Hopping: .advanceBy(Duration.ofMinutes(1)) on a 5-min window -> overlapping
// Session: SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(5))
```

---

### Q277. What is a stream-table join?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
A **stream-table join** enriches each streaming record (KStream) with the current value from a table (KTable/GlobalKTable) for the same key — e.g. join an `orders` stream with a `customers` table to attach customer details. For KStream-KTable joins the inputs must be **co-partitioned** (same key, same partition count); GlobalKTable joins avoid that requirement (the table is fully replicated) and can join on a derived key. It's a lookup/enrichment at event time.

#### Code Example / Key Takeaways
```java
KStream<String, Order> orders = builder.stream("orders");
KTable<String, Customer> customers = builder.table("customers");   // co-partitioned
orders.join(customers, (order, cust) -> enrich(order, cust))       // enrich per event
      .to("orders-enriched");
// GlobalKTable variant: join on a derived key, no co-partitioning required.
```

---

### Q278. How does exactly-once work in Kafka Streams?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
Set `processing.guarantee=exactly_once_v2` and Kafka Streams uses transactions under the hood to atomically coordinate: consuming input offsets, updating **state stores** (via changelog), and producing output — all commit together or not at all. So a failure/restart never double-counts an aggregation or emits duplicate output. It builds on the transactional producer + read_committed consumer, but the library manages it, making EOS essentially a one-line configuration.

#### Code Example / Key Takeaways
```java
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG,
          StreamsConfig.EXACTLY_ONCE_V2);
// Atomic across input offsets + state changelog + output -> no double aggregation,
// no duplicate output, even across failures. Library handles the transactions.
```

---

### Q279. What is ksqlDB and how does it relate to Kafka Streams?
**Difficulty:** `Intermediate`
**Category:** Kafka Streams

#### Answer
**ksqlDB** is a streaming SQL layer built on top of Kafka Streams: you define streams/tables and processing (filters, joins, aggregations, windows) with **SQL** instead of Java, running as a server you query. It's ideal for teams that want stream processing without writing/deploying JVM apps; under the hood it compiles to Kafka Streams topologies. Choose Kafka Streams for full programmatic control, ksqlDB for rapid, declarative pipelines.

#### Code Example / Key Takeaways
```sql
-- Stream processing as SQL (compiles to Kafka Streams under the hood)
CREATE STREAM big_orders AS
  SELECT customer_id, total
  FROM orders
  WHERE total > 100
  EMIT CHANGES;
```

---

### Q280. What is the difference between Kafka Streams and a stream processor like Flink/Spark?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
- **Kafka Streams**: a **library** embedded in your app, Kafka-to-Kafka, no separate cluster to run, scales by running more app instances. Simplest for Kafka-centric processing.
- **Flink/Spark Streaming**: standalone **distributed frameworks** with their own clusters/schedulers, richer for very large-scale, complex event-time processing, multi-source/multi-sink pipelines, and advanced state/windowing.

Use Streams for Kafka-native, operationally simple jobs; Flink/Spark for heavy, cross-system, or extremely large processing.

#### Code Example / Key Takeaways
```text
Kafka Streams: library, no cluster, Kafka<->Kafka, scale = more app instances.
Flink/Spark : dedicated cluster, multi-source/sink, advanced event-time/state,
              better for very large or complex pipelines.
Pick Streams for simplicity; Flink/Spark for scale/complexity beyond Kafka-only.
```

---

### Q281. How do you handle schema evolution safely in production?
**Difficulty:** `Hard`
**Category:** Schema Registry

#### Answer
Use a Schema Registry with an enforced **compatibility mode** (commonly BACKWARD or FULL), make changes **additive** (add optional fields with defaults; avoid renames/removals/type changes), and version deliberately. Deploy in the order the compatibility mode allows (backward → consumers first; forward → producers first). Keep consumers tolerant of unknown/extra fields. Test schema changes in CI against the registry before rollout.

#### Code Example / Key Takeaways
```text
Rules for safe evolution:
  - enforce compatibility (BACKWARD/FULL) in the registry
  - additive changes only (new optional fields w/ defaults; no rename/remove/retype)
  - deploy order per mode (backward: consumers first; forward: producers first)
  - consumers tolerate unknown fields
  - validate schema changes in CI before rollout
```

---

### Q282. What is the Confluent Schema Registry's role in serialization?
**Difficulty:** `Intermediate`
**Category:** Schema Registry

#### Answer
The schema-aware serializer registers the writer's schema with the registry (getting a numeric **schema id**) and prepends `[magic byte][schema id]` to the payload — so the full schema isn't in every message. The deserializer reads the id, fetches (and caches) the schema, and decodes. This keeps messages compact, guarantees producer/consumer agreement, and lets the registry enforce compatibility centrally.

#### Code Example / Key Takeaways
```text
Serialize:   payload = [0x00][4-byte schema id][avro/proto bytes]
Deserialize: read id -> fetch+cache schema from registry -> decode
Benefits: compact messages, guaranteed contract, central compatibility enforcement.
```

---

### Q283. What is a source connector offset and how does Connect track progress?
**Difficulty:** `Hard`
**Category:** Kafka Connect

#### Answer
Source connectors track their position in the **external** system (e.g. a DB binlog position or a file offset) using **source offsets** — stored by Connect in an internal `connect-offsets` topic (distributed mode). On restart/rebalance the task resumes from the last committed source offset, giving at-least-once ingestion. Sink connectors instead use normal Kafka **consumer group offsets** to track their position in Kafka topics.

#### Code Example / Key Takeaways
```text
Source connector: position in external system (binlog/file/table cursor)
                  -> stored in connect-offsets topic -> resume after restart.
Sink connector:   Kafka consumer-group offsets -> resume in the Kafka topic.
Both at-least-once by default -> design sinks to be idempotent (upsert/PK).
```

---

### Q284. How do you make a sink connector idempotent / exactly-once?
**Difficulty:** `Hard`
**Category:** Kafka Connect

#### Answer
Since Connect is at-least-once by default, make the **sink target** idempotent: use **upsert** with a primary key derived from the record key/fields (so replays overwrite rather than duplicate), or rely on the target's unique constraints. Some sinks support exactly-once via transactional writes or offset storage in the target. The JDBC sink's `insert.mode=upsert` + `pk.mode` is the classic idempotent pattern.

#### Code Example / Key Takeaways
```json
{
  "insert.mode": "upsert",
  "pk.mode": "record_key",        // dedupe by Kafka record key
  "pk.fields": "id"
}
// Replays overwrite the same PK -> no duplicate rows (idempotent sink).
```

---

### Q285. What is Kafka Streams' interactive queries feature?
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
Interactive Queries let you **read the local state stores** of a running Kafka Streams app directly (e.g. serve a REST lookup of the latest aggregate for a key) instead of writing state back out to a topic and re-consuming it. Since state is partitioned across instances, you query the local store for keys this instance owns and use metadata to **route** requests to the instance that owns other keys. It turns a Streams app into a queryable, real-time materialized view.

#### Code Example / Key Takeaways
```java
// Query the materialized state store directly (real-time view)
ReadOnlyKeyValueStore<String, Long> store =
    streams.store(StoreQueryParameters.fromNameAndType("counts",
        QueryableStoreTypes.keyValueStore()));
Long count = store.get("user-42");
// Use streams.queryMetadataForKey(...) to route to the instance owning other keys.
```

---

### Q286. When would you use Kafka Connect vs writing a custom consumer/producer?
**Difficulty:** `Intermediate`
**Category:** Kafka Connect

#### Answer
Use **Kafka Connect** for standard **integration** (move data between Kafka and common systems — DBs, S3, Elasticsearch, CDC) where a connector already exists: you get scaling, offset management, retries, and fault tolerance for free, as config. Write a **custom consumer/producer** when you need bespoke business logic, non-standard systems without a connector, or tight control over processing semantics. Prefer Connect for plumbing, custom code for logic.

#### Code Example / Key Takeaways
```text
Kafka Connect: standard data movement (DB<->Kafka, CDC, S3, ES) -> config, HA, offsets free.
Custom client: bespoke business logic, unusual systems, precise custom semantics.
Rule: plumbing/integration -> Connect;  application logic -> custom code / Streams.
```

---

### Q287. Exercise — Streams: build a windowed count with exactly-once and expose it via interactive queries.
**Difficulty:** `Hard`
**Category:** Kafka Streams

#### Answer
Count events per key in tumbling windows with EOS enabled and materialize the result into a named state store, then serve the current counts via interactive queries. EOS ensures no double-counting on failure; the materialized store powers real-time lookups.

#### Code Example / Key Takeaways
```java
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
StreamsBuilder b = new StreamsBuilder();
b.stream("clicks", Consumed.with(Serdes.String(), Serdes.String()))
 .groupByKey()
 .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
 .count(Materialized.as("clicks-per-min"));      // named store for queries
KafkaStreams streams = new KafkaStreams(b.build(), props);
streams.start();
// Serve counts via interactive queries against the "clicks-per-min" store.
```

---
