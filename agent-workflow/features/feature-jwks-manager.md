# Feature: S3 JWKS Manager

## Description

CLI utility and TypeScript library for generating RSA key pairs (signing and encryption), managing them in a local manifest, building a public JWKS (JSON Web Key Set), and publishing it to an AWS S3 bucket. Provides the complete lifecycle for JWKS management: initialisation, key addition, key removal, listing, and publishing.

## User Stories

- As a developer, I want to initialise a new JWKS with a signing and encryption key pair so that I have the minimum key material for Open Finance operations.
- As a developer, I want to publish a JWKS to S3 so that relying parties can discover my public keys via a URL.
- As a developer, I want to add a new key to an existing JWKS so that I can rotate keys without downtime.
- As a developer, I want to remove an old key from the JWKS so that decommissioned keys are no longer advertised.
- As a developer, I want to list all keys in my local manifest so that I can audit what's currently configured.
- As a developer, I want generated key material in PEM and JWK formats so that I can use them with different tools and libraries.
- As a developer, I want the JWKS to only contain public keys so that private key material is never exposed.

## Acceptance Criteria

### init
1. Creates the output directory if it doesn't exist.
2. Generates a signing key pair (default PS256, 2048-bit).
3. Generates an encryption key pair (RSA-OAEP, 2048-bit).
4. Writes private key PEM, public key PEM, private JWK, and public JWK files for each key.
5. Creates a `manifest.json` with entries for both keys.
6. Builds a `jwks.json` containing only public JWKs.
7. Publishes `jwks.json` to S3 at the specified bucket/key.
8. Rejects if the manifest already exists (prevents accidental reinitialisation).
9. Each key has a unique `kid` deterministically derived from its public JWK (SHA-256 hash, base64url-encoded).
10. JWK entries include `kid`, `use`, `kty`, `n`, `e`.

### publish
11. Reads the local manifest and builds the public JWKS.
12. Uploads to S3, overwriting only if `--force` is set.
13. Rejects if no manifest exists.
14. Rejects if S3 object already exists and `--force` is not set.

### add-key
15. Generates a new key pair with specified `--key-use` and `--alg`.
16. Appends the key to the local manifest.
17. Republishes the JWKS to S3 (force overwrite).
18. Supports custom `--kid` or auto-generates one.

### remove-key
19. Removes the key with matching `--kid` from the manifest.
20. Deletes local key files (PEM and JWK).
21. Republishes the JWKS to S3.
22. Rejects if no key matches the given `--kid`.

### list
23. Prints a table of all keys with kid, alg, and use columns.
24. Rejects if no manifest exists.

### CLI
25. Uses yargs with named parameters (`--bucket`, `--tenant`, `--out-dir`, etc.).
26. Supports `--help` / `-h`.
27. Validates required parameters before executing commands.

### S3 Client
28. Uses `@aws-sdk/client-s3` (modular, S3-only — not the full AWS SDK).
29. Supports `putObject`, `getObject`, `deleteObject`, `objectExists`.
30. `objectExists` returns `false` for 404, rethrows other errors.
31. `putObject` sets `ContentType` and `ACL: public-read`.

## Technical Notes

- CLI entry point: `src/utils/s3-jwks/Cli.ts`, run via `yarn jwks <command>`.
- Core logic: `src/utils/s3-jwks/JwksManager.ts`.
- S3 wrapper: `src/utils/s3-jwks/S3Client.ts`.
- Key generation uses `jose.generateKeyPair()` then exports to PEM via `crypto.KeyObject.export()`.
- Manifest persists full `TKeyPair` objects (including private key material); JWKS is rebuilt from the manifest on every publish.
- File naming convention: `<safe-kid>-<use>-key.<ext>` where `safe-kid` is the kid with non-alphanumeric chars replaced by `_`.
