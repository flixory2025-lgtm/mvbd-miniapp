import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { requireFirebaseAdmin, verifyAdminRequest } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request)
    const { db } = requireFirebaseAdmin()
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(200).get()
    return NextResponse.json(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() })))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    await verifyAdminRequest(request)
    const body = await request.json() as { uid?: string; name?: string; dateOfBirth?: string; accessType?: "trial" | "subscription" | null; subscriptionStatus?: "inactive" | "active" | "expired" | "pending" | null }
    if (!body.uid) return NextResponse.json({ error: "User UID is required." }, { status: 400 })
    const { db } = requireFirebaseAdmin()
    const updates = Object.fromEntries(Object.entries({ name: body.name?.trim(), dateOfBirth: body.dateOfBirth?.trim(), accessType: body.accessType, subscriptionStatus: body.subscriptionStatus }).filter(([, value]) => value !== undefined))
    await db.collection("users").doc(body.uid).set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed." }, { status: 400 })
  }
}
