#!/usr/bin/env bash
# =================================================================
# NEXORA - AUTOMATED LET'S ENCRYPT SSL / HTTPS SETUP (EC2)
# Usage: ./deploy/setup-ssl.sh <DOMAIN_NAME> <ADMIN_EMAIL>
# =================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

DOMAIN="${1:-nexora-analyst.duckdns.org}"
EMAIL="${2:-lokendrasinghrajput776@gmail.com}"

echo "=========================================================="
echo " Setting up Let's Encrypt SSL for https://${DOMAIN}"
echo " Email: ${EMAIL}"
echo "=========================================================="

# 1. Install Certbot
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y certbot
fi

# 2. Stop frontend temporarily to free port 80 for ACME standalone challenge
echo "--> Temporarily stopping frontend container to acquire certificate..."
sudo docker compose stop frontend || true

# 3. Obtain certificate via Certbot standalone
echo "--> Requesting SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --preferred-challenges http

# 4. Write SSL-enabled Nginx configuration
echo "--> Generating SSL-enabled Nginx configuration..."
cat <<EOF | sudo tee frontend/nginx.conf > /dev/null
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

# Production HTTPS Server
server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Max upload size for CSV/Excel datasets
    client_max_body_size 50M;

    # Static Frontend Assets
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # API Proxy to Spring Boot Backend
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Swagger Documentation Proxy
    location /swagger-ui/ {
        proxy_pass http://backend:8080/swagger-ui/;
        proxy_set_header Host \$host;
    }
    location /api-docs {
        proxy_pass http://backend:8080/api-docs;
        proxy_set_header Host \$host;
    }

    # Health check probe
    location /health {
        access_log off;
        return 200 'healthy\n';
    }
}
EOF

# 5. Update docker-compose.yml to expose port 443 and mount certificates
echo "--> Updating docker-compose.yml for SSL..."
python3 -c "
import re

with open('docker-compose.yml', 'r') as f:
    content = f.read()

# Add port 443 if not present
if '443:443' not in content:
    content = content.replace('\"\\\${FRONTEND_PORT:-80}:80\"', '\"80:80\"\n      - \"443:443\"')

# Add volumes for letsencrypt and nginx.conf if not present
if '/etc/letsencrypt' not in content:
    frontend_vol = '''    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:'''
    content = content.replace('    depends_on:', frontend_vol, 1)

with open('docker-compose.yml', 'w') as f:
    f.write(content)
" || true

# 6. Re-launch frontend container with SSL enabled
echo "--> Starting SSL-secured frontend container..."
sudo docker compose up -d frontend

echo "=========================================================="
echo " SSL SETUP COMPLETE!"
echo " Secure URL: https://${DOMAIN}"
echo "=========================================================="
