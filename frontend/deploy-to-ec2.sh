#!/bin/bash
# Frontend Deployment Script
# Run this script from your local machine to build and deploy frontend to EC2

set -e

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================
EC2_IP="YOUR_EC2_IP_HERE"
EC2_USER="ubuntu"
EC2_KEY_PATH="path/to/your-key.pem"
FRONTEND_DIR="frontend"
REMOTE_DIR="/opt/smart-home-frontend"
# ============================================

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Deploying Smart Home Frontend to EC2..."

# Check configuration
if [ "$EC2_IP" == "YOUR_EC2_IP_HERE" ]; then
    echo -e "${RED}❌ Please update EC2_IP, EC2_USER, and EC2_KEY_PATH in this script${NC}"
    exit 1
fi

if [ ! -f "$EC2_KEY_PATH" ]; then
    echo -e "${RED}❌ SSH key not found: $EC2_KEY_PATH${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

cd $FRONTEND_DIR

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating...${NC}"
    echo "VITE_API_BASE_URL=http://$EC2_IP" > .env.production
    echo -e "${YELLOW}Please review .env.production and update if needed${NC}"
fi

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm install
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

# Create remote directory
echo -e "${YELLOW}📁 Creating remote directory...${NC}"
ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_IP "sudo mkdir -p $REMOTE_DIR && sudo chown $EC2_USER:$EC2_USER $REMOTE_DIR"

# Upload to EC2
echo -e "${YELLOW}📤 Uploading to EC2...${NC}"
scp -i $EC2_KEY_PATH -r dist/* $EC2_USER@$EC2_IP:$REMOTE_DIR/

# Restart Nginx on EC2
echo -e "${YELLOW}🔄 Restarting Nginx...${NC}"
ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_IP "sudo systemctl restart nginx"

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo ""
echo "Visit: http://$EC2_IP"
echo "API Docs: http://$EC2_IP/api/docs"

