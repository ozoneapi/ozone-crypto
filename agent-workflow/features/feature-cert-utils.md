# Feature: Certificate Utilities

## Description

Bash scripts for generating RSA private keys, Certificate Signing Requests, self-signed CA certificates, and issuing X.509 certificates signed by a CA. All scripts use named parameters, strict error handling, and are idempotent (skip if output exists).

## User Stories

- As a developer, I want to generate an RSA private key so that I can use it for signing or encryption.
- As a developer, I want to generate a CSR from a private key so that I can request a certificate from a CA.
- As a developer, I want to generate a self-signed CA certificate so that I can issue certificates for testing or internal use.
- As a developer, I want to issue an X.509 certificate signed by a CA so that services can authenticate using TLS.
- As a developer, I want to issue certificates with SANs so that they cover multiple hostnames.
- As a developer, I want scripts to be idempotent so that re-running them does not overwrite existing key material.

## Acceptance Criteria

### generate-key.sh
1. Generates a 2048-bit RSA private key at the specified `--key` path.
2. Creates parent directories if they don't exist.
3. Skips generation if the key file already exists.
4. Exits with error if `--key` is not provided.

### generate-csr.sh
5. Generates a CSR using the private key at `--key` and writes to `--csr`.
6. Sets the certificate subject from `--subject`.
7. Validates that the private key file exists before generating.
8. Skips generation if the CSR file already exists.
9. Exits with error if any required parameter is missing.

### generate-ca.sh
10. Generates a 4096-bit RSA CA private key and self-signed CA certificate.
11. Supports `--days` parameter with default of 3650.
12. Validates `--days` is a positive integer.
13. If the key exists but the PEM doesn't, reuses the existing key.
14. Skips entirely if the PEM already exists.

### issue-cert.sh
15. Issues a certificate using `--csr`, signed by `--ca-pem` and `--ca-key`.
16. Writes the certificate to `--pem`.
17. Appends the CA certificate to the PEM to create a full chain.
18. Supports `--csr-config` for SAN-enabled certificates.
19. Without `--csr-config`, issues a certificate valid for 500 days.
20. With `--csr-config`, issues a certificate valid for 1000 days.
21. Validates all input files exist before proceeding.
22. Skips if the PEM file already exists.

### General
23. All scripts use `set -euo pipefail`.
24. All scripts use named parameters parsed via `while/case` loop.
25. All scripts support `--help` / `-h`.
26. All scripts log with a `[script-name]` prefix; errors go to stderr.

## Technical Notes

- Scripts located in `ozone-crypto/cert-utils/`.
- All use `#!/bin/bash` (not `#!/usr/bin/env bash` due to container restrictions).
- `generate-ca.sh` uses 4096-bit for stronger CA keys; `generate-key.sh` uses 2048-bit for service keys.
- `issue-cert.sh` no longer depends on `OZONE_HOME`; CA paths are explicit parameters.
