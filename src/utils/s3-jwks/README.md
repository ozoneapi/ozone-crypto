# S3 JWKS Manager

CLI utility to generate, manage, and publish JWKS (JSON Web Key Sets) to AWS S3.

## Prerequisites

- Node.js >= 18
- AWS credentials configured (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, or AWS profile)
- `@aws-sdk/client-s3` (S3-only, no full AWS SDK)

## Installation

From the `ozone-crypto` root:

```bash
yarn install
```

## Usage

All commands require `--bucket`, `--tenant`, `--region` and `--out-dir`:

```bash
# Initialise a new JWKS (generates sig + enc key pairs, publishes to S3)
yarn run jwks init \
  --bucket jwks.ozoneapi.io \
  --tenant dc-uat-01.jwks \
  --region eu-west-2 \
  --out-dir ./temp/dc-uat-01 \
  --key-size 2048


## Commands

| Command | Description |
|---|---|
| `init` | Generate signing + encryption key pairs, create JWKS, publish to S3 |
| `publish` | Publish local JWKS to S3 (use `--force` to overwrite) |
| `add-key` | Generate a new key pair, add to local JWKS, publish |
| `remove-key` | Remove a key by `--kid`, delete local files, republish |
| `list` | List all keys in the local manifest |

## Options

| Option | Alias | Required | Default | Description |
|---|---|---|---|---|
| `--bucket` | `-b` | Yes | — | S3 bucket name |
| `--key` | `-k` | Yes | — | S3 object key for the JWKS file |
| `--region` | `-r` | Yes | — | AWS region |
| `--key-dir` | `-d` | Yes | — | Local directory for key material |
| `--kid` | — | No | auto-generated | Key ID |
| `--alg` | `-a` | No | `PS256` | Signing algorithm |
| `--key-size` | — | No | `2048` | RSA key size in bits |
| `--key-use` | `-u` | No | `sig` | Key use: `sig` or `enc` |
| `--force` | — | No | `false` | Force overwrite on S3 |

## Generated Files

After `init`, the `--key-dir` will contain:

```
<key-dir>/
├── manifest.json                    # Local key inventory
├── jwks.json                        # Public JWKS (what gets published)
├── <kid>-sig-key.key                # Signing private key (PEM)
├── <kid>-sig-key.pub                # Signing public key (PEM)
├── <kid>-sig-key.jwk.json           # Signing private key (JWK)
├── <kid>-sig-pub-key.jwk.json       # Signing public key (JWK)
├── <kid>-enc-key.key                # Encryption private key (PEM)
├── <kid>-enc-key.pub                # Encryption public key (PEM)
├── <kid>-enc-key.jwk.json           # Encryption private key (JWK)
└── <kid>-enc-pub-key.jwk.json       # Encryption public key (JWK)
```

## Environment Variables for key-material.env

After `init`, generate a `key-material.env` from the manifest:

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
