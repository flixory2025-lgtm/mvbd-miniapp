import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAdminRequest, requireFirebaseAdmin } from "@/lib/firebase-admin"
import { getSubscriptionPlan } from "@/lib/subscription-plans"

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request)
    const { db } = requireFirebaseAdmin()
    const snapshot = await db.collection("paymentRequests").orderBy("createdAt", "desc").limit(100).get()
    return NextResponse.json(snapshot.docs.map((item) => ({ requestId: item.id, ...item.data() })))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminRequest(request)
    const body = await request.json() as { requestId?: string; action?: "approve" | "reject"; adminNote?: string }
    if (!body.requestId || !body.action) return NextResponse.json({ error: "Invalid review request." }, { status: 400 })
    const { db } = requireFirebaseAdmin()
    const ref = db.collection("paymentRequests").doc(body.requestId)
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      if (!snapshot.exists || snapshot.data()?.status !== "pending") throw new Error("Request is not pending.")
      const payment = snapshot.data()!
      if (payment.uid === admin.uid) throw new Error("Admins cannot approve their own payment.")
      const now = new Date()
      const review = { status: body.action === "approve" ? "approved" : "rejected", reviewedAt: FieldValue.serverTimestamp(), reviewedBy: admin.uid, adminNote: body.adminNote?.trim() || null }
      transaction.update(ref, review)
      if (body.action === "approve") {
        const plan = getSubscriptionPlan(String(payment.planId))
        if (!plan) throw new Error("Invalid subscription plan.")
        const expires = new Date(now.getTime() + plan.durationDays * 86400000)
        transaction.set(db.collection("users").doc(payment.uid), { accessType: "subscription", subscriptionStatus: "active", subscriptionPlan: plan.planId, subscriptionStartedAt: FieldValue.serverTimestamp(), subscriptionExpiresAt: expires }, { merge: true })
        transaction.set(db.collection("notifications").doc(), { uid: payment.uid, message: "Your subscription payment has been approved and premium access is now active.", createdAt: FieldValue.serverTimestamp(), read: false, sender: admin.uid })
      } else {
        transaction.set(db.collection("notifications").doc(), { uid: payment.uid, message: "Your subscription payment request was rejected. Please check the admin note.", createdAt: FieldValue.serverTimestamp(), read: false, sender: admin.uid })
      }
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Review failed." }, { status: 400 })
  }
}
