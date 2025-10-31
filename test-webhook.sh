#!/bin/bash

# Test Webhook Script for Meraki
echo "🧪 Testing Meraki Webhook Endpoints..."

# Set your server URL
SERVER_URL="http://localhost:5000"
# For production, use: SERVER_URL="https://your-domain.com"

echo ""
echo "📞 Testing Ultravox call.ended webhook..."

# Test call.ended event
curl -X POST "$SERVER_URL/ultravox/events" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call.ended",
    "call": {
      "callId": "bdf732a3-9949-419b-af37-b0ecead86347",
      "status": "ended",
      "endedAt": "2025-10-31T10:30:00Z"
    },
    "timestamp": "2025-10-31T10:30:00Z"
  }' \
  -w "\nHTTP Status: %{http_code}\n"