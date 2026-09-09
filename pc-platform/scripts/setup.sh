#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# setup.sh — First-time development environment setup
# Run: bash scripts/setup.sh
# ──────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║       PC Platform — Dev Setup              ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# ── Prerequisites check ───────────────────────────────────────
info "Checking prerequisites..."

command -v node >/dev/null 2>&1 || error "Node.js not found. Install Node.js >= 20"
command -v pnpm >/dev/null 2>&1 || error "pnpm not found. Run: npm install -g pnpm"
command -v docker >/dev/null 2>&1 || error "Docker not found. Install Docker Desktop"

NODE_VERSION=$(node -v | cut -d 'v' -f2 | cut -d '.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  error "Node.js 20+ required. Found v$(node -v)"
fi

info "Node.js: $(node -v) ✓"
info "pnpm: $(pnpm -v) ✓"
info "Docker: $(docker -v) ✓"

# ── Environment ───────────────────────────────────────────────
if [ ! -f ".env" ]; then
  info "Creating .env from .env.example..."
  cp .env.example .env
  warning "⚠️  Please edit .env and set JWT_SECRET and JWT_REFRESH_SECRET before running the app!"
else
  info ".env already exists ✓"
fi

# ── Install dependencies ──────────────────────────────────────
info "Installing dependencies..."
pnpm install

# ── Start infrastructure ──────────────────────────────────────
info "Starting PostgreSQL and Redis via Docker..."
docker-compose up -d postgres redis

info "Waiting for PostgreSQL to be ready..."
until docker exec pc-platform-postgres pg_isready -U postgres >/dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo ""
info "PostgreSQL is ready ✓"

# ── Database ──────────────────────────────────────────────────
info "Generating Prisma client..."
pnpm db:generate

info "Running database migrations..."
pnpm db:migrate

info "Seeding database..."
pnpm db:seed

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅  Setup complete! Start the dev server with:        ║"
echo "║      pnpm dev                                          ║"
echo "║                                                        ║"
echo "║  Web:   http://localhost:3000                          ║"
echo "║  Admin: http://localhost:3001                          ║"
echo "║  API:   http://localhost:4000/api/v1                   ║"
echo "║                                                        ║"
echo "║  Admin login: admin@pcplatform.in / Admin@123456       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
