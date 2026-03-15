#!/bin/bash
#
# Example: Full pipeline — CA, signing key, encryption key, issue both certs.
#
# Demonstrates a realistic setup where a deployment context needs:
#   - A CA certificate
#   - A signing certificate (for JWS)
#   - An encryption certificate (for JWE)
#
# Usage:
#   bash fullPipelineExample.sh

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly CERT_UTILS="${SCRIPT_DIR}/../../../cert-utils"
readonly CONTEXT_NAME="dc-example-01"
readonly OUT_DIR="${SCRIPT_DIR}/../../../temp/${CONTEXT_NAME}"

mkdir -p "${OUT_DIR}"

echo "=== Full Pipeline Example (${CONTEXT_NAME}) ==="
echo ""

# --- CA ---
echo "--- Generating CA ---"
bash "${CERT_UTILS}/generate-ca.sh" \
  --key "${OUT_DIR}/ca.key" \
  --pem "${OUT_DIR}/ca.pem" \
  --subject "/CN=${CONTEXT_NAME} CA/O=Ozone Financial Technology/C=GB"

# --- Signing Key + Cert ---
echo ""
echo "--- Generating Signing Key + Certificate ---"
bash "${CERT_UTILS}/generate-key.sh" --key "${OUT_DIR}/signing.key"
bash "${CERT_UTILS}/generate-csr.sh" \
  --key "${OUT_DIR}/signing.key" \
  --csr "${OUT_DIR}/signing.csr" \
  --subject "/CN=${CONTEXT_NAME}-signing/O=Ozone Financial Technology/C=GB"
bash "${CERT_UTILS}/issue-cert.sh" \
  --csr "${OUT_DIR}/signing.csr" \
  --pem "${OUT_DIR}/signing.pem" \
  --ca-pem "${OUT_DIR}/ca.pem" \
  --ca-key "${OUT_DIR}/ca.key"

# --- Encryption Key + Cert ---
echo ""
echo "--- Generating Encryption Key + Certificate ---"
bash "${CERT_UTILS}/generate-key.sh" --key "${OUT_DIR}/encryption.key"
bash "${CERT_UTILS}/generate-csr.sh" \
  --key "${OUT_DIR}/encryption.key" \
  --csr "${OUT_DIR}/encryption.csr" \
  --subject "/CN=${CONTEXT_NAME}-encryption/O=Ozone Financial Technology/C=GB"
bash "${CERT_UTILS}/issue-cert.sh" \
  --csr "${OUT_DIR}/encryption.csr" \
  --pem "${OUT_DIR}/encryption.pem" \
  --ca-pem "${OUT_DIR}/ca.pem" \
  --ca-key "${OUT_DIR}/ca.key"

echo ""
echo "=== Pipeline Complete ==="
echo ""
echo "Generated files in ${OUT_DIR}/:"
ls -la "${OUT_DIR}/"
echo ""
echo "Verify signing cert:    openssl verify -CAfile ${OUT_DIR}/ca.pem ${OUT_DIR}/signing.pem"
echo "Verify encryption cert: openssl verify -CAfile ${OUT_DIR}/ca.pem ${OUT_DIR}/encryption.pem"
