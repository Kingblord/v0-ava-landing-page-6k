export interface Business {
  id: string
  name: string
  email: string
  whatsappPhone?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioWhatsappNumber?: string
  openrouterModel?: string
  avatarUrl?: string
  aiPersonality: string
  createdAt: number
}

export interface Product {
  id: string
  businessId: string
  name: string
  description: string
  price: number
  minPrice: number
  negotiationEnabled: boolean
  imageUrl?: string
  createdAt: number
}

export interface Order {
  id: string
  businessId: string
  userId: string        // customer WhatsApp number
  productId: string
  productName: string
  amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: number
}

export type ConversationState = 'browsing' | 'interested' | 'ordering'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  userId: string        // customer phone
  businessId: string
  messages: Message[]
  state: ConversationState
  lastActiveAt: number
}

export interface TestgroundConversationLog {
  id: string
  phoneNumber: string
  userMessage: string
  aiResponse: string
  aiState: ConversationState
  orderIntent?: {
    productId: string
    productName: string
    amount: number
  }
  createdAt: number
}

// ═════════════════════════════════════════════════════════════════════
// WhatsApp Integration Types (Baileys)
// ═════════════════════════════════════════════════════════════════════

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'qr_pending' | 'connected' | 'reconnecting'

export interface WhatsAppSession {
  userId: string
  phoneNumber: string
  connected: boolean
  sessionId: string
  lastSeen: number
  createdAt: number
  updatedAt: number
}

export interface MessagingProvider {
  name: string
  icon: React.ElementType
  status: WhatsAppStatus
  phoneNumber?: string
}

export interface WhatsAppProvider extends MessagingProvider {
  name: 'whatsapp'
  lastConnected?: number
  reconnectAttempts?: number
}
