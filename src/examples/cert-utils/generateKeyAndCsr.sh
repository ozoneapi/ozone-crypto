#!/bin/bash
#
# Example: Generate a private key and a CSR using cert-utils scripts.
#
# Prerequisites:
#   - cert-utils scripts must be executable: chmod +x ../../cert-utils/*.sh
#
# Usage:
#   bash generateKeyAndCsr.sh

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly CERT_UTILS="${SCRIPT_DIR}/../../../cert-utils"
readonly OUT_DIR="${SCRIPT_DIR}/../../../temp/cert-examples"

echo "=== Generate Key and CSR Example ==="
echo ""

# Step 1: Generate a private key
echo "Step 1: Generating private key..."
bash "${CERT_UTILS}/generate-key.sh" --key "${OUT_DIR}/example-service.key"

# Step 2: Generate a CSR
echo ""
echo "Step 2: Generating CSR..."
bash "${CERT_UTILS}/generate-csr.sh" \
  --key "${OUT_DIR}/example-service.key" \
  --csr "${OUT_DIR}/example-service.csr" \
  --subject "/CN=example-service.ozone.local/O=Ozone Financial Technology/C=GB"

echo ""
echo "=== Files generated ==="
echo "  Key: ${OUT_DIR}/example-service.key"
echo "  CSR: ${OUT_DIR}/example-service.csr"
echo ""
echo "Inspect the CSR:"
echo "  openssl req -in ${OUT_DIR}/example-service.csr -noout -text"
