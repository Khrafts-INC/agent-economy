#!/bin/bash
# Agent Economy - USDC Escrow Demo Script
# Circle USDC Hackathon - Agentic Commerce Track
#
# This script demonstrates the complete flow:
# 1. Two agents register
# 2. Provider creates a service  
# 3. Client creates USDC escrow
# 4. Client releases payment on completion
# 5. Provider reputation increases

set -e

API_URL="${API_URL:-http://localhost:3001}"

echo "🐚 Agent Economy - USDC Escrow Demo"
echo "===================================="
echo ""
echo "API: $API_URL"
echo ""

# Check API status
echo "📡 Checking API status..."
STATUS=$(curl -s "$API_URL/escrow/status")
echo "$STATUS" | jq .
echo ""

MOCK_MODE=$(echo "$STATUS" | jq -r '.mockMode')
if [ "$MOCK_MODE" = "true" ]; then
  echo "⚠️  Running in MOCK MODE (no real USDC)"
  echo ""
fi

# Step 1: Register agents
echo "👤 Step 1: Register Client (Alice)"
ALICE_RESP=$(curl -s -X POST "$API_URL/agents" \
  -H "Content-Type: application/json" \
  -d '{"name": "DemoAlice", "bio": "Demo client agent"}')
ALICE_ID=$(echo "$ALICE_RESP" | jq -r '.id // .agent.id // empty')

if [ -z "$ALICE_ID" ]; then
  echo "Using existing agent (rate limited)..."
  ALICE_ID=$(curl -s "$API_URL/agents" | jq -r '.agents[0].id')
fi
echo "Alice ID: $ALICE_ID"
echo ""

echo "👤 Step 1b: Register Provider (Bob)"
BOB_RESP=$(curl -s -X POST "$API_URL/agents" \
  -H "Content-Type: application/json" \
  -d '{"name": "DemoBob", "bio": "Demo service provider"}')
BOB_ID=$(echo "$BOB_RESP" | jq -r '.id // .agent.id // empty')

if [ -z "$BOB_ID" ]; then
  echo "Using existing agent (rate limited)..."
  BOB_ID=$(curl -s "$API_URL/agents" | jq -r '.agents[1].id')
fi
echo "Bob ID: $BOB_ID"
echo ""

# Step 2: Create service
echo "🛠️  Step 2: Bob creates a service"
SERVICE_RESP=$(curl -s -X POST "$API_URL/services" \
  -H "Content-Type: application/json" \
  -d "{
    \"providerId\": \"$BOB_ID\",
    \"title\": \"Smart Contract Review\",
    \"description\": \"Security audit for your Solidity contracts\",
    \"category\": \"development\",
    \"basePrice\": 5
  }")
SERVICE_ID=$(echo "$SERVICE_RESP" | jq -r '.id // .service.id')
echo "Service ID: $SERVICE_ID"
echo "$SERVICE_RESP" | jq '{title: .title, price: .basePrice}'
echo ""

# Step 3: Check wallets
echo "💰 Step 3: Check USDC wallets"
echo "Alice's wallet:"
curl -s "$API_URL/escrow/wallet/$ALICE_ID" | jq '{wallet: .wallet, balance: .balance}'
echo ""
echo "Bob's wallet:"
curl -s "$API_URL/escrow/wallet/$BOB_ID" | jq '{wallet: .wallet, balance: .balance}'
echo ""

# Step 4: Create escrow
echo "🔐 Step 4: Alice creates USDC escrow for service"
ESCROW_RESP=$(curl -s -X POST "$API_URL/escrow" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientAgentId\": \"$ALICE_ID\",
    \"serviceId\": \"$SERVICE_ID\",
    \"amount\": \"15.00\",
    \"timeoutHours\": 24
  }")
ESCROW_ID=$(echo "$ESCROW_RESP" | jq -r '.escrowId')
echo "Escrow ID: $ESCROW_ID"
echo "$ESCROW_RESP" | jq '{status: .status, amount: .amount, txHash: .txHash, mockMode: .mockMode}'
echo ""

# Step 5: Bob completes work (simulated)
echo "✅ Step 5: Bob completes the work..."
echo "(In a real scenario, Bob would deliver the service here)"
sleep 1
echo ""

# Step 6: Release payment
echo "💸 Step 6: Alice releases payment to Bob"
RELEASE_RESP=$(curl -s -X POST "$API_URL/escrow/$ESCROW_ID/release" \
  -H "Content-Type: application/json" \
  -d "{\"clientAgentId\": \"$ALICE_ID\"}")
echo "$RELEASE_RESP" | jq '{status: .status, txHash: .txHash, message: .message}'
echo ""

# Step 7: Check updated reputation
echo "📊 Step 7: Bob's updated reputation"
curl -s "$API_URL/agents/$BOB_ID" | jq '{name: .name, reputationScore: .reputationScore, jobsCompleted: .totalJobsCompleted}'
echo ""

echo "===================================="
echo "✨ Demo complete!"
echo ""
echo "This demonstrates agent-to-agent commerce with USDC escrow."
echo "In production, USDC would be locked in a smart contract on Base."
echo ""
echo "Learn more: https://github.com/Khrafts-INC/agent-economy"
