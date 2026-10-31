#!/usr/bin/env bash
# =================================================================
# NEXORA - ONE-TOUCH AWS EC2 DEPLOYMENT & UPDATE SCRIPT
# =================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "=========================================================="
echo " Deploying NEXORA Enterprise Stack on AWS EC2 (v1.0.1)"
echo "=========================================================="

# 1. Environment file check
if [ ! -f .env ]; then
    echo "--> No .env file found. Copying .env.example to .env..."
    cp .env.example .env
    echo "Generated .env with default credentials."
    echo "You may edit .env to update passwords or add GEMINI_API_KEY."
fi

# 2. Build and launch containers in detached mode
echo "--> Building and starting Docker containers..."
docker compose up -d --build

# 3. Wait for services to become healthy
echo "--> Waiting for multi-tier healthchecks to complete..."
TIMEOUT=180
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    UNHEALTHY=$(docker compose ps --format json | grep -i '"Health":' | grep -iv '"healthy"' || true)
    
    if [ -z "$UNHEALTHY" ] && [ $(docker compose ps -q | wc -l) -ge 4 ]; then
        echo "--> All 4 tiers are healthy and operational!"
        break
    fi

    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo "    Checking container health ($ELAPSED seconds elapsed)..."
done

# 4. Display service status
echo "=========================================================="
echo " Service Container Status:"
echo "=========================================================="
docker compose ps

# 5. Fetch Public IP if on EC2
PUBLIC_IP=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/public-ipv4 || curl -s https://checkip.amazonaws.com || echo "localhost")

echo "=========================================================="
echo " NEXORA IS NOW LIVE!"
echo " Web Application URL: http://${PUBLIC_IP}"
echo " Swagger API Docs:    http://${PUBLIC_IP}/swagger-ui/index.html"
echo " Backend API:         http://${PUBLIC_IP}/api/v1/companies"
echo "=========================================================="
