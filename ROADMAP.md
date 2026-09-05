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
| DMs | Transport works | ⚠️ Stores **plaintext** — not real E2EE |
| Payments + Wallet | Stripe + ledger w/ row-locking | ✅ Best subsystem; nearly shippable |
| Notifications / stories / marketplace | Real-ish | ⚠️ Usable, needs polish |
| Offline (IndexedDB queue + SW) | Real queue | ⚠️ Not a conflict-resolving sync engine |
| ActivityPub federation | Inbound discovery real | ❌ Outbound unsigned → **won't interoperate** |
| Blockchain identity / DAO / token / tipping | Wallet-sign auth only | ❌ Rest are stubs |
| Local AI (Llama 3) | `setTimeout` + hardcoded strings | ❌ **Fully mocked** |
| ~40 modules (metaverse, snapmap, digital-twin, brainwave-auth, nonprofits, fundraisers…) | CRUD skeletons / empty | ❌ Facade |
| Tests | 4 server specs, ~0 client | ❌ Negligible |

**The three credibility bombs** (things that actively mislead and must be defused early):
1. DMs advertised as E2EE but stored in plaintext.
2. Federation advertised as interoperable but outbound delivery is unsigned (Mastodon rejects it).
3. "Local AI" advertised as on-device Llama 3 but is a hardcoded mock.

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

### Phase 0 — Stop lying & set a foundation (S–M) · *unblocks everything*
Goal: the product tells the truth, and we can move safely.
- **Defuse credibility bombs:** either fix or clearly relabel the three items in §1.
  - DMs: relabel to "encrypted in transit" until real E2EE lands (Phase 3), OR gate the
    "E2EE" claim behind a flag. Do not claim zero-knowledge while storing plaintext.
  - Federation: hide/flag outbound federation until signed (Phase 4).
  - AI: remove "Local AI / Llama 3" claims; move AI features behind a "Preview" label or cut.
- **Archive the facade:** move the ~40 stub modules and their client pages out of the product
  surface (route-guard or move to `archive/`, as already done for `planetary-communities`).
- **CI + quality gate:** GitHub Actions running lint + typecheck + build for client and server
  on every PR. This is the single highest-leverage missing piece.
- **Commit hygiene:** enforce conventional commits (CONTRIBUTING.md already prescribes them;
  history shows `lsksk`/`lsks`). Add a commit-lint hook.
- **Exit:** `main` is green in CI; no user-visible feature is mocked-but-unlabeled; README/ARCHITECTURE
  updated to match reality.

### Phase 1 — Harden the Core loop (M–L) · *the product people actually use daily*
Goal: signup → profile → post → feed → follow → comment → react → DM → notify works flawlessly.
- Audit each Core feature end-to-end; fix the breakages the breadth hid.
- **Media pipeline:** the `media`/`storage`/`uploads` modules are near-empty (10–20 lines).
  Pick ONE real backend (S3 or local+CDN) and make image/video upload + display genuinely work.
  This blocks posts, stories, reels, marketplace, avatars — everything.
- **Search:** wire real search (the `hashtags`/search paths are thin). Meilisearch or Postgres FTS.
- **Test the Core:** first real test suite — integration tests for the Core loop above.
  Target: the daily-use path has coverage, not 100% of 77 modules.
- **Exit:** a new user can complete the full Core loop on a clean DB with zero console errors,
  and it's covered by CI-run integration tests.

### Phase 2 — Creator monetization to production (M) · *the differentiator, already closest*
Goal: the best subsystem becomes genuinely shippable — this is Zynkra's wedge.
- Finish the in-flight wallet-ledger + Stripe Connect payouts work (currently uncommitted).
- Land the migration `1785000000000-WalletLedgerAndConnectPayouts.ts` cleanly.
- Real payout flow: creator onboarding (Connect), earnings page, tipping/subscriptions on top
  of the ledger, 90/10 split enforced in code, idempotent webhooks, reconciliation.
- Money-path tests: overdraw guard, double-spend, webhook replay, refund.
- **Exit:** a creator can earn, see a correct ledger, and receive a real (test-mode) payout,
  with tests covering the money path.

### Phase 3 — Real E2EE for DMs (L) · *deliver the privacy promise*
Goal: make the E2EE claim true.
- Client already has libsodium; server has Signal-style key bundles. Wire them together:
  encrypt client-side, store **ciphertext only** server-side, decrypt client-side.
- Key management: publish/rotate keys, multi-device, recovery story.
- Migrate/segregate existing plaintext messages (they cannot be retro-encrypted; be explicit).
- **Exit:** server DB contains no readable message content; a message round-trips E2E across
  two devices; the plaintext column is gone.

### Phase 4 — Open-web federation that actually federates (L) · *the "universal" claim*
Goal: interoperate with Mastodon/Pixelfed for real.
- **HTTP Signatures on outbound delivery** (the blocking gap at ~`federation.service.ts:302`).
- Complete the ActivityPub surface: signed inbox, outbox, Follow/Accept/Undo, Create/Delete,
  actor + WebFinger + NodeInfo, delivery retries/backoff.
- Interop test against a real Mastodon instance (follow, post, boost, reply both directions).
- **Exit:** a Mastodon user can follow a Zynkra user and see their posts, and vice versa.

### Phase 5 — Data ownership & portability (M) · *the anti-lock-in promise*
Goal: users truly own their data.
- Real, complete data export (the `data-export` module exists — make it whole-account, media
  included, in a documented format).
- Account import/migration path is now transactional for portable profile/settings, posts/media,
  comments, reactions, bookmarks, stories, and following relationships. Extend it to the remaining
  sensitive/exported domains (messages, commerce, wallet, verification, and linked accounts).
- **Exit:** a user can export their full account and re-import it into a fresh instance.

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

1. Set up CI (lint + typecheck + build) for client and server — *highest leverage, do first.*
2. Relabel/flag the three credibility bombs (E2EE, federation, AI).
3. Archive the facade modules out of the product surface.
4. Commit and finish the in-flight wallet/payments migration cleanly (don't leave it dangling).
5. Pick the media backend (S3 vs local+CDN) — it blocks Phase 1.

---

*This roadmap is the source of truth for sequencing. When priorities change, edit this file —
don't scatter plans across issues and docs. Keep the "Honest current state" table updated as
phases complete.*
