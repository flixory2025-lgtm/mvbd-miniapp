import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
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


function normalizeRequest(
  data: DocumentData,
  requestId: string,
): PaymentRequest {
  return {
    requestId,

    uid:
      typeof data.uid === "string"
        ? data.uid
        : String(data.uid || ""),

    mvbdId:
      typeof data.mvbdId === "string"
        ? data.mvbdId
        : String(data.mvbdId || ""),

    userName:
      typeof data.userName === "string"
        ? data.userName
        : "",

    planId:
      data.planId,

    planName:
      typeof data.planName === "string"
        ? data.planName
        : "",

    amount:
      typeof data.amount === "number"
        ? data.amount
        : 0,

    transactionId:
      typeof data.transactionId === "string"
        ? data.transactionId
        : "",

    status:
      data.status,

    createdAt:
      data.createdAt ?? null,

    reviewedAt:
      data.reviewedAt ?? null,

    reviewedBy:
      typeof data.reviewedBy === "string"
        ? data.reviewedBy
        : null,

    adminNote:
      typeof data.adminNote === "string"
        ? data.adminNote
        : null,
  }
}


/*
 * =========================================
 * CREATE PENDING PAYMENT REQUEST
 * =========================================
 */
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
  /*
   * Selected plan Firebase-এর central
   * subscription plan list থেকে নেওয়া হচ্ছে।
   */
  const plan =
    getSubscriptionPlan(planId)

  /*
   * Transaction ID clean করা হচ্ছে।
   */
  const normalizedTransactionId =
    transactionId.trim()

  /*
   * Paid plan ছাড়া request allow করা হবে না।
   */
  if (
    !plan ||
    plan.planId === "trial"
  ) {
    throw new Error(
      "Please select a paid subscription plan.",
    )
  }

  /*
   * Minimum validation।
   */
  if (
    normalizedTransactionId.length < 3
  ) {
    throw new Error(
      "Please enter a valid transaction ID.",
    )
  }

  /*
   * =========================================
   * DUPLICATE PAYMENT CHECK
   * =========================================
   *
   * আগের code-এ একসাথে:
   *
   * uid
   * planId
   * transactionId
   * status
   *
   * দিয়ে compound query ছিল।
   *
   * এতে Firestore composite index error
   * আসতে পারে।
   *
   * এখন শুধু current user's requests query
   * করে client-side-এ duplicate check করছি।
   */
  const existingQuery =
    query(
      collection(
        db,
        "paymentRequests",
      ),
      where(
        "uid",
        "==",
        user.uid,
      ),
      limit(100),
    )

  const existingSnapshot =
    await getDocs(
      existingQuery,
    )

  const duplicate =
    existingSnapshot.docs.some(
      (paymentDoc) => {
        const data =
          paymentDoc.data()

        const existingTransactionId =
          typeof data.transactionId ===
          "string"
            ? data.transactionId.trim()
            : ""

        return (
          data.status ===
            "pending" &&
          existingTransactionId ===
            normalizedTransactionId
        )
      },
    )

  if (duplicate) {
    throw new Error(
      "This payment request is already pending review.",
    )
  }

  /*
   * =========================================
   * FIRESTORE REQUEST
   * =========================================
   */
  const request = {
    uid:
      user.uid,

    mvbdId:
      profile.mvbdId,

    userName:
      profile.name ||
      user.displayName ||
      "MVBD user",

    planId:
      plan.planId,

    planName:
      plan.planName,

    amount:
      plan.amount,

    transactionId:
      normalizedTransactionId,

    status:
      "pending" as const,

    createdAt:
      serverTimestamp(),

    reviewedAt:
      null,

    reviewedBy:
      null,

    adminNote:
      null,
  }

  /*
   * paymentRequests collection-এ
   * নতুন pending request তৈরি হবে।
   */
  const created =
    await addDoc(
      collection(
        db,
        "paymentRequests",
      ),
      request,
    )

  /*
   * Admin Panel request ID-সহ
   * created request পাওয়া যাবে।
   */
  return {
    ...request,
    requestId:
      created.id,
  }
}


/*
 * =========================================
 * GET MY PAYMENT REQUESTS
 * =========================================
 */
export async function getMyPaymentRequests(
  uid: string,
) {
  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          "paymentRequests",
        ),
        where(
          "uid",
          "==",
          uid,
        ),
        limit(25),
      ),
    )

  return snapshot.docs.map(
    (item) =>
      normalizeRequest(
        item.data(),
        item.id,
      ),
  )
}


/*
 * =========================================
 * REALTIME PAYMENT REQUESTS
 * =========================================
 *
 * User-এর নিজের payment request Firebase
 * থেকে realtime sync হবে।
 */
export function subscribeToMyPaymentRequests(
  uid: string,
  onChange: (
    requests: PaymentRequest[],
  ) => void,
  onError?: (
    error: Error,
  ) => void,
) {
  const requestsQuery =
    query(
      collection(
        db,
        "paymentRequests",
      ),
      where(
        "uid",
        "==",
        uid,
      ),
      limit(25),
    )

  return onSnapshot(
    requestsQuery,
    (snapshot) => {
      const requests =
        snapshot.docs.map(
          (item) =>
            normalizeRequest(
              item.data(),
              item.id,
            ),
        )

      onChange(requests)
    },
    (error) => {
      onError?.(error)
    },
  )
}
