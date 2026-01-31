#!/bin/bash

# TTrack OpenCode Plugin Global Installation Script
# This script installs the TTrack plugin globally for OpenCode

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="opencode-ttrack-plugin"
GLOBAL_OPENCODE_DIR="${HOME}/.config/opencode"
PLUGINS_DIR="${GLOBAL_OPENCODE_DIR}/plugins"

echo "Installing TTrack OpenCode Plugin globally..."

# Create directories
mkdir -p "${PLUGINS_DIR}"

# Copy the built plugin
cp "${SCRIPT_DIR}/dist/index.js" "${PLUGINS_DIR}/${PLUGIN_NAME}.js"

# Create package.json for dependencies if it doesn't exist
if [ ! -f "${GLOBAL_OPENCODE_DIR}/package.json" ]; then
  cat > "${GLOBAL_OPENCODE_DIR}/package.json" << 'EOF'
{
  "name": "opencode-global-config",
  "version": "1.0.0",
  "dependencies": {}
}
EOF
fi

echo "✓ Plugin installed to: ${PLUGINS_DIR}/${PLUGIN_NAME}.js"
echo ""
echo "Next steps:"
echo "1. Ensure InfluxDB is running: docker-compose up -d"
echo "2. Set environment variables in your shell profile:"
echo "   export INFLUXDB_URL=http://localhost:8086"
echo "   export INFLUXDB_TOKEN=my-super-secret-auth-token"
echo "   export INFLUXDB_ORG=ttrack-org"
echo "   export INFLUXDB_BUCKET=token-usage"
echo ""
echo "3. Restart OpenCode to load the plugin"
echo ""
echo "The plugin will automatically track token usage from all OpenCode sessions!"
