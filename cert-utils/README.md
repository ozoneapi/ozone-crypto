# cert-utils

Bash scripts for generating RSA keys, CSRs, CA certificates, and issuing X.509 certificates. All scripts use named parameters for clarity.

## Scripts

| Script | Purpose |
|---|---|
| `generate-key.sh` | Generate an RSA 2048-bit private key |
| `generate-csr.sh` | Generate a Certificate Signing Request |
| `generate-ca.sh` | Generate a self-signed CA certificate (4096-bit key) |
| `issue-cert.sh` | Issue a certificate signed by a CA |

## Usage

### generate-key.sh

```bash
bash generate-key.sh --key <path>
```

| Parameter | Required | Description |
|---|---|---|
| `--key` | Yes | Path for the generated private key file |

```bash
bash generate-key.sh --key ./temp/my-service.key
```

### generate-csr.sh

```bash
bash generate-csr.sh --key <path> --csr <path> --subject <subject>
```

| Parameter | Required | Description |
|---|---|---|
| `--key` | Yes | Path to the private key file |
| `--csr` | Yes | Path for the generated CSR file |
| `--subject` | Yes | Certificate subject (e.g. `"/CN=example.com/O=Acme"`) |

```bash
bash generate-csr.sh \
  --key ./temp/my-service.key \
  --csr ./temp/my-service.csr \
  --subject "/CN=my-service.example.com/O=Ozone Financial Technology/C=GB"
```

### generate-ca.sh

```bash
bash generate-ca.sh --key <path> --pem <path> --subject <subject> [--days <days>]
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `--key` | Yes | — | Path for the CA private key |
| `--pem` | Yes | — | Path for the CA certificate |
| `--subject` | Yes | — | CA subject string |
| `--days` | No | `3650` | Validity period in days |

```bash
bash generate-ca.sh \
  --key ./temp/ca.key \
  --pem ./temp/ca.pem \
  --subject "/CN=My CA/O=Ozone Financial Technology/C=GB" \
  --days 3650
```

### issue-cert.sh

```bash
bash issue-cert.sh --csr <path> --pem <path> --ca-pem <path> --ca-key <path> [--csr-config <folder>]
```

| Parameter | Required | Description |
|---|---|---|
| `--csr` | Yes | Path to the CSR file |
| `--pem` | Yes | Path for the generated certificate |
| `--ca-pem` | Yes | Path to the CA certificate |
| `--ca-key` | Yes | Path to the CA private key |
| `--csr-config` | No | Folder containing `csr_config.cnf` for SANs |

```bash
bash issue-cert.sh \
  --csr ./temp/my-service.csr \
  --pem ./temp/my-service.pem \
  --ca-pem ./temp/ca.pem \
  --ca-key ./temp/ca.key
```

## Typical Workflow

```bash
# 1. Create a CA (once)
bash generate-ca.sh --key ca.key --pem ca.pem --subject "/CN=My CA"

# 2. Generate a service key
bash generate-key.sh --key service.key

# 3. Generate a CSR
bash generate-csr.sh --key service.key --csr service.csr --subject "/CN=my-service"

# 4. Issue a certificate signed by the CA
bash issue-cert.sh --csr service.csr --pem service.pem --ca-pem ca.pem --ca-key ca.key

# 5. Verify
openssl verify -CAfile ca.pem service.pem
```

## Behaviour

- All scripts use `set -euo pipefail` for strict error handling.
- All scripts skip generation if the output file already exists (idempotent).
- `issue-cert.sh` appends the CA certificate to the PEM file to create a full chain.
- `generate-ca.sh` uses a 4096-bit RSA key; `generate-key.sh` uses 2048-bit.

## See Also

- [Examples](../src/examples/cert-utils/) — runnable example scripts
- [JwksManager](../src/s3-jwks/README.md) — generate JWK key pairs and publish JWKS to S3
