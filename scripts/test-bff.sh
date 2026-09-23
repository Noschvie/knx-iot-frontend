#!/bin/bash
# BFF Test Script

set -e

BFF_URL="http://localhost:3000"
RAFFSTORE_ID="rs-1"

echo "🧪 BFF Testing Script"
echo "====================="
echo ""

# Health check
echo "1️⃣  Health Check..."
curl -s "$BFF_URL/health" | jq .
echo ""

# Info
echo "2️⃣  Server Info..."
curl -s "$BFF_URL/info" | jq .
echo ""

# Get all raffstores
echo "3️⃣  Get All Raffstores..."
curl -s "$BFF_URL/api/raffstores" | jq .
echo ""

# Get single raffstore
echo "4️⃣  Get Single Raffstore ($RAFFSTORE_ID)..."
curl -s "$BFF_URL/api/raffstores/$RAFFSTORE_ID" | jq .
echo ""

# Move up
echo "5️⃣  Move Up ($RAFFSTORE_ID)..."
curl -s -X POST "$BFF_URL/api/raffstores/$RAFFSTORE_ID/moveUp" | jq .
echo ""

# Set height
echo "6️⃣  Set Height ($RAFFSTORE_ID to step 2)..."
curl -s -X PUT "$BFF_URL/api/raffstores/$RAFFSTORE_ID/height" \
  -H "Content-Type: application/json" \
  -d '{"heightStep": 2}' | jq .
echo ""

# Set position
echo "7️⃣  Set Position ($RAFFSTORE_ID to height=1, angle=1)..."
curl -s -X PUT "$BFF_URL/api/raffstores/$RAFFSTORE_ID/position" \
  -H "Content-Type: application/json" \
  -d '{"heightStep": 1, "angleStep": 1}' | jq .
echo ""

# Apply favorite
echo "8️⃣  Apply Favorite ($RAFFSTORE_ID)..."
curl -s -X POST "$BFF_URL/api/raffstores/$RAFFSTORE_ID/favorite" \
  -H "Content-Type: application/json" \
  -d '{
    "favorite": {
      "label": "Sonnenschutz",
      "heightStep": 1,
      "angleStep": 1
    }
  }' | jq .
echo ""

# Group command
echo "9️⃣  Group Command (EG up)..."
curl -s -X POST "$BFF_URL/api/raffstores/group/EG/up" | jq .
echo ""

echo "✅ All tests completed!"
