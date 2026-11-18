# PPV security verification — 18 November 2026

## Summary
**Go-live: BLOCKED.** This is the first approved enterprise fix phase, not full implementation of every audit item. No readiness score or exact open-priority totals are assigned: the remaining enterprise controls have not been re-audited in this pass. Live sales remain database-locked. No real charge was made.

## Squad go-live status
| ID | Status | Evidence / remaining work |
|---|---|---|
| 1A.1 | PARTIAL | `squadSecretForEnvironment` isolates live/test secrets; sandbox secret not yet provided. |
| 1A.2 | PARTIAL | `prepare_ppv_order`, `claim_ppv_checkout`, stored checkout URL, 30-minute reuse, exact server price. Provider acceptance not run; expiry is derived and old late-paid orders require future refund policy. |
| 1A.3 | PARTIAL | `/ppv/payment/return`, buyer-scoped reference lookup, three-second polling bounded to two minutes. No standard rate limiter; no ad-hoc implementation without approval. Provider parameter names need sandbox confirmation. |
| 1A.4 | PARTIAL | Raw-body HMAC, environment matching, private digest records keyed by reference/event, completed replay suppression. No live webhook activation, asynchronous worker or reconciliation schedule yet. |
| 1A.5 | PARTIAL | Row-lock atomic receipt/status/audit settlement; mismatch review denies playback. Full fee/tax double-entry ledger and delivered receipts remain. |
| 1A.6 | PARTIAL | Existing verified payment/revocation gates and ≤60-second protected credentials. Concurrency, geo, devices, waiting room and physical provider acceptance remain. |
| 1A.7 | PARTIAL | Provider-reported refunds revoke access; refund initiation/cancellation automation and reversing ledger remain. |
| 1A.8 | NOT RUN | Sandbox credential and approved protected test event required; later real-money smoke test requires explicit operational acceptance. |
| 1A.9 | NO-GO | Live sales remain locked. |

## Verification evidence
- 37 tests passed across `ppv`, `squad`, `ppv-access`, `ppv-payment`, `ppv-checkout`, `ppv-webhook` test files.
- Signed-in browser: fabricated paid-status return URL with a nonexistent reference grants no access at 1280, 768 and 280px; no page errors or horizontal overflow. Screenshot inspected at 280px.
- Live preview forged signed charge POST returns 401.
- Database read confirms all four added checkout fields exist; orders, payment audit and webhook tables have RLS. Anonymous SELECT and authenticated UPDATE on all three are denied. Buyer cannot call payment-review function.
- Preview compilation signal: build OK.
- Payment audit is append-only through grants and mutation-rejecting trigger. Verified webhook records store payload hashes rather than raw PII. Automated alert routing is not configured.

## Section 9 matrix
PASS here means the named automated or browser check passed, **not** provider acceptance.

| Tests | Status | Scope |
|---|---|---|
| 1–6 | PARTIAL | Database privilege checks and prior access unit tests; no cross-account mutation/role-escalation attack executed in this phase. |
| 7 | PASS | Forged signature rejected with 401 in preview. |
| 8 | PARTIAL | Unit tests verify mismatch review call and no settlement; real sandbox mismatch not run. |
| 9 | PARTIAL | Replay helper tested; concurrent database/provider settlement not run. |
| 10 | PARTIAL | Existing exact-kobo tests; real browser-tampered checkout not charged. |
| 11 | NOT RUN | Promos not implemented. |
| 12 | PASS | Signed-in fabricated return with paid/amount parameters grants no access. |
| 13–14 | PARTIAL | Protected access/token expiry unit tests; actual provider token copying not tested. |
| 15–17 | NOT RUN | Concurrency, geo and tier quality not implemented. |
| 18 | PARTIAL | Expired access denied in unit tests, not real provider playback. |
| 19–22 | NOT RUN | Refund automation, full ledger, payout and gateway reconciliation remain. |
| 23–25 | NOT RUN | Full production bundle, all-public-table and production-header scans not repeated. |
| 26 | PARTIAL | Isolated credential selection tested; production bundle/provider acceptance not run. |
| 27 | PARTIAL | Server uses persisted exact amount; tampered real checkout not run. |
| 28 | PARTIAL | Failure handling implemented; real failed reference unavailable. |
| 29–32 | NOT RUN | Require sandbox/live provider acceptance and subsequent reconciliation phase. |

## Next phases / blockers
### Continuation result
- Final regression run: 41 tests passed across nine PPV/Squad test files; preview build OK and whitespace check clean.
- Admin manual reconciliation returns real zero-order readback at desktop/394/280px with no horizontal overflow or page errors. Authenticated callback returns 200 and anonymous callback 401. Five-minute schedule exists; production execution after publication is not verified.
- Concrete database limits verified: five successful checkout attempts then denial; 45 successful confirmations then denial. Test limit rows removed.
- Persistent order-locked session takeover, country checks, waiting room, buyer receipts, in-app receipt alerts, balanced pending ledger and refund reversals are implemented. Actual purchased playback, takeover/refund, fee settlement and provider country enforcement are NOT RUN.
- Sandbox key entry was declined; real acceptance remains blocked. Full refunds/cancellations, fee/tax ledger, receipt email/SMS, payout hold/KYC/MFA, promos/gifts, DRM, device enforcement and native/TV purchase handoff are still outstanding, not completed by this continuation.

1. Sandbox key, approved test event, protected Stream asset and provider refund API acceptance; then reconciliation, full ledger/receipt delivery, refunds.
2. Confirm payout hold/refund windows, concurrency takeover policy and broadcast-rights countries before financial/session/geo enforcement.
3. Native/TV PPV remains closed until web commerce acceptance. TV/free playback behaviour is unchanged; no identity watermarks or inactivity timeouts added.
4. DRM, MFA financial rights, monitoring, compliance, advanced pricing and load testing follow verified core commerce; no dates or guarantees supplied.