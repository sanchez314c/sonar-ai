#!/bin/bash
#
# SonarAI v1.0.0 - Linux Production Build Script
# Creates distributable packages (AppImage, deb)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              SonarAI v1.0.0 - Production Build               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check dependencies
echo -e "${YELLOW}Checking build dependencies...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Dependencies OK"

# Setup Python venv for bundling
echo ""
echo -e "${YELLOW}Preparing Python environment for bundling...${NC}"

if [ ! -d "python/.venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv python/.venv
fi

source python/.venv/bin/activate
pip install -q --upgrade pip
pip install -q -r python/requirements.txt

echo -e "${GREEN}✓${NC} Python environment ready"

# Install Node dependencies
echo ""
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✓${NC} Node.js dependencies installed"

# Run TypeScript compilation and Vite build
echo ""
echo -e "${YELLOW}Building application...${NC}"
npm run build:linux

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Build Complete!                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Output files are in: ${BLUE}release/${NC}"
echo ""
ls -la release/ 2>/dev/null || echo "  (Run 'npm run build:linux' to create release packages)"
