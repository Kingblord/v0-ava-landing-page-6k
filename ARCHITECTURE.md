# System Architecture

## Overview

The AroMsg system uses a microservices architecture with real-time message synchronization via Firestore snapshots. The frontend (Next.js) communicates with multiple backend services:

1. **Next.js Backend** - Manages UI endpoints, business logic, and message fetching
2. **WhatsApp Gateway** - Maintains Baileys sessions and sends/receives WhatsApp messages
3. **Webhook Service** - Standalone AI service handling message processing and responses (deployed separately)

## Message Flow

### Incoming Message

WhatsApp → Gateway → Webhook Service → Firestore → Next.js Frontend

### Outgoing Message

Next.js Frontend → Backend → Gateway → WhatsApp

## Key Files

### Frontend
- app/dashboard/whatsapp/page.tsx - Real-time snapshot listeners
- app/api/whatsapp/send-message/route.ts - Manual message sending
- app/api/business/[userId]/route.ts - Business settings

### Backend Services
- whatsapp-gateway/create-session.ts - Maintains Baileys sessions
- webhook-service/index.js - Production webhook service

## Real-Time Architecture

Uses Firestore onSnapshot listeners instead of polling for instant message updates with zero lag.

## Environment Variables

### Next.js Backend
NEXT_PUBLIC_GATEWAY_URL, INTERNAL_API_KEY

### WhatsApp Gateway
BACKEND_URL, INTERNAL_API_KEY, FIREBASE_PROJECT_ID

### Webhook Service
INTERNAL_API_KEY, GATEWAY_URL, OPENROUTER_API_KEY, FIREBASE credentials
