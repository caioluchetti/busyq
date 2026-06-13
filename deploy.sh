#!/usr/bin/env bash
set -e

APP_NAME="busyq"
PORT="${PORT:-3000}"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="/var/www/${APP_NAME}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

log()  { echo -e "${GREEN}[busyq]${NC} $1"; }
warn() { echo -e "${YELLOW}[busyq]${NC} $1"; }
err()  { echo -e "${RED}[busyq]${NC} $1"; }

check_deps() {
  if ! command -v node &>/dev/null; then
    err "Node.js is not installed. Install Node.js >= 18."
    exit 1
  fi
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    err "Node.js >= 18 required. Current: $(node -v)"
    exit 1
  fi
}

build() {
  log "Building ${BOLD}${APP_NAME}${NC} (standalone output)..."
  cd "$APP_DIR"
  npm run build
  log "Build complete."
}

package() {
  log "Packaging standalone server to ${BOLD}${DEPLOY_DIR}${NC}..."

  rm -rf "$DEPLOY_DIR"
  mkdir -p "$DEPLOY_DIR"

  cp -a "$APP_DIR/.next/standalone/." "$DEPLOY_DIR/"
  cp -r "$APP_DIR/.next/static" "$DEPLOY_DIR/.next/static"

  log "Packaged. Run on host:"
  echo ""
  echo -e "  ${BOLD}cd ${DEPLOY_DIR}${NC}"
  echo -e "  ${BOLD}PORT=${PORT} node server.js${NC}"
  echo ""
}

deploy() {
  check_deps
  build
  package

  echo -e "  ${BOLD}Internal port:${NC} ${PORT} (Node server)"
  echo -e "  ${BOLD}Public port:${NC}  8081 (nginx)"
  echo -e "  ${BOLD}URL:${NC}         http://localhost:8081"
  echo ""
}

usage() {
  echo ""
  echo -e "  ${BOLD}BusyQ Deploy Pipeline${NC}"
  echo ""
  echo -e "  Usage: ${BOLD}./deploy.sh <command>${NC}"
  echo ""
  echo "  Commands:"
  echo "    build     Build the app (next build)"
  echo "    package   Copy standalone output to ${DEPLOY_DIR}"
  echo "    deploy    Build + package (full pipeline)"
  echo ""
    echo "  After deploy, on the HOST machine:"
    echo ""
    echo "    # 1. Start the app (internal port 3000):"
    echo "    cd ${DEPLOY_DIR} && PORT=3000 node server.js &"
    echo ""
    echo "    # 2. Configure nginx to serve on port 8081:"
    echo "    sudo cp ${APP_DIR}/deploy/nginx.conf /etc/nginx/sites-available/busyq"
    echo "    sudo ln -sf /etc/nginx/sites-available/busyq /etc/nginx/sites-enabled/"
    echo "    sudo nginx -t && sudo systemctl reload nginx"
    echo ""
    echo "    # 3. Open http://localhost:8081"
  echo ""
  echo "  Environment:"
  echo "    PORT      Server port (default: 8081)"
  echo ""
}

case "${1:-}" in
  build)   check_deps; build ;;
  package) package ;;
  deploy)  deploy ;;
  *)       usage ;;
esac
