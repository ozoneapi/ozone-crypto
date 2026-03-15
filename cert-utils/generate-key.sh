#!/bin/bash
#
# generate-key.sh — Generate an RSA 2048-bit private key.
#
# Usage:
#   generate-key.sh --key <path>
#
# Arguments:
#   --key  Full path for the generated private key file
#
# Examples:
#   generate-key.sh --key /tmp/certs/my-service.key

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly SCRIPT_NAME="$(basename "$0")"
readonly KEY_BITS=2048

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

usage() {
  cat <<EOF
Usage: ${SCRIPT_NAME} --key <path>

Arguments:
  --key  Full path for the generated private key file

Examples:
  ${SCRIPT_NAME} --key /tmp/certs/my-service.key
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

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --key)
        KEY="${2:-}"
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
}

generate_key() {
  local key_path="$1"
  local key_dir

  key_dir="$(dirname "${key_path}")"
  mkdir -p "${key_dir}"

  log "Generating ${KEY_BITS}-bit RSA private key: ${key_path}"

  openssl genrsa -out "${key_path}" "${KEY_BITS}"

  log "Key generated: ${key_path}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  parse_args "$@"

  if [[ -f "${KEY}" ]]; then
    log "Key file already exists — skipping: ${KEY}"
    exit 0
  fi

  generate_key "${KEY}"
}

main "$@"
