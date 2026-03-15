#!/bin/bash
#
# issue-cert.sh — Issue an X.509 certificate signed by a CA.
#
# Usage:
#   issue-cert.sh --csr <path> --pem <path> --ca-pem <path> --ca-key <path> [--csr-config <folder>]
#
# Arguments:
#   --csr         Path to the CSR file
#   --pem         Path for the generated PEM certificate file
#   --ca-pem      Path to the CA certificate (PEM)
#   --ca-key      Path to the CA private key
#   --csr-config  Optional path to folder containing csr_config.cnf for SANs
#
# Examples:
#   issue-cert.sh --csr /tmp/certs/svc.csr --pem /tmp/certs/svc.pem --ca-pem /tmp/ca/ca.pem --ca-key /tmp/ca/ca.key
#   issue-cert.sh --csr /tmp/certs/svc.csr --pem /tmp/certs/svc.pem --ca-pem /tmp/ca/ca.pem --ca-key /tmp/ca/ca.key --csr-config /tmp/configs

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly SCRIPT_NAME="$(basename "$0")"
readonly DAYS_WITHOUT_SAN=500
readonly DAYS_WITH_SAN=1000

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

usage() {
  cat <<EOF
Usage: ${SCRIPT_NAME} --csr <path> --pem <path> --ca-pem <path> --ca-key <path> [--csr-config <folder>]

Arguments:
  --csr         Path to the CSR file
  --pem         Path for the generated PEM certificate file
  --ca-pem      Path to the CA certificate (PEM)
  --ca-key      Path to the CA private key
  --csr-config  Optional folder containing csr_config.cnf (enables SANs)

Examples:
  ${SCRIPT_NAME} --csr svc.csr --pem svc.pem --ca-pem ca.pem --ca-key ca.key
  ${SCRIPT_NAME} --csr svc.csr --pem svc.pem --ca-pem ca.pem --ca-key ca.key --csr-config ./configs
EOF
}

log() {
  echo "[${SCRIPT_NAME}] $*"
}

err() {
  echo "[${SCRIPT_NAME}] ERROR: $*" >&2
}

parse_args() {
  CSR=""
  PEM=""
  CA_PEM=""
  CA_KEY=""
  CSR_CONFIG_FOLDER=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --csr)
        CSR="${2:-}"
        shift 2
        ;;
      --pem)
        PEM="${2:-}"
        shift 2
        ;;
      --ca-pem)
        CA_PEM="${2:-}"
        shift 2
        ;;
      --ca-key)
        CA_KEY="${2:-}"
        shift 2
        ;;
      --csr-config)
        CSR_CONFIG_FOLDER="${2:-}"
        shift 2
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        err "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
  done

  if [[ -z "${CSR}" ]]; then
    err "--csr is required"
    usage
    exit 1
  fi

  if [[ -z "${PEM}" ]]; then
    err "--pem is required"
    usage
    exit 1
  fi

  if [[ -z "${CA_PEM}" ]]; then
    err "--ca-pem is required"
    usage
    exit 1
  fi

  if [[ -z "${CA_KEY}" ]]; then
    err "--ca-key is required"
    usage
    exit 1
  fi
}

validate_file_exists() {
  local file="$1"
  local description="$2"

  if [[ ! -f "${file}" ]]; then
    err "${description} not found: ${file}"
    exit 1
  fi
}

issue_certificate_without_san() {
  local csr="$1"
  local pem="$2"

  log "Generating certificate without SAN (valid ${DAYS_WITHOUT_SAN} days)"

  openssl x509 -req \
    -in "${csr}" \
    -CA "${CA_PEM}" \
    -CAkey "${CA_KEY}" \
    -CAcreateserial \
    -out "${pem}" \
    -days "${DAYS_WITHOUT_SAN}" \
    -sha256 \
    -extensions v3_req
}

issue_certificate_with_san() {
  local csr="$1"
  local pem="$2"
  local csr_config="$3"

  log "Generating certificate with SAN (valid ${DAYS_WITH_SAN} days)"
  log "CSR config: ${csr_config}"

  openssl x509 -req \
    -in "${csr}" \
    -CA "${CA_PEM}" \
    -CAkey "${CA_KEY}" \
    -CAcreateserial \
    -out "${pem}" \
    -days "${DAYS_WITH_SAN}" \
    -sha256 \
    -extensions v3_req \
    -extfile "${csr_config}"
}

append_ca_to_pem() {
  local pem="$1"

  log "Appending CA certificate to ${pem}"
  cat "${CA_PEM}" >> "${pem}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  parse_args "$@"

  if [[ -f "${PEM}" ]]; then
    log "PEM file already exists — skipping: ${PEM}"
    exit 0
  fi

  validate_file_exists "${CSR}" "CSR file"
  validate_file_exists "${CA_PEM}" "CA certificate"
  validate_file_exists "${CA_KEY}" "CA private key"

  log "CSR:    ${CSR}"
  log "CA:     ${CA_PEM}"
  log "CA Key: ${CA_KEY}"
  log "PEM:    ${PEM}"

  if [[ -n "${CSR_CONFIG_FOLDER}" ]]; then
    local csr_config="${CSR_CONFIG_FOLDER}/csr_config.cnf"
    validate_file_exists "${csr_config}" "CSR config file"
    issue_certificate_with_san "${CSR}" "${PEM}" "${csr_config}"
  else
    log "No CSR config folder provided — certificate will not have SANs"
    issue_certificate_without_san "${CSR}" "${PEM}"
  fi

  log "Certificate generated: ${PEM}"
  append_ca_to_pem "${PEM}"
  log "Done"
}

main "$@"
