#!/bin/bash
#
# Example: Generate a CA, then issue a certificate signed by that CA.
#
# This is a complete end-to-end example:
#   1. Generate a self-signed CA
#   2. Generate a service private key
#   3. Generate a CSR for the service
#   4. Issue a certificate signed by the CA
#
# Usage:
#   bash generateCaAndIssueCert.sh

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly CERT_UTILS="${SCRIPT_DIR}/../../../cert-utils"
readonly OUT_DIR="${SCRIPT_DIR}/../../../temp/cert-examples/ca-issue"

mkdir -p "${OUT_DIR}"

echo "=== CA + Certificate Issuance Example ==="
echo ""

# Step 1: Generate a CA
echo "Step 1: Generating CA..."
bash "${CERT_UTILS}/generate-ca.sh" \
  --key "${OUT_DIR}/my-ca.key" \
  --pem "${OUT_DIR}/my-ca.pem" \
  --subject "/CN=Example CA/O=Ozone Financial Technology/C=GB" \
  --days 3650

# Step 2: Generate a service key
echo ""
echo "Step 2: Generating service private key..."
bash "${CERT_UTILS}/generate-key.sh" --key "${OUT_DIR}/my-service.key"

# Step 3: Generate a CSR
echo ""
echo "Step 3: Generating CSR..."
bash "${CERT_UTILS}/generate-csr.sh" \
  --key "${OUT_DIR}/my-service.key" \
  --csr "${OUT_DIR}/my-service.csr" \
  --subject "/CN=my-service.ozone.local/O=Ozone Financial Technology/C=GB"

# Step 4: Issue certificate
echo ""
echo "Step 4: Issuing certificate signed by CA..."
bash "${CERT_UTILS}/issue-cert.sh" \
  --csr "${OUT_DIR}/my-service.csr" \
  --pem "${OUT_DIR}/my-service.pem" \
  --ca-pem "${OUT_DIR}/my-ca.pem" \
  --ca-key "${OUT_DIR}/my-ca.key"

echo ""
echo "=== Files generated ==="
echo "  CA Key:          ${OUT_DIR}/my-ca.key"
echo "  CA Certificate:  ${OUT_DIR}/my-ca.pem"
echo "  Service Key:     ${OUT_DIR}/my-service.key"
echo "  Service CSR:     ${OUT_DIR}/my-service.csr"
echo "  Service Cert:    ${OUT_DIR}/my-service.pem"
echo ""
echo "Verify the certificate chain:"
echo "  openssl verify -CAfile ${OUT_DIR}/my-ca.pem ${OUT_DIR}/my-service.pem"
echo ""
echo "Inspect the certificate:"
echo "  openssl x509 -in ${OUT_DIR}/my-service.pem -noout -text"
