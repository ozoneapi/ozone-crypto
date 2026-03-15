# S3 JWKS Manager

CLI utility and TypeScript library for generating, managing, and publishing JWKS (JSON Web Key Sets) to AWS S3.

## Prerequisites

- Node.js >= 18
- AWS credentials configured (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, or an AWS profile)
- `@aws-sdk/client-s3` dependency (S3-only — no full AWS SDK required)

## Installation

From the `ozone-crypto` root:

```bash
yarn install
```

## CLI Usage

All commands require `--bucket`, `--tenant`, `--region` and `--out-dir`:

### Initialise a new JWKS

Generates a signing key pair (PS256) and an encryption key pair (RSA-OAEP), writes key material locally, and publishes the public JWKS to S3.

```bash
yarn jwks init \
  --bucket jwks.ozoneapi.io \
  --tenant dc-uat-01.jwks \
  --region eu-west-2 \
  --out-dir ./temp/dc-uat-01 \
  --key-size 2048
```


## Commands

| Command | Description |
|---|---|
| `init` | Generate signing + encryption key pairs, create JWKS, publish to S3 |

## CLI Options

| Option | Alias | Required | Default | Description |
|---|---|---|---|---|
| `--bucket` | `-b` | Yes | — | S3 bucket name |
| `--tenant` | `-t` | Yes | — | S3 object key for the JWKS file |
| `--region` | `-r` | Yes | — | AWS region |
| `--out-dir` | `-d` | Yes | — | Local directory for key material |
| `--key-size` | — | No | `2048` | RSA key size in bits |

## Generated Files

After `init`, the `--out-dir` contains:

```
<out-dir>/
├── manifest.json                      # Local key inventory
├── jwks.json                          # Public JWKS (published to S3)
├── <kid>-sig-key.key                  # Signing private key (PEM)
├── <kid>-sig-key.pub                  # Signing public key (PEM)
├── <kid>-sig-key.private-jwk.json     # Signing private key (JWK)
├── <kid>-sig-key.public-jwk.json      # Signing public key (JWK)
├── <kid>-enc-key.key                  # Encryption private key (PEM)
├── <kid>-enc-key.pub                  # Encryption public key (PEM)
├── <kid>-enc-key.private-jwk.json     # Encryption private key (JWK)
└── <kid>-enc-key.public-jwk.json      # Encryption public key (JWK)
```

## Environment Variables

After `init`, create a `key-material.env` for use with examples and tests:

```bash
export JWKS_URL=https://s3.<region>.amazonaws.com/<bucket>/<tenant>
export SIGNING_KID=<sig-kid>
export SIGNING_PRIVATE_KEY_PEM=<out-dir>/<kid>-sig-key.key
export SIGNING_PUBLIC_KEY_PEM=<out-dir>/<kid>-sig-key.pub
export SIGNING_JWK=<out-dir>/<kid>-sig-key.jwk.json
export ENCRYPTION_KID=<enc-kid>
export ENCRYPTION_PRIVATE_KEY_PEM=<out-dir>/<kid>-enc-key.key
export ENCRYPTION_PUBLIC_KEY_PEM=<out-dir>/<kid>-enc-key.pub
export ENCRYPTION_PUBLIC_JWK=<out-dir>/<kid>-enc-pub-key.jwk.json
export ENCRYPTION_PRIVATE_JWK=<out-dir>/<kid>-enc-key.jwk.json
```

## Architecture

- **`cli.ts`** — yargs-based CLI entry point
- **`JwksManager.ts`** — Core logic for key generation, manifest management, and S3 publishing
- **`S3Client.ts`** — Lightweight S3 wrapper using `@aws-sdk/client-s3` (no full AWS SDK)

## See Also

- [cert-utils](../../cert-utils/README.md) — Bash scripts for X.509 certificate operations
- [JwtHelper](../../src/lib/JwtHelper.ts) — JWT sign/verify/encrypt/decrypt
- [JwksClient](../../src/lib/JwksClient.ts) — Fetch keys from remote JWKS endpoints
