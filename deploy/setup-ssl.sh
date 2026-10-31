#!/usr/bin/env bash
# =================================================================
# NEXORA - AUTOMATED LET'S ENCRYPT SSL / HTTPS SETUP (EC2)
# Usage: ./deploy/setup-ssl.sh yourdomain.com your-email@example.com
# =================================================================

set -euo pipefail

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <DOMAIN_NAME> <ADMIN_EMAIL>"
    echo "Example: $0 analytics.mycompany.com admin@mycompany.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "=========================================================="
echo " Setting up Let's Encrypt SSL for https://${DOMAIN}"
echo "=========================================================="

# 1. Install Certbot
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y certbot
elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y certbot
fi

# 2. Stop frontend temporarily to free port 80 for standalone challenge
echo "--> Temporarily stopping frontend container to acquire certificate..."
docker compose stop frontend

# 3. Obtain certificate via Certbot standalone
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --preferred-challenges http

# 4. Restart frontend container
echo "--> Starting frontend container..."
docker compose start frontend

echo "=========================================================="
echo " SSL Certificate acquired at /etc/letsencrypt/live/${DOMAIN}/"
echo " Certificates auto-renew via certbot systemd timer."
echo "=========================================================="
