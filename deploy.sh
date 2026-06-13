#!/usr/bin/env bash
set -e

APP_NAME="busyq"
PORT="${PORT:-8081}"
LOG_FILE="/var/log/${APP_NAME}.log"
PID_FILE="/tmp/${APP_NAME}.pid"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

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
  log "Building ${BOLD}${APP_NAME}${NC}..."
  cd "$APP_DIR"
  npm run build
  log "Build complete."
}

start() {
  if lsof -ti :"${PORT}" &>/dev/null; then
    warn "Port ${PORT} is already in use. Stopping existing process..."
    stop
    sleep 1
  fi

  log "Starting ${BOLD}${APP_NAME}${NC} on port ${BOLD}${PORT}${NC}..."
  cd "$APP_DIR"

  nohup npx next start -p "${PORT}" > "$LOG_FILE" 2>&1 &
  PID=$!
  echo $PID > "$PID_FILE"

  sleep 2
  if kill -0 $PID 2>/dev/null; then
    log "Started (PID: ${BOLD}${PID}${NC})"
    log "Logs: ${BOLD}${LOG_FILE}${NC}"
    log "URL:  ${BOLD}http://localhost:${PORT}${NC}"
  else
    err "Failed to start. Check logs: tail -f ${LOG_FILE}"
    exit 1
  fi
}

stop() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null
      log "Stopped process ${PID}"
    fi
    rm -f "$PID_FILE"
  fi

  if lsof -ti :"${PORT}" &>/dev/null; then
    kill -9 "$(lsof -ti :${PORT})" 2>/dev/null
    log "Force-killed any remaining process on port ${PORT}"
  fi
}

restart() {
  stop
  sleep 1
  start
}

status() {
  if lsof -ti :"${PORT}" &>/dev/null; then
    PID=$(lsof -ti :"${PORT}")
    log "Running on port ${PORT} (PID: ${PID})"
  else
    warn "Not running on port ${PORT}"
  fi
}

show_logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -f "$LOG_FILE"
  else
    warn "No log file at ${LOG_FILE}"
  fi
}

usage() {
  echo ""
  echo -e "  ${BOLD}BusyQ Deploy Script${NC}"
  echo ""
  echo -e "  Usage: ${BOLD}./deploy.sh <command>${NC}"
  echo ""
  echo "  Commands:"
  echo "    build     Build the production bundle (next build)"
  echo "    start     Start the production server on port ${PORT}"
  echo "    stop      Stop the production server"
  echo "    restart   Stop + start"
  echo "    deploy    Build + start (full deploy)"
  echo "    status    Check if server is running"
  echo "    logs      Tail server logs"
  echo ""
  echo "  Environment:"
  echo "    PORT      Server port (default: 8081)"
  echo ""
}

case "${1:-}" in
  build)   check_deps; build ;;
  start)   check_deps; build; start ;;
  stop)    stop ;;
  restart) restart ;;
  deploy)  check_deps; build; start ;;
  status)  status ;;
  logs)    show_logs ;;
  *)       usage ;;
esac
