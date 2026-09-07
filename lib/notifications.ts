import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type Notification = { notificationId: string; uid: string; message: string; createdAt: unknown; read: boolean; sender: string }

export async function getMyNotifications(uid: string) {
  const snapshot = await getDocs(query(collection(db, "notifications"), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(50)))
  return snapshot.docs.map((item) => ({ notificationId: item.id, ...item.data() })) as Notification[]
}

export async function markNotificationRead(uid: string, notificationId: string) {
  const notificationRef = doc(db, "notifications", notificationId)
  await updateDoc(notificationRef, { read: true })
  return uid
}

export async function createNotification(uid: string, message: string, sender = "system") {
  return addDoc(collection(db, "notifications"), { uid, message, createdAt: serverTimestamp(), read: false, sender })
}
