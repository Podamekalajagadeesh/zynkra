# Zynkra — Full Implementation Plan (Whole Project)

**Scope:** every system in the master blueprint (60 systems → 240 modules → **3,801 system-scoped
features**, 3,052 globally unique after dedupe) plus the 4 platform systems the blueprint omits
(federation, data portability, offline/mobile, security & compliance).

**Companion docs:** `ROADMAP.md` remains the source of truth for Waves 0–7 (already scoped in
detail). This plan sequences the _rest_ of the blueprint and integrates both into one schedule.
`FEATURE_PRIORITY.md` governs triage when schedule pressure hits.

**North star (unchanged):** one place to post, message, follow, and get paid — federated with the
open social web, user-owned data, no lock-in. _Depth over breadth_ stays the operating principle;
this plan adds breadth **only after each wave earns "real" status.**

---

## 1. Ground rules (apply to every wave)

1. **Definition of Done** (from `ROADMAP.md` §5 — non-negotiable):
   works end-to-end on a clean DB with zero console/server errors · integration tests in CI ·
   no mocked data presented as real (shallow = labeled "Preview") · docs match behavior ·
   unhappy paths handled (auth failure, empty state, network error).
2. **Nothing ships that lies.** Every feature is Real, Preview-labeled, or gone.
3. **Feature classes:** every blueprint feature is tagged at wave-planning time:
   - **S** (field/setting/list view — ≤0.5 dev-day) · **M** (screen + endpoint — ~2 dev-days) ·
     **L** (new subsystem — 1–3 weeks). Effort model in §6.
4. **One Preview→Real promotion at a time** per surface (ROADMAP Phase 6 discipline).
5. **Quarterly re-scope:** each quarter ends with a re-rank of remaining waves against
   usage/strategic value. Features may be demoted to a later wave or cut — never silently
   stubbed.

---

## 2. Current baseline (start of plan)

| Metric                                         | Value                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Overall completeness (ROADMAP self-assessment) | **~25%**                                                                                                   |
| Roadmap phases done                            | **Phase 0 of 8** (1–5 code-complete in parts; 6–7 open)                                                    |
| Load-bearing modules                           | **~20** of ~98 server module dirs                                                                          |
| Unique blueprint features with code evidence   | **626 / 3,052 (20.5%)**                                                                                    |
| Systems with strongest evidence                | 01 Auth (83%), 21 Forums (56%), 54 Products (55%), 08 Short video (53%), 16 Channels (50%), 05 Posts (48%) |
| Systems with weakest evidence                  | 41 AI Translation (2%), 44 AI Coach (0%), 22 Clubs (3%), 35 Revenue tools (6%), 37 AI ranking (8%)         |

---

## 3. Wave map — 16 waves over 12 quarters (~3 years)

Waves 0–7 = existing `ROADMAP.md` phases (detailed task lists live there). Waves 8–15 are new
and cover the remaining blueprint. Waves **overlap** — from Q4 onward, 2–3 waves run in parallel
on different squads (§7).

```
                    ┌─ Wave 3 (E2EE depth) ────────┐
Wave 0 → Wave 1 ────┼─ Wave 4 (Federation) ────────┼─→ Wave 8  (Content formats)
                    ├─ Wave 5 (Portability) ───────┤─→ Wave 9  (Communities)
                    └─ Wave 2 (Monetization) ──────┘   Wave 10 (Creator economy)
                                                          Wave 11 (Real-time comms)
        Wave 6 (Preview→Real, ongoing) ──────────────→   Wave 12 (Discovery depth)
        Wave 7 (Mobile & offline, after Core) ───────→   Wave 13 (AI platform)
                                                          Wave 14 (Business suite)
                                                          Wave 15 (Commerce & services)
Continuous: Security & compliance · SRE/scale · Support-readiness (§5)
```

**Critical path to public beta:** Wave 0 → 1 → 2 (unchanged from ROADMAP). Everything after
beta is parallel and demand-driven.

---

## 4. Wave definitions

### Wave 0 — Foundation & truth · **DONE**

`ROADMAP.md` Phase 0. CI, commit lint, facade deleted, docs relabeled. _Exit met 2026-10-21._

### Wave 1 — Core loop hardened · **DONE (exit sealed 2026-10-23)**

`ROADMAP.md` Phase 1. Covers **systems 01–05, 13 (FTS), 19 (notifications), 06 (media pipeline)**.

- Goal: signup → profile → post → feed → follow → comment → react → DM → notify is flawless.
- Exit: full Core loop on clean DB, CI-run integration suite green, zero console errors.
  ✅ **Met and sealed 2026-10-23** — `npm run test:core-db` (embedded PostgreSQL, real modules,
  HTTP walk) runs as a Server CI step (`server-ci.yml`, `test-unit` job) and is green on every
  recent commit (`e036478d9`, `a09c11915`, `08a0f089f`, `344217213`), including all 6 real-PG
  describes: core loop, story elements, story children cascades, poll voting, highlights
  visibility matrix, and the owner replies inbox; the HTTP integration suites (`test:core`,
  `test:http`) are green in the same workflows.
- Open items: none — the previously open "HTTP integration suite in CI; real-DB core suite as
  merge gate" items are both shipped and green.

### Wave 2 — Monetization to production

`ROADMAP.md` Phase 2. Covers **system 32** (creator monetization), **60** (payments core —
ledger, Stripe Connect, 90/10 split, reconciliation, payout approvals), **26** (community economy —
tipping paths).

- Exit: creator earns, sees correct ledger, receives a real test-mode payout.
- Open: live Stripe test-mode payout demo (`PAYMENTS_ENABLED`).

### Wave 3 — E2EE depth

`ROADMAP.md` Phase 3. Covers **system 15** (messaging), **16** (channels — E2EE scope decision).

- Done: 1:1 text + per-attachment media E2EE, ciphertext-only storage.
- Remaining: group-DM scope decision, multi-device, manual two-browser
  verification (an automated two-party round-trip now covers the protocol path).
  Key rotation ✅ (server: rotation events, atomic pre-key claims,
  identity/bundle rotation endpoints, pre-keys purged on identity rotation;
  client: pre-send identity freshness check with
  session teardown + X3DH rebuild on rotation, decrypt-failure clean rebuild, identity
  self-heal on init, `getRotationEvents` resync feed). Recovery ✅ (passphrase-encrypted
  identity + session-state backup export/import in Settings; fixes identity never being
  persisted — it regenerated on every page load). Two-party round-trip ✅
  (`client/src/services/e2ee.roundtrip.test.ts` — real X3DH + ratchet, reinstall
  rotation, offline tolerance) — this surfaced that the pinned libsignal `0.0.3` tarball
  was broken (E2EE never loaded at runtime); upgraded to `0.0.16` and aligned the
  call sites/types with its real API.
- Exit: no readable message content at rest for covered surfaces; recovery story documented.

### Wave 4 — Federation that federates

`ROADMAP.md` Phase 4. Platform system (**Federation**) + graph effects in **system 03**.

- Remaining: real-Mastodon interop test (follow, post, boost, reply, both directions),
  outbound `Update`, key caching, remote posts in the main read model. Delivery
  dead-letter queue ✅ (retained attempts + scheduled redrive + admin redrive API).
- Exit: a Mastodon user follows a Zynkra user and sees their posts, and vice versa.

### Wave 5 — Data ownership & portability

`ROADMAP.md` Phase 5. Platform system (**Portability**) + blueprint §60 portability features.

- Done: zip-import with media re-hosting ✅ (`POST /data-export/import-zip`);
  scheduled/automated exports ✅ — per-user schedule (`GET/POST /data-export/schedule`,
  7/14/30/90 days) + hourly cron + history (`GET /data-export/history`), archives stored
  outside public `uploads/` behind owner-only `GET /data-export/archive/:id`, nightly
  retention via `EXPORT_RETENTION_DAYS`; settings UI toggle. `data-export.service.spec.ts`
  (17).
- Remaining: none — **Wave 5 complete.**
- Exit: export full account → re-import into fresh instance (content + DMs with existing
  peers; money/trust archival by design). **Met.**

### Wave 6 — Preview → Real promotions (ongoing)

`ROADMAP.md` Phase 6. Promotion order by usage/strategic value:
**groups → stories/reels → marketplace → events → dating → articles/podcasts/courses depth.**
Each promotion = E2E audit + tests + remove the "Preview" tag. Budget **2 promotions per quarter**.

- Exit (per feature): works E2E, has tests, no "Preview" tag.
- **Promoted (1 of budget):** ✅ **Stories → Real, 2026-10-23, commit `08a0f089f`** — first
  promotion; shipped order diverged from the guess above (stories first, not groups).
  Evidence: real-PG cascade verification (story delete wipes views/reactions/replies/highlights
  children), live poll voting (atomic upsert + tallies + expiry guards), public highlights
  (visibility-scoped `GET /users/:username/highlights` + owner create/edit/delete, sanitized
  responses), owner replies inbox (paginated `GET /stories/:id/replies` with sender profiles +
  author-or-owner `DELETE`, `("storyId","createdAt")` index migration), manual UX checks of the
  story viewer loop. Suites: 1870 server unit / 198 HTTP / 6 real-PG / 76.6% coverage;
  429 client tests on Node 20 and 26; Server CI + Client CI success. "Preview" tag removed
  from `ROADMAP.md` §2 tier list, the maturity table, and Phase 6 ledger recorded.
- Next candidates: groups → reels (still budgeted 2/quarter).

### Wave 7 — Mobile & offline-first

`ROADMAP.md` Phase 7. `mobile/` to Core parity; IndexedDB queue → conflict-resolving sync.

- Exit: Core loop on mobile survives offline/online with no data loss.

### Wave 8 — Content formats at scale

**Systems 07 Stories · 08 Short video · 09 Long video & live · 10 Articles · 11 Audio & voice ·
12 Creation studio** (237 modules-worth of features; ~372 features).

- Depends on: Wave 1 (media pipeline), Wave 6 (stories ✅ promoted to Real 2026-10-23; reels/groups still Preview).
- Highlights: stories E2EE-optional & archiving, reels feed + duets/stitches, live
  streaming infra (WebRTC/HLS) + super-chat, long-form editor v2, podcast distribution
  (RSS/Apple/Spotify), voice rooms, studio (templates, scheduling, cross-posting, drafts).
- Exit: every format has creation → distribution → consumption → analytics loops with
  load-tested media pipelines (CDN, transcode, moderation queue).

### Wave 9 — Communities suite

**Systems 20 Groups · 21 Forums · 22 Clubs · 23 Local · 24 Learning · 25 Business communities ·
27 Moderation · 28 Reputation & trust** (~500 features).

- Depends on: Wave 1 (core graph), Wave 2 (paid groups), Wave 6 (groups promoted).
- Highlights: threaded forums w/ OP moderation, interest clubs, geo-scoped communities,
  cohort-based learning groups, community economy (dues, grants), moderator tooling
  (queues, escalation, appeals — appeal flow exists), reputation/portability,
  trust & safety scoring.
- Exit: a community owner can run a paid, moderated, discoverable community end-to-end;
  moderation SLAs and audit logs in place.

### Wave 10 — Creator economy (full)

**Systems 29 Creator profiles · 30 Studio · 31 Analytics · 33 Sponsorships · 34 Brand
marketplace · 35 Revenue tools · 26 depth** (~330 features).

- Depends on: Wave 2 (payouts), Wave 8 (content), Wave 9 (communities).
- Highlights: verified-creator program, media kit, brand deal pipeline (briefs → contracts →
  escrow → payment), affiliate program, revenue share on collabs, cohort analytics,
  churn/retention insights, payouts across rails (card, bank, USDC already exists).
- Exit: creator can run their entire business — audience, content, deals, money — inside
  Zynkra; brand can run a campaign end-to-end.

### Wave 11 — Real-time communications

**Systems 16 depth (channels) · 17 Voice & video calls · 18 Collaboration** (~180 features).

- Depends on: Wave 3 (E2EE scope), Wave 1.
- Highlights: group channels w/ threads & roles, 1:1 and group calls (WebRTC), call
  recording consent flows, presence, shared drafts, co-editing, whiteboards.
- Exit: calls hold 30 min with <1% drop on reference network; channels federate (later wave).

### Wave 12 — Discovery & media depth

**Systems 13 Search (depth) · 14 Discover & explore · 06 Photos & albums (depth)** (~190 features).

- Depends on: Wave 1 (FTS), Wave 8 (formats to index), Wave 9 (communities to surface).
- Highlights: universal search v2 (people/posts/tags/communities/products with ranking),
  explore pages per vertical, trends engine, interest graph recommendations,
  albums/organizing/collections, SEO for public content.
- Exit: p95 search <300 ms; explore drives ≥20% of discovery sessions in dogfood metrics.

### Wave 13 — AI platform

**Systems 36–50 (15 AI systems, ~940 blueprint features)** — planned as **one assistant
platform + skills**, not 15 separate products.

- Depends on: Waves 1–2 (data), Wave 8 (content to analyze), stable provider abstraction.
- Architecture: provider layer (OpenRouter cloud default, WebLLM on-device opt-in, self-hosted
  option) → memory/context store → skills (coach, moderator, translator, scheduler, shopper,
  business assistant, comment intelligence, safety).
- Sequencing inside the wave: 1) safety & personalization (50) → 2) moderator (38) → 3) translation (41) → 4) recommendations/ranking (37, 43) → 5) creation tools (40) → 6) assistant skills (36, 44–49).
- Hard rules: **every AI output labeled**; no on-device claims unless WebLLM path used;
  user data opt-in per skill; kill-switch per skill.
- Exit: one coherent assistant with ≥8 skills live, each with eval harness + cost caps;
  AI moderator recall/precision benchmarked against human review sample.

### Wave 14 — Business suite

**Systems 51 Business pages · 52 CRM · 53 Customer inbox** (~185 features).

- Depends on: Wave 1, Wave 9 (business communities), Wave 11 (inbox routing).
- Highlights: verified pages, catalog, hours/locations, CRM (leads, pipeline, tags),
  unified customer inbox (DMs + comments + reviews), chatbots for business (uses Wave 13),
  billing/invoicing, team seats & roles.
- Exit: an SMB can run storefront + CRM + support inbox for 30 days without leaving Zynkra.

### Wave 15 — Commerce & services

**Systems 54 Products · 55 Booking · 56 Appointments · 57 Marketplace · 58 Freelancers ·
59 Auctions & rentals · 60 depth (escrow, disputes, reviews, trust)** (~440 features).

- Depends on: Wave 2 (payments/ledger/escrow primitives), Wave 14 (business pages),
  Wave 9 (reputation/trust).
- Highlights: digital + physical products, service listings, booking/appointment scheduling,
  freelance contracts + milestones + escrow, auctions/rentals with deposits,
  dispute resolution workflow, review authenticity, buyer protection.
- Exit: full purchase → fulfilment → dispute → refund cycle with money-loss tests;
  trust & safety queue staffed in runbooks.

---

## 5. Continuous tracks (run across all waves)

| Track                     | Owner          | Commitments                                                                                                                 |
| ------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Security & compliance** | Platform squad | quarterly pen-test, SOC2-ready audit logs, GDPR export/delete SLAs, age/child safety gates, moderation transparency reports |
| **SRE / scale**           | Platform squad | p95 budgets per surface, load tests per wave exit, on-call runbooks, cost/feature dashboards                                |
| **Mobile parity**         | Mobile squad   | every wave's features ship with mobile parity checklist; Wave 7 establishes the sync engine                                 |
| **Federation expansion**  | Platform squad | after Wave 4 exit: Like/Update, shared-inbox scaling, key caching, dead-letter UI                                           |
| **Docs & API**            | Each squad     | API_DOCUMENTATION.md updated in the same PR as any endpoint change                                                          |

---

## 6. Effort model & timeline

**Feature-class mix** (assumed across the 3,801 system-scoped features):

- **S ≈ 60%** (2,281 × 0.5 d ≈ 1,140 d) — settings, fields, list views, badges
- **M ≈ 30%** (1,140 × 2 d ≈ 2,280 d) — screens + endpoints
- **L ≈ 10%** (380 × 5 d ≈ 1,900 d) — subsystem slices (larger L's are wave-level, below)

**Total feature-build effort ≈ 5,300 dev-days ≈ 24 dev-years.**

**Platform tax** (not in the 3,801): infra, sync engine, live-video infra, AI evals, mobile
native, observability, migrations, security — estimated **+40–50%** → **~35–40 dev-years total**.

**Schedule:** 12 quarters, 5 squads (§7) ≈ 5 × 4 eng × 3 yr × 0.7 productive = **~42 eng-years**
capacity → plan fits with ~10–15% slack for the unplanned (this is why quarterly re-scope exists).

| Year   | Quarters | Beta/GA gate                                  | Dominant waves                 |
| ------ | -------- | --------------------------------------------- | ------------------------------ |
| **Y1** | Q1–Q4    | **Public beta at end of Q3** (Waves 0–2 exit) | 0–7 started; 8–9 begin         |
| **Y2** | Q5–Q8    | **GA: communities + creator economy**         | 9–12; 13 begins                |
| **Y3** | Q9–Q12   | **GA: business + commerce platform**          | 13–15; federation/mobile depth |

**Per-wave exit is a hard gate** — no wave is "done" on the dashboard until its exit criterion
is demonstrated on a clean environment.

---

## 7. Team topology (assumption — adjust to actual headcount)

| Squad                         | Focus                                          | Primary waves       |
| ----------------------------- | ---------------------------------------------- | ------------------- |
| **A — Core social**           | auth, graph, posts, feed, notifications        | 1, parts of 8/9     |
| **B — Money**                 | payments, ledger, escrow, commerce rails       | 2, 15 (money paths) |
| **C — Content & media**       | formats, pipeline, studio, live                | 8, parts of 6/12    |
| **D — Communities & creator** | groups, forums, trust, creator tools           | 9, 10, parts of 14  |
| **E — Platform & AI**         | federation, search, infra, AI platform, mobile | 3, 4, 5, 7, 11, 13  |

Each squad: 1 PM/design + 4 engineers (full-stack where possible). Waves 3–5 were sized for
one squad running all three sequentially; if staffing allows, E splits and they parallelize.

---

## 8. Risks & mitigations

| Risk                                                | Mitigation                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Breadth relapse** — rebuilding the deleted facade | Wave gates: nothing enters a sprint without a Definition-of-Done path; quarterly cuts celebrated, not hidden |
| **Federation never proves interop**                 | Wave 4 exit needs a live Mastodon instance — budget it in Q2 as ops work, not code                           |
| **Live video cost/complexity**                      | Wave 8 gates live behind usage proof; HLS with autoscaling, hard cost caps                                   |
| **AI cost blowout**                                 | Per-skill budgets, caching, eval harness before promotion, WebLLM offload                                    |
| **Mobile sync correctness**                         | Wave 7 is a full wave, not a stretch goal; conflict tests in CI                                              |
| **Payment disputes / fraud**                        | Wave 15 includes dispute runbooks + risk scoring; staged rollout by region                                   |
| **Estimate drift on 3,801 features**                | S-class re-validated at each wave kickoff; anything >0.5 d re-tagged and re-costed                           |

---

## 9. Governance cadence

- **Weekly:** squad standups; exit-criterion burn-down on active waves.
- **Monthly:** cross-squad dependency review (this doc's §4 dependency lines are the agenda).
- **Quarterly:** re-rank remaining waves (usage data, revenue, strategic shift); update this
  plan and `ROADMAP.md` in the same PR; cut or demote openly.
- **Per-release:** Definition-of-Done checklist attached to every promoted feature.

---

## 10. Appendix — system → wave assignment & current evidence

Evidence = % of that system's blueprint features with any code occurrence (lower bound;
name-matching undercounts rebranded features). Wave = where the system is _finished_;
earlier waves may touch it partially.

| #   | System                               | Feats | Evidence        | Finished in                                                      |
| --- | ------------------------------------ | ----- | --------------- | ---------------------------------------------------------------- |
| 01  | Identity & Authentication            | 60    | 83%             | Wave 1                                                           |
| 02  | User Profiles                        | 63    | 32%             | Wave 1                                                           |
| 03  | Social Graph                         | 62    | 19%             | Wave 1 (+4 federation)                                           |
| 04  | Home & Feed                          | 63    | 17%             | Wave 1                                                           |
| 05  | Posts & Publishing                   | 63    | 48%             | Wave 1                                                           |
| 06  | Photos & Albums                      | 64    | 39%             | Wave 1 (pipeline) → Wave 12 (depth)                              |
| 07  | Stories                              | 61    | 10%†            | Wave 6 (core promoted → **Real** ✅ 2026-10-23) → Wave 8 (depth) |
| 08  | Short Video                          | 59    | 53%             | Wave 6 → Wave 8                                                  |
| 09  | Long Video & Live                    | 60    | 20%             | Wave 8                                                           |
| 10  | Articles & Text Media                | 64    | 39%             | Wave 6 → Wave 8                                                  |
| 11  | Audio & Voice Content                | 62    | 26%             | Wave 8                                                           |
| 12  | Content Creation Studio              | 62    | 32%             | Wave 8                                                           |
| 13  | Universal Search                     | 60    | 12%             | Wave 1 (FTS) → Wave 12                                           |
| 14  | Discover & Explore                   | 63    | 29%             | Wave 12                                                          |
| 15  | Messaging                            | 62    | 29%             | Wave 3                                                           |
| 16  | Channels                             | 60    | 50%             | Wave 11                                                          |
| 17  | Voice & Video Calls                  | 59    | 29%             | Wave 11                                                          |
| 18  | Collaboration                        | 60    | 28%             | Wave 11                                                          |
| 19  | Notifications                        | 62    | 32%             | Wave 1 (depth)                                                   |
| 20  | Groups                               | 63    | 30%             | Wave 6 → Wave 9                                                  |
| 21  | Forums                               | 63    | 56%             | Wave 9                                                           |
| 22  | Clubs & Interest Communities         | 64    | 3%              | Wave 9                                                           |
| 23  | Local Communities                    | 60    | 25%             | Wave 9                                                           |
| 24  | Learning Communities                 | 56    | 32%             | Wave 9                                                           |
| 25  | Business Communities                 | 62    | 13%             | Wave 9                                                           |
| 26  | Community Economy                    | 63    | 35%             | Wave 2 (paths) → Wave 9/10                                       |
| 27  | Community Moderation                 | 64    | 30%             | Wave 9                                                           |
| 28  | Reputation & Trust                   | 64    | 23%             | Wave 9                                                           |
| 29  | Creator Profiles                     | 61    | 23%             | Wave 10                                                          |
| 30  | Creator Studio                       | 62    | 50%             | Wave 10                                                          |
| 31  | Creator Analytics                    | 64    | 41%             | Wave 10                                                          |
| 32  | Creator Monetization                 | 64    | 12%             | Wave 2                                                           |
| 33  | Sponsorships                         | 55    | 45%             | Wave 10                                                          |
| 34  | Brand Marketplace                    | 64    | 27%             | Wave 10                                                          |
| 35  | Revenue Tools                        | 62    | 6%              | Wave 10                                                          |
| 36  | AI Personal Assistant                | 64    | 38%             | Wave 13                                                          |
| 37  | AI Feed Ranking                      | 63    | 8%              | Wave 13                                                          |
| 38  | AI Moderator                         | 64    | 11%             | Wave 13                                                          |
| 39  | AI Search                            | 64    | 11%             | Wave 13                                                          |
| 40  | AI Creation                          | 61    | 11%             | Wave 13                                                          |
| 41  | AI Translation                       | 55    | 2%              | Wave 13                                                          |
| 42  | AI Memory                            | 58    | 12%             | Wave 13                                                          |
| 43  | AI Recommendations                   | 59    | 8%              | Wave 13                                                          |
| 44  | AI Creator Coach                     | 63    | 0%              | Wave 13                                                          |
| 45  | AI Business Assistant                | 61    | 15%             | Wave 13                                                          |
| 46  | AI Shopping Assistant                | 64    | 12%             | Wave 13                                                          |
| 47  | AI Scheduling                        | 63    | 10%             | Wave 13                                                          |
| 48  | AI Voice Assistant                   | 58    | 43%             | Wave 13                                                          |
| 49  | AI Comment Intelligence              | 64    | 3%              | Wave 13                                                          |
| 50  | AI Safety & Personalization          | 64    | 17%             | Wave 13                                                          |
| 51  | Business Pages                       | 61    | 44%             | Wave 14                                                          |
| 52  | CRM                                  | 63    | 25%             | Wave 14                                                          |
| 53  | Customer Inbox                       | 62    | 35%             | Wave 14                                                          |
| 54  | Products & Services                  | 51    | 55%             | Wave 15                                                          |
| 55  | Booking                              | 64    | 22%             | Wave 15                                                          |
| 56  | Appointments                         | 62    | 32%             | Wave 15                                                          |
| 57  | Marketplace                          | 56    | 45%             | Wave 6 → Wave 15                                                 |
| 58  | Freelancers & Services               | 59    | 41%             | Wave 15                                                          |
| 59  | Auctions & Rentals                   | 55    | 33%             | Wave 15                                                          |
| 60  | Commerce, Payments & Trust           | 183   | 27%             | Wave 2 (rails) → Wave 15 (trust)                                 |
| —   | **Federation** (platform)            | —     | works, unproven | Wave 4                                                           |
| —   | **Data Portability** (platform)      | —     | export done     | Wave 5                                                           |
| —   | **Offline & Mobile** (platform)      | —     | queue only      | Wave 7                                                           |
| —   | **Security & Compliance** (platform) | —     | ongoing         | Continuous                                                       |

† **Evidence %s are planning-time snapshots** (name-matching lower bounds; the blueprint
feature list is not in-repo, so they are deliberately _not_ recomputed per promotion — a
promotion must not launder itself into a bigger number). Status changes are recorded in the
wave sections instead: **07 Stories was promoted Preview → Real on 2026-10-23** as Wave 6's
first promotion — evidence in the **Wave 6** section above (cascade-verified real-PG tests, live
poll voting, public highlights, replies inbox, both CI workflows green).

**Totals:** 240 modules · 3,801 system-scoped features · 16 waves · 12 quarters ·
public beta Y1-Q3 · full blueprint GA target end of Y3.
