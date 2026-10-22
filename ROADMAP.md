# Zynkra Roadmap — Universal Social Media

**North star:** a universal, user-owned social platform — one place to post, message, follow,
and get paid, that federates with the open social web and doesn't lock people in.

This roadmap is grounded in an audit of the *actual* code (July 2026), not the aspirational
docs. It replaces the README feature-wishlist with a sequenced, dependency-aware plan.

> **Guiding principle: depth over breadth.** The repo already has ~77 server modules and 112
> client pages, but most are shallow. We stop adding surface area. Every phase below either
> makes an existing thing *actually work end-to-end* or removes something that pretends to.
> **Nothing ships that lies to the user.** A feature is either real, labeled "Preview," or gone.

---

## 1. Honest current state (baseline)

Overall completeness toward a trustworthy product: **~25%.** Breadth reads as "80% done";
depth, mocked features, and near-zero tests put it at ~25%.

| Area | State | Verdict |
|---|---|---|
| Auth (JWT + SIWE + WebAuthn) | Real, multi-method | ✅ Load-bearing |
| Users / profiles / follows | Real (1200+ svc lines) | ✅ Load-bearing |
| Posts / feed / comments | Real | ✅ Load-bearing |
| Groups / moderation | Real (880 / 1150 lines) | ✅ Load-bearing |
| DMs | 1:1 E2EE enforced — ciphertext-only storage, plaintext rejected once both parties publish keys | ✅ 1:1 E2EE (groups/media/modmail still readable by server) |
| Payments + Wallet | Stripe + ledger w/ row-locking | ✅ Best subsystem; nearly shippable |
| Data export / import | Whole-account JSON export `v2.1` (conversations, verification, linked accounts added) + transactional import (DMs w/ existing peers, wallet/orders/verification/linked accts archived) | ✅ Portability — media bundled in ZIP; money/trust imported as records only, never fabricated |
| Notifications / stories / marketplace | Real-ish | ⚠️ Usable, needs polish |
| Offline (IndexedDB queue + SW) | Real queue | ⚠️ Not a conflict-resolving sync engine |
| ActivityPub federation | Both directions implemented: signed+verified delivery, persisted inbound follows, **post fan-out on create**, **retraction on delete**, boosts, and a **readable federated timeline** (when `FEDERATION_ENABLED=true`) | ⚠️ Works when enabled; off by default. **No Mastodon interop test** — the exit criterion. No outbound `Like` or `Update`; no delivery queue; remote posts live in a separate read model rather than the local `posts` table |
| Blockchain identity / DAO / token / tipping | Wallet-sign auth (SIWE) only; the fake `$ZYNK` token, DAO, token-gating, and snapmap are **deleted** (2026-10-21) — dirs, routes, and UI removed | ❌ Cut per §6 |
| AI | On-device WebLLM panel (Preview) + OpenRouter cloud for most AI features | ⚠️ Mixed: panel is local, chatbot/content tools are cloud |
| ~40 modules (metaverse, digital-twin, brainwave-auth, nonprofits, fundraisers…) | Were CRUD skeletons / empty under `src/features/*` — **deleted 2026-10-21** (only registered `features/account-management` remains) | ❌ Cut — deleted |
| Directory/module counts in the marketing docs | `PLAN.md` claimed "83 backend modules / 79 frontend pages." Actual counts were **105 feature dirs and 128 page files** — the docs were both wrong *and* flattering, because they counted unregistered stubs as features. After the 2026-10-21 facade deletion the counts are honest (~98 server module dirs, 126 client page files, ~20 load-bearing) | ✅ Corrected |
| Primary-nav community pages with no backend | `/skill-sharing`, `/cultural-preservation-communities`, `/crisis-response-communities`, `/accessibility-first-communities` were complete client UIs calling endpoints with no server module behind them; 404s were swallowed into `console.error`, so an empty list was indistinguishable from "you have none". | ✅ De-routed 2026-09 — routes and the "Communities" nav section removed; components left on disk with a comment in `App.tsx` |
| Tests | Server unit/integration suites are growing; the money path now exercises the production `WalletService`; federation signing + activity handling now have collected coverage; client coverage remains limited | ⚠️ Improving |

**The three credibility bombs** — status after Phase 0 relabeling:
1. ~~DMs advertised as E2EE but stored in plaintext~~ → **Resolved** (contradictorily
   documented): 1:1 DMs *are* E2EE — the server stores ciphertext-only and rejects plaintext.
   The ROADMAP was right and `README.md`/`PLAN.md`/`ARCHITECTURE.md` were wrong; they have been
   corrected. Remaining E2EE gaps are groups, multi-device, and recovery (key rotation
   shipped server-side: rotation events, atomic pre-key claims, identity/bundle rotation
   endpoints).
2. ~~Federation advertised as interoperable but outbound unsigned~~ → **Fixed in code**, and
   the mirror-image bug is now fixed too: outbound signs with HTTP Signatures when
   `FEDERATION_ENABLED=true` (default off), **and inbound activities are verified** — the inbox
   previously accepted unsigned, unauthenticated `Follow`/`Create` from anyone. Interop test
   against real Mastodon still pending (Phase 4).
3. ~~"Local AI" advertised as on-device Llama 3 but is cloud~~ → **Relabeled**: on-device WebLLM panel marked Preview; other AI features labeled as OpenRouter cloud.

---

## 2. Scope decision: what "universal" means here

We can't build *everything* the repo gestures at. "Universal social media" is defined by a
**tiered feature set**, and the roadmap moves features up the tiers as they become real.

- **Core (must be rock-solid):** identity/auth, profile, post, feed, follow, comment, react,
  DM, notifications, search, moderation, media upload.
- **Differentiators (the reason to choose Zynkra):** creator monetization (wallet + payouts),
  data ownership/export, open-web federation.
- **Preview (visible, clearly labeled, may be shallow):** stories, reels, groups, marketplace,
  events, dating — kept but marked so users aren't misled.
- **Cut / archive (remove from product surface now):** mocked AI, blockchain identity/DAO/token/
  tipping stubs, metaverse/snapmap/digital-twin/brainwave-auth, and the other empty modules.
  They can return as real features later; today they only dilute trust and slow the build.

---

## 3. Phased plan

Each phase has an **exit criterion** — a demonstrable, testable outcome. Do not start a phase
before its predecessor's exit criterion is met. Effort sizes are rough (S ≤ few days,
M ≈ 1–2 wks, L ≈ 3–6 wks) for a small team.

### Phase 0 — Stop lying & set a foundation (S–M) · *unblocks everything* — **DONE**
Goal: the product tells the truth, and we can move safely.
- **Defuse credibility bombs:** either fix or clearly relabel the three items in §1. ✅ Relabeling done; see updated bomb status above.
- **Archive the facade:** move the stub modules and their client pages out of the product
  surface. ✅ Cut list unwired from `app.module.ts` and de-routed in `client/src/App.tsx`:
  `TokenModule` (a fake `$ZYNK` token held as a Postgres row), `SnapMapModule` (locations in
  in-process `Map`s, never persisted), and the client routes `/blockchain-identity`, `/dao`,
  `/token-gated`, `/snapmap`. `DaoModule` and `TokenGatedContentModule` were never registered.
  ✅ **Completed 2026-10-21:** the `token/`, `dao/`, `token-gated-content/`, and `snapmap/`
  server directories are deleted (token-gated and snapmap had still been reachable
  transitively via posts/groups/feed — now unwired and removed, along with the token-gated
  post/group UI, DAO API helpers, Local Feed page/route, and the snapmap components).
  The ~64 stub services under `src/features/*` are deleted too (only the registered
  `features/account-management` remains). Cut pages moved under `client/src/archive/pages/`.
  ⚠️ `archive-modules.sh` previously listed `crypto` and `tipping` as archive candidates.
  Both are load-bearing (`crypto` = Signal Protocol X3DH key store for Phase 3; `tipping` =
  the `'tip'` fulfillment handler in `PaymentsService`, i.e. the Phase 2 money path). The script
  has been corrected; do not trust its old output.
- **CI + quality gate:** GitHub Actions running lint + typecheck + build for client and server on every PR. ✅ Exists (`client-ci.yml`, `server-ci.yml`).
- **Commit hygiene:** enforce conventional commits (CONTRIBUTING.md already prescribes them; history shows `lsksk`/`lsks`). Add a commit-lint hook. ✅ Done (husky + `@commitlint/config-conventional` on `commit-msg`, 2026-10-21).
- **Exit:** `main` is green in CI; no user-visible feature is mocked-but-unlabeled; README/ARCHITECTURE updated to match reality. ✅ Met (docs relabeled; facade fully archived/deleted; commit lint installed)

### Phase 1 — Harden the Core loop (M–L) · *the product people actually use daily*
Goal: signup → profile → post → feed → follow → comment → react → DM → notify works flawlessly.
- Audit each Core feature end-to-end; fix the breakages the breadth hid.
- **Media pipeline:** ✅ Local-disk backend chosen and implemented (`MediaService` + sharp);
  avatars/stories/uploads wired through it; Docker volume for persistence.
  S3 remains optional future work.
- **Search:** ✅ Postgres FTS (`searchVector` + GIN + `websearch_to_tsquery`/`ts_rank`);
  reverse-image is Preview (recent public image posts, not perceptual matching);
  dead `AdvancedSearchController`/`Service` removed; place/group/hashtag/product routes fixed.
- **Test the Core:** ✅ First real Core-loop suite — `server/test/core-loop.integration.test.ts`
  walks signup → profile → post → feed → follow → comment → react → DM → notify over HTTP
  (shared in-memory store; JWT + ValidationPipe). Wired into Server CI (`test:core` +
  `server-ci.yml`). Target: the daily-use path has coverage, not 100% of 77 modules.
- **Test the Core (real DB):** ✅ `server/test/core-loop.db.integration.test.ts`
  (`npm run test:core-db`) boots the real core modules (auth/users/posts/feed/comments/
  reactions/dms/notifications) against an embedded Postgres instance whose schema is
  synchronized by TypeORM, then walks the same loop over HTTP — no mocks at the DB
  boundary. Needs `@embedded-postgres/linux-x64` build scripts allowed (already in
  `allowScripts`; `npm ci` requires a regenerated `server/package-lock.json`).
  Wired into Server CI (`test:core-db` step in the `test-unit` job).
- **Exit:** a new user can complete the full Core loop on a clean DB with zero console errors,
  and it's covered by CI-run integration tests. ⏳ Covered by CI-run HTTP integration suite
  (in-memory store + embedded-Postgres `test:core-db`); the real-DB e2e was written blind and
  still needs a green CI run to confirm before the Phase-1 exit lock is sealed.

### Phase 2 — Creator monetization to production (M) · *the differentiator, already closest*
Goal: the best subsystem becomes genuinely shippable — this is Zynkra's wedge.
- ✅ Wallet ledger + Stripe Connect payouts code + migrations
  (`1785000000000-WalletLedgerAndConnectPayouts`, `1788000200000-PayoutDueAt`,
  `1789200000000-PlatformSystemUser`).
- ✅ 90/10 split enforced on **all** money paths (wallet tips/subs/PPV + Stripe
  tipping/subscriptions via `platformFeeRate`); platform fee credited to
  `PLATFORM_USER_ID` ledger, not vanishing.
- ✅ `getCreatorEarnings` derived from ledger (not hardcoded zeros).
- ✅ Idempotent webhook handling incl. `charge.refunded` + replay-safe tests
  (`payments.webhooks.spec.ts`); fixed stale `payments.payouts.spec.ts` ctor.
- ✅ Earnings/wallet client pages; `.env.example` documents webhook/Connect flags.
- ✅ Money-path tests now exercise the production `WalletService` and `splitRevenue`; overdraw, ledger entries, 90/10 invariants, webhook replay, refunds, and payout reversals are covered. The real-Postgres core suite remains the integration gate.
- ⏳ Real test-mode payout demo: requires `PAYMENTS_ENABLED=true` +
  real `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (empty in local `.env`).
- ✅ Reconciliation job (`server/src/payments/reconciliation.service.ts`): a cron
  (`EVERY_10_MINUTES`) pulls every `processing` payout's Stripe transfer and finalizes it
  (paid → mark paid, failed → reverse + wallet refund), resolves orphaned transfers via
  metadata `payoutId`, logs the Stripe balance snapshot for drift checks, and is replay-safe
  alongside the transfer webhooks. Manual trigger: `POST /payments/admin/reconcile`.
  Covered by `test/payments.reconciliation.spec.ts` (wired into `test:money`).
- ✅ Payout approval/rejection atomically claims `pending` rows before transferring or
  refunding, so the scheduler and admin queue cannot settle the same payout twice.
- **Exit:** a creator can earn, see a correct ledger, and receive a real (test-mode) payout,
  with tests covering the money path. (Code+tests ✅; live Stripe test-mode payout ⏳ on keys.)

### Phase 3 — Real E2EE for DMs (M) · *deliver the privacy promise*
Goal: make the E2EE claim true.
- ✅ One-to-one DMs encrypted end-to-end: the browser Signal client
  (`@privacyresearch/libsignal-protocol-typescript`, X3DH + Double Ratchet) encrypts before
  upload. The server now labels 1:1 conversations `isEncrypted` when both parties have
  published identity keys, rejects readable plaintext on those threads (only ciphertext
  envelopes are stored — `DmsService.isE2eeEnvelope`), and progressively upgrades legacy
  threads on the first encrypted send. Server test `test/e2ee.dm.spec.ts` proves a libsodium
  round-trip with zero plaintext at rest (the server never holds decryption keys).
- ✅ Per-attachment media encryption (Signal-style): the client encrypts each voice/video
  attachment with a random XChaCha20-Poly1305 key (`client/src/lib/attachment-crypto.ts`)
  before upload to `POST /media/upload/e2ee`, and the key+nonce travel only inside the
  Signal-encrypted envelope as `{v:1, text, attachments:[{url,type,key,nonce}]}`. The server
  stores ciphertext verbatim (new `media.isEncrypted` column — no sharp metadata, no
  thumbnails, never reads the bytes) and enforces the split on encrypted threads: untagged
  media is rejected, and ciphertext media without an accompanying envelope is rejected (no
  key-delivery channel). Receive side decrypts and renders blob URLs in `MessageContent`.
  Covered by `client/src/lib/attachment-crypto.test.ts` (5) and `test/e2ee.dm-media.spec.ts` (4).
- ⏳ Group DMs, page DMs, and modmail remain readable by the server by design (not E2EE).
- ✅ Key rotation (server): identity rotation replaces + records an event peers can poll
  (`GET /keys/identity/:userId`, `GET /keys/rotation-events?since=`), signed pre-keys keep
  current + previous with pruning, one-time pre-key claims are atomic (pessimistic lock —
  no duplicate claims) and keyIds are never re-used. Identity rotation also **purges the
  user's one-time + signed pre-keys** — stale material issued under the old identity is
  cryptographically dead (private halves gone) and must never be claimed again; the client
  re-uploads fresh keys right after, before its next pre-key replenishment can be wiped.
  Migration `KeyRotationEvents`. Covered by `src/keys/prekeys.service.spec.ts` (14).
  *Multi-device remains ⏳;*
  client rotation wiring ✅ — before every send, `ensureFreshSession`
  throttled-checks the peer's server identity against the key cached at session build
  and tears down + re-runs X3DH on mismatch (peer re-install / key rotation), decrypt
  failures rebuild from a clean slate, and `initialize` self-heals a missing/stale
  server identity copy from the local private key (`e2ee-rotation` decision logic +
  service policy covered by `client/src/lib/e2ee-rotation.test.ts` (8) and
  `client/src/services/e2ee.service.test.ts` (8));
  existing pre-E2EE plaintext rows can't be retro-encrypted (explicit: they stay readable
  until the thread upgrades to encrypted).
- ✅ Recovery story (and a bug it exposed): the identity key pair was **never persisted**
  — `store._initialize` was never called and first-time generation skipped the local
  write, so every page load minted a *new* identity (server-side rotation each reload,
  sessions orphaned). Fixed via `saveIdentityKeyPair` at generation time. Recovery =
  Settings → "Encryption key recovery": passphrase-encrypted export/import of the full
  key state (identity + session ratchet records + pre-keys) as one `.zkebackup` file —
  PBKDF2-HMAC-SHA256 (600k, WebCrypto) → XChaCha20-Poly1305 (libsodium); restore keeps
  the same identity (no safety-number change) and self-heals the server copy. Passphrase
  never leaves the device; no server escrow. Covered by
  `client/src/lib/e2ee-recovery.test.ts` (10).
- ✅ **The Signal library actually loads (latent "E2EE disabled" bug found by the round-trip
  test):** the client pinned `@privacyresearch/libsignal-protocol-typescript` to `^0.0.3`
  (which permits only that exact patch) and the 0.0.3 npm tarball ships a broken
  `lib/index.js` whose requires resolve to files that don't exist — `getLibsignal()`
  *always* threw, so runtime E2EE had silently degraded to "disabled". Upgraded to `0.0.16`
  (complete build) and adapted to its real API: static `KeyHelper.generate*`,
  `SessionBuilder.processPreKey()` with the nested `DeviceType` bundle, library
  latin1/binary ciphertext string → base64 on the wire, decrypt with the library's default
  `'binary'` encoding (it rejects `'base64'`), store reads return `undefined` (never
  `null` — the library checks `!== undefined` strictly), and `TextEncoder` output is copied
  into a same-realm `ArrayBuffer` (jsdom `instanceof` check). Type surface:
  `client/src/types/libsignal.d.ts` now mirrors 0.0.16.
- ✅ **Automated two-party round-trip** — `client/src/services/e2ee.roundtrip.test.ts` (3)
  runs two real `E2EEService` instances with the real Signal library against a fake
  in-memory key directory: bidirectional X3DH + ratchet advancement across messages,
  peer-reinstall rotation (fresh identity → cached-key mismatch → session torn down and
  re-established; the fake directory purges pre-keys on identity change, mirroring
  `prekeys.service.ts`, and the *new* install decrypts the rebuilt session), and
  offline-tolerant identity checks (endpoint down → keep session, still decrypts).
- **Exit:** one-to-one DMs store no readable message content and round-trip across two
  devices. (Text ✅ + media ✅ + automated two-party round-trip ✅; manual cross-browser
  verification ⏳ pending.)

### Phase 4 — Open-web federation that actually federates (L) · *the "universal" claim*
Goal: interoperate with Mastodon/Pixelfed for real.
- ✅ **HTTP Signatures on outbound delivery** — implemented (`http-signatures.service.ts`,
  draft-cavage-http-signatures-10, RSA-SHA256 + `Digest`, signed GET and POST) and now covered
  by `http-signatures.service.spec.ts`, which verifies the signatures cryptographically
  rather than asserting on header shape alone. Gated on `FEDERATION_ENABLED=true`.
- ✅ **Delivery retries** — up to 3 attempts with capped exponential backoff; re-signs on each
  attempt so the `Date` header cannot go stale; does not retry deterministic failures (401/403
  signature rejection, non-retryable 4xx); 429/5xx/transport errors do retry. Covered by the
  federation spec.
- ✅ **Failed deliveries are no longer silent.** `federatePost` previously caught per-instance
  delivery errors, only `logger.error`'d them, and returned `void` — so a caller could not
  distinguish "delivered to all four peers" from "delivered to none," and a total federation
  outage looked exactly like success. Blocked and never-connected domains were dropped by a bare
  `continue`, so they did not even appear in a count. It now returns a `FederationReport`
  (`activityId`, `requested`, `delivered`, `failed`, per-instance `results[]` with
  `skipped`/`attempts`/`status`/`reason`), and the new `POST /federation/posts/federate`
  endpoint surfaces it to the caller. The author is taken from the authenticated user; a
  `localUserId` in the body is ignored so a caller cannot federate someone else's post under
  their own token. `targetInstances` is declared on `FederatePostRequestDto` because the global
  `ValidationPipe` runs `whitelist: true` and would otherwise strip it before the handler ran.
- ✅ **Delivery retries now behave.** `deliverToInbox` signs **inside** the retry loop rather
  than once before it — `signRequest` stamps a `Date` header, so a retry that reused the original
  headers could be rejected by a peer enforcing clock skew, failing *because* it retried. Backoff
  is exponential and capped at 30 s instead of a flat 200 ms, so a downed peer no longer receives
  three requests inside 400 ms. Deterministic failures are no longer retried: 401/403 (signature
  rejected) and non-retryable 4xx such as 400 return `{delivered: false, retryable: false}`
  immediately instead of resending identical bytes three times. 429, 5xx, and transport errors
  still retry.
- ✅ **Posts are signed as their real author.** `deliverToInbox` defaults `actorUsername` to
  `'local'`, so `federatePost` was signing deliveries with a `keyId` of
  `.../federation/users/local#main-key` while the activity's `actor` claimed the real user. A
  Mastodon-style peer checks that the keyId owner matches `actor`, so those deliveries were being
  rejected. It now passes the actual username, falling back to `undefined` (preserving the old
  default) only when the user cannot be resolved.
- ✅ **`sendFollow` no longer hides why it failed.** It used a bare `axios.post` in its own
  `try`, so a Follow got none of the retry/backoff logic, and every failure — including a 401
  meaning the signature is wrong, the single most likely misconfiguration — collapsed into a
  generic "Failed to follow remote user" 400. It now routes through `deliverToInbox` and reports
  the real reason with a 502.
- ✅ **Dead-letter queue.** Failed deliveries are retained in
  `federation_delivery_attempts` (payload verbatim, retry schedule) and redriven by a
  scheduled job every minute with hour-capped exponential backoff (10 redrive cycles
  beyond the in-request retries). Deterministic rejections (401/403/4xx) are stored dead
  immediately; delivered activities close their pending rows; a vanished/blocked instance
  kills the row. Operator surface: `GET /federation/deliveries?status=pending|dead|delivered`
  and `POST /federation/deliveries/:id/redrive` (admin). Migration
  `1793000000000-FederationDeliveryAttempts`; covered by
  `src/federation/delivery-queue.federation.spec.ts` (9 cases).
- ✅ **Inbound follows are actually persisted (they previously were not).** `processSharedInbox`
  answered a `Follow` with an `Accept` and then **discarded the relationship**. Nothing was
  written, so an inbound follower never appeared in the local user's followers collection, and
  `Undo (Follow)` — which returned `follow-undo-processed` — had nothing to remove and left the
  remote user a follower forever. Worse, the peer was *told* the follow existed. There was no
  `FederationFollow` entity and no table at all; the follow relation was never modeled.
  - New `federation_follows` table + `FederationFollow` entity + migration
    `1790000000000-FederationFollows`, unique on `(localUser, remoteUser)` with an indexed
    `followActivityId`.
  - The follow is recorded **before** the `Accept` is sent, and a bookkeeping write failure does
    *not* fail the inbox — the peer still needs its `Accept` or it retries forever.
  - Replayed `Follow`s (Mastodon re-sends on reconnect) update the existing row instead of
    inserting, so the unique constraint cannot throw inside the inbox.
  - `Undo (Follow)` now deletes the row and distinguishes `follow-undo-processed` from
    `follow-undo-noop`; a no-op reporting success is indistinguishable from a real removal.
  - `getLocalFollowers` now merges local and inbound remote followers. It previously listed only
    local users, so a remote follower was invisible in the very collection that defines the
    relationship — the reverse direction of the follow being accepted. `totalItems` is
    guaranteed to equal the number of items actually sent (rows with no resolvable `actorId` are
    filtered out rather than counted), because a Collection claiming more items than it contains
    is a spec violation a peer will act on. A failed follow lookup degrades the collection
    instead of 500-ing it.
  - New `GET /federation/inbound-followers` for the authenticated user.
  - ⏳ **No outbox for remote posts.** *Now addressed — see the timeline entry below.*
  - `extractLocalUsername` accepts either a full actor URL or a bare username, since
    implementations differ on what they put in `Follow.object`.
  - ✅ Covered by `federation.service.spec.ts`: persist-before-accept, bare-username target,
    replay idempotency, write-failure tolerance, unknown local actor, Undo removal, Undo no-op,
    non-Follow Undo, and the three followers-collection cases above.
  - ⚠️ **Never executed** (no shell). The constructor gained a 5th repository argument
    (`followRepository`, inserted at position 5, shifting `configService` and everything after
    it) — the spec harness was updated to match, but this is exactly the class of change that
    silently breaks a hand-written `new FederationService(...)` elsewhere. Grep for other
    construction sites before trusting a green run.
  - ⚠️ **Two defects in this session's own work were found by reading, not by running**, and both
    would have shipped: a duplicate `OptionalJwtAuthGuard` class (Nest would register two, and a
    controller could bind the wrong `handleRequest`) and a dead `PostsService.deletePost` that
    nothing called. Neither would have been caught without inspection. That is the argument for
    running the suite, not for writing more.
- ✅ **The inbox is now actually signed-and-verified (was a security hole).** Both
  `POST /federation/inbox` and `POST /federation/users/:username/inbox` are unauthenticated
  by design — ActivityPub has no bearer tokens — but nothing verified what arrived, so
  **any client could POST a `Follow` or `Create` and have it persisted and answered with an
  `Accept`.** The ROADMAP previously listed "signed inbox" as done; outbound was signed,
  inbound was not checked at all. Now `HttpSignaturesService` gained the verification half:
  `parseSignatureHeader` (tolerant of whitespace/quoting, defaults to `date`), and
  `verifyRequestSignature`, which rebuilds the draft-cavage-10 signing string from the *actual*
  request headers and checks it against the actor's published key with `crypto.verify`. The
  controller rejects with 401 when: the `Signature` header is absent or malformed; a signed
  header named in the signature is missing from the request; the `Digest` does not match the
  received body; a `Digest` is present but was not signed; the algorithm is not `rsa-sha256`;
  or `(created)`/`(expires)` pseudo-headers appear (unsupported, so they are refused rather
  than ignored).
  - **Body integrity uses `req.rawBody`, never the parsed object.** Re-serializing
    `req.body` would not reproduce the wire bytes, so a tampered request whose parsed form
    stringifies identically could pass. The app is already created with `rawBody: true`
    (for Stripe), so this was available.
  - **`activity.actor` must equal the signature `keyId`'s URL.** A signature proves control of
    a key, not authorship: without this check any server holding a valid key could attribute
    its activity to a third party by setting `actor` to someone else's URL.
  - **SSRF guard on key fetch.** `keyId` is attacker-controlled, so fetching the actor's
    public key with an unrestricted `axios.get` would have been a server-side request forgery
    primitive aimed at internal addresses and cloud metadata. `assertSafeRemoteUrl` requires
    HTTPS, rejects credentials in the URL, rejects loopback/`.localhost`/`.local`/metadata
    hostnames, rejects RFC1918 / link-local / CGNAT / multicast / reserved IPv4 and the
    IPv6 equivalents, unwraps IPv4-mapped IPv6 (`::ffff:127.0.0.1`), and **rejects a public
    hostname if any of its resolved addresses is private** (DNS-rebinding defense — a
    rebinding attacker controls only the second answer). Redirects are not followed
    (`maxRedirects: 0`).
  - ⚠️ Gated by `FEDERATION_VERIFY_INBOUND`, which **defaults to on when
    `FEDERATION_ENABLED=true`** and can be forced either way. Defaulting off would have left
    the hole open in exactly the configuration that federates. Instances running
    `FEDERATION_ENABLED=true` against peers that do not sign correctly will now 401 — that is
    the correct failure direction, but it is a behavior change and is exactly what a Mastodon
    interop run will surface.
  - ✅ Covered by `src/federation/http-signatures.inbound.spec.ts` (parsing, positive and
    negative verification, every refusal reason, the SSRF matrix including rebinding, and a
    full round trip verifying a signature made by an independently generated remote key).
    `npm run test:federation` runs the federation suites in CI.
  - ⏳ Not done: **no key cache**, so every inbound activity re-fetches and re-parses the
    actor's key document. Correct, but it is an outbound request per activity — a rate limiter
    or short-lived cache belongs here before federating at volume.
  - ⚠️ **Never executed** (no shell in the authoring session). The `crypto`/`dns` assertions
    were traced by hand; the DNS lookups in the SSRF tests are mocked via
    `jest.spyOn(require('dns').promises, 'lookup', …)`, which depends on `dns` being a mutable
    module object — if that spy does not take, those tests fail for the wrong reason and the
    assertion should be checked before trusting the result.
- ✅ **Inbound follows are actually persisted (they previously were not).** `processSharedInbox`
  answered a `Follow` with an `Accept` and then **discarded the relationship**. Nothing was
  written, so an inbound follower never appeared in the local user's followers collection, and
  `Undo (Follow)` — which returned `follow-undo-processed` — had nothing to remove and left the
  remote user a follower forever. Worse, the peer was *told* the follow existed. There was no
  `FederationFollow` entity and no table at all; the follow relation was never modeled.
  - New `federation_follows` table + `FederationFollow` entity + migration
    `1790000000000-FederationFollows`, unique on `(localUser, remoteUser)` with an indexed
    `followActivityId`.
  - The follow is recorded **before** the `Accept` is sent, and a bookkeeping write failure does
    *not* fail the inbox — the peer still needs its `Accept` or it retries forever.
  - Replayed `Follow`s (Mastodon re-sends on reconnect) update the existing row instead of
    inserting, so the unique constraint cannot throw inside the inbox.
  - `Undo (Follow)` now deletes the row and distinguishes `follow-undo-processed` from
    `follow-undo-noop`; a no-op reporting success is indistinguishable from a real removal.
  - `getLocalFollowers` now merges local and inbound remote followers. It previously listed only
    local users, so a remote follower was invisible in the very collection that defines the
    relationship — the reverse direction of the follow being accepted. `totalItems` is
    guaranteed to equal the number of items actually sent (rows with no resolvable `actorId` are
    filtered out rather than counted), because a Collection claiming more items than it contains
    is a spec violation a peer will act on. A failed follow lookup degrades the collection
    instead of 500-ing it.
  - New `GET /federation/inbound-followers` for the authenticated user.
  - `extractLocalUsername` accepts either a full actor URL or a bare username, since
    implementations differ on what they put in `Follow.object`.
  - ✅ Covered by `federation.service.spec.ts`: persist-before-accept, bare-username target,
    replay idempotency, write-failure tolerance, unknown local actor, Undo removal, Undo no-op,
    non-Follow Undo, and the three followers-collection cases above.
- ✅ **The remote→local direction now works end to end in code.** Inbound follow persistence,
  signed-and-verified delivery both ways, and a followers collection that includes remote
  followers means a Mastodon user can follow a Zynkra user *in our implementation*. What is
  still unproven is that a real Mastodon instance agrees.
- ✅ **Remote posts are now visible (they were stored and never rendered).** This was the largest
  functional gap in the remote→local direction and it made the whole follow graph pointless: a
  remote user could follow, the follow was recorded, the followers collection showed it — and
  nothing ever assembled `federated_posts` into anything a person could read. New
  `GET /federation/timeline` with `getFederatedTimeline`, returning a normalized
  `FederatedTimelineItem[]`.
  - **Deliberately a separate read model, not a synthetic local `Post` per remote status.**
    Writing remote content into the `posts` table would mean inventing a `User` for actors with
    no local account, corrupting follower counts, mention resolution, and moderation for every
    account on the instance. Real implementations add a `uri` column to the statuses table and
    store both kinds in one place; that is a schema migration and a much larger change, so it is
    left as an explicit follow-up rather than faked.
  - **Bookkeeping rows are excluded.** `federatePost` records outbound activity ids in
    `federated_posts`, and those rows have no author and no instance. The query requires both to
    be present, so they can never surface as authorless ghosts in the feed.
  - **Moderation is enforced on this surface.** A block that did not cover the federated timeline
    would be a bypass on the one surface where a user most obviously expects it. Filtered: posts
    from remote users the viewer blocked, from remote users they muted (unless `includeMuted`), and
    from any blocked instance. **Fails closed** — if the moderation lookup throws, the page is
    empty rather than unfiltered, because returning it unfiltered would show a user content from
    accounts they blocked.
  - `hasMore` is computed from the *filtered* count, not the raw total. Comparing `offset + items`
    against the unfiltered total makes pagination report phantom pages.
  - `limit` is clamped to 1..50 and `offset` floored at 0, so a caller cannot request an unbounded
  page.
  - Uses the **existing** `OptionalJwtAuthGuard` at `auth/optional-jwt-auth.guard`, which
    `posts.controller.ts` already depends on. An earlier pass in this same session created a
    *second* class with the same name under `auth/guards/`, which would have been registered
    separately by Nest — a controller could then silently pick up the wrong `handleRequest`
    depending on its import path. That duplicate is now a re-export of the canonical
    implementation, so there is one class under two reachable paths.
  - `JwtAuthGuard` is strict and would 401 anonymous users out of a public feed, and dropping the
    guard entirely would silently lose moderation. A verification failure downgrades to anonymous
    rather than erroring — acceptable **only** because this is a read-only public endpoint; it would
    be wrong on a mutating route.
  - ✅ Covered by 9 new `federation.service.spec.ts` cases (normalization, bookkeeping exclusion,
    limit/offset clamping, anonymous passthrough, block, mute, blocked instance, fail-closed, and
    `hasMore`).
- ✅ **Posts now federate on create (the local→remote direction was entirely missing).**
  `POST /federation/posts/federate` existed but had **no callers** — `posts.service.ts` never
  federated, so a post was never pushed to a peer unless a client manually hit the endpoint. The
  "universal" claim had no outbound post path at all. `createPost` now calls
  `PostFederationService.federateNewPost(savedPost, user.id)`.
  - New `post-federation.service.ts`. `FederationService` lives in `federation/`, which imports
    `PostsModule` to build a local outbox, so injecting it into `PostsService` directly is a
    **module cycle** (`PostsModule` → `FederationModule` → `PostsModule`). Broken with
    `forwardRef` on both sides, and the service resolves `FederationService` lazily via
    `ModuleRef` rather than taking a constructor dependency.
  - **Failure isolation is the point.** The call is fire-and-forget and never throws: the post
    is already saved and returned to the client, and a third-party server being down must not
    delay or roll back a user's post. `createPost` is deliberately *not* in a transaction with
    the fan-out and must not become one.
  - **Eligibility is narrow on purpose**, each exclusion a real leak if ignored: `PUBLIC` only
    (a non-public post handed to every peer destroys the audience boundary the local instance
    enforces), never encrypted (ciphertext is keyed to a recipient set that does not exist
    remotely and the body is a `[Encrypted Content]` placeholder), never anonymous (no author to
    attribute the activity to), never drafts. The spec asserts *every* `PostVisibility` member
    individually so a new enum member cannot silently start federating.
  - `getFollowerInstanceDomains` resolves **distinct** domains — 40 followers on one Mastodon
    instance must be one delivery, not 40 — and returns `[]` on a lookup failure rather than
    propagating.
  - `POST /federation/posts/:id/redrive` gives operators a manual retry for a post that failed
    while every peer was down. It loads the post via `getLocalPostForFederation`, which is
    **scoped to the author**; without that scope any authenticated caller could push someone
    else's post to their own followers under their own name. Drafts, encrypted, and anonymous
    posts are refused there too.
  - ✅ Covered by `src/federation/post-federation.service.spec.ts` (enabled gating, every
    exclusion, no-followers, failure isolation, missing service, non-array return) and by new
    `federation.service.spec.ts` cases (domain dedup, unresolved instance, lookup failure,
    author-scoped re-drive, draft/encrypted/anonymous refusal).
- ⏳ **Interop test against a real Mastodon instance (follow, post, boost, reply both
  directions) — still the exit criterion and still the gap.** Both directions are now
  implemented: remote→local follows persist and appear in the followers collection, and
  local→remote posts fan out on create. Unit coverage proves our signing is well-formed and
  our handlers do the right thing with fixed input; it does not prove a Mastodon instance
  accepts our delivery, nor that our expectations match a real implementation. This is the
  one item on the critical path to the "universal" claim that cannot be closed without a
  network.
- ✅ **Deleting a post now retracts it on every peer (a correctness guarantee, not a feature).**
  Deleting a local post previously propagated *nothing*, so every remote copy outlived the
  original indefinitely — the instance could publish a post federated and then never be able to
  take it back. That is the one thing federation must not allow.
  - ⚠️ **Correction: the call path was right but the effect was nil — this item did not actually
    work until the `federation_outbox` work below.** It was marked ✅ on the strength of the code
    existing. The activity id was written under one key and read under another, so every
    retraction silently no-opped. See the outbox entry further down; the bullets here describe
    intent that only became true afterwards.
  - New `federateDelete` emits a `Delete` wrapping a `Tombstone` whose `id` is the **original
    `Create` activity's id** (not the Note id — that is what lets a peer match and remove what it
    received) and `formerType: 'Note'`, which Mastodon checks to confirm the Delete was
    authorized by the creating actor. If the post was never federated, **nothing is sent** and the
    report is `skipped` — a Delete for an activity a peer never received is noise.
  - `federatePost` now gives the Note a **stable id** (`/federation/posts/{postId}`) and, after a
    successful delivery, records the activity id in the outbox so a later Delete can reference it.
    Failing to record it does not fail the delivery.
  - The federated retraction is wired into the **existing** `PostsService.remove(id, user)`, not a
  new method. An earlier pass in this session added a `deletePost(userId, postId)` that was
  **dead code** — `posts.controller.ts` calls the pre-existing `remove`, so the retraction would
  never have fired. The parallel method has been removed; two delete paths on one resource is how
  one of them silently stops being used. `remove` also handles the admin case and cleans up
  reactions/comments/reports, so it is the only correct place for this.
  - Federates the deletion only for public, non-anonymous, non-encrypted, non-draft posts,
  mirroring create eligibility, and **only when the caller is the author** (`remove` permits an
  admin to delete anyone's post; an admin deletion must not emit a `Delete` as the author, because
  the remote peer verifies the Delete against the creating actor and would correctly refuse it).
  The eligibility flags are captured *before* `postsRepository.remove` rather than read afterwards.
  Fire-and-forget: the local row is already gone and the delete already acknowledged, so an
  unreachable peer must not fail it.
- ✅ **Boost is wired (`federateAnnounce`).** `Announce` crosses instances by announcing the
  *original remote activity id* with the local user as the actor — sending the Note itself would
  *duplicate it as a new post instead of recording a boost.
  ⚠️ The *addressing* was wrong when this was marked done — it fanned out to the local user's
  follower instances rather than to the author of the boosted object. Corrected, and exposed over
  HTTP, in the outbox entry below.
- ✅ **Activity ids are now UUIDs, not `Date.now()`.** A millisecond timestamp collides whenever
  two activities are built in the same tick, and a post fan-out plus a delete for the same post is
  exactly that case. Peers key dedup and reply threading off the activity id, so a collision is a
  correctness bug, not cosmetic.
- ✅ **`federatePost`/`federateDelete`/`federateAnnounce` share one `fanOut`**, so all three get
  the same dedup, retry, and per-instance reporting rather than three divergent copies.
- ✅ **Federated retraction was implemented and had never fired — the write and the
  read used different identifiers.** `federatePost` recorded the *activity* id
  (`/federation/activities/<uuid>`) into `federated_posts`, while
  `federateDelete` looked up the *Note* id (`/federation/posts/<postId>`). The two
  can never be equal, so every `Delete` took the "no recorded federated activity"
  branch and emitted nothing. The instance could publish a post federated and
  never take it back — the one guarantee federation must not break. The ROADMAP
  entry above marked this ✅ on the strength of the code being present, which is
  the failure mode this document warns about elsewhere.
  - The test missed it because it stubbed `remotePostRepository.findOne` to return
    a matching row instead of round-tripping a real `federatePost` into a real
    `federateDelete`. A mocked lookup cannot detect a mismatched key.
  - New `federation_outbox` table + `FederationOutbox` entity + migration
    `1790100000000-FederationOutbox`: an activity id, the object id it acts on,
    its type, the local author, and the instances that accepted it. This is the
    ledger `Delete`/`Undo`/`Update` were all reaching for. Outbound bookkeeping
    also stops being written into `federated_posts`, which is the *inbound*
    content read model and needed an `author.id IS NOT NULL` filter purely to
    keep those ghost rows out of the federated timeline. That filter stays as
    defence in depth.
- ✅ **`Undo` is now possible at all, because outbound interactions are recorded.**
  ActivityPub requires an `Undo` to wrap the id of the activity the peer actually
  received. Without a ledger there is no way to build one, so every interaction
  this instance sends would have been permanent on the remote server — a like you
  can never take back, a boost you can never retract.
- ✅ **Outbound `Like` and `Undo (Like)`.** `FederateLikeDto` existed, was unused,
  and took a `targetInstance` **from the client** — a request aimed a `Like` at any
  host the server could reach. Replaced by `FederateRemoteObjectDto`, which carries
  only the `activityId`; the destination is resolved from the stored remote object,
  so a `Like` can only ever reach the instance that owns the post.
  - **Addressing was wrong, not just missing.** A `Like` goes to the inbox of the
    actor that *owns* the object. The only delivery path was `fanOut`, which pushes
    to the local user's remote *follower* instances — so the obvious
    implementation would have told every peer the user liked something. `Like`,
    `Announce`, and their `Undo`s now use `deliverToObjectOwner`; `Create`,
    `Update`, and `Delete` keep `fanOut`, because those audiences really are the
    followers. The split is now explicit in the `fanOut` doc comment.
  - Blocked instances are refused on this path too — a block that only covered
    `Create` would be bypassed by liking instead.
  - Idempotent: a repeated `Like` is a no-op rather than a second delivery, which
    Mastodon rejects and a retry would deliver.
  - HTTP: `POST /federation/likes`, `POST /federation/likes/undo`. The actor comes
    from the JWT, never the body.
- ✅ **`Update` propagates an edit.** `PostsService.update` previously federated
  nothing, so peers kept the pre-edit text indefinitely — the same class of defect
  as the missing retraction, on a path that was already wired.
  - `federateUpdate` reuses the original Note id (a new one would make a peer
    *create* a second post rather than edit the first) and preserves `published`,
    because an edit that moved a post's timestamp would reshuffle every remote
    timeline that has already placed it.
  - Recipients come from the outbox's `deliveredTo`, not the current follower list.
    A follower the author has since unfollowed still holds a copy, and recomputing
    targets would strand it with stale content permanently. `Delete` uses the same
    list for the same reason.
  - Refuses to propagate `[Encrypted Content]`: a post can be switched to encrypted
    after it was federated, and pushing the placeholder would replace real text on
    every peer with the literal string.
  - Eligibility re-checks every exclusion `federateNewPost` applies, because a post
    can be edited *into* a non-public state. The spec asserts each one individually
    so a new `PostVisibility` member cannot start leaking.
  - Fire-and-forget and non-throwing: the edit is already saved and returned to the
    client.
  - **There is deliberately no "federate an edit" endpoint.** Such a route could
    only read the pre-edit row and would push stale text to every peer; the
    propagation belongs on the one path that has both the new content and the
    author.
- ✅ **`Announce` is reachable, and `Undo (Announce)` exists.**
  `POST /federation/announces`, `POST /federation/announces/undo`.
  - `federateAnnounce` previously took `targetInstances` and fanned the boost out to
    the *local user's followers*. A boost is addressed to the author of the boosted
    object; the follower fan-out is the wrong audience and the signature invited
    callers to name the targets. It now resolves the owner, and the
    `targetInstances` parameter is gone rather than left as a dead argument.
- ✅ **The author is read consistently across the federation routes.** Six handlers
  read `user.userId || user.id` and `federatePost` read only `user.id`. Since
  `JwtStrategy` publishes the subject as `userId` with an `id` alias, a route
  reading the wrong key sends `undefined` as the activity's actor and the delivery
  is signed as nobody. One `userId()` helper now.
- ✅ Covered by `outbox.federation.spec.ts` (Like addressing/sign-off/ledger/
  idempotency/blocked instance, `Undo` wrapping the recorded id for both Like and
  Announce, `Update` object id + `published` + re-targeting + placeholder refusal,
  and a **real `federatePost` → `federateDelete` round trip** against a ledger
  whose reads resolve its own writes — the test shape that would have caught the
  retraction bug) and by new `post-federation.service.spec.ts` cases for the edit
  path.
- ✅ **The client surface now exists — `/federation`.** Until this pass the four
  interaction endpoints had **zero callers**, which is the dead-code shape this
  document keeps flagging elsewhere (a second delete path, an unexposed boost).
  The page renders the real `getFederatedTimeline` read model with per-post
  like/boost and their undos, and is wired into routing and the Discover nav.
  - **The button state is driven by the server's report, never optimistically.**
    `interpretReport` (exported and unit-tested) decides what the UI is allowed
    to claim, and the two interesting cases are not `delivered > 0`:
    `"already federated a Like"` while liking and `"never federated"` while
    unliking are both *skipped*, yet both leave the world in the state the user
    asked for — reporting them as failures would make a correct idempotent
    response look broken. Conversely a **refused** retraction keeps the liked
    state, because the like is still on the other server. Flipping either way
    without evidence is the optimistic-UI lie.
  - A **timeline error and an empty timeline are mutually exclusive** branches.
    Rendering both is the same defect that got the four community pages
    de-routed: an outage that also says "no remote posts have reached this
    instance yet" is indistinguishable from genuinely having none. The error
    says the contents are *unknown*.
  - A **stats** failure is tracked separately and does not blank the feed.
  - **The page states plainly that outbound federation is off by default** and
    that delivery to a live Mastodon instance is unverified, driven by the
    server's own `federationEnabled` flag rather than hardcoded. It does not
    claim interoperability the repo cannot demonstrate yet.
  - Signed-out visitors can read the timeline (the endpoint is public) and the
    action buttons are **disabled with a sign-in prompt** rather than left to
    401 on tap.
  - Remote **attachments are rendered as links, never as auto-loading images**:
    fetching a third party's media URL hands them the user's IP and user-agent
    on every render, and their bytes are arbitrary. Avatars do load, because a
    social feed without them is not usable.
  - Fixed a dev-server gap this exposed: `vite.config.ts` proxies every API
    prefix except `/federation`, so the page would have 404'd locally — Vite
    would serve the path itself instead of forwarding it to Nest.
  - ✅ `client/src/pages/federation.test.tsx` (6 `interpretReport` cases plus 9
    render cases, including the two failure modes above).
- ⏳ **Still not proven against a real peer.** The UI is a faithful client for
  what the server does, but whether a Mastodon instance *accepts* a delivery is
  unchanged and is still the Phase 4 exit criterion. `FEDERATION_ENABLED` is
  still `false` by default, so on a default instance this page shows an honest
  empty timeline and a warning — which is the correct behaviour, not a bug.
- ⚠️ **Never executed** (no shell in the authoring session). Every assertion was
  traced against the code, not run. Check on the first real run, in likelihood
  order: (1) the server constructor gained a 10th argument — the new spec
  harness pins the order explicitly, but grep for any other
  `new FederationService(`; (2) `npm run migration:verify` drift check against
  the new entity; (3) `npm run test:ci` in `client/` for the new page spec,
  where the accessible-name queries depend on lucide icons being
  `aria-hidden` and the action buttons not having visible "Liked"/"Like"
  ambiguity (`/^like\b/`, not `/^like/`).
- **Exit:** a Mastodon user can follow a Zynkra user and see their posts, and vice versa.

### Phase 5 — Data ownership & portability (M) · *the anti-lock-in promise*
Goal: users truly own their data.
- ✅ Whole-account JSON export (`GET /data-export/download`, zipped via `POST /data-export`)
  `v2.1.0`: profile, posts+media, comments, reactions, follows, bookmarks, stories, reels,
  messages (sent + received, now with conversation context), articles, podcasts, courses,
  enrollments, group memberships, notifications, orders, wallet ledger, verification,
  linked accounts, settings, personalization, analytics.
- ✅ Media bundled into the zip download (posts, stories, DM attachments, podcast audio,
  avatar/header); the `media/` folder can be dropped into a fresh instance's `uploads/` to
  re-host restored posts.
- ✅ Transactional import (`POST /data-export/import`) now covers, on top of
  profile/settings/posts/media/comments/reactions/bookmarks/stories/follows:
  - **DMs** — 1:1 threads are restored when the counterpart exists (resolved by username);
    an existing thread with that peer is reused, so re-importing appends. Group and
    unknown-peer threads are counted as skipped. Encrypted envelopes are preserved verbatim
    (the server can never decrypt them).
  - **Wallet** — imported as *archival history* (rows tagged `imported`); it does not
    restore spendable balance.
  - **Orders** — header-only records; line items reference products that don't exist on the
    new instance.
  - **Verification** — re-created as a record but never grants a badge (importing an
    `approved` request does not set `user.verified`).
  - **Linked accounts** — metadata only; OAuth credentials are neither exported nor
    imported (re-link to use).
  - Covered by `test/data-export.portability.spec.ts` (in-memory transaction harness).
- ✅ **Zip import with media re-hosting** (`POST /data-export/import-zip`, multipart
  `file`): accepts the export archive (`data.json` + `media/<basename>`), re-hosts every
  flat `media/` file into this instance's `UPLOAD_DIR`, then runs the JSON import — so
  posts/stories/DM attachments/podcasts/avatar resolve locally after an instance move.
  Guards: zip-slip sanitization, 256 MiB/entry and 1 GiB total uncompressed caps, flat
  `media/` only. Covered by `src/data-export/import-zip.service.spec.ts`.
- ✅ **Scheduled/automated exports** (Wave 5's last open item): per-user opt-in via
  `GET/POST /data-export/schedule` (7/14/30/90-day intervals) arms an hourly cron that
  generates a fresh archive (`origin: scheduled`), with history at
  `GET /data-export/history`. Archives moved out of the publicly served `uploads/`
  directory — where they had been protected only by UUID unguessability — into a private
  `EXPORT_DIR` (default `./exports`) reachable only through the owner-guarded
  `GET /data-export/archive/:id`. Nightly retention (`EXPORT_RETENTION_DAYS`, default 30,
  `0` disables) expires archive files while history rows survive with `fileUrl` cleared.
  UI: Settings → data & privacy → "Automatic backups" (toggle, interval, next/last run);
  both export download paths now fetch authenticated blobs because raw links 401 once the
  archive leaves `/uploads/`. Covered by `src/data-export/data-export.service.spec.ts` (17).
- **Exit:** a user can export their full account and re-import it into a fresh instance.
  (Content + DMs with existing peers ✅; scheduled automatic exports ✅; money and trust are
  archival **by design** — import never fabricates a balance, a badge, or credentials.)

### Phase 6 — Promote Previews to real, one at a time (ongoing L)
Goal: expand the surface *only* as each feature earns "real" status.
- Prioritize by usage/strategic value: likely groups → stories/reels → marketplace → events → dating.
- Each promotion repeats the Phase-1 discipline: end-to-end audit + tests + remove the "Preview" label.
- **Exit (per feature):** works end-to-end, has tests, no "Preview" tag.

### Phase 7 — Mobile & offline-first (L) · *reach*
Goal: native reach and genuine offline.
- `mobile/` exists — bring it to parity with Core.
- Upgrade the offline queue into a real conflict-resolving sync engine (currently a queue only).
- **Exit:** Core loop works on mobile and survives going offline/online with no data loss.

---

## 4. Dependency graph (why this order)

```
Phase 0 (truth + CI) ──► everything
        │
        ├─► Phase 1 (Core + media) ──► Phase 2 (money)      [media unblocks uploads everywhere]
        │                          └─► Phase 6 (previews)
        ├─► Phase 3 (E2EE DMs)      [independent of money; needs Core DMs stable]
        ├─► Phase 4 (federation)    [independent; needs Core posts stable]
        └─► Phase 5 (portability)   [needs Core data models stable]
Phase 7 (mobile/offline) ──► after Core (P1) is stable; can overlap 3–5
```

**Critical path to a credible public beta:** Phase 0 → 1 → 2. That yields an honest product
with a working daily loop and a real creator-payout differentiator. Phases 3–5 are what make
the *"universal / user-owned"* story true and can proceed in parallel by different people.

---

## 5. Definition of "done" (applies to every feature)

1. Works end-to-end on a clean database with no console/server errors.
2. Has integration tests that run in CI.
3. No mocked data presented as real; anything shallow is labeled "Preview."
4. Docs (README/ARCHITECTURE/API) match the actual behavior.
5. Handles the unhappy path (auth failure, empty state, network error).

---

## 6. What we are explicitly NOT doing (and why)

- **On-chain identity / DAO / token / tipping-via-crypto** — deep, low-ROI for a social MVP;
  wallet-sign auth already covers the useful 90%. Revisit post-beta if there's demand.
- **On-device LLM (Llama 3 in-browser)** — huge effort, currently 100% mocked. If AI stays,
  use a hosted model behind a clear "AI" label; don't claim on-device.
- **Metaverse / snapmap / digital-twin / brainwave-auth / planetary-communities** — archived.
  They signal scope-thrash, not product. Not on the path to "universal social media."
- **Chasing 77 modules to completion** — we finish the ~20 that matter, label previews, cut the rest.

---

## 7. Immediate next actions (this week)

1. ~~Set up CI (lint + typecheck + build) for client and server~~ ✅ Done (`client-ci.yml`, `server-ci.yml`).
2. ~~Relabel/flag the three credibility bombs (E2EE, federation, AI).~~ ✅ Done — see updated bomb status in §1.
3. ~~Archive the facade modules out of the product surface.~~ ✅ Done —
   (`token`, `token-gated-content`, `dao`, `snapmap` deleted; `/blockchain-identity`, `/dao`,
   `/token-gated`, `/snapmap` de-routed; cut pages moved to `client/src/archive/pages/`;
   the 64 dead stub services under `server/src/features/*` deleted 2026-10-21 — only the
   registered `features/account-management` remains). See Phase 0 above — and note the
   `archive-modules.sh` correction.
3. ~~Stop the placeholder files claiming to be implemented.~~ ✅ Done —
   `client/src/features/missing-features.ts` (108 exports) and
   `client/src/components/missing-features.tsx` (61 components) were unused by
   2026-10-21 and have been deleted; the server `features/qa` stub went with the
   features/* facade deletion.
4. ~~Commit and finish the in-flight wallet/payments migration cleanly (don't leave it dangling).~~ ✅ Done (Phase 2: 90/10, platform ledger, webhook replay/refund tests).
5. ~~Pick the media backend (S3 vs local+CDN) — it blocks Phase 1.~~ ✅ Local disk + optional CDN
6. **Fix the test-integrity problems** — substantially done. `server/test/immersive-learning.test.js`
   and `archive-library.test.js` had been neutralized into placeholders; with the four
   community pages now de-routed (item 7) their stated revival condition is met, so both
   files are obsolete and should be deleted.
   ✅ The two *live* ones are now real coverage: `deepfake-detection.test.js` and
   `memory-documentary.test.js` tested genuinely shipped modules (`MemoriesModule`) but used
   `node:test` inside a Jest project whose `testMatch` is `['**/*.spec.ts', '**/*.test.ts']`,
   so they had never been collected by any runner. Both are now Jest specs at
   `src/memories/deepfake-detection.spec.ts` and `src/memories/documentary-builder.spec.ts`,
   where `test:unit` and CI pick them up. The original assertions were traced against the
   current implementation before being carried over (all still hold) and the scoring bands,
   truncation limits, and defaults — previously untested — are now pinned.
    ✅ **Deletions done.** The four superseded `.js` files, `federation.service.test.js`, and
    the redundant CommonJS twins in `server/src/memories/` (`deepfake-detection`,
    `documentary-builder`, `memory-projects`) are deleted. `memory-projects.test.ts` — a
    `node:test` file whose ESM `import.meta` could never compile under ts-jest (it was collected
    by `test:integration` but always failed to load) — was ported to Jest as
    `src/memories/memory-projects.spec.ts`, where `test:unit` and CI collect it, and the broken
    original removed. ⚠️ For the record, this was previously recorded as a build hazard and
    that was wrong: `tsconfig.json` does not set
    `allowJs` (so it defaults to `false` and `tsc` ignored the `.js` files entirely) and
    `nest-cli.json` declares no `assets`, so nothing copied them into `dist/` either. They
    were dead code, not a collision risk, and `moduleFileExtensions` lists `ts` before `js`, so
    resolution picked the `.ts`. The reason for deleting them was dead weight, not build
    safety — and now they are gone.
    ✅ **Federation is no longer uncovered.** `jest.config.js` listed `/src/federation/` in
    `testPathIgnorePatterns`, but that entry was **inert**: every npm script passes
    `--testPathIgnorePatterns` (`test:unit` and `test:coverage` with `/test/`,
    `test:integration` with `/src/`), and a CLI flag *replaces* the configured array rather
    than merging. It only ever applied to a bare `npx jest`. The real reason federation had
    no coverage was that its only test, `federation.service.test.js`, was a `node:test` file
    under a Jest `testMatch` of `['**\/*.spec.ts', '**\/*.test.ts']` — no runner ever
    collected a `.js` test. That file was also **stale**: it constructed the service with 6
    arguments against a constructor that now takes 8 (`moderationRepository` inserted at #4,
    `httpSignaturesService` appended at #8), so every argument from #4 on was bound to the
    wrong dependency, and it never stubbed `axios.get`, so `fetchRemoteUser` would have
    attempted real network calls. It could not have passed as written. It is now
    `federation.service.spec.ts`, ported to Jest with the ctor order made explicit in a shared
    harness (so it cannot silently drift again) and coverage extended well past the original
    six cases: Create/Follow/Like/Announce/Delete/Update/Undo handling, `fetchRemoteUser` and
    `fetchRemotePost` cache-hit short-circuits, `probeInteroperability` (compatible, degraded
    webfinger, unreachable), `deliverToInbox` retry-then-succeed / exhaust-and-rethrow /
    no-baseUrl no-op, the `FEDERATION_ENABLED` guard on `federatePost` and `sendFollow`,
    per-user remote block/mute, the local actor/followers/following/outbox/WebFinger surface,
    and instance administration. Added alongside it, `http-signatures.service.spec.ts`, which
    was uncovered and is the actual Phase 4 blocking gap: it verifies signatures
    cryptographically with `crypto.verify` against the instance public key over a
    hand-reconstructed draft-cavage-10 signing string, asserts the `Digest` header matches the
    SHA-256 of the exact body, and asserts that altering the body, the request line, the host,
    the port, or the query string each makes verification fail. The dead config entry is
    removed and the comments in `jest.config.js` corrected.
    ⚠️ **These two specs have never been executed** — they were written in a session with no
    working shell, so `npm run test:unit` / `test:coverage` could not be run. Every assertion
    was traced by hand against the current implementation, but "traced" is not "green". Three
    things to check on the first real run, in order of likelihood:
    1. **Module load.** `federation.service.spec.ts` mocks `../users/users.service` and
       `../posts/posts.service` (as the old `Module._load` patch did) but *not* the entities,
       so `federation-moderation.entity.ts` still pulls in the real `users/entities/user.entity`.
       If that entity has a heavy transitive import, add a `jest.mock` for it.
    2. **Coverage threshold.** CI enforces 50% lines/functions/branches/statements, and
       `collectCoverageFrom` is not set — so coverage counts only files a test actually
       loaded. Federation was previously never loaded and therefore absent from the
       denominator; ~1,076 lines just entered it. If the job goes red on the threshold, that
       is arithmetic, not a broken test.
    3. **Assertion drift.** If something fails, suspect the test before the service: the
       expectations were derived by reading the code, not by running it.
    ✅ **The three claim-proving specs are no longer orphans — they now run in CI.** This was
    the most serious finding of the pass, and it is not about federation at all:
    `test/e2ee.dm.spec.ts`, `test/data-export.portability.spec.ts`, and
    `test/federation-wellknown.spec.ts` had **never been executed by any script or CI step.**
    The cause is an exclusion nobody noticed: `test:unit` and `test:coverage` both pass
    `--testPathIgnorePatterns=/test/`, which excludes the entire `test/` directory (and, as a
    CLI flag, *replaces* the configured array), while `test:integration` passes
    `--testPathIgnorePatterns=/src/` instead. Every remaining script — `test:core`,
    `test:core-db`, `test:money`, `test:e2e`, `test:qa` — names its paths explicitly, and none
    of them list these three. So the only evidence for three headline claims sat in a directory
    that every code path skipped. `e2ee.dm.spec.ts` is 251 lines of real work: a libsodium
    `crypto_box_easy` round-trip proving ciphertext-only storage, rejection of plaintext on
    encrypted threads, rejection of plaintext *edits*, and progressive upgrade of a legacy
    thread on its first encrypted send. `data-export.portability.spec.ts` is the transactional
    import harness. `federation-wellknown.spec.ts` covers the WebFinger/NodeInfo controllers.
    None of it had ever run. A new `test:claims` script runs all three, is wired into
    `npm test` (root and server) and into a CI step in the `test-unit` job.
    ⚠️ **These have also never been executed** — the script was added in the same session
    without a working shell. If a spec fails, that is the truth surfacing, not a regression to
    revert: fix the spec or the code, but do not silence it. Expect the E2EE suite to pass
    (it was written carefully against the current `DmsService`); treat the other two as
    genuinely unproven until they go green.
    ✅ **The file deletions this passage used to beg for are done** (previous sessions had no
    shell to remove files with): `federation.service.test.js`, the four superseded `.js` test
    files (`immersive-learning`, `archive-library`, `deepfake-detection`, `memory-documentary`),
    and the three CommonJS twins in `src/memories/` are all gone. ✅ **Also done 2026-10-21:**
    the 64 stub directories under `server/src/features/*` are deleted (only the registered
    `features/account-management` remains), and the `token/`, `dao/`, `token-gated-content/`,
    `snapmap/` dirs are deleted with their client surface. Still open: `e2e-smoke`/`qa-smoke`
    only cover `AppController` — they never boot `AppModule` or touch the database.
    ✅ **The headline counts are no longer inflated.** `PLAN.md` advertised "Backend Modules: 83"
    and "Frontend Pages: 79" in a table titled "By The Numbers." The actual counts are **105
    feature directories and 128 page files** — so the docs were wrong in the *flattering*
    direction, and the mechanism matters: counting directories counts facade as delivery.
    `server/src/features/*` holds 64 stub directories, each a single file of one
    `console.log`-per-method and never registered in `app.module.ts` (so not even a 404 is
    reachable). That is why `automotive/`, `healthcare/`, `government-services/`,
    `legal-services/`, and `real-estate/` all read as finished features on a code review. The
    table now breaks the 105 down as ~20 load-bearing + ~12 Preview + 64 facade, so the
    directory count can no longer be misread as a delivery number. The 4,000+ feature blueprint
    is a brainstorm list, not a backlog: ~20 load-bearing modules is a *normal* social product,
    and the 64 stubs are the evidence of what happens when someone tries to bulk-generate
    toward 4,000 instead of finishing things.
    ✅ **Docs no longer contradict the code.** `README.md` claimed under "Not started" that the
    server "stores message content as received" and "does not yet enforce E2EE" — both false;
    `dms.service.ts` rejects plaintext on encrypted threads. It also claimed federation was
    "in progress" for signing, which shipped. `PLAN.md` was worse: it listed DAO Governance,
    Token-Gated Content, Nonprofits, Self-Sovereign ID, an in-app token system, and Snap Map
    as shipped ✅, in four separate tables, including as two of the "15 Structural Advantages"
    competitors "cannot copy." Cut features are now struck through with the reason inline
    rather than quietly deleted, so the gap stays visible. ROADMAP.md was the accurate document
    throughout; the marketing docs were the thing out of sync.

7. **Decide what to do about the four primary-nav community pages** (`/skill-sharing`,
   `/cultural-preservation-communities`, `/crisis-response-communities`,
   `/accessibility-first-communities`). ✅ Done — de-routed. Verified there is no
   `skill-sharing` module in `server/src` and no matching stub under
   `server/src/features/*`, so `GET /skill-sharing` and the three siblings have never
   existed. The four `<Route>` entries, the "Communities" section of `MORE_SECTIONS`, and
   the four now-unused `lazy` imports are removed from `client/src/App.tsx`, with a comment
   recording the decision and how to reverse it. The components stay on disk; the routes
   and the nav must not come back without the backend. A stale URL now lands on the real
   `NotFoundPage` instead of rendering a fake empty list.
8. **Verify the Arbitrum USDC address** in `wallet/crypto-payouts.service.ts` — ✅ Done. It
   read `0xaf88d065b77c8c223d7d5ac3b63c4c8c6c6b6b6`, which is not USDC on any chain; the real
   Circle-issued Arbitrum USDC is `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` (confirmed
   against Circle's contract-address list, which also confirmed the Ethereum/Polygon/Base
   entries were already correct). Note the old value was a *valid* 20-byte hex address, so no
   format check would ever have caught it — the address is now pinned to the documented value
   by `wallet/crypto-payouts.spec.ts`, and `assertUsdcContract` additionally does an
   `eth_getCode` before the wallet is debited, so a wrong-but-well-formed address fails the
   payout instead of reverting opaquely or transferring nothing. Still gated behind
   `CRYPTO_PAYOUTS_ENABLED=false`.
9. ~~Add the missing `role` claim to the JWT principal so admin/role-gated routes work.~~ ✅
   Done — `jwt.strategy.ts` now returns `role` (and an `id` alias). `AdminGuard`/`RolesGuard`
   previously 403'd for everyone, which made the entire admin console and the manual payout
   approval queue unreachable. `RolesGuard` also did substring matching
   (`'superadmin'.includes('admin')`); it is now an equality check.
10. ~~Authenticate every WebSocket namespace.~~ ✅ Done — new `WsAuthService` verifies the
   handshake JWT *and* the backing `LoginSession`, so revocation/sign-out closes live sockets.
   Applied to notifications, snapmap, livekit, collaboration, liveshopping, webrtc, channels.
   `payload.userId` / `payload.hostId` / `payload.isHost` are no longer trusted for identity.
11. ~~Fix SIWE, which issued tokens the JWT strategy rejected.~~ ✅ Done — `siwe.controller.ts`
   now creates a `LoginSession` and signs `{sub, email, sid, typ:'access', aud}`. It also
   stopped swallowing verification errors into a double response.
12. ~~Remove the unauthenticated demo endpoints from the production route table.~~ ✅ Done —
   `/mobile/feed` and `/mobile/posts` are gated behind `MOBILE_DEMO_ENDPOINTS_ENABLED`
   (default `false`) and return 404 otherwise.
13. ~~Secure `/graphql`.~~ ✅ Done — `GqlAuthGuard` verifies the bearer JWT + `LoginSession`
   on every resolver, and both resolvers re-apply `VisibilityService` (blocks, private
   accounts, and non-public posts 404 rather than 403). Also stopped writing the generated
   SDL into `src/` at boot, which broke a read-only production container.
14. ~~Fix forgeable client IPs.~~ ✅ Done — `TRUST_PROXY` (default `1`) configures
   `app.set('trust proxy', …)`; `getRequestIp` now reads `req.ip` instead of the raw
   `x-forwarded-for` header. `TRUST_PROXY=true` is rejected at boot.
15. ~~Replace the `MemoryStore` session backend.~~ ✅ Done — `PostgresSessionStore` +
   migration `1789400000000-CreateSessionStore`. Passkey challenges, the SIWE nonce, and
   the wallet-link nonce now survive restarts and work across instances. Session cookie
   gained `httpOnly`, explicit `sameSite: 'lax'`, and a bounded `maxAge`.
16. ~~Bound the translation cache.~~ ✅ Done — insertion-ordered LRU with
   `TRANSLATION_CACHE_MAX_ENTRIES` (default 1000). The cache key contains attacker-supplied
   text, so the old unbounded `Map` was a memory-exhaustion vector.
17. ~~Make the security audit able to fail.~~ ✅ Done — `scripts/security-audit.js` rewritten
   to 7 real checks and now `process.exit(1)` on findings. It previously always exited 0
   while running as the `security-audit` CI job.
18. ~~Correct the "cut modules" comment in `app.module.ts`.~~ ✅ Done — it wrongly listed
   `TokenGatedContentModule` and `SnapMapModule` as unwired; both are registered
   transitively via `posts.module.ts`, `groups.module.ts`, and `feed.module.ts`. Only
   `TokenModule` and `DaoModule` are genuinely unwired.
19. ~~Run `npm audit` and `migration:verify` in CI.~~ ✅ Added as advisory
   (`continue-on-error`) — the dependency tree is not yet clean, so making them blocking
   would only produce a permanently red job. Flip to blocking once they pass.
20. ~~Rate-limit `POST /auth/refresh`.~~ ✅ Done — a dedicated 20/min-per-IP bucket. It is a
   pure guessability surface (it mints an access token from a refresh token) and previously
   fell back to the 300/min global limit.
21. ~~Close the wildcard WebSocket CORS.~~ ✅ Done — `ws-cors.ts` resolves origins from
   `CLIENT_URL` / `WS_ALLOWED_ORIGINS` and applies them in `afterInit`, because the
   `@WebSocketGateway` decorator is evaluated at import time, before `ConfigModule` loads
   `.env`. All eight gateways now use it; none declares `origin: '*'`.
22. ~~Rate-limit socket messages.~~ ✅ Done — `WsRateLimiter`, a per-socket fixed window
   (`WS_RATE_LIMIT_PER_MINUTE`, default 240) that drops over-budget messages and disconnects
   after `WS_RATE_LIMIT_CLOSE_AFTER` consecutive violations. This mattered more once sockets
   became authenticated. Applied to collaboration, webrtc, liveshopping, and channels.
23. ~~Stop `feed.service.ts` reaching into `SnapMapGateway`'s private state.~~ ✅ Done —
   extracted `LocationService`; `SnapMapModule` exports it and `FeedService` depends on it.
   The old `@ts-expect-error` access to a private `Map` meant renaming or reshaping that
   field broke the local feed at runtime with no compile-time signal.
24. ~~Restrict who may start a flash sale.~~ ✅ Done — `liveshopping.gateway.ts` now checks
   the event's `hostId` against the authenticated socket. Previously any authenticated
   client could announce a flash sale to every viewer in a room.
25. ~~Fix the biometric "authentication" endpoints.~~ Partially done. The concrete bugs are
   fixed: the challenge and its id were generated with `Math.random()` (now `randomBytes`),
   the fingerprint comparison accepted anything within 97% Levenshtein similarity — on a
   64-char hex digest that permits a Hamming distance of 1, so a hash off by one character
   verified (now exact + `timingSafeEqual`), and challenges lived in an in-process `Map`
   (now `biometric_challenges` + migration). The endpoints are now documented as **device
   management and possession re-verification, not authentication**: all of them sit behind
   `JwtAuthGuard`, and `verifyBiometricChallenge` issues no token. The underlying property
   is unchanged and unfixable without a client change — the "fingerprint" is a hash of
   bytes the client supplied, so the client can always reproduce it. **Passkeys
   (`/auth/webauthn/*`) are the real implementation and already exist.** Open: decide
   whether to keep the endpoints at all, or delete them and point the UI at passkeys.
26. ~~Persist CAPTCHA challenges.~~ ✅ Done — `captcha_challenges` + migration. They were an
   in-process `Map`, so a challenge issued on one instance could not be redeemed on another.
   `generate` now uses `randomInt`, and the row is consumed on every attempt (pass or fail)
   so a challenge cannot be brute-forced. Available on signin too, behind
   `CAPTCHA_REQUIRED_ON_SIGNIN` (default off so existing clients keep working).
27. ~~Fix predictable security tokens from `Math.random()`.~~ ✅ Done — the 6-digit email
   verification code in `signUp` and `resendVerification` used `Math.random()` (now
   `randomInt`), and `POST /auth/verify-code` had no attempt counter, so the throttle was
   the only barrier to a 1-in-a-million guess. That endpoint now has its own 10/min bucket.
28. ~~Fail loudly instead of silently rejecting all socket origins.~~ ✅ Done —
   `resolveWsOrigins` falls back to `CLIENT_URL` when `WS_ALLOWED_ORIGINS` is unset, and
   throws at boot if neither is configured. An earlier version returned an empty list in
   production, which would have looked like "real-time is broken" rather than a
   misconfiguration.
29. ~~Add a per-account lockout to email verification code redemption.~~ ✅ Done — new
   `emailVerificationAttempts` / `emailVerificationLockedUntil` columns + migration
   `1789700000000`. Past `VERIFICATION_CODE_MAX_ATTEMPTS` (default 5) redemption is blocked
   for `VERIFICATION_CODE_LOCKOUT_MINUTES` (default 15). Success and issuing a fresh code
   both reset it. Previously the per-IP throttle was the *only* barrier to grinding a
   6-digit code.
30. ~~Add CSRF protection to the session-authenticated routes.~~ ✅ Done — `CsrfGuard`
   (double-submit) on `POST /auth/webauthn/{registration,authentication}/verify`,
   `POST /siwe/verify`, and `POST /wallet/connect` — the three flows whose only credential
   is the session cookie (WebAuthn challenge, SIWE nonce, wallet-link nonce). Tokens are
   minted by `GET /auth/csrf-token`, `/siwe/nonce`, and `/wallet/connect/challenge`, and the
   client mirrors them in `X-CSRF-Token`. Bearer-token requests and safe methods bypass the
   check, so ordinary API calls are unaffected. `CSRF_PROTECTION_ENABLED=false` to disable.
   (The guard parses the raw `Cookie` header itself — this server has no `cookie-parser`,
   and `express-session` does not populate `req.cookies`.)
31. ~~Delete the `/auth/biometric/*` surface.~~ ✅ Done. It had **zero callers** — the five
   client wrappers in `lib/api.ts` had no importers anywhere, and passkeys had already
   replaced the UI. It was also **broken on a clean database**: `biometric_devices` had no
   migration, and `synchronize` is off. And it was not authentication — the "fingerprint" was
   a SHA-256 of bytes the client supplied, so the client could always reproduce it, and the
   verify endpoint issued no token. Routes, service, entities, and module wiring removed;
   migration `1789500000000` now drops both tables. `biometric-auth.service.ts` is left on
   disk with a `@deprecated` header as a record of the decision, and `lib/api.ts` records the
   five removed wrappers. **Use passkeys** (`/auth/webauthn/*`).
32. ~~Make the moderation bias metrics real.~~ ✅ Done — `getFeedRepresentationMetrics` read
   `feedMetricsHistory`, an in-process array nothing ever appended to, so it always returned
   `[]`; it now computes from `moderation_queue_items`. `applyBiasMitigations` pushed into an
   array nothing read, so it reported "applied" while leaving no trace; applied strategies
   are now persisted to `moderation_mitigations` (new `GET /moderation/bias/mitigations`).
   Also replaced the file's last `Math.random()` id generator with `randomUUID`.
33. ~~Stop writing the GraphQL SDL to disk on boot.~~ ✅ Done — `autoSchemaFile: true` builds
   the schema in memory from the code-first resolvers. The target was `src/` (broke read-only
   production containers), then a temp dir (still wrote a file every boot for no reason).
34. ~~Fix the false-negative security risk assessment.~~ ✅ Done. `getSecurityRiskAssessment`
   scored 2FA, passkeys, and failed logins from a `SecuritySettingsService` in-process `Map`
   that **nothing outside that file ever wrote to**, while the real state lives on
   `User.twoFactorEnabled`, the `authenticators` table, and `security_audit_logs`. The effect
   was worse than useless: a user who *had* enabled 2FA was told to enable it and lost 25
   risk points, because the map was always empty. It now reads real state and returns the
   signals it actually measured. `getSecuritySettings` likewise overlays real 2FA/passkey
   state and returns a `notEnforced` list naming the flags that are held in memory and
   enforced by nothing (`sessionTimeout`, `verifyNewDevices`, `loginApprovalsEnabled`,
   `securityLevel`, `biometricAuthentication`).
35. ~~Make trusted IP addresses an actual control.~~ ✅ Done. `trustedIpAddresses` was held in
   the same in-process `Map` and consulted by nothing — `createLoginSession`'s `isTrusted`
   parameter was never passed as `true`, so `LoginSession.isTrusted` was always `false` and
   adding a trusted IP changed nothing. Now persisted to `User.trustedIpAddresses`
   (migration `1789900000000`) and checked by `AuthService.isTrustedIp`; a sign-in from a
   listed address skips the new-device prompt. Matching is exact-only on purpose — a partial
   CIDR implementation would be worse than none, since a user who thought they had trusted a
   /24 would still be challenged. Removed from `notEnforced`.
36. ~~Make the CAPTCHA risk-triggered instead of opt-in.~~ ✅ Partially. The CAPTCHA is still
   just an `a + b` puzzle any script can solve — it is a speed bump, and the code and docs
   now say so plainly. What changed is *when* it is demanded: it is required when
   `CAPTCHA_REQUIRED_ON_SIGNIN=true`, when a client supplies one, **or** when the identifier
   has `CAPTCHA_FAILURE_THRESHOLD` recent failures counted from `security_audit_logs` (so it
   escalates during credential stuffing instead of taxing every legitimate user, and works
   across instances). Real coverage still needs a third-party challenge or risk scoring —
   see item 4 below.
37. ~~Add CIDR support to trusted addresses.~~ ✅ Done — `common/ip.ts`, a dependency-free and
   deliberately DNS-free IP/CIDR matcher. It rejects leading-zero octets (`010.0.0.1`) because
   those are ambiguous between parsers and a mismatch inside an allowlist is a security bug,
   unwraps IPv4-mapped IPv6 (`::ffff:a.b.c.d`, what Node reports for IPv4 clients), handles
   `::` compression and zone indices, and will not let an IPv4 address match an IPv6 range
   or vice versa. A hostname entry simply never matches, so an attacker-controlled DNS
   record cannot widen the allowlist. ~60 unit tests. This also replaced the old
   `isValidIpAddress`, whose IPv4 regex accepted `999.999.999.999` and which rejected CIDR
   entirely.
38. ~~Enforce a server-side session timeout.~~ ✅ Partially. The per-account
   `sessionTimeout` / `sessionTimeoutMinutes` values were stored in memory and read by nothing,
   so a session a user believed would time out stayed valid until it expired or was revoked.
   There is now a real idle timeout enforced in `JwtStrategy` against
   `LoginSession.lastSeenAt` (`SESSION_IDLE_TIMEOUT_MINUTES`, default `0` = off so existing
   deployments are unaffected), which revokes the session and returns 401. The per-user
   preference is still not honoured — it remains in `notEnforced`, which now explains the
   distinction.

---

## 8. Security work still open

1. **CSP `styleSrc` still includes `'unsafe-inline'`.** Removing it needs a nonce- or
   hash-based CSP plus conversion of every inline `style={}` in the client. This is the
   largest remaining item and the one most likely to break the app if attempted without
   being able to run the build or the app. It needs a real session, not a blind edit.
2. **`SecuritySettingsService` still holds several in-process Maps** for the settings named in
   `notEnforced` (`sessionTimeout`, `verifyNewDevices`, `loginApprovalsEnabled`,
   `securityLevel`), and `AccountManagementService` keeps `linkedAccounts` and similar in
   memory. They are now *labelled* rather than silently trusted, but they still vanish on
   restart. The honest options are to persist them or delete the endpoints — not to keep
   serving them.
3. **`biometric-auth.service.ts` and `biometric-auth.service.spec.ts` are still on disk** —
   unwired and `@deprecated`, along with two entity files. They should be deleted; I could
   not remove files in this environment.
4. **The CAPTCHA is still solvable by a script.** It is now correctly scoped (risk-triggered,
   persisted, single-use, CSPRNG-backed) and honestly labelled, but an expression returned to
   the client is not a human check. Replacing it with a proof-of-work or third-party
   challenge is the actual fix.
5. **The per-user session-timeout preference is still ignored.** The deployment-wide
   `SESSION_IDLE_TIMEOUT_MINUTES` works, but a user who sets "30 minutes" in the UI is not
   getting that. Wiring the per-user value needs it persisted first (it is still in a `Map`).
6. **`trustedIpAddresses` has no ownership or scope control.** Any user can add a CIDR as
   broad as `0.0.0.0/0`, which disables new-device detection for their own account entirely.
   That is the user's own account so the blast radius is small, but a `/8` should probably be
   capped and a `/0` rejected.

---

*This roadmap is the source of truth for sequencing. When priorities change, edit this file —
don't scatter plans across issues and docs. Keep the "Honest current state" table updated as
phases complete.*
