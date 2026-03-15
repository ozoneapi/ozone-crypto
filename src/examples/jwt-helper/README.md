# JWT Helper Examples

Usage examples for JWT signing, verification, encryption, decryption, and JWKS operations.

## Prerequisites

Source the key material environment variables:

```bash
source /usr/o3/ozone-crypto/temp/dc-uat-01/key-material.env
```

## Examples

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

See the [main examples README](../README.md) for full documentation.
