#!/bin/bash

echo ""
echo "============================================"
echo "   Starting Tickets Wave Beta..."
echo "============================================"
echo ""

cd "$(dirname "$0")"

# Check if pnpm is available, fallback to npm
if command -v pnpm &> /dev/null; then
    pnpm dev
else
    echo "Using npm instead of pnpm..."
    npm run dev
fi
