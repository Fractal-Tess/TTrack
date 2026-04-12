#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Building codex-ttrack..."
cd "${SCRIPT_DIR}"
bun run build

echo
echo "For global install, run one of:"
echo "  bun install -g ${SCRIPT_DIR}"
echo "  npm install -g ${SCRIPT_DIR}"
echo
echo "Then configure and enable the Codex hook:"
echo "  codex-ttrack configure"
echo "  codex-ttrack setup"
