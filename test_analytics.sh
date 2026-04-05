#!/bin/bash

# Test script to generate analytics data

echo "🧪 Testing Analytics System..."
echo ""

# Test 1: Search API
echo "1️⃣ Testing Search API..."
curl -s -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Mumbai",
    "checkIn": "2026-05-25",
    "checkOut": "2026-05-26",
    "rooms": [{"adults": 2, "children": 0}],
    "currency": "INR",
    "nationality": "106"
  }' > /dev/null
echo "✅ Search completed"

# Test 2: Another search
echo "2️⃣ Testing another search..."
curl -s -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Delhi",
    "checkIn": "2026-06-01",
    "checkOut": "2026-06-02",
    "rooms": [{"adults": 1, "children": 0}],
    "currency": "INR",
    "nationality": "106"
  }' > /dev/null
echo "✅ Search completed"

# Test 3: Track custom event
echo "3️⃣ Tracking custom event..."
curl -s -X POST http://localhost:8000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test_event",
    "data": {"message": "Testing analytics system"}
  }' > /dev/null
echo "✅ Event tracked"

# Wait a moment
sleep 1

# Test 4: Get analytics stats
echo ""
echo "📊 Fetching Analytics Stats..."
echo ""
curl -s 'http://localhost:8000/api/analytics/stats?hours=1' | python -m json.tool

echo ""
echo "✅ Analytics test complete!"
echo ""
echo "🌐 View dashboard at: http://localhost:8000/ui/dashboard"
