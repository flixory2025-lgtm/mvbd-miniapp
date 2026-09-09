import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore"

import { db } from "./firebase"

import {
  getSubscriptionPlan,
  type PaymentRequestStatus,
  type SubscriptionPlanId,
} from "./subscription-plans"

/*
 * =========================================================
 * PAYMENT REQUEST TYPE
 * =========================================================
 */

export interface PaymentRequest {
  id: string

  uid: string

  mvbdId: string

  userName: string

  userEmail: string

  planId: SubscriptionPlanId

  planName: string

  amount: number

  transactionId: string

  status: PaymentRequestStatus

  createdAt: any

  reviewedAt: any

  reviewedBy: string | null

  rejectionReason: string | null
}

/*
 * =========================================================
 * CREATE PAYMENT REQUEST
 * =========================================================
 *
 * NOTE:
 * এই function UI/client থেকে ব্যবহার করা যেতে পারে,
 * কিন্তু production security-এর জন্য পরে API route
 * দিয়ে payment creation enforce করব।
 */

export async function createPaymentRequest({
  uid,
  mvbdId,
  userName,
  userEmail,
  planId,
  transactionId,
}: {
  uid: string
  mvbdId: string
  userName: string
  userEmail: string
  planId: SubscriptionPlanId
  transactionId: string
}) {
  const plan =
    getSubscriptionPlan(planId)

  if (!plan) {
    throw new Error(
      "Invalid subscription plan."
    )
  }

  const cleanTransactionId =
    transactionId.trim()

  if (!cleanTransactionId) {
    throw new Error(
      "Transaction ID is required."
    )
  }

  if (cleanTransactionId.length < 4) {
    throw new Error(
      "Invalid transaction ID."
    )
  }

  const paymentRef =
    collection(
      db,
      "paymentRequests"
    )

  const document = await addDoc(
    paymentRef,
    {
      uid,

      mvbdId,

      userName,

      userEmail,

      planId: plan.id,

      planName: plan.name,

      amount: plan.price,

      transactionId:
        cleanTransactionId,

      status: "pending",

      createdAt:
        serverTimestamp(),

      reviewedAt: null,

      reviewedBy: null,

      rejectionReason: null,
    }
  )

  return document.id
}

/*
 * =========================================================
 * REALTIME USER PAYMENT REQUESTS
 * =========================================================
 */

export function listenToMyPaymentRequests(
  uid: string,
  callback: (
    requests: PaymentRequest[]
  ) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const paymentQuery = query(
    collection(
      db,
      "paymentRequests"
    ),

    where(
      "uid",
      "==",
      uid
    ),

    orderBy(
      "createdAt",
      "desc"
    )
  )

  return onSnapshot(
    paymentQuery,
    (snapshot) => {
      const requests =
        snapshot.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            }) as PaymentRequest
        )

      callback(requests)
    },
    (error) => {
      console.error(
        "Payment request listener error:",
        error
      )

      onError?.(error)
    }
  )
}
