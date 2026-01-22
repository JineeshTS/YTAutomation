#!/bin/bash

# GameofCrores Automated Installation Script
# Run this on your Hostinger VPS to set up everything automatically

set -e  # Exit on any error

echo "╔════════════════════════════════════════╗"
echo "║  GameofCrores Installation Script     ║"
echo "║  Automated YouTube Shorts Generator    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as regular user."
    exit 1
fi

echo "This script will install and configure GameofCrores on your VPS."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Step 1: Update system
print_step "Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Step 2: Install Node.js 20.x
print_step "Step 2: Installing Node.js 20.x..."
if command -v node &> /dev/null; then
    print_warning "Node.js already installed: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
fi

# Step 3: Install FFmpeg
print_step "Step 3: Installing FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    print_warning "FFmpeg already installed"
else
    sudo apt install -y ffmpeg
    print_success "FFmpeg installed"
fi

# Step 4: Install system libraries
print_step "Step 4: Installing system libraries..."
sudo apt install -y \
    libvips-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3-pip
print_success "System libraries installed"

# Step 5: Install PM2
print_step "Step 5: Installing PM2..."
if command -v pm2 &> /dev/null; then
    print_warning "PM2 already installed"
else
    sudo npm install -g pm2
    pm2 startup
    print_success "PM2 installed"
fi

# Step 6: Create project directory
print_step "Step 6: Creating project directory..."
PROJECT_DIR="/home/gameofcrores"
if [ -d "$PROJECT_DIR" ]; then
    print_warning "Directory already exists: $PROJECT_DIR"
else
    sudo mkdir -p $PROJECT_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR
    print_success "Project directory created"
fi

cd $PROJECT_DIR

# Step 7: Create directory structure
print_step "Step 7: Creating directory structure..."
mkdir -p src/{remotion,scripts,templates}
mkdir -p data/{videos,audio,thumbnails}
mkdir -p logs
print_success "Directory structure created"

# Step 8: Copy/Download project files
print_step "Step 8: Setting up project files..."
print_warning "You need to upload the following files to $PROJECT_DIR:"
echo "   - package.json"
echo "   - remotion.config.ts"
echo "   - src/remotion/Root.tsx"
echo "   - src/remotion/NewsShort.tsx"
echo "   - src/scripts/*.js"
echo "   - .env (copy from .env.example)"
echo ""
print_warning "Please upload these files now."
read -p "Press Enter once files are uploaded..."

# Step 9: Install Node dependencies
print_step "Step 9: Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_error "package.json not found. Please upload it first."
    exit 1
fi

# Step 10: Create .env if not exists
print_step "Step 10: Checking .env file..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning ".env created from .env.example - PLEASE EDIT IT WITH YOUR API KEYS"
    else
        print_error ".env not found. Please create it."
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Step 11: Set permissions
print_step "Step 11: Setting permissions..."
chmod +x test-system.sh 2>/dev/null || print_warning "test-system.sh not found"
chmod -R 755 src/
chmod -R 755 data/
chmod -R 755 logs/
print_success "Permissions set"

# Step 12: Run system test
print_step "Step 12: Running system test..."
if [ -f "test-system.sh" ]; then
    ./test-system.sh
else
    print_warning "test-system.sh not found, skipping test"
fi

# Step 13: Setup swap (if needed)
print_step "Step 13: Checking memory..."
TOTAL_RAM=$(free -g | grep Mem | awk '{print $2}')
if [ $TOTAL_RAM -lt 8 ]; then
    print_warning "Low RAM detected (${TOTAL_RAM}GB). Setting up swap..."
    
    if [ ! -f "/swapfile" ]; then
        sudo fallocate -l 4G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        print_success "4GB swap created"
    else
        print_warning "Swap file already exists"
    fi
else
    print_success "RAM sufficient (${TOTAL_RAM}GB)"
fi

# Step 14: Setup auto-cleanup cron
print_step "Step 14: Setting up automatic cleanup..."
CRON_CMD="0 2 * * * find $PROJECT_DIR/data/videos/ -name \"*.mp4\" -mtime +30 -delete && find $PROJECT_DIR/data/audio/ -name \"*.mp3\" -mtime +30 -delete"
(crontab -l 2>/dev/null | grep -v "gameofcrores"; echo "$CRON_CMD") | crontab -
print_success "Auto-cleanup scheduled (2 AM daily)"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║      Installation Complete! 🎉         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your API keys:"
echo "   nano $PROJECT_DIR/.env"
echo ""
echo "2. Authenticate with YouTube:"
echo "   cd $PROJECT_DIR"
echo "   npm run auth:youtube"
echo ""
echo "3. Test video creation:"
echo "   npm run create:market_open"
echo ""
echo "4. Import n8n workflow:"
echo "   - Upload n8n-workflow.json to your n8n instance"
echo ""
echo "5. Activate workflow in n8n"
echo ""
echo "Documentation: $PROJECT_DIR/gameofcrores-setup-guide.md"
echo "Quick help: $PROJECT_DIR/README.md"
echo "Troubleshooting: $PROJECT_DIR/TROUBLESHOOTING.md"
echo ""
print_success "Installation complete!"
