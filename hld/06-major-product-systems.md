# HLD — Major Product System Design Interview Questions (Q186–Q220)

*Each answer includes Back-of-the-Envelope estimation and a top-to-bottom architecture flow you can redraw on a whiteboard.*

---

### Q186. Design WhatsApp.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Functional**: 1:1 & group messaging, delivery/read receipts, presence, media, offline delivery. **Core**: persistent **WebSocket** connections to gateways; messages routed via a **pub/sub backplane** so a sender on gateway A reaches a recipient on gateway B; store until delivered, then delete (privacy). Offline → push. **Challenges**: connection scale, ordering, receipts, presence, group fan-out, E2E encryption.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    2B users, ~500M concurrent connections
Messages: 100B msgs/day = ~1.15M msgs/sec (peak ~3M)
Conns/node: ~100k → ~5,000 gateway nodes
Storage:  transient (delete on delivery) + media in object storage + CDN

── ARCHITECTURE (top → bottom) ──
   ┌──────────┐          ┌──────────┐
   │ Client A │          │ Client B │
   └────┬─────┘          └────┬─────┘
    WebSocket             WebSocket
        ▼                     ▼
   ┌──────────┐          ┌──────────┐
   │Gateway N1│          │Gateway N2│
   └────┬─────┘          └────▲─────┘
        │ publish       subscribe
        ▼                     │
   ┌────────────────────────────────┐
   │  Pub/Sub Backplane (Kafka)     │
   └────┬───────────────────────────┘
        ▼
   ┌──────────────┐   ┌──────────────┐
   │ Message Store│   │ Push Service │ (offline → APNs/FCM)
   │ (until deliv)│   └──────────────┘
   └──────────────┘
Media: object storage + CDN. E2E encryption end-to-end.
```

---

### Q187. Design Telegram.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Like WhatsApp but **cloud-based** (messages stored server-side, multi-device sync) with huge **channels** (broadcast to millions). Persistent connections, sharded message storage per chat, fan-out for mega-channels, per-user sequence for sync. **Challenges**: multi-device sync (ordering/sequence), mega-channel broadcast (fan-out-on-read), media (CDN), secret chats (E2E).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    800M MAU, ~100M concurrent
Messages: 50B/day = ~580k/sec; mega-channel = 1 post → 10M reads
Storage:  cloud-stored → 50B × 300 B/day = ~15 TB/day (shard by chat)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Client (multi │  sync via per-user seq
   │  device)     │
   └──────┬───────┘
      WebSocket
          ▼
   ┌──────────────┐
   │   Gateway    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Message Svc  │
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌────────┐ ┌──────────────┐
 │Chat DB │ │Channel Fan-out│ (fan-out-on-read for mega-channels)
 │(sharded│ └──────────────┘
 │by chat)│
 └────────┘
Media → CDN. Secret chats → E2E.
```

---

### Q188. Design Slack.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: workspaces → channels → threaded messages, real-time via WebSocket, search, mentions, integrations. Store per channel (sharded by workspace), per-user unread state, fan-out to members via backplane. Full-text search (Elasticsearch). **Challenges**: real-time fan-out, unread counts, search, threading, presence, integrations/webhooks.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    20M DAU, workspaces of 10–100k users
Messages: 5B/day = ~58k/sec; fan-out to channel members
Storage:  5B × 500 B/day = ~2.5 TB/day (shard by workspace) + search index

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
      WebSocket
          ▼
   ┌──────────────┐
   │   Gateway    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Message Service│──► fan-out to channel members (backplane)
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────────┐
 │ Msg  ││Unread  ││Elasticsearch │
 │ DB   ││ state  ││ (search)     │
 │(shard││(per    │└──────────────┘
 │ by ws)││ user) │
 └──────┘└────────┘
Integrations/webhooks (rate-limited).
```

---

### Q189. Design Discord.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: servers (guilds) → text + **voice/video** channels; real-time messaging (WebSocket) + voice (WebRTC/SFU). Fan-out to online members; messages in Cassandra (huge write volume). Voice via SFU. **Challenges**: massive connections, voice (WebRTC+SFU), large-server presence, message history (Cassandra), roles/permissions.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    150M MAU, ~10M concurrent; big guilds = 100k+ members
Messages: 20B/day = ~230k/sec → Cassandra (write-optimized)
Storage:  trillions of messages → wide-column, sharded

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
   WebSocket │ WebRTC
      ┌──────┴──────┐
      ▼             ▼
 ┌──────────┐  ┌──────────┐
 │Text      │  │Voice     │
 │Gateway   │  │SFU (media│
 └────┬─────┘  │ forward) │
      ▼        └──────────┘
 ┌──────────────┐
 │Message Service│──► fan-out to online members
 └──────┬───────┘
        ▼
 ┌──────────────┐
 │  Cassandra   │  (messages, high write, sharded by channel)
 └──────────────┘
Roles/permissions per channel.
```

---

### Q190. Design Zoom.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: video meetings via **WebRTC**, media through **SFU** (each participant sends 1 upstream, SFU forwards to others — scales better than mesh, cheaper than MCU). WebSocket signaling; regional media servers; simulcast (multi-resolution); recording/screen-share. **Challenges**: low-latency media at scale, SFU/geo-routing, bandwidth adaptation, NAT (STUN/TURN), recording.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Meetings: 300M participants/day; avg meeting 10 people
Media:    1 upstream/user, N downstreams via SFU → SFU CPU is the bottleneck
Bandwidth: ~1.5 Mbps/stream → huge egress → regional media servers

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Participant │
   └──────┬───────┘
  (1) WebSocket signaling (SDP/ICE)
          ▼
   ┌──────────────┐
   │Signaling Svc │──► sets up WebRTC
   └──────┬───────┘
  (2) media (WebRTC/UDP)
          ▼
   ┌──────────────┐
   │ Regional SFU │  forward streams (not mesh/mix)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌────────┐ ┌────────────┐
 │Other   │ │ Recording  │
 │partic. │ │ Service    │
 └────────┘ └────────────┘
Simulcast + STUN/TURN. Geo-route to nearest SFU.
```

---

### Q191. Design Google Meet.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Architecturally like Zoom: **WebRTC** media via regional **SFUs**, WebSocket signaling, simulcast/SVC adaptive quality, STUN/TURN. Browser-first, Google-account/Calendar integration. Large meetings forward only active speakers. **Challenges**: browser low-latency media, adaptive bitrate, large-meeting scaling, NAT, media-server failover.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Similar to Zoom: millions of concurrent participants, ~1.5 Mbps/stream
Large meetings: forward active speakers only (not all N streams)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Browser Client│
   └──────┬───────┘
    WebSocket signaling
          ▼
   ┌──────────────┐
   │Signaling Svc │  (+ Calendar/auth integration)
   └──────┬───────┘
      WebRTC media
          ▼
   ┌──────────────┐
   │ Regional SFU │  SVC/simulcast, active-speaker forwarding
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Other partic. │
   └──────────────┘
STUN/TURN for NAT; media-server failover.
```

---

### Q192. Design a video conferencing system (generic).
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: signaling (WebSocket) exchanges SDP/ICE; **WebRTC** media; topology: mesh (tiny groups), MCU (mix — heavy CPU), or **SFU** (forward — standard). STUN/TURN (NAT), simulcast/SVC, recording, regional media servers. **Challenges**: topology by group size, low latency, bandwidth adaptation, NAT, scaling media servers.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Topology by size: mesh (<4, N² connections), SFU (standard), MCU (mix, heavy)
Bandwidth: ~1.5 Mbps/stream; SFU CPU scales with participants

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Participant │
   └──────┬───────┘
     signaling (WebSocket)
          ▼
   ┌──────────────┐
   │Signaling Svc │  exchange SDP + ICE candidates
   └──────┬───────┘
      WebRTC media
          ▼
   ┌──────────────┐
   │ SFU (forward)│  (or MCU=mix / mesh=P2P)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Other partic. │
   └──────────────┘
STUN/TURN, simulcast/SVC, recording, regional servers.
```

---

### Q193. Design YouTube.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Upload** → object storage → **transcode** (async, multiple resolutions, HLS/DASH segments) → **CDN**. Adaptive bitrate playback; metadata DB (sharded); search (ES); recommendations (ML); view counts (distributed counters). **Challenges**: massive storage/egress (CDN + tiering), transcoding at scale, adaptive streaming, recommendations, view-count accuracy, global delivery.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Uploads:  500 hrs/min → huge transcode farm
Views:    5B views/day = ~58k/sec → 99% served by CDN
Storage:  ~1 EB total; each video → 5+ transcoded renditions
Egress:   petabytes/day → CDN offloads origin

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │  Uploader    │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Object Storage│──► event ──►┌──────────────┐
   │  (raw)       │             │Transcode Farm│
   └──────────────┘             │ (renditions, │
          ▲                     │  HLS/DASH)   │
  segments │                    └──────┬───────┘
          ▼                            ▼
   ┌──────────────┐             ┌──────────────┐
   │Object Storage│             │ Metadata DB  │
   │ (segments)   │             │ + Search(ES) │
   └──────┬───────┘             │ + Recs (ML)  │
          ▼                     └──────────────┘
   ┌──────────────┐
   │     CDN      │──► adaptive bitrate playback
   └──────────────┘
View counts → distributed counter.
```

---

### Q194. Design Netflix.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Content** pre-transcoded into many bitrates, pushed to **CDN edge caches** (Open Connect in ISPs) for low-latency streaming; clients do adaptive bitrate. Control plane: microservices (catalog, playback, recs) on cloud; recs via ML. **Challenges**: global delivery (edge + pre-positioning popular content), adaptive streaming, personalized recs, resilience (chaos), encoding efficiency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    250M subscribers; peak = large % streaming simultaneously
Bandwidth: video is 90%+ of internet egress in some regions → CDN critical
Encoding: each title → dozens of renditions (device/network)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
    (1) control plane
          ▼
   ┌──────────────┐
   │ Microservices│  catalog, playback, recs (ML) — on cloud
   └──────┬───────┘
    (2) get stream URL → nearest edge
          ▼
   ┌──────────────┐
   │ CDN Edge     │  Open Connect appliances (inside ISPs)
   │ (pre-cached  │
   │  popular)    │
   └──────┬───────┘
          ▼ adaptive bitrate
   ┌──────────────┐
   │  Playback    │
   └──────────────┘
Pre-position popular content at edges. Chaos engineering for resilience.
```

---

### Q195. Design Spotify.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Audio** transcoded to multiple bitrates → object storage → **CDN**; clients stream/prefetch + cache locally. Metadata DB; search (ES); recs (collaborative filtering + audio features, ML). Play events → Kafka (analytics/royalties). **Challenges**: low-latency streaming + offline caching, discovery/recs, playlists, royalty accounting (accurate play counting), search.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    500M MAU; 100M+ tracks × few bitrates
Streams:  billions/day → CDN offloads; each song ~3-5 MB
Play events: → Kafka for analytics + royalty counting

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │  prefetch + local cache (offline)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Music Service │
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────────┐
 │ CDN  ││Metadata││ Recs (ML:    │
 │(audio││ + ES   ││ collab filter│
 │)     ││ search ││ + audio feat)│
 └──────┘└────────┘└──────────────┘
Play events → Kafka → analytics + royalties.
```

---

### Q196. Design Instagram.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: photo/video upload → object storage + async processing → CDN; **feed** (fan-out-on-write for normal users, **fan-out-on-read** for celebrities), likes/comments, follow graph, stories, DMs. Sharded metadata; media via CDN. **Challenges**: feed generation (hybrid fan-out), celebrity problem, media scale, follow-graph queries, engagement counts.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    2B MAU, 500M DAU
Uploads:  100M posts/day; Reads: 50:1 → billions of feed loads/day
Feed:     precompute (fan-out-on-write) for most; on-read for celebs (>1M followers)
Storage:  media → object storage + CDN; metadata sharded

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  API Gateway │
   └──────┬───────┘
    ┌─────┴──────────┐
    ▼                ▼
 ┌──────────┐  ┌──────────────┐
 │Media     │  │ Feed Service │
 │Upload→S3 │  │ fan-out-write│──► followers' feed cache
 │→worker   │  │ (celebs: read)│
 │→CDN      │  └──────┬───────┘
 └──────────┘         ▼
              ┌──────────────┐
              │ Post DB +    │  follow graph (sharded)
              │ Feed Cache   │
              └──────────────┘
```

---

### Q196a. How does Instagram handle celebrity posts with millions of followers — push (fan-out-on-write) vs pull (fan-out-on-read)?
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Instagram uses a **hybrid fan-out** strategy. The naïve extremes both break at scale:

- **Pure push (fan-out-on-write)**: when a celebrity posts, the system writes the post into every follower's precomputed feed (timeline cache). For 100M followers that's 100M writes per post — the "celebrity problem". It blows up write amplification, cache memory, and write latency. Most of those followers never open the app.
- **Pure pull (fan-out-on-read)**: nothing is precomputed; each timeline read merges the celebrity's recent posts at request time. Writes are cheap, but reads get expensive as a user follows more celebrities, and latency/merge cost rise with follower counts.

**Instagram's hybrid model:**
1. **Regular users** (followers ≤ ~10k–100k, the threshold is internal) → **push**: on upload, an async fan-out worker pushes the post into each follower's feed cache (e.g., Redis sorted set per user, score = timestamp). Follower reads are O(1) lookups — fast and cheap.
2. **Celebrities** (millions of followers) → **pull**: skip the fan-out. The post is just written once to the post store and indexed.
3. **Read path**: timeline read = `push_cache_for_user` ∪ `pull_merged_recent_from_celebrities_I_follow`, ranked by a model (engagement, recency, affinity). The pull side is bounded — most users follow only a handful of celebrities — so the merge stays cheap.

**Why hybrid works:** it pushes only where writes are cheap (small follower sets) and pulls only where reads stay bounded (small set of celebrities per viewer). Neither side faces 100M amplification.

**Key components behind it:**
- **Kafka** for the fan-out pipeline — durable, partitioned per user_id so a single hot user doesn't choke the topic.
- **Redis** (sorted sets / `ZADD` with timestamp scores) for the per-user timeline cache; `ZREMRANGEBYRANK` to cap memory and evict old posts.
- **Postgres / sharded MySQL** for the post store; the source of truth.
- **Cassandra / wide-column** for celebrity post streams (high write rate, simple key lookups, append-only).
- **TAO-like graph store** for the follow graph, with a `is_celebrity` flag materialized on the celebrity's edge node.
- **CDN** for media; only the URL/pointer lives in the feed cache.
- **Ranking service** merges push + pull and applies ML scoring before returning the page.

**Operational details:**
- **Backpressure**: celebrity posts still need delivery — push is skipped but a lighter "notification fan-out" pushes only to *active* recent followers (people who opened the app in the last N days). This is what creates the "celebrity posted → notification for you" experience without fanning out to inactive accounts.
- **Cache invalidation**: a delete/edit publishes a tombstone on Kafka; the worker removes from each follower's feed cache. For celebrities (pull path), deletion just hides the post in the source stream.
- **Consistency**: feed is eventually consistent — acceptable for social timelines. Strong consistency is reserved for likes/view-counts and DMs.
- **Failure modes**: if Kafka is down, posts buffer in the producer's local outbox; if Redis is down, the read path falls back to "pull-only" mode until cache warms.
- **Hot-key protection**: per-user Redis shards + read replicas behind a consistent-hash ring; a celebrity stream is read by many followers but each follower's pull query is bounded.

**Back-of-envelope numbers (Instagram scale):**
- 500M DAU, ~100M posts/day, ~10B feed reads/day.
- Average follower count ≈ a few hundred; celebrity tail: a few thousand accounts with >1M followers.
- Pure push on a 100M-follower post = 100M Redis writes + 100M cache slots permanently consumed. Pure pull = merging 1k+ celebrity streams per read.
- Hybrid: push ≈ a few hundred writes per regular post; pull = merge ≤ tens of celebrities per read. Both sides stay within budget.

#### Code Example / Key Takeaways
```text
── HYBRID FAN-OUT PIPELINE ──
Producer (post service)
   │
   ▼
┌────────────┐  topic: posts.created  (partitioned by user_id)
│   Kafka    │
└─────┬──────┘
      ▼
┌──────────────────────────────────────────────┐
│           Fan-out Worker (consumers)         │
│                                              │
│  if follower_count <= THRESHOLD (regular):   │
│     → PUSH: ZADD timeline:{follower_id}      │
│             score = post.created_at_ms       │
│                                              │
│  if follower_count >  THRESHOLD (celebrity): │
│     → SKIP push; write to celeb_posts:{uid}  │
│     → enqueue "active followers" notif push  │
└──────────────────────────────────────────────┘

── READ PATH ──
GET /feed?user=U
   ├── push:  ZREVRANGE timeline:{U} 0 49        ← O(log N + 50)
   ├── pull:  for each celeb in followed_celebs(U):
   │             latest N from celeb_posts:{uid}  ← bounded
   └── rank:  merge(push, pull) → ML ranker → top 50

── CELEBRITY HOT-KEY ──
Problem:  1M followers × 1 post/sec = 1M cache writes/sec
Fix:      (a) skip fan-out (pull path)
          (b) Kafka partition by follower_id so writes spread
          (c) shard Redis: timeline:{uid} → slot = hash(uid) % 4096
          (d) notification fan-out limited to active_recent_followers(uid)
```

---

### Q197. Design Facebook.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: news feed (ranked, hybrid fan-out), **social graph** (TAO-like), posts/comments/likes, media (CDN), messaging, notifications, groups. Feed ranking via ML. Massive read scale → memcached tier + sharded stores. **Challenges**: feed ranking/generation, graph queries (friend-of-friend), cache invalidation, fan-out (celebrities/pages), count consistency, privacy rules, multi-region.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    3B MAU; reads dominate (feeds, profiles) → memcached tier
Feed:     ML-ranked; hybrid fan-out
Storage:  social graph (TAO) + posts + media (CDN), sharded, multi-region

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Web/API tier │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Memcached tier│  (huge read cache)
   └──────┬───────┘
    ┌─────┴──────────┐
    ▼                ▼
 ┌──────────┐  ┌──────────────┐
 │Social    │  │ Feed Ranking │  (ML)
 │Graph (TAO│  │  Service     │
 │sharded)  │  └──────────────┘
 └──────────┘
Media → CDN. Privacy/visibility rules enforced per query.
```

---

### Q198. Design LinkedIn.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: connection graph (degrees), profiles, feed, jobs, messaging, search/recs ("People You May Know" via graph). Graph engine + precompute for degree queries; feed fan-out; search via ES. **Challenges**: graph traversal at scale (2nd/3rd degree, PYMK), job matching, feed relevance, notification fan-out, recommendations (graph + ML).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    1B members; connection graph = billions of edges
PYMK:     precompute friend-of-friend (expensive graph traversal)
Search:   jobs ↔ candidates matching → ES + ML ranking

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  API Gateway │
   └──────┬───────┘
    ┌─────┼──────────┬───────────┐
    ▼     ▼          ▼           ▼
 ┌──────┐┌────────┐┌──────┐┌──────────┐
 │Profile││Graph   ││Feed  ││Search(ES)│
 │DB    ││Engine  ││Service││+ Jobs    │
 │      ││(degrees││      ││ matching │
 │      ││PYMK)   ││      ││          │
 └──────┘└────────┘└──────┘└──────────┘
PYMK/recs precomputed (graph + ML).
```

---

### Q199. Design Twitter/X.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: post tweets, **home timeline** (followed users' tweets), follow graph, likes/retweets, search/trends. Timeline: **fan-out-on-write** (push into followers' timeline cache) for most, **fan-out-on-read** for celebrities. Tweets sharded; timelines in Redis; trends via streaming. **Challenges**: timeline generation (hybrid fan-out), celebrity problem, real-time trends, search, read/write volume.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    400M MAU; 500M tweets/day = ~5,800/sec
Reads:    timeline loads ~300k/sec → Redis timeline cache
Celebs:   1 tweet → 100M followers → fan-out-on-read (don't push to 100M)
Storage:  tweets 500M/day × 300 B = ~150 GB/day (sharded)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Tweet Service │──► store tweet (sharded)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Fan-out Service│
   └──────┬───────┘
    ┌─────┴────────────┐
    ▼ (normal)         ▼ (celebrity)
 ┌────────────┐  ┌──────────────┐
 │Push to     │  │ Fan-out-on-  │
 │followers'  │  │ read (merge  │
 │timeline    │  │ at read time)│
 │cache(Redis)│  └──────────────┘
 └────────────┘
Trends → stream aggregation. Media → CDN.
```

---

### Q200. Design Reddit.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: subreddits → posts → **nested comments**, voting, **ranking** (hot/top/new via score + time decay). Comment trees (materialized path), votes (distributed counters), precomputed ranked listings (cached). Feed = subscribed subreddits. **Challenges**: comment-tree storage/rendering, ranking (hot score/decay), vote counting, caching listings, moderation.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    50M DAU; reads >> writes (lurkers)
Reads:    ranked listings ~50k/sec → cache heavily + CDN
Votes:    hot post → thousands/sec → distributed counter
Comments: deep trees → materialized path for efficient fetch

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ CDN + Cache  │  (ranked listings — read-heavy)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Post Service │
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────────┐
 │Post/ ││Vote    ││Ranking       │
 │Comment││Counter ││(hot/top/new, │
 │DB(tree││(distrib││ time decay,  │
 │path)  ││uted)   ││ precomputed) │
 └──────┘└────────┘└──────────────┘
Moderation service.
```

---

### Q201. Design TikTok.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: short-video upload → transcode → CDN; **For You feed** driven by a heavy **recommendation engine** (watch time, likes, shares → ML), not a follow graph. Precompute candidates per user, real-time re-rank. Engagement events → Kafka → recsys. **Challenges**: recommendation quality (the product), real-time signals, video delivery, cold start, fast feedback loops.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    1B MAU; each watches 100s of short videos/day
Views:    billions/day → CDN; videos ~5-10 MB, pre-transcoded
Recsys:   real-time engagement (watch %) → continuous re-ranking

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
    ┌─────┴──────────┐
    ▼ upload         ▼ For You feed
 ┌──────────┐  ┌──────────────┐
 │Transcode │  │Recommendation│
 │→ CDN     │  │Engine (ML)   │
 └──────────┘  └──────┬───────┘
                      ▼
              ┌──────────────┐
              │Candidate Gen │  precomputed per user
              │+ real-time   │
              │re-rank       │
              └──────┬───────┘
   engagement events │
              ▼
         ┌──────────────┐
         │Kafka → recsys│  (watch time/likes/shares → features)
         └──────────────┘
```

---

### Q202. Design Pinterest.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: users save **pins** (image + link) to **boards**; discovery feed via interest + **visual similarity** recs; image-heavy. Pins/boards sharded; images → object storage + CDN; related-pins precomputed (embeddings). Visual search. **Challenges**: discovery/recs (interest + visual), image scale, visual search (embeddings), feed generation, pin→board→user graph.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    450M MAU; billions of pins (image + link)
Reads:    discovery feed heavy → CDN + precomputed related pins
Storage:  images → object storage + CDN; embeddings for visual similarity

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Pin Service │
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────────┐
 │Images││Pin/    ││Recommendation│
 │→CDN  ││Board DB││(interest +   │
 │      ││(sharded││ visual sim,  │
 │      ││)       ││ embeddings)  │
 └──────┘└────────┘└──────────────┘
Visual search via image embeddings.
```

---

### Q203. Design Snapchat.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: **ephemeral** photo/video messages (deleted after view), stories (24h), chat. Media → object storage (short TTL) + CDN, deleted after view/expiry. Track view state; server deletes on view. **Challenges**: ephemerality (reliable deletion), real-time delivery, AR filters (client-side), stories fan-out, privacy (no persistence, screenshot detection).

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    400M DAU; billions of snaps/day (mostly ephemeral)
Media:    stored briefly (short TTL) → deleted after view/expiry
Storage:  low long-term (privacy-first); high throughput short-lived

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │  (AR filters applied client-side)
   └──────┬───────┘
      upload snap
          ▼
   ┌──────────────┐
   │Object Storage│  (short TTL)
   └──────┬───────┘
          ▼ via CDN
   ┌──────────────┐
   │  Recipient   │  view → triggers deletion
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Delete Service│  remove after view/expiry (privacy)
   └──────────────┘
Stories (24h) fan-out; screenshot detection.
```

---

### Q204. Design Google Drive.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: store files/folders, sync across devices, share with permissions, versioning. Files chunked → object storage (dedup via content hash); metadata (hierarchy, permissions, versions) in DB; **sync service** pushes chunk-level deltas. **Challenges**: efficient sync (chunk delta + dedup), conflict resolution, sharing/permissions (ACLs), versioning, large/resumable uploads, offline.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    1B+; avg 15 GB/user → exabytes total
Sync:     only changed CHUNKS transferred (dedup by content hash)
Storage:  object storage + block dedup; metadata sharded by user

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Client (multi │
   │  device)     │
   └──────┬───────┘
    hash chunks → sync deltas
          ▼
   ┌──────────────┐
   │ Sync Service │──► push deltas to other devices
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Object    ││ Metadata DB  │
 │Storage   ││ tree, perms, │
 │(chunks,  ││ versions     │
 │ dedup)   ││(sharded)     │
 └──────────┘└──────────────┘
Sharing via ACLs; versioning history. CDN for downloads.
```

---

### Q205. Design Dropbox.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Like Google Drive, emphasizing **file sync**: client watches the folder, computes chunk hashes, syncs only **changed blocks** (block-level dedup across users). Metadata service tracks file→chunks + versions; notification service tells devices to pull changes. **Challenges**: block-level sync + dedup, conflict resolution (conflicted copies), change detection (watchers + hashing), large files, cross-device consistency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    700M; block-level dedup saves huge storage
Sync:     watch folder → hash 4MB blocks → upload only changed blocks
Storage:  blocks → object storage; metadata sharded

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Client Watcher│  hash blocks, detect changes
   └──────┬───────┘
    upload changed blocks
          ▼
   ┌──────────────┐
   │ Sync/Metadata│  file → blocks + versions
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Block     ││Notification  │──► other devices pull deltas
 │Storage   ││Service       │
 │(dedup)   │└──────────────┘
 └──────────┘
Conflict → conflicted copy. Large files chunked.
```

---

### Q206. Design Google Docs (collaborative editing).
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: real-time **collaborative editing** — concurrent edits merged consistently via **Operational Transformation (OT)** or **CRDTs**; clients send operations to a doc server (WebSocket) that orders/transforms and broadcasts. Persist doc + op history (undo/versions). Shard by doc; presence/cursors. **Challenges**: concurrent-edit convergence (OT/CRDT — the crux), low-latency sync, presence, offline edits, versioning.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Docs:     billions; typically small concurrent editor count per doc
Ops:      each keystroke = an op → high op rate per active doc
Model:    OT/CRDT to converge concurrent edits; shard by doc (1 authoritative server)

── ARCHITECTURE (top → bottom) ──
   ┌──────────┐   ┌──────────┐
   │ Editor A │   │ Editor B │
   └────┬─────┘   └────┬─────┘
    WebSocket       WebSocket
        ▼               ▼
   ┌────────────────────────┐
   │  Doc Server (per doc)  │  order + transform ops (OT/CRDT)
   └──────────┬─────────────┘
       broadcast merged ops
              ▼
   ┌────────────────────────┐
   │ Doc Store + Op History │  (undo, versions)
   └────────────────────────┘
Presence + cursors. Offline edits reconciled via OT/CRDT.
```

---

### Q207. Design Google Calendar.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: events with recurrence (store **RRULE**, expand on read), calendars per user, invitations/RSVP (fan-out to attendees), reminders (scheduled jobs), free/busy, sync. Shard by user; cache month views. **Challenges**: recurring events + exceptions, **time zones/DST**, cross-user invites, reminders at scale (distributed scheduler), free/busy queries, delta sync.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    500M; reads (views) >> writes → cache month views
Storage:  store RRULE not expansions → compact; shard by user
Reminders: millions fire/day → distributed scheduler

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Client (delta │
   │  sync)       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Calendar Service│
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────────┐
 │Cache ││Event DB││ Reminder     │
 │(views││(RRULE, ││ Scheduler    │
 │)     ││sharded)││(distributed) │
 └──────┘└───┬────┘└──────────────┘
    invite fan-out │
             ▼
      ┌──────────────┐
      │Attendees' cal│
      └──────────────┘
```

---

### Q208. Design Gmail.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: receive (SMTP) → spam/virus filter → per-user mailbox; send (SMTP + queue/retries); **search** (index every email), labels/threads, attachments (object storage). Push notifications. Sharded per user. **Challenges**: reliable delivery (SMTP retries, deliverability), spam filtering (ML), massive storage + search, threading, attachments, mailbox consistency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Users:    1.5B; avg 15 GB mailbox → exabytes total
Volume:   hundreds of billions of emails/day (with spam)
Search:   index every email → huge search infrastructure (per user)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │Inbound SMTP  │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Spam/Virus    │  (ML filter)
   │Filter        │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Mailbox Store│  (sharded per user) + search index
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Push Notify   │  + labels/threads
   └──────────────┘
Outbound: SMTP + queue + retries. Attachments → object storage.
```

---

### Q209. Design Google Maps.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: map **tiles** (pre-rendered per zoom → CDN), **geocoding**, **routing** (road graph → A*/contraction hierarchies), **real-time traffic** (aggregate user GPS → adjust edge weights). Spatial index (geohash/quadtree). **Challenges**: routing at scale (precompute + live traffic), spatial indexing, tile serving, ETA accuracy, continuous updates.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Tiles:    pre-rendered per zoom level → CDN (mostly static)
Routing:  billions of route requests/day → precomputed structures
Traffic:  aggregate live GPS from millions of devices → edge weights

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
    ┌─────┼──────────┬───────────┐
    ▼     ▼          ▼           ▼
 ┌──────┐┌────────┐┌──────┐┌──────────┐
 │Tiles ││Geocode ││Route ││Traffic   │
 │(CDN) ││(addr↔  ││Engine││(GPS aggr │
 │      ││ coord) ││A*/CH ││→ weights)│
 │      ││        ││+graph││          │
 └──────┘└────────┘└──────┘└──────────┘
Spatial index (geohash/quadtree) for nearby queries.
```

---

### Q210. Design Uber.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: riders request rides; **match** to nearby drivers via **geospatial indexing** (drivers publish location → geohash/H3/QuadTree); matching service finds best driver, tracks trip (WebSocket), computes fare, handles payment. Events (location, trip state) → Kafka. **Challenges**: real-time geospatial matching, high-volume location updates, ETA/surge pricing, trip state machine, payments, driver-availability consistency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Drivers:  5M active; each sends location every 4s = ~1.25M updates/sec
Rides:    20M/day = ~230/sec; matching = nearby-driver query
Storage:  latest location (in-memory, geo-indexed) + trip history (Kafka)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐        ┌──────────────┐
   │   Rider      │        │   Driver     │
   └──────┬───────┘        └──────┬───────┘
     request ride          location every 4s
          ▼                       ▼
   ┌──────────────┐        ┌──────────────┐
   │Matching Svc  │◄───────│Location Svc  │
   │              │ query   │(geo index    │
   │              │ nearby  │ geohash/H3)  │
   └──────┬───────┘        └──────────────┘
     matched → trip
          ▼
   ┌──────────────┐
   │Trip Service  │  state machine + fare + surge
   └──────┬───────┘
          ▼ WebSocket tracking + Kafka events
   ┌──────────────┐
   │Payment       │
   └──────────────┘
```

---

### Q211. Design Ola.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Like Uber: geospatial driver indexing + matching, real-time tracking, dynamic pricing, payments, plus multiple vehicle types (auto/cab/bike), cash payments, local regulations. **Challenges**: nearby matching, location-update volume, ETA/surge, trip lifecycle, payments (cash reconciliation), multi-modal vehicles.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Same core as Uber: millions of drivers × frequent location updates
Extra: multiple vehicle types; cash payments need reconciliation

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐        ┌──────────────┐
   │   Rider      │        │   Driver     │
   └──────┬───────┘        └──────┬───────┘
     request              location updates
          ▼                       ▼
   ┌──────────────┐        ┌──────────────┐
   │Matching Svc  │◄───────│Location Svc  │
   │(by vehicle   │        │(geo index)   │
   │ type)        │        └──────────────┘
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Trip + Pricing│  (surge; multi-modal)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Payment (card │  + cash reconciliation
   │ / UPI / cash)│
   └──────────────┘
```

---

### Q212. Design Airbnb.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: hosts list properties (search by location/dates/filters — geo + availability); guests **book** (availability check + reservation, transactional — no double-booking); payments (split host/platform); reviews; messaging. Search: geo-index + availability + ranking (ES). Booking locks the date range. **Challenges**: search (geo + availability + ranking), booking concurrency, pricing/availability calendars, payments (escrow/split), reviews, messaging.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Listings: ~7M; searches heavy (geo + dates) → cache + geo-index
Bookings: ~2M/day = ~25/sec (write-critical, no double-book)
Storage:  listings + calendars + bookings → sharded; reviews

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Guest      │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Search (geo + │  cache + geo-index + availability + ranking (ES)
   │ dates)       │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Booking Service│  reserve (TRANSACTIONAL: lock date range)
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Listing/  ││Payment (split│
 │Calendar  ││ host/platform│
 │DB        ││ escrow)      │
 └──────────┘└──────────────┘
Reviews + host/guest messaging.
```

---

### Q213. Design Amazon (e-commerce).
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: catalog + **search**, product pages, cart, **checkout/orders**, **inventory** (reserve on order — no overselling), payments, fulfillment — microservices. Search (ES), catalog (cached + CDN), cart (Redis), orders (transactional), recs (ML). Async via Kafka. **Challenges**: inventory consistency, search/recs, traffic spikes, payment idempotency, order orchestration (Saga), catalog scale.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Catalog:  billions of products; reads dominate → cache + CDN
Orders:   millions/day; peak events (Prime Day) 10× → autoscale + queue
Inventory: reserve to avoid oversell (strong consistency)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  API Gateway │
   └──────┬───────┘
    ┌─────┼──────────┬───────────┐
    ▼     ▼          ▼           ▼
 ┌──────┐┌──────┐┌────────┐┌──────────┐
 │Catalog││Cart  ││Order   ││Inventory │
 │+Search││(Redis││Service ││(reserve, │
 │(ES,CDN││)     ││(TX)    ││no oversell)│
 └──────┘└──────┘└───┬────┘└──────────┘
                     ▼ Kafka events
              ┌──────────────┐
              │Payment +     │  Saga orchestration
              │Fulfillment   │
              └──────────────┘
```

---

### Q214. Design Flipkart.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Like Amazon, emphasizing **high-traffic sale events** (Big Billion Days): aggressive caching, queue-based load leveling, **virtual waiting room** for flash sales. Inventory reservation; payments (UPI/cards) idempotent + retries; recs. **Challenges**: flash-sale spikes (waiting room, rate limiting), inventory consistency, payment reliability, search, fulfillment.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Normal:   millions of orders/day; SALE = 10-50× spike in minutes
Flash sale: limited stock + millions of buyers → virtual waiting room
Inventory: strong consistency (no oversell during flash sale)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Virtual Waiting│  (flash sale: admit N at a time)
   │Room + RateLimit│
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  API Gateway │
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────┐┌────────┐┌──────────────┐
 │Catalog││Order   ││Inventory     │
 │(cache)││(queue- ││(reserve, no  │
 │       ││leveled)││ oversell)    │
 └──────┘└───┬────┘└──────────────┘
             ▼
      ┌──────────────┐
      │Payment (UPI/ │  idempotent + retries
      │ card)        │
      └──────────────┘
```

---

### Q215. Design an e-commerce platform (generic).
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Building blocks: **catalog + search** (ES, cached/CDN), **cart** (Redis), **order** (transactional), **inventory** (reserve — no oversell), **payment** (idempotent + retries), **fulfillment**, notifications, recs. Async via Kafka; Saga for the order flow. **Challenges**: inventory consistency, order orchestration (Saga + compensations), payment idempotency, search/recs, spikes, checkout reliability.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Reads (browse) >> writes (order): ~100:1 → cache + CDN
Orders:  size for peak (events 10×) → autoscale + queue leveling
Inventory: reserve → strong consistency (no oversell)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  API Gateway │
   └──────┬───────┘
    ┌─────┼──────────┬───────────┐
    ▼     ▼          ▼           ▼
 ┌──────┐┌──────┐┌────────┐┌──────────┐
 │Catalog││Cart  ││Order   ││Inventory │
 │+Search││(Redis││(TX,Saga││(reserve) │
 │       ││)     ││)       ││          │
 └──────┘└──────┘└───┬────┘└──────────┘
                     ▼ Kafka
              ┌──────────────┐
              │Payment(idempo│
              │)+Fulfillment │
              └──────────────┘
```

---

### Q216. Design an online food-delivery platform.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: browse restaurants (geo + availability), place order, **assign a delivery partner** (geospatial matching), track delivery (WebSocket), payments. Three-sided (customer/restaurant/partner); order state machine; events → Kafka; ETA estimation. **Challenges**: real-time partner matching + tracking, ETA, order state orchestration, surge/peak, payments, restaurant availability.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Orders:   10M/day = ~115/sec (peak dinner 3-5×)
Partners: 500k, frequent location updates → geo index
Tracking: live delivery location → WebSocket to customer

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Customer   │
   └──────┬───────┘
     browse + order
          ▼
   ┌──────────────┐
   │Order Service │  (state machine: placed→prep→pickup→delivered)
   └──────┬───────┘
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Partner Match │◄───────│Partner Location│ (geo index)
   │(geospatial)  │        └──────────────┘
   └──────┬───────┘
          ▼ WebSocket tracking + Kafka events
   ┌──────────────┐
   │Payment + ETA │
   └──────────────┘
```

---

### Q217. Design Swiggy/Zomato.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Food-delivery platform tuned for **partner matching + order batching** (assign nearby orders to one rider), restaurant discovery (geo + search + ratings), live tracking, dynamic ETA, payments (incl. COD), ratings. **Challenges**: matching + batching, live tracking, ETA (prep + travel), peak surge, three-sided consistency, payments.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Orders:   millions/day; dinner peak = biggest spike
Batching: assign multiple nearby orders to one rider (efficiency)
Discovery: geo + search + ratings → cache + geo-index

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Customer   │
   └──────┬───────┘
     discovery (geo/search/ratings) → order
          ▼
   ┌──────────────┐
   │Order Service │
   └──────┬───────┘
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Partner Assign│◄───────│Partner Location│
   │+ Batching    │        │(geo index)   │
   └──────┬───────┘        └──────────────┘
          ▼
   ┌──────────────┐
   │Tracking + ETA│  (prep + travel time)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Payment (card/│
   │ UPI / COD)   │
   └──────────────┘
```

---

### Q218. Design an online grocery platform.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
Like e-commerce + food delivery but with **perishable inventory**, **real-time per-store stock**, **delivery-slot booking** (limited capacity → concurrency control), and **substitutions**. Browse by store/location, reserve inventory, book a slot, pick/pack, deliver. **Challenges**: real-time inventory (oversell), slot concurrency, substitutions, route optimization, perishability.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Stores:   thousands, each with real-time stock (perishable)
Orders:   millions/day; delivery slots = limited capacity resource
Slots:    booking a slot = concurrency-controlled (limited seats)

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Customer   │  (browse by store/location)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Order Service │
   └──────┬───────┘
    ┌─────┼──────────┐
    ▼     ▼          ▼
 ┌──────────┐┌────────┐┌──────────────┐
 │Per-store ││Slot    ││Substitution  │
 │Inventory ││Booking ││(OOS items)   │
 │(reserve, ││(limited││              │
 │ real-time││ capacity│              │
 │)         ││concur.)│              │
 └──────────┘└────────┘└──────────────┘
Pick/pack → route-optimized delivery.
```

---

### Q219. Design an online travel booking system.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: search flights/hotels (aggregate from many **third-party suppliers/GDS** — fan-out + cache), show availability + price, **book** (reserve with supplier, transactional, handle timeouts), pay, confirm. Supplier-heavy. **Challenges**: aggregating slow/unreliable suppliers (timeouts, caching), price/availability freshness vs cache, booking consistency (hold → confirm), payment + failure recovery, idempotency.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Search:   fan-out to many suppliers per query → cache (short TTL, prices change)
Bookings: lower volume, but write-critical (no double-book, unknown-outcome handling)
Suppliers: slow/unreliable → timeouts + caching essential

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
     search
          ▼
   ┌──────────────┐        ┌──────────────┐
   │Search Aggreg.│──fan-out►│ Suppliers/GDS│
   │(cache short  │◄────────│ (flights,    │
   │ TTL)         │         │  hotels)     │
   └──────┬───────┘        └──────────────┘
     book
          ▼
   ┌──────────────┐
   │Booking (hold │  transactional; handle timeouts (query status)
   │ → confirm)   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │Payment + fail│  recovery + idempotency
   │ handling     │
   └──────────────┘
```

---

### Q220. Design an airline reservation system.
**Difficulty:** `Hard`
**Category:** Product Design

#### Answer
**Core**: search flights (routes, schedules, availability), **seat inventory** (per flight/fare class), **booking** (hold seat → transactional confirm — no oversell), pricing (dynamic fare classes), payments, ticketing, check-in. Strong seat consistency. **Challenges**: seat-inventory consistency (the crux — transactional holds), overbooking policy, dynamic pricing, PNR management, cancellations, GDS integration.

#### Code Example / Key Takeaways
```text
── BACK-OF-ENVELOPE ──
Search:   read-heavy (schedules) → cache
Bookings: write-critical; seat inventory must be strongly consistent
Seats:    per flight × fare class; hold → confirm to avoid oversell

── ARCHITECTURE (top → bottom) ──
   ┌──────────────┐
   │   Client     │
   └──────┬───────┘
     search flights
          ▼
   ┌──────────────┐
   │Search (cached│
   │ schedules)   │
   └──────┬───────┘
     select seats
          ▼
   ┌──────────────┐
   │Booking Service│  hold seat (lock) → transactional confirm
   └──────┬───────┘
    ┌─────┴──────┐
    ▼            ▼
 ┌──────────┐┌──────────────┐
 │Seat      ││Dynamic Pricing│ (fare classes)
 │Inventory ││              │
 │(strong   │└──────────────┘
 │ consist.)│
 └──────────┘
Pay → ticket (PNR) → check-in. GDS integration.
```

---
