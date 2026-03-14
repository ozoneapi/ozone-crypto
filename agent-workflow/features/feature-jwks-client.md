# Feature: JWKS Client

## Description

Fetch public keys from remote JWKS (JSON Web Key Set) endpoints, filtered by key use (`sig` or `enc`) and optionally by Key ID (`kid`). Enables key discovery for signature verification and encryption without pre-sharing key material.

## User Stories

- As a developer, I want to fetch a signing public key from a JWKS URL so that I can verify JWTs without managing keys locally.
- As a developer, I want to fetch an encryption public key from a JWKS URL so that I can encrypt payloads for a remote party.
- As a developer, I want to fetch a specific key by `kid` so that I can target the correct key when multiple keys exist in the JWKS.
- As a developer, I want clear error messages when a key cannot be found so that I can diagnose configuration issues.

## Acceptance Criteria

### Happy Path
1. Fetches a JWK with `use: 'sig'` from a valid JWKS URL.
2. Fetches a JWK with `use: 'enc'` from a valid JWKS URL.
3. Fetches a JWK by `use` AND `kid` when both are specified.
4. Falls back to matching `key_ops` when `use` is not present on the key.
5. Returns a JWK object with standard fields (`kty`, `kid`, `n`, `e` for RSA).

### Error Handling — Invalid Endpoint
6. Throws when the URL returns a non-JWKS JSON response (no `keys` array).
7. Throws when the URL returns an HTTP error status.
8. Throws when the URL is unreachable.

### Error Handling — Key Not Found
9. Throws when no key matches the requested `use`.
10. Throws when no key matches the requested `kid`.

### Error Handling — Key Use Mismatch
11. Throws when `kid` is found but `use` does not match — error message includes the actual `use` and `key_ops`.
12. Throws when requesting `sig` use with an `enc` kid (and vice versa).

## Technical Notes

- Implementation: `JwksClient.getJwksByUseAndKid()` fetches JWKS via `fetch()`, then delegates to `getKeyFromJwksByUse()` or `getKeyFromJwksByKid()`.
- Key matching logic: checks `key.use === use` OR `key.key_ops?.includes(keyOps)` where `keyOps` is `'encrypt'` for `enc` and `'sign'` for `sig`.
- When `kid` is provided, the key must match both `kid` AND `use`/`key_ops`; mismatches produce a descriptive error.
- Uses native `fetch()` (Node.js >= 18).
