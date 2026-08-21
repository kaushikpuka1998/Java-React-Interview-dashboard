# System Design (HLD) — Distributed & Architecture Patterns Interview Questions (Q39–Q58)

---

### Q39. What is the Sidecar pattern?
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
The Sidecar pattern deploys a helper component in a **separate process/container alongside** the main application (in the same pod/host), sharing its lifecycle and network. It offloads cross-cutting concerns — TLS/mTLS, retries, service discovery, logging, metrics, config — out of the app and into the sidecar, so the app stays focused on business logic and the behavior is language-agnostic. It's the foundation of a **service mesh** (Envoy sidecar per service). Cost: extra resource/latency per hop.

#### Code Example / Key Takeaways
```yaml
# Kubernetes pod: app container + sidecar proxy share network & lifecycle
spec:
  containers:
    - name: order-service          # your business app
      image: order-service:1.0
    - name: envoy-sidecar          # handles mTLS, retries, metrics, tracing
      image: envoyproxy/envoy:latest
# App calls localhost; the sidecar intercepts and secures/observes all traffic.
```

---

### Q40. What is the Ambassador pattern and how does it differ from Sidecar?
**Difficulty:** `Hard`
**Category:** Architecture Patterns

#### Answer
The Ambassador pattern places a helper proxy that handles **outbound** network requests on behalf of the app — connection management, retries, circuit breaking, routing, monitoring — so the app just calls a local endpoint. It's a specialized sidecar focused on client-side connectivity to remote services, useful for adding resilience to legacy apps without changing their code. **Sidecar** is the general concept (any co-located helper); **Ambassador** specifically brokers the app's outbound calls to external/remote services.

#### Code Example / Key Takeaways
```text
App --> localhost:9000 (Ambassador proxy) --> remote-service
The Ambassador adds: retries, timeouts, circuit breaking, TLS, service discovery.
Sidecar   = general co-located helper (in/out, cross-cutting concerns)
Ambassador= sidecar specialized for the app's OUTBOUND connectivity
```

---

### Q41. Explain the Circuit Breaker pattern at the architecture level.
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
Circuit Breaker prevents an app from repeatedly calling a failing remote dependency, giving it time to recover and failing fast to avoid resource exhaustion and cascading failures. States: **Closed** (calls pass, failures counted), **Open** (calls short-circuit to a fallback for a cooldown), **Half-Open** (a few trial calls test recovery). It's essential in distributed systems where any dependency can be slow/down. Often provided by a library (Resilience4j) or the service mesh.

#### Code Example / Key Takeaways
```java
CircuitBreaker cb = CircuitBreaker.of("inventory", CircuitBreakerConfig.custom()
    .failureRateThreshold(50)                       // open at 50% failures
    .waitDurationInOpenState(Duration.ofSeconds(10))
    .permittedNumberOfCallsInHalfOpenState(3)
    .slidingWindowSize(20).build());

Supplier<Stock> call = CircuitBreaker.decorateSupplier(cb, () -> inventoryClient.get(sku));
Stock s = Try.ofSupplier(call).recover(ex -> Stock.unknown()).get();  // fast fallback
```

---

### Q42. What is the Master-Slave (Primary-Replica) architecture?
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
In Master-Slave (now usually called **Primary-Replica** or **Leader-Follower**), one **master** node handles writes and one or more **slave/replica** nodes replicate the master's data and serve reads. Benefits: read scalability (fan reads across replicas), high availability (promote a replica if the master fails), and backups/analytics off replicas. Trade-offs: **replication lag** (replicas may be slightly stale → eventual consistency for reads), and writes remain a single-master bottleneck. Widely used in databases (MySQL/Postgres replication), Redis, and Kafka (partition leader/followers).

#### Code Example / Key Takeaways
```text
                 writes
   Clients ─────────────► [ MASTER / Primary ] ──replicate──► [ Replica 1 ] ─┐
                             ▲                              └► [ Replica 2 ] ─┤ reads
                             └──────── reads may go to replicas ─────────────┘
Master fails -> promote a replica to new master (failover).
Caveat: replication lag -> replica reads can be slightly stale.
```

---

### Q43. How do you route reads to replicas and writes to the master?
**Difficulty:** `Hard`
**Category:** Architecture Patterns

#### Answer
Use a routing layer (application-level datasource router, proxy like ProxySQL, or driver read/write split) that sends write/transactional queries to the master and read-only queries to replicas (load-balanced). Handle **replication lag**: for read-your-own-writes consistency, route a user's reads to the master briefly after they write, or use a version/timestamp check. Below is a Spring `AbstractRoutingDataSource` that switches datasources by a thread-local flag.

#### Code Example / Key Takeaways
```java
class RoutingDataSource extends AbstractRoutingDataSource {
    protected Object determineCurrentLookupKey() {
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
            ? "replica" : "master";                 // reads -> replica, writes -> master
    }
}
// @Transactional(readOnly = true) methods hit a replica; writes hit the master.
// For read-your-writes: pin the user to master for a short window after a write.
```

---

### Q44. What is Leader Election in distributed systems?
**Difficulty:** `Hard`
**Category:** Architecture Patterns

#### Answer
Leader Election designates one node among many as the coordinator (leader) to make decisions or own a resource, so work isn't duplicated (e.g. only one node runs a scheduled job or is the write master). If the leader fails, the group elects a new one. It requires consensus to avoid **split-brain** (two leaders). Implemented via consensus algorithms (**Raft**, Paxos) or coordination services (ZooKeeper, etcd, Consul) using distributed locks/leases with fencing tokens.

#### Code Example / Key Takeaways
```java
// Lease-based leader election (e.g. via etcd/ZooKeeper/Redis lock)
if (coordinator.tryAcquireLeadership("scheduler-leader", Duration.ofSeconds(15))) {
    runScheduledJobsAsLeader();                    // only the leader runs these
    coordinator.renewLeaseHeartbeat();             // keep leadership alive
}
// Leader crashes -> lease expires -> another node acquires it (new leader).
// Fencing token prevents a paused old leader from acting after losing the lease.
```

---

### Q45. Explain the Load Balancer pattern and its strategies.
**Difficulty:** `Basic`
**Category:** Architecture Patterns

#### Answer
A load balancer distributes incoming traffic across multiple backend instances to improve throughput, availability, and to avoid overloading any one node. It performs **health checks** and removes unhealthy instances. **Layer 4** balances by TCP/IP; **Layer 7** is HTTP-aware (route by path/header/cookie). Strategies: round robin, least connections, weighted, IP/consistent hash (sticky). It's a cornerstone of horizontal scaling and zero-downtime deploys.

#### Code Example / Key Takeaways
```text
            ┌─► instance A (healthy)
Clients ─► LB ─► instance B (healthy)      strategy: round robin / least-conn / weighted
            └─► instance C (unhealthy -> removed by health check)
L4: TCP-level, fast.   L7: HTTP-aware (path/header routing, TLS termination).
```

---

### Q46. What is the Reverse Proxy pattern (vs Forward Proxy)?
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
A **reverse proxy** sits in front of servers and handles incoming client requests on their behalf — doing TLS termination, load balancing, caching, compression, and routing (Nginx, Envoy, API gateways). Clients think they're talking to one server. A **forward proxy** sits in front of clients and forwards their outbound requests to the internet (egress control, anonymity, corporate filtering). Reverse = protects/serves the servers; forward = represents the clients.

#### Code Example / Key Takeaways
```nginx
# Reverse proxy: one public entry point -> internal services, with caching + TLS
server {
  listen 443 ssl;
  location /api/ { proxy_pass http://backend_pool; }   # route + load balance
  location /static/ { proxy_cache assets; proxy_pass http://cdn_origin; }
}
# Forward proxy = client-side egress (e.g. browser -> corporate proxy -> internet)
```

---

### Q47. Explain Database Sharding (partitioning) as a pattern.
**Difficulty:** `Hard`
**Category:** Architecture Patterns

#### Answer
Sharding horizontally partitions data across multiple databases/nodes, each holding a subset, so no single node holds everything — scaling writes and storage beyond one machine. A **shard key** determines placement: **range** (by value range), **hash** (even distribution, avoids hotspots), or **directory/lookup**. Trade-offs: cross-shard queries/joins and transactions are hard, rebalancing is complex (consistent hashing helps), and a bad shard key causes hotspots. Choose a high-cardinality, evenly-accessed key.

#### Code Example / Key Takeaways
```java
// Hash sharding: route by shard key to one of N shards
int shard = Math.floorMod(userId.hashCode(), shards.size());
DataSource ds = shards.get(shard);                  // that user's data lives here
// Range sharding: users A-M -> shard0, N-Z -> shard1
// Pitfall: low-cardinality/skewed keys -> hotspots. Cross-shard JOINs are costly.
```

---

### Q48. Explain the Rate Limiter / Throttling pattern.
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
Rate limiting caps how many requests a client can make in a time window to protect services from overload, abuse, and to enforce fair use/quotas. Algorithms: **Token Bucket** (tokens refill at a rate, allow bursts up to capacity), **Leaky Bucket** (smooths to a constant rate), **Fixed/Sliding Window** counters. In distributed systems, back the counter with Redis so the limit holds across instances. Exceeding the limit returns HTTP 429 with `Retry-After`.

#### Code Example / Key Takeaways
```java
// Token bucket: refill at `rate`/sec, allow bursts up to `capacity`
class TokenBucket {
    private double tokens; private final double capacity, ratePerSec;
    private long last = System.nanoTime();
    TokenBucket(double cap, double rate){ capacity=cap; ratePerSec=rate; tokens=cap; }
    synchronized boolean allow() {
        long now = System.nanoTime();
        tokens = Math.min(capacity, tokens + (now - last)/1e9 * ratePerSec);
        last = now;
        if (tokens >= 1) { tokens -= 1; return true; }
        return false;                                // -> HTTP 429
    }
}
```

---

### Q49. Explain the Retry pattern with backoff and idempotency.
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
Retry re-attempts a failed operation that may be **transient** (network blip, timeout, 503). To be safe it must: only retry **idempotent** operations (or use idempotency keys), use **exponential backoff + jitter** to avoid hammering/thundering herd, cap total attempts/time, and only retry retryable errors (not a 400/validation error). Pair with a circuit breaker so retries don't prolong a real outage.

#### Code Example / Key Takeaways
```java
Retry retry = Retry.of("api", RetryConfig.custom()
    .maxAttempts(4)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
        Duration.ofMillis(200), 2.0, 0.5))          // 0.2s,0.4s,0.8s +/- jitter
    .retryOnException(ex -> ex instanceof IOException) // only transient errors
    .build());
Supplier<Resp> call = Retry.decorateSupplier(retry, () -> client.getIdempotent(id));
```

---

### Q50. Explain the Publish-Subscribe (Pub/Sub) pattern.
**Difficulty:** `Basic`
**Category:** Architecture Patterns

#### Answer
Pub/Sub decouples senders (publishers) from receivers (subscribers) via a message broker/topic: publishers emit messages to a topic without knowing who consumes them, and all subscribers to that topic receive them. It enables one-to-many fan-out, async processing, and loose coupling — publishers and subscribers can scale and evolve independently. Implemented with Kafka, RabbitMQ, Redis Pub/Sub, Google Pub/Sub, or an in-process event bus.

#### Code Example / Key Takeaways
```java
// Publisher doesn't know or care who subscribes
eventBus.publish("user.registered", new UserRegistered(userId));

// Independent subscribers each react
@EventListener void sendWelcomeEmail(UserRegistered e){ /* ... */ }
@EventListener void createDefaultSettings(UserRegistered e){ /* ... */ }
@EventListener void trackAnalytics(UserRegistered e){ /* ... */ }
// Add a new subscriber without touching the publisher (Open/Closed at system level).
```

---

### Q51. What is the Service Registry / Discovery pattern?
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
A Service Registry is a database of available service instances (name → healthy host:port). Instances **register** on startup and heartbeat; clients or a router **discover** healthy instances by logical name instead of hardcoding addresses — essential in dynamic/auto-scaling environments. **Client-side discovery**: client queries the registry and load-balances. **Server-side discovery**: a load balancer/router (or k8s Service DNS) resolves it. Tools: Eureka, Consul, etcd, Kubernetes.

#### Code Example / Key Takeaways
```text
Startup:  instance -> REGISTER {name:"orders", host:10.0.0.5:8080, health:/health}
Heartbeat: instance -> renew lease; registry evicts if it stops
Discovery: client -> "give me healthy 'orders' instances" -> [10.0.0.5, 10.0.0.7] -> LB
Kubernetes does this via DNS: http://orders.default.svc.cluster.local
```

---

### Q52. Explain the Cache-Aside (Lazy Loading) pattern.
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
In Cache-Aside the application manages the cache: on read, check the cache; on a **miss**, load from the database, populate the cache, and return. On write, update the DB and **invalidate** (or update) the cache entry. It keeps only requested data cached (efficient) and the cache stays optional (a cache outage just means DB hits). Concerns: stale data (use TTLs), and the thundering-herd on popular misses (use locks/singleflight). Contrast with read-through/write-through where the cache library handles loading.

#### Code Example / Key Takeaways
```java
Product getProduct(String id) {
    Product cached = cache.get(id);
    if (cached != null) return cached;              // hit
    Product p = db.findById(id);                    // miss -> load from DB
    cache.set(id, p, Duration.ofMinutes(10));       // populate with TTL
    return p;
}
void updateProduct(Product p) {
    db.save(p);
    cache.evict(p.id());                            // invalidate on write
}
```

---

### Q53. What is the Layered (N-Tier) architecture pattern?
**Difficulty:** `Basic`
**Category:** Architecture Patterns

#### Answer
Layered architecture organizes code into horizontal layers each with a defined responsibility — commonly **Presentation → Application/Service → Domain/Business → Persistence/Data** — where each layer depends only on the one below. It gives clear separation of concerns, testability, and replaceable layers, at the cost of possible rigidity and pass-through boilerplate. It's the default for many monoliths and each microservice's internal structure.

#### Code Example / Key Takeaways
```text
[ Presentation ]  Controllers / REST / UI
        │  (depends on)
[ Application  ]  Services / use-cases / orchestration
        │
[ Domain      ]  Entities / business rules
        │
[ Persistence ]  Repositories / DAO / DB
Rule: dependencies point DOWNWARD only; upper layers never leak into lower ones.
```

---

### Q54. Explain the Strangler Fig pattern for modernization.
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
Strangler Fig incrementally replaces a legacy system by routing requests through a facade/proxy and peeling off one capability at a time into new services, until the old system is fully "strangled" and retired. It avoids a risky big-bang rewrite: old and new run in parallel, you migrate slice by slice, and you can roll back per capability. Requires a routing layer and careful data decoupling.

#### Code Example / Key Takeaways
```java
// Facade routes each capability to legacy or the new service; flip per feature
@RequestMapping("/**")
Object route(HttpServletRequest req) {
    String path = req.getRequestURI();
    return migrated.contains(capabilityOf(path))
        ? newService.forward(req)      // already extracted
        : legacyMonolith.forward(req); // not yet migrated
}
// Migrate one capability -> verify -> add to `migrated` -> repeat until legacy is gone.
```

---

### Q55. Explain the Bulkhead pattern at the architecture level.
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
Bulkhead isolates resources (thread pools, connection pools, or even separate service instances/clusters) per dependency or tenant, so a failure or overload in one partition can't consume all resources and take down the whole system — like watertight compartments in a ship. Example: separate thread pools per downstream service, or a dedicated instance pool for premium customers. It contains blast radius and preserves capacity for healthy paths.

#### Code Example / Key Takeaways
```java
// Separate bounded pools per dependency -> one can't starve the others
Bulkhead paymentBh = Bulkhead.of("payment",
    BulkheadConfig.custom().maxConcurrentCalls(30).build());
Bulkhead reportBh  = Bulkhead.of("report",
    BulkheadConfig.custom().maxConcurrentCalls(5).build());   // slow dep, capped tight
// A flood of slow report calls exhausts only reportBh, not payment capacity.
```

---

### Q56. Explain the Event-Driven Architecture (EDA) pattern.
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
EDA structures a system around the production, detection, and reaction to **events**. Components communicate by emitting/consuming events (via a broker) rather than direct calls, giving loose coupling, scalability, and real-time responsiveness. Patterns: event notification, event-carried state transfer, event sourcing, CQRS. Trade-offs: eventual consistency, harder debugging/ordering, and the need for idempotent consumers. Great for reactive, high-throughput, integration-heavy systems.

#### Code Example / Key Takeaways
```text
order-service --emit OrderPlaced--► [ broker ] ─► payment-service (charge)
                                                ─► inventory-service (reserve)
                                                ─► notification-service (email)
Loose coupling: producer doesn't know consumers; add consumers freely.
Cost: eventual consistency + idempotency + ordering concerns.
```

---

### Q57. What is the Client-Server vs Peer-to-Peer architecture?
**Difficulty:** `Basic`
**Category:** Architecture Patterns

#### Answer
- **Client-Server**: clients request, a central server provides resources/services. Simple, centralized control/security, but the server is a scaling bottleneck / single point of failure (mitigated by clustering + load balancers). Most web apps.
- **Peer-to-Peer (P2P)**: nodes act as both client and server, sharing resources directly with no central authority. Highly scalable/resilient (no single point), but harder to secure, coordinate, and ensure consistency. Uses: BitTorrent, blockchains, WebRTC media.

#### Code Example / Key Takeaways
```text
Client-Server:   [clients] ──► [ central server(s) ]        (centralized, simple)
Peer-to-Peer:    node ⇄ node ⇄ node   (each is client+server, decentralized)
Pick C-S for control/consistency; P2P for decentralization/resilience.
```

---

### Q58. How do you choose the right architecture/distributed pattern (summary)?
**Difficulty:** `Intermediate`
**Category:** Architecture Patterns

#### Answer
Map the problem to the pattern: distribute traffic → **Load Balancer**; front many services → **Reverse Proxy / API Gateway**; offload cross-cutting concerns per instance → **Sidecar/Service Mesh**; protect against failing dependencies → **Circuit Breaker + Retry + Bulkhead**; scale reads / HA → **Master-Replica**; scale writes/storage → **Sharding**; single coordinator → **Leader Election**; decouple producers/consumers → **Pub/Sub / EDA**; speed reads → **Cache-Aside**; find instances → **Service Registry**; modernize a monolith → **Strangler Fig**; cap usage → **Rate Limiter**. Always justify by the specific quality attribute (scalability, availability, resilience) you're solving for.

#### Code Example / Key Takeaways
```text
Problem                         -> Pattern
distribute incoming traffic     -> Load Balancer
single entry over many services -> Reverse Proxy / API Gateway
per-instance cross-cutting      -> Sidecar / Service Mesh
failing/slow dependency         -> Circuit Breaker + Retry + Bulkhead
scale reads / high availability -> Master-Replica (Leader-Follower)
scale writes & storage          -> Sharding
one coordinator among nodes     -> Leader Election
decouple producer/consumer      -> Pub/Sub / Event-Driven
faster reads                    -> Cache-Aside
locate service instances        -> Service Registry / Discovery
modernize legacy incrementally  -> Strangler Fig
protect from overload/abuse     -> Rate Limiter / Throttling
```

---
