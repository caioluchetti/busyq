#!/usr/bin/env bash
# Run on the HOST machine to start BusyQ and configure nginx on port 8081
set -e

echo "=== BusyQ Host Setup ==="
echo ""

# 1. Start the Next.js server on internal port 3000
echo "[1/3] Starting BusyQ on internal port 3000..."
kill $(lsof -ti :3000 2>/dev/null) 2>/dev/null || true
cd /var/www/busyq
nohup node server.js > /var/log/busyq.log 2>&1 &
sleep 2
echo "       PID: $!"
echo ""

# 2. Copy nginx config
echo "[2/3] Configuring nginx for port 8081..."
sudo cp /home/Apps/busyq/deploy/nginx.conf /etc/nginx/sites-available/busyq
sudo ln -sf /etc/nginx/sites-available/busyq /etc/nginx/sites-enabled/busyq
echo ""

# 3. Reload nginx
echo "[3/3] Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo ""

echo "=== Done ==="
echo "BusyQ running at: http://localhost:8081"
echo "Logs:             tail -f /var/log/busyq.log"
echo ""
echo "Stop:             kill \$(lsof -ti :3000)"
