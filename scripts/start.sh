#!/bin/bash
###############################################################################
# Aether — Production start script
#
# Starts the Next.js production server (next start).
# Designed to be called from systemd.
#
# Usage (usually via systemd):
#   /opt/aether/scripts/start.sh
#
# Environment:
#   PORT (default 3100)
#   HOST (default 0.0.0.0)
###############################################################################

set -euo pipefail

APP_DIR="/opt/aether"
cd "$APP_DIR" || { echo "ERROR: cannot cd to $APP_DIR"; exit 1; }

# Ensure standalone assets are present (critical for CSS/JS in production)
if [ -f ".next/standalone/server.js" ]; then
    if [ ! -d ".next/standalone/.next/static" ] && [ -d ".next/static" ]; then
        echo "Copying static assets for standalone..."
        mkdir -p .next/standalone/.next
        cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
        cp -r public .next/standalone/public 2>/dev/null || mkdir -p .next/standalone/public
    fi

    export PORT="${PORT:-3100}"
    export HOSTNAME="${HOST:-0.0.0.0}"

    echo "Starting Aether (standalone) on ${HOSTNAME}:${PORT} ..."
    exec node .next/standalone/server.js
else
    PORT="${PORT:-3100}"
    echo "Starting Aether with next start on 0.0.0.0:${PORT} ..."
    exec npx next start -p "$PORT" -H 0.0.0.0
fi
