#!/usr/bin/env bash
# =================================================================
# NEXORA - AWS EC2 AUTOMATED HOST PROVISIONING SCRIPT
# Tested on: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS & Amazon Linux 2023
# =================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting NEXORA Host Provisioning for AWS EC2"
echo "=========================================================="

# 1. Detect Operating System
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot determine OS. Assuming Ubuntu."
    OS="ubuntu"
fi

# 2. Configure 4GB Swap Space (Essential for t3.medium memory stability)
echo "--> Configuring 4GB swap space for JVM and build stability..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap space successfully configured."
else
    echo "Swapfile already exists. Skipping."
fi

# 3. Install Docker and Docker Compose
echo "--> Installing Docker Engine and Docker Compose..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release git

    # Add Docker GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
elif [ "$OS" = "amzn" ]; then
    sudo dnf update -y
    sudo dnf install -y docker git
    sudo systemctl enable docker
    sudo systemctl start docker

    # Install Docker compose plugin
    DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker}
    sudo mkdir -p $DOCKER_CONFIG/cli-plugins
    sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o $DOCKER_CONFIG/cli-plugins/docker-compose
    sudo chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
fi

# 4. Enable and start Docker daemon
echo "--> Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# 5. Add current user to docker group (avoids needing sudo for docker commands)
TARGET_USER=${SUDO_USER:-$USER}
echo "--> Adding user '$TARGET_USER' to docker group..."
sudo usermod -aG docker "$TARGET_USER"

echo "=========================================================="
echo " Host Provisioning Completed Successfully!"
echo " IMPORTANT: Log out and log back in (or run 'newgrp docker')"
echo " for docker group permissions to take effect."
echo " Then run: ./deploy/deploy.sh"
echo "=========================================================="
