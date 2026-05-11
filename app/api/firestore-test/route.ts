import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: Request) {
  try {
    const { action } = await request.json() as Record<string, unknown>

    if (action === 'test-write') {
      const testId = `test-${Date.now()}`
      const testData = { test: true, timestamp: Date.now(), message: 'Firestore connectivity test' }
      
      console.log(`[v0] Testing Firestore write to /firestore-tests/${testId}...`)
      await setDoc(doc(db, 'firestore-tests', testId), testData as Record<string, unknown>)
      console.log(`[v0] Write successful, test ID: ${testId}`)
      
      return Response.json({ success: true, testId, message: 'Write successful' })
    }

    if (action === 'test-read') {
      const { testId } = request.headers.get('x-test-id') ? { testId: request.headers.get('x-test-id') } : await request.json() as Record<string, string>
      
      console.log(`[v0] Testing Firestore read from /firestore-tests/${testId}...`)
      const snap = await getDoc(doc(db, 'firestore-tests', testId as string))
      
      if (!snap.exists()) {
        return Response.json({ success: false, message: 'Document not found' }, { status: 404 })
      }
      
      console.log(`[v0] Read successful:`, snap.data())
      return Response.json({ success: true, data: snap.data() })
    }

    if (action === 'test-delete') {
      const { testId } = await request.json() as Record<string, string>
      
      console.log(`[v0] Testing Firestore delete of /firestore-tests/${testId}...`)
      await deleteDoc(doc(db, 'firestore-tests', testId))
      console.log(`[v0] Delete successful`)
      
      return Response.json({ success: true, message: 'Delete successful' })
    }

    return Response.json(
      { error: 'Unknown action. Use: test-write, test-read, test-delete' },
      { status: 400 },
    )
  } catch (err) {
    console.error('[v0] Firestore test error:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return Response.json(
      { error: errorMsg, details: String(err) },
      { status: 500 },
    )
  }
}
