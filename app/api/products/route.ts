import { NextRequest, NextResponse } from 'next/server'
import { serverGetProducts, serverGetBusinessByPhone } from '@/lib/firebase-server'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'

function getDb() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
  return getFirestore(app)
}

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get('businessId')
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }
  try {
    const products = await serverGetProducts(businessId)
    return NextResponse.json({ products })
  } catch (err) {
    console.error('[/api/products GET]', err)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, name, description, price, minPrice, negotiationEnabled } = body
    if (!businessId || !name || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const db = getDb()
    const payload = {
      businessId,
      name,
      description: description ?? '',
      price: Number(price),
      minPrice: Number(minPrice ?? 0),
      negotiationEnabled: Boolean(negotiationEnabled),
      createdAt: Date.now(),
    }
    const ref = await addDoc(collection(db, 'businesses', businessId, 'products'), payload)
    return NextResponse.json({ product: { id: ref.id, ...payload } }, { status: 201 })
  } catch (err) {
    console.error('[/api/products POST]', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
