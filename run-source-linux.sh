#!/bin/bash
#
# SonarAI v1.0.0 - Linux Development Runner
# Neo-Noir Glass Monitor Edition
# Runs the application from source with all dependencies
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    SonarAI v1.0.0                           ║${NC}"
echo -e "${CYAN}║           Neo-Noir Glass Monitor Edition                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js v18+ required (found v$NODE_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Python $(python3 --version)"

# Setup Python virtual environment
echo ""
echo -e "${YELLOW}Setting up Python environment...${NC}"

if [ ! -d "python/.venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv python/.venv
fi

source python/.venv/bin/activate

# Check if dependencies need installing
if [ ! -f "python/.venv/.deps_installed" ] || [ "python/requirements.txt" -nt "python/.venv/.deps_installed" ]; then
    echo "  Installing Python dependencies..."
    pip install -q --upgrade pip
    pip install -q -r python/requirements.txt
    touch python/.venv/.deps_installed
fi
echo -e "${GREEN}✓${NC} Python virtual environment ready"

# Setup Node.js dependencies
echo ""
echo -e "${YELLOW}Setting up Node.js environment...${NC}"

if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies..."
    npm install
fi

# Check if node_modules is up to date with package.json
if [ "package.json" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
    echo "  Updating Node.js dependencies..."
    npm install
fi
echo -e "${GREEN}✓${NC} Node.js dependencies ready"

# Fix Electron sandbox issue on Linux
echo ""
echo -e "${YELLOW}Configuring Electron...${NC}"
if [ "$(sysctl -n kernel.unprivileged_userns_clone 2>/dev/null)" != "1" ]; then
    echo -e "${YELLOW}  Note: If Electron fails to start, run:${NC}"
    echo -e "${YELLOW}  sudo sysctl -w kernel.unprivileged_userns_clone=1${NC}"
fi
echo -e "${GREEN}✓${NC} Electron configured ${DIM}(transparent + frameless)${NC}"

# Start the application
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Starting SonarAI...${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}Keyboard Shortcuts:${NC}"
echo -e "  • Ctrl+,      Open Settings"
echo -e "  • Ctrl++/-    Increase/Decrease font size"
echo -e "  • Escape      Close dialogs"
echo ""

# Export venv path for Electron to use
export SONAR_PYTHON_PATH="$SCRIPT_DIR/python/.venv/bin/python3"

# Run in development mode
npm run dev
