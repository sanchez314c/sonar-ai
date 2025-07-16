#!/bin/bash
#
# SonarAI - macOS Source Runner
# Clean start script with port management and zombie cleanup
#

set -e

# ============================================
# PORT CONFIGURATION (Random High Ports)
# ============================================
ELECTRON_DEBUG_PORT=60372
ELECTRON_INSPECT_PORT=63102
ELECTRON_PORT=58005

# ============================================
# COLORS
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
DIM='\033[2m'
NC='\033[0m'

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║              SonarAI - macOS Source Runner               ║"
    echo "║           Neo-Noir Glass Monitor Edition                 ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_and_kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti :$port 2>/dev/null || true)

    if [ -n "$pid" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing process on port $port ($name) - PID: $pid"
        kill -9 $pid 2>/dev/null || true
        sleep 0.5
    fi
}

kill_zombie_electrons() {
    echo -e "${BLUE}[CLEANUP]${NC} Checking for orphaned Electron processes..."
    local pids=$(pgrep -f "electron.*$(basename $(pwd))" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing orphaned Electron processes: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

check_dependencies() {
    echo -e "${BLUE}[CHECK]${NC} Verifying dependencies..."

    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Node.js is not installed!"
        echo "Install from: https://nodejs.org or use 'brew install node'"
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} Node.js $(node --version)"

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} npm is not installed!"; exit 1
    fi
    echo -e "${GREEN}[OK]${NC} npm $(npm --version)"

    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Python3 is required for the backend!"; exit 1
    fi
    echo -e "${GREEN}[OK]${NC} Python3 $(python3 --version 2>&1 | awk '{print $2}')"

    # Setup Python virtual environment
    if [ ! -d "python/.venv" ]; then
        echo -e "${YELLOW}[SETUP]${NC} Creating Python virtual environment..."
        python3 -m venv python/.venv
    fi

    source python/.venv/bin/activate

    if [ ! -f "python/.venv/.deps_installed" ] || [ "python/requirements.txt" -nt "python/.venv/.deps_installed" ]; then
        echo -e "${YELLOW}[SETUP]${NC} Installing Python dependencies..."
        pip install -q --upgrade pip
        pip install -q -r python/requirements.txt
        touch python/.venv/.deps_installed
    fi
    echo -e "${GREEN}[OK]${NC} Python virtual environment ready"

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[SETUP]${NC} Installing Node.js dependencies..."
        npm install
    fi
    echo -e "${GREEN}[OK]${NC} Node.js dependencies ready"
}

# ============================================
# MAIN EXECUTION
# ============================================

cd "$(dirname "${BASH_SOURCE[0]}")"

print_header

echo -e "${BLUE}[INFO]${NC} Working directory: $(pwd)"
echo -e "${BLUE}[INFO]${NC} Configured ports:"
echo "  - Vite Dev Server:  $ELECTRON_PORT"
echo "  - Electron Debug:   $ELECTRON_DEBUG_PORT"
echo "  - Electron Inspect: $ELECTRON_INSPECT_PORT"
echo ""

# Cleanup phase
echo -e "${CYAN}━━━ CLEANUP PHASE ━━━${NC}"
kill_zombie_electrons
check_and_kill_port $ELECTRON_DEBUG_PORT "Electron Debug"
check_and_kill_port $ELECTRON_INSPECT_PORT "Electron Inspect"
check_and_kill_port $ELECTRON_PORT "Vite Dev Server"
echo ""

# Verification phase
echo -e "${CYAN}━━━ VERIFICATION PHASE ━━━${NC}"
check_dependencies
echo ""

# Launch phase
echo -e "${CYAN}━━━ LAUNCH PHASE ━━━${NC}"
echo -e "${GREEN}[START]${NC} Launching SonarAI..."
echo ""
echo -e "  ${YELLOW}Keyboard Shortcuts:${NC}"
echo -e "  • Cmd+,       Open Settings"
echo -e "  • Cmd++/-     Increase/Decrease font size"
echo -e "  • Cmd+Opt+I   Open DevTools"
echo -e "  • Escape      Close dialogs"
echo ""

# Export ports and environment
export ELECTRON_DEBUG_PORT=$ELECTRON_DEBUG_PORT
export ELECTRON_INSPECT_PORT=$ELECTRON_INSPECT_PORT
export ELECTRON_PORT=$ELECTRON_PORT
export SONAR_PYTHON_PATH="$(pwd)/python/.venv/bin/python3"

echo -e "${GREEN}[MODE]${NC} Development mode (run from source)"
npm run dev
