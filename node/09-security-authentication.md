# Security & Authentication Interview Questions (Q1 – Q70)

---

### Q1. How do you securely store passwords?
**Difficulty:** `Intermediate`
**Category:** Security & Authentication

#### Answer
Never store plaintext. Hash with a slow, salted algorithm designed for passwords: bcrypt, scrypt, or Argon2. Salts prevent rainbow-table attacks; slowness resists brute force.

#### Code Example
```js
const hash = await bcrypt.hash(password, 12)
const ok = await bcrypt.compare(password, hash)
```
---

### Q2. Why not use SHA-256 for passwords?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
SHA-256 is fast, so attackers can compute billions of guesses per second. Password hashing needs deliberate slowness and memory-hardness (bcrypt/Argon2) to make brute forcing impractical.

#### Code Example
```js
await argon2.hash(password) // memory-hard, slow by design
```
---

### Q3. What is a salt and why is it needed?
**Difficulty:** `Intermediate`
**Category:** Security & Authentication

#### Answer
A salt is unique random data added per password before hashing, so identical passwords produce different hashes and precomputed rainbow tables are useless. bcrypt/Argon2 embed the salt in the output.

#### Code Example
```js
// bcrypt output contains cost + salt + hash: $2b$12$salt...hash
```
---

### Q4. What is a pepper?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
A pepper is a secret added to passwords before hashing, stored separately from the DB (e.g. in an HSM/env), so a database leak alone doesn't enable offline cracking. It complements per-user salts.

#### Code Example
```js
const hash = await bcrypt.hash(password + process.env.PEPPER, 12)
```
---

### Q5. What is JWT?
**Difficulty:** `Intermediate`
**Category:** Security & Authentication

#### Answer
A JSON Web Token is a signed, base64url token with header.payload.signature. The signature lets the server verify claims without server-side session storage, enabling stateless auth.

#### Code Example
```js
const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '15m' })
jwt.verify(token, secret)
```
---

### Q6. What are the three parts of a JWT?
**Difficulty:** `Intermediate`
**Category:** Security & Authentication

#### Answer
Header (algorithm/type), Payload (claims like `sub`, `exp`), Signature (HMAC or RSA over header+payload). The payload is only base64-encoded, not encrypted — never put secrets in it.

#### Code Example
```js
// eyJhbGci...  .  eyJzdWIi...  .  signature
```
---

### Q7. Is JWT payload encrypted?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
No. A standard (signed) JWT is only base64url-encoded and fully readable. Anyone can decode the payload; the signature only guarantees integrity/authenticity. For confidentiality use JWE (encrypted) or don't store sensitive data in the token.

#### Code Example
```js
JSON.parse(Buffer.from(token.split('.')[1], 'base64')) // readable claims
```
---

### Q8. What is the difference between JWT and session-based auth?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Sessions store state server-side (a session ID cookie references it) and are easy to revoke. JWTs are stateless (self-contained, scale across servers) but hard to revoke before expiry. Choose based on revocation and scaling needs.

#### Code Example
```js
// session: cookie 'sid' -> store lookup; JWT: verify signature, no lookup
```
---

### Q9. How do you revoke a JWT?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Since JWTs are stateless, use short expiry + refresh tokens, and maintain a denylist/allowlist (by jti/user) in a fast store to invalidate tokens early. True revocation reintroduces some server state.

#### Code Example
```js
if (await redis.sismember('revoked', payload.jti)) throw new Error('revoked')
```
---

### Q10. What is the access token / refresh token pattern?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
A short-lived access token authorizes API calls; a long-lived refresh token (stored securely, e.g. HttpOnly cookie) obtains new access tokens. This limits exposure if an access token leaks.

#### Code Example
```js
const access = jwt.sign(claims, s, { expiresIn: '15m' })
const refresh = jwt.sign({ sub }, r, { expiresIn: '7d' })
```
---

### Q11. Where should you store tokens on the client?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Prefer HttpOnly, Secure, SameSite cookies (inaccessible to JS, mitigating XSS theft). `localStorage` is vulnerable to XSS. Cookies need CSRF protection; tokens in headers avoid CSRF but are exposed to XSS.

#### Code Example
```js
res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict' })
```
---

### Q12. What is the `alg: none` JWT vulnerability?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Some libraries accepted tokens with `alg: none` (no signature), letting attackers forge tokens. Always pin the expected algorithm on verify and reject `none`.

#### Code Example
```js
jwt.verify(token, key, { algorithms: ['HS256'] }) // pin algorithm
```
---

### Q13. What is the algorithm confusion attack (RS256 vs HS256)?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
If a server accepts either RS256 or HS256, an attacker can sign a token with HS256 using the public RSA key as the HMAC secret. Prevent it by pinning the exact algorithm and separating key usage.

#### Code Example
```js
jwt.verify(token, publicKey, { algorithms: ['RS256'] }) // no HS fallback
```
---

### Q14. What is OAuth 2.0?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
OAuth 2.0 is a delegated authorization framework: a user grants a third-party app limited access to their resources without sharing credentials, via tokens issued by an authorization server.

#### Code Example
```js
// redirect to provider -> user consents -> callback with code -> exchange for token
```
---

### Q15. What is the OAuth authorization code flow with PKCE?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
The app redirects to the provider with a code challenge, receives an auth code on callback, then exchanges it (plus the code verifier) for tokens. PKCE prevents code interception attacks, essential for public/mobile clients.

#### Code Example
```js
// challenge = SHA256(verifier); exchange code + verifier for tokens
```
---

### Q16. What is the difference between OAuth and OpenID Connect?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
OAuth 2.0 is for authorization (access to resources). OpenID Connect (OIDC) is an identity layer on top that adds an ID token (JWT) proving who the user is — i.e. authentication.

#### Code Example
```js
// OIDC adds id_token with user identity claims
```
---

### Q17. What is XSS and how do you prevent it?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Cross-Site Scripting injects malicious scripts into pages viewed by others. Prevent by escaping/encoding output, using frameworks that auto-escape, a strict Content-Security-Policy, and never inserting untrusted HTML.

#### Code Example
```js
res.setHeader('Content-Security-Policy', "default-src 'self'")
```
---

### Q18. What is CSRF and how do you prevent it?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Cross-Site Request Forgery makes a logged-in user's browser send unwanted requests using their cookies. Prevent with `SameSite` cookies, anti-CSRF tokens, and requiring a non-simple header. Header-based tokens (not cookies) sidestep it.

#### Code Example
```js
res.cookie('sid', v, { sameSite: 'strict' }) // + CSRF token for forms
```
---

### Q19. What is SQL injection prevention in one line?
**Difficulty:** `Intermediate`
**Category:** Security & Authentication

#### Answer
Always use parameterized queries/prepared statements; never build SQL by concatenating untrusted input.

#### Code Example
```js
db.query('SELECT * FROM u WHERE email = $1', [email])
```
---

### Q20. What is command injection and how do you avoid it?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Command injection runs attacker-controlled shell commands via `exec` with interpolated input. Avoid it by using `execFile`/`spawn` with argument arrays (no shell) and validating/whitelisting inputs.

#### Code Example
```js
execFile('convert', [userPath, out]) // no shell, no injection
```
---

### Q21. What is the principle of least privilege?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Grant each component/user the minimum permissions needed. Limit DB roles, API scopes, file permissions, and cloud IAM so a compromise has minimal blast radius.

#### Code Example
```js
// app DB user: SELECT/INSERT/UPDATE only, no DROP/GRANT
```
---

### Q22. How do you generate cryptographically secure random values?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Use `crypto.randomBytes`/`crypto.randomUUID`/`crypto.webcrypto`, never `Math.random()` (predictable). Use them for tokens, salts, session IDs, and password-reset codes.

#### Code Example
```js
const token = crypto.randomBytes(32).toString('hex')
```
---

### Q23. Why is `Math.random()` insecure for tokens?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
`Math.random()` is a non-cryptographic PRNG whose output can be predicted from observed values, letting attackers guess tokens/IDs. Security-sensitive randomness must come from a CSPRNG.

#### Code Example
```js
// insecure: Math.random().toString(36)
crypto.randomUUID() // secure
```
---

### Q24. What is a timing attack and how do you prevent it?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
A timing attack infers secrets from how long comparisons take (e.g. early-exit string compare). Use constant-time comparison (`crypto.timingSafeEqual`) for tokens/HMACs.

#### Code Example
```js
crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
```
---

### Q25. How do you sign and verify data with HMAC?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
HMAC combines a secret key with a hash to produce a tag that proves integrity/authenticity. Recompute and compare in constant time to verify (e.g. webhook signatures).

#### Code Example
```js
const mac = crypto.createHmac('sha256', secret).update(body).digest('hex')
```
---

### Q26. What is the difference between hashing, encryption, and encoding?
**Difficulty:** `Intermediate`
**Category:** Security & Authentication

#### Answer
Hashing is one-way (integrity, passwords). Encryption is two-way with a key (confidentiality). Encoding (base64/hex) is reversible with no key and provides no security — just representation.

#### Code Example
```js
Buffer.from('hi').toString('base64') // encoding, NOT security
```
---

### Q27. How do you encrypt sensitive data at rest?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Use authenticated symmetric encryption (AES-256-GCM) with a securely managed key (KMS), storing the IV and auth tag. GCM provides confidentiality and integrity.

#### Code Example
```js
const c = crypto.createCipheriv('aes-256-gcm', key, iv)
const enc = Buffer.concat([c.update(data), c.final()]); const tag = c.getAuthTag()
```
---

### Q28. Why use AES-GCM over AES-CBC?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
GCM is authenticated encryption (AEAD): it detects tampering via an auth tag. CBC provides only confidentiality and needs a separate MAC; misuse leads to padding-oracle attacks. Prefer GCM.

#### Code Example
```js
crypto.createCipheriv('aes-256-gcm', key, iv) // authenticated
```
---

### Q29. What is key rotation and why does it matter?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Key rotation periodically replaces cryptographic keys to limit exposure if a key leaks. Support multiple active keys (by key id) so old data can still be decrypted/verified during transition.

#### Code Example
```js
const key = keyring[token.kid] // pick key by id, enabling rotation
```
---

### Q30. How do you securely handle environment secrets?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Load secrets from a secret manager (Vault, AWS Secrets Manager) or injected env vars, never commit them, restrict access, rotate regularly, and avoid logging them.

#### Code Example
```js
const dbPass = await secrets.get('db/password') // not in code/repo
```
---

### Q31. What is rate limiting's role in security?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Rate limiting throttles requests per client to slow brute-force credential attacks, prevent abuse/DoS, and protect expensive endpoints. Combine per-IP and per-account limits.

#### Code Example
```js
loginLimiter({ windowMs: 15 * 60000, max: 5 }) // 5 login tries / 15 min
```
---

### Q32. How do you protect against brute-force login attacks?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Rate-limit login attempts, add exponential backoff/lockouts per account, use CAPTCHA after failures, require strong passwords/MFA, and use slow password hashing so each guess is costly.

#### Code Example
```js
if (attempts > 5) await sleep(2 ** attempts * 100) // backoff
```
---

### Q33. What is multi-factor authentication (MFA)?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
MFA requires two+ factors: something you know (password), have (TOTP app/hardware key), or are (biometric). It protects accounts even if the password is compromised.

#### Code Example
```js
const valid = speakeasy.totp.verify({ secret, token: userCode })
```
---

### Q34. How does TOTP work?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Time-based One-Time Password derives a short code from a shared secret and the current time window (usually 30s) via HMAC. Both server and authenticator app compute the same code independently.

#### Code Example
```js
speakeasy.totp({ secret, encoding: 'base32' }) // 6-digit code
```
---

### Q35. What are security headers and which are essential?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Essential headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options` (clickjacking), and `Referrer-Policy`. `helmet` sets sane defaults.

#### Code Example
```js
app.use(helmet())
```
---

### Q36. What is clickjacking and how do you prevent it?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Clickjacking tricks users into clicking hidden framed content. Prevent by disallowing framing with `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`.

#### Code Example
```js
res.setHeader('Content-Security-Policy', "frame-ancestors 'none'")
```
---

### Q37. How do you prevent NoSQL injection?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Attackers can inject query operators (e.g. `{ $ne: null }`) via JSON. Validate/cast types, reject object values where scalars are expected, and use schema validation to strip operators.

#### Code Example
```js
if (typeof req.body.email !== 'string') return res.status(400).end()
```
---

### Q38. What is the danger of `eval` and dynamic code?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
`eval`/`new Function` executes arbitrary strings as code; with untrusted input this is remote code execution. Avoid them; parse data with `JSON.parse` and use safe alternatives.

#### Code Example
```js
JSON.parse(input) // not eval('(' + input + ')')
```
---

### Q39. What is prototype pollution?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Prototype pollution injects `__proto__`/`constructor.prototype` keys via merged untrusted objects, altering all objects' behavior and enabling DoS/RCE. Guard by rejecting those keys, using `Object.create(null)`, or `Map`.

#### Code Example
```js
if (key === '__proto__' || key === 'constructor') continue
```
---

### Q40. How do you validate and sanitize user input?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Validate structure/type/range against a schema at the boundary, reject invalid input, and sanitize/escape when outputting (HTML, SQL, shell). Treat all external input as hostile.

#### Code Example
```js
const data = schema.parse(req.body) // whitelist-validate
```
---

### Q41. What is the OWASP Top 10?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
A widely-used list of the most critical web app security risks (e.g. injection, broken access control, cryptographic failures, SSRF). It guides prioritizing defenses.

#### Code Example
```js
// checklist: authz, injection, crypto, SSRF, misconfig, ...
```
---

### Q42. What is broken access control and how do you prevent it?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
It's failing to enforce what users may do — e.g. IDOR where changing an ID accesses others' data. Prevent by checking authorization on every request against the resource owner, never trusting client-side checks.

#### Code Example
```js
if (order.userId !== req.user.id) return res.status(403).end()
```
---

### Q43. What is IDOR (Insecure Direct Object Reference)?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
IDOR occurs when an object reference (id) in a request isn't checked against the requester's permissions, letting them access others' resources by guessing/changing ids. Always verify ownership/scope server-side.

#### Code Example
```js
const doc = await db.docs.findOne({ _id: id, ownerId: req.user.id })
```
---

### Q44. How do you securely reset passwords?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Email a single-use, expiring, cryptographically-random token (store only its hash), verify it, then update the password and invalidate existing sessions. Don't reveal whether an email exists.

#### Code Example
```js
const token = crypto.randomBytes(32).toString('hex')
await db.saveReset(userId, sha256(token), Date.now() + 3600e3)
```
---

### Q45. Why avoid leaking whether a username/email exists?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Different responses for existing vs non-existing accounts enable user enumeration, aiding targeted attacks. Return generic messages and consistent timing for login/reset flows.

#### Code Example
```js
return res.json({ message: 'If the account exists, an email was sent' })
```
---

### Q46. What is HTTPS and why is it mandatory?
**Difficulty:** `Intermediate`
**Category:** Security & Authentication

#### Answer
HTTPS encrypts traffic with TLS, protecting credentials/data from eavesdropping and tampering and authenticating the server. Without it, cookies/tokens can be stolen on the network.

#### Code Example
```js
res.setHeader('Strict-Transport-Security', 'max-age=31536000')
```
---

### Q47. What is certificate pinning?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Pinning restricts accepted TLS certificates to a known set (or CA), so a mis-issued/rogue certificate is rejected, defeating some MITM attacks. It adds operational risk when certs rotate.

#### Code Example
```js
const agent = new https.Agent({ ca: fs.readFileSync('pinned-ca.pem') })
```
---

### Q48. How do you handle dependency vulnerabilities?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Scan with `npm audit`/Snyk/Dependabot, keep dependencies updated, pin via lockfiles, minimize the dependency surface, and review install scripts to reduce supply-chain risk.

#### Code Example
```js
npm audit --audit-level=high
```
---

### Q49. What is a supply-chain attack?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Attackers compromise a dependency (typosquatting, hijacked maintainer, malicious update) so your build/runtime executes their code. Mitigate with lockfiles, `--ignore-scripts`, provenance checks, and minimal trusted deps.

#### Code Example
```js
npm ci --ignore-scripts
```
---

### Q50. How do you prevent sensitive data exposure in logs?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Redact passwords, tokens, PII, and secrets before logging; use structured loggers with redaction rules, and never log full request bodies/headers containing credentials.

#### Code Example
```js
logger.info({ user: id }, 'login') // no password/token fields
```
---

### Q51. What is the secure cookie flag set and its purpose?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
`HttpOnly` blocks JS access (XSS theft), `Secure` sends only over HTTPS, `SameSite` limits cross-site sending (CSRF), and `__Host-` prefix enforces path/host binding. Combine them for session cookies.

#### Code Example
```js
res.cookie('sid', v, { httpOnly: true, secure: true, sameSite: 'strict' })
```
---

### Q52. What is session fixation and how do you prevent it?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
An attacker sets a known session id before login, then hijacks the authenticated session. Prevent by regenerating the session id on privilege change (login) so the pre-set id becomes useless.

#### Code Example
```js
req.session.regenerate(() => { req.session.userId = user.id })
```
---

### Q53. How do you protect an API with API keys?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Issue random keys, store only their hashes, transmit over HTTPS in a header, scope/rate-limit per key, and support rotation/revocation. Keys identify apps, not end users.

#### Code Example
```js
const hash = sha256(req.headers['x-api-key'])
const key = await db.keys.findOne({ hash, active: true })
```
---

### Q54. What is the difference between authentication tokens in header vs cookie?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Header (Bearer) tokens aren't sent automatically, so they resist CSRF but are exposed to XSS if stored in JS-accessible storage. HttpOnly cookies resist XSS theft but need CSRF defenses. Pick based on your threat model.

#### Code Example
```js
Authorization: Bearer <token> // not auto-sent -> CSRF-resistant
```
---

### Q55. How do you implement logout with JWTs?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Delete the client token/cookie and, for real invalidation, add the token's `jti` (or user token version) to a denylist until it expires, since JWTs can't be un-signed.

#### Code Example
```js
await redis.set(`revoked:${jti}`, '1', 'EX', ttl); res.clearCookie('token')
```
---

### Q56. What is CORS misconfiguration risk?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Reflecting the request `Origin` with `Access-Control-Allow-Credentials: true` lets any site make authenticated cross-origin requests. Whitelist specific trusted origins; never combine wildcard origin with credentials.

#### Code Example
```js
if (allowlist.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
```
---

### Q57. How do you securely handle file uploads?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Validate type/size, store outside the web root with random names, scan for malware, never trust the client filename/MIME, and serve with correct `Content-Type` and `Content-Disposition` to prevent execution.

#### Code Example
```js
const name = crypto.randomUUID() + path.extname(original)
```
---

### Q58. What is SSRF and how do you defend against it?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Server-Side Request Forgery abuses server-side fetching to reach internal services/metadata endpoints. Defend by whitelisting destinations, blocking private/link-local IPs, disabling redirects to them, and validating URLs.

#### Code Example
```js
if (isPrivate(dns.lookup(host))) throw new Error('blocked host')
```
---

### Q59. How do you prevent open redirects?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Don't redirect to arbitrary user-supplied URLs (used in phishing). Whitelist allowed paths/hosts or use mapping keys instead of raw URLs.

#### Code Example
```js
const dest = allowed[req.query.next] ?? '/'
res.redirect(dest)
```
---

### Q60. What is content-type sniffing and `nosniff`?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Browsers may guess a response's type, potentially executing uploaded files as scripts. `X-Content-Type-Options: nosniff` forces the declared `Content-Type`, preventing MIME-sniffing attacks.

#### Code Example
```js
res.setHeader('X-Content-Type-Options', 'nosniff')
```
---

### Q61. How do you secure inter-service communication?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Use mutual TLS (mTLS) or signed service tokens (JWT with short expiry), authorize by service identity, encrypt in transit, and apply least-privilege network policies between services.

#### Code Example
```js
https.request({ cert: clientCert, key: clientKey, ... }) // mTLS
```
---

### Q62. What is the difference between symmetric and asymmetric encryption?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Symmetric uses one shared secret key (fast, for bulk data, e.g. AES). Asymmetric uses a public/private key pair (slower, for key exchange and signatures, e.g. RSA/ECDSA). TLS combines both.

#### Code Example
```js
// AES for data, RSA/ECDH to exchange the AES key
```
---

### Q63. How do you sign JWTs asymmetrically (RS256) and why?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Sign with a private key; anyone can verify with the public key. This lets multiple services verify tokens without sharing a signing secret, ideal for distributed systems and third-party verification.

#### Code Example
```js
jwt.sign(claims, privateKey, { algorithm: 'RS256' })
jwt.verify(token, publicKey, { algorithms: ['RS256'] })
```
---

### Q64. What is a nonce and where is it used?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
A nonce is a number used once to prevent replay and ensure uniqueness — in CSP script hashes, OAuth/OIDC requests, and encryption IVs. Reusing a nonce (especially in GCM) breaks security.

#### Code Example
```js
const nonce = crypto.randomBytes(16).toString('base64')
res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`)
```
---

### Q65. How do you protect against replay attacks?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Include a timestamp and nonce in signed requests, reject old/duplicate ones (track seen nonces within a window), and use short token lifetimes. Common for webhooks and API signing.

#### Code Example
```js
if (Date.now() - ts > 300000 || seen.has(nonce)) reject()
```
---

### Q66. What is defense in depth?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Layering multiple independent controls (validation, authz, WAF, least privilege, encryption, monitoring) so if one fails, others still protect the system. No single control is trusted alone.

#### Code Example
```js
// validate + parameterize + authorize + rate-limit + log
```
---

### Q67. How do you handle secrets in Docker/CI?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Inject secrets at runtime via environment/secret stores, not baked into images or committed to CI configs. Use masked CI secrets, avoid `ARG`/`ENV` for secrets in Dockerfiles, and scan images.

#### Code Example
```js
docker run --env-file secrets.env app # not COPY secrets into image
```
---

### Q68. What is subresource integrity (SRI)?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
SRI adds an `integrity` hash to script/link tags so the browser verifies a CDN-loaded file wasn't tampered with, failing if the hash doesn't match.

#### Code Example
```js
// <script src="cdn/lib.js" integrity="sha384-..." crossorigin="anonymous">
```
---

### Q69. How do you audit and monitor security events?
**Difficulty:** `Experienced`
**Category:** Security & Authentication

#### Answer
Log authentication attempts, authorization failures, and sensitive actions with context; centralize logs, alert on anomalies (spikes in 401/403, new geos), and retain audit trails immutably for investigation.

#### Code Example
```js
logger.warn({ userId, ip }, 'authz_denied') // feed to SIEM/alerts
```
---

### Q70. What is a security misconfiguration and common examples?
**Difficulty:** `Advanced`
**Category:** Security & Authentication

#### Answer
Insecure defaults or incomplete setup: verbose error stacks in prod, default credentials, open cloud buckets, disabled TLS, permissive CORS, exposed admin endpoints. Harden defaults, minimize surface, and review configs.

#### Code Example
```js
if (process.env.NODE_ENV === 'production') app.set('json spaces', 0) // no stack leaks
```
---
