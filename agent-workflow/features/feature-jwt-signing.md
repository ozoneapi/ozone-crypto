# Feature: JWT Signing

## Description

Sign JWT payloads using `none`, symmetric (HMAC), or asymmetric (RSA-PSS/ECDSA) algorithms, producing compact JWS tokens. Supports automatic timestamp claims, JTI generation, custom headers, and critical header declaration.

## User Stories

- As a developer, I want to sign a JWT with a private key so that the recipient can verify its authenticity.
- As a developer, I want to sign a JWT with a shared secret (HMAC) for lightweight symmetric authentication.
- As a developer, I want to produce an unsigned JWT (alg: none) for internal/test scenarios where signature verification is unnecessary.
- As a developer, I want to automatically set `exp`, `iat`, and `nbf` claims by specifying a validity duration so that I don't have to calculate timestamps manually.
- As a developer, I want to include a unique `jti` claim so that each token is individually identifiable.
- As a developer, I want to add custom headers to the protected header so that I can carry application-specific metadata.

## Acceptance Criteria

1. **Asymmetric signing** — Accepts private key as PEM string, PEM file path, or JWK object.
2. **Symmetric signing** — Accepts a shared secret string and signs with the specified HMAC algorithm (e.g. HS256).
3. **None signing** — Produces a 3-part compact token with an empty signature segment.
4. **Validity claims** — When `setValidityInS` is provided, `exp = now + setValidityInS`, `iat = now`, `nbf = now`.
5. **Validity claims absent** — When `setValidityInS` is undefined, `exp`, `iat`, and `nbf` are NOT set automatically.
6. **JTI** — When `setJti` is `true`, a UUID `jti` claim is added. When `false` or undefined, no `jti` is set.
7. **Standard headers** — `kid`, `typ`, `cty`, and `crit` are set in the protected header when provided.
8. **Custom headers** — Arbitrary key/value pairs from `customHeaders` are included in the protected header.
9. **Error handling** — Throws if asymmetric key material is missing or invalid.

## Technical Notes

- Implementation: `JwtHelper.sign()` delegates to `signWithNone()` or `signWithAlg()` based on `algType`.
- `signWithNone()` manually encodes header and body as base64url with an empty signature.
- `signWithAlg()` uses the `jose` library's `SignJWT` class.
- Key resolution order for asymmetric: `signingKey` (PEM string) → `signingKeyFileName` (file path) → `signingKeyJwk` (JWK object).
