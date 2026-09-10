import { addDoc, collection, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, doc, type Unsubscribe } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type Notification = { notificationId: string; uid: string; message: string; createdAt: unknown; read: boolean; sender: string }

export async function getMyNotifications(uid: string) {
  const snapshot = await getDocs(query(collection(db, "notifications"), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(50)))
  return snapshot.docs.map((item) => ({ notificationId: item.id, ...item.data() })) as Notification[]
}

export function subscribeToMyNotifications(
  uid: string,
  onChange: (notifications: Notification[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "notifications"), where("uid", "==", uid), limit(50)),
    (snapshot) => {
      const notifications = snapshot.docs
        .map((item) => ({ notificationId: item.id, ...item.data() }) as Notification)
        .sort((a, b) => notificationTime(b.createdAt) - notificationTime(a.createdAt))
      onChange(notifications)
    },
    (error) => onError?.(error),
  )
}

function notificationTime(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis()
  if (value instanceof Date) return value.getTime()
  if (typeof value === "number") return value
  if (typeof value === "string") return new Date(value).getTime()
  return 0
}

export async function markNotificationRead(uid: string, notificationId: string) {
  const notificationRef = doc(db, "notifications", notificationId)
  await updateDoc(notificationRef, { read: true })
  return uid
}

export async function createNotification(uid: string, message: string, sender = "system") {
  return addDoc(collection(db, "notifications"), { uid, message, createdAt: serverTimestamp(), read: false, sender })
}
