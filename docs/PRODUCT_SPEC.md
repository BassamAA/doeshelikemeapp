## Blunt AI Clarity — Decision Dashboard (Phase 1)

### Product pillars
- **One profile = one person** with a growing timeline of checkpoints.
- **Guided updates**: focused prompts + latest exchange; AI reads change over time.
- **Decision outputs**: trend + deltas, most-likely pattern, next move options, if/then horizon.
- **Monetization hook**: pay per person; free tier limits (1 profile + 1 checkpoint).

### Data model (initial, Postgres-ready)
- **User**
  - id (uuid), email (nullable for anon), created_at
- **ProfilePerson**
  - id, user_id, nickname, relationship_stage, initiator, reply_time, hot_cold_pattern, context_summary, clarity_window_days (int), created_at, updated_at, current_interest_score, current_risk_level
- **CheckpointUpdate**
  - id, profile_id, label, note, exchange_text (optional / redacted), timestamp, consistency, initiator, hot_cold, recent_change, risk_flags_count, delta_interest, delta_consistency, delta_risk_flags
- **AnalysisResult**
  - id, checkpoint_id, json (strict schema), pattern_label, next_move, horizon_days, horizon_expectation
- **Entitlement**
  - id, user_id, plan (single|bundle3|power10), profile_ids (for single), expires_at, status
- **CheckoutSession**
  - id, user_id, plan, stripe_session_id, status

### API routes (planned)
- `POST /api/profile` — create profile (enforce free limit/paywall)
- `GET /api/profile/:id` — fetch profile + timeline (or use client cache for now)
- `POST /api/checkpoint` — add checkpoint; payload includes profileId, label, note, guided answers, latest exchange; returns analysis + trend deltas
- `GET /api/profile/:id/timeline` — list checkpoints + deltas
- `POST /api/checkout` — create Stripe session for plan
- `POST /api/webhook/stripe` — handle fulfillment, set entitlements

### UI changes
- **Profile dashboard (`/profile/[id]`)**
  - Status strip: current score, 7d trend arrow + delta, risk level badge, clarity window estimate.
  - Metadata chips: stage, initiator, typical reply time, hot–cold pattern, context summary.
  - Timeline list of checkpoints (cards) showing label/date, interest score + delta, risk flag count delta, pattern + next move summary, “Change since last time” line.
  - Buttons: “Add update” (opens guided flow), “Share cards” (Phase 2 stub).
- **Add update flow** (existing `/analyze` page)
  - Keep funnel but add optional label + note (“What changed since last time?”).
  - Show paywall gate if user exceeds free limit or profile not entitled; inline modal with CTA to checkout.
- **Result page**
  - Show deltas (interest, consistency, risk flags) vs previous checkpoint; show “Most likely pattern”, “Next move options (Ask / Pull back / Wait)”, “If nothing changes in X days, expect Y”.

### Trend computation (client for now)
- Compare current checkpoint to previous:
  - `interest_delta = current - prev`
  - `consistency_delta` (categorical to directional)
  - `risk_flags_delta = current_red_flags - prev_red_flags`
  - Trend arrow: ↑ if delta ≥ +3, ↓ if ≤ -3, → otherwise.
  - Risk level: High if score <40 or red_flags >=3; Med if 40–65 or red_flags=2; Low otherwise.

### Paywall (Phase 1 stub, Stripe-ready)
- Free: 1 profile total AND max 1 checkpoint across all profiles.
- To add another profile or checkpoint, show modal:
  - “Unlock this person” (single), “Bundle 3”, “Power 10” — buttons call `/api/checkout`.
- Store entitlements client-side for now; structure matches Entitlement table for DB later.

### Privacy stance
- Do not persist raw chats server-side; keep in localStorage or redact. Only latest exchange is stored per checkpoint locally; DB-ready fields marked optional.
