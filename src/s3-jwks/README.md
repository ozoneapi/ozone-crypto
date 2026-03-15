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

All commands require `--bucket`, `--key`, and `--out-dir`:

### Initialise a new JWKS

Generates a signing key pair (PS256) and an encryption key pair (RSA-OAEP), writes key material locally, and publishes the public JWKS to S3.

```bash
yarn jwks init \
  --bucket jwks.ozoneapi.io \
  --key dc-uat-01.jwks \
  --out-dir ./temp/dc-uat-01 \
  --alg PS256 \
  --key-size 2048
```

### List local keys

```bash
yarn jwks list \
  --bucket jwks.ozoneapi.io \
  --key dc-uat-01.jwks \
  --out-dir ./temp/dc-uat-01
```

### Add a new key

```bash
# Add a signing key
yarn jwks add-key \
  --bucket jwks.ozoneapi.io \
  --key dc-uat-01.jwks \
  --out-dir ./temp/dc-uat-01 \
  --key-use sig --alg PS256

# Add an encryption key
yarn jwks add-key \
  --bucket jwks.ozoneapi.io \
  --key dc-uat-01.jwks \
  --out-dir ./temp/dc-uat-01 \
  --key-use enc
```

### Remove a key

```bash
yarn jwks remove-key \
  --bucket jwks.ozoneapi.io \
  --key dc-uat-01.jwks \
  --out-dir ./temp/dc-uat-01 \
  --kid "ozPOzyXOh6ibr7X5C898lZJdjnEWv5uF9az6eXBRcKI"
```

### Republish to S3

```bash
yarn jwks publish \
  --bucket jwks.ozoneapi.io \
  --key dc-uat-01.jwks \
  --out-dir ./temp/dc-uat-01 \
  --force
```

## Commands

| Command | Description |
|---|---|
| `init` | Generate signing + encryption key pairs, create JWKS, publish to S3 |
| `publish` | Publish local JWKS to S3 (use `--force` to overwrite) |
| `add-key` | Generate a new key pair, add to local JWKS, publish |
| `remove-key` | Remove a key by `--kid`, delete local files, republish |
| `list` | List all keys in the local manifest |

## CLI Options

| Option | Alias | Required | Default | Description |
|---|---|---|---|---|
| `--bucket` | `-b` | Yes | — | S3 bucket name |
| `--key` | `-k` | Yes | — | S3 object key for the JWKS file |
| `--region` | `-r` | No | `eu-west-2` | AWS region |
| `--out-dir` | `-d` | Yes | — | Local directory for key material |
| `--kid` | — | No | auto-generated | Key ID |
| `--alg` | `-a` | No | `PS256` | Signing algorithm |
| `--key-size` | — | No | `2048` | RSA key size in bits |
| `--key-use` | `-u` | No | `sig` | Key use: `sig` or `enc` |
| `--force` | — | No | `false` | Force overwrite on S3 |

## Generated Files

After `init`, the `--out-dir` contains:

```
<out-dir>/
├── manifest.json                      # Local key inventory
├── jwks.json                          # Public JWKS (published to S3)
├── <kid>-sig-key.key                  # Signing private key (PEM)
├── <kid>-sig-key.pub                  # Signing public key (PEM)
├── <kid>-sig-key.jwk.json             # Signing private key (JWK)
├── <kid>-sig-pub-key.jwk.json         # Signing public key (JWK)
├── <kid>-enc-key.key                  # Encryption private key (PEM)
├── <kid>-enc-key.pub                  # Encryption public key (PEM)
├── <kid>-enc-key.jwk.json             # Encryption private key (JWK)
└── <kid>-enc-pub-key.jwk.json         # Encryption public key (JWK)
```

## Environment Variables

After `init`, create a `key-material.env` for use with examples and tests:

```bash
export JWKS_URL=https://<bucket>.s3.<region>.amazonaws.com/<key>
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

## Programmatic Usage

```typescript
import { JwksManager } from './JwksManager';

const manager = new JwksManager({
  bucket: 'jwks.ozoneapi.io',
  key: 'dc-uat-01.jwks',
  region: 'eu-west-2',
  outDir: './temp/dc-uat-01',
});

await manager.init({ alg: 'PS256', keySize: 2048, keyUse: 'sig' });
await manager.list();
await manager.addKey({ alg: 'PS256', keySize: 2048, keyUse: 'sig' });
await manager.removeKey({ kid: 'some-kid' });
await manager.publish({ force: true });
```

## Architecture

- **`cli.ts`** — yargs-based CLI entry point
- **`JwksManager.ts`** — Core logic for key generation, manifest management, and S3 publishing
- **`S3Client.ts`** — Lightweight S3 wrapper using `@aws-sdk/client-s3` (no full AWS SDK)

## See Also

- [cert-utils](../../cert-utils/README.md) — Bash scripts for X.509 certificate operations
- [JwtHelper](../../src/lib/JwtHelper.ts) — JWT sign/verify/encrypt/decrypt
- [JwksClient](../../src/lib/JwksClient.ts) — Fetch keys from remote JWKS endpoints
