# Feature: JWE Decryption

## Description

Decrypt JWE compact tokens using a private key, with validation of the key management algorithm (`alg`) and content encryption algorithm (`enc`) against expected values.

## User Stories

- As a developer, I want to decrypt a JWE to recover the original plaintext so that I can process confidential payloads.
- As a developer, I want to validate that the JWE uses the expected algorithms so that I reject tokens encrypted with unexpected or weak algorithms.
- As a developer, I want to provide my decryption key as a PEM string, PEM file, or JWK so that I have flexibility in key management.

## Acceptance Criteria

1. Decrypts a valid JWE and returns the plaintext string and protected header.
2. Validates `alg` in the JWE header matches `verifyKeyManagementAlgorithm`; throws if mismatched.
3. Validates `enc` in the JWE header matches `verifyContentEncryptionAlgorithm`; throws if mismatched.
4. Accepts decryption key as PEM string (`encryptionKey`).
5. Accepts decryption key as PEM file path (`encryptionKeyFileName`).
6. Accepts decryption key as JWK object (`encryptionKeyJwk`).
7. Throws if no valid decryption key is provided.
8. Throws if decryption fails (e.g. wrong key).
9. Plaintext can be recovered as any string (JWT for nested tokens, JSON, arbitrary text).

## Technical Notes

- Implementation: `JwtHelper.decrypt()` resolves the private key via `getDecryptionPrivateKey()`, then uses `jose.compactDecrypt`.
- Algorithm validation happens post-decryption by comparing `result.protectedHeader.alg` and `.enc`.
- Key resolution order: `encryptionKey` → `encryptionKeyFileName` → `encryptionKeyJwk`.
