# Feature: Nested JWT Patterns

## Description

Support common nested JWT patterns by composing sign, verify, encrypt, and decrypt operations. Two primary patterns are supported:

1. **JWS inside JWE** — A signed JWT is encrypted for confidential transport, then decrypted and verified by the recipient.
2. **JWE inside JWS** — Sensitive data is encrypted into a JWE, placed as a claim inside a signed JWT, then the recipient verifies the signature and decrypts the inner payload.

## User Stories

- As a developer, I want to sign a JWT and then encrypt it into a JWE so that the payload is both authenticated and confidential.
- As a developer, I want to decrypt a JWE and then verify the inner JWS so that I can trust both confidentiality and integrity.
- As a developer, I want to encrypt sensitive data and carry it as a `data` claim inside a signed JWT so that the outer envelope is verifiable while the inner content is protected.
- As a developer, I want to verify a signed JWT, extract the encrypted `data` claim, decrypt it, and hydrate the inner JSON so that I can process confidential structured data.

## Acceptance Criteria

### JWS inside JWE
1. A signed JWT can be encrypted into a JWE using `JwtHelper.encrypt()`.
2. The JWE can be decrypted to recover the original signed JWT string.
3. The recovered JWS can be verified and its claims validated.

### JWE inside JWS
4. A plaintext string can be encrypted into a JWE.
5. The JWE string can be placed as the `data` claim in a JWT body and signed.
6. The outer JWS can be verified and the `data` claim extracted.
7. The extracted `data` claim (JWE) can be decrypted to recover the original plaintext.
8. The decrypted plaintext can be parsed as JSON to recover the original object.

## Technical Notes

- These are composition patterns, not separate API methods. They use existing `sign()`, `verify()`, `encrypt()`, and `decrypt()` methods.
- See examples: `src/examples/jwsInsideJwe.ts` and `src/examples/jweInsideJws.ts`.
