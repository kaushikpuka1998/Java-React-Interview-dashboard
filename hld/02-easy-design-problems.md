# HLD — Easy Design Problems Interview Questions (Q51–Q80)

*Each answer includes Back-of-the-Envelope estimation and a top-to-bottom architecture flow you can redraw on a whiteboard.*

---

### Q51. Design a URL shortener (like bit.ly).
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Functional**: shorten long URL → short code; redirect short → long; optional custom alias, expiry, analytics. **Non-functional**: read-heavy (~100:1), very low redirect latency, high availability. **Core**: generate a unique short code (base62 of an auto-increment id, or hash + collision check), store `code → longURL`, and 301/302 redirect on GET. Cache hot codes in Redis, shard the store by code, front with a CDN. **Challenges**: unique id at scale, hot codes, custom aliases, analytics (async).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Writes:   100M new URLs/day  = ~1,160 writes/sec
Reads:    100:1 ratio        = ~116,000 redirects/sec (peak ~350k)
Storage:  100M/day × 500 B   = ~50 GB/day → ~90 TB in 5 yrs (×3 replication)
Keys:     base62, 7 chars    = 62^7 ≈ 3.5 trillion codes (plenty)
Cache:    hot 20% of reads → Redis, ~10 GB working set

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               │ GET /abc123
               ▼
        ┌──────────────┐
        │  CDN / Edge  │  (cache popular redirects)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Load Balancer│
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ URL Service  │  (stateless, autoscaled)
        └──────┬───────┘
        ┌──────┴───────┐
        ▼              ▼
 ┌────────────┐  ┌──────────────┐
 │ Redis Cache│  │  KV Store    │  (sharded by code)
 │ code→url   │  │  code→url    │
 └────────────┘  └──────────────┘
               │ (async)
               ▼
        ┌──────────────┐
        │ Kafka → Analytics│ (click events)
        └──────────────┘
```

---

### Q52. Design a file upload service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Functional**: upload files, store durably, download later, large files. **Core**: client requests a **pre-signed URL** and uploads **directly to object storage** (S3), bypassing app servers; metadata (id, name, size, owner, url) in a DB. Download via signed URL/CDN. Multipart for large files. **Challenges**: virus scanning (async), access control, dedup (hash), resumable uploads.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Uploads:  10M files/day       = ~116 uploads/sec (peak ~350)
Avg size: 5 MB               → 50 TB/day ingested
Storage:  50 TB/day × 365     = ~18 PB/yr → object storage + tiering
Metadata: 10M/day × 1 KB      = ~10 GB/day (small, in DB)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
       (1) ask for pre-signed URL
               ▼
        ┌──────────────┐
        │ Upload API   │──► writes metadata ──►┌──────────┐
        └──────┬───────┘                       │ Metadata │
       (2) pre-signed URL                       │   DB     │
               ▼                                └──────────┘
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
       (3) PUT file bytes DIRECTLY
               ▼
        ┌──────────────┐
        │Object Storage│  (S3, multipart)
        └──────┬───────┘
       (4) event on upload
               ▼
        ┌──────────────┐
        │ Async Worker │  (virus scan, dedup)
        └──────────────┘
Download: Client ◄── signed URL / CDN ◄── Object Storage
```

---

### Q53. Design an image upload service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
Like file upload plus **image processing**: on upload (direct-to-S3), emit an event → worker generates **thumbnails/multiple resolutions** + optimizes (WebP), stores variants in S3, served via CDN per device. Metadata in DB. **Challenges**: async processing pipeline, CDN caching/invalidation, EXIF stripping, moderation.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Uploads:  20M images/day  = ~230/sec (peak ~700)
Avg size: 2 MB original → 4 variants (thumb/sm/md/lg) ≈ +1.5 MB
Storage:  20M × 3.5 MB/day = 70 TB/day → object storage + CDN
Reads:    50:1 (views)   = ~11,500 image views/sec → CDN offloads ~95%

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
       upload (pre-signed URL, direct-to-S3)
               ▼
        ┌──────────────┐
        │Object Storage│──► event ──►┌──────────────┐
        │  (original)  │             │ Image Worker │
        └──────────────┘             │ resize+WebP  │
               ▲                     │ strip EXIF   │
               │  store variants ◄───┴──────┬───────┘
               ▼                            ▼
        ┌──────────────┐             ┌──────────────┐
        │Object Storage│             │ Metadata DB  │
        │  (variants)  │             │ + moderation │
        └──────┬───────┘             └──────────────┘
               ▼
        ┌──────────────┐
        │     CDN      │──► device-appropriate size
        └──────────────┘
```

---

### Q54. Design a basic authentication service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: register (store email + **bcrypt/argon2** hashed password + salt), login (verify → issue **JWT** access + refresh token), validate tokens per request (stateless signature, or session store). Refresh tokens in Redis for revocation. **Challenges**: never store plaintext, secure token storage (httpOnly cookies), rate-limit login (brute force), MFA, lockout.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    100M registered, 10M DAU
Logins:   10M/day        = ~116/sec (peak ~350)
Validations: every API call ≈ 50k/sec → JWT stateless (no DB hit)
Storage:  100M users × 1 KB = ~100 GB (small)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Rate Limiter │  (block brute force)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Auth Service │
        └──────┬───────┘
        ┌──────┴──────────────┐
        ▼                     ▼
 ┌────────────┐        ┌────────────┐
 │  User DB   │        │Redis        │
 │ hashed pwd │        │refresh token│ (revocable)
 └────────────┘        └────────────┘
Login OK → issue JWT access (15m) + refresh token
Per request → verify JWT signature (stateless, no DB) → allow/deny
```

---

### Q55. Design a password reset system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Flow**: request reset → generate a **single-use, time-limited token** (random, hashed in DB) → email a reset link → user submits new password → validate token (unexpired, unused) → update hash + invalidate token + all sessions. **Security**: short TTL (~15 min), one-time use, don't reveal if the email exists (no enumeration), rate-limit, HTTPS.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Requests: ~1% of DAU/day = 100k/day = ~1.2/sec (tiny)
Token:    32-byte random, hashed, TTL 15 min, one-time
Storage:  ephemeral (Redis w/ TTL) — negligible

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
       (1) request reset (email)
               ▼
        ┌──────────────┐
        │ Reset Service│──► store token (hashed, TTL) ─►┌────────┐
        └──────┬───────┘                                │ Redis  │
       (2) send link                                    └────────┘
               ▼
        ┌──────────────┐
        │ Email Service│──► reset link with token
        └──────────────┘
               │
       (3) user clicks + submits new password
               ▼
        ┌──────────────┐
        │ Reset Service│  validate token (unexpired/unused)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  User DB     │  update hash + invalidate token + sessions
        └──────────────┘
Security: one-time, 15-min TTL, no email enumeration, rate-limited, HTTPS.
```

---

### Q56. Design a notification service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Functional**: send push/email/SMS/in-app reliably at scale. **Core**: notification API publishes events to **Kafka**; per-channel **workers** consume and call providers (APNs/FCM, SendGrid, Twilio). Store templates, preferences, delivery status. **Challenges**: retries + DLQ, idempotency (no duplicate sends), per-provider rate limits, opt-out, prioritization.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   500M notifications/day = ~5,800/sec (peak ~20k)
Fan-out:  1 event → up to 4 channels
Storage:  status 500M × 200 B/day = ~100 GB/day (retain 30d, then archive)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │  Producers   │  (order svc, etc.)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Notif API    │──► check preferences/templates
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Kafka topic  │  (buffer, absorb spikes)
        └──────┬───────┘
        ┌──────┼───────┬───────────┐
        ▼      ▼       ▼           ▼
   ┌───────┐┌──────┐┌──────┐ ┌─────────┐
   │ Push  ││Email ││ SMS  │ │ In-App  │  (per-channel workers)
   │worker ││worker││worker│ │ worker  │
   └───┬───┘└──┬───┘└──┬───┘ └────┬────┘
       ▼       ▼       ▼          ▼
    APNs/FCM SendGrid Twilio    WebSocket
       │       │       │          │
       └───────┴───► retries+DLQ, dedupe, status DB ◄──┘
```

---

### Q57. Design an email sending service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: API → queue → workers render templates → email provider (SES/SendGrid) or SMTP pool. Track status via **webhooks** (delivered/bounced/opened). **Challenges**: deliverability (SPF/DKIM/DMARC, IP warm-up, reputation), bounce/complaint handling (suppression list), retries + DLQ, idempotency, unsubscribe/compliance.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   200M emails/day = ~2,300/sec (peak ~8k)
Provider: rate-limited → queue smooths bursts
Storage:  status + suppression list: 200M × 300 B = ~60 GB/day (retain 30d)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │  Producers   │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Email API    │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │    Queue     │  (load leveling)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Send Workers │──► render template, check suppression
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Provider/SMTP│  (SES/SendGrid; SPF/DKIM/DMARC)
        └──────┬───────┘
               ▼ webhooks
        ┌──────────────┐
        │ Status DB    │  delivered/bounce/open → suppression list
        └──────────────┘
```

---

### Q58. Design an SMS sending service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
Similar to email: API → queue → workers → SMS **gateway** (Twilio/SNS) with **failover/least-cost routing** by country. Delivery receipts via webhooks; OTP use cases (short TTL, rate-limited). **Challenges**: per-country regulations, sender-id rules, cost optimization, retries + DLQ, idempotency (no duplicate OTPs), abuse rate limiting.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   50M SMS/day = ~580/sec (peak ~2k); OTP spikes on login waves
Cost:     $/SMS varies by country → least-cost routing matters
Storage:  status 50M × 200 B = ~10 GB/day

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │  Producers   │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  SMS API     │──► rate limit (abuse/OTP)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │    Queue     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Send Workers │──► least-cost routing by country
        └──────┬───────┘
        ┌──────┴──────┐
        ▼             ▼
   ┌────────┐   ┌────────┐
   │Provider│   │Provider│  (failover)
   │   A    │   │   B    │
   └───┬────┘   └───┬────┘
       └────► webhooks → Status DB, retries+DLQ
```

---

### Q59. Design a simple chat application.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: clients connect via **WebSocket** to chat servers; messages persisted (DB) + routed via a **pub/sub backplane** (Redis/Kafka) so a message from a user on server A reaches a recipient on server B. Store history, unread counts, receipts; offline → push. **Challenges**: connection scale (sticky sessions + backplane), ordering, receipts, presence, offline delivery.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    50M DAU, ~5M concurrent connections
Messages: 20 msgs/user/day × 50M = 1B/day = ~11,600 msgs/sec (peak ~40k)
Conns/node: ~50k → need ~100 gateway nodes for 5M connections
Storage:  1B × 300 B/day = ~300 GB/day (retain 1 yr → shard by conversation)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐        ┌──────────────┐
        │  Client A    │        │  Client B    │
        └──────┬───────┘        └──────┬───────┘
         WebSocket                WebSocket
               ▼                        ▼
        ┌──────────────┐        ┌──────────────┐
        │ Gateway N1   │        │ Gateway N2   │
        └──────┬───────┘        └──────┬───────┘
               ▼   (publish)     (subscribe) ▲
        ┌──────────────────────────────┴─────┐
        │  Pub/Sub Backplane (Redis/Kafka)   │
        └──────┬─────────────────────────────┘
               ▼
        ┌──────────────┐
        │  Message DB  │  (sharded by conversation) + push for offline
        └──────────────┘
```

---

### Q60. Design a simple task management system.
**Difficulty:** `Basic`
**Category:** Design Problems (Easy)

#### Answer
**Core**: CRUD tasks (title, status, assignee, due, priority) with users/projects; filtering, sorting, status transitions. Relational DB (tasks, users, projects, FKs). Read replicas + caching for list views. **Challenges**: notifications (due/assignment), activity/audit log, real-time updates, per-project permissions, search.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    1M users, 100k DAU (internal-scale)
Ops:      100k × 50 actions/day = 5M/day = ~60/sec (small)
Storage:  10M tasks × 2 KB = ~20 GB → single DB + replicas suffices
Read-heavy: list/board views → cache + read replicas

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Load Balancer│
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Task Service │  (RBAC per project)
        └──────┬───────┘
        ┌──────┴──────┐
        ▼             ▼
   ┌────────┐   ┌──────────────┐
   │ Cache  │   │ Relational DB│  primary + read replicas
   │ (lists)│   │ tasks/users/ │
   └────────┘   │ projects (FK)│
                └──────┬───────┘
                       ▼
                ┌──────────────┐
                │Notif + Audit │  (due/assignment, activity log)
                └──────────────┘
```

---

### Q61. Design a to-do application.
**Difficulty:** `Basic`
**Category:** Design Problems (Easy)

#### Answer
A minimal task manager: per-user items (text, done, due, order). REST API (or offline-first with sync); table `todos(user_id, text, done, position, updated_at)`. Multi-device sync via `updated_at` delta + conflict resolution (LWW/CRDT). **Challenges**: offline support, multi-device sync, reminders.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    5M users, 500k DAU
Ops:      500k × 20/day = 10M/day = ~120/sec (tiny)
Storage:  50M todos × 500 B = ~25 GB → single DB + replicas
Sync:     delta by updated_at cursor (only changed rows)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │ Client (multi│  offline-first cache
        │  device)     │
        └──────┬───────┘
       sync (since=updated_at)
               ▼
        ┌──────────────┐
        │ Todo Service │  conflict resolution (LWW/CRDT)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  Todo DB     │  todos(user_id, text, done, position, updated_at)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  Reminders   │  (scheduled jobs)
        └──────────────┘
```

---

### Q62. Design a library management system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Entities**: Book, BookCopy (per-copy status), Member, Loan (copy, member, due), Reservation. Relational DB with **transactions** for borrow/return (a copy can't be lent twice → row locking). **Flows**: search, borrow (check availability → loan → mark borrowed), return, reserve, fines. **Challenges**: concurrency on a copy, reservation queue, fine calc, due-date notifications.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Scale:    bounded (one library/chain): 100k books, 500k copies, 200k members
Ops:      ~10k borrow/return per day = <1/sec → trivial load
Storage:  ~1M loan records/yr × 500 B = ~500 MB/yr (tiny)
Key concern: correctness (no double-lending), not throughput

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Library Service│
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Relational DB│  (transactional)
        │  Book        │
        │  BookCopy ◄──┼── lock row on borrow (no double-lend)
        │  Member      │
        │  Loan        │
        │  Reservation │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Notifications│  (due dates, reservation ready, fines)
        └──────────────┘
Borrow (TX): available? → create Loan + set copy=BORROWED
Return: free copy + compute fine if late; Reserve → queue.
```

---

### Q63. Design a parking lot system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Entities**: ParkingLot → Levels → Spots (compact/large/handicap), Vehicle, Ticket. **Flows**: on entry, **assign an available spot** of the right size (transactional — no double-assign), issue ticket; on exit, compute fee by duration, free the spot. Track availability counts per level. **Challenges**: spot-assignment concurrency, pricing tiers, real-time availability, payment.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Scale:    bounded — e.g. 2,000 spots, ~5k entries/exits per day
Load:     ~0.1 req/sec average (spiky at rush hour, still tiny)
Storage:  ~5k tickets/day × 300 B = ~1.5 MB/day (negligible)
Key concern: concurrency (two cars, one spot), not scale

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │Entry Terminal│
        └──────┬───────┘
       request spot
               ▼
        ┌──────────────┐
        │Parking Service│
        └──────┬───────┘
       assign spot (TRANSACTIONAL, lock row)
               ▼
        ┌──────────────┐
        │      DB      │
        │ Lot→Level→Spot(size, occupied)
        │ Ticket(spot, entry_time)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Availability  │  per-level free counts (cache/display)
        └──────────────┘
Exit: fee = f(duration) → pay → set spot free.
Assign spot uses SELECT ... FOR UPDATE so two cars can't grab one spot.
```

---

### Q64. Design a movie ticket booking system (like BookMyShow).
**Difficulty:** `Hard`
**Category:** Design Problems (Easy)

#### Answer
**Core**: browse movies/theatres/shows; select seats; **hold seats** for 5–10 min (transactional/locked so two users can't book the same seat), confirm on payment. Entities: Movie, Theatre, Screen, Show, Seat, Booking. Read-heavy browsing (cache+CDN), write-critical seat locking. **Challenges**: seat-locking concurrency (the crux), payment + timeout release, high-demand shows (waiting room), idempotent booking.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Scale:    50M users, browse 100:1 vs book
Browse:   ~20k/sec (cache+CDN)
Bookings: 2M/day = ~25/sec avg, but HOT show = 10k seats sold in seconds
Storage:  seats/shows small; bookings 2M/day × 500 B = ~1 GB/day
Crux:     seat-lock concurrency on popular shows

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ CDN + Cache  │  (browse: movies/shows — read-heavy)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Booking Service│
        └──────┬───────┘
      (1) HOLD seats (lock, TTL 8 min)
               ▼
        ┌──────────────┐
        │ Seat Store   │  Seat(show_id, seat_id, status) — row lock / Redis lock
        └──────┬───────┘
      (2) pay
               ▼
        ┌──────────────┐
        │Payment Service│──► success → CONFIRM ; timeout → RELEASE hold
        └──────────────┘
Hot show: virtual waiting room + rate limiting in front of Booking Service.
```

---

### Q65. Design a restaurant reservation system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: search by time/party/location; check **table availability** for a slot; reserve (transactional hold — no double-booking), confirm, notify. Entities: Restaurant, Table, TimeSlot, Reservation. Read-heavy search (cache, geo-index), write-critical availability. **Challenges**: availability concurrency (lock table+slot), overbooking policy, no-show/reminders, waitlists, time zones.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Scale:    10M users, 500k restaurants
Search:   ~5k/sec (geo + time filters) → cache + geo-index
Reserves: 1M/day = ~12/sec (write-critical, low volume)
Storage:  reservations 1M/day × 400 B = ~400 MB/day

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Search (geo) │  cache + geo-index (nearby, time, party size)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Reservation Svc│
        └──────┬───────┘
       reserve (TRANSACTIONAL: lock table+slot)
               ▼
        ┌──────────────┐
        │      DB      │
        │ Restaurant   │
        │ Table        │
        │ Reservation(table, slot) ◄── no double-book
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Notify+Reminder│  (confirm, reminder, no-show handling)
        └──────────────┘
```

---

### Q66. Design a meeting-room booking system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: list rooms; check availability for a time range; book (transactional — reject overlapping bookings via a constraint/lock on room+interval); modify/cancel; calendar view. Entities: Room, Booking(room, start, end, organizer). **Key**: **interval-overlap** detection. **Challenges**: concurrency, recurring bookings, time zones, capacity/equipment filters, calendar integration.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Scale:    corporate — 10k rooms, 100k employees, ~50k bookings/day
Load:     ~0.6 bookings/sec (tiny); reads (calendar) higher, cacheable
Storage:  50k/day × 400 B = ~20 MB/day → single DB
Key concern: no overlapping bookings for a room

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Booking Service│
        └──────┬───────┘
       book (reject if overlapping range exists)
               ▼
        ┌──────────────┐
        │      DB      │
        │ Room         │
        │ Booking(room, start, end, organizer)
        │  ▲ EXCLUDE constraint: (room =, tsrange &&) → no overlap
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Calendar/Notify│  (recurring, reminders, TZ handling)
        └──────────────┘
Postgres: EXCLUDE USING gist (room WITH =, during WITH &&) blocks overlaps atomically.
```

---

### Q67. Design a calendar application (like Google Calendar).
**Difficulty:** `Hard`
**Category:** Design Problems (Easy)

#### Answer
**Core**: events (title, start/end, attendees, recurrence), calendars per user, invitations/RSVP, reminders. Store **recurrence rules (RRULE)** not expanded copies; expand on read for a date range. Read-heavy (cache month views), shard by user. **Challenges**: recurring events + exceptions, **time zones/DST**, cross-user invitations (fan-out), reminders (scheduled jobs), free/busy, delta sync.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    500M users, 100M DAU
Reads:    100M × 20 views/day = 2B/day = ~23k/sec (cache month views)
Writes:   100M × 5 events/day = 500M/day = ~5,800/sec
Storage:  store RRULE not expansions → ~2 KB/event × 5B events = ~10 TB (shard by user)
Reminders: distributed scheduler fires millions of reminders/day

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │  (delta sync via sync token)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Calendar Service│
        └──────┬───────┘
        ┌──────┴──────┐
        ▼             ▼
   ┌────────┐   ┌──────────────┐
   │ Cache  │   │  Event DB    │  (sharded by user)
   │(views) │   │ Event(RRULE, │
   └────────┘   │ attendees)   │  ← store rule, expand on read
                └──────┬───────┘
       invite fan-out  │
               ▼       ▼
        ┌──────────────┐   ┌──────────────┐
        │ Attendees'   │   │ Reminder     │
        │ calendars    │   │ Scheduler    │
        └──────────────┘   └──────────────┘
Hard parts: recurrence + exceptions, TZ/DST, free/busy, invite fan-out.
```

---

### Q68. Design a simple polling/voting system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: create a poll with options; users cast votes; show tallies. Entities: Poll, Option, Vote(user, option). Enforce **one vote per user** (unique constraint). For viral polls (write-heavy), use a **distributed counter** (Redis INCR / Kafka-buffered counts) + cache results. **Challenges**: preventing double/fraud voting, real-time results, high write throughput on popular polls.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Normal:   1M votes/day = ~12/sec
Viral:    a hot poll → 100k votes/min = ~1,700/sec on ONE poll (hot key!)
Storage:  votes 1M/day × 100 B = ~100 MB/day
Hot key:  single poll counter → shard the counter or Redis INCR

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Vote Service │  enforce one-vote-per-user (unique(user,poll))
        └──────┬───────┘
        ┌──────┴──────┐
        ▼             ▼
   ┌────────────┐  ┌──────────────┐
   │ Redis INCR │  │  Vote DB     │  (raw votes, audit)
   │ (sharded   │  │ Vote(user,   │
   │  counter)  │  │  option)     │
   └─────┬──────┘  └──────────────┘
         ▼ (flush)
   ┌────────────┐
   │ Results    │  cached tallies → real-time display
   └────────────┘
Hot poll: shard counter into N sub-counters, sum on read (avoid single-row contention).
```

---

### Q69. Design a feedback/rating system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: users submit ratings (1–5) + reviews for an entity; compute/display **average + count**. Entities: Rating(entity, user, score, text). Store raw ratings; maintain a **running aggregate** (sum, count → avg) updated on write, or recompute async. Read-heavy (cache aggregates); one rating per user per entity. **Challenges**: efficient averages, spam/fake reviews (moderation), recency/verified weighting, pagination.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Reads:    product pages show avg → ~50k/sec → cache the aggregate
Writes:   10M ratings/day = ~116/sec
Storage:  raw ratings 10M/day × 500 B = ~5 GB/day; aggregates tiny
Aggregate: maintain (sum, count) per entity → avg = sum/count (O(1) read)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Rating Service│  unique(user, entity)
        └──────┬───────┘
        ┌──────┴──────┐
        ▼             ▼
   ┌────────────┐  ┌──────────────┐
   │ Aggregate  │  │  Rating DB   │  (raw reviews)
   │ Cache      │  │ Rating(entity│
   │ sum/count  │  │  user,score, │
   │ → avg      │  │  text)       │
   └────────────┘  └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │ Moderation   │  (spam/fake detection, async)
                   └──────────────┘
On write: update (sum += score, count += 1) → avg recomputed cheaply.
```

---

### Q70. Design a basic blogging platform.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: authors write posts (title, body/markdown, tags, draft/published), readers view posts + comments. Entities: User, Post, Comment, Tag. Relational DB; render markdown; SEO slugs. Read-heavy → **cache rendered posts + CDN**; search via Elasticsearch. **Challenges**: comment moderation/spam, drafts, media uploads, feeds/RSS, full-text search.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Reads:    1B page views/day = ~11,600/sec → 95% served by CDN/cache
Writes:   100k posts/day = ~1/sec (write-light, read-heavy)
Storage:  10M posts × 10 KB = ~100 GB → single DB + replicas + search index

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Reader     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │     CDN      │  (rendered posts — read-heavy)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Blog Service │
        └──────┬───────┘
        ┌──────┼──────────┐
        ▼      ▼          ▼
   ┌────────┐┌──────┐┌──────────────┐
   │ Cache  ││ Post ││Elasticsearch │
   │(render)││  DB  ││ (full-text)  │
   └────────┘└──┬───┘└──────────────┘
               ▼
        ┌──────────────┐
        │Comment + Media│  moderation; media → object storage + CDN
        └──────────────┘
```

---

### Q71. Design a document storage system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: upload documents to **object storage** (pre-signed URLs), metadata in DB (name, type, size, owner, folder, version), organize in folders, search by metadata/content, share with permissions. Index content in Elasticsearch. **Challenges**: **versioning**, access control/sharing (ACLs), full-text search (extract text async), large/resumable uploads, audit logging.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Uploads:  5M docs/day × 1 MB = 5 TB/day → object storage
Reads:    20:1 (views/downloads) = ~1,200/sec
Storage:  5 TB/day × 365 = ~1.8 PB/yr; metadata 5M × 1 KB = ~5 GB/day
Search:   index extracted text in Elasticsearch

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
       upload (pre-signed URL, direct)
               ▼
        ┌──────────────┐
        │Object Storage│──► event ──►┌──────────────┐
        │  (docs)      │             │ Text Extract │
        └──────────────┘             │ Worker (async)│
               ▲                     └──────┬───────┘
     store metadata + versions              ▼
               ▼                     ┌──────────────┐
        ┌──────────────┐             │Elasticsearch │
        │ Metadata DB  │             │ (full-text)  │
        │ folders,     │             └──────────────┘
        │ versions,ACL │
        └──────────────┘
Sharing via ACLs; versioning keeps history; audit log on access.
```

---

### Q72. Design a photo storage service (like Google Photos, basic).
**Difficulty:** `Hard`
**Category:** Design Problems (Easy)

#### Answer
**Core**: upload direct-to-S3, generate thumbnails/resolutions (async), store metadata (album, timestamp, EXIF, geo), serve via CDN, albums, search. Huge storage → object storage + tiering; sharded metadata. **Challenges**: async pipeline, dedup (content hash), face/scene tagging (ML), privacy (EXIF/geo), massive read scale.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Uploads:  50M photos/day × 3 MB = 150 TB/day ingested
Variants: +4 sizes ≈ +1.5 MB each → ~200 TB/day total
Storage:  ~70 PB/yr → object storage + hot/cold tiering
Reads:    50:1 (views) → CDN offloads ~95%; metadata sharded by user

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │
        └──────┬───────┘
       upload direct-to-S3
               ▼
        ┌──────────────┐
        │Object Storage│──► event ──►┌──────────────┐
        │ (original)   │             │ Photo Worker │
        └──────────────┘             │ resize, dedup│
               ▲                     │ ML tags      │
      variants │                     └──────┬───────┘
               ▼                            ▼
        ┌──────────────┐             ┌──────────────┐
        │Object Storage│             │ Metadata DB  │
        │ (variants)   │             │ album/EXIF/  │
        └──────┬───────┘             │ geo (sharded)│
               ▼                     └──────────────┘
        ┌──────────────┐
        │     CDN      │  (device-appropriate delivery)
        └──────────────┘
```

---

### Q73. Design a contact management system.
**Difficulty:** `Basic`
**Category:** Design Problems (Easy)

#### Answer
**Core**: CRUD contacts (name, phones, emails, addresses, groups/tags) per user; search; import/export (vCard/CSV); multi-device sync. Entities: Contact, ContactField, Group. **Challenges**: **deduplication/merge** (same person, multiple entries), sync + conflict resolution, search (name/phone/email), import mapping.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    100M users, avg 500 contacts each = 50B contact records
Ops:      mostly reads + occasional edits/sync → ~2k/sec
Storage:  50B × 500 B = ~25 TB → shard by user
Sync:     delta by updated_at

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │Client (multi │
        │ device)      │
        └──────┬───────┘
       sync (since=updated_at)
               ▼
        ┌──────────────┐
        │Contact Service│  dedup/merge, conflict resolution
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  Contact DB  │  (sharded by user)
        │ Contact(name,│
        │ phones[],    │
        │ emails[])    │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │Import/Export │  (vCard/CSV), search index
        └──────────────┘
```

---

### Q74. Design an employee management system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: employees (profile, department, manager, role, salary), org hierarchy, attendance/leave, payroll integration. Entities: Employee (self-referential manager for the **org tree**), Department, Role, LeaveRequest. Relational DB + RBAC. **Challenges**: hierarchical queries (recursive CTE), sensitive-data access control, audit trails, leave-approval workflow, integrations (payroll, SSO).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Scale:    enterprise — 500k employees, ~50k DAU
Load:     ~500/sec (HR ops, self-service) — modest
Storage:  500k × 5 KB = ~2.5 GB (tiny) + audit log grows
Key:      org-tree queries + strict RBAC on salary/PII

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │  (SSO)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  HR Service  │  RBAC (HR vs employee views)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │      DB      │
        │ Employee(manager_id self-ref) ◄─ recursive CTE = org chart
        │ Department, Role, LeaveRequest
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Workflow +   │  leave approval, audit trail
        │ Payroll/SSO  │  integrations
        └──────────────┘
```

---

### Q75. Design an API key management service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: generate API keys, store only a **hash** (show once), validate keys on requests (fast + cached), scopes/permissions, rotation, revocation, **usage tracking + rate limits** per key. Entities: ApiKey(hash, owner, scopes, status, expires). Validation is hot → cache in Redis. **Challenges**: secure storage (hash), fast validation, rotation without downtime, per-key quotas, audit.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Keys:     1M active keys
Validations: every API request ≈ 100k/sec → MUST be cached (no DB per call)
Storage:  keys 1M × 500 B = ~500 MB; usage metrics grow (aggregate)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Client     │  (sends API key)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ API Gateway  │  hash key → validate
        └──────┬───────┘
        ┌──────┴──────┐
        ▼             ▼
   ┌────────────┐  ┌──────────────┐
   │Redis (hot  │  │  Key DB      │
   │ key cache) │  │ ApiKey(hash, │
   │ hash→meta  │  │ scopes,      │
   └────────────┘  │ status)      │
        │          └──────────────┘
        ▼
   ┌────────────┐
   │ Rate Limit │  per-key quota + usage metrics
   └────────────┘
Generate → store HASH only (show once). Rotation: overlap old+new. Revoke → evict cache.
```

---

### Q76. Design a feature flag service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: define flags with targeting (on/off, % rollout, per-user/segment); SDKs evaluate flags **locally** using rules fetched/streamed from the service; changes apply without redeploy. Components: management API/UI, config store, delivery (poll/stream/CDN) + local caching. **Challenges**: fast/consistent propagation, deterministic % bucketing (hash userId), low-latency evaluation, audit, kill-switches.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Flags:    ~10k flags; evaluations happen IN-APP (SDK, local) → billions/day, ~0 latency
Rule fetch: SDKs poll/stream rules every few sec → tiny bandwidth
Storage:  flag config tiny (~MBs); audit log grows

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │ Admin UI/API │  define flags + rules
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Config Store │  (versioned, audit)
        └──────┬───────┘
       push/stream changes
               ▼
        ┌──────────────┐
        │ Delivery/CDN │  (poll/stream rules)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ App + SDK    │  evaluate LOCALLY (cached rules) — no network per check
        └──────────────┘
% rollout: bucket = hash(flag + userId) % 100 < percent  (deterministic).
```

---

### Q77. Design a configuration management service.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: centrally store config per app/env; services fetch on startup + get **dynamic updates** (poll/watch/stream) without redeploy; versioning + rollback; secrets integration. Components: config store (with history), API, client/agent with local cache. Read-heavy → cache + edge. **Challenges**: consistency/propagation speed, validation before apply, env overrides, secrets (Vault), audit.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Configs:  per (app, env) — thousands of keys; small data
Fetch:    every service instance watches → low bandwidth (deltas)
Storage:  config + version history ~ GBs; secrets in Vault (separate)

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │ Admin/API    │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Config Store │  versioned (rollback), validated
        └──────┬───────┘
       watch/stream changes
               ▼
        ┌──────────────┐
        │Service + Agent│  local cache (serve last-known if store down)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │    Vault     │  (secrets — separate, encrypted)
        └──────────────┘
Dynamic refresh: @RefreshScope picks up changes without restart.
```

---

### Q78. Design a simple log aggregation system.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: agents ship structured logs → **Kafka buffer** → processors parse/enrich (add service, trace id) → searchable store (Elasticsearch/Loki) → UI (Kibana/Grafana). Kafka absorbs bursts. Index sharding, hot/warm/cold tiers, sampling. **Challenges**: high write volume, retention cost, searchability (structured + correlation id), PII scrubbing.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   1M log lines/sec (large fleet) × 500 B = ~500 MB/sec = ~43 TB/day
Kafka:    buffers bursts; retention 3–7 days
Index:    hot (7d in ES) + warm/cold (object storage) → control cost
Sampling: drop/sample noisy DEBUG logs

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │ Hosts + Agent│  (Filebeat/Fluentd)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │    Kafka     │  (buffer, absorb bursts)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  Processors  │  parse/enrich (+ trace id), scrub PII
        └──────┬───────┘
        ┌──────┴──────┐
        ▼             ▼
   ┌────────────┐  ┌──────────────┐
   │Elasticsearch│  │Object Storage│
   │ (hot, 7d)  │  │ (cold tier)  │
   └─────┬──────┘  └──────────────┘
         ▼
   ┌────────────┐
   │Kibana/Grafana│  query by trace id
   └────────────┘
```

---

### Q79. Design a health-check service.
**Difficulty:** `Basic`
**Category:** Design Problems (Easy)

#### Answer
**Core**: each service exposes **liveness** (process alive? restart if not) + **readiness** (can serve? pull from LB if not); a central monitor / orchestrator / LB probes periodically and acts (restart, de-route, alert). **Challenges**: liveness vs readiness distinction, dependency checks (shallow for liveness, deeper for readiness), flapping avoidance (thresholds), alerting integration.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Probes:   10k services × 1 probe/5s = ~2k probes/sec (cheap, distributed)
Data:     ephemeral status; only alerts/history persisted

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │ Orchestrator │  (k8s) / LB / Monitor
        └──────┬───────┘
       probe every N sec
        ┌──────┴──────┐
        ▼             ▼
 ┌────────────┐ ┌────────────┐
 │ Service    │ │ Service    │
 │ /liveness  │ │ /readiness │
 └─────┬──────┘ └─────┬──────┘
       │              │
   liveness fail   readiness fail
       ▼              ▼
   RESTART pod    REMOVE from LB rotation
       │
       ▼
   ┌────────────┐
   │  Alerting  │  (thresholds → avoid flapping)
   └────────────┘
Liveness = shallow (is process up?). Readiness = deeper (deps OK, can serve?).
```

---

### Q80. Design a simple job scheduler.
**Difficulty:** `Intermediate`
**Category:** Design Problems (Easy)

#### Answer
**Core**: schedule jobs at a time or cron; scheduler polls due jobs → dispatches to **workers** via a queue; track status + retries. Store jobs with `next_run_at` (indexed). **HA**: multiple schedulers need **atomic claim** (`SELECT ... FOR UPDATE SKIP LOCKED`) or leader election to avoid double-dispatch. **Challenges**: exactly-once dispatch, retries + backoff, missed-run handling, coordination.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Jobs:     10M scheduled jobs, ~100k fire/min = ~1,700/sec dispatch
Storage:  jobs 10M × 500 B = ~5 GB; index on next_run_at
HA:       atomic claim so a job fires exactly once across schedulers

── ARCHITECTURE (top → bottom) ──
        ┌──────────────┐
        │   Job DB     │  Job(schedule, next_run_at, status), index(next_run_at)
        └──────┬───────┘
       poll due jobs (atomic claim)
               ▼
        ┌──────────────┐
        │  Scheduler   │  SELECT ... FOR UPDATE SKIP LOCKED (no double-dispatch)
        │  (N replicas)│
        └──────┬───────┘
       enqueue
               ▼
        ┌──────────────┐
        │    Queue     │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │   Workers    │  execute → update status; retries + backoff
        └──────────────┘
After run: recompute next_run_at (cron) or mark done. Missed runs → catch-up policy.
```

---
