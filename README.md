# ozone-crypto

TypeScript library and bash tooling for cryptographic operations — JWT sign/verify/encrypt/decrypt, X.509 certificate generation, and JWKS management with S3 publishing.

## Prerequisites

- Node.js >= 18
- Yarn
- OpenSSL (for cert-utils)
- AWS credentials (for S3 JWKS publishing)

## Installation

```bash
yarn install
```

## Build

```bash
yarn build
```

## Components

### 1. JWT Helper (`src/lib/JwtHelper.ts`)

Sign, verify, encrypt, and decrypt JWTs/JWEs using symmetric, asymmetric, or `none` algorithms.

```bash
source temp/dc-uat-01/key-material.env
yarn ts src/examples/jwt-helper/signAndVerifyAsymmetric.ts
yarn ts src/examples/jwt-helper/encryptDecryptString.ts
yarn ts src/examples/jwt-helper/jwsInsideJwe.ts
```

### 2. JWKS Client (`src/lib/JwksClient.ts`)

Fetch public keys from remote JWKS endpoints, filtered by `use` and `kid`.

```bash
source temp/dc-uat-01/key-material.env
yarn ts src/examples/jwt-helper/jwksClientExample.ts
```

### 3. Certificate Utilities (`cert-utils/`)

Bash scripts for generating RSA keys, CSRs, CAs, and issuing X.509 certificates.

```bash
bash cert-utils/generate-ca.sh --key temp/ca.key --pem temp/ca.pem --subject "/CN=My CA"
bash cert-utils/generate-key.sh --key temp/svc.key
bash cert-utils/generate-csr.sh --key temp/svc.key --csr temp/svc.csr --subject "/CN=my-service"
bash cert-utils/issue-cert.sh --csr temp/svc.csr --pem temp/svc.pem --ca-pem temp/ca.pem --ca-key temp/ca.key
```

See [cert-utils/README.md](cert-utils/README.md) for full documentation.

### 4. S3 JWKS Manager (`src/utils/s3-jwks/`)

CLI for generating JWK key pairs and managing JWKS for S3 publishing (currently only the `init` command is implemented).

```bash
yarn jwks init --tenant dc-uat-01 --bucket my-jwks-bucket --out-dir temp/dc-uat-01/jwks --region eu-west-1
```

See [src/utils/s3-jwks/README.md](src/utils/s3-jwks/README.md) for full documentation.

## Environment Variables

All JWT examples and tests require key material provided via environment variables:

| Variable | Description |
|---|---|
| `SIGNING_KID` | Key ID for the signing key |
| `SIGNING_PRIVATE_KEY_PEM` | Path to signing private key (PEM) |
| `SIGNING_PUBLIC_KEY_PEM` | Path to signing public key (PEM) |
| `SIGNING_JWK` | Path to signing key (JWK JSON) |
| `ENCRYPTION_KID` | Key ID for the encryption key |
| `ENCRYPTION_PRIVATE_KEY_PEM` | Path to encryption private key (PEM) |
| `ENCRYPTION_PUBLIC_KEY_PEM` | Path to encryption public key (PEM) |
| `ENCRYPTION_PUBLIC_JWK` | Path to encryption public key (JWK JSON) |
| `ENCRYPTION_PRIVATE_JWK` | Path to encryption private key (JWK JSON) |
| `JWKS_URL` | URL to a remote JWKS endpoint |

Source a template:

```bash
source temp/dc-uat-01/key-material.env
```

## Running Tests

```bash
source temp/dc-uat-01/key-material.env
yarn test
yarn test:coverage
```

## Project Structure

```
ozone-crypto/
├── cert-utils/                        # Bash scripts for X.509 operations
│   ├── generate-key.sh
│   ├── generate-csr.sh
│   ├── generate-ca.sh
│   ├── issue-cert.sh
│   └── README.md
├── src/
│   ├── lib/
│   │   ├── JwtHelper.ts              # JWT sign/verify/encrypt/decrypt
│   │   ├── JwtTypes.ts               # Type definitions
│   │   └── JwksClient.ts             # Remote JWKS key fetching
│   ├── utils/
│   │   └── s3-jwks/
│   │       ├── cli.ts                # JWKS Manager CLI entry point
│   │       ├── JwksManager.ts        # Key generation + S3 publishing
│   │       ├── S3Client.ts           # Lightweight S3 wrapper
│   │       └── README.md
│   ├── s3-jwks/
│   │   └── README.md                 # Documentation entry point
│   └── examples/
│       ├── jwt-helper/               # JWT signing/verification/encryption examples
│       ├── cert-utils/               # Certificate generation examples
│       └── README.md
├── tests/
│   ├── JwtHelper.test.ts
│   └── JwksClient.test.ts
└── temp/                              # Generated key material (gitignored)
```

## License

See [LICENSE](./LICENSE).