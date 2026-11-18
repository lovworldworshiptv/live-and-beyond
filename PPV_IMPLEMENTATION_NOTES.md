# PPV implementation — Phase 1 preparation

## Delivered
- Admin → Pay-Per-View: persisted platform switch, independent channel switches, default platform commission, channel overrides, per-channel approval requirement and event review with commission override.
- Studio → Pay-Per-View: drafts, live/live+replay/VOD types, artwork upload, exact NGN/USD minor-unit prices, local-time scheduling, configurable duration/replay/rental windows, submit and edit.
- Default split: 2500 basis points platform / remainder channel. Precedence: event → channel → platform. Integer rounding always preserves total.
- Database RLS scopes drafts/settings to channel managers and admins. Only admins write switches/rates/reviews; triggers prevent client approval escalation, ownership changes or edits while disabled. Automatic approval applies only when an admin turns off required review.
- PPV has separate canonical settings, not a cosmetic feature flag. Switches are off by default. Admins can prepare settings while disabled.
- Approved PPV events can request homepage spotlight from their Studio card. Admin → Homepage reviews these separately from event approval. A database transaction locks the request and hero, adds the event slide and records approval atomically. Public RPCs expose event details/eligible spotlight IDs only; they never reveal source links. Homepage filters disabled/unapproved events and links to /ppv/<event-id>, not free playback.

## Safety boundary
This is a test-commerce/access foundation, **not a verified production Phase 1 MVP**. Approved does not mean on sale. Admin may configure a separately protected asset and open test sales; live sales are database-blocked until acceptance. Free content is unchanged. TV purchase handoff is deferred.

## Playback access boundary
- `getPpvPlaybackAccess({ data: { orderId } })` authenticates the buyer, checks their durable paid order, then re-verifies Squad status/reference/exact NGN amount using the order's explicit environment. Unpaid, refunded, unverified, expired and other buyers' orders are denied without signing. No admin bypass.
- `ppv_orders` is buyer-readable only, with trusted-server-only writes and immutable purchase terms; refunded orders are terminal. Future settlement must populate paid/verified state and purchase access windows only after verified payment, and persist refunds.
- `ppv_playback_assets` is service-only and maps each event to a separate protected Cloudflare Stream video UID and environment. Each issuance verifies `requireSignedURLs` at the provider; public channels/YouTube URLs are never accepted. Configure assets through trusted operations, not public CMS source fields.
- Durable eligibility/refund checks run before and after provider verification and again after signing. Credentials last at most 60 seconds (or the remaining access window). Refunded orders receive no new credentials; an already-issued credential may remain valid for up to 60 seconds. Consumers must renew through the same check, never cache credentials. This is not instant invalidation of already-buffered media.
- Buyer checkout, authenticated return confirmation, signed Squad charge webhook and the protected event player are wired. The player renews through the gate before token expiry and stops on failed renewal. Real buy/watch/refund verification remains blocked by provider test credentials and a configured premium asset; no native/TV purchase integration is opened.

## Squad confirmation and delivery
- Redirect: server-fixed `https://lettflix.com/ppv/payment/return?reference=<reference>`. The dedicated page polls buyer-scoped API confirmation every three seconds for up to two minutes; URL status/amount never grant access. Old order-ID returns remain supported. Provider-added reference aliases remain to be confirmed in sandbox.
- Webhook: `https://lettflix.com/api/public/squad/webhook`, after publishing. Configure this in Squad; it validates raw-body `x-squad-encrypted-body` HMAC-SHA512, resolves the persisted reference and re-verifies through Squad before settlement.
- `confirm_ppv_payment` locks the order, checks reference/currency/exact amount/environment and atomically writes paid status plus a single balanced revenue receipt. Duplicate callbacks cannot double-credit; refunded orders stay terminal. Receipt split is on gross until actual gateway-fee settlement is implemented, not a withdrawable wallet balance.
- Refund status returned by Squad verification is persisted as terminal revocation. Automated refund initiation and reconciliation of provider refunds whose transaction endpoint continues reporting Success are not complete; live sales therefore remain locked.
- Admin → PPV → Protected event delivery accepts only an existing video with provider-enforced signed playback; it never makes a free public source premium implicitly. Test sales require Squad sandbox credentials. Current saved live credentials cannot run sandbox purchases.

## Blockers before commerce
1. Squad live credentials are saved, but sandbox credentials are required for the acceptance purchase. Persisted-order hosted checkout, API verification, atomic single-receipt settlement, buyer return reconciliation and raw HMAC-SHA512 webhook authentication are implemented. Configure the published webhook in Squad before acceptance; no payment was initiated in verification.
2. Premium sources must enforce expiring playback credentials at delivery (Cloudflare Stream signed playback or an equivalent protected CDN). Public YouTube/HLS/channel URLs cannot be paywalled by hiding a button. Do not reuse publicly readable CMS source fields.
3. Order settlement and balanced gross receipts are atomic and idempotent; complete gateway-fee ledger/wallet settlement and independent refund reconciliation before production. Recorded refunds and provider-reported refunded status revoke new playback credentials.
4. Concurrency needs persistent sessions and heartbeat takeover; native/TV calls require the same entitlement checks. Native IAP is separate Android work, not web checkout inside a native app.
5. Receipt delivery, cancellation/refund reconciliation and actual buy→watch→takeover→refund→deny checks must run in provider test mode before opening sales.

## Demo checklist
- Save platform and channel rates; reload and verify readback.
- Enable both switches, create Studio draft, submit, review in Admin.
- Confirm disabled Studio cannot save and no approval opens checkout.
- Confirm other creators cannot read/edit another channel's drafts or approve their own event.
- After connection: test payment failures, duplicate/delayed webhooks, signed URL expiry, refund revocation and takeover.

## Verification completed
- Squad live account verified through authenticated Admin → Pay-Per-View using a read-only balance request. Test endpoint rejected the supplied credential (403); no payment initiated. Admin check fits phone/desktop. Nine Squad/PPV tests pass; production charges remain disabled.
- Authenticated Admin saved platform/channel switches; Studio created an exact NGN 2500.05 / USD 10 draft, submitted, reloaded and read it back; Admin approved event, Studio requested spotlight, Admin approved spotlight, homepage Event Details opened the same event with sales disabled.
- Event detail page has no horizontal overflow at 280/394/768px; desktop/tablet screenshots inspected. Temporary event and spotlight were removed after tests; switches restored off.
- Unit tests cover default/override split, balanced cents, dual switches, spotlight eligibility, exact price conversion, event destination and Studio return section.

Stop after a verified Phase 1 commerce demo before Phase 2 tiers/promos/gifts/payouts or Phase 3 DRM/scale. Full OpenAPI and gateway test documentation follow real commerce endpoints; current internal functions are getPpvWorkspace, savePpvSettings, savePpvDraft and reviewPpvEvent.

## Enterprise fix pass — checkout and webhook phase
- Test payments require `SQUAD_SANDBOX_SECRET_KEY`; there is no live-key fallback. API host selection remains explicitly tied to the persisted order environment; a sandbox-prefixed live credential is rejected.
- `prepare_ppv_order` serializes buyer/event preparation and reuses the same pending order for 30 minutes. Checkout URLs are persisted. `claim_ppv_checkout` permits only one provider initiation per order; an ambiguous failed initiation deliberately stays claimed until expiry rather than risk duplicate charges. Paid active purchases cannot open another checkout.
- Expiry is derived from stored timestamps rather than an unattended cleanup timer. Expired unpaid checkouts are not reused; late verified payments still settle for safety, pending a reviewed late-payment refund policy.
- Verified webhook events store only reference, event, payload digest and timestamps, not raw customer/payment payloads. The unique reference/event key skips completed duplicates; unfinished events retry the row-locked settlement. Raw-body HMAC is mandatory, with case-insensitive hex decoding. Sandbox must confirm provider serialization before activation.
- Successful payment mismatches persist `payment_state=review` and a private audit entry, with no playable gate. Settlement inserts its audit entry in the same transaction as paid status and the balanced receipt.
- No payment, refund, reconciliation, notification, concurrency or DRM acceptance is implied by this phase. No live activation, no viewer-identity watermark and no inactivity logout added.
- Rate limiting awaits explicit approval of an ad-hoc solution because the backend has no standard primitive. Reconciliation, refunds, delivered receipts, configured concurrency/geo policies and financial ledger work remain the next phases.