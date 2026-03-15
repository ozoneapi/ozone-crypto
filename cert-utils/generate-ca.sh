#!/bin/bash
#
# generate-ca.sh — Generate a self-signed Certificate Authority (CA) certificate.
#
# Usage:
#   generate-ca.sh --key <path> --pem <path> --subject <subject> [--days <days>]
#
# Arguments:
#   --key      Path for the generated CA private key file
#   --pem      Path for the generated CA certificate (PEM) file
#   --subject  Certificate subject string (e.g. "/CN=My CA/O=Acme/C=GB")
#   --days     Validity period in days (default: 3650)
#
# Examples:
#   generate-ca.sh --key /tmp/ca/ca.key --pem /tmp/ca/ca.pem --subject "/CN=Ozone CA/O=Ozone Financial Technology/C=GB"
#   generate-ca.sh --key /tmp/ca/ca.key --pem /tmp/ca/ca.pem --subject "/CN=Test CA" --days 365

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly SCRIPT_NAME="$(basename "$0")"
readonly KEY_BITS=4096
readonly DEFAULT_DAYS=3650

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

usage() {
  cat <<EOF
Usage: ${SCRIPT_NAME} --key <path> --pem <path> --subject <subject> [--days <days>]

Arguments:
  --key      Path for the generated CA private key file
  --pem      Path for the generated CA certificate (PEM) file
  --subject  Certificate subject string
  --days     Validity period in days (default: ${DEFAULT_DAYS})

Examples:
  ${SCRIPT_NAME} --key /tmp/ca/ca.key --pem /tmp/ca/ca.pem --subject "/CN=Ozone CA/O=Ozone Financial Technology/C=GB"
  ${SCRIPT_NAME} --key /tmp/ca/ca.key --pem /tmp/ca/ca.pem --subject "/CN=Test CA" --days 365
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
  PEM=""
  SUBJECT=""
  DAYS="${DEFAULT_DAYS}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --key)
        KEY="${2:-}"
        shift 2
        ;;
      --pem)
        PEM="${2:-}"
        shift 2
        ;;
      --subject)
        SUBJECT="${2:-}"
        shift 2
        ;;
      --days)
        DAYS="${2:-}"
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

  if [[ -z "${PEM}" ]]; then
    err "--pem is required"
    usage
    exit 1
  fi

  if [[ -z "${SUBJECT}" ]]; then
    err "--subject is required"
    usage
    exit 1
  fi

  if ! [[ "${DAYS}" =~ ^[0-9]+$ ]]; then
    err "--days must be a positive integer, got: ${DAYS}"
    exit 1
  fi
}

generate_ca() {
  local key_path="$1"
  local pem_path="$2"
  local subject="$3"
  local days="$4"

  local key_dir
  local pem_dir

  key_dir="$(dirname "${key_path}")"
  pem_dir="$(dirname "${pem_path}")"

  mkdir -p "${key_dir}" "${pem_dir}"

  log "Generating ${KEY_BITS}-bit CA private key: ${key_path}"
  openssl genrsa -out "${key_path}" "${KEY_BITS}"
  log "CA key generated: ${key_path}"

  log "Generating self-signed CA certificate: ${pem_path}"
  log "Subject: ${subject}"
  log "Validity: ${days} days"

  openssl req -x509 -new -nodes \
    -key "${key_path}" \
    -sha256 \
    -days "${days}" \
    -subj "${subject}" \
    -out "${pem_path}"

  log "CA certificate generated: ${pem_path}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  parse_args "$@"

  if [[ -f "${PEM}" ]]; then
    log "CA certificate already exists — skipping: ${PEM}"
    exit 0
  fi

  if [[ -f "${KEY}" ]]; then
    log "CA key already exists — skipping key generation: ${KEY}"
    log "Generating self-signed CA certificate only: ${PEM}"

    openssl req -x509 -new -nodes \
      -key "${KEY}" \
      -sha256 \
      -days "${DAYS}" \
      -subj "${SUBJECT}" \
      -out "${PEM}"

    log "CA certificate generated: ${PEM}"
  else
    generate_ca "${KEY}" "${PEM}" "${SUBJECT}" "${DAYS}"
  fi

  log "Done"
}

main "$@"
