import "server-only"

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")

export const firebaseAdminConfigured = Boolean(projectId && clientEmail && privateKey)

const adminApp = getApps()[0] ?? (firebaseAdminConfigured
  ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  : null)

export function requireFirebaseAdmin() {
  if (!adminApp) throw new Error("Firebase Admin is not configured on the server.")
  return { auth: getAuth(adminApp), db: getFirestore(adminApp) }
}

export async function verifyAdminRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) throw new Error("Missing authorization token.")
  const { auth } = requireFirebaseAdmin()
  const decoded = await auth.verifyIdToken(token)
  if (decoded.admin !== true) throw new Error("Admin access required.")
  return decoded
}

export function verifyAdminConfiguration() {
  if (!firebaseAdminConfigured) throw new Error("Firebase Admin environment variables are missing.")
}
