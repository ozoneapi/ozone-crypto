# Features

Individual feature specifications derived from `JwtHelper` and `JwksClient` implementations.

## Feature Index

| Feature | File | Primary Class |
|---|---|---|
| JWT Signing | [feature-jwt-signing.md](./feature-jwt-signing.md) | `JwtHelper.sign()` |
| JWT Verification | [feature-jwt-verification.md](./feature-jwt-verification.md) | `JwtHelper.verify()` |
| JWE Encryption | [feature-jwe-encryption.md](./feature-jwe-encryption.md) | `JwtHelper.encrypt()` |
| JWE Decryption | [feature-jwe-decryption.md](./feature-jwe-decryption.md) | `JwtHelper.decrypt()` |
| JWKS Client | [feature-jwks-client.md](./feature-jwks-client.md) | `JwksClient` |
| Nested JWT Patterns | [feature-nested-jwt.md](./feature-nested-jwt.md) | Composition of above |

## Structure

Each feature file includes:
- **Description** — What the feature does
- **User Stories** — Who needs it and why
- **Acceptance Criteria** — Testable requirements
- **Technical Notes** — Implementation details and key decisions
