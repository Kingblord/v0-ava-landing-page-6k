import { NextRequest, NextResponse } from 'next/server'
import { serverGetOrders, serverCreateOrder } from '@/lib/firebase-server'

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get('businessId')
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }
  try {
    const orders = await serverGetOrders(businessId)
    return NextResponse.json({ orders })
  } catch (err) {
    console.error('[/api/orders GET]', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, userId, productId, productName, amount } = body
    if (!businessId || !userId || !productId || amount == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const order = await serverCreateOrder({
      businessId,
      userId,
      productId,
      productName: productName ?? '',
      amount: Number(amount),
      status: 'pending',
      createdAt: Date.now(),
    })
    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    console.error('[/api/orders POST]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
