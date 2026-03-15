# Certificate Utilities Examples

Examples demonstrating the bash scripts in `ozone-crypto/cert-utils/` for generating keys, CSRs, CAs, and issuing certificates.

## Scripts

| Example | Description |
|---|---|
| `generateKeyAndCsr.sh` | Generate a private key and CSR |
| `generateCaAndIssueCert.sh` | Generate a CA, then issue a certificate signed by it |
| `fullPipelineExample.sh` | Full pipeline: CA + signing key/cert + encryption key/cert |

## Running

```bash
cd /usr/o3/ozone-crypto

# Simple key + CSR generation
bash src/examples/cert-utils/generateKeyAndCsr.sh

# CA creation and certificate issuance
bash src/examples/cert-utils/generateCaAndIssueCert.sh

# Full pipeline (signing + encryption certs)
bash src/examples/cert-utils/fullPipelineExample.sh
```

Output files are written to `temp/cert-examples/` or `temp/dc-example-01/`.
