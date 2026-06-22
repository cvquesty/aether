#!/bin/bash
###############################################################################
# Aether Deploy Script (runs on the target server)
#
# Copies source from a staging directory into /opt/aether,
# installs deps, builds the Next.js production bundle,
# and restarts the systemd service.
#
# Usage (usually called by update_remote.sh or manually as root):
#   sudo ./deploy.sh /path/to/staged-aether-source
#   sudo ./deploy.sh
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGED_DIR="${1:-${SCRIPT_DIR%/scripts}}"
INSTALL_DIR="/opt/aether"
SERVICE_NAME="aether"
USER_NAME="aether"
GROUP_NAME="aether"

if [ "$(id -u)" -ne 0 ]; then
    echo "Error: deploy.sh must be run as root (use sudo)."
    exit 1
fi

if [ ! -d "$STAGED_DIR" ] || [ ! -f "$STAGED_DIR/package.json" ]; then
    echo "Error: $STAGED_DIR does not look like a valid Aether source directory."
    exit 1
fi

echo "=== Aether Deploy ==="
echo "Source:   $STAGED_DIR"
echo "Target:   $INSTALL_DIR"
echo "Service:  $SERVICE_NAME"
echo

# 1. Ensure install dir exists with correct ownership
mkdir -p "$INSTALL_DIR"
chown "$USER_NAME:$GROUP_NAME" "$INSTALL_DIR"

# 2. Rsync the application code (exclude heavy build artifacts on transfer)
echo "[1/5] Syncing source to $INSTALL_DIR ..."
rsync -a --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.env.local' \
    --exclude '.env.*.local' \
    --exclude 'out' \
    "$STAGED_DIR/" "$INSTALL_DIR/"

chown -R "$USER_NAME:$GROUP_NAME" "$INSTALL_DIR"

# 3. Install production dependencies + build
echo "[2/5] Installing dependencies (npm ci) ..."
cd "$INSTALL_DIR"
# Use --prefer-offline for speed on repeated deploys
sudo -u "$USER_NAME" npm ci --prefer-offline --no-audit --no-fund

echo "[3/5] Building Next.js production bundle ..."
sudo -u "$USER_NAME" npm run build

# 3b. Ensure standalone assets are copied (required for CSS/JS in production)
echo "[3b/5] Copying static assets for standalone deployment..."
sudo -u "$USER_NAME" mkdir -p .next/standalone/.next .next/standalone/public
sudo -u "$USER_NAME" cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
sudo -u "$USER_NAME" cp -r public .next/standalone/public 2>/dev/null || true

# 4. Ensure scripts are executable
chmod +x "$INSTALL_DIR/scripts/"*.sh 2>/dev/null || true

# 5. Restart (or start) the service
echo "[4/5] Restarting systemd service: $SERVICE_NAME ..."
systemctl daemon-reload
systemctl enable "$SERVICE_NAME" 2>/dev/null || true
systemctl restart "$SERVICE_NAME"

echo "[5/5] Checking service status ..."
sleep 1
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "\033[0;32m✓ Aether deployed and running.\033[0m"
    echo "  Port should be listening on 3100 (see aether.service)."
    echo "  Check logs: journalctl -u $SERVICE_NAME -f"
else
    echo -e "\033[0;31m! Service did not come up cleanly. Check logs.\033[0m"
    journalctl -u "$SERVICE_NAME" --no-pager -n 30
    exit 1
fi

echo
echo "Deploy complete."
