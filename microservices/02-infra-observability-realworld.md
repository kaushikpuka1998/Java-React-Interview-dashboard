# Microservices — Infrastructure, Observability & Real-World Interview Questions (Q36–Q60)

---

### Q36. What is Service Discovery and why is it needed?
**Difficulty:** `Intermediate`
**Category:** Infrastructure

#### Answer
In dynamic environments instances come and go and get ephemeral IPs, so hardcoding addresses breaks. **Service discovery** lets services find each other by logical name. Two models:
- **Client-side**: the client queries a registry (Eureka, Consul) for healthy instances and load-balances itself.
- **Server-side**: the client hits a stable virtual address (load balancer / k8s Service / DNS) that routes to healthy instances.

A registry tracks registrations and health so traffic only goes to live instances.

#### Code Example / Key Takeaways
```java
// Client-side discovery: call by service name, not IP:port
@FeignClient(name = "payment-service")   // resolved via registry (Eureka/Consul)
interface PaymentClient {
    @PostMapping("/charge") ChargeReply charge(@RequestBody ChargeRequest r);
}
// In Kubernetes, server-side discovery is just DNS:
//   http://payment-service.default.svc.cluster.local/charge
```

---

### Q37. Exercise — Service Discovery: register a service and resolve a healthy instance.
**Difficulty:** `Intermediate`
**Category:** Infrastructure

#### Answer
On startup the instance registers (name, host, port, health URL) with the registry and sends heartbeats; the registry evicts instances that stop reporting healthy. Clients resolve the name to the current healthy set and load-balance. Below registers with Eureka and calls another service by name with client-side load balancing.

#### Code Example / Key Takeaways
```yaml
# application.yml — self-register + heartbeat
eureka:
  client: { service-url: { defaultZone: http://eureka:8761/eureka } }
  instance: { lease-renewal-interval-in-seconds: 10 }   # heartbeat
```
```java
@Bean @LoadBalanced                       // client-side LB over discovered instances
RestClient.Builder rc() { return RestClient.builder(); }
// resolves "inventory-service" to a healthy instance each call:
rc().build().get().uri("http://inventory-service/stock/{sku}", sku).retrieve();
```

---

### Q38. What is the API Gateway pattern?
**Difficulty:** `Basic`
**Category:** Infrastructure

#### Answer
An API Gateway is the single entry point between clients and the microservices behind it. It handles cross-cutting concerns so services don't each reimplement them: routing/composition, authentication/authorization, rate limiting, TLS termination, request/response transformation, caching, and observability. It shields clients from internal topology and lets services evolve independently. Risk: it can become a bottleneck or a "god" component, so keep business logic out of it.

#### Code Example / Key Takeaways
```yaml
# Spring Cloud Gateway — route + auth + rate limit at the edge
spring.cloud.gateway.routes:
- id: orders
  uri: lb://order-service
  predicates: [ Path=/api/orders/** ]
  filters:
    - StripPrefix=1
    - name: RequestRateLimiter
      args: { redis-rate-limiter.replenishRate: 100, redis-rate-limiter.burstCapacity: 200 }
```

---

### Q38b. Exercise — API Gateway and Rate Limiting: cap a client to N requests/second.
**Difficulty:** `Intermediate`
**Category:** Infrastructure

#### Answer
Use a token-bucket limiter keyed by client identity (API key/user/IP). Tokens refill at the allowed rate up to a burst cap; a request that finds no token gets HTTP 429. Redis backs the counter so the limit holds across all gateway instances.

#### Code Example / Key Takeaways
```java
// Key the limiter by API key so each client gets its own bucket
@Bean
KeyResolver apiKeyResolver() {
    return exchange -> Mono.just(
        exchange.getRequest().getHeaders().getFirst("X-API-Key"));
}
// replenishRate=10, burstCapacity=20 -> ~10 req/s, bursts to 20; excess -> 429
```

---

### Q39. What is the Backend for Frontend (BFF) pattern?
**Difficulty:** `Intermediate`
**Category:** Infrastructure

#### Answer
A BFF is a dedicated gateway/backend per client type (web, iOS, Android), instead of one general API. Each BFF aggregates and shapes data specifically for its frontend — trimming fields, batching calls, adapting to the device's constraints — so clients make one tailored call instead of many. Benefits: frontend teams own their BFF, faster iteration, and no bloated shared API. Cost: some duplicated aggregation logic across BFFs.

#### Code Example / Key Takeaways
```java
// mobile-bff: one call returns exactly what the mobile screen needs
@GetMapping("/mobile/home")
HomeDto home(Principal user) {
    var profile = userClient.get(user.getName());
    var orders  = orderClient.recent(user.getName(), 3);   // only 3 for small screen
    var promos  = promoClient.forUser(user.getName());
    return HomeDto.compactForMobile(profile, orders, promos); // trimmed payload
}
// web-bff would return richer data for the desktop layout.
```

---

### Q40. What is a Service Mesh and what problems does it solve?
**Difficulty:** `Hard`
**Category:** Infrastructure

#### Answer
A service mesh (Istio, Linkerd) is an infrastructure layer that handles service-to-service communication via **sidecar proxies** deployed next to each service. It moves cross-cutting concerns — mTLS, retries, timeouts, circuit breaking, load balancing, traffic shifting (canary), and telemetry — out of application code and into the platform, configured declaratively. The **data plane** (sidecars) carries traffic; the **control plane** configures them. Benefit: consistent, language-agnostic resilience/security/observability without touching app code; cost: added complexity and per-hop latency.

#### Code Example / Key Takeaways
```yaml
# Istio: enforce mTLS + retries + timeout WITHOUT changing service code
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
spec:
  hosts: [ payment ]
  http:
  - route: [ { destination: { host: payment } } ]
    timeout: 3s
    retries: { attempts: 3, perTryTimeout: 1s, retryOn: 5xx }
```

---

### Q41. What are common Load Balancing Strategies?
**Difficulty:** `Intermediate`
**Category:** Infrastructure

#### Answer
- **Round Robin**: rotate evenly; simple, ignores load.
- **Least Connections**: send to the instance with fewest active requests; good for uneven request durations.
- **Weighted**: bias toward more capable instances (or canary weights).
- **Least Response Time / EWMA**: favor the fastest-responding instances.
- **Consistent Hashing**: map a key (user/session) to the same instance for cache locality/sticky sessions with minimal reshuffling when instances change.

Layer 4 (TCP) vs Layer 7 (HTTP-aware, can route by path/header). Pair with health checks so only healthy instances receive traffic.

#### Code Example / Key Takeaways
```text
Round Robin       -> A,B,C,A,B,C            (even, load-blind)
Least Connections -> pick instance with min in-flight requests
Weighted          -> A:5  B:3  C:2          (capacity/canary bias)
Consistent Hash   -> hash(userId) -> same instance (cache/session affinity)
```

---

### Q42. Exercise — Load Balancing Strategies: implement consistent hashing for sticky routing.
**Difficulty:** `Hard`
**Category:** Infrastructure

#### Answer
Place nodes on a hash ring (with virtual nodes for even spread); route a key to the first node clockwise from the key's hash. Adding/removing a node only remaps keys near it, preserving most affinity — unlike `hash % N`, which remaps almost everything.

#### Code Example / Key Takeaways
```java
class ConsistentHashRing {
    private final TreeMap<Integer, String> ring = new TreeMap<>();
    ConsistentHashRing(List<String> nodes, int vnodes) {
        for (String n : nodes)
            for (int i = 0; i < vnodes; i++)
                ring.put((n + "#" + i).hashCode(), n);   // virtual nodes
    }
    String route(String key) {
        var e = ring.ceilingEntry(key.hashCode());
        return (e != null ? e : ring.firstEntry()).getValue();  // wrap around
    }
}
```

---

### Q43. What is Distributed Tracing and why is it essential?
**Difficulty:** `Intermediate`
**Category:** Observability

#### Answer
A single user request may traverse many services; distributed tracing stitches those hops into one **trace** so you can see the end-to-end path, per-service latency, and where failures occur. A **trace id** is generated at the edge and propagated on every call (via headers like W3C `traceparent`); each hop records a **span** (with parent-child links). Tools: OpenTelemetry (instrumentation) + Jaeger/Zipkin/Tempo (storage/UI). It's essential for debugging latency and failures across service boundaries.

#### Code Example / Key Takeaways
```java
// Context propagation: the trace id flows across services via headers.
// Spring Boot 3 + Micrometer Tracing auto-injects W3C traceparent:
//   traceparent: 00-<trace-id>-<span-id>-01
// All logs/spans for one request share the trace-id, so you can filter by it.
@Observed(name = "checkout")     // creates a span around this method
public Receipt checkout(Cart cart) { ... }
```

---

### Q44. Exercise — Distributed Tracing: propagate a correlation id across two services.
**Difficulty:** `Intermediate`
**Category:** Observability

#### Answer
Generate a correlation/trace id at the entry point if absent, store it in the logging MDC, and forward it on outbound calls. The downstream reads the same header and reuses it, so logs from both services can be joined by one id.

#### Code Example / Key Takeaways
```java
// Inbound filter: adopt or create the id, put it in MDC (shows in every log line)
String cid = Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                     .orElse(UUID.randomUUID().toString());
MDC.put("correlationId", cid);

// Outbound: forward it so the next service continues the same trace
restClient.get().uri("http://inventory/stock/{s}", sku)
    .header("X-Correlation-Id", MDC.get("correlationId"))
    .retrieve();
```

---

### Q45. What are effective Centralized Logging strategies?
**Difficulty:** `Intermediate`
**Category:** Observability

#### Answer
With many ephemeral instances, `ssh`-into-a-box logging is impossible. Ship all logs to a central store (ELK/EFK, Loki, Splunk). Best practices: **structured JSON logs** (queryable fields, not free text), a **correlation/trace id** on every line, consistent levels, no secrets/PII, and context fields (service, version, env). Logs, metrics, and traces are the "three pillars" — link them by trace id. Sample or rate-limit noisy logs to control cost.

#### Code Example / Key Takeaways
```java
// Structured log with correlation id -> searchable in Kibana/Loki by traceId
log.atInfo()
   .addKeyValue("event", "order.placed")
   .addKeyValue("orderId", order.getId())
   .addKeyValue("traceId", MDC.get("correlationId"))
   .addKeyValue("amountCents", order.getTotalCents())
   .log("Order placed");
// -> {"level":"INFO","event":"order.placed","orderId":"A1","traceId":"...", ...}
```

---

### Q46. How do you approach Metrics, Health Checks, and Monitoring?
**Difficulty:** `Intermediate`
**Category:** Observability

#### Answer
- **Metrics**: emit time-series (request rate, error rate, latency percentiles, saturation) — the RED (Rate/Errors/Duration) and USE methods — via Prometheus/Micrometer, visualized in Grafana, with alerting on SLOs.
- **Health checks**: expose **liveness** (is the process healthy? restart if not) and **readiness** (can it serve traffic? pull from LB if not) endpoints so orchestrators route correctly.
- **Monitoring/alerting**: alert on symptoms users feel (error rate, latency), not just resources.

#### Code Example / Key Takeaways
```java
// Micrometer metrics + Spring Boot Actuator health probes
meterRegistry.counter("orders.placed", "channel", "web").increment();
Timer.builder("checkout.latency").publishPercentiles(0.5, 0.95, 0.99)
     .register(meterRegistry).record(() -> checkout(cart));
// Actuator exposes /actuator/health/liveness and /actuator/health/readiness
// which Kubernetes probes hit to restart or de-route the pod.
```

---

### Q47. Exercise — Metrics and Monitoring: expose a custom business metric and alert on it.
**Difficulty:** `Intermediate`
**Category:** Observability

#### Answer
Instrument the code with a counter/gauge, expose it on `/actuator/prometheus`, scrape with Prometheus, and write an alert rule on a rate/threshold. Below tracks failed payments and alerts when the failure rate is high.

#### Code Example / Key Takeaways
```java
meterRegistry.counter("payments.total", "result", result).increment();
```
```yaml
# Prometheus alert: fire when >5% of payments fail over 5 min
- alert: HighPaymentFailureRate
  expr: |
    sum(rate(payments_total{result="failed"}[5m]))
      / sum(rate(payments_total[5m])) > 0.05
  for: 5m
  labels: { severity: page }
```

---

### Q48. How do you Test Microservices effectively?
**Difficulty:** `Hard`
**Category:** Testing

#### Answer
Use the **test pyramid** adapted for distribution:
- **Unit**: fast, isolated logic.
- **Integration**: a service with its real DB/broker via **Testcontainers**.
- **Contract tests** (Pact/Spring Cloud Contract): verify provider and consumer agree on the API without full end-to-end runs — catch breaking changes early.
- **Component**: one service in isolation with dependencies stubbed.
- **End-to-end**: a few critical happy paths only (slow, brittle).

Also test resilience (chaos/fault injection) and idempotency. Favor contract + integration over sprawling E2E.

#### Code Example / Key Takeaways
```java
// Integration test with a REAL database via Testcontainers
@Testcontainers @SpringBootTest
class OrderRepoTest {
    @Container static PostgreSQLContainer<?> db =
        new PostgreSQLContainer<>("postgres:16");
    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", db::getJdbcUrl);
    }
    @Test void savesAndReadsOrder() { /* real SQL, no mocks */ }
}
```

---

### Q49. Describe Netflix's microservices architecture and its key lessons.
**Difficulty:** `Intermediate`
**Category:** Real-World

#### Answer
Netflix pioneered large-scale microservices on AWS after a monolith DB corruption outage. Key ideas: hundreds of services behind an edge gateway (Zuul), client-side discovery (Eureka), resilience via Hystrix (circuit breakers/bulkheads — the origin of these patterns at scale), and **Chaos Engineering** (Chaos Monkey randomly kills instances in production to prove resilience). Lessons: design for failure as normal, isolate faults, automate everything, and embrace eventual consistency. Many tools became open source (later superseded by Resilience4j, Spring Cloud, service meshes).

#### Code Example / Key Takeaways
```text
Client -> Zuul (edge gateway) -> Eureka (discovery) -> 100s of services
Resilience: Hystrix circuit breakers + bulkheads + fallbacks
Proof:      Chaos Monkey kills prod instances to validate resilience
Takeaway:   assume failure is constant; automate recovery, not heroics
```

---

### Q50. What is Uber's Domain-Oriented Microservices Architecture (DOMA)?
**Difficulty:** `Hard`
**Category:** Real-World

#### Answer
After thousands of microservices caused sprawl and cognitive overload, Uber grouped related services into **domains** with clear boundaries, and fronted each domain with a **gateway** so consumers depend on the domain interface, not individual services. Layered dependencies flow one direction (no cycles), and extension points allow customization without forking. DOMA is essentially applying DDD bounded contexts and layering to tame microservice proliferation — balancing team autonomy with system comprehensibility.

#### Code Example / Key Takeaways
```text
Consumers ─▶ Domain Gateway ─▶ [ services within one domain ]
Principles:
  - Domains = bounded contexts (grouped related services)
  - Gateway per domain hides internal services
  - One-directional layered dependencies (no cycles)
  - Extension points instead of forking
Goal: keep microservice benefits without the "too many services" chaos
```

---

### Q51. What do Amazon's "Two-Pizza Teams" and service ownership teach about microservices?
**Difficulty:** `Intermediate`
**Category:** Real-World

#### Answer
Amazon organizes around small autonomous teams (small enough to feed with two pizzas) that **own a service end-to-end** — "you build it, you run it." Each team owns design, deploy, on-call, and iteration for its service, aligning team boundaries with service boundaries (Conway's Law used deliberately). This maximizes autonomy and speed and creates strong accountability (the team feels its own operational pain). The lesson: microservices are as much an organizational strategy as a technical one.

#### Code Example / Key Takeaways
```text
Conway's Law: system design mirrors org communication structure.
Amazon:  small team  ==  one service  ==  full ownership (build+run+on-call)
Effect:  loose coupling between teams -> independent, fast deployment
Caution: microservices without matching team ownership = distributed monolith
```

---

### Q52. How do you approach a Monolith-to-Microservices migration?
**Difficulty:** `Hard`
**Category:** Migration

#### Answer
Migrate incrementally, never big-bang. The **Strangler Fig** pattern routes traffic through a facade/proxy and peels off capabilities one at a time into new services until the monolith is "strangled." Steps: identify bounded contexts, extract the highest-value/lowest-risk capability first, split its data (the hardest part — decouple the shared DB with anti-corruption layers and events), run old and new in parallel, verify, then cut over. Keep the monolith the source of truth until each slice is proven. Don't migrate if the monolith isn't actually the bottleneck.

#### Code Example / Key Takeaways
```java
// Strangler Fig: facade routes each capability to old or new implementation
@GetMapping("/orders/**")
Object orders(HttpServletRequest req) {
    return featureFlags.isEnabled("orders-microservice")
        ? newOrderService.handle(req)     // extracted slice
        : legacyMonolith.forward(req);    // not yet migrated
}
// Flip the flag per capability once the new service is verified.
```

---

### Q53. What are the most common Microservices interview questions to expect?
**Difficulty:** `Basic`
**Category:** Interview Prep

#### Answer
Be ready for: When do microservices make sense vs a monolith? How do you handle data consistency without distributed transactions (Saga/outbox)? How do services communicate (sync vs async)? How do you prevent cascading failures (timeout/retry/circuit breaker/bulkhead)? How do you find services (discovery)? How do you secure service-to-service calls? How do you trace/debug across services? How do you version and deploy independently? How do you decompose a monolith? What are the downsides/anti-patterns? Always tie answers to trade-offs and a concrete example.

#### Code Example / Key Takeaways
```text
Cheat-sheet mapping problem -> pattern:
  cross-service consistency  -> Saga + Transactional Outbox
  dual-write                 -> Outbox + CDC
  slow/failing dependency    -> Timeout + Circuit Breaker + Bulkhead + Fallback
  find instances             -> Service Discovery / k8s DNS
  cross-service query        -> API Composition / CQRS read model
  debug across services      -> Distributed Tracing (trace id)
  decompose monolith         -> Strangler Fig + bounded contexts
```

---

### Q54. What are the major Microservices Anti-Patterns?
**Difficulty:** `Hard`
**Category:** Anti-Patterns

#### Answer
- **Distributed Monolith**: services so tightly coupled they must deploy together — worst of both worlds.
- **Shared Database**: multiple services on one schema, re-coupling them.
- **Nano-services / too fine-grained**: excessive chatter and ops overhead.
- **Chatty communication**: many fine-grained sync calls per request (latency, cascading failure).
- **No API versioning**: breaking consumers on change.
- **Synchronous everywhere**: coupling availability; no async where it fits.
- **Ignoring the data problem**: assuming distributed ACID exists.
- **Microservices without the org/automation** to run them (premature adoption).

#### Code Example / Key Takeaways
```text
Smell -> Fix
distributed monolith   -> define bounded contexts; async events; independent deploy
shared database        -> database-per-service; integrate via API/events
chatty sync calls      -> aggregate (BFF/API composition); go async where possible
no versioning          -> /v1 URIs, backward-compatible schema evolution
sync everywhere        -> events/queues for commands; sync only for needed queries
```

---

### Q55. How do you decide the right size/boundaries for a microservice?
**Difficulty:** `Hard`
**Category:** Design

#### Answer
Size by **business capability / bounded context** (DDD), not by lines of code. A good service owns one cohesive capability and its data, changes for one reason (high cohesion), and can be developed/deployed by one team independently (loose coupling). Signs a boundary is wrong: two services always change together (merge them), or one service does unrelated things (split it), or they need chatty sync calls / shared tables (boundary cuts through a transaction). Start coarser and split when real pain (scaling, team friction, deploy coupling) appears — premature decomposition is costly.

#### Code Example / Key Takeaways
```text
Good boundary checklist:
  [ ] owns one business capability + its own data
  [ ] one team can build & deploy it independently
  [ ] changes for a single reason (high cohesion)
  [ ] no shared tables / no chatty cross-service transactions
Heuristic: if two services must deploy together, they're really one service.
```

---
