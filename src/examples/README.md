# Examples

Usage examples for `ozone-crypto` — JWT operations, certificate utilities, and JWKS management.

## Prerequisites

Source the key material environment variables before running JWT examples:

```bash
export SIGNING_PRIVATE_KEY_PEM=/path/to/private-key.pem
export SIGNING_PUBLIC_KEY_PEM=/path/to/public-key.pem
export SIGNING_JWK=/path/to/key.jwk.json
export JWKS_URL=https://example.com/jwks
```

## JWT Helper Examples

Located in [`jwt-helper/`](./jwt-helper/).

```bash
# Signing & verification
yarn ts src/examples/jwt-helper/signAndVerifyAsymmetric.ts
yarn ts src/examples/jwt-helper/signAndVerifySymmetric.ts
yarn ts src/examples/jwt-helper/signAndVerifyNone.ts

# Encryption & decryption
yarn ts src/examples/jwt-helper/encryptDecryptString.ts
yarn ts src/examples/jwt-helper/encryptDecryptJson.ts

# Nested structures
yarn ts src/examples/jwt-helper/jwsInsideJwe.ts
yarn ts src/examples/jwt-helper/jweInsideJws.ts

# JWKS client
yarn ts src/examples/jwt-helper/jwksClientExample.ts
```

See [jwt-helper/README.md](./jwt-helper/README.md) for details.

## Certificate Utilities Examples

Located in [`cert-utils/`](./cert-utils/). These are bash scripts that demonstrate the tools in `/ozone-crypto/cert-utils/`.

```bash
# Generate a key and CSR
bash src/examples/cert-utils/generateKeyAndCsr.sh

# Generate a CA and issue a certificate
bash src/examples/cert-utils/generateCaAndIssueCert.sh

# Full pipeline: CA + signing cert + encryption cert
bash src/examples/cert-utils/fullPipelineExample.sh
```

See [cert-utils/README.md](./cert-utils/README.md) for details.

## JWKS Manager

The S3 JWKS Manager has its own CLI. See [s3-jwks/README.md](../s3-jwks/README.md).

```bash
# Initialize JWKS material locally for a given tenant and region
yarn jwks init --tenant dc-uat-01 --region eu-west-2 --out-dir ./temp/dc-uat-01
```
