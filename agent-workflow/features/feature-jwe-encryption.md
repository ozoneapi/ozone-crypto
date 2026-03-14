# Feature: JWE Encryption

## Description

Encrypt arbitrary plaintext strings into JWE compact tokens using RSA key management and symmetric content encryption. Supports key sourcing from PEM strings, PEM files, JWK objects, or remote JWKS endpoints. Optionally includes a `kid` in the protected header.

## User Stories

- As a developer, I want to encrypt a signed JWT into a JWE so that the payload is confidential in transit (nested JWT).
- As a developer, I want to encrypt a JSON string into a JWE so that sensitive data is protected at rest or in transit.
- As a developer, I want to encrypt using a public key fetched from a JWKS URL so that I can encrypt without pre-sharing key material.
- As a developer, I want to include a `kid` in the JWE header so that the recipient can identify which key to use for decryption.
- As a developer, I want to omit `kid` from the JWE header when it is not needed.

## Acceptance Criteria

1. Produces a valid JWE compact token (5 dot-separated base64url segments).
2. Protected header includes `alg`, `enc`, and `cty: 'JWT'`.
3. `kid` is included in the protected header when provided.
4. `kid` is absent from the protected header when not provided.
5. Accepts encryption key as PEM string (`encryptionKey`).
6. Accepts encryption key as PEM file path (`encryptionKeyFileName`).
7. Accepts encryption key as JWK object (`encryptionKeyJwk`).
8. Accepts encryption key via JWKS URL (`jwksUrl`) — fetches the `enc` key automatically.
9. Throws if no valid encryption key is provided.
10. Encrypted content can be any string (JWT, JSON, arbitrary text).

## Technical Notes

- Implementation: `JwtHelper.encrypt()` resolves the public key via `getEncryptionPublicKey()`, then uses `jose.CompactEncrypt`.
- JWKS key resolution delegates to `JwksClient.getJwksByUseAndKid(url, 'enc')`.
- Key resolution order: `encryptionKey` → `encryptionKeyFileName` → `encryptionKeyJwk` → `jwksUrl`.
