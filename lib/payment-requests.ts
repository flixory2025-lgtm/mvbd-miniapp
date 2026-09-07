import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from "firebase/firestore"
import type { User } from "firebase/auth"

import { db } from "@/lib/firebase"
import {
  getSubscriptionPlan,
  type PaymentRequest,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans"
import type { UserProfile } from "@/lib/user-profile"

function normalizeRequest(data: DocumentData, requestId: string): PaymentRequest {
  return {
    requestId,
    uid: String(data.uid),
    mvbdId: String(data.mvbdId),
    userName: typeof data.userName === "string" ? data.userName : "",
    planId: data.planId,
    planName: typeof data.planName === "string" ? data.planName : "",
    amount: typeof data.amount === "number" ? data.amount : 0,
    transactionId: typeof data.transactionId === "string" ? data.transactionId : "",
    status: data.status,
    createdAt: data.createdAt ?? null,
    reviewedAt: data.reviewedAt ?? null,
    reviewedBy: typeof data.reviewedBy === "string" ? data.reviewedBy : null,
    adminNote: typeof data.adminNote === "string" ? data.adminNote : null,
  }
}

export async function createPendingPaymentRequest({
  user,
  profile,
  planId,
  transactionId,
}: {
  user: User
  profile: UserProfile
  planId: SubscriptionPlanId
  transactionId: string
}) {
  const plan = getSubscriptionPlan(planId)
  const normalizedTransactionId = transactionId.trim()

  if (!plan) throw new Error("Please select a valid subscription plan.")
  if (normalizedTransactionId.length < 3) {
    throw new Error("Please enter a valid transaction ID.")
  }

  const duplicateQuery = query(
    collection(db, "paymentRequests"),
    where("uid", "==", user.uid),
    where("planId", "==", plan.planId),
    where("transactionId", "==", normalizedTransactionId),
    where("status", "==", "pending"),
    limit(1),
  )
  const duplicateSnapshot = await getDocs(duplicateQuery)
  if (!duplicateSnapshot.empty) {
    throw new Error("This payment request is already pending review.")
  }

  const request = {
    uid: user.uid,
    mvbdId: profile.mvbdId,
    userName: profile.name || user.displayName || "MVBD user",
    planId: plan.planId,
    planName: plan.planName,
    amount: plan.amount,
    transactionId: normalizedTransactionId,
    status: "pending" as const,
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    adminNote: null,
  }

  const created = await addDoc(collection(db, "paymentRequests"), request)
  return { ...request, requestId: created.id }
}

export async function getMyPaymentRequests(uid: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "paymentRequests"),
      where("uid", "==", uid),
      limit(25),
    ),
  )

  return snapshot.docs.map((item) => normalizeRequest(item.data(), item.id))
}
