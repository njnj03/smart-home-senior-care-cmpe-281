#!/bin/bash
# Backend Deployment Script for AWS EC2
# Run this script on your EC2 instance to update the backend

set -e

echo "🚀 Deploying Smart Home Backend..."

BACKEND_DIR="/opt/smart-home-backend/backend"

# Check if directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    echo "Please clone the repository first."
    exit 1
fi

cd $BACKEND_DIR

# Pull latest code
echo "📥 Pulling latest code..."
git pull

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

# Restart service
echo "🔄 Restarting backend service..."
sudo systemctl restart smart-home-backend

# Wait a moment
sleep 2

# Check status
if sudo systemctl is-active --quiet smart-home-backend; then
    echo "✅ Backend deployed successfully!"
    echo ""
    echo "Service status:"
    sudo systemctl status smart-home-backend --no-pager -l
else
    echo "❌ Backend failed to start. Check logs:"
    echo "sudo journalctl -u smart-home-backend -n 50"
    exit 1
fi

