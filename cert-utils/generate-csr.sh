#!/bin/bash
#
# generate-csr.sh — Generate a Certificate Signing Request (CSR).
#
# Usage:
#   generate-csr.sh --key <path> --csr <path> --subject <subject>
#
# Arguments:
#   --key      Path to the private key file
#   --csr      Path for the generated CSR file
#   --subject  Certificate subject string (e.g. "/CN=example.com/O=Acme")
#
# Examples:
#   generate-csr.sh --key /tmp/certs/my-service.key --csr /tmp/certs/my-service.csr --subject "/CN=my-service.example.com/O=Ozone"

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly SCRIPT_NAME="$(basename "$0")"

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

usage() {
  cat <<EOF
Usage: ${SCRIPT_NAME} --key <path> --csr <path> --subject <subject>

Arguments:
  --key      Path to the private key file
  --csr      Path for the generated CSR file
  --subject  Certificate subject string

Examples:
  ${SCRIPT_NAME} --key /tmp/certs/my-service.key --csr /tmp/certs/my-service.csr --subject "/CN=my-service.example.com/O=Ozone"
EOF
}

log() {
  echo "[${SCRIPT_NAME}] $*"
}

err() {
  echo "[${SCRIPT_NAME}] ERROR: $*" >&2
}

parse_args() {
  KEY=""
  CSR=""
  SUBJECT=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --key)
        KEY="${2:-}"
        shift 2
        ;;
      --csr)
        CSR="${2:-}"
        shift 2
        ;;
      --subject)
        SUBJECT="${2:-}"
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

  if [[ -z "${KEY}" ]]; then
    err "--key is required"
    usage
    exit 1
  fi

  if [[ -z "${CSR}" ]]; then
    err "--csr is required"
    usage
    exit 1
  fi

  if [[ -z "${SUBJECT}" ]]; then
    err "--subject is required"
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

generate_csr() {
  local key_file="$1"
  local csr_file="$2"
  local subject="$3"

  log "Generating CSR: ${csr_file}"
  log "Subject: ${subject}"

  openssl req -new \
    -key "${key_file}" \
    -out "${csr_file}" \
    -subj "${subject}"

  log "CSR generated: ${csr_file}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  parse_args "$@"

  if [[ -f "${CSR}" ]]; then
    log "CSR file already exists — skipping: ${CSR}"
    exit 0
  fi

  validate_file_exists "${KEY}" "Private key file"

  generate_csr "${KEY}" "${CSR}" "${SUBJECT}"
}

main "$@"
