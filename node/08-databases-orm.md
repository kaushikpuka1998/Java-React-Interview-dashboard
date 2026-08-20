# Databases & ORMs Interview Questions (Q1 – Q70)

---

### Q1. How do you connect to a database in Node?
**Difficulty:** `Basic`
**Category:** Databases & ORMs

#### Answer
Use a driver (`pg`, `mysql2`, `mongodb`) or an ORM (Prisma, Sequelize, TypeORM). Create a connection or pool once at startup and reuse it across requests.

#### Code Example
```js
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DB_URL })
```
---

### Q2. What is a connection pool and why use one?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
A pool maintains a set of reusable open connections, avoiding the cost of opening/closing per query and capping total concurrent connections to protect the database. Requests borrow and return connections.

#### Code Example
```js
const pool = new Pool({ max: 20 })
const { rows } = await pool.query('SELECT 1')
```
---

### Q3. Why not open a new DB connection per request?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
Connecting is expensive (handshake/auth) and databases limit total connections. Per-request connections cause latency and can exhaust the DB's connection limit under load. Pools solve both.

#### Code Example
```js
// reuse pool.query, never new Client() per request
```
---

### Q4. What is SQL injection and how do you prevent it?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
SQL injection inserts malicious SQL via unsanitized input. Prevent it with parameterized queries/prepared statements, which send data separately from the query so it's never executed as SQL.

#### Code Example
```js
pool.query('SELECT * FROM users WHERE id = $1', [id]) // safe
```
---

### Q5. What is the difference between parameterized queries and string concatenation?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
String concatenation mixes untrusted data into the SQL text (injectable). Parameterized queries send the query structure and values separately; the driver/DB binds values as data, immune to injection and often cached/prepared.

#### Code Example
```js
// NEVER: `WHERE name = '${name}'`
db.query('WHERE name = $1', [name])
```
---

### Q6. What is an ORM and what are its trade-offs?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
An ORM maps DB tables to objects, generating SQL and handling relations/migrations. Pros: productivity, safety, portability. Cons: abstraction leaks, N+1 pitfalls, less control over complex/optimized queries.

#### Code Example
```js
const user = await prisma.user.findUnique({ where: { id } })
```
---

### Q7. What is the difference between SQL and NoSQL databases?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
SQL (relational) uses fixed schemas, joins, and strong consistency/transactions. NoSQL (document/key-value/graph) offers flexible schemas and horizontal scaling, often with eventual consistency. Choose by data shape and consistency needs.

#### Code Example
```js
// SQL: JOIN across tables; MongoDB: embedded documents
```
---

### Q8. What is the N+1 query problem?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Loading a list then querying related rows one-by-one issues 1 + N queries. Fix by eager loading (join/include), batching with `IN`, or a DataLoader that coalesces lookups.

#### Code Example
```js
const users = await prisma.user.findMany({ include: { orders: true } }) // one round trip
```
---

### Q9. What is a database transaction?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
A transaction groups operations so they all succeed (commit) or all fail (rollback), preserving consistency. Essential for multi-step changes like transferring funds.

#### Code Example
```js
await prisma.$transaction([debit, credit]) // both or neither
```
---

### Q10. What does ACID stand for?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Atomicity (all-or-nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), Durability (committed data survives crashes). Relational DBs provide ACID guarantees.

#### Code Example
```js
BEGIN; UPDATE ...; UPDATE ...; COMMIT; -- atomic + durable
```
---

### Q11. What are transaction isolation levels?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Read Uncommitted, Read Committed, Repeatable Read, Serializable — increasing isolation and cost. They control anomalies (dirty/non-repeatable reads, phantoms). Higher isolation reduces concurrency; pick per use case.

#### Code Example
```js
await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE')
```
---

### Q12. What is a dirty read?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
A dirty read reads data written by another transaction that hasn't committed yet and might roll back, so you may act on data that never truly existed. Read Committed and above prevent it.

#### Code Example
```js
// avoided at READ COMMITTED and higher
```
---

### Q13. How do you run a transaction with a driver like `pg`?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Check out a single client from the pool, issue `BEGIN`, run queries, then `COMMIT` (or `ROLLBACK` on error), and always release the client.

#### Code Example
```js
const c = await pool.connect()
try { await c.query('BEGIN'); await c.query(sql); await c.query('COMMIT') }
catch (e) { await c.query('ROLLBACK'); throw e } finally { c.release() }
```
---

### Q14. What is optimistic vs pessimistic locking?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Optimistic locking assumes low contention: it checks a version column at update time and retries on conflict. Pessimistic locking locks rows (`SELECT ... FOR UPDATE`) upfront, blocking others. Optimistic scales better; pessimistic suits hot contention.

#### Code Example
```js
UPDATE t SET x=$1, version=version+1 WHERE id=$2 AND version=$3
```
---

### Q15. What is `SELECT ... FOR UPDATE`?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
It locks the selected rows within a transaction so other transactions can't modify them until commit, implementing pessimistic locking to prevent concurrent update conflicts.

#### Code Example
```js
await c.query('SELECT balance FROM acct WHERE id=$1 FOR UPDATE', [id])
```
---

### Q16. What is database indexing?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
An index is a data structure (usually B-tree) that speeds up lookups/sorts on indexed columns at the cost of extra storage and slower writes. Index columns used in `WHERE`, `JOIN`, and `ORDER BY`.

#### Code Example
```js
CREATE INDEX idx_users_email ON users(email);
```
---

### Q17. When can an index hurt performance?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Indexes slow down INSERT/UPDATE/DELETE (must be maintained) and consume storage. Too many or unused indexes waste resources; low-cardinality columns benefit little. Index selectively based on query patterns.

#### Code Example
```js
// avoid indexing a boolean column with 50/50 distribution
```
---

### Q18. What is a composite index and column order?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
A composite index covers multiple columns; order matters. It serves queries filtering on a left-prefix of its columns. `(a,b)` helps `WHERE a` and `WHERE a AND b`, but not `WHERE b` alone.

#### Code Example
```js
CREATE INDEX idx ON t(status, created_at); -- helps WHERE status ORDER BY created_at
```
---

### Q19. How do you analyze a slow query?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Use `EXPLAIN ANALYZE` to see the query plan — whether it uses indexes or does sequential scans, join methods, and row estimates vs actuals. Then add indexes or rewrite the query.

#### Code Example
```js
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 5;
```
---

### Q20. What is a database migration?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
A migration is a versioned, incremental schema change (create table, add column) tracked in code so environments stay in sync and changes are reproducible and reversible.

#### Code Example
```js
npx prisma migrate dev --name add_orders
```
---

### Q21. How do you perform zero-downtime schema migrations?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Make changes backward-compatible and multi-step: add nullable column → backfill → deploy code using it → enforce constraint → remove old column later. Never rename/drop in a single deploy while old code runs.

#### Code Example
```js
// step1: ADD COLUMN email_new; step2: backfill; step3: switch reads/writes
```
---

### Q22. What is the difference between `findOne` and `findMany`?
**Difficulty:** `Basic`
**Category:** Databases & ORMs

#### Answer
`findOne`/`findUnique` returns a single record (or null); `findMany` returns an array. Use unique lookups for single entities and filtered/paged queries for lists.

#### Code Example
```js
const u = await prisma.user.findUnique({ where: { email } })
const many = await prisma.user.findMany({ where: { active: true } })
```
---

### Q23. What is eager vs lazy loading of relations?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Eager loading fetches related data with the main query (`include`/`join`), avoiding extra round trips. Lazy loading fetches relations on access, which is convenient but can trigger N+1 queries.

#### Code Example
```js
prisma.post.findMany({ include: { author: true } }) // eager
```
---

### Q24. What is a DataLoader and how does it help?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
DataLoader batches individual key lookups made within a tick into a single query and caches per request, eliminating N+1 in GraphQL/REST resolvers.

#### Code Example
```js
const loader = new DataLoader(ids => db.users.findByIds(ids))
await loader.load(1) // batched with other loads
```
---

### Q25. How do you model relationships in MongoDB?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Embed related data for one-to-few, tightly-coupled data read together; reference (store IDs) for one-to-many/many-to-many or independently-updated data. Balance read efficiency against duplication and document size limits.

#### Code Example
```js
// embed comments in a post, or reference authorId
{ title, comments: [{ text }], authorId: ObjectId('...') }
```
---

### Q26. What is the aggregation pipeline in MongoDB?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
A sequence of stages (`$match`, `$group`, `$sort`, `$lookup`, `$project`) that transform documents, enabling complex analytics/joins server-side without pulling data into the app.

#### Code Example
```js
db.orders.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$userId', total: { $sum: '$amount' } } }])
```
---

### Q27. What is `$lookup` in MongoDB?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
`$lookup` performs a left outer join between collections in an aggregation, joining documents by matching fields — MongoDB's answer to SQL joins.

#### Code Example
```js
{ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } }
```
---

### Q28. How do you handle schema validation in MongoDB?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Use an ODM like Mongoose with schemas, or MongoDB's built-in JSON Schema validators on collections. Validation enforces structure despite MongoDB's flexible documents.

#### Code Example
```js
const User = mongoose.model('User', new Schema({ email: { type: String, required: true } }))
```
---

### Q29. What is Mongoose?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
Mongoose is an ODM for MongoDB providing schemas, validation, middleware (hooks), population (references), and typed models over the raw driver.

#### Code Example
```js
const u = await User.findById(id).populate('orders')
```
---

### Q30. What is the difference between Prisma, Sequelize, and TypeORM?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Prisma uses a schema file + generated type-safe client (great DX/TS). Sequelize is a mature ORM with a JS API. TypeORM uses decorators/entities (Active Record or Data Mapper). Choose by type-safety, patterns, and ecosystem fit.

#### Code Example
```js
const users = await prisma.user.findMany() // fully typed
```
---

### Q31. What is a prepared statement?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
A prepared statement is a parameterized query the DB parses/plans once and reuses with different values, improving performance and preventing injection. Drivers often prepare parameterized queries automatically.

#### Code Example
```js
const stmt = db.prepare('INSERT INTO t(x) VALUES(?)'); stmt.run(1); stmt.run(2)
```
---

### Q32. How do you paginate database results efficiently?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Prefer keyset/cursor pagination (`WHERE id > :last ORDER BY id LIMIT n`) using an indexed column over `OFFSET`, which scans and skips rows and degrades on large offsets.

#### Code Example
```js
SELECT * FROM t WHERE id > $1 ORDER BY id LIMIT 20
```
---

### Q33. What is connection pool exhaustion and how do you avoid it?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
It happens when all pooled connections are busy (leaked, held by long transactions, or too-small pool), causing requests to queue/timeout. Avoid by releasing clients promptly, sizing the pool, and setting query timeouts.

#### Code Example
```js
try { await c.query(sql) } finally { c.release() } // always release
```
---

### Q34. How do you size a connection pool?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Base it on the DB's max connections divided across app instances, workload concurrency, and query latency — not "bigger is better". Too large overwhelms the DB; too small starves the app. Measure and tune.

#### Code Example
```js
new Pool({ max: 20 }) // per instance; sum across instances < DB limit
```
---

### Q35. What is a read replica and when do you use it?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
A read replica is a copy that serves read queries, offloading the primary. Use it to scale reads, but account for replication lag (eventual consistency) — route critical read-after-write to the primary.

#### Code Example
```js
const rows = await replicaPool.query('SELECT ...') // reads off replica
```
---

### Q36. What is replication lag and how do you handle it?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Replication lag is the delay before a write appears on replicas, so a read right after a write may return stale data. Handle by reading from the primary for read-after-write, or waiting for the replica to catch up.

#### Code Example
```js
// after write, read from primary to avoid stale replica data
```
---

### Q37. What is sharding?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Sharding partitions data horizontally across multiple servers by a shard key, so each holds a subset. It scales writes/storage beyond one machine but complicates cross-shard queries and transactions.

#### Code Example
```js
// shard by user_id % N -> route query to the right shard
```
---

### Q38. What is a caching layer and cache invalidation?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
A cache (Redis) stores frequently-read data to reduce DB load/latency. Invalidation — expiring or updating stale entries on writes — is the hard part; strategies include TTLs, write-through, and cache-aside.

#### Code Example
```js
let u = await redis.get(k) ?? await db.user(id).then(v => (redis.set(k, v, 'EX', 60), v))
```
---

### Q39. What is the cache-aside pattern?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
The app checks the cache first; on a miss it loads from the DB and populates the cache. Writes update the DB and invalidate the cached entry. It's simple and common but risks brief staleness.

#### Code Example
```js
const hit = await cache.get(k); if (hit) return hit
const v = await db.get(k); await cache.set(k, v); return v
```
---

### Q40. What is Redis and what is it used for in Node apps?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
Redis is an in-memory data store used for caching, session storage, rate limiting, pub/sub, queues, and leaderboards. Its speed and data structures make it a versatile companion to a primary DB.

#### Code Example
```js
await redis.set('session:abc', JSON.stringify(user), 'EX', 3600)
```
---

### Q41. How do you use Redis for sessions across multiple instances?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Store session data in Redis (shared) instead of process memory, so any instance can serve any request without sticky sessions. Set TTLs matching session expiry.

#### Code Example
```js
app.use(session({ store: new RedisStore({ client: redis }), secret }))
```
---

### Q42. What is a database deadlock?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
A deadlock occurs when two transactions each hold a lock the other needs, waiting forever. The DB detects it and aborts one (a deadlock error). Avoid by acquiring locks in a consistent order and keeping transactions short.

#### Code Example
```js
// always update tables/rows in the same order to avoid cycles
```
---

### Q43. How do you handle transient DB errors and retries?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Retry only retryable errors (deadlock, serialization failure, connection reset) with backoff, and make the operation idempotent or wrap it in a transaction. Don't blindly retry non-idempotent writes.

#### Code Example
```js
for (let i = 0; i < 3; i++) { try { return await tx() } catch (e) { if (!isRetryable(e)) throw e } }
```
---

### Q44. What is the difference between `LEFT JOIN` and `INNER JOIN`?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
INNER JOIN returns only matching rows in both tables. LEFT JOIN returns all rows from the left table plus matches (NULLs where none). Choose based on whether unmatched left rows should appear.

#### Code Example
```js
SELECT u.*, o.id FROM users u LEFT JOIN orders o ON o.user_id = u.id;
```
---

### Q45. How do you prevent over-fetching data from the DB?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Select only needed columns (not `SELECT *`), paginate, filter at the DB, and avoid loading unused relations. Less data transferred means lower latency and memory.

#### Code Example
```js
prisma.user.findMany({ select: { id: true, name: true } })
```
---

### Q46. What are database constraints and why enforce them at the DB level?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Constraints (NOT NULL, UNIQUE, FOREIGN KEY, CHECK) enforce data integrity regardless of app bugs or multiple writers. The DB is the last line of defense; app-only validation can be bypassed.

#### Code Example
```js
CREATE TABLE users (email TEXT UNIQUE NOT NULL);
```
---

### Q47. How do you handle unique constraint violations gracefully?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Attempt the insert and catch the unique-violation error code, returning a 409 Conflict, or use an upsert (`ON CONFLICT`). Checking-then-inserting has a race window.

#### Code Example
```js
INSERT INTO users(email) VALUES($1) ON CONFLICT (email) DO NOTHING;
```
---

### Q48. What is an upsert?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
An upsert inserts a row or updates it if it already exists, atomically. It avoids race conditions from separate check/insert/update logic.

#### Code Example
```js
prisma.user.upsert({ where: { email }, create: { email }, update: { seen: new Date() } })
```
---

### Q49. What is the difference between soft delete and hard delete?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Hard delete removes the row permanently. Soft delete sets a `deleted_at`/`is_deleted` flag, preserving data for audit/recovery while filtering it from normal queries. Soft delete needs consistent query filters and indexes.

#### Code Example
```js
UPDATE users SET deleted_at = now() WHERE id = $1;
```
---

### Q50. How do you store timestamps and time zones correctly?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Store timestamps in UTC (`timestamptz`), convert to local time only for display. Storing local times without offsets causes bugs across zones and DST changes.

#### Code Example
```js
INSERT INTO events(at) VALUES (now() AT TIME ZONE 'UTC');
```
---

### Q51. What is database normalization?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Normalization organizes data to reduce redundancy via related tables (1NF–3NF), improving integrity and update efficiency. It can require more joins for reads, which denormalization selectively trades away.

#### Code Example
```js
// separate users and addresses tables instead of repeating address columns
```
---

### Q52. When would you denormalize?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Denormalize (duplicate data) to speed up read-heavy paths by avoiding expensive joins/aggregations, accepting extra write complexity and update anomalies. Common in analytics, caches, and NoSQL.

#### Code Example
```js
// store order_count on user to avoid COUNT(*) per request
```
---

### Q53. How do you seed and manage test data?
**Difficulty:** `Intermediate`
**Category:** Databases & ORMs

#### Answer
Use seed scripts/migrations to create deterministic data, wrap tests in transactions that roll back, or reset a test database between runs to keep tests isolated and repeatable.

#### Code Example
```js
beforeEach(async () => { await db.query('BEGIN') })
afterEach(async () => { await db.query('ROLLBACK') })
```
---

### Q54. What is an ORM query builder vs raw SQL?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
Query builders (Knex) compose SQL programmatically with safety and portability; raw SQL gives full control for complex/optimized queries. Most apps mix both — builder/ORM for CRUD, raw for hotspots.

#### Code Example
```js
knex('users').where('active', true).select('id', 'name')
```
---

### Q55. How do you handle large bulk inserts efficiently?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Batch rows into multi-row inserts or use `COPY`/bulk APIs, wrap in a transaction, and disable per-row overhead. Inserting one-by-one is slow due to round trips.

#### Code Example
```js
INSERT INTO t(a,b) VALUES ($1,$2),($3,$4),($5,$6); -- batched
```
---

### Q56. What is a stored procedure and when use one?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
A stored procedure is logic stored/executed in the DB. Use it for data-intensive operations to reduce round trips and enforce logic centrally, at the cost of portability and harder version control.

#### Code Example
```js
await db.query('CALL transfer_funds($1, $2, $3)', [from, to, amt])
```
---

### Q57. How do you monitor database performance from Node?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Log slow queries with durations, track pool metrics (active/idle/waiting), expose DB latency in APM/metrics, and use the DB's own slow-query log and `pg_stat_statements` to find hotspots.

#### Code Example
```js
const t = Date.now(); await pool.query(sql); metrics.timing('db', Date.now() - t)
```
---

### Q58. What is the difference between `count(*)` performance in SQL and estimates?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Exact `COUNT(*)` on large tables scans many rows and can be slow. For approximate totals (e.g. pagination UI), use planner estimates (`pg_class.reltuples`) or maintained counters instead.

#### Code Example
```js
SELECT reltuples::bigint FROM pg_class WHERE relname = 'orders'; -- estimate
```
---

### Q59. How do you implement full-text search?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Use the DB's full-text features (Postgres `tsvector`/GIN index, Mongo text index) for basic search, or a dedicated engine (Elasticsearch/OpenSearch) for advanced relevance, facets, and scale.

#### Code Example
```js
SELECT * FROM docs WHERE to_tsvector(body) @@ to_tsquery('node & stream');
```
---

### Q60. What is eventual consistency?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
In eventually-consistent systems, replicas converge to the same state over time but may return stale reads briefly. It trades immediate consistency for availability/scale (CAP), acceptable for many read-heavy features.

#### Code Example
```js
// a just-written value may not appear on a replica read immediately
```
---

### Q61. What is the CAP theorem?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Under a network partition, a distributed system can guarantee at most two of Consistency, Availability, Partition tolerance. Since partitions happen, you effectively choose CP (reject to stay consistent) or AP (serve possibly-stale data).

#### Code Example
```js
// CP: refuse writes during partition; AP: accept and reconcile later
```
---

### Q62. How do you avoid leaking DB credentials?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Load credentials from environment/secret managers, never hardcode or commit them, use least-privilege DB users, rotate secrets, and require TLS to the database.

#### Code Example
```js
new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: true } })
```
---

### Q63. How do you implement audit logging of data changes?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Record who/what/when for changes via triggers, an audit table, or app-level change events (outbox). Keep audit records immutable and separate from operational data.

#### Code Example
```js
INSERT INTO audit(table, row_id, action, actor, at) VALUES(...);
```
---

### Q64. What is the transactional outbox pattern?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Write domain changes and an event row in the same DB transaction (the "outbox"); a separate process publishes those events to a message broker. It guarantees the event is sent iff the data change committed, avoiding dual-write inconsistency.

#### Code Example
```js
await tx([saveOrder, insertOutboxEvent]) // atomic; publisher reads outbox later
```
---

### Q65. How do you handle migrations in a team/CI setting?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Keep migrations in version control, apply them automatically in CI/CD before deploy, make them forward-only and idempotent where possible, and coordinate to avoid conflicting concurrent migrations.

#### Code Example
```js
npx prisma migrate deploy // applies pending migrations in CI/prod
```
---

### Q66. What is connection string SSL and why require it?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
SSL/TLS encrypts traffic between app and DB, protecting credentials/data in transit from eavesdropping, especially across networks/cloud. Verify the server certificate to prevent MITM.

#### Code Example
```js
ssl: { rejectUnauthorized: true, ca: fs.readFileSync('rds-ca.pem') }
```
---

### Q67. How do you handle schema drift between environments?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Make migrations the single source of truth, run the same migrations everywhere, and detect drift with tools that diff the live schema against expected. Avoid manual production changes.

#### Code Example
```js
npx prisma migrate status // reports drift/pending migrations
```
---

### Q68. What is the difference between `TRUNCATE` and `DELETE`?
**Difficulty:** `Advanced`
**Category:** Databases & ORMs

#### Answer
`DELETE` removes rows one by one (logged, respects triggers, can be filtered/rolled back). `TRUNCATE` quickly empties a whole table by deallocating pages (faster, resets sequences, fewer logs) but can't be filtered.

#### Code Example
```js
TRUNCATE TABLE temp_import; -- fast full clear
```
---

### Q69. How do you avoid loading huge result sets into memory?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Stream/cursor through results in chunks instead of buffering all rows. Drivers offer server-side cursors or query streams that emit rows incrementally.

#### Code Example
```js
const stream = pool.query(new QueryStream('SELECT * FROM big'))
for await (const row of stream) process(row)
```
---

### Q70. How do you choose between SQL and NoSQL for a project?
**Difficulty:** `Experienced`
**Category:** Databases & ORMs

#### Answer
Choose SQL for relational data, strong consistency, complex queries, and transactions. Choose NoSQL for flexible/evolving schemas, massive scale, or specific access patterns (document/key-value/graph). Many systems use both (polyglot persistence).

#### Code Example
```js
// orders/payments -> Postgres; session/cache -> Redis; catalog -> Mongo
```
---
