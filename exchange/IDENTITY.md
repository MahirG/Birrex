# 0.3.0 Identity & Security — infrastructure checkpoint

An isolated Cloudflare D1 database named birrex-identity has been provisioned and the migration applied. The database is not bound to the production Worker. No user registration, authentication, credential handling, or real transactions have been enabled.

The initial schema is provisional; select a managed identity provider before exposing it. If managed identity is selected, replace credential/session tables with provider subject IDs and application-specific profiles, preferences and audit events. Do not reuse authentication or data from unrelated applications.

Release gates:
- Managed authentication with verified sessions and secure recovery.
- Server-side authorization and least-privilege administrative roles.
- MFA/passkey support, session revocation, rate limits, bot controls and privacy review.
- Integration tests, browser tests and independent security review.
- Explicit regulatory authorization before enabling real financial activity.

Current production remains 0.2.0. The account infrastructure checkpoint is not a public 0.3.0 release.