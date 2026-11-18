# PPV implementation — Phase 1 preparation

## Delivered
- Admin → Pay-Per-View: persisted platform switch, independent channel switches, default platform commission, channel overrides, per-channel approval requirement and event review with commission override.
- Studio → Pay-Per-View: drafts, live/live+replay/VOD types, artwork upload, exact NGN/USD minor-unit prices, local-time scheduling, configurable duration/replay/rental windows, submit and edit.
- Default split: 2500 basis points platform / remainder channel. Precedence: event → channel → platform. Integer rounding always preserves total.
- Database RLS scopes drafts/settings to channel managers and admins. Only admins write switches/rates/reviews; triggers prevent client approval escalation, ownership changes or edits while disabled. Automatic approval applies only when an admin turns off required review.
- PPV has separate canonical settings, not a cosmetic feature flag. Switches are off by default. Admins can prepare settings while disabled.
- Approved PPV events can request homepage spotlight from their Studio card. Admin → Homepage reviews these separately from event approval. A database transaction locks the request and hero, adds the event slide and records approval atomically. Public RPCs expose event details/eligible spotlight IDs only; they never reveal source links. Homepage filters disabled/unapproved events and links to /ppv/<event-id>, not free playback.

## Safety boundary
This is a management foundation, **not a completed Phase 1 MVP**. Approved does not mean on sale. No purchases, fabricated revenue, entitlements, premium source URLs or payment success are exposed. Existing free content is unchanged. TV PPV discovery/purchase handoff is deferred until protected playback and payment access exist; TV never treats a PPV spotlight as a free title.

## Blockers before commerce
1. No Paystack or Stripe connection/secret exists. Stripe enablement needs explicit confirmation and tax eligibility configuration; Paystack needs a connected account. No payment code is written before enablement.
2. Premium sources must enforce expiring playback credentials at delivery (Cloudflare Stream signed playback or an equivalent protected CDN). Public YouTube/HLS/channel URLs cannot be paywalled by hiding a button. Do not reuse publicly readable CMS source fields.
3. Checkout settlement must atomically persist orders/payments/ledger/entitlements with unique provider-event and order keys, verify signatures, amounts, currency and buyer; refund settlement revokes access.
4. Concurrency needs persistent sessions and heartbeat takeover; native/TV calls require the same entitlement checks. Native IAP is separate Android work, not web checkout inside a native app.
5. Receipt delivery, cancellation/refund reconciliation and actual buy→watch→takeover→refund→deny checks must run in provider test mode before opening sales.

## Demo checklist
- Save platform and channel rates; reload and verify readback.
- Enable both switches, create Studio draft, submit, review in Admin.
- Confirm disabled Studio cannot save and no approval opens checkout.
- Confirm other creators cannot read/edit another channel's drafts or approve their own event.
- After connection: test payment failures, duplicate/delayed webhooks, signed URL expiry, refund revocation and takeover.

## Verification completed
- Authenticated Admin saved platform/channel switches; Studio created an exact NGN 2500.05 / USD 10 draft, submitted, reloaded and read it back; Admin approved event, Studio requested spotlight, Admin approved spotlight, homepage Event Details opened the same event with sales disabled.
- Event detail page has no horizontal overflow at 280/394/768px; desktop/tablet screenshots inspected. Temporary event and spotlight were removed after tests; switches restored off.
- Unit tests cover default/override split, balanced cents, dual switches, spotlight eligibility, exact price conversion, event destination and Studio return section.

Stop after a verified Phase 1 commerce demo before Phase 2 tiers/promos/gifts/payouts or Phase 3 DRM/scale. Full OpenAPI and gateway test documentation follow real commerce endpoints; current internal functions are getPpvWorkspace, savePpvSettings, savePpvDraft and reviewPpvEvent.