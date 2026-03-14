# ozone-crypto

TypeScript library for JWT cryptographic operations — sign, verify, decode, encrypt, and decrypt JWTs/JWEs using symmetric, asymmetric, or `none` algorithms. Includes a JWKS client for fetching keys from remote endpoints.

## Prerequisites

- Node.js >= 18
- Yarn

## Installation

```bash
yarn install
```

## Build

```bash
yarn build
```

## Environment Variables

All examples and tests require key material provided via environment variables. A template is provided at `temp/dc-uat-01/key-material.env`.

### Signing

| Variable | Description |
|---|---|
| `SIGNING_KID` | Key ID for the signing key |
| `SIGNING_PRIVATE_KEY_PEM` | Path to PEM-encoded private key file |
| `SIGNING_PUBLIC_KEY_PEM` | Path to PEM-encoded public key file |
| `SIGNING_JWK` | Path to signing key in JWK JSON format |

### Encryption

| Variable | Description |
|---|---|
| `ENCRYPTION_KID` | Key ID for the encryption key |
| `ENCRYPTION_PRIVATE_KEY_PEM` | Path to PEM-encoded encryption private key file |
| `ENCRYPTION_PUBLIC_KEY_PEM` | Path to PEM-encoded encryption public key file |
| `ENCRYPTION_PUBLIC_JWK` | Path to encryption public key in JWK JSON format |
| `ENCRYPTION_PRIVATE_JWK` | Path to encryption private key in JWK JSON format |

### JWKS

| Variable | Description |
|---|---|
| `JWKS_URL` | URL to a remote JWKS endpoint |

### Using a `.env` / shell file

Source the key material before running examples or tests:

```bash
source /usr/o3/ozone-crypto/temp/dc-uat-01/key-material.env
```

Or create your own `.env` file at the project root:

```dotenv
# .env (do NOT commit this file)
SIGNING_KID=ozPOzyXOh6ibr7X5C898lZJdjnEWv5uF9az6eXBRcKI
SIGNING_PRIVATE_KEY_PEM=/path/to/signing-key.key
SIGNING_PUBLIC_KEY_PEM=/path/to/signing-key.pub
SIGNING_JWK=/path/to/signing-key.jwk.json
ENCRYPTION_KID=ljiiCDQ6D0QUw-8JQoqJ7wc7VQv0kBvUC9guCme1KMM
ENCRYPTION_PRIVATE_KEY_PEM=/path/to/encryption-key.key
ENCRYPTION_PUBLIC_KEY_PEM=/path/to/encryption-key.pub
ENCRYPTION_PUBLIC_JWK=/path/to/encryption-pub-key.jwk.json
ENCRYPTION_PRIVATE_JWK=/path/to/encryption-pvt-key.jwk.json
JWKS_URL=https://example.com/jwks
```

> **Tip:** Generate an RSA key pair for testing:
> ```bash
> openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
> openssl pkey -in private.pem -pubout -out public.pem
> ```

## Running Examples

Source the environment first, then use `yarn ts`:

```bash
source temp/dc-uat-01/key-material.env

# Signing & verification
yarn ts src/examples/signAndVerifyAsymmetric.ts
yarn ts src/examples/signAndVerifySymmetric.ts
yarn ts src/examples/signAndVerifyNone.ts

# Encryption & decryption
yarn ts src/examples/encryptDecryptString.ts
yarn ts src/examples/encryptDecryptJson.ts

# Nested structures
yarn ts src/examples/jwsInsideJwe.ts
yarn ts src/examples/jweInsideJws.ts

# JWKS client
yarn ts src/examples/jwksClientExample.ts
```

## Running Tests

```bash
source temp/dc-uat-01/key-material.env

# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage
```

## Project Structure

```
src/
├── lib/
│   ├── JwtHelper.ts       # Core JWT sign/verify/encrypt/decrypt logic
│   ├── JwtTypes.ts         # Type definitions
│   └── JwksClient.ts       # JWKS remote key fetching
├── examples/
│   ├── signAndVerifyAsymmetric.ts   # Sign & verify with PS256
│   ├── signAndVerifySymmetric.ts    # Sign & verify with HS256
│   ├── signAndVerifyNone.ts         # Sign & verify with alg none
│   ├── encryptDecryptString.ts      # Encrypt & decrypt a plain string
│   ├── encryptDecryptJson.ts        # Encrypt & decrypt a JSON object
│   ├── jwsInsideJwe.ts             # Nested: JWS wrapped in JWE
│   ├── jweInsideJws.ts             # Nested: JWE as a claim inside JWS
│   └── jwksClientExample.ts        # Fetch keys from JWKS endpoint
tests/
├── JwtHelper.test.ts       # JwtHelper test suite
└── JwksClient.test.ts       # JwksClient test suite
temp/
└── dc-uat-01/
    └── key-material.env     # Environment variable template for key material
```

## License

See [LICENSE](./LICENSE).