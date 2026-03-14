# JWT Helper Examples

This directory contains examples demonstrating how to use the `JwtHelper` class for signing and verifying JWTs with PS256 algorithm.

## Environment Variables

All examples require specific environment variables for key material:

- `JWKS_URL`: URL to the JWKS endpoint (for JWKS-based verification)
- `SIGNING_PRIVATE_KEY_PEM`: Full file path to the private key PEM file (for signing)
- `SIGNING_PUBLIC_KEY_PEM`: Full file path to the public key PEM file (for verification)
- `SIGNING_JWK`: Full file path to the JWK JSON file (for signing/verification with JWK)

## Examples

Usage examples for `ozone-crypto` JWT and JWE operations.

### Signing Examples

1. **sign-with-pem-file.ts** - Sign a JWT using a private key from a PEM file
   - Uses: `SIGNING_PRIVATE_KEY_PEM`
   - Creates a basic JWT with standard claims

2. **sign-with-jwk-file.ts** - Sign a JWT using a JWK from a file
   - Uses: `SIGNING_JWK`
   - Demonstrates JWK-based signing

3. **sign-with-pem-string.ts** - Sign a JWT by reading PEM key as a string
   - Uses: `SIGNING_PRIVATE_KEY_PEM`
   - Shows how to pass key content directly

4. **sign-with-custom-headers.ts** - Sign a JWT with custom headers and claims
   - Uses: `SIGNING_PRIVATE_KEY_PEM`
   - Demonstrates custom headers, critical headers, and complex claims

### Verification Examples

1. **verify-with-pem-file.ts** - Verify a JWT using a public key from a PEM file
   - Uses: `SIGNING_PUBLIC_KEY_PEM`
   - Basic verification with standard checks

2. **verify-with-jwk-file.ts** - Verify a JWT using a JWK from a file
   - Uses: `SIGNING_JWK`
   - Demonstrates JWK-based verification

3. **verify-with-jwks-url.ts** - Verify a JWT using a JWKS URL
   - Uses: `JWKS_URL`
   - Demonstrates remote JWKS verification

4. **verify-with-pem-string.ts** - Verify a JWT using public key as string
   - Uses: `SIGNING_PUBLIC_KEY_PEM`
   - Shows how to pass key content directly

5. **verify-with-extended-validation.ts** - Verify with comprehensive validation rules
   - Uses: `SIGNING_PUBLIC_KEY_PEM`
   - Demonstrates all verification options

### Complete Workflow

1. **sign-and-verify-complete.ts** - Complete sign and verify workflow
   - Uses: `SIGNING_PRIVATE_KEY_PEM`, `SIGNING_PUBLIC_KEY_PEM`
   - Demonstrates full cycle of JWT creation and validation

## Running Examples

### Setup

1. Set required environment variables:
```bash
export SIGNING_PRIVATE_KEY_PEM=/path/to/private-key.pem
export SIGNING_PUBLIC_KEY_PEM=/path/to/public-key.pem
export SIGNING_JWK=/path/to/key.jwk.json
export JWKS_URL=https://example.com/jwks
```

2. Build the project:
```bash
yarn build
```

### Run Signing Examples

```bash
# Using PEM file
ts-node src/examples/sign-with-pem-file.ts

# Using JWK file
ts-node src/examples/sign-with-jwk-file.ts

# Using PEM string
ts-node src/examples/sign-with-pem-string.ts

# With custom headers
ts-node src/examples/sign-with-custom-headers.ts
```

### Run Verification Examples

```bash
# Using PEM file
ts-node src/examples/verify-with-pem-file.ts "eyJhbGc..."

# Using JWK file
ts-node src/examples/verify-with-jwk-file.ts "eyJhbGc..."

# Using JWKS URL
ts-node src/examples/verify-with-jwks-url.ts "eyJhbGc..."

# Using PEM string
ts-node src/examples/verify-with-pem-string.ts "eyJhbGc..."

# With extended validation
ts-node src/examples/verify-with-extended-validation.ts "eyJhbGc..."
```

### Run Complete Workflow

```bash
ts-node src/examples/sign-and-verify-complete.ts
```

## Notes

- All examples use PS256 algorithm (RSA-PSS with SHA-256)
- Verification examples require a JWT token as a command-line argument
- All examples include proper error handling and validation
- Key files must exist and be readable by the process

## Example Descriptions

### `signAndVerifyAsymmetric.ts`

Demonstrates signing a JWT with a PS256 private key and verifying with the corresponding public key. Validates headers (`kid`, `typ`), required claims (`sub`, `iss`, `aud`, `exp`, `iat`, `nbf`, `jti`), audience matching, and time-based checks.

### `signAndVerifySymmetric.ts`

Demonstrates signing and verifying a JWT using a shared HMAC secret (HS256). Uses `SIGNING_KID` from env for the `kid` header.

### `signAndVerifyNone.ts`

Demonstrates creating and verifying an unsigned JWT (alg: none). Useful for testing or internal trust scenarios where signature verification is not required.

### `encryptDecryptString.ts`

Encrypts a simple lorem ipsum string using RSA-OAEP + A256GCM, then decrypts it back and verifies the round-trip.

### `encryptDecryptJson.ts`

Serialises a JSON object to a string, encrypts it into a JWE, decrypts, and hydrates the JSON object back. Verifies the round-trip produces an identical object.

### `jwsInsideJwe.ts` — Nested JWT (JWS wrapped in JWE)

A common pattern in Open Finance: a signed JWT is encrypted for transport.

**Assemble:** Sign a JWT (PS256) → Encrypt into JWE (RSA-OAEP + A256GCM)

**Disassemble:** Decrypt JWE → Recover inner JWS → Verify signature and validate claims

### `jweInsideJws.ts` — Encrypted data claim inside a JWS

Demonstrates carrying encrypted sensitive data as a claim within a signed token.

**Assemble:**
1. Start with a sensitive JSON object (e.g. account details)
2. Serialise and encrypt into a JWE
3. Place the JWE string as the `data` claim in a JWT body
4. Sign the outer JWT

**Disassemble:**
1. Verify the outer JWS signature and validate claims
2. Extract the `data` claim (a JWE string)
3. Decrypt the JWE
4. Hydrate the inner JSON object

### `jwksClientExample.ts`

Fetches signing (`use=sig`) and encryption (`use=enc`) public keys from a remote JWKS endpoint. Useful for discovering keys for verification or encryption without pre-sharing key material.
