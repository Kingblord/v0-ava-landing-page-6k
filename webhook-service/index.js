const express = require('express')
const dotenv = require('dotenv')
const axios = require('axios')
const admin = require('firebase-admin')

dotenv.config()

const app = express()
app.use(express.json())

// ========================
// ENVIRONMENT VARIABLES
// ========================
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free'
const PORT = process.env.PORT || 3000

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY is not set in .env file')
}

if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
  console.error('❌ Firebase credentials missing: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL')
  process.exit(1)
}

// ========================
// FIREBASE INITIALIZATION
// ========================
let db
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
    projectId: FIREBASE_PROJECT_ID,
  })
  db = admin.firestore()
  console.log('✅ Firebase Admin SDK initialized successfully')
} catch (err) {
  console.error('❌ Firebase initialization error:', err.message)
  process.exit(1)
}

// ========================
// AI RESPONSE USING OPENROUTER
// ========================

async function getAIResponse(userMessage, systemPrompt, userModel = null, conversationHistory = []) {
  try {
    const model = userModel || OPENROUTER_MODEL
    console.log('[AI] 🤖 Calling OpenRouter API with model:', model)

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt + '\n\n' + CRITICAL_DIRECTIVES,
          },
          ...conversationHistory.slice(-8).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          {
            role: 'user',
            content: userMessage,
          },
        ],
        tools: AI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.65,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://aromsg.up.railway.app',
          'X-Title': 'AroMsg WhatsApp AI Service',
        },
        timeout: 20000,
      }
    )

    const message = response.data.choices[0]?.message

    if (message.tool_calls?.length > 0) {
      console.log(`[AI] 🛠️ Tool called: ${message.tool_calls[0].function.name}`)
      return {
        type: 'tool_call',
        tool: message.tool_calls[0],
        content: message.content || '',
      }
    }

    const reply = message.content?.trim() || ERROR_MESSAGES.generic
    console.log('[AI] ✅ Text response received:', reply.substring(0, 100) + '...')

    return {
      type: 'text',
      content: reply,
    }
  } catch (error) {
    console.error('[AI] ❌ OpenRouter API Error:', error.response?.data || error.message)
    return {
      type: 'text',
      content: ERROR_MESSAGES.generic,
    }
  }
}

// ========================
// GET BUSINESS PREFERENCES
// ========================

async function getBusinessPreferences(businessId) {
  try {
    console.log('[DB] 📋 Fetching business preferences for:', businessId)
    const businessDoc = await db.collection('businesses').doc(businessId).get()
    if (!businessDoc.exists) {
      console.log('[DB] ⚠️ Business not found:', businessId)
      return null
    }
    const data = businessDoc.data()
    return {
      aiModel: data.openrouterModel || OPENROUTER_MODEL,
      aiPersonality: data.aiPersonality,
      currency: data.currency || 'NGN',
    }
  } catch (err) {
    console.error('[DB] Error fetching business preferences:', err.message)
    return null
  }
}

// ========================
// FIND BUSINESS FOR CUSTOMER
// ========================

async function findBusinessForCustomer(phoneNumber) {
  try {
    console.log(`[DB] 🔍 Finding business for customer: ${phoneNumber}`)

    // Query contacts collection across all businesses
    const contactsSnapshot = await db
      .collectionGroup('contacts')
      .where('phone', '==', phoneNumber.replace(/\D/g, ''))
      .limit(1)
      .get()

    if (contactsSnapshot.empty) {
      console.log(`[DB] ⚠️ No contact found for: ${phoneNumber}`)
      return null
    }

    const contactDoc = contactsSnapshot.docs[0]
    const contactData = contactDoc.data()
    const businessId = contactData.businessId

    console.log(`[DB] ✅ Found business: ${businessId}`)
    return businessId
  } catch (err) {
    console.error('[DB] ❌ Error finding business:', err.message)
    return null
  }
}

// ========================
// GET BUSINESS CONFIG & PRODUCTS
// ========================

async function getBusinessContext(businessId) {
  try {
    console.log(`[DB] 📦 Loading business config for: ${businessId}`)

    // Get business doc
    const businessDoc = await db.collection('businesses').doc(businessId).get()
    if (!businessDoc.exists) {
      console.log(`[DB] ❌ Business not found: ${businessId}`)
      return null
    }

    const businessData = businessDoc.data()
    console.log(`[DB] ✅ Business loaded: ${businessData.name}`)

    // Get products
    let productsContext = ''
    try {
      const productsSnapshot = await db
        .collection('businesses')
        .doc(businessId)
        .collection('products')
        .orderBy('createdAt', 'desc')
        .get()

      if (!productsSnapshot.empty) {
        console.log(`[DB] 🛍️ Found ${productsSnapshot.size} products`)
        const productsList = productsSnapshot.docs
          .map((doc) => {
            const product = doc.data()
            return `- ${product.name} ($${product.price}${
              product.negotiationEnabled ? ', negotiable' : ''
            }): ${product.description}`
          })
          .join('\n')

        productsContext = '\n\nAvailable products:\n' + productsList
      }
    } catch (err) {
      console.error('[DB] ⚠️ Error fetching products:', err.message)
    }

    return {
      businessId,
      businessName: businessData.name,
      aiPersonality: businessData.aiPersonality,
      productsContext,
    }
  } catch (err) {
    console.error('[DB] ❌ Error getting business context:', err.message)
    return null
  }
}

// ========================
// SAVE MESSAGE TO FIRESTORE
// ========================

async function saveMessage(businessId, phoneNumber, role, text, messageId) {
  try {
    const timestamp = Date.now()
    const normalizedPhone = phoneNumber.replace(/\D/g, '')

    await db
      .collection('businesses')
      .doc(businessId)
      .collection('whatsapp_messages')
      .add({
        contactJid: normalizedPhone,
        from: role === 'user' ? normalizedPhone : businessId,
        to: role === 'user' ? businessId : normalizedPhone,
        text,
        role,
        platform: 'whatsapp',
        messageId,
        timestamp,
        direction: role === 'user' ? 'incoming' : 'outgoing',
      })

    console.log(`[DB] ✅ Message saved: ${role} from ${phoneNumber}`)
    return true
  } catch (err) {
    console.error('[DB] Save error:', err.message)
    return false
  }
}

// ========================
// CREATE ORDER
// ========================

async function createOrder(businessId, phoneNumber, productName, productPrice, quantity = 1) {
  try {
    console.log('[DB] 💰 Creating order for:', phoneNumber, 'Product:', productName)
    
    const normalizedPhone = phoneNumber.replace(/\D/g, '')
    const orderId = await db.collection('orders').add({
      businessId,
      userId: normalizedPhone,
      productName,
      amount: productPrice * quantity,
      status: 'pending',
      quantity,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    console.log('[DB] ✅ Order created with ID:', orderId.id)
    return {
      id: orderId.id,
      businessId,
      userId: normalizedPhone,
      productName,
      amount: productPrice * quantity,
      status: 'pending',
      createdAt: Date.now(),
    }
  } catch (err) {
    console.error('[DB] Order creation error:', err.message)
    return null
  }
}

    await db
      .collection('businesses')
      .doc(businessId)
      .collection('whatsapp_messages')
      .add(messageDoc)

    console.log(`[DB] 💾 Message saved - Role: ${role}, Phone: ${normalizedPhone}`)
    return true
  } catch (err) {
    console.error('[DB] ❌ Error saving message:', err.message)
    return false
  }
}

// ========================
// SEND REPLY VIA GATEWAY
// ========================

async function sendReplyViaGateway(userId, phoneNumber, replyText) {
  try {
    console.log(`[GATEWAY] 📤 Sending reply to ${phoneNumber}`)

    const normalizedPhone = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`

    const response = await axios.post(
      `${GATEWAY_URL}/send-message`,
      {
        userId,
        to: normalizedPhone,
        text: replyText,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
        timeout: 10000,
      }
    )

    console.log(`[GATEWAY] ✅ Reply queued successfully`)
    return true
  } catch (err) {
    console.error('[GATEWAY] ❌ Failed to send reply:', err.message)
    return false
  }
}

// ========================
// AI ACTION TOOLS (Callable by LLM)
// ========================

async function getPaymentDetails(orderId) {
  try {
    console.log('[ACTION] 💳 getPaymentDetails called for order:', orderId)
    // TODO: Implement payment details retrieval
    // Query orders collection and return payment info
    return {
      status: 'pending',
      method: 'none',
      amount: 0,
      currency: 'NGN',
    }
  } catch (err) {
    console.error('[ACTION] Error getting payment details:', err.message)
    return null
  }
}

async function initiateNegotiation(orderId, productName, proposedPrice) {
  try {
    console.log('[ACTION] 💬 initiateNegotiation called for:', productName)
    // TODO: Implement negotiation logic
    // Create negotiation record and notify business
    return {
      success: true,
      negotiationId: `neg_${Date.now()}`,
      productName,
      proposedPrice,
      status: 'pending_approval',
    }
  } catch (err) {
    console.error('[ACTION] Error initiating negotiation:', err.message)
    return null
  }
}

async function checkInventory(productName) {
  try {
    console.log('[ACTION] 📦 checkInventory called for:', productName)
    // TODO: Implement inventory check
    // Query products and return stock status
    return {
      available: true,
      stock: 999,
      product: productName,
    }
  } catch (err) {
    console.error('[ACTION] Error checking inventory:', err.message)
    return null
  }
}

async function scheduleDelivery(orderId, preferredDate) {
  try {
    console.log('[ACTION] 🚚 scheduleDelivery called for order:', orderId)
    // TODO: Implement delivery scheduling
    // Save delivery preference and notify logistics
    return {
      success: true,
      deliveryId: `del_${Date.now()}`,
      orderId,
      preferredDate,
      status: 'scheduled',
    }
  } catch (err) {
    console.error('[ACTION] Error scheduling delivery:', err.message)
    return null
  }
}

async function applyPromoCode(code) {
  try {
    console.log('[ACTION] 🎟️  applyPromoCode called for:', code)
    // TODO: Implement promo code validation and discount
    // Query promo codes collection
    return {
      valid: false,
      code,
      discount: 0,
      message: 'Invalid or expired promo code',
    }
  } catch (err) {
    console.error('[ACTION] Error applying promo:', err.message)
    return null
  }
}

async function trackOrderStatus(orderId) {
  try {
    console.log('[ACTION] 📍 trackOrderStatus called for order:', orderId)
    // TODO: Implement order tracking
    // Query orders collection for status
    return {
      orderId,
      status: 'pending',
      lastUpdate: Date.now(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  } catch (err) {
    console.error('[ACTION] Error tracking order:', err.message)
    return null
  }
}

// ========================
// MAIN WEBHOOK ENDPOINT
// ========================

app.post('/webhook', async (req, res) => {
  try {
    // ========================
    // AUTHENTICATION
    // ========================
    const authHeader = req.headers.authorization

    if (!authHeader || authHeader !== `Bearer ${INTERNAL_API_KEY}`) {
      console.log('[AUTH] ❌ Unauthorized webhook attempt')
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { userId, from, text, platform, messageId, timestamp } = req.body

    console.log('\n' + '='.repeat(60))
    console.log('[WEBHOOK] 📨 WEBHOOK RECEIVED')
    console.log('='.repeat(60))
    console.log('[WEBHOOK] Payload:', JSON.stringify(req.body, null, 2))

    // ========================
    // VALIDATE PAYLOAD
    // ========================
    if (!userId || !from || !text) {
      console.log('[WEBHOOK] ❌ Missing required fields')
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const phoneNumber = from.replace('@s.whatsapp.net', '').replace('@lid', '')

    // ========================
    // SAVE INCOMING MESSAGE
    // ========================
    console.log('[WEBHOOK] 💾 Saving incoming message...')
    const incomingMessageId = messageId || `in_${Date.now()}`
    await saveMessage(userId, phoneNumber, 'user', text, incomingMessageId)

    // ========================
    // FIND BUSINESS FOR CUSTOMER (Optional - for future use)
    // ========================
    let businessId = userId
    console.log(`[WEBHOOK] 📍 Using businessId: ${businessId}`)

// ========================
// TOOL DEFINITIONS FOR AI
// ========================

const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'getProductList',
      description: 'Return list of all available products',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProductInfo',
      description: 'Get detailed info about a specific product',
      parameters: {
        type: 'object',
        properties: { productName: { type: 'string' } },
        required: ['productName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createOrder',
      description: 'Create order when customer is ready to buy',
      parameters: {
        type: 'object',
        properties: {
          productName: { type: 'string' },
          quantity: { type: 'number', default: 1 },
          customerName: { type: 'string' },
        },
        required: ['productName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPaymentDetails',
      description: 'Get payment methods and instructions',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'checkOrderStatus',
      description: 'Check status of an existing order',
      parameters: {
        type: 'object',
        properties: { orderId: { type: 'string' } },
        required: ['orderId'],
      },
    },
  },
]

// ========================
// CRITICAL OPERATIONAL DIRECTIVES
// ========================

const CRITICAL_DIRECTIVES = `
**CRITICAL OPERATIONAL DIRECTIVES:**
1. First, think step by step about the user's intent.
2. Decide if you need to use a tool to extract structured product data or take action (like checking/creating orders).
3. Use tools when the user asks about products, pricing, availability, or orders.
4. When a tool returns data, do NOT show raw brackets or code syntax to the user. Instead, process that information and respond like a natural, smooth, empathetic human salesperson.
5. If an item is marked as negotiable, do not just state 'it is negotiable'. Engage the user conversationally (e.g., ask for their target budget or offer a minor concession to close the sale).
6. Be concise, persuasive, and natural in your final reply. Never make up product info.
`

// ========================
// REFINEMENT DIRECTIVES FOR TOOL RESULTS
// ========================

const getRefinementDirectives = (businessName, currency) => `You are a smooth, persuasive AI Sales Assistant for ${businessName}.

**CRITICAL OPERATIONAL DIRECTIVES:**
1. Answer the customer's request conversationally using the database data provided above.
2. Format all prices matching the profile's preferred currency system: "${currency}". (e.g., If NGN use ₦, if USD use $, if EUR use €, etc.)
3. If the item status shows it is negotiable, handle it gracefully like a master human negotiator. Ask for their target price range or extend a polite opening offer to secure the order.
4. Do NOT output raw variable templates, code blocks, or JavaScript structural braces to the customer.
5. Keep your response concise, friendly, and structured perfectly for a short WhatsApp chat message.
`

// ========================
// ERROR FALLBACK MESSAGES
// ========================

const ERROR_MESSAGES = {
  generic: "Sorry, I'm having trouble right now. Please try again.",
  aiGeneration: "I'm processing your request right now. Please give me a moment.",
  toolExecution: 'Let me process that information for you.',
  orderCreation: 'I\'m having trouble creating your order. Please try again or contact support.',
  paymentDetails: "I'll get you our payment details. One moment please.",
  orderStatus: 'Let me check that order status for you.',
  productNotFound: "I couldn't find that product. Would you like to see what we have available?",
  inventory: "I'm checking our inventory for you.",
  delivery: "I'll help you schedule delivery. Let me get that set up.",
  promo: "I'll verify that promo code for you.",
  negotiation: "Great! Let's work out a deal. What budget did you have in mind?",
}

// ========================
// TOOL EXECUTION LAYER
// ========================

async function executeTool(toolCall, businessId, phoneNumber, products = []) {
  const { name, arguments: argsStr } = toolCall.function
  const args = JSON.parse(argsStr || '{}')

  console.log(`[TOOL] 🔧 Executing ${name} with args:`, args)

  switch (name) {
    case 'getProductList': {
      if (!products || products.length === 0) return ERROR_MESSAGES.productNotFound

      return (
        'Here are our products:\n' +
        products
          .map((p) => {
            const negotiable = p.negotiationEnabled ? ' [Negotiable]' : ''
            return `• ${p.name} (${p.price})${negotiable}`
          })
          .join('\n') +
        '\n\nWhich one are you interested in?'
      )
    }

    case 'getProductInfo': {
      const productNameArg = args.productName || ''
      const product = products.find((p) =>
        p.name.toLowerCase().includes(productNameArg.toLowerCase())
      )

      if (product) {
        const status = product.negotiationEnabled ? 'Negotiable' : 'Fixed price'
        return `Product Details:\n- Name: ${product.name}\n- Price: ${product.price}\n- Description: ${product.description || 'No description provided.'}\n- Status: ${status}`
      }

      return ERROR_MESSAGES.productNotFound
    }

    case 'createOrder': {
      return `✅ Order started for **${args.productName}**.\nPlease provide your full name to complete the order.`
    }

    case 'getPaymentDetails': {
      return 'We accept Bank Transfer, USSD, and Card payments.\nWould you like our account details?'
    }

    case 'checkOrderStatus': {
      return `Let me check the status of order #${args.orderId || 'N/A'} for you.`
    }

    default: {
      return ERROR_MESSAGES.generic
    }
  }
}
    console.log('[WEBHOOK] 🔧 Loading business preferences...')
    const prefs = await getBusinessPreferences(businessId)
    
    if (!prefs) {
      console.log('[WEBHOOK] ⚠️ Could not load preferences, using defaults')
    }
    const userModel = prefs?.aiModel || OPENROUTER_MODEL
    const userCurrency = prefs?.currency || 'NGN'

    // ========================
    // GET BUSINESS CONTEXT
    // ========================
    console.log('[WEBHOOK] 📦 Loading business context...')
    const context = await getBusinessContext(businessId)

    if (!context) {
      console.log('[WEBHOOK] ❌ Could not load business context')
      return res.status(404).json({ success: false, error: 'Business context not found' })
    }

    // ========================
    // BUILD SYSTEM PROMPT
    // ========================
    const personality = context.aiPersonality || 'You are a friendly and professional sales assistant.'

    const systemPrompt =
      `You are an AI sales assistant for ${context.businessName}.\n\n` +
      `${personality}${context.productsContext}\n\n` +
      `Keep replies concise (1-3 sentences). Never make up product information. ` +
      `If a customer asks about negotiation on a product, check if negotiation is available. ` +
      `Never reveal you are an AI unless directly asked.`

    console.log('[WEBHOOK] 🧠 System prompt prepared')

    // ========================
    // GENERATE AI RESPONSE (using user's preferred model)
    // ========================
    console.log('[WEBHOOK] 🤖 Generating AI response with model:', userModel)
    const aiResult = await getAIResponse(text, systemPrompt, userModel, [])

    let replyText

    // ========================
    // HANDLE TOOL CALLS
    // ========================
    if (aiResult.type === 'tool_call') {
      console.log('[WEBHOOK] 🔧 AI called tool:', aiResult.tool.function.name)

      // Execute the tool and get structured data
      const toolResult = await executeTool(aiResult.tool, businessId, phoneNumber, context.products || [])

      console.log('[WEBHOOK] 📊 Tool result:', toolResult.substring(0, 100))
      console.log('[WEBHOOK] 🔄 Re-routing tool data to AI for natural language synthesis...')

      // Refine the tool result with secondary AI call
      try {
        const refinementPrompt =
          getRefinementDirectives(context.businessName, userCurrency) +
          '\n\nDatabase Response:\n"""' +
          toolResult +
          '"""'

        const refinedResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: userModel,
            messages: [
              {
                role: 'system',
                content: refinementPrompt,
              },
              {
                role: 'user',
                content: text,
              },
            ],
            temperature: 0.7,
            max_tokens: 450,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://aromsg.up.railway.app',
              'X-Title': 'AroMsg WhatsApp AI Service',
            },
            timeout: 20000,
          }
        )

        replyText =
          refinedResponse.data.choices[0]?.message?.content?.trim() ||
          ERROR_MESSAGES.toolExecution
        console.log('[WEBHOOK] ✅ Refined response:', replyText.substring(0, 100))
      } catch (refineErr) {
        console.error('[WEBHOOK] ⚠️ Refinement error:', refineErr.message)
        replyText = toolResult
      }
    } else {
      replyText = aiResult.content
    }

    // ========================
    // SAVE AI RESPONSE
    // ========================
    console.log('[WEBHOOK] 💾 Saving AI response...')
    const responseMessageId = `ai_${Date.now()}`
    await saveMessage(businessId, phoneNumber, 'assistant', replyText, responseMessageId)

    // ========================
    // SEND REPLY VIA GATEWAY
    // ========================
    console.log('[WEBHOOK] 📤 Sending reply via gateway...')
    await sendReplyViaGateway(businessId, phoneNumber, replyText)

    // ========================
    // RESPOND TO GATEWAY
    // ========================
    console.log('[WEBHOOK] ✅ Webhook complete')
    console.log('='.repeat(60) + '\n')

    res.json({
      success: true,
      reply: replyText,
      mode: aiResult.type,
      tool: aiResult.type === 'tool_call' ? aiResult.tool.function.name : null,
      messagesSaved: true,
      gatewaySent: true,
    })
  } catch (err) {
    console.error('[WEBHOOK] ❌ Unhandled error:', err.message)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

// ========================
// HEALTH CHECK
// ========================

app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        api_key: !!INTERNAL_API_KEY,
        openrouter_key: !!OPENROUTER_API_KEY,
        firebase: !!db,
        gateway: false,
      },
    }

    // Test gateway connectivity
    try {
      const gatewayRes = await axios.get(`${GATEWAY_URL}/status/health`, {
        timeout: 5000,
      })
      health.checks.gateway = gatewayRes.status === 200
    } catch (err) {
      health.checks.gateway = false
    }

    const allHealthy = Object.values(health.checks).every((v) => v)
    health.status = allHealthy ? 'healthy' : 'degraded'

    console.log('[HEALTH] Status:', health.status)
    res.status(allHealthy ? 200 : 503).json(health)
  } catch (err) {
    console.error('[HEALTH] Error:', err.message)
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
    })
  }
})

// ========================
// START SERVER
// ========================

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 AI Webhook Service Starting')
  console.log('='.repeat(60))
  console.log(`Port: ${PORT}`)
  console.log(`Gateway URL: ${GATEWAY_URL}`)
  console.log(`OpenRouter Model: ${OPENROUTER_MODEL}`)
  console.log(`Firebase Project: ${FIREBASE_PROJECT_ID}`)
  console.log('='.repeat(60) + '\n')
})

module.exports = app
