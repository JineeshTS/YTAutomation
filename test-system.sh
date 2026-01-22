#!/bin/bash

echo "=== GameofCrores System Test ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Node.js
echo -n "1. Testing Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Found: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Test 2: Check FFmpeg
echo -n "2. Testing FFmpeg... "
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1 | cut -d' ' -f3)
    echo -e "${GREEN}✓${NC} Found: $FFMPEG_VERSION"
else
    echo -e "${RED}✗${NC} FFmpeg not found"
    exit 1
fi

# Test 3: Check .env file
echo -n "3. Testing .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗${NC} .env file not found"
    exit 1
fi

# Test 4: Check API Keys
echo "4. Testing API Keys..."

check_env_var() {
    if grep -q "^$1=.*[^[:space:]]" .env 2>/dev/null; then
        echo -e "   ${GREEN}✓${NC} $1 configured"
        return 0
    else
        echo -e "   ${RED}✗${NC} $1 missing or empty"
        return 1
    fi
}

check_env_var "ANTHROPIC_API_KEY"
check_env_var "ELEVENLABS_API_KEY"
check_env_var "ELEVENLABS_VOICE_ID"
check_env_var "YOUTUBE_CLIENT_ID"
check_env_var "YOUTUBE_CLIENT_SECRET"
check_env_var "YOUTUBE_REFRESH_TOKEN"
check_env_var "NEWS_API_KEY"
check_env_var "ALPHA_VANTAGE_KEY"

# Test 5: Check dependencies
echo -n "5. Testing Node modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}⚠${NC} Not installed. Run: npm install"
fi

# Test 6: Test directory structure
echo "6. Testing directory structure..."
REQUIRED_DIRS=("src/scripts" "src/remotion" "data/videos" "data/audio" "logs")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "   ${GREEN}✓${NC} $dir"
    else
        echo -e "   ${RED}✗${NC} $dir missing"
        mkdir -p "$dir"
        echo -e "   ${GREEN}✓${NC} Created $dir"
    fi
done

# Test 7: Test API connectivity
echo "7. Testing API connectivity..."

# Test Claude API
echo -n "   Claude API... "
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    node -e "
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
    }).then(() => {
        console.log('${GREEN}✓${NC} Working');
        process.exit(0);
    }).catch(err => {
        console.log('${RED}✗${NC} Failed:', err.message);
        process.exit(1);
    });
    " 2>/dev/null || echo -e "${RED}✗${NC} Failed"
else
    echo -e "${YELLOW}⚠${NC} Skipped (no API key)"
fi

# Test 8: Disk space
echo -n "8. Testing disk space... "
AVAILABLE=$(df /home/gameofcrores 2>/dev/null | tail -1 | awk '{print $4}')
if [ ! -z "$AVAILABLE" ]; then
    AVAILABLE_GB=$((AVAILABLE / 1024 / 1024))
    if [ $AVAILABLE_GB -gt 10 ]; then
        echo -e "${GREEN}✓${NC} ${AVAILABLE_GB}GB available"
    else
        echo -e "${YELLOW}⚠${NC} Only ${AVAILABLE_GB}GB available (recommend 20GB+)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Unable to check"
fi

# Test 9: RAM
echo -n "9. Testing RAM... "
TOTAL_RAM=$(free -g | grep Mem | awk '{print $2}')
if [ $TOTAL_RAM -gt 6 ]; then
    echo -e "${GREEN}✓${NC} ${TOTAL_RAM}GB total"
else
    echo -e "${YELLOW}⚠${NC} Only ${TOTAL_RAM}GB (recommend 8GB+)"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "Next steps:"
echo "1. If any tests failed, fix them before proceeding"
echo "2. Run a test video: npm run create:market_open"
echo "3. If successful, import n8n workflow"
echo ""
