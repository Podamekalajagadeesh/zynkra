# Success Metrics: Zynkra

---

## How to Use This Document

This defines what "success" means at Zynkra, measured in concrete, trackable metrics.

Every metric has:
- **Definition:** What exactly is being measured
- **Target:** What "good" looks like
- **Timeframe:** When we expect to hit it
- **Why it matters:** How it connects to the product thesis

Metrics are grouped into three tiers:
1. **North Star Metrics** — the single most important metrics that define success
2. **Leading Indicators** — metrics we can influence today that predict future success
3. **Guardrail Metrics** — metrics we monitor to ensure we're not growing in the wrong direction

---

## North Star Metrics

These are the two metrics that define whether Zynkra is succeeding. If these are healthy, the business is healthy.

### NS-1: Creator Net Revenue
**Total earnings retained by creators after all platform and processing fees.**

| Attribute | Value |
|-----------|-------|
| Definition | Sum of all creator earnings (tips + subscriptions + pay-per-view) minus platform fees (10%) and payment processing fees (~3%). |
| Target (Month 3) | $10,000/month total creator earnings |
| Target (Month 6) | $50,000/month total creator earnings |
| Target (Month 12) | $250,000/month total creator earnings |
| Target (Month 18) | $1,000,000/month total creator earnings |
| Why it matters | This is the thesis. If creators earn more on Zynkra, they stay. If they stay, fans follow. If fans follow, the platform grows. Everything else is a leading indicator of this. |

### NS-2: Creator Retention Rate
**% of creators who earn at least $1 in a given month and also earn in the following month.**

| Attribute | Value |
|-----------|-------|
| Definition | (Creators who earned in both Month M and Month M+1) / (Creators who earned in Month M) × 100 |
| Target (Month 3) | 75% |
| Target (Month 6) | 80% |
| Target (Month 12) | 85% |
| Why it matters | High retention proves the product is valuable enough to keep using. Low retention means we're losing creators after the initial excitement. |

---

## Leading Indicators

These metrics are the inputs we can influence day-to-day. They predict the North Star.

### Acquisition: Creator Funnel

| Metric | Definition | Target | Why It Matters |
|--------|-----------|--------|----------------|
| **Landing page → signup rate** | % of landing page visitors who complete registration | 8% | Tests whether our value prop ("90/10") resonates |
| **Signup → Stripe Connect rate** | % of new signups who complete Stripe Connect onboarding | 60% | The most important conversion. Creators who connect Stripe are "activated." |
| **Stripe Connect → first post rate** | % of Stripe-connected creators who create a post within 7 days | 80% | Post creation = active creator. Without content, monetization is impossible. |
| **First post → first dollar rate** | % of creators who earn at least $1 within 30 days of their first post | 30% | The "aha moment." Creators who earn stay. Creators who don't earn leave. |
| **Median time to first dollar** | Median time from creator signup to first $1 earned | < 7 days | Speed matters. If it takes 30 days, creators give up. |

### Acquisition: Fan Funnel

| Metric | Definition | Target | Why It Matters |
|--------|-----------|--------|----------------|
| **Visit → follow rate** | % of profile visitors who follow a creator | 15% | Tests content quality and profile UX |
| **Follow → subscribe rate** | % of followers who convert to paid subscriber (within 90 days) | 5% | The monetization conversion. Low rate = subscription value prop is weak. |
| **Subscribe → 90-day retention rate** | % of subscribers who stay subscribed after 90 days | 60% | Tests content quality over time. High churn = creator isn't delivering ongoing value. |
| **Fan LTV (Lifetime Value)** | Average total spending per paying fan over their lifetime | $50+ | If fans spend < $20, creator economics don't work. Target $50+ means healthy engagement. |
| **Tip rate** | % of active fans who send at least one tip per month | 10% | Tipping is the low-friction entry point. High tip rate = fans feel generous. |

### Revenue

| Metric | Definition | Target | Why It Matters |
|--------|-----------|--------|----------------|
| **Monthly Recurring Revenue (MRR)** | Sum of all active subscription revenue | $5,000 (Month 6), $25,000 (Month 12) | Predictable revenue = sustainable business |
| **Average Revenue Per Creator (ARPC)** | Total revenue / active creators | $50/month (Month 6), $100/month (Month 12) | If ARPC is low, creators aren't monetizing |
| **Average Revenue Per Fan (ARPF)** | Total revenue / paying fans | $15/month | Indicates willingness to pay |
| **Platform take rate** | Platform revenue / total creator earnings | 10% (fixed) | This is our business model. Don't discount below 10%. |
| **Payout success rate** | % of withdrawal requests that process successfully on first attempt | 99%+ | Failed payouts = creators lose trust instantly |

### Engagement

| Metric | Definition | Target | Why It Matters |
|--------|-----------|--------|----------------|
| **DAU/MAU ratio** | Daily active users / Monthly active users | 20%+ (MVP), 30%+ (Month 6) | Indicates "habit" usage. 20%+ = users come back daily. |
| **Posts per creator per week** | Average number of posts created by active creators | 3+ | Creators who post consistently retain fans |
| **Engagement rate per post** | (Likes + Comments) / Post views | 5%+ | Low engagement = content isn't resonating |
| **Messages per conversation per week** | Average DM messages in active conversations | 5+ | DMs = relationship depth. Low = surface-level engagement. |
| **Feed scroll depth** | Average % of feed content viewed before bounce | 40%+ | If fans leave after 10%, the feed isn't interesting enough |

### Infrastructure

| Metric | Definition | Target | Why It Matters |
|--------|-----------|--------|----------------|
| **Payments path uptime** | Uptime of Stripe Connect, tip processing, subscription processing | 99.95%+ | Any downtime = lost revenue and trust |
| **API response time (p95)** | 95th percentile API response time | < 500ms | Slow API = bad UX = users leave |
| **Error rate** | % of API requests returning 5xx errors | < 0.1% | High error rate = platform is unreliable |
| **Payment processing time** | Time from "Confirm payment" to "Payment successful" | < 3 seconds | Slow payments kill conversion |

---

## Guardrail Metrics

These metrics prevent us from growing in the wrong direction. If any of these breach their threshold, we stop growth work and fix the problem.

### Creator Health

| Guardrail | Definition | Threshold | Action if Breached |
|-----------|-----------|-----------|-------------------|
| **Creator churn rate** | % of active creators who stop earning for 30+ consecutive days | < 15%/month | Investigate: Is it lack of fans? Poor UX? Wrong audience? |
| **Creator payout issues** | % of payouts requiring manual intervention | < 2% | Stop new features. Fix payout reliability. |
| **Creator support tickets** | # of creator support tickets per week | < 50/week | If growing > 20%/week, product has a UX problem. |
| **Creator NPS (Net Promoter Score)** | "How likely are you to recommend Zynkra to another creator?" | 40+ | Below 40 = creators aren't excited enough to evangelize. |

### Fan Health

| Guardrail | Definition | Threshold | Action if Breached |
|-----------|-----------|-----------|-------------------|
| **Fan churn rate** | % of subscribers who cancel within 30 days | < 20% | Content isn't delivering value, or price is too high |
| **Refund rate** | % of payments that result in refund request | < 3% | High refund = fans feel they didn't get value |
| **Disputed charge rate** | % of payments disputed via credit card | < 0.5% | High disputes = fans don't recognize the charge (brand confusion) |
| **Fan NPS** | "How likely are you to recommend Zynkra to a friend?" | 35+ | Below 35 = fan experience is mediocre |

### Platform Health

| Guardrail | Definition | Threshold | Action if Breached |
|-----------|-----------|-----------|-------------------|
| **Content moderation response time** | Time from flag to resolution | < 24 hours | Slow moderation = harmful content stays up |
| **Spam rate** | % of posts flagged as spam | < 1% | Growing spam = platform is being exploited |
| **Duplicate account rate** | % of new accounts that appear to be duplicates | < 2% | High duplicates = gaming or abuse |
| **Infrastructure cost per user** | Monthly infra cost / active users | < $0.50/user | Unsustainable costs = can't scale profitably |

---

## Metrics We're Explicitly NOT Tracking

| Metric | Why We're Not Tracking It |
|--------|--------------------------|
| **Total registered users** | Vanity metric. A million signups with zero engagement means nothing. Track DAU/MAU instead. |
| **Total posts created** | Quantity ≠ quality. Track engagement rate instead. |
| **Time on site** | Platforms that optimize for this create addictive patterns. We optimize for value, not addiction. |
| **Ad revenue** | We don't have ads. This is a feature, not a metric. |
| **Follower count (platform-wide)** | Doesn't correlate with revenue. A creator with 1K engaged followers earning $5K/month is more successful than one with 100K passive followers earning $500. |

---

## Measurement Cadence

| Frequency | What We Review | Who Reviews |
|-----------|---------------|-------------|
| **Daily** | Payments path uptime, error rates, payout success rate | Engineering |
| **Weekly** | Creator acquisition funnel, fan conversion, support tickets | Product + Engineering |
| **Monthly** | North Star metrics, revenue, retention, guardrails | All hands |
| **Quarterly** | Feature priority review, metric target adjustments, roadmap | Leadership |

---

## Decision Framework

When metrics conflict, use this priority order:

1. **Payments reliability** — If payment metrics are degraded, everything else stops
2. **Creator retention** — If creators leave, the platform dies (supply-side collapse)
3. **Creator revenue** — If creators don't earn, they leave
4. **Fan conversion** — If fans don't pay, creators don't earn
5. **Engagement** — If nobody engages, nothing happens
6. **Growth** — Growth without retention is a leaky bucket

**If any metric in a higher tier is below threshold, stop working on lower-tier metrics until the higher one is resolved.**

---

## Reporting Template

### Monthly Business Review (MBR)

```
Zynkra Monthly Business Review — [Month, Year]

NORTH STAR
- Creator Net Revenue: $[X] (vs target: $[Y]) [↑/↓ vs last month]
- Creator Retention: [X]% (vs target: [Y]%) [↑/↓]

ACQUISITION
- Creator signups: [X] (vs last month: [Y])
- Stripe Connect completion: [X]% (target: 60%)
- First dollar earned: [X]% (target: 30%)

REVENUE
- MRR: $[X]
- ARPC: $[X]
- ARPF: $[X]

GUARDRAILS
- Creator churn: [X]% (threshold: 15%)
- Payout issues: [X]% (threshold: 2%)
- Payment uptime: [X]% (threshold: 99.95%)

KEY WINS
1. [Win 1]
2. [Win 2]
3. [Win 3]

KEY CONCERNS
1. [Concern 1 + proposed action]
2. [Concern 2 + proposed action]

NEXT MONTH PRIORITIES
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]
```

---

*This document defines what success looks like. Every sprint, every feature, every deployment should move at least one of these metrics in the right direction. If it doesn't, question whether it should be built.*
