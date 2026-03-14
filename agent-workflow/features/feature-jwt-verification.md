# Feature: JWT Verification

## Description

Verify JWS compact tokens with cryptographic signature validation, followed by extensible header and claim verification. Supports `none`, symmetric, and asymmetric algorithms, with public keys sourced from PEM strings, PEM files, JWK objects, or remote JWKS endpoints.

## User Stories

- As a developer, I want to verify a JWT signature so that I can trust its integrity and authenticity.
- As a developer, I want to verify a JWT using a remote JWKS URL so that I don't need to manage public keys locally.
- As a developer, I want to enforce that specific headers are present (or absent) so that I can reject non-compliant tokens.
- As a developer, I want to enforce that specific claims match expected values so that I can validate issuer, subject, and audience.
- As a developer, I want to verify time-based claims (`exp`, `iat`, `nbf`) with configurable clock skew so that minor clock drift doesn't cause false rejections.
- As a developer, I want to get the raw unparsed body when I don't need claim validation so that I can handle non-JSON payloads.

## Acceptance Criteria

### Signature Verification
1. Verifies asymmetric signatures using PEM string, PEM file path, JWK object, or JWKS URL.
2. Verifies symmetric signatures using a shared secret.
3. Verifies `none` tokens by checking the signature segment is empty.
4. Rejects tokens with an invalid signature.
5. Rejects `none` tokens that have a non-empty signature.
6. Rejects tokens with fewer or more than 3 dot-separated parts (for `none`).

### Header Verification
7. `mustHaveHeaders` — Rejects if any listed header is absent.
8. `mustNotHaveHeaders` — Rejects if any listed header is present.
9. `mustMatchHeaders` — Rejects if any header does not match the expected value.
10. `mustHaveCriticalHeaders` — Rejects if the header is absent, `crit` array is missing, or `crit` does not include the header name.

### Claim Verification
11. `mustHaveClaims` — Rejects if any listed claim is absent.
12. `mustNotHaveClaims` — Rejects if any listed claim is present.
13. `mustMatchClaims` — Rejects if any claim does not match the expected value.

### Audience Verification
14. `mustBeOneOfAudClaim` — `aud` must be present and contain at least one matching value (works with string or array `aud`).
15. `mustHaveStringAud` — `aud` must be present and must be a string (not an array).
16. Rejects non-string, non-array `aud` values.

### Time-Based Verification
17. `verifyFutureExp` — `exp` must be a number and in the future (within skew).
18. `verifyPastIat` — `iat` must be a number and in the past (within skew).
19. `verifyPastNbf` — `nbf` must be a number and in the past (within skew).
20. `verifyMaxNbfAge` — `nbf` must not be older than the specified seconds.
21. `verifyMaxAgeInS` — Token age (now - iat) must not exceed the specified seconds.
22. `verifyLifespanInS` — Token lifespan (exp - iat) must not exceed the specified seconds.
23. Clock skew is configurable; defaults to 10 seconds.

### Parse Control
24. `parseBody: true` — Body is parsed as JSON and claim verification is performed.
25. `parseBody: false` — Raw body string is returned; claim verification params are disallowed.
26. Throws if claim verification params are provided with `parseBody: false`.

## Technical Notes

- Implementation: `JwtHelper.verify()` delegates to `verifyWithNone()` or `verifyWithAlg()`, then calls `verifyHeaders()` and optionally `verifyBody()`.
- `verifyWithAlg()` uses `jose.compactVerify()`.
- Public key resolution order: `signingKey` → `signingKeyFileName` → `signingKeyJwk` → `jwksUrl`.
