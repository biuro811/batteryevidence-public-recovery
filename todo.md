# BatteryEvidence full workflow recovery

## Objective
Restore the former BatteryDocs commercial workflow on `batteryevidence.eu` without reviving the unavailable Manus deployment or copying prior credentials. Production remains a Netlify static site plus serverless Functions on the same domain.

## Delivery plan

- [x] Preserve the public EN/PL/DE landing and the correct service boundaries.
- [x] Recover and audit the authorised original source snapshot without importing prior credentials or unverified cloud configuration.
- [x] Reconstruct a provider-independent workflow design: lead, consultation, private order, accepted Order Form, Stripe Checkout, payment webhook, operations queue and post-payment intake.
- [ ] Add Netlify Functions and site-wide secure runtime storage for the workflow.
- [ ] Replace the public `mailto:` handoff with validated, database-like server-side scope-check capture.
- [ ] Restore private expiring order links and server-side Order Form acceptance gates.
- [ ] Restore **test-mode only** Stripe Checkout and signed webhook deduplication. Live Stripe keys are deliberately not configured.
- [ ] Restore private post-payment document intake, quarantine status, manual clean/reject action and controlled operations download.
- [ ] Restore the protected operations dashboard with lead, consultation, order and document queues.
- [ ] Configure owner notification separately through Netlify Forms or a chosen mail provider; no email API secret will be placed in source code.
- [ ] Link the repository to Netlify or deploy a production artifact including Functions; re-test public and protected paths on the custom domain.
- [ ] Do not enable live payments or claim automated malware scanning until Stripe live secrets / webhook and a dedicated scanning service have passed a separate acceptance test.

## Non-negotiable scope controls

- BatteryDocs offers evidence review and technical-data preparation only. It is not certification, legal advice, laboratory testing, Digital Product Passport issuance, EU registry submission, production DPP hosting or a market-access guarantee.
- A browser must never choose a charge amount, currency, payment status or file-access grant.
- Checkout is created only after a written Order Form has been accepted server-side.
- A Stripe success redirect never releases intake. A verified webhook records `paid`; an authorised operations user separately records `payment_cleared` and releases intake.
- Public forms accept text only. Private documents remain quarantined and are not exposed for download until an operations user marks them clean. Automated ClamAV/IBM COS from the prior environment is not being represented as active.
- No old token, storage key, Stripe secret, account password, or Manus runtime secret will be reused.
