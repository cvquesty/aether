#!/bin/bash
###############################################################################
# Aether Remote Update Script
#
# Deploys the Aether Next.js app from your laptop to a remote server.
#
# Usage examples:
#   ./scripts/update_remote.sh --yes
#   ./scripts/update_remote.sh --host 10.0.100.225 --user jsheets --yes
#   OPENVOX_DEPLOY_HOST=... but prefer AETHER_ or --host
#
# The script:
#   1. Stages your local tree to the remote via rsync over SSH
#   2. Runs the remote deploy.sh as sudo
#   3. Cleans up the staging area
#
# Requirements:
#   - Passwordless SSH key access to the remote user
#   - The remote user can sudo (no password for the deploy commands)
#   - Remote has Node 20+ and npm
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_VERSION=$(cat "$REPO_ROOT/VERSION" 2>/dev/null || echo "0.1.0")

# Defaults (override via env or flags)
REMOTE_HOST="${AETHER_DEPLOY_HOST:-${OPENVOX_DEPLOY_HOST:-}}"
REMOTE_USER="${AETHER_DEPLOY_USER:-${OPENVOX_DEPLOY_USER:-$(whoami)}}"
INSTALL_DIR="/opt/aether"
SERVICE_NAME="aether"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

UNATTENDED=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -y|--yes|--unattended)
            UNATTENDED=true
            shift
            ;;
        --host)
            REMOTE_HOST="$2"
            shift 2
            ;;
        --user)
            REMOTE_USER="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--host HOST] [--user USER] [--yes]"
            echo "Env vars: AETHER_DEPLOY_HOST, AETHER_DEPLOY_USER"
            exit 0
            ;;
        *)
            REMOTE_HOST="$1"
            shift
            ;;
    esac
done

if [ -z "$REMOTE_HOST" ]; then
    if [ "$UNATTENDED" = true ]; then
        echo -e "${RED}Error: --host required in unattended mode.${NC}"
        exit 1
    fi
    read -rp "Remote host (IP or hostname): " REMOTE_HOST
    if [ -z "$REMOTE_HOST" ]; then
        echo "Aborted."
        exit 1
    fi
fi

echo -e "${GREEN}Aether deploy${NC} v${APP_VERSION}"
echo "  Local:   $REPO_ROOT"
echo "  Remote:  ${REMOTE_USER}@${REMOTE_HOST}:${INSTALL_DIR}"
echo

# Confirm unless --yes
if [ "$UNATTENDED" != true ]; then
    read -rp "Proceed with deploy? [y/N] " reply
    if [[ ! "$reply" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

# Create a unique staging dir on remote
STAGE_NAME="aether-deploy-$(date +%s)"
REMOTE_STAGE="/tmp/${STAGE_NAME}"

echo "[1/4] Rsyncing source to remote staging area..."
rsync -az --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.env.local' \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$REPO_ROOT/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_STAGE}/"

echo "[2/4] Running deploy.sh on remote as root..."
ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" \
    "sudo ${REMOTE_STAGE}/scripts/deploy.sh ${REMOTE_STAGE}"

echo "[3/4] Cleaning up staging area on remote..."
ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" \
    "rm -rf ${REMOTE_STAGE}"

echo "[4/4] Done."

echo
echo -e "${GREEN}✓ Deploy finished.${NC}"
echo "  Next steps if this is the first deploy:"
echo "    1. Ensure DNS for aether.questy.org points at the server."
echo "    2. Create the systemd unit and Apache vhost (see scripts/ and docs/)."
echo "    3. Obtain Let's Encrypt cert with certbot."
echo
echo "  Check status:"
echo "    ssh ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl status ${SERVICE_NAME} -l'"
echo "    ssh ${REMOTE_USER}@${REMOTE_HOST} 'sudo journalctl -u ${SERVICE_NAME} -f'"
