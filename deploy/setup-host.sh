#!/usr/bin/env bash
# Run on the HOST machine to configure nginx for BusyQ on port 8081.
# The Node server already runs inside the Docker container at 172.17.0.2:3000.
#
# Safe: only listens on port 8081, won't affect your existing port 80/443 sites.
set -e

echo "=== BusyQ Nginx Setup (port 8081) ==="

# Copy nginx config from shared volume
echo "[1/2] Installing nginx config..."
sudo cp /home/Apps/busyq/deploy/nginx.conf /etc/nginx/sites-available/busyq
sudo ln -sf /etc/nginx/sites-available/busyq /etc/nginx/sites-enabled/busyq

# Test and reload
echo "[2/2] Testing and reloading nginx..."
sudo nginx -t && sudo nginx -s reload

echo ""
echo "=== Done ==="
echo "BusyQ:  http://localhost:8081 (or http://<your-ip>:8081)"
echo ""
echo "Note: only listens on port 8081 — your other sites on 80/443 are untouched."
echo ""
echo "Revert: sudo rm /etc/nginx/sites-enabled/busyq && sudo nginx -s reload"
