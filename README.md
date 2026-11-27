# BirrEX — Signature Edition
A dependency-free, responsive static frontend reconstructed from the supplied rendered BirrEX HTML snapshot. The existing workspace archive is preserved.

## Preview
Run `python3 -m http.server 8080` from the repository root, then open http://localhost:8080. No build step, environment variables, package installation or network APIs are needed.

## Structure
- index.html — semantic UI, sample chart, fictional order book, sections, and regulatory disclosure.
- styles.css — responsive design tokens, layout, accessibility and reduced-motion styles.
- app.js — mobile navigation and local hypothetical exchange-rate calculator.

## Operational limitations
This is a design prototype, not a working financial service. All rates and order book figures are explicitly fictional. No registrations, orders, wallets, deposits, transfers, escrow, KYC data collection, payment-provider integrations, or external financial APIs are implemented. The supplied snapshot contained unverified market-share, trader-count, certification, reserve and licensing assertions; these have been removed rather than repeated. The calculator uses a fixed illustrative rate of 128.45 ETB/USD and excludes fees.

NBE's 27 February 2026 public notice states that Birr-paired P2P cryptocurrency transactions are not permitted absent express NBE authorization. No authorization has been independently verified for this project. Do not enable real-world operations or market this as a licensed exchange without regulatory authorization, legal review, and independent technical/security validation.
https://nbe.gov.et/nbe_news/public-notice-notice-on-illegal-birr-paired-peer-to-peer-p2p-transactions-via-trading-platforms/

## Manual acceptance checklist
- Open at 360px, 768px, 1440px and 200% zoom.
- Check keyboard focus, skip navigation, mobile menu and Escape handling.
- Check 100 USD = 12,845.00 ETB, 128.45 ETB = 1.00 USD, zero and invalid amounts.
- Confirm every rate and order book panel is labeled as a simulation.
- Verify no external scripts, hidden transaction calls or placeholder login flows.
