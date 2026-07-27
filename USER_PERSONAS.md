# User Personas: Zynkra

---

## Persona 1: Beginner Creator

**"Priya"** — 24, India/US, Digital Artist & Illustrator

### Background
- 3,200 followers on Instagram, 1,100 on Twitter/X
- Posts original digital art 3–4 times per week
- Earns ~$200/month from occasional commissions on Ko-fi
- Tried Patreon but found the setup overwhelming — cancelled after 2 months
- Spends 2–3 hours/day managing social presence across 4 platforms

### Goals
- Turn her art into a reliable income stream ($1,000+/month)
- Stop juggling 4 platforms for 4 different revenue sources
- Build a direct relationship with her most engaged fans
- Keep more of what she earns (currently losing 10–30% to platform fees + payment processing)

### Frustrations
- Instagram's algorithm buries her posts — engagement dropped 40% since Reels launched
- Ko-fi is simple but her audience is on Instagram, not Ko-fi
- Patreon feels corporate — her fans don't want to "pledge" monthly, they just want to support her
- Has no idea how to set up a subscription model, courses, or newsletters
- Worried about being deplatformed — an artist friend got banned from Instagram with no explanation

### Zynkra Behavior
- Signs up after seeing a post from a bigger creator mentioning the 90/10 split
- Connects Stripe in under 5 minutes
- Sets up a $5/month subscription tier with a "Supporters" badge
- Posts art directly to Zynkra, cross-posts a teaser to Instagram linking back
- Earns her first tip within 48 hours
- Gradually migrates audience from Instagram to Zynkra over 3–6 months

### Key Metric for Priya
- **Time to first dollar** — she needs to see money in her account within days, not weeks
- **Cumulative earnings at month 6** — if she's earning $500+/month, she stays

---

## Persona 2: Professional Creator

**"Marcus"** — 31, US, Fitness Coach & Content Creator

### Background
- 85,000 followers across Instagram, YouTube, TikTok
- Currently earns $4,200/month across Patreon ($1,800), YouTube ad revenue ($1,400), and brand deals ($1,000)
- Runs a private Discord community ($15/month subscription, 400 members)
- Publishes weekly YouTube workout videos, daily Instagram stories, and monthly long-form articles
- Has an assistant who manages scheduling and community moderation

### Goals
- Grow to $10,000+/month in creator earnings
- Consolidate everything (posts, DMs, subscriptions, content) into one platform so his assistant doesn't waste time
- Offer courses and workshops — tried Teachable but it didn't integrate with his audience
- Own his audience data so he can't be banned or algorithmically buried

### Frustrations
- YouTube takes 45% of ad revenue and demonetizes "risky" fitness content without warning
- Patreon + Discord = two tools, two payments, two communities. The split confuses fans
- Can't send DMs to subscribers on Patreon — communication is fragmented
- His 85K Instagram followers are invisible to his YouTube audience — no cross-platform identity
- Worried about platform risk: if YouTube changes the algorithm, he loses half his income overnight

### Zynkra Behavior
- Migrates existing audience from Patreon — offers a "Founding Member" subscription tier
- Uses articles for long-form workout plans, podcasts for nutrition Q&As
- Hosts live workout streams via LiveKit integration
- Runs a private subscriber-only group for premium members
- Uses the analytics dashboard to track which content drives subscriptions
- Connects WalletConnect for crypto-paying international fans

### Key Metric for Marcus
- **Patreon migration rate** — % of existing subscribers who convert to Zynkra
- **Revenue per subscriber** — if his Zynkra subscribers earn him $9/subscriber (vs $6 on Patreon), the math works
- **Multi-product adoption** — he's using subscriptions + tips + articles + live streams

---

## Persona 3: Fan / Supporter

**"Aisha"** — 28, UK, Software Developer & Avid Podcast Listener

### Background
- Follows 12 creators across YouTube, Instagram, and podcasts
- Subscribes to 3 Patreons ($5, $10, $15/month) and buys courses occasionally
- Listens to 5 podcasts daily during commute
- Spends ~$60/month on creator subscriptions + occasional purchases
- Active in Reddit communities for her favorite creators

### Goals
- Discover new creators in her niche (fitness tech, AI, indie music)
- Support creators she cares about without feeling like she's feeding a platform
- Get all content from her favorite creators in one feed instead of checking 4 apps
- Feel like her support is making a difference — see creator earnings grow

### Frustrations
- Has too many subscriptions — hard to remember who she's paying and why
- Instagram shows her ads for things she already bought (creators she already supports)
- Can't easily send a $2 tip to a creator she just discovered — Patreon's minimum is $1/month
- No way to follow a creator's "full picture" — their YouTube, newsletter, and Discord are all separate
- Feels guilty about ad-supported platforms — knows creators are underpaid by the system

### Zynkra Behavior
- Discovers a creator through Zynkra's Explore page or a friend's post
- Follows them, sees they offer free + paid tiers
- Starts with a one-time $3 tip after enjoying a piece of content
- Upgrades to a $5/month subscription for access to exclusive content
- Uses the "Subscriptions" feed to see only paid content in chronological order
- Recommends the platform to friends because "the creators actually get 90%"

### Key Metric for Aisha
- **Time from discovery to first payment** — under 5 minutes
- **Subscription count** — if she subscribes to 2+ creators within a month, she's retained
- **Net Promoter Score** — would she recommend Zynkra to other fans?

---

## Persona 4: Admin / Platform Operator

**"David"** — 35, Zynkra Co-founder / Technical Lead

### Background
- Full-stack developer, built the initial codebase
- Wears 3 hats: product, engineering, and operations
- Needs to monitor platform health, handle disputes, and manage growth
- Manages the Stripe Connect dashboard and financial reconciliation
- Reviews content moderation flags

### Goals
- Keep the platform running reliably (payments path = highest priority)
- Ensure creators are paid correctly and on time
- Handle moderation issues quickly without over-moderating
- Understand platform metrics: what's working, what's not
- Keep infrastructure costs sustainable as user count grows

### Frustrations
- Too many features in the codebase — hard to know what's real vs. stub
- No monitoring dashboard — relies on Sentry + raw logs
- Moderation is manual — no automated tools yet
- Can't easily tell which features users actually use vs. which are ignored
- Stripe reconciliation is tedious — no automated reporting

### Zynkra Behavior
- Monitors creator payouts and Stripe Connect status
- Reviews flagged content and handles account disputes
- Runs typechecks and deploys via GitHub Actions
- Uses the admin dashboard to view user metrics
- Prioritizes fixes based on creator support tickets

### Key Metric for David
- **Mean time to resolution for creator payout issues** — under 2 hours
- **Platform uptime on payments path** — 99.5%+
- **Automated vs. manual moderation ratio** — moving toward 80% automated

---

## Persona Summary Matrix

| Persona | Primary Need | Key Action | Success Metric | Anti-pattern (failure) |
|---------|-------------|------------|----------------|----------------------|
| **Priya** (Beginner Creator) | Simple monetization | Connect Stripe, set up subscription | Time to first dollar < 48 hrs | Complex setup, no guidance |
| **Marcus** (Professional Creator) | Unified platform | Migrate from Patreon, use multi-product | Revenue per subscriber > $9 | Fragmented tools, limited analytics |
| **Aisha** (Fan) | Discovery + support | Follow, tip, subscribe | Discovery-to-payment < 5 min | No discovery, high friction |
| **David** (Admin) | Platform health | Monitor, moderate, reconcile | Payout issues resolved < 2 hrs | No observability, manual everything |

---

*These personas represent the core user archetypes. Every feature decision should be validated against at least one persona. If a feature doesn't serve any persona's primary need, it's a P2 or later.*
