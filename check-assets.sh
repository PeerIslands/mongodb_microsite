#!/bin/bash

# Asset Verification Script for Accelerator Library

echo "🔍 Checking Accelerator Assets..."
echo ""

ASSETS_DIR="frontend/public/assets"
MISSING_COUNT=0
FOUND_COUNT=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((FOUND_COUNT++))
    else
        echo -e "${RED}✗${NC} $1 ${YELLOW}(MISSING)${NC}"
        ((MISSING_COUNT++))
    fi
}

echo "📸 Checking Card Images..."
check_file "$ASSETS_DIR/accelerators/cards/accelerator-hbase.png"
check_file "$ASSETS_DIR/accelerators/cards/accelerator-cassandra.png"
check_file "$ASSETS_DIR/accelerators/cards/accelerator-cosmos.png"
check_file "$ASSETS_DIR/accelerators/cards/accelerator-mcp.png"
echo ""

echo "🎨 Checking Logos..."
check_file "$ASSETS_DIR/accelerators/logos/logo-hbase.png"
check_file "$ASSETS_DIR/accelerators/logos/logo-cassandra.png"
check_file "$ASSETS_DIR/accelerators/logos/logo-cosmos.png"
check_file "$ASSETS_DIR/accelerators/logos/logo-mcp.png"
echo ""

echo "🖼️  Checking Hero Images..."
check_file "$ASSETS_DIR/accelerators/heroes/hero-hbase.jpg"
check_file "$ASSETS_DIR/accelerators/heroes/hero-cassandra.jpg"
check_file "$ASSETS_DIR/accelerators/heroes/hero-cosmos.jpg"
check_file "$ASSETS_DIR/accelerators/heroes/hero-mcp.jpg"
echo ""

echo "🎬 Checking Video Thumbnails..."
check_file "$ASSETS_DIR/accelerators/videos/video-thumbnail-hbase.jpg"
check_file "$ASSETS_DIR/accelerators/videos/video-thumbnail-cassandra.jpg"
check_file "$ASSETS_DIR/accelerators/videos/video-thumbnail-cosmos.jpg"
check_file "$ASSETS_DIR/accelerators/videos/video-thumbnail-mcp.jpg"
echo ""

echo "🔧 Checking Icons..."
check_file "$ASSETS_DIR/icons/icon-migration.svg"
check_file "$ASSETS_DIR/icons/icon-modernization.svg"
check_file "$ASSETS_DIR/icons/icon-integration.svg"
check_file "$ASSETS_DIR/icons/icon-download.svg"
check_file "$ASSETS_DIR/icons/icon-play.svg"
check_file "$ASSETS_DIR/icons/icon-arrow.svg"
echo ""

echo "═══════════════════════════════════════"
echo "📊 Summary"
echo "═══════════════════════════════════════"
echo -e "${GREEN}Found:${NC} $FOUND_COUNT assets"
echo -e "${RED}Missing:${NC} $MISSING_COUNT assets"
echo ""

if [ $MISSING_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All assets are in place!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Please export missing assets from Figma${NC}"
    echo ""
    echo "Follow the guide:"
    echo "  📖 FIGMA_ASSET_EXPORT_GUIDE.md"
    echo ""
    echo "Figma Link:"
    echo "  🔗 https://www.figma.com/design/j8Qk5GO0T05xEG5xBrgu80/PeerAIXmangoDB?node-id=76-2&m=dev"
    exit 1
fi

