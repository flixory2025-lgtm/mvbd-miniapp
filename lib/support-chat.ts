import { addDoc, collection, getDocs, limit, query, serverTimestamp, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type SupportMessage = { id: string; uid: string; senderUid: string; senderName: string; message: string; createdAt: unknown }

function timestampValue(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis()
  return 0
}

function messagesQuery(uid: string) {
  return query(collection(db, "supportMessages"), where("uid", "==", uid), limit(100))
}

export async function getSupportMessages(uid: string) {
  const snapshot = await getDocs(messagesQuery(uid))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampValue(a.createdAt) - timestampValue(b.createdAt)) as SupportMessage[]
}

export function subscribeToSupportMessages(uid: string, onChange: (messages: SupportMessage[]) => void) {
  return onSnapshot(messagesQuery(uid), (snapshot) => onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampValue(a.createdAt) - timestampValue(b.createdAt)) as SupportMessage[]))
}

export async function sendSupportMessage(uid: string, message: string, senderName: string) {
  return addDoc(collection(db, "supportMessages"), { uid, senderUid: uid, senderName, message, createdAt: serverTimestamp() })
}
