# User Journeys: Zynkra

---

## Journey 1: Creator Onboarding

### Title: "From 'I need to earn' to 'I'm set up to earn'"

### Goal
A creator signs up and completes their Stripe Connect setup, subscription tiers, and first post — all in under 10 minutes.

### Entry Trigger
- Sees a referral post from another creator: "I'm keeping 90% of everything on Zynkra"
- Searches for "creator platform 90/10" and finds Zynkra's landing page
- Direct word-of-mouth from another creator

### Steps

| Step | User Action | System Response | Success Signal | Failure State |
|------|------------|----------------|----------------|---------------|
| 1. Landing | Visits zynkra.com homepage | Hero section shows "90/10 Revenue Split. Keep 90% of every dollar." + demo of earnings dashboard | User clicks "Start Creating" | Page slow to load, value prop unclear → user leaves |
| 2. Sign up | Enters email, creates password | Creates account, sends verification email | User receives verification email | Email goes to spam, email already registered |
| 3. Verify email | Clicks verification link in email | Marks email as verified, redirects to onboarding wizard | User sees onboarding wizard step 1 | Link expired, link broken → user abandoned (critical failure) |
| 4. Profile setup | Enters display name, uploads avatar, writes bio | Saves profile, shows progress (25%) | User sees clean profile preview | Upload fails, bio rejected for length |
| 5. Stripe Connect | Clicks "Connect Stripe" → redirected to Stripe's onboarding | Opens Stripe Connect onboarding in new tab/window | User enters bank info on Stripe's secure page | User closes tab instead of completing (most common drop-off point) |
| 6. Stripe return | Completes Stripe onboarding, redirected back to Zynkra | Confirms Stripe account is linked, shows progress (75%) | User sees "Stripe Connected ✓" | Stripe onboarding rejects user (bad docs, country not supported) |
| 7. Subscription tiers | Sets up 1–3 subscription tiers (name, price, description) | Tiers saved, shows preview of how they'll appear to fans | User names tiers clearly ("Basic", "Premium", "VIP") | No tiers created — user skips or doesn't understand what to charge |
| 8. First post | Creates first post (text + optional image) | Post published to creator's profile and followers' feeds | User sees their post live on their profile | Image upload fails, text formatting broken |
| 9. Completion | Sees "You're ready to earn!" dashboard | Dashboard shows: Stripe status ✓, subscription tiers count, post count, earnings starting at $0.00 | User shares link on social media | Dashboard data doesn't load |

### Emotional Arc
```
Excited (landing) → Curious (signup) → Mildly frustrated (Stripe setup) → 
Satisfied (tiers created) → Proud (first post) → Hopeful (dashboard)
```

### Critical Path
Step 5 → Step 6 (Stripe Connect) is the single most important conversion point. If this fails, the creator can't earn. **Stripe Connect must work perfectly, with clear error messages and retry logic.**

### Post-Completion
- Creator receives email: "Your Zynkra is live! Share your profile link with your audience."
- Creator shares profile link on Instagram/Twitter/YouTube
- First fan subscribes → creator gets push notification → dopamine hit reinforces behavior

---

## Journey 2: Fan Onboarding

### Title: "From 'who is this creator?' to 'I'm following them'"

### Goal
A fan discovers a creator, lands on their profile, follows them, and starts seeing their content — all in under 2 minutes with no account friction.

### Entry Trigger
- Receives a link to a creator's Zynkra profile from the creator's social media
- Sees a Zynkra post shared on another platform (Twitter, Instagram, etc.)
- Finds a creator via Zynkra search

### Steps

| Step | User Action | System Response | Success Signal | Failure State |
|------|------------|----------------|----------------|---------------|
| 1. Profile visit | Clicks creator's profile link | Opens Zynkra profile page with content, bio, follower count | User sees content immediately | Page slow to load, broken link |
| 2. Browse | Scrolls through creator's posts | Loads paginated posts in chronological order | User sees 2–3 posts they like | Empty profile (creator hasn't posted), only checkered previews |
| 3. Follow | Clicks "Follow" button | System displays: A) Sign up form (not registered) or B) Follow confirmed (already registered) | User sees "Following" state | Sign up form is confusing, requires too many fields |
| 4a. New user signup | Enters email, creates password | Creates account, verifies email, subscribes to creator's feed | User is redirected back to profile | Auth flow breaks, redirect URL lost |
| 4b. Returning user login | Enters email + password | Confirms identity, follows creator | User is redirected back to profile | Password reset needed (session expired) |
| 5. Feed | Sees creator's posts in their home feed | Feed shows creator's new posts at top | User sees content from followed creators | Feed is empty (no algorithm fallback), shows stale content |

### Emotional Arc
```
Curious (profile visit) → Engaged (browsing content) → 
Decisive (follow) → Satisfied (content appears in feed)
```

### Critical Path
Step 3 → Step 4a/4b. Following requires an account. **This is the conversion funnel from "visitor" to "user."** The auth flow must be minimal — 2 fields (email, password) and done. No email verification required at this stage (can be prompted later).

### Post-Completion
- Fan sees creator's new posts in their feed
- Fan receives notification when creator posts (if they enable)
- Fan discovers more creators via the "Suggested" section
- Fan's feed becomes more engaging → increased time-on-platform

---

## Journey 3: Payment Flow

### Title: "From 'I want to support this creator' to 'I just sent them $'"

### Goal
A fan sends money to a creator with zero friction, zero confusion, and zero buyer's remorse.

### Entry Trigger
- Fan sees a post they love and clicks "Send Tip"
- Fan lands on creator's profile and sees "Subscribe" button
- Creator sends a DM with a link to paid content

### Steps

| Step | User Action | System Response | Success Signal | Failure State |
|------|------------|----------------|----------------|---------------|
| 1. Payment trigger | Clicks "Send Tip" or "Subscribe" on creator profile | Opens payment modal or page | User sees clear pricing and options | Page is slow, shows "Coming soon", or 404 |
| 2a. Tip flow | Selects amount (or enters custom) | Shows tip breakdown: "$10.00 to Creator + $1.00 fee = $11.00" | User sees exactly where their money goes | Fee breakdown confuses user, shows unexpected charges |
| 2b. Subscribe flow | Selects subscription tier | Shows subscription details: "You'll be charged $5/month. You can cancel anytime." | User understands recurring charge | Pricing is confusing, cancellation policy unclear |
| 3. Payment method | Enters card details OR Stripe Payment Element | Validates card, shows loading state | Card accepted | Card declined, Stripe error, insufficient funds |
| 4. Confirmation | Sees success screen | Shows: "You sent $10 to [Creator]!" with creator's response/thanks | User feels good about paying | Error state: "Payment failed, try again" without clear reason |
| 5. Receipt | Receives email receipt | Email: "Your payment to [Creator] on Zynkra" | User has record of transaction | No receipt, wrong amount, duplicate charges |

### Emotional Arc
```
Generous (payment trigger) → Careful (reviewing amount) → 
Nervous (entering card) → Delighted (confirmation) → 
Proud (receipt — "I supported someone I believe in")
```

### Critical Path
Step 3 is the conversion point. **Stripe Payment Element must be fast, reliable, and work on mobile.** Any loading spinner over 3 seconds = abandoned payment.

### Edge Cases
- **Card declined:** Show specific error message ("Card expired", "Insufficient funds")
- **Duplicate payment:** Fan refreshes the confirmation page and submits twice. Stripe idempotency key prevents double charge.
- **Refund:** Fan accidentally tipped the wrong amount. Must be able to request refund (system handles, creator can approve).
- **Country restrictions:** Fan's country may not support Stripe. Show clear message "Payment methods for [Country] coming soon."

---

## Journey 4: Subscription Flow

### Title: "From 'I like their free content' to 'I'm a paid subscriber'"

### Goal
A free follower converts to a paid subscriber and feels the upgrade was worth it immediately.

### Entry Trigger
- Creator posts a "Subscriber-only" post
- Fan sees a locked content teaser and clicks "Subscribe to view"
- Fan sees "Join [Creator]'s community" on profile

### Steps

| Step | User Action | System Response | Success Signal | Failure State |
|------|------------|----------------|----------------|---------------|
| 1. Discover subscription | Sees paid tier on profile or locked content | Shows tier pricing, benefits, subscriber count | User understands value | Benefits are vague, pricing seems high |
| 2. Preview | Clicks "See what's included" | Shows tier benefits: exclusive posts, badge, DMs, etc. | User is excited about the perks | Benefits page is empty, shows old content |
| 3. Subscribe | Clicks "Subscribe for $5/mo" | Loads payment modal with Stripe, shows "First payment today, then $5/month" | User proceeds to payment | Confused about recurring billing, worried about forgetting to cancel |
| 4. Payment | Enters card details | Charges first month, creates subscription record | Card accepted, subscription active | Card declined, Stripe error |
| 5. Post-purchase | Sees "Welcome to [Tier Name]!" screen | Shows badge, unlocks all subscriber content, adds to "Subscriptions" tab | User immediately sees something exclusive he couldn't see before | No instant gratification — content doesn't change, no badge appears |
| 6. Ongoing | Receives subscriber content in feed | Creator's subscriber-only posts marked with badge, appear in separate "Subscriptions" feed | User feels subscribed | Subscriber content mixed with free content, no differentiation |
| 7. Renewal | Monthly charge processes | Stripe charges card again, creator gets paid | User stays subscribed | Card charges fail, user gets unsubscribed without warning |

### Emotional Arc
```
Intrigued (discover) → Considering (preview) → 
Committed (subscribe → pay) → Rewarded (exclusive content) → 
Satisfied (ongoing value) → or → Guilty (not enough value → cancel)
```

### Critical Path
Step 5 is the retention point. **The first 60 seconds after subscribing must deliver clear, immediate value.** If the fan subscribes and nothing changes, they'll cancel within 24 hours.

### Cancellation Flow
- Fan goes to "Manage Subscriptions" in settings
- Clicks "Cancel Subscription" → confirmation modal: "You'll lose access to exclusive content on [Date]."
- Fan confirms → subscription marked as cancelled, not renewed next month
- Creator notified: "[Fan] cancelled their subscription"
- Fan retains access until end of billing period

---

## Journey 5: Tip Flow

### Title: "From 'this content was great' to 'I just bought them a coffee'"

### Goal
A fan sends a small, impulsive payment that makes them feel generous and the creator feel valued.

### Entry Trigger
- Fan finishes reading/watching a post and sees "Like this post? Support the creator with a tip!"
- Fan sees a "Tip Jar" button on the creator's profile
- Creator mentions in a post: "Tips help me create more of this"

### Steps

| Step | User Action | System Response | Success Signal | Failure State |
|------|------------|----------------|----------------|---------------|
| 1. Impulse | Clicks "Send Tip" on a post | Opens tip modal with 4 preset amounts ($3, $5, $10, $25) + custom input | User sees 4 clear options | No preset amounts, user has to type a number = friction |
| 2. Customize | Selects "Custom" and types $8.50 | Validates minimum ($1) and maximum ($500) | User feels control over amount | Confuses minimum/maximum limits |
| 3. Add note (optional) | Writes "Love your work!" | Shows preview of message that will be sent to creator | User feels personal | Message is blank or too long |
| 4. Pay | Enters card details, confirms | Processes $8.50 charge, sends notification to creator: "[Fan] sent you $8.50!" | Payment completes in < 3 seconds | Payment fails — user loses the impulse |
| 5. Confirmation | Sees "You sent $8.50 to [Creator]" | Shows message delivered confirmation, suggests subscribing | User feels altruistic satisfaction | Confirmation page is confusing, shows wrong amount |
| 6. Creator response | Creator receives notification | Creator can respond with a thank-you DM (auto-response available) | Fan feels seen and appreciated | Creator doesn't respond → fan feels ignored |

### Emotional Arc
```
Impressed (trigger) → Generous (choose amount) → 
Personal (add message) → Quick (pay) → 
Warm (confirmation + thank you)
```

### Critical Path
Step 1 → Step 4. The tip flow must be complete in under 30 seconds from impulse to confirmation. **Every additional second reduces conversion by ~10%.** The ideal flow: click tip amount → enter card → done (no account required).

### No-Account Tipping
For maximum conversion, MVP should support **guest tipping**: fan enters email + card, sends tip, creates account optionally. Rationale:
- Fan has the impulse NOW
- Asking them to create an account before tipping kills the impulse
- They can create an account AFTER the tip to follow the creator

### Tip vs. Subscription: When to Surface Which

| Signal | Suggested Action |
|--------|----------------|
| First visit to creator | "Send a tip to show support" (low commitment) |
| Returning visitor who already tipped | "Subscribe for ongoing support" |
| Fan who unsubscribed | "Send a one-time tip" (no commitment) |
| Fan viewing a popular post | "Tip if this helped you" |
| Creator mentions a goal | "Contribute to [Goal]" |

---

## Cross-Journey Dependencies

```
Creator Onboarding ──► Stripe Connect ──► Can receive tips/subscriptions
                           │
                           ▼
Fan Onboarding ──► Follow Creator ──► See Content ──► Tip / Subscribe ──► Pay
                                                           │
                                                           ▼
                                                  Creator gets money
                                                           │
                                                           ▼
                                                  Creator posts more ──► Loop reinforces
```

---

*These journeys define the ideal user experience. Every product decision should trace back to removing friction from one of these flows. If a feature doesn't improve one of these journeys, it's not MVP.*
