# Microservices — Communication & Data Patterns Interview Questions (Q1–Q35)

---

### Q1. What is the difference between Synchronous and Asynchronous communication in microservices?
**Difficulty:** `Basic`
**Category:** Communication

#### Answer
- **Synchronous**: the caller sends a request and blocks until it receives a response (e.g. REST over HTTP, gRPC). Simple to reason about, but the caller's availability is now coupled to the callee's — if the downstream is slow or down, the caller suffers latency or failure. Chains of sync calls multiply latency and create cascading-failure risk.
- **Asynchronous**: the caller emits a message/event and does not wait (e.g. Kafka, RabbitMQ). Services are temporally decoupled — the consumer can process later. Improves resilience and scalability, but adds eventual consistency, ordering, and debugging complexity.

Rule of thumb: use sync for queries needing an immediate answer; use async for commands/events where the result can be processed in the background.

#### Code Example / Key Takeaways
```java
// SYNCHRONOUS — caller blocks for the response
OrderResponse resp = restClient.post()
    .uri("http://payment-service/charge")
    .body(chargeRequest)
    .retrieve()
    .body(OrderResponse.class);   // blocks here

// ASYNCHRONOUS — fire an event and move on
kafkaTemplate.send("order.placed", new OrderPlacedEvent(orderId, amount));
// payment-service consumes it whenever it can
```

---

### Q2. How is REST used in microservices and what are its trade-offs?
**Difficulty:** `Basic`
**Category:** Communication

#### Answer
REST over HTTP/JSON is the default for synchronous service-to-service and client-to-service calls. It is ubiquitous, language-agnostic, cacheable, and human-readable. Trade-offs: JSON is verbose and slower to (de)serialize than binary formats, there is no built-in contract enforcement (needs OpenAPI), over-/under-fetching is common, and streaming is awkward. Good REST in microservices uses proper status codes, versioned URIs (`/v1/orders`), idempotency keys for retries, and pagination.

#### Code Example / Key Takeaways
```java
@RestController
@RequestMapping("/v1/orders")
class OrderController {
    @PostMapping
    ResponseEntity<Order> create(@RequestBody @Valid OrderRequest req,
                                 @RequestHeader("Idempotency-Key") String key) {
        Order o = service.createIdempotent(key, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(o); // 201
    }

    @GetMapping("/{id}")
    ResponseEntity<Order> get(@PathVariable String id) {
        return service.find(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());          // 404
    }
}
```

---

### Q3. What are gRPC and Protocol Buffers, and when would you use them over REST?
**Difficulty:** `Intermediate`
**Category:** Communication

#### Answer
**gRPC** is a high-performance RPC framework using HTTP/2 (multiplexing, streaming) and **Protocol Buffers** (Protobuf) — a compact binary, schema-first serialization format. You define services and messages in a `.proto` file; codegen produces strongly-typed client/server stubs in many languages. Benefits: smaller payloads, faster (de)serialization, bidirectional streaming, and an enforced contract. Use gRPC for internal, high-throughput, low-latency service-to-service calls. Keep REST/JSON at the public edge (browser support for gRPC is limited without gRPC-Web).

#### Code Example / Key Takeaways
```protobuf
// payment.proto — the contract, shared by both services
syntax = "proto3";
service PaymentService {
  rpc Charge (ChargeRequest) returns (ChargeReply);
}
message ChargeRequest { string order_id = 1; int64 amount_cents = 2; }
message ChargeReply   { bool success = 1; string txn_id = 2; }
```
```java
// Generated stub — strongly typed, no manual JSON parsing
ChargeReply reply = paymentStub.charge(
    ChargeRequest.newBuilder().setOrderId("A1").setAmountCents(4200).build());
```

---

### Q4. What problem does GraphQL and schema federation solve in a microservices system?
**Difficulty:** `Intermediate`
**Category:** Communication

#### Answer
GraphQL gives clients a single endpoint to request exactly the fields they need, eliminating over-/under-fetching across many services. **Schema federation** (e.g. Apollo Federation) lets each service own a slice of one unified graph: the `users` service defines the `User` type, the `orders` service extends `User` with an `orders` field. A **gateway** composes these subgraphs and resolves cross-service references, so clients see one schema while ownership stays decentralized.

#### Code Example / Key Takeaways
```graphql
# users subgraph
type User @key(fields: "id") { id: ID!  name: String! }

# orders subgraph — extends a type it does not own
extend type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!            # resolved by the orders service
}
type Order { id: ID!  total: Float! }
```
The gateway fetches the user from one service and its orders from another, stitching them into a single response.

---

### Q5. What role do Message Queues play in microservices?
**Difficulty:** `Basic`
**Category:** Messaging

#### Answer
A message queue (RabbitMQ, SQS, ActiveMQ) decouples producers from consumers by buffering messages. It enables async processing, load leveling (absorbing spikes), and reliable delivery via acknowledgements and retries. Point-to-point queues deliver each message to exactly one consumer (competing consumers for horizontal scaling); a dead-letter queue captures messages that repeatedly fail. Unlike a log (Kafka), a classic queue typically deletes a message once acked and does not retain history for replay.

#### Code Example / Key Takeaways
```java
// Producer
rabbitTemplate.convertAndSend("orders.exchange", "order.created",
        new OrderCreated(orderId));

// Consumer — auto-ack after successful processing; failures re-queue / DLQ
@RabbitListener(queues = "orders.queue")
public void handle(OrderCreated evt) {
    inventory.reserve(evt.orderId());   // throws -> nack -> retry/DLQ
}
```

---

### Q6. How does Event Streaming with Kafka differ from a traditional message queue?
**Difficulty:** `Intermediate`
**Category:** Messaging

#### Answer
Kafka is a distributed, append-only **commit log**, not just a queue. Key differences:
- **Retention & replay**: messages are kept for a configured time/size, so consumers can re-read from any offset — a queue usually deletes on ack.
- **Consumer groups**: multiple groups each get every message (pub/sub) while partitions are load-balanced within a group.
- **Ordering**: guaranteed per partition (choose a partition key, e.g. `orderId`, to keep related events ordered).
- **Throughput**: sequential disk writes + partitioning scale to millions of events/sec.

Use Kafka for event sourcing, stream processing, and multiple independent consumers of the same event.

#### Code Example / Key Takeaways
```java
// Partition key keeps all events for one order in order
kafkaTemplate.send("orders", order.getId(), new OrderPlaced(order));

@KafkaListener(topics = "orders", groupId = "billing")
public void bill(OrderPlaced e) { /* billing group sees every event */ }

@KafkaListener(topics = "orders", groupId = "analytics")
public void track(OrderPlaced e) { /* analytics group also sees every event */ }
```

---

### Q7. What are the core patterns of Event-Driven Architecture (EDA)?
**Difficulty:** `Intermediate`
**Category:** Architecture

#### Answer
- **Event Notification**: a thin event says "something happened" (`OrderPlaced{id}`); consumers call back for details. Low coupling, more chatter.
- **Event-Carried State Transfer**: the event carries all needed data, so consumers keep local read models and avoid callbacks.
- **Event Sourcing**: the event log *is* the source of truth; state is rebuilt by replaying events.
- **CQRS**: separate write and read models, often fed by events.

Events should be immutable, named in past tense, versioned, and self-describing.

#### Code Example / Key Takeaways
```java
// Event notification (thin)
record OrderPlaced(String orderId) {}

// Event-carried state transfer (fat — consumer needs no callback)
record OrderPlaced(String orderId, String customerId,
                   List<LineItem> items, long totalCents, Instant placedAt) {}
```

---

### Q8. What is the difference between Choreography and Orchestration?
**Difficulty:** `Intermediate`
**Category:** Architecture

#### Answer
- **Choreography**: no central coordinator; each service reacts to events and emits its own. Decoupled and scalable, but the end-to-end flow is implicit and hard to trace/monitor.
- **Orchestration**: a central orchestrator explicitly tells each service what to do and tracks progress. Easier to visualize, monitor, and change flow logic, but the orchestrator is a coupling point and potential bottleneck.

Choose choreography for simple, loosely-coupled reactions; orchestration for complex, multi-step business processes needing visibility (often implemented as an orchestrated Saga).

#### Code Example / Key Takeaways
```java
// CHOREOGRAPHY — services react to each other's events
// order-service:   emit OrderPlaced
// payment-service: on OrderPlaced -> charge -> emit PaymentCompleted
// shipping-service:on PaymentCompleted -> ship

// ORCHESTRATION — one coordinator drives the steps
class OrderOrchestrator {
    void place(Order o) {
        payment.charge(o);      // step 1
        inventory.reserve(o);   // step 2
        shipping.schedule(o);   // step 3  (with compensation on failure)
    }
}
```

---

### Q9. What is the Database-Per-Service pattern and why is it important?
**Difficulty:** `Basic`
**Category:** Data Management

#### Answer
Each microservice owns its own database and no other service may access it directly — only through the owning service's API/events. This enforces loose coupling, lets each service choose the best datastore, and allows independent schema evolution and scaling. The cost: no cross-service JOINs or ACID transactions, so you need API composition or read models for queries, and Sagas for consistency. A shared database is an anti-pattern because it re-couples services at the schema level.

#### Code Example / Key Takeaways
```yaml
# Each service has isolated credentials/schema — no cross-service table access
order-service:
  datasource: { url: jdbc:postgresql://order-db:5432/orders }
payment-service:
  datasource: { url: jdbc:postgresql://payment-db:5432/payments }
# order-service NEVER runs: SELECT * FROM payments.transactions
# it calls payment-service's API or consumes its events instead
```

---

### Q10. What is Polyglot Persistence?
**Difficulty:** `Basic`
**Category:** Data Management

#### Answer
Polyglot persistence means using different database technologies for different services based on each one's data access patterns — a natural consequence of database-per-service. E.g. a catalog service uses a document store, a session service uses Redis, a fraud service uses a graph DB, and an orders service uses PostgreSQL. The benefit is fit-for-purpose storage; the cost is more operational surface area (backups, expertise, monitoring per engine), so teams standardize on a small approved set.

#### Code Example / Key Takeaways
```text
catalog-service    -> MongoDB      (flexible product documents)
cart-service       -> Redis        (fast, ephemeral, TTL)
orders-service     -> PostgreSQL   (transactions, integrity)
recommendation svc -> Neo4j        (graph traversals)
search-service     -> Elasticsearch(full-text, relevance)
```

---

### Q11. What is the Distributed Transaction Problem?
**Difficulty:** `Intermediate`
**Category:** Data Management

#### Answer
With database-per-service, a business operation spanning multiple services (place order → charge payment → reserve stock) cannot use a single ACID transaction, because each service has its own DB. Classic two-phase commit (2PC/XA) provides atomicity but is slow, locks resources, and reduces availability (blocking if the coordinator fails) — it does not fit highly available microservices. The pragmatic answer is to give up immediate consistency and use **Sagas** with compensating actions plus idempotency, accepting eventual consistency.

#### Code Example / Key Takeaways
```java
// This is IMPOSSIBLE across separate service databases:
@Transactional
void placeOrder() {
    orderDb.save(order);        // order-service DB
    paymentDb.charge(payment);  // payment-service DB  <-- different DB, not in this tx
    inventoryDb.reserve(items); // inventory-service DB <-- different DB
}
// Solution: Saga (Q12) — a sequence of local transactions + compensations.
```

---

### Q12. Explain the Saga Pattern and its two coordination styles.
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
A Saga models a distributed transaction as a sequence of **local transactions**, each in one service. After each local commit the service publishes an event/command triggering the next step. If a step fails, the Saga runs **compensating transactions** to undo prior steps (semantic rollback — you can't roll back a committed local tx, so you issue a counter-action like "refund"). Two styles: **choreography** (services react to events) and **orchestration** (a central Saga orchestrator drives steps and compensations). Sagas provide atomicity-of-outcome and eventual consistency, not isolation, so guard against anomalies with idempotency and semantic locks.

#### Code Example / Key Takeaways
```java
// Orchestrated Saga with compensation
class CreateOrderSaga {
    void execute(Order o) {
        try {
            payment.charge(o);            // step 1
            try {
                inventory.reserve(o);     // step 2
                shipping.schedule(o);     // step 3
            } catch (Exception e) {
                payment.refund(o);        // compensate step 1
                inventory.release(o);     // compensate step 2
                throw e;
            }
        } catch (Exception e) {
            order.markFailed(o);
        }
    }
}
```

---

### Q13. Exercise — Saga Pattern: design a booking that reserves a flight and a hotel atomically.
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
Model each reservation as a local transaction with a compensation. If the hotel step fails after the flight is booked, cancel the flight. Make every step idempotent (retry-safe) and record Saga state so it can resume after a crash. Below is an orchestrated implementation with explicit compensation and idempotency keys.

#### Code Example / Key Takeaways
```java
class TripBookingSaga {
    void book(TripRequest req) {
        String sagaId = req.id();
        String flightRef = null;
        try {
            flightRef = flight.reserve(sagaId, req.flight());   // idempotent by sagaId
            String hotelRef = hotel.reserve(sagaId, req.hotel());
            store.markCompleted(sagaId, flightRef, hotelRef);
        } catch (Exception ex) {
            if (flightRef != null) flight.cancel(sagaId, flightRef); // compensate
            store.markAborted(sagaId, ex.getMessage());
            throw new BookingFailedException(sagaId, ex);
        }
    }
}
// Idempotency: flight.reserve(sagaId,...) returns the SAME ref if called twice.
```

---

### Q14. What is Event Sourcing?
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
Instead of storing current state, Event Sourcing stores the full, immutable, ordered sequence of state-changing **events**. Current state is derived by replaying events. Benefits: a complete audit log, time-travel/debugging, natural fit for EDA, and the ability to build new projections retroactively. Costs: querying current state requires folding events (mitigated by snapshots and CQRS read models), schema/versioning of old events, and eventual consistency. The event store is append-only; events are never mutated or deleted.

#### Code Example / Key Takeaways
```java
// State is a fold over past events, not a stored row
class Account {
    long balance;
    void apply(Event e) {
        if (e instanceof Deposited d)  balance += d.amount();
        if (e instanceof Withdrawn w)  balance -= w.amount();
    }
    static Account rehydrate(List<Event> history) {
        Account a = new Account();
        history.forEach(a::apply);   // replay to rebuild current balance
        return a;
    }
}
```

---

### Q15. Exercise — Event Sourcing: rebuild an account balance from an event stream, with snapshots.
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
Replaying millions of events per read is expensive, so periodically persist a **snapshot** of state at a known version, then replay only events after that version. On load: fetch latest snapshot, apply subsequent events. This bounds replay cost while keeping the event log authoritative.

#### Code Example / Key Takeaways
```java
Account load(String id) {
    Snapshot snap = snapshots.latest(id);                 // e.g. version 1000
    Account acc = snap != null ? Account.from(snap) : new Account();
    long fromVersion = snap != null ? snap.version() : 0;
    for (Event e : store.eventsAfter(id, fromVersion))    // replay only the tail
        acc.apply(e);
    return acc;
}
void maybeSnapshot(String id, Account acc, long version) {
    if (version % 1000 == 0) snapshots.save(id, acc.toSnapshot(version));
}
```

---

### Q16. What is CQRS and when should you use it?
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
CQRS (Command Query Responsibility Segregation) separates the **write model** (commands that change state, optimized for validation/consistency) from the **read model** (queries, optimized for fast reads, often denormalized). The two models can use different schemas or even different databases, kept in sync via events. Benefits: independent scaling of reads vs writes, tailored read models per use case, and a clean pairing with event sourcing. Costs: added complexity and eventual consistency between write and read sides — use it only where read/write needs genuinely diverge, not everywhere.

#### Code Example / Key Takeaways
```java
// WRITE side — normalized, validated
class PlaceOrderCommandHandler {
    void handle(PlaceOrder cmd) {
        Order o = Order.create(cmd);          // enforce invariants
        repo.save(o);
        events.publish(new OrderPlaced(o));   // feeds the read side
    }
}
// READ side — denormalized projection updated from events
@KafkaListener(topics = "orders")
void project(OrderPlaced e) {
    readDb.upsertOrderSummary(e.id(), e.customerName(), e.total());
}
```

---

### Q17. Exercise — CQRS: build a read projection kept in sync with the write side.
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
Commands mutate the write DB and emit events; a projector consumes those events to (re)build a denormalized read table for fast queries. Make the projector idempotent (handle duplicate events) and track the last processed offset so it can resume. Queries hit only the read table.

#### Code Example / Key Takeaways
```java
@Component
class OrderSummaryProjector {
    @KafkaListener(topics = "orders", groupId = "order-summary")
    void on(OrderEvent e) {
        switch (e) {
            case OrderPlaced p   -> readDb.insertIfAbsent(p.id(), p.total(), "PLACED");
            case OrderShipped s  -> readDb.updateStatus(s.id(), "SHIPPED");
            case OrderCancelled c-> readDb.updateStatus(c.id(), "CANCELLED");
            default -> {}
        }
    }
}
// Query path is a trivial single-table read:
List<OrderSummary> recent() { return readDb.findTop50ByOrderByCreatedDesc(); }
```

---

### Q18. What is the Outbox Pattern and how does CDC support it?
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
The **dual-write problem**: updating the DB and publishing to a broker in two separate steps can leave them inconsistent if one fails. The **Transactional Outbox** solves it by writing the business row and an `outbox` event row in the *same local transaction*. A separate relay then publishes outbox rows to the broker. **Change Data Capture (CDC)** (e.g. Debezium tailing the DB transaction log) reads committed outbox inserts and streams them to Kafka — no polling, low latency, and the write is atomic. This gives at-least-once delivery, so consumers must be idempotent.

#### Code Example / Key Takeaways
```java
@Transactional
public void placeOrder(Order o) {
    orderRepo.save(o);                                   // business row
    outboxRepo.save(new OutboxEvent(                     // SAME transaction
        "Order", o.getId(), "OrderPlaced", toJson(o)));
    // No broker call here — CDC/Debezium tails the outbox table
    // and publishes committed rows to Kafka.
}
```

---

### Q19. Exercise — Outbox Pattern: guarantee an event is published exactly when the row is committed.
**Difficulty:** `Hard`
**Category:** Data Management

#### Answer
Write to `outbox` inside the business transaction. A poller (or CDC) reads unpublished rows, publishes them, and marks them sent — retrying on failure. Because publishing and marking-sent aren't atomic, delivery is at-least-once; consumers dedupe on the event id.

#### Code Example / Key Takeaways
```java
// Relay: runs on a schedule, publishes committed outbox rows
@Scheduled(fixedDelay = 500)
void relay() {
    for (OutboxEvent e : outboxRepo.findTop100ByPublishedFalseOrderById()) {
        kafka.send(e.getTopic(), e.getAggregateId(), e.getPayload());
        e.setPublished(true);           // if this fails, row re-published next tick
        outboxRepo.save(e);
    }
}
// Consumer dedupes:
if (processedRepo.existsById(e.eventId())) return;   // already handled
```

---

### Q20. How do you handle Eventual Consistency in a microservices system?
**Difficulty:** `Intermediate`
**Category:** Data Management

#### Answer
Accept that read models and downstream services lag the source of truth briefly, and design for it: make consumers **idempotent** (safe on duplicates), tolerate **out-of-order** events (use versions/timestamps), expose the consistency to users honestly (e.g. "payment processing"), use **compensations** to fix divergence, and add reconciliation jobs to detect drift. Never assume a cross-service read reflects a write that just happened; instead confirm via events or poll with a status.

#### Code Example / Key Takeaways
```java
// Version guard: ignore stale/duplicate events, apply only newer state
void onProfileUpdated(ProfileUpdated e) {
    ReadRow row = readDb.find(e.userId());
    if (row != null && e.version() <= row.version()) return; // stale/dup -> skip
    readDb.upsert(e.userId(), e.data(), e.version());
}
```

---

### Q21. Exercise — Eventual Consistency: make a consumer idempotent and order-tolerant.
**Difficulty:** `Intermediate`
**Category:** Data Management

#### Answer
Combine a processed-id set (idempotency) with a version check (ordering). Duplicates are dropped by id; out-of-order updates are dropped by version. Together they make the projection converge to the latest state regardless of delivery quirks.

#### Code Example / Key Takeaways
```java
@KafkaListener(topics = "inventory")
void handle(StockChanged e) {
    if (!processed.add(e.eventId())) return;               // idempotent: dup dropped
    Integer current = readDb.versionOf(e.sku());
    if (current != null && e.version() <= current) return; // order-tolerant
    readDb.setStock(e.sku(), e.qty(), e.version());
}
```

---

### Q22. What are the common Failure Modes in distributed systems?
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
- **Partial failure**: some nodes/services fail while others work — the defining trait of distributed systems.
- **Network**: latency spikes, packet loss, partitions (split brain), and the "network is unreliable" fallacy.
- **Slow (grey) failures**: a service responds but slowly, exhausting caller threads — often worse than a clean crash.
- **Cascading failures**: one overloaded service drags down its callers.
- **Clock skew** and **message duplication/reordering**.

Design assuming any dependency can be slow or unavailable at any time; add timeouts, retries with backoff, circuit breakers, and bulkheads.

#### Code Example / Key Takeaways
```java
// The #1 mistake: no timeout -> a slow dependency hangs your threads forever
var client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2))     // bound the connect
    .build();
var req = HttpRequest.newBuilder(uri)
    .timeout(Duration.ofSeconds(3))            // bound the response
    .build();
```

---

### Q23. Explain Timeouts, Retries, and Exponential Backoff.
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
- **Timeout**: cap how long you wait for a dependency so a slow call fails fast instead of pinning a thread.
- **Retry**: re-attempt transient failures — but only **idempotent** operations, or you risk double side-effects.
- **Exponential backoff**: increase the delay between retries (1s, 2s, 4s…) to avoid hammering a struggling service.
- **Jitter**: add randomness so many clients don't retry in lockstep (the "thundering herd").

Always bound total attempts and total time; combine with a circuit breaker so retries don't prolong an outage.

#### Code Example / Key Takeaways
```java
// Resilience4j: retry with exponential backoff + jitter
RetryConfig cfg = RetryConfig.custom()
    .maxAttempts(4)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
        Duration.ofSeconds(1), 2.0, 0.5))   // 1s,2s,4s (+/-50% jitter)
    .retryOnException(ex -> ex instanceof IOException)
    .build();
Retry retry = Retry.of("payment", cfg);
Supplier<Reply> call = Retry.decorateSupplier(retry, () -> paymentClient.charge(req));
```

---

### Q24. Exercise — Timeouts, Retries, and Backoff: wrap a flaky call safely.
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
Only retry idempotent calls, cap attempts and per-attempt time, back off exponentially with jitter, and give up to a fallback. Below combines a timeout with a bounded, jittered retry.

#### Code Example / Key Takeaways
```java
TimeLimiter limiter = TimeLimiter.of(Duration.ofSeconds(3));
Retry retry = Retry.of("inventory", RetryConfig.custom()
    .maxAttempts(3)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
        Duration.ofMillis(200), 2.0, 0.5))
    .build());

Supplier<Integer> guarded = Retry.decorateSupplier(retry,
    () -> {
        try { return limiter.executeFutureSupplier(
                 () -> CompletableFuture.supplyAsync(() -> client.stock(sku))); }
        catch (Exception e) { throw new RuntimeException(e); }
    });
int stock = Try.ofSupplier(guarded).recover(ex -> 0).get();  // fallback: 0
```

---

### Q25. What is the Circuit Breaker pattern?
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
A circuit breaker stops calling a failing dependency to let it recover and to fail fast. States:
- **Closed**: calls flow; failures are counted.
- **Open**: once a failure threshold is crossed, calls are rejected immediately (return a fallback) for a cooldown window.
- **Half-Open**: after cooldown, a few trial calls are allowed; success closes the circuit, failure re-opens it.

This prevents wasted work and cascading failures, and gives the downstream breathing room.

#### Code Example / Key Takeaways
```java
CircuitBreakerConfig cfg = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)                     // open at 50% failures
    .slowCallRateThreshold(80)
    .slowCallDurationThreshold(Duration.ofSeconds(2))
    .waitDurationInOpenState(Duration.ofSeconds(10))
    .permittedNumberOfCallsInHalfOpenState(3)
    .slidingWindowSize(20)
    .build();
CircuitBreaker cb = CircuitBreaker.of("payment", cfg);

Supplier<Reply> decorated = CircuitBreaker.decorateSupplier(cb,
    () -> paymentClient.charge(req));
Reply r = Try.ofSupplier(decorated).recover(ex -> Reply.declined()).get();
```

---

### Q26. Exercise — Circuit Breaker: add fallback behavior when a dependency is down.
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
Wrap the call in a breaker and provide a fallback (cached value, default, or degraded response) invoked when the breaker is open or the call fails. In Spring, `@CircuitBreaker` with a `fallbackMethod` keeps it declarative.

#### Code Example / Key Takeaways
```java
@Service
class RecommendationService {
    @CircuitBreaker(name = "recs", fallbackMethod = "popularFallback")
    public List<Item> personalized(String userId) {
        return recsClient.forUser(userId);       // remote call
    }
    // Same signature + Throwable; runs when circuit open or call fails
    List<Item> popularFallback(String userId, Throwable t) {
        return cache.popularItems();             // graceful degradation
    }
}
```

---

### Q27. What is the Bulkhead pattern?
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
Named after ship compartments, the bulkhead pattern isolates resources (thread pools, connection pools, semaphores) per dependency so a failure in one cannot consume all resources and sink the whole service. If calls to a slow `report-service` are capped at their own pool, they can't starve threads needed for `payment-service`. It contains partial failures and preserves capacity for healthy paths.

#### Code Example / Key Takeaways
```java
// Separate, bounded pools per dependency — one can't exhaust the other
Bulkhead paymentBh = Bulkhead.of("payment",
    BulkheadConfig.custom().maxConcurrentCalls(20).maxWaitDuration(Duration.ofMillis(50)).build());
Bulkhead reportBh = Bulkhead.of("report",
    BulkheadConfig.custom().maxConcurrentCalls(5).build());   // slow, so cap tight

Supplier<Reply> call = Bulkhead.decorateSupplier(paymentBh, () -> paymentClient.charge(req));
```

---

### Q28. Exercise — Bulkhead Pattern: isolate a slow dependency behind its own pool.
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
Give the slow dependency a dedicated, small thread pool (thread-pool bulkhead) so its saturation rejects only its own calls while the main request threads stay free. Combine with a fallback when the bulkhead is full.

#### Code Example / Key Takeaways
```java
@Service
class ReportService {
    @Bulkhead(name = "report", type = Bulkhead.Type.THREADPOOL,
              fallbackMethod = "busy")
    public CompletableFuture<Report> generate(String id) {
        return CompletableFuture.completedFuture(reportClient.build(id));
    }
    CompletableFuture<Report> busy(String id, Throwable t) {
        return CompletableFuture.completedFuture(Report.tryLater()); // rejected when full
    }
}
```

---

### Q29. What are Cascading Failures and how do you prevent them?
**Difficulty:** `Hard`
**Category:** Resilience

#### Answer
A cascading failure is a chain reaction: service A slows, its callers' threads pile up waiting on A, those callers become unresponsive, *their* callers fail, and the outage spreads upstream. Common triggers: no timeouts, unbounded retries, shared thread pools, and no backpressure. Prevention: aggressive timeouts, circuit breakers (fail fast when A is unhealthy), bulkheads (isolate A's blast radius), load shedding/rate limiting, and retry budgets with jitter. The goal is to convert a slow dependency into a fast, contained failure.

#### Code Example / Key Takeaways
```java
// Layered defense converts a slow dependency into a fast, contained failure
Supplier<Reply> guarded =
  Decorators.ofSupplier(() -> downstream.call(req))
    .withThreadPoolBulkhead(bulkhead)   // isolate blast radius
    .withTimeLimiter(timeLimiter, scheduler) // fail fast on slowness
    .withCircuitBreaker(circuitBreaker) // stop calling when unhealthy
    .withFallback(List.of(Exception.class), ex -> Reply.degraded())
    .decorate()::get;
```

---

### Q30. What are Graceful Degradation and Fallbacks?
**Difficulty:** `Intermediate`
**Category:** Resilience

#### Answer
Graceful degradation keeps the core experience working when a non-critical dependency fails, by returning a reduced-but-useful response instead of an error. Examples: show cached/popular recommendations when the recs engine is down, hide the reviews section if the reviews service fails, or accept an order and settle payment later. A **fallback** is the concrete alternative value/action invoked on failure (via circuit breaker/try-recover). Distinguish critical paths (must succeed) from optional ones (safe to degrade).

#### Code Example / Key Takeaways
```java
ProductPage page = new ProductPage();
page.setProduct(catalog.get(id));                     // critical — must succeed
page.setReviews(Try.ofSupplier(() -> reviews.get(id)) // optional — degrade
                   .recover(ex -> List.of()).get());
page.setRecommendations(Try.ofSupplier(() -> recs.get(id))
                   .recover(ex -> cache.popular()).get());
return page;   // page renders even if reviews/recs are down
```

---

### Q31. How does Service-to-Service Authentication work in microservices?
**Difficulty:** `Hard`
**Category:** Security

#### Answer
Internal calls must authenticate the *caller service*, not just end users. Common approaches: **mTLS** (each service presents a certificate; identity is the cert, often automated by a service mesh), **OAuth2 client-credentials** (a service gets a token from an auth server and presents it as a Bearer JWT), and **signed JWTs** propagating the end-user context downstream. Verify tokens' signature, issuer, audience, and expiry on every hop; apply least-privilege scopes. Never trust the network alone (zero-trust).

#### Code Example / Key Takeaways
```java
// Caller obtains a client-credentials token, forwards it as Bearer
String token = oauth.clientCredentialsToken("order-service", scopes("payment.charge"));
paymentClient.post().uri("/charge")
    .header("Authorization", "Bearer " + token)
    .body(req).retrieve();

// Callee validates issuer + audience + scope on the JWT (Spring Security)
http.oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(scopeConverter)));
```

---

### Q32. How do you manage Secrets Across Services?
**Difficulty:** `Intermediate`
**Category:** Security

#### Answer
Never hardcode secrets or bake them into images/repos. Use a dedicated secrets manager (HashiCorp Vault, AWS Secrets Manager, Kubernetes Secrets with encryption-at-rest) that provides: centralized storage, access control per service identity, rotation, dynamic short-lived credentials, and audit logs. Inject secrets at runtime (env/mounted files/sidecar), scope them least-privilege, and rotate regularly. Encrypt in transit and at rest.

#### Code Example / Key Takeaways
```yaml
# Spring Cloud Vault — secrets fetched at startup by service identity, never in git
spring:
  cloud:
    vault:
      uri: https://vault:8200
      authentication: KUBERNETES        # service's k8s identity authenticates
      kv: { enabled: true, backend: secret }
# Usage: @Value("${db.password}") resolved from Vault, rotated centrally
```

---

### Q33. What are the main Deployment Strategies for microservices?
**Difficulty:** `Intermediate`
**Category:** Deployment

#### Answer
- **Rolling**: replace instances gradually; no downtime, but mixed versions run briefly.
- **Blue-Green**: run the new version (green) alongside old (blue), switch traffic at once; instant rollback, but doubles resources.
- **Canary**: route a small % of traffic to the new version, watch metrics, then ramp up; limits blast radius.
- **Shadow/dark launch**: send mirrored traffic to the new version without serving its responses, to test under real load.

Pair with automated health checks and rollback. Backward-compatible APIs/schemas are required so old and new can coexist.

#### Code Example / Key Takeaways
```yaml
# Canary: 10% to v2, 90% to v1 (e.g. Istio VirtualService)
http:
- route:
  - destination: { host: orders, subset: v1 }
    weight: 90
  - destination: { host: orders, subset: v2 }
    weight: 10        # ramp to 100 as metrics stay green
```

---

### Q34. How do you handle Configuration Management and Feature Flags?
**Difficulty:** `Intermediate`
**Category:** Deployment

#### Answer
Externalize configuration from code (12-factor) so the same artifact runs in every environment. Use a central config service (Spring Cloud Config, Consul, k8s ConfigMaps) with per-environment overrides and, ideally, dynamic refresh without redeploy. **Feature flags** decouple deploy from release: ship code dark, then toggle features per environment/user cohort at runtime — enabling canary releases, A/B tests, and instant kill-switches. Keep secrets out of plain config (Q32) and audit flag changes.

#### Code Example / Key Takeaways
```java
// Feature flag gates behavior at runtime — no redeploy to turn on/off
if (features.isEnabled("new-checkout", userId)) {
    return newCheckoutFlow(cart);      // gradually rolled out / A-B tested
}
return legacyCheckoutFlow(cart);       // instant kill-switch back to this
```

---

### Q35. Exercise — Configuration and Feature Flags: roll out a feature to 5% of users.
**Difficulty:** `Intermediate`
**Category:** Deployment

#### Answer
Use a deterministic hash of the user id to bucket users into a stable percentage, so the same user consistently sees the same variant and you can ramp the percentage centrally. Read the rollout percentage from config so it changes without redeploy.

#### Code Example / Key Takeaways
```java
class PercentageRollout {
    boolean enabled(String flag, String userId, int percent) {
        int bucket = Math.floorMod(
            (flag + ":" + userId).hashCode(), 100);   // stable 0..99 per user
        return bucket < percent;                       // percent read from config
    }
}
// percent=5 -> ~5% of users; bump to 25, 50, 100 centrally to ramp the rollout.
```

---
