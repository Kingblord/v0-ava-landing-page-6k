import admin from 'firebase-admin'

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  console.log('[v0] Initializing Firebase Admin SDK...')
  
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }

  // Validate all credentials are present
  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error(
      `Firebase Admin SDK credentials incomplete. Missing: ${
        [
          !serviceAccount.projectId && 'FIREBASE_PROJECT_ID',
          !serviceAccount.privateKey && 'FIREBASE_PRIVATE_KEY',
          !serviceAccount.clientEmail && 'FIREBASE_CLIENT_EMAIL',
        ]
          .filter(Boolean)
          .join(', ')
      }`,
    )
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.projectId,
  })

  console.log('[v0] Firebase Admin SDK initialized successfully')
}

export const adminDb = admin.firestore()
export const adminAuth = admin.auth()

export default admin
