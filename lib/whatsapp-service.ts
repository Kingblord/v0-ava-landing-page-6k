import makeWASocket, { DisconnectReason, WASocket } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import { db } from './firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

interface SessionData {
  credentials?: any
  qrCode?: string
  connected: boolean
  phoneNumber?: string
  lastError?: string
  createdAt: number
}

// In-memory store for active sockets and QR codes
const activeSockets = new Map<string, WASocket>()
const qrCodes = new Map<string, string>()
const sessionStates = new Map<string, SessionData>()

export class WhatsAppService {
  private static instance: WhatsAppService
  
  private constructor() {}

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService()
    }
    return WhatsAppService.instance
  }

  async connect(userId: string): Promise<void> {
    try {
      console.log('[WhatsApp] Initiating connection for user:', userId)

      // Check if already connecting
      if (activeSockets.has(userId)) {
        throw new Error('Connection already in progress for this user')
      }

      // Create socket
      const socket = makeWASocket({
        version: [2, 3000, 1015177655],
        logger: undefined,
        printQRInTerminal: false,
        browser: ['AVA', 'Chrome', '120.0'],
        syncFullHistory: false,
      })

      // Handle QR code
      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
          console.log('[WhatsApp] QR generated for user:', userId)
          const qrString = await QRCode.toDataURL(qr)
          qrCodes.set(userId, qrString)

          // Save to Firestore
          await setDoc(
            doc(db, 'whatsapp_sessions', userId),
            {
              qrCode: qrString,
              status: 'qr_pending',
              updatedAt: Date.now(),
            },
            { merge: true }
          )
        }

        if (connection === 'open') {
          console.log('[WhatsApp] Connected for user:', userId)
          const phoneNumber = socket.user?.id.split(':')[0]

          // Save session to Firestore
          await setDoc(
            doc(db, 'whatsapp_sessions', userId),
            {
              phoneNumber,
              status: 'connected',
              connected: true,
              lastConnected: Date.now(),
              updatedAt: Date.now(),
            },
            { merge: true }
          )

          sessionStates.set(userId, {
            connected: true,
            phoneNumber,
            createdAt: Date.now(),
          })

          qrCodes.delete(userId)
        }

        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as any)?.output?.statusCode !==
            DisconnectReason.loggedOut

          console.log('[WhatsApp] Disconnected for user:', userId, 'shouldReconnect:', shouldReconnect)

          if (shouldReconnect) {
            setTimeout(() => this.connect(userId).catch(console.error), 3000)
          }

          // Clear from memory
          activeSockets.delete(userId)
          qrCodes.delete(userId)
          sessionStates.delete(userId)

          // Update Firestore
          await setDoc(
            doc(db, 'whatsapp_sessions', userId),
            {
              status: 'disconnected',
              connected: false,
              updatedAt: Date.now(),
            },
            { merge: true }
          )
        }
      })

      // Handle incoming messages
      socket.ev.on('messages.upsert', async (event) => {
        const message = event.messages[0]
        if (message.key.fromMe) return

        console.log('[WhatsApp] Message received:', {
          from: message.key.remoteJid,
          text: message.message?.conversation,
        })

        // TODO: Process message through AI and send response
      })

      // Save socket
      activeSockets.set(userId, socket)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      console.error('[WhatsApp] Connection error:', error)

      await setDoc(
        doc(db, 'whatsapp_sessions', userId),
        {
          status: 'error',
          lastError: error,
          updatedAt: Date.now(),
        },
        { merge: true }
      )

      throw err
    }
  }

  async disconnect(userId: string): Promise<void> {
    try {
      const socket = activeSockets.get(userId)
      if (socket) {
        await socket.logout()
        socket.end(undefined)
        activeSockets.delete(userId)
      }

      qrCodes.delete(userId)
      sessionStates.delete(userId)

      // Update Firestore
      await setDoc(
        doc(db, 'whatsapp_sessions', userId),
        {
          status: 'disconnected',
          connected: false,
          updatedAt: Date.now(),
        },
        { merge: true }
      )

      console.log('[WhatsApp] Disconnected user:', userId)
    } catch (err) {
      console.error('[WhatsApp] Disconnect error:', err)
      throw err
    }
  }

  async getStatus(userId: string): Promise<any> {
    try {
      // Check Firestore first
      const doc_ref = doc(db, 'whatsapp_sessions', userId)
      const snap = await getDoc(doc_ref)

      if (snap.exists()) {
        const data = snap.data()
        return {
          status: data.status || 'disconnected',
          phoneNumber: data.phoneNumber,
          connected: data.connected || false,
          lastConnected: data.lastConnected,
          qrCode: qrCodes.get(userId),
          error: data.lastError,
        }
      }

      // Not in Firestore, check memory
      if (activeSockets.has(userId)) {
        return {
          status: 'connecting',
          qrCode: qrCodes.get(userId),
          connected: false,
        }
      }

      return {
        status: 'disconnected',
        connected: false,
      }
    } catch (err) {
      console.error('[WhatsApp] Status error:', err)
      return { status: 'error', connected: false }
    }
  }

  async getQR(userId: string): Promise<{ qrCode: string }> {
    const qrCode = qrCodes.get(userId)
    if (!qrCode) {
      throw new Error('QR code not available. Start connection first.')
    }
    return { qrCode }
  }

  async reconnect(userId: string): Promise<void> {
    await this.disconnect(userId).catch(() => {})
    await new Promise((r) => setTimeout(r, 1000))
    await this.connect(userId)
  }

  async sendMessage(to: string, message: string): Promise<void> {
    // TODO: Implement message sending through Baileys socket
    console.log('[WhatsApp] Sending message to:', to, 'message:', message)
  }
}
