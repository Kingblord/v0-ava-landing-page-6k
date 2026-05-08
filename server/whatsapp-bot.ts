#!/usr/bin/env node
/**
 * Dedicated WhatsApp Bot Server using Baileys
 * Run this separately from Vercel: node server/whatsapp-bot.ts
 * 
 * This server maintains long-lived WhatsApp connections via Baileys
 * and exposes a simple HTTP API for Vercel to communicate with.
 * 
 * Environment variables:
 * - FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL (Firebase config)
 * - BOT_PORT (default 3001)
 */

import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import express, { Request, Response } from 'express'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = express()
app.use(express.json())

// Map of userId -> { socket, qrCode, status, phoneNumber }
const activeSessions = new Map<string, any>()

// Initialize Firebase Admin
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}

initializeApp({ credential: cert(firebaseConfig as any) })
const db = getFirestore()

/**
 * POST /connect
 * Initiate WhatsApp connection for a user
 */
app.post('/connect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    if (activeSessions.has(userId)) {
      return res.status(400).json({ error: 'Session already active for this user' })
    }

    console.log(`[WhatsApp] Connecting user: ${userId}`)

    // Create new socket
    const socket = makeWASocket({
      version: [2, 3000, 1015177655],
      logger: undefined,
      printQRInTerminal: false,
      browser: ['AVA Bot', 'Chrome', '120.0'],
      syncFullHistory: false,
    })

    // Handle connection events
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      // QR code generated
      if (qr) {
        try {
          const qrDataURL = await QRCode.toDataURL(qr)
          activeSessions.set(userId, {
            socket,
            qrCode: qrDataURL,
            status: 'qr_pending',
            createdAt: Date.now(),
          })

          // Save to Firestore
          await db.collection('whatsapp_sessions').doc(userId).set(
            {
              status: 'qr_pending',
              qrCode: qrDataURL,
              updatedAt: new Date(),
            },
            { merge: true }
          )

          console.log(`[WhatsApp] QR generated for ${userId}`)
        } catch (err) {
          console.error(`[WhatsApp] QR generation error:`, err)
        }
      }

      // Connected successfully
      if (connection === 'open') {
        const phoneNumber = socket.user?.id.split(':')[0]

        activeSessions.set(userId, {
          socket,
          status: 'connected',
          phoneNumber,
          createdAt: Date.now(),
        })

        // Update Firestore
        await db.collection('whatsapp_sessions').doc(userId).set(
          {
            status: 'connected',
            phoneNumber,
            connected: true,
            lastConnected: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        )

        console.log(`[WhatsApp] Connected user ${userId} with phone: ${phoneNumber}`)
      }

      // Disconnected
      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !==
          DisconnectReason.loggedOut

        console.log(
          `[WhatsApp] Disconnected user ${userId}, reconnect: ${shouldReconnect}`
        )

        activeSessions.delete(userId)

        await db.collection('whatsapp_sessions').doc(userId).set(
          {
            status: 'disconnected',
            connected: false,
            updatedAt: new Date(),
          },
          { merge: true }
        )

        if (shouldReconnect) {
          setTimeout(() => {
            console.log(`[WhatsApp] Auto-reconnecting ${userId}...`)
            socket.ws?.close()
          }, 3000)
        }
      }
    })

    // Handle incoming messages
    socket.ev.on('messages.upsert', async (event) => {
      const message = event.messages[0]
      if (message.key.fromMe) return

      const userMessage = message.message?.conversation ||
        message.message?.extendedTextMessage?.text || ''
      const remoteJid = message.key.remoteJid || ''

      if (!userMessage) return

      console.log(`[WhatsApp] Message from ${remoteJid}: ${userMessage}`)

      try {
        // Fetch business config and products from Firestore
        const businessSnap = await db.collection('businesses').doc(userId).get()
        const business = businessSnap.data()

        if (!business) {
          await socket.sendMessage(remoteJid, {
            text: 'Business configuration not found.',
          })
          return
        }

        // Call Vercel API to process through AI (webhook to your Vercel instance)
        const vercelApiUrl = process.env.VERCEL_API_URL || 'http://localhost:3000'
        const aiResponse = await fetch(`${vercelApiUrl}/api/whatsapp/process-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userMessage,
            remoteJid,
            business,
          }),
        }).then((r) => r.json())

        // Send AI response back through WhatsApp
        await socket.sendMessage(remoteJid, { text: aiResponse.reply })

        console.log(`[WhatsApp] Response sent to ${remoteJid}`)
      } catch (err) {
        console.error(`[WhatsApp] Error processing message:`, err)
        await socket
          .sendMessage(remoteJid, {
            text: 'Sorry, I encountered an error. Please try again.',
          })
          .catch(console.error)
      }
    })

    res.json({ success: true, status: 'connecting' })
  } catch (error) {
    console.error('[connect] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to connect',
    })
  }
})

/**
 * GET /status
 * Get connection status for a user
 */
app.get('/status/:userId', (req: Request, res: Response) => {
  const { userId } = req.params
  const session = activeSessions.get(userId)

  if (!session) {
    return res.json({ status: 'disconnected', connected: false })
  }

  res.json({
    status: session.status,
    phoneNumber: session.phoneNumber,
    connected: session.status === 'connected',
    qrCode: session.qrCode,
    createdAt: session.createdAt,
  })
})

/**
 * GET /qr
 * Get current QR code
 */
app.get('/qr/:userId', (req: Request, res: Response) => {
  const { userId } = req.params
  const session = activeSessions.get(userId)

  if (!session?.qrCode) {
    return res.status(404).json({ error: 'QR code not available' })
  }

  res.json({ qrCode: session.qrCode })
})

/**
 * POST /disconnect
 * Disconnect a user's session
 */
app.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    const session = activeSessions.get(userId)

    if (session?.socket) {
      await session.socket.logout()
      session.socket.end(undefined)
    }

    activeSessions.delete(userId)

    // Update Firestore
    await db.collection('whatsapp_sessions').doc(userId).set(
      {
        status: 'disconnected',
        connected: false,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('[disconnect] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to disconnect',
    })
  }
})

/**
 * POST /send-message
 * Send a message to a WhatsApp user (for proactive messaging)
 */
app.post('/send-message', async (req: Request, res: Response) => {
  try {
    const { userId, to, message } = req.body
    const session = activeSessions.get(userId)

    if (!session?.socket) {
      return res.status(400).json({ error: 'WhatsApp not connected for this user' })
    }

    await session.socket.sendMessage(to, { text: message })
    res.json({ success: true })
  } catch (error) {
    console.error('[send-message] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send message',
    })
  }
})

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', activeSessions: activeSessions.size })
})

const PORT = parseInt(process.env.BOT_PORT || '3001')
app.listen(PORT, () => {
  console.log(`[WhatsApp Bot] Server running on port ${PORT}`)
  console.log(`[WhatsApp Bot] Health check: http://localhost:${PORT}/health`)
})
