import { NextRequest, NextResponse } from 'next/server'
import { getProductsServer, createProductServer, updateProductServer, deleteProductServer } from '@/lib/firestore-server'
import type { Product } from '@/lib/types'

/**
 * GET /api/products?userId=...
 * Fetch all products for a business (server-side via Admin SDK)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const products = await getProductsServer(userId)
    return NextResponse.json({ success: true, products })
  } catch (err) {
    console.error('[v0] Error fetching products:', err)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

/**
 * POST /api/products
 * Create a new product (server-side via Admin SDK)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, name, description, price, minPrice, negotiationEnabled, imageUrl } = await request.json()

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await createProductServer(userId, {
      name,
      description: description || '',
      price: Number(price) || 0,
      minPrice: Number(minPrice) || 0,
      negotiationEnabled: Boolean(negotiationEnabled),
      imageUrl: imageUrl || '',
    } as Omit<Product, 'id' | 'businessId' | 'createdAt'>)

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (err) {
    console.error('[v0] Error creating product:', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

/**
 * PUT /api/products
 * Update a product (server-side via Admin SDK)
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, productId, ...updates } = await request.json()

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing userId or productId' }, { status: 400 })
    }

    await updateProductServer(userId, productId, updates)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] Error updating product:', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

/**
 * DELETE /api/products
 * Delete a product (server-side via Admin SDK)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, productId } = await request.json()

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing userId or productId' }, { status: 400 })
    }

    await deleteProductServer(userId, productId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] Error deleting product:', err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

