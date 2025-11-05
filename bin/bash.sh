#!/bin/bash
cd /home/ubuntu

# Install prerequisites
apt update -y
apt install -y git curl

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Clone your repo (UPDATE THIS URL!)
git clone https://github.com/harshbajani/shiprocket-backend.git
cd shiprocket-backend

# Install dependencies
npm ci --omit=dev  # Faster, skips devDeps in production

# Build TypeScript
npm run build

# Install PM2
npm install -g pm2

# Start the built app (runs dist/index.js → starts server on port 8000)
pm2 start dist/index.js --name "shiprocket-backend"

# Auto-start on reboot
pm2 startup
pm2 save

# Log public IP for easy access
echo "Backend running on port 8000"
echo "Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"