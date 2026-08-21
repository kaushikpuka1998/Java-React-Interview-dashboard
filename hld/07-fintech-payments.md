# HLD — FinTech, Payments & Transactions Interview Questions (Q221–Q245)

*Each answer includes Back-of-the-Envelope estimation and a top-to-bottom architecture flow. Money = correctness first (strong consistency, idempotency, immutable ledger).*

---

### Q221. Design a payment gateway.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
A gateway sits between merchants and processors/banks. **Flow**: merchant sends a payment request → gateway validates + **tokenizes** the card (PCI) → routes to the acquiring processor → returns auth → captures/settles later. Store transactions (idempotent by payment id), retries, merchant webhooks, reconciliation. **Challenges**: idempotency (no double charge), PCI/tokenization, processor failover/routing, auth/capture/settle consistency, fraud, reliable webhooks.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   100M transactions/day = ~1,160/sec (peak ~5k on sale days)
Latency:  auth must be <2s → low-latency path
Storage:  100M × 1 KB/day = ~100 GB/day immutable txn log (retain years)
Consistency: STRONG (no double charge) + idempotency keys

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Merchant    │
   └──────┬───────┘
     payment req (+ Idempotency-Key)
          ▼
   ┌──────────────┐
   │Payment Gateway│  validate + TOKENIZE card (PCI)
   └──────┬───────┘
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Processor     │───────►│ Fraud Check  │
   │Router        │        └──────────────┘
   │(failover)    │
   └──────┬───────┘
     auth → capture → settle
          ▼
   ┌──────────────┐
   │Txn Store     │  immutable, idempotent → merchant webhooks
   └──────────────┘
```

---

### Q222. Design a payment processing system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Orchestrate the lifecycle: **authorization** (hold) → **capture** → **settlement**, with a durable state machine per transaction and a **double-entry ledger**. Idempotency keys for retries; Saga for multi-step; async events (Kafka) for downstream. **Challenges**: exactly-once effects, ledger/balance consistency (transactions), partial failures + compensation, bank reconciliation, fraud, immutable audit.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   millions of payments/day; each = multi-step (auth→capture→settle)
Ledger:   every movement = 2 entries (double-entry); immutable, append-only
Storage:  ledger grows forever → partition by account/time + archive

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Payment Req │  (+ Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Payment Orchestr.│  state machine: authorize → capture → settle
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Double-   ││Kafka events  │──► notifications, reconciliation
 │Entry     ││              │
 │Ledger    │└──────────────┘
 │(immutable│
 │,strong)  │
 └──────────┘
Saga compensations on partial failure.
```

---

### Q223. Design a wallet system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Holds a user's balance; top-up, pay, transfer, withdraw. Model via an **immutable ledger** (balance = sum, or a maintained balance row updated **atomically** with the ledger entry). Ensure **no negative balance** (check + lock the row). Idempotency keys prevent double-processing. Shard by user. **Challenges**: strong consistency (no double-spend/negative), atomic balance+ledger, idempotency, auditability, hot-account concurrency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    100M wallets; millions of transactions/day
Balance:  atomic update WITH ledger entry (same DB tx); lock row (no negative)
Storage:  ledger append-only → shard by user; balance snapshot per wallet

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │  (+ Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Wallet Service│
   └──────┬───────┘
     transaction (lock wallet row)
          ▼
   ┌──────────────┐
   │  Wallet DB   │  (sharded by user)
   │  Balance ◄───┼── lock row: reject if would go negative
   │  Ledger(append,│  balance + ledger updated in SAME tx
   │  immutable)  │
   └──────────────┘
Ops: top-up, pay, transfer, withdraw — all idempotent + atomic.
```

---

### Q224. Design PayPal.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Digital wallet + payment network: balances (ledger), send/receive, link banks/cards, merchant payments, FX, fraud. Money movement is **transactional + double-entry ledgered**, idempotent, async events. Strong balance consistency; risk/fraud engine screens transactions. Shard by user. **Challenges**: consistency (no double-spend), real-time fraud, KYC/AML compliance, multi-currency, reconciliation, disputes/refunds.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    400M+; billions of transactions/yr
Money:    transfers = transactional double-entry; strong consistency
Fraud:    real-time scoring on every transaction (<100ms)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   User       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Payment Service│  (+ Idempotency-Key)
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────────┐
 │Ledger││Fraud   ││Funding       │
 │(double││Engine  ││Sources (bank/│
 │-entry,││(real-  ││ card) + FX   │
 │strong)││ time)  ││              │
 └──────┘└────────┘└──────────────┘
KYC/AML compliance; reconciliation; disputes/refunds.
```

---

### Q225. Design Stripe-like payment infrastructure.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Developer-first API: create PaymentIntents, tokenize cards (PCI), route to processors, subscriptions/billing, **webhooks** to merchants. Everything **idempotent** (idempotency keys), a **ledger** for money movement, reliable webhook delivery (retries + signing). Multi-region HA. **Challenges**: API idempotency, reliable webhooks (retries/DLQ/signing), PCI/tokenization, processor routing/failover, ledger consistency, subscriptions/proration, API reliability/observability.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   billions of API calls/yr; payments must never drop (HA critical)
Idempotency: EVERY mutating API call carries an idempotency key
Webhooks: reliable delivery (retries + HMAC signing) to millions of merchants

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Merchant App│
   └──────┬───────┘
     API call (+ Idempotency-Key)
          ▼
   ┌──────────────┐
   │Payment API   │  PaymentIntent → tokenize → processor
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Ledger    ││Webhook       │──► merchant (retries + HMAC sign)
 │          ││Delivery      │
 └──────────┘└──────────────┘
Subscriptions/billing; processor failover; multi-region HA.
```

---

### Q226. Design UPI-like payment architecture.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Real-time bank-to-bank rail: a central **switch (NPCI)** routes payment requests between payer and payee banks (PSPs) using **VPAs** (virtual addresses). Flow: initiate → switch → debit payer + credit payee → confirm — in seconds. Idempotency + reconciliation essential. **Challenges**: real-time cross-bank consistency (switch coordinates), idempotency (no double debit), high throughput + low latency, failure handling (debited-not-credited → reversal), security (2FA/PIN).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   billions of transactions/month (India-scale) → very high throughput
Latency:  end-to-end in seconds (real-time)
Consistency: cross-bank; failure → auto-reversal via reconciliation

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Payer App(VPA)│
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  PSP         │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Central Switch│  (NPCI) — routes by VPA
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Payer Bank││Payee Bank    │
 │ DEBIT    ││ CREDIT       │
 └──────────┘└──────────────┘
Debited-not-credited → reconciliation → auto-reversal. 2FA/PIN.
```

---

### Q227. Design a banking transaction system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Core banking: accounts + balances backed by a **double-entry ledger** (equal debits/credits) with **ACID** guarantees. Strongly consistent, idempotent, fully auditable (immutable ledger). Shard by account; cross-account transfers need transactional consistency. **Challenges**: strong consistency (ACID, no double-spend), atomic cross-account transfers (2PC/Saga if sharded), idempotency, auditability, compliance, reconciliation.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Accounts: 100M+; millions of transactions/day
Ledger:   double-entry, ACID, immutable; balances derivable
Consistency: STRONG (correctness > availability) — CP system

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Transaction Req│  (+ Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Core Banking  │
   └──────┬───────┘
     atomic debit + credit (ACID tx)
          ▼
   ┌──────────────┐
   │Double-Entry  │  (immutable, sharded by account)
   │Ledger        │
   │ debit  = credit (always balances)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Audit + Recon.│  (compliance)
   └──────────────┘
Cross-shard transfer → Saga/2PC. No double-spend (row locks).
```

---

### Q228. Design a money-transfer system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Transfer A→B atomically: debit A + credit B as **one logical transaction** with double-entry entries. Same DB → single transaction; **across shards/banks** → **Saga** (debit A → credit B → reverse A on failure) or 2PC, with idempotency + reconciliation. Never leave money in limbo. **Challenges**: atomicity across accounts/shards (Saga + compensation), idempotency, no negative balance (locks), consistency (debited-not-credited), auditability.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Transfers: millions/day; each = debit + credit (atomic)
Same shard: single ACID tx. Cross-shard: Saga (debit → credit → reverse on fail)
Consistency: never lose/duplicate money → idempotency + reconciliation

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Transfer Req  │  (A → B, + Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Transfer Service│
   └──────┬───────┘
    ┌─────┴─────────────┐
    ▼ same shard        ▼ cross-shard
 ┌────────────┐   ┌──────────────┐
 │Single ACID │   │ Saga:        │
 │tx: debit A │   │ debit A →    │
 │+ credit B  │   │ credit B →   │
 │(double-    │   │ reverse A on │
 │ entry)     │   │ failure      │
 └────────────┘   └──────────────┘
Row locks → no negative. Reconciliation for stragglers.
```

---

### Q229. Design an international remittance system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Cross-border with **currency conversion**: sender pays in currency A → **FX** (locked rate) → compliance (KYC/AML/sanctions) → payout in currency B via local rails/partners; multi-day settlement in some corridors. Saga across partners + idempotency + reconciliation; ledger tracks in-transit states. **Challenges**: FX (rate lock, spread), per-country compliance, multi-partner integration (async/unreliable), settlement timing, cross-partner consistency, refund on payout failure.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   millions of remittances/day across corridors
Settlement: seconds to days (corridor-dependent) → ledger "in-transit" states
Compliance: KYC/AML/sanctions screening per transaction

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │ Sender (cur A)│
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │FX Conversion │  (locked rate)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Compliance    │  (KYC/AML/sanctions)
   └──────┬───────┘
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Payout via    │───────►│Local Partner │ (cur B)
   │Saga          │        └──────────────┘
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Ledger (in-   │  reconciliation; refund on payout failure
   │ transit)     │
   └──────────────┘
```

---

### Q230. Design a payment reconciliation system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Ensure internal records match external ones (bank/processor statements). Ingest both sides (internal ledger + provider files/APIs), **match** by id/amount/date, flag **discrepancies** (missing, duplicate, mismatch) for investigation/auto-correction. Batch or streaming. **Challenges**: matching (fuzzy, timing differences), discrepancy handling, scale (millions of txns), idempotent reprocessing, auditability. Automate matching; human-review exceptions.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   match millions of internal txns vs external statements daily
Timing:   settlement lands next day → time-window matching
Output:   matched (auto) vs discrepancies (missing/dup/mismatch → review)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐        ┌──────────────┐
   │Internal      │        │External      │
   │Ledger        │        │Statements    │
   └──────┬───────┘        └──────┬───────┘
          ▼                       ▼
   ┌────────────────────────────────┐
   │  Reconciliation Engine         │  match by (id, amount, date)
   └──────┬─────────────────────────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Matched   ││Discrepancies │──► investigate / auto-correct / alert
 │(auto)    ││(missing/dup/ │
 │          ││ mismatch)    │
 └──────────┘└──────────────┘
```

---

### Q231. Design payment retries.
**Difficulty:** `Intermediate`
**Category:** FinTech & Payments

#### Answer
Retry **transient** failures but never blindly (double-charge risk). Use **idempotency keys** so retrying is safe, **exponential backoff + jitter**, bounded attempts, and only retry retryable codes (not "declined"). For a timeout with unknown outcome, **query status** before retrying. **Challenges**: idempotency (the crux), classifying retryable vs terminal, unknown outcomes (status check), retry storms (backoff), give-up (mark failed + notify).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Retryable: network/timeout/5xx transient errors only
Terminal:  card declined, insufficient funds → DON'T retry
Unknown:   timeout → query payment status BEFORE retrying (no double charge)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Payment Attempt│  (Idempotency-Key)
   └──────┬───────┘
     fail?
          ▼
   ┌──────────────┐
   │Classify Error│
   └──────┬───────┘
    ┌─────┴─────────────┐
    ▼ transient         ▼ terminal / unknown
 ┌────────────┐   ┌──────────────┐
 │Retry (exp  │   │ Query status │ (unknown) / stop (terminal)
 │backoff +   │   │ before retry │
 │jitter,     │   └──────────────┘
 │bounded)    │
 └────────────┘
Exhausted → mark failed + notify.
```

---

### Q232. Design payment idempotency.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Client sends a unique **Idempotency-Key** per attempt. Server: in a transaction, insert the key (unique constraint); if new → process + store result; if exists → **return stored result** without re-charging. Handle in-progress duplicates (lock/"processing"). Key TTL; align with provider idempotency. **Challenges**: atomic key-insert + charge, concurrent duplicates (locking), unknown-outcome timeouts, key scoping/TTL, provider alignment.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Key:      client-supplied unique id per payment attempt
Store:    idempotency_key (unique constraint) + result; TTL (e.g. 24h)
Guarantee: retry with same key → NEVER double charge

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Client      │  (Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Payment Service│
   └──────┬───────┘
     INSERT key (unique, transactional)
          ▼
   ┌──────────────┐
   │Idempotency   │
   │Store         │
   │ new? → charge + store result
   │ exists? → return stored result (no re-charge)
   │ in-progress? → lock / "processing"
   └──────────────┘
```

---

### Q233. Design transaction history.
**Difficulty:** `Intermediate`
**Category:** FinTech & Payments

#### Answer
Store an **immutable, append-only** record of every transaction (id, amount, type, parties, timestamp, status), queryable by user with pagination + filters. Read-heavy, never mutated → append log / wide-column, indexed by (user, time). Derived from the ledger. **Challenges**: high write volume, efficient user time-range queries (pagination), immutability/audit, retention/archival, consistency with the ledger.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Writes:   every transaction appended (immutable)
Reads:    user views history → paginated, filtered by (user, time)
Storage:  grows forever → shard by user + time-partition + archive old

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Transaction   │  (from ledger)
   └──────┬───────┘
     append (immutable)
          ▼
   ┌──────────────┐
   │History Store │  Txn(id, amount, type, parties, ts, status)
   │ index(user,ts)│  (sharded by user, time-partitioned)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Query API     │  paginated + filtered; cache recent
   └──────────────┘
Archive old partitions to cold storage.
```

---

### Q234. Design a ledger system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
The immutable, append-only record of all money movements — the **source of truth** for balances. Use **double-entry** (matching debits/credits sum to zero → provably consistent). Entries never modified (corrections = new entries). Balance = sum of entries (or a snapshot updated atomically with entries). **Challenges**: strong consistency (atomic multi-account entries), immutability/audit, balance-at-scale (snapshots), double-entry integrity, idempotency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Entries:  2 per transaction (debit + credit), append-only
Balance:  sum of entries, or snapshot updated atomically with entries
Storage:  grows forever → partition by account/time; snapshots bound balance calc

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Transaction   │
   └──────┬───────┘
     append balanced entries (debit + credit, sum = 0)
          ▼
   ┌──────────────┐
   │Ledger (append│  IMMUTABLE — corrections = new entries
   │ -only,       │
   │ double-entry)│
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Balance       │  = sum(entries) or snapshot (updated atomically)
   │Snapshots     │
   └──────────────┘
Source of truth. Atomic multi-account entries.
```

---

### Q235. Design double-entry accounting.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Every transaction affects ≥2 accounts with equal **debits and credits** summing to zero — a built-in integrity check (books always balance). E.g. $10 payment: debit customer −10, credit merchant +10. Record entries **atomically** (one transaction) so partial writes can't unbalance. Balance = sum of an account's entries. **Challenges**: enforce balanced entries (debits==credits validation), cross-account atomicity, immutability, efficient balance (snapshots).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Invariant: every transaction's entries sum to ZERO (debits = credits)
Atomicity: write all entries in one tx (no partial → no unbalanced books)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │$10 Payment   │
   └──────┬───────┘
     one atomic transaction
          ▼
   ┌──────────────┐
   │Ledger Entries│
   │ debit  customer −10  ┐
   │ credit merchant +10  ┘ = 0 (balanced)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Balance = sum(│  per account (snapshot for speed)
   │ entries)     │
   └──────────────┘
Validation: reject if debits ≠ credits.
```

---

### Q236. Design a distributed ledger.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
A ledger replicated across nodes/parties with **consensus** on the ordered transaction set, so no single party controls it and all agree. Permissioned → BFT/Raft; blockchains → PoW/PoS. Each node validates + appends; hashing/chaining = tamper-evident immutability. **Challenges**: consensus (agreement despite faults/malice — BFT), throughput vs decentralization, immutability, double-spend prevention (ordering), latency (consensus rounds). Contrast with centralized ledger (simpler).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Consensus: majority/BFT agreement per block → limits throughput
Immutability: hash-chained blocks → tamper-evident
Trade-off: decentralization ↓ throughput, ↑ latency

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Transaction   │
   └──────┬───────┘
     broadcast to nodes
          ▼
   ┌──────────────┐
   │Consensus     │  (BFT / Raft / PoW-PoS) — agree on order
   └──────┬───────┘
          ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │Node 1 Ledger │   │Node 2 Ledger │   │Node 3 Ledger │
   │(hash-chained)│   │(hash-chained)│   │(hash-chained)│
   └──────────────┘   └──────────────┘   └──────────────┘
No single owner; tamper-evident; double-spend prevented via ordering.
```

---

### Q237. Design fraud detection architecture.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Screen transactions in **real time**: a scoring service evaluates each against **rules** (velocity, blacklists, geo/amount anomalies) + **ML models** (features from history/device/behavior), returning approve/deny/review within tight latency. Stream transactions (Kafka) to update features + train models; a **feature store** serves features. High risk → block/step-up auth. **Challenges**: low-latency scoring (<100ms), feature freshness (streaming), model accuracy (false positives hurt UX), evolving fraud (retraining), explainability, security vs friction.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Latency:  score every txn <100ms (in the payment path)
Features: real-time (velocity, device) from a feature store (streaming updates)
Output:   approve / deny / step-up (review)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Transaction   │
   └──────┬───────┘
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Fraud Scoring │◄───────│Feature Store │ (real-time features)
   │(rules + ML)  │        └──────▲───────┘
   └──────┬───────┘               │ stream updates
     <100ms                       │
    ┌─────┴──────┐         ┌──────────────┐
    ▼            ▼         │Kafka (txn    │
 ┌──────┐  ┌──────────┐   │ stream) →    │
 │Approve│  │Deny/Step-│   │ features +   │
 │      │  │up (review)│   │ model train  │
 └──────┘  └──────────┘   └──────────────┘
```

---

### Q238. Design a credit-card transaction system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Card network flow: **authorization** (merchant → acquirer → network → issuer approves/holds, real-time, low latency), then **clearing & settlement** (batch, funds move). Track auth holds vs captures, fraud at auth, idempotency; immutable txns; reconcile with the network. **Challenges**: real-time low-latency auth (strict SLA), auth/capture state (holds expire), fraud at auth, PCI (tokenization), settlement/reconciliation, chargebacks, HA (auth can't be down).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Auth:     real-time, <2s, HA (auth can't be down); millions/day
Settlement: batch (next day) — funds actually move
Fraud:    screened at auth time

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Merchant    │
   └──────┬───────┘
     authorize (real-time)
          ▼
   ┌──────────────┐
   │  Acquirer    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Card Network  │──► fraud check
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Issuer      │  approve + HOLD funds
   └──────┬───────┘
     later: batch
          ▼
   ┌──────────────┐
   │Clearing +    │  funds move → reconcile; chargebacks
   │Settlement    │
   └──────────────┘
```

---

### Q239. Design a subscription billing system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Manage recurring plans: subscriptions (plan, price, cycle, status); a **scheduler** generates invoices on each billing date, charges the method (retries/**dunning** on failure), handles **proration** (upgrades/downgrades), trials, cancellations, taxes. Events (invoice created, payment failed). Distributed scheduler for millions of subs; idempotent charging. **Challenges**: proration/plan changes, failed-payment dunning + involuntary churn, idempotency, billing-date scheduling at scale, taxes/currencies, invoice correctness.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Subs:     10M+ subscriptions; billing dates spread across the month
Charges:  on billing date → charge; fail → dunning retries (day 1,3,7)
Proration: mid-cycle plan change → prorated charge/credit

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Subscription  │  (plan, cycle, next_billing_date, status)
   │DB            │
   └──────┬───────┘
     due (distributed scheduler)
          ▼
   ┌──────────────┐
   │Billing Engine│  generate invoice (proration, tax)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Charge (idempo│  fail → dunning (retries) → involuntary churn
   │tent)         │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Events (invoice│
   │/payment-fail) │
   └──────────────┘
```

---

### Q240. Design recurring payments.
**Difficulty:** `Intermediate`
**Category:** FinTech & Payments

#### Answer
Automatically charge a stored method on a schedule (subscriptions, EMIs). Store a **mandate/token** (authorization), a schedule (`next_charge_at`), and a distributed scheduler that picks due charges and processes them idempotently with retries/dunning. Notify on success/failure; handle method expiry. **Challenges**: idempotent charging, failed-payment handling (retries, grace, dunning), scheduling at scale, method expiry (account updater), mandates/compliance, notifications.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Mandates: millions of stored tokens + schedules
Charges:  distributed scheduler fires due charges → idempotent
Expiry:   card expiry → account updater refreshes token

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Mandate + Sched│  token + next_charge_at
   │DB            │
   └──────┬───────┘
     due (distributed scheduler)
          ▼
   ┌──────────────┐
   │Charge Service│  idempotent; fail → retries/dunning (grace period)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Notify + Update│  success/failure; account updater on card expiry
   └──────────────┘
```

---

### Q241. Design an invoice generation system.
**Difficulty:** `Intermediate`
**Category:** FinTech & Payments

#### Answer
Generate invoices from billing events: compute line items, taxes, discounts, totals → immutable invoice (unique number) → render (PDF) → deliver (email) → track status (paid/unpaid/overdue). Adjustments via **credit notes** (new docs, not edits). Async generation (queue + workers); PDFs in object storage. **Challenges**: correct calculation (taxes/discounts/proration), immutability + **sequential numbering** (legal), idempotency (no duplicate invoices), rendering at scale, multi-currency/tax jurisdictions, delivery + status.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   millions of invoices/month (async generation)
Numbering: sequential + immutable (legal requirement)
Storage:  PDFs → object storage; invoice records in DB

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Billing Event │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Invoice Engine│  compute line items + tax + discounts (idempotent)
   └──────┬───────┘
     immutable invoice (unique sequential #)
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Render (PDF)  │───────►│Object Storage│
   └──────┬───────┘        └──────────────┘
          ▼
   ┌──────────────┐
   │Email + Status│  paid/unpaid/overdue; adjustments = credit notes
   └──────────────┘
```

---

### Q242. Design a refund system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Reverse a payment (full or partial): validate the original (not already fully refunded, within window), create a **refund transaction** in the ledger (credit customer), call the processor to return funds, update order/invoice status. **Idempotent** (no double refund), consistent with the ledger. Async (processor may be slow) with status tracking. **Challenges**: idempotency, partial refunds (track remaining refundable), consistency (ledger + processor), reconciliation, refund window/policy, processor failures (retries + status).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Refunds:  subset of payments; must never double-refund
Partial:  track remaining refundable amount per original payment
Async:    processor return may be slow → status tracking

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Refund Request│  (+ Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Refund Service│  validate (refundable amount, window)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Ledger    ││Processor     │  return funds (retries + status)
 │(credit   ││              │
 │ customer)│└──────────────┘
 └──────────┘
Update order/invoice; reconcile. Idempotent (no double refund).
```

---

### Q243. Design payment failure recovery.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
Handle failures without losing/duplicating money. For **unknown outcomes** (timeout after sending), **query status** before acting. Durable state machine + **reconciliation** detects and fixes stuck transactions (debited-not-credited → reverse). Idempotency keys make retries safe; Saga compensations undo partial multi-step flows. **Challenges**: unknown-outcome handling (status query), stuck/in-limbo txns (reconciliation + auto-reversal), idempotency, compensation, consistency (money never lost/duplicated), anomaly alerting.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Unknown outcome: timeout → query status (never blindly retry)
Stuck txn: reconciliation finds debited-not-credited → auto-reverse
Consistency: money never lost or duplicated

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Payment (fail/│
   │ timeout)     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Recovery Logic│
   └──────┬───────┘
    ┌─────┴─────────────┐
    ▼ unknown outcome   ▼ partial multi-step
 ┌────────────┐   ┌──────────────┐
 │Query status│   │ Saga compensate
 │before retry│   │ (undo prior steps)
 └────────────┘   └──────────────┘
          ▼
   ┌──────────────┐
   │Reconciliation│  detect stuck (debited-not-credited) → reverse + alert
   └──────────────┘
```

---

### Q244. Design a financial notification system.
**Difficulty:** `Intermediate`
**Category:** FinTech & Payments

#### Answer
Notify users of financial events (transactions, low balance, payment success/failure, statements) reliably and **exactly the right number of times**. Publish events (Kafka) → per-channel workers → providers, honoring preferences. **Idempotency** critical (never send "charged" twice, never miss it). Prioritize security-critical alerts. **Challenges**: idempotency (no duplicate/missed alerts), reliability (guaranteed critical delivery), prioritization, security (minimal sensitive content), preferences/compliance, provider failover.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Volume:   every transaction → notification → millions/day
Idempotency: never double-send "you were charged"; never miss it
Priority:  security alerts (large txn, login) > marketing

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Financial Event│  (txn, low balance, payment status)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Kafka topic   │  (priority topics for critical alerts)
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌──────┐┌──────┐
 │Push  ││Email ││ SMS  │  (dedupe by event id; minimal content)
 └──────┘└──────┘└──────┘
Honor preferences/compliance; provider failover; guaranteed delivery for critical.
```

---

### Q245. Design a high-consistency financial transaction system.
**Difficulty:** `Hard`
**Category:** FinTech & Payments

#### Answer
For money, favor **strong consistency (CP)** over availability: ACID transactions (single DB or distributed ACID DB like Spanner/CockroachDB), a **double-entry ledger**, **idempotency**, and for cross-service/shard flows a **Saga** with compensations (or 2PC where truly needed). Accept lower availability during partitions rather than risk inconsistency. **Challenges**: strong consistency at scale (distributed ACID or careful sharding), atomicity across accounts (Saga/2PC), idempotency, no double-spend/negative (locks), auditability, availability trade-off (CP over AP).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Consistency: STRONG (CP) — reject/block during partitions vs risk inconsistency
Storage:  ACID DB (single or Spanner/CockroachDB) + double-entry ledger
Cross-shard: Saga (compensations) or 2PC where strict atomicity needed

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Financial Txn │  (+ Idempotency-Key)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Transaction   │  ACID (strong consistency, CP)
   │Service       │
   └──────┬───────┘
    ┌─────┴─────────────┐
    ▼ single shard      ▼ cross-shard
 ┌────────────┐   ┌──────────────┐
 │ACID tx +   │   │ Saga (compensa│
 │double-entry│   │ tions) / 2PC │
 │ledger(locks│   └──────────────┘
 │→no double- │
 │spend)      │
 └────────────┘
Choose consistency over availability during partitions. Full audit trail.
```

---
