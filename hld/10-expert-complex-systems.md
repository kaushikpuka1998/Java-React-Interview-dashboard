# HLD — Expert & Complex System Design Interview Questions (Q286–Q300)

*Each answer includes a top-to-bottom architecture flow (and Back-of-the-Envelope estimation where it applies).*

---

### Q286. Design an entire cloud platform.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
A cloud platform offers **compute** (VMs/containers/serverless), **storage** (object/block/file), **networking** (VPC, LB, DNS), **databases**, and **control-plane** services (IAM, billing, monitoring, provisioning API). Core: a **control plane** (APIs, orchestration, scheduling, state) + a **data plane** (VMs/storage/network serving workloads), atop physical **regions/AZs** with virtualization, SDN, and distributed storage. **Challenges**: multi-tenancy + isolation, scale, scheduling, metering/billing, IAM/security, HA, unified API over heterogeneous hardware.

#### Code Example / Key Takeaways
```text
── LAYERS (top → bottom) ──
   ┌──────────────┐
   │Managed Svcs  │  compute / storage / DB / networking APIs
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Control Plane │  APIs, IAM, scheduler, billing, provisioning, state
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Data Plane    │  actual VMs, storage, network serving workloads
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Virtualization│  hypervisor + SDN + distributed storage
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Physical      │  regions / AZs / hardware
   └──────────────┘
Challenges: multi-tenant isolation, scheduling, metering, IAM, HA.
```

---

### Q287. Design an AWS-like object storage service (S3).
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Store immutable **objects** in **buckets**, keyed via a REST API. A **metadata service** (bucket/key → chunk locations, size, checksum, ACL, version) + a **storage layer** that chunks objects and **erasure-codes/replicates** across nodes/AZs for 11-nines durability. Versioning, lifecycle tiering, read-after-write consistency. **Challenges**: durability (erasure coding + cross-AZ), metadata scale/consistency, throughput, multipart uploads, tiering. CDN for hot content.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Durability: 11 nines via erasure coding (e.g. 10 data + 4 parity) across AZs
Scale:    exabytes, millions of req/sec → partition metadata, distribute chunks

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  PUT/GET bucket/key (REST)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Metadata Svc  │  bucket/key → chunk locations, checksum, ACL, version
   │(partitioned) │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Storage Layer │  object → chunks → erasure-coded across AZs (11 nines)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │     CDN      │  (hot objects); versioning + lifecycle tiering
   └──────────────┘
```

---

### Q288. Design an AWS-like message queue (SQS).
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
A managed, horizontally-scalable queue: producers send (stored **redundantly across AZs**); consumers **poll** with a **visibility timeout** (message hidden while processing; not deleted in time → reappears → at-least-once). Delete on success. Standard (best-effort order) vs FIFO (ordered), DLQs, delays, long polling. **Challenges**: visibility timeout redelivery, scaling (partition queues), durability (multi-AZ), ordering vs throughput, dedup. Idempotent consumers.

#### Code Example / Key Takeaways
```text
── VISIBILITY TIMEOUT (top → bottom) ──
   ┌──────────────┐
   │  Producer    │  send → stored redundantly (multi-AZ)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Queue       │  (partitioned, replicated)
   └──────┬───────┘
     receive → message HIDDEN (visibility timeout)
          ▼
   ┌──────────────┐
   │  Consumer    │  process
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ delete     ▼ not deleted in time
 ┌──────┐   ┌──────────────┐
 │ done │   │ REAPPEARS    │  → redelivery (at-least-once)
 └──────┘   └──────────────┘
Standard vs FIFO; DLQ; delays; long poll. Idempotent consumers.
```

---

### Q289. Design a Kubernetes-like orchestration platform.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
A **control plane** (API server, **etcd** for state, **scheduler** placing pods, **controllers** reconciling desired vs actual) + **worker nodes** (kubelet + runtime). Users declare desired state; controllers continuously **reconcile** (self-healing: restart/reschedule failed pods). Add discovery, LB, autoscaling, rolling deploys. **Challenges**: reconciliation loop, scheduling (bin-packing + constraints), etcd consistency/HA (source of truth), self-healing, networking (CNI), scale (thousands of nodes).

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌────────────────────────────────────┐
   │ CONTROL PLANE                       │
   │  ┌────────┐ ┌──────┐ ┌───────────┐  │
   │  │API     │ │etcd  │ │Scheduler  │  │
   │  │Server  │ │(state)│ │(place pod)│  │
   │  └────────┘ └──────┘ └───────────┘  │
   │  ┌──────────────────────────────┐   │
   │  │Controllers (reconcile:        │   │
   │  │ desired vs actual, self-heal) │   │
   │  └──────────────────────────────┘   │
   └──────────────┬─────────────────────┘
          ▼ (schedule pods)
   ┌──────────────────────────────────┐
   │ WORKER NODES (kubelet + runtime)  │
   │  ┌──────┐ ┌──────┐ ┌──────┐       │
   │  │ Pod  │ │ Pod  │ │ Pod  │       │
   │  └──────┘ └──────┘ └──────┘       │
   └──────────────────────────────────┘
Declarative desired state → continuous reconciliation. etcd = source of truth.
```

---

### Q290. Design a container scheduling system.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
The **scheduler** assigns pending containers to nodes by resource requests (CPU/memory), constraints (affinity/anti-affinity, taints, node selectors), and goals (bin-packing for utilization, spreading for HA). It **filters** feasible nodes then **scores** them, picking the best. Handle priorities/preemption, gang scheduling, reschedule on failure. **Challenges**: placement at scale, constraints, bin-pack vs spread, fairness/preemption, hotspots, decision throughput. An online constrained-optimization problem.

#### Code Example / Key Takeaways
```text
── SCHEDULING PIPELINE (top → bottom) ──
   ┌──────────────┐
   │Pending       │  container (needs 2 CPU, 4 GB, affinity=zone-a)
   │Container     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │1. FILTER     │  feasible nodes (resources, affinity, taints)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │2. SCORE      │  bin-pack (utilization) vs spread (HA)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │3. ASSIGN best│  (+ priorities/preemption, gang scheduling)
   └──────────────┘
Reschedule on node failure. Fast decisions at scale (1000s nodes × pods).
```

---

### Q291. Design a serverless computing platform.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Run functions on demand without managing servers: an **event source** (HTTP/queue/schedule) triggers a function; the platform **provisions an isolated env** (microVM like Firecracker), runs the code, tears it down — scaling to zero and up to thousands, billing per invocation/duration. Keep **warm** envs to reduce **cold starts**. **Challenges**: cold-start latency (pre-warming, lightweight microVMs), secure fast isolation, per-request autoscaling, statelessness, execution limits, multi-tenant security.

#### Code Example / Key Takeaways
```text
── FLOW (top → bottom) ──
   ┌──────────────┐
   │Event Source  │  HTTP / queue / cron
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Provision env │  warm pool? reuse : cold start (microVM/Firecracker)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Run function  │  (stateless; externalize state)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Tear down     │  scale to zero; bill per invocation/duration
   └──────────────┘
Warm pools cut cold starts. Scale 0 → thousands. Secure isolation (microVM).
```

---

### Q292. Design a multi-tenant SaaS platform.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Serve many tenants from shared infra while keeping them isolated. **Isolation models**: shared DB + `tenant_id` (cheapest, must filter everywhere), schema-per-tenant, or DB-per-tenant (strongest, costlier). Per-tenant auth, config, quotas, billing/metering, customization. **Challenges**: tenant isolation (data leakage = catastrophic — enforce `tenant_id` every query), noisy-neighbor (quotas/rate limits), per-tenant scaling, customization vs shared code, onboarding, metering/billing.

#### Code Example / Key Takeaways
```text
── ISOLATION MODELS (cost ↑ / isolation ↑) ──
   ┌──────────────────────────────────────┐
   │ Shared DB + tenant_id (cheap; MUST     │
   │   filter every query — leakage risk)   │
   ├──────────────────────────────────────┤
   │ Schema-per-tenant (medium)             │
   ├──────────────────────────────────────┤
   │ DB-per-tenant (strongest, costliest) ✓ │
   └──────────────────────────────────────┘
Per-tenant: auth, config, quotas, metering/billing.
Every request scoped to tenant. Noisy-neighbor → quotas/bulkheads.
```

---

### Q293. Design tenant isolation architecture.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Ensure a tenant can never access another's data or starve resources. **Data isolation**: `tenant_id` on every row + row-level security, or separate schemas/DBs. **Compute isolation**: per-tenant quotas, rate limits, dedicated pools/**bulkheads**. **Security**: scope every request to its tenant (from the auth token), audit. **Challenges**: zero cross-tenant access (defense in depth — RLS + app checks), noisy-neighbor, isolation vs cost, per-tenant observability.

#### Code Example / Key Takeaways
```text
── DEFENSE IN DEPTH (top → bottom) ──
   ┌──────────────┐
   │Request       │  → extract tenant_id from auth token
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │App Layer     │  scope every query to tenant_id
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Row-Level     │  DB enforces tenant_id filter (RLS)
   │Security      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Compute       │  per-tenant quotas + bulkheads (no noisy neighbor)
   │Isolation     │
   └──────────────┘
Data leakage = catastrophic → RLS + app checks + audit.
```

---

### Q294. Design an enterprise IAM platform.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Manage **identities** (users, service accounts), **authentication** (passwords, MFA, SSO via SAML/OIDC, federation), and **authorization** (RBAC/ABAC). Core: identity store, auth service (issues JWT/OAuth2 tokens), policy engine, admin/audit tooling. SSO across apps, SCIM provisioning, session management. **Challenges**: secure credential storage, low-latency authz (cache), SSO/federation complexity, fine-grained perms, auditability, HA (auth is critical-path), token revocation.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  User / App  │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Auth Service  │  passwords/MFA/SSO (SAML/OIDC) → issue JWT
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Identity  ││Policy Engine │  RBAC/ABAC (cache decisions)
 │Store     ││(authz)       │
 └──────────┘└──────────────┘
          ▼
   ┌──────────────┐
   │Audit + Session│  SCIM provisioning; token revocation
   │Management     │
   └──────────────┘
HA critical (auth on every request). Low-latency authz via cache.
```

---

### Q295. Design OAuth2/OpenID Connect authentication architecture.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
**OAuth2** delegates authorization: a client gets an **access token** to call APIs on a user's behalf without seeing credentials (Authorization Code + PKCE for web/mobile; client-credentials for S2S). **OIDC** adds an **ID token** (JWT) for authentication (who the user is). Components: authorization server, resource server, client. Short-lived + refreshable tokens. **Challenges**: secure flows (Auth Code + PKCE, avoid implicit), token validation (signature/issuer/audience/expiry), refresh + revocation, scopes, token leakage/CSRF.

#### Code Example / Key Takeaways
```text
── AUTHORIZATION CODE + PKCE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  (1) redirect to auth server (+ PKCE challenge)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Auth Server   │  (2) user logs in → returns auth CODE
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Client      │  (3) exchange code + PKCE verifier → tokens
   └──────┬───────┘
     access token (OAuth2) + ID token (OIDC, JWT)
          ▼
   ┌──────────────┐
   │Resource Server│  (4) validate token (sig/issuer/aud/expiry) → serve
   └──────────────┘
Short-lived + refresh + revocation. Avoid implicit flow.
```

---

### Q296. Design RBAC + ABAC authorization architecture.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
**RBAC**: users → **roles** → **permissions** (coarse, scalable — "admin can delete"). **ABAC**: decisions from **attributes** of user/resource/action/context ("edit if user.dept == doc.dept and business hours") — fine-grained, dynamic, complex. Combine: RBAC for broad access + ABAC for fine rules via a central **policy engine** (OPA); cache decisions. **Challenges**: low-latency eval at scale (cache + local), ABAC complexity, auditability, permission sprawl, policy propagation.

#### Code Example / Key Takeaways
```text
── DECISION FLOW (top → bottom) ──
   ┌──────────────┐
   │Request       │  user + action + resource + context
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Policy Engine │  (OPA)
   │  RBAC: user→roles→permissions (coarse)
   │  ABAC: attributes (user.dept == doc.dept, time...)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼ allow      ▼ deny
 ┌──────┐   ┌──────┐
 │serve │   │403   │
 └──────┘   └──────┘
Cache decisions for low latency. RBAC (broad) + ABAC (fine-grained).
```

---

### Q297. Design a global API platform handling billions of requests.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Front with **CDN + edge** (cache, absorb, TLS near users) → **API gateways** (auth, rate limiting, routing) in multiple regions → horizontally-scaled stateless services → sharded/replicated data + caching. GeoDNS/anycast routes to the nearest region. Everything redundant (no SPOF), autoscaled, aggressive caching + rate limiting. **Challenges**: massive throughput (edge cache + horizontal scale), global latency (multi-region + CDN), distributed rate limiting, auth at scale (token validation + cache), sampled tracing, DDoS, multi-region consistency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Requests: billions/day; peak millions/sec → CDN offloads most; multi-region
Auth:     validate token per request → cache; distributed rate limiting (Redis)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │CDN + Edge    │  cache, TLS, DDoS/WAF, absorb near users
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Regional API  │  auth, rate limit, route (GeoDNS → nearest region)
   │Gateways      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Stateless Svcs│  autoscaled, redundant (no SPOF)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Sharded/Cached│  data (replicated)
   │Data          │
   └──────────────┘
Sampled tracing (billions of traces). Everything redundant + autoscaled.
```

---

### Q298. Design a globally distributed e-commerce platform.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Multi-region e-commerce: catalog/search (cached + CDN, per-region replicas), cart (regional Redis), **inventory** (the hard part — global consistency to avoid overselling: per-warehouse/region ownership or a strongly-consistent inventory service), orders (transactional, replicated), payments (idempotent), fulfillment (event-driven). Route to nearest region; replicate catalog globally; inventory authoritative. **Challenges**: global inventory consistency, catalog replication (eventual OK), order/payment consistency (strong), failover, latency, flash-sale spikes.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Global Routing│  → nearest region
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Region US ││Region EU │  catalog/search (CDN, eventual OK), cart (Redis),
│          ││          │  orders (transactional + replicate)
└────┬─────┘└────┬─────┘
     └─────┬──────┘
           ▼
   ┌──────────────┐
   │INVENTORY     │  authoritative + globally consistent (region/warehouse
   │(strong)      │  ownership) → NO overselling
   └──────────────┘
Fulfillment event-driven. Payments idempotent. Flash-sale → waiting room.
```

---

### Q299. Design a globally distributed social-media platform.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
Multi-region social: user data + **social graph** (sharded, replicated), **feed** generation (hybrid fan-out: write for normal, read for celebrities), posts/media (object storage + **CDN**), messaging, notifications — served from nearest region with cross-region replication (mostly **eventual consistency**, fine for feeds). Heavy caching (feed/graph caches). **Challenges**: feed generation (hybrid fan-out, celebrity), graph queries, read scale, eventual consistency, global media, real-time features, moderation.

#### Code Example / Key Takeaways
```text
── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Global Routing│  → nearest region (mostly eventual consistency)
   └──────┬───────┘
   ┌──────┴──────┐
   ▼             ▼
┌──────────┐┌──────────┐
│Region A  ││Region B  │  cross-region replication
│ ┌──────┐ ││ ┌──────┐ │
│ │Graph │ ││ │Graph │ │  sharded + replicated + cached
│ │Feed  │ ││ │Feed  │ │  hybrid fan-out (write normal / read celeb)
│ └──────┘ ││ └──────┘ │
└──────────┘└──────────┘
Posts/media → object storage + CDN. Messaging/notifications real-time.
Challenges: feed fan-out (celebrity), graph queries, read scale, moderation.
```

---

### Q300. Design a system for billions of users, millions of RPS, multi-region failures, strong security, observability, DR, and zero-downtime deploys.
**Difficulty:** `Hard`
**Category:** Expert Systems

#### Answer
The capstone — combine everything. **Edge**: CDN + GeoDNS + DDoS + WAF. **Compute**: stateless microservices, autoscaled, multi-region active-active behind regional gateways. **Data**: sharded + replicated, per-dataset consistency (strong for money, eventual for feeds), cross-region with defined **RPO/RTO**. **Async**: Kafka. **Resilience**: no SPOF, circuit breakers, bulkheads, graceful degradation, region failover with capacity headroom. **Security**: zero-trust, mTLS, IAM, encryption, secrets. **Observability**: metrics/logs/traces (sampled) + SLOs. **Deploys**: CI/CD rolling/blue-green/canary + feature flags. **Testing**: chaos + DR drills. Drive every decision from requirements + trade-offs.

#### Code Example / Key Takeaways
```text
── FULL STACK (top → bottom) ──
   ┌──────────────┐
   │EDGE          │  CDN + GeoDNS + DDoS/WAF
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │REGIONAL      │  auth, rate limit, route (multi-region active-active)
   │GATEWAYS      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │STATELESS     │  autoscaled + circuit breakers + bulkheads
   │MICROSERVICES │  + graceful degradation (no SPOF)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │DATA      ││Kafka (async  │
 │sharded + ││ pipelines)   │
 │replicated││              │
 │(per-data ││              │
 │ consist) │└──────────────┘
 └──────────┘
Cross-cutting: zero-trust/mTLS/IAM/encryption + metrics/logs/traces (sampled)
+ SLOs + CI/CD (rolling/blue-green/canary + feature flags) + chaos + DR drills.
Availability = redundancy × automation × testing.
```

---
