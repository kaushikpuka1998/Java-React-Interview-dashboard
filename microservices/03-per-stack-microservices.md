# Microservices — Per-Stack (Java / Node / SQL / React) Interview Questions (Q56–Q80)

---

### Q56. How do you build a microservice with Spring Boot and Spring Cloud?
**Difficulty:** `Intermediate`
**Category:** Java Side

#### Answer
Spring Boot gives you an embedded server, auto-configuration, and Actuator (health/metrics) so each service is an independently deployable JAR. **Spring Cloud** adds the distributed-systems glue: config server (externalized config), discovery client (Eureka/Consul), declarative HTTP clients (OpenFeign), client-side load balancing, gateway, and Resilience4j integration. A typical service: expose REST controllers, register with discovery, read config centrally, and protect outbound calls with circuit breakers.

#### Code Example / Key Takeaways
```java
@SpringBootApplication
@EnableDiscoveryClient                 // register with Eureka/Consul
public class OrderServiceApp {
    public static void main(String[] a) { SpringApplication.run(OrderServiceApp.class, a); }
}
// build.gradle: spring-boot-starter-web, -actuator,
//   spring-cloud-starter-netflix-eureka-client, -openfeign, resilience4j-spring-boot3
```

---

### Q57. How do you call another service in Java using OpenFeign with resilience?
**Difficulty:** `Intermediate`
**Category:** Java Side

#### Answer
OpenFeign turns an interface into an HTTP client resolved via service discovery. Wrap it with Resilience4j for timeouts, retries, and a circuit breaker with a fallback so a failing downstream degrades gracefully instead of cascading.

#### Code Example / Key Takeaways
```java
@FeignClient(name = "payment-service", fallback = PaymentFallback.class)
interface PaymentClient {
    @PostMapping("/charge") ChargeReply charge(@RequestBody ChargeRequest r);
}
@Component
class PaymentFallback implements PaymentClient {           // used when circuit open
    public ChargeReply charge(ChargeRequest r) { return ChargeReply.declined(); }
}
```
```yaml
resilience4j.circuitbreaker.instances.payment-service:
  failureRateThreshold: 50
  waitDurationInOpenState: 10s
feign.circuitbreaker.enabled: true
```

---

### Q58. How do you implement asynchronous messaging between Java services with Kafka?
**Difficulty:** `Intermediate`
**Category:** Java Side

#### Answer
Use `spring-kafka`: a `KafkaTemplate` produces events (partition-keyed for ordering) and `@KafkaListener` consumes them within a consumer group. Serialize events as JSON/Avro with a schema registry for evolution. Make consumers idempotent (at-least-once delivery) and configure manual ack + retry/DLQ for poison messages.

#### Code Example / Key Takeaways
```java
// Producer — key by orderId keeps a given order's events ordered
kafkaTemplate.send("order.events", order.getId(), new OrderPlaced(order));

// Consumer — idempotent, manual ack, DLQ on repeated failure
@KafkaListener(topics = "order.events", groupId = "inventory")
public void on(OrderPlaced e, Acknowledgment ack) {
    if (processed.add(e.eventId())) inventory.reserve(e);  // dedupe
    ack.acknowledge();
}
// @RetryableTopic(...) auto-creates retry + DLT topics for failures
```

---

### Q59. How do you externalize configuration for Java microservices across environments?
**Difficulty:** `Basic`
**Category:** Java Side

#### Answer
Use Spring Cloud Config (or k8s ConfigMaps/Secrets) so one build runs everywhere with environment-specific values injected at runtime. Services fetch config on startup (and can hot-refresh with `@RefreshScope` + Actuator `/refresh`). Keep secrets in Vault, not plain config. Profiles (`dev`, `prod`) select the right property set.

#### Code Example / Key Takeaways
```yaml
# bootstrap.yml — pull config from the central config server by app name + profile
spring:
  application: { name: order-service }
  cloud:
    config: { uri: http://config-server:8888, profile: ${ENV:dev} }
```
```java
@RefreshScope                      // picks up config changes without restart
@Component class RatesConfig { @Value("${fx.rate}") BigDecimal rate; }
```

---

### Q60. How do you build a microservice in Node.js and call another service?
**Difficulty:** `Intermediate`
**Category:** Node Side

#### Answer
A Node microservice is typically an Express/Fastify app exposing REST/JSON, run as its own process/container. For inter-service calls use `fetch`/axios/`undici` with an **AbortController timeout**, retries with backoff for idempotent calls, and a circuit breaker (e.g. `opossum`) with a fallback. Resolve peers by DNS/service name (k8s) rather than hardcoded IPs.

#### Code Example / Key Takeaways
```js
import CircuitBreaker from 'opossum'

async function charge(order) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 3000)          // bound the call
  try {
    const res = await fetch('http://payment-service/charge', {
      method: 'POST', signal: ac.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(order),
    })
    if (!res.ok) throw new Error(`payment ${res.status}`)
    return res.json()
  } finally { clearTimeout(t) }
}
const breaker = new CircuitBreaker(charge, { timeout: 3000, errorThresholdPercentage: 50 })
breaker.fallback(() => ({ status: 'declined' }))        // graceful degradation
```

---

### Q61. How do you implement async processing in Node with a message queue?
**Difficulty:** `Intermediate`
**Category:** Node Side

#### Answer
Offload slow/side-effect work to a broker so the request returns fast. With Redis-backed **BullMQ** you enqueue a job and a separate worker process consumes it with retries, backoff, and a dead-letter equivalent (failed set). For event streaming use **KafkaJS** with consumer groups. Keep handlers idempotent since delivery is at-least-once.

#### Code Example / Key Takeaways
```js
import { Queue, Worker } from 'bullmq'
const emails = new Queue('emails', { connection })

// producer: return immediately, process later
await emails.add('welcome', { userId }, {
  attempts: 5, backoff: { type: 'exponential', delay: 1000 },
})

// worker: separate process, retried with backoff, idempotent
new Worker('emails', async job => {
  if (await alreadySent(job.data.userId)) return          // dedupe
  await sendWelcome(job.data.userId)
}, { connection })
```

---

### Q62. How do you handle authentication and correlation IDs across Node microservices?
**Difficulty:** `Intermediate`
**Category:** Node Side

#### Answer
Validate a JWT at the gateway/service (verify signature, issuer, audience, expiry) and forward the user context downstream. Generate or adopt a correlation id per request, attach it to logs (structured, e.g. `pino`), and forward it on outbound calls so a request can be traced across services.

#### Code Example / Key Takeaways
```js
// middleware: adopt/create correlation id + verify JWT, forward both downstream
app.use((req, res, next) => {
  req.cid = req.headers['x-correlation-id'] ?? crypto.randomUUID()
  res.setHeader('x-correlation-id', req.cid)
  req.user = jwt.verify(bearer(req), publicKey, { issuer, audience })
  next()
})
// outbound call reuses them:
fetch(url, { headers: { 'x-correlation-id': req.cid, authorization: req.headers.authorization } })
```

---

### Q63. How do you design databases for microservices (schema-per-service) in SQL?
**Difficulty:** `Intermediate`
**Category:** SQL Side

#### Answer
Give each service its own schema/database with isolated credentials; no service reads another's tables directly. This means you lose cross-service JOINs and foreign keys across boundaries — instead reference other aggregates by **id only**, and build read models via events (CQRS) when you need to display joined data. Each service migrates its own schema independently (Flyway/Liquibase).

#### Code Example / Key Takeaways
```sql
-- order-service DB: reference customer by ID only, no FK to another service's table
CREATE TABLE orders (
  id           UUID PRIMARY KEY,
  customer_id  UUID NOT NULL,        -- owned by customer-service; no cross-DB FK
  total_cents  BIGINT NOT NULL,
  status       TEXT   NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
-- To show "orders with customer name", the order-service keeps a local
-- read model updated from customer-service events (no cross-service JOIN).
```

---

### Q64. How do you implement the Transactional Outbox table in SQL?
**Difficulty:** `Hard`
**Category:** SQL Side

#### Answer
Add an `outbox` table written in the *same transaction* as the business change. A relay/CDC process reads unpublished rows, emits them to the broker, and marks them published. This makes the DB write and the intent-to-publish atomic, solving the dual-write problem. Index on `published` for the poller; retention job purges old published rows.

#### Code Example / Key Takeaways
```sql
CREATE TABLE outbox (
  id            BIGSERIAL PRIMARY KEY,
  aggregate_id  UUID        NOT NULL,
  type          TEXT        NOT NULL,      -- e.g. 'OrderPlaced'
  payload       JSONB       NOT NULL,
  published     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_outbox_unpublished ON outbox (id) WHERE published = FALSE;

BEGIN;
  INSERT INTO orders (id, customer_id, total_cents, status) VALUES (...);
  INSERT INTO outbox (aggregate_id, type, payload)
    VALUES ('...', 'OrderPlaced', '{"orderId":"..."}');   -- same tx
COMMIT;   -- CDC/relay publishes the outbox row after commit
```

---

### Q65. How do you enforce idempotency at the database level in SQL?
**Difficulty:** `Intermediate`
**Category:** SQL Side

#### Answer
Store an **idempotency key** with a unique constraint so a retried request can't create duplicate side-effects. On the first call you insert the key (and result); a retry hits the unique violation and you return the stored result instead of re-executing. This makes at-least-once delivery / client retries safe for non-idempotent operations like payments.

#### Code Example / Key Takeaways
```sql
CREATE TABLE processed_requests (
  idempotency_key TEXT PRIMARY KEY,       -- client-supplied, unique
  response        JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
-- First call inserts; a retry conflicts and returns the SAME response.
INSERT INTO processed_requests (idempotency_key, response)
VALUES ($1, $2)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING response;   -- empty rowset => already processed, fetch stored response
```

---

### Q66. How does a React frontend consume a microservices backend without coupling to every service?
**Difficulty:** `Intermediate`
**Category:** React Side

#### Answer
The frontend should talk to **one aggregation layer** — an API Gateway or a BFF — not directly to dozens of services, so it isn't coupled to internal topology, CORS sprawl, or N round-trips. The BFF composes/trims data for the screen. In React, centralize the base URL and auth in one API client and use a data-fetching library (React Query/SWR) for caching, retries, and loading/error states.

#### Code Example / Key Takeaways
```jsx
// One client points at the gateway/BFF, not individual services
const api = axios.create({ baseURL: import.meta.env.VITE_BFF_URL })
api.interceptors.request.use(c => {
  c.headers.Authorization = `Bearer ${getToken()}`
  return c
})
// React Query handles caching/retries/loading so components stay simple
function useHome() {
  return useQuery({ queryKey: ['home'], queryFn: () => api.get('/mobile/home').then(r => r.data) })
}
```

---

### Q67. How do you handle partial failures and loading states in React with a microservices backend?
**Difficulty:** `Intermediate`
**Category:** React Side

#### Answer
Because downstream services fail independently, a page may have some sections load and others error. Design the UI for **graceful degradation**: render each region independently, show per-section skeletons/errors (not one all-or-nothing spinner), and use error boundaries plus React Query's `retry`/`isError` to recover or show fallbacks. This mirrors backend resilience on the client.

#### Code Example / Key Takeaways
```jsx
function ProductPage({ id }) {
  const product = useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id) })
  const reviews = useQuery({ queryKey: ['reviews', id], queryFn: () => getReviews(id), retry: 2 })

  if (product.isLoading) return <Skeleton />
  if (product.isError)  return <Error retry={product.refetch} />   // critical section
  return (
    <>
      <ProductInfo data={product.data} />
      {reviews.isError                       // optional section degrades, page still renders
        ? <Notice>Reviews unavailable right now</Notice>
        : <Reviews data={reviews.data} />}
    </>
  )
}
```

---

### Q68. What are Micro-Frontends and how do they relate to microservices?
**Difficulty:** `Hard`
**Category:** React Side

#### Answer
Micro-frontends extend the microservices idea to the UI: split a large frontend into independently developed/deployed pieces, each owned by the team that owns the corresponding backend service (vertical, full-stack ownership). Composition can be at build time, run time (Webpack **Module Federation**), or via web components. Benefits: independent deploys and team autonomy. Costs: shared-dependency duplication, styling/consistency challenges, and orchestration complexity — only worth it at large org scale.

#### Code Example / Key Takeaways
```js
// Module Federation: the shell loads a remote micro-frontend at runtime
new ModuleFederationPlugin({
  name: 'shell',
  remotes: { checkout: 'checkout@https://checkout.example.com/remoteEntry.js' },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
})
// const Checkout = React.lazy(() => import('checkout/Cart'))  // owned by another team
```

---

### Q69. How do you keep API contracts stable between a React frontend and evolving services?
**Difficulty:** `Intermediate`
**Category:** React Side

#### Answer
Version the API (`/v1`) and evolve backward-compatibly (add fields, don't remove/rename). Generate a typed client from the OpenAPI/GraphQL schema so breaking changes surface at compile time, and use **consumer-driven contract tests** (Pact) so the frontend's expectations are verified against providers in CI. The BFF also absorbs shape changes so screens don't break when an internal service changes.

#### Code Example / Key Takeaways
```ts
// Types generated from the backend OpenAPI schema — breaking changes fail the build
import type { paths } from './generated/api'
type Home = paths['/mobile/home']['get']['responses']['200']['content']['application/json']

async function getHome(): Promise<Home> {
  const r = await api.get('/mobile/home'); return r.data   // shape guaranteed by types
}
```

---

### Q70. When should you NOT use microservices?
**Difficulty:** `Intermediate`
**Category:** Design

#### Answer
Avoid microservices when: the domain/team is small (a modular monolith is faster and simpler), boundaries aren't yet understood (premature splits are expensive to undo), you lack the operational maturity (CI/CD, monitoring, on-call, infra automation) to run many services, or the app isn't hitting scaling/team-friction limits. Microservices trade in-process simplicity for network complexity, eventual consistency, and ops overhead — only worthwhile when their benefits (independent scaling/deploy, team autonomy) outweigh that. Start monolith-first, extract when pain is real.

#### Code Example / Key Takeaways
```text
Prefer a (modular) monolith when:
  - small team / early product, boundaries still shifting
  - no mature CI/CD, monitoring, tracing, on-call
  - no scaling or deploy-coupling pain yet
Rule: don't pay distributed-systems tax until a real problem demands it.
Modular monolith first -> extract services along proven seams later.
```

---
