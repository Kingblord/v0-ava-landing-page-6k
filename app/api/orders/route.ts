import { NextRequest, NextResponse } from 'next/server'
import { getOrdersServer, updateOrderStatusServer } from '@/lib/firestore-server'

/**
 * GET /api/orders?userId=...
 * Fetch all orders for a business (server-side via Admin SDK)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('[v0] Fetching orders for user:', userId)
    const orders = await getOrdersServer(userId)

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[v0] Error fetching orders:', errorMsg)
    return NextResponse.json(
      { error: errorMsg || 'Failed to fetch orders' },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/orders
 * Update order status (server-side via Admin SDK)
 */
export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing orderId or status' },
        { status: 400 },
      )
    }

    console.log('[v0] Updating order status:', orderId, 'to', status)
    await updateOrderStatusServer(orderId, status)

    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[v0] Error updating order:', errorMsg)
    return NextResponse.json(
      { error: errorMsg || 'Failed to update order' },
      { status: 500 },
    )
  }
}

