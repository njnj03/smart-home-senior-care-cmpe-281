#!/bin/bash
# AWS EC2 Setup Script for Backend
# Run this script on your EC2 instance after initial setup

set -e

echo "🚀 Setting up Smart Home Senior Care Backend on EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Python 3.11 and dependencies
echo "🐍 Installing Python 3.11..."
sudo apt-get install -y python3.11 python3.11-venv python3-pip python3.11-dev

# Install PostgreSQL client libraries
echo "🗄️ Installing PostgreSQL dependencies..."
sudo apt-get install -y libpq-dev gcc g++

# Install other system dependencies
echo "📚 Installing system dependencies..."
sudo apt-get install -y git curl wget build-essential

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/smart-home-backend
sudo chown $USER:$USER /opt/smart-home-backend

# Note: This script assumes you've already cloned the repository
# If not, clone it first:
# cd /opt/smart-home-backend
# git clone YOUR_REPO_URL .
# git checkout aws-deployment

# Navigate to backend directory
cd /opt/smart-home-backend/backend

# Create virtual environment
echo "🔧 Setting up Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# Create storage directory
echo "💾 Creating storage directories..."
mkdir -p storage/audio
chmod 755 storage/audio

# Copy systemd service file
echo "⚙️ Setting up systemd service..."
sudo cp smart-home-backend.service /etc/systemd/system/
sudo systemctl daemon-reload

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables: nano /opt/smart-home-backend/backend/.env"
echo "2. Run database migrations: cd /opt/smart-home-backend/backend && source venv/bin/activate && alembic upgrade head"
echo "3. Start the service: sudo systemctl start smart-home-backend"
echo "4. Enable auto-start: sudo systemctl enable smart-home-backend"
echo "5. Check status: sudo systemctl status smart-home-backend"

