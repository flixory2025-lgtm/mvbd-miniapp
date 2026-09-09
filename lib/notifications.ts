import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type NotificationItem = {
  id: string;
  uid: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: Timestamp | null;
  createdAtMs: number;
  [key: string]: unknown;
};

function timestampToMillis(value: unknown): number {
  if (!value) return 0;

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as Timestamp).toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

/**
 * Subscribe to the current user's notifications in realtime.
 */
export function subscribeToMyNotifications(
  uid: string,
  callback: (notifications: NotificationItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!uid) {
    callback([]);
    return () => {};
  }

  const notificationsQuery = query(
    collection(db, "notifications"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const items: NotificationItem[] = snapshot.docs.map((notificationDoc) => {
        const data = notificationDoc.data();

        return {
          id: notificationDoc.id,
          uid: String(data.uid ?? uid),
          title: String(data.title ?? "MVBD Notification"),
          message: String(data.message ?? ""),
          type: typeof data.type === "string" ? data.type : "general",
          read: Boolean(data.read),
          createdAt: (data.createdAt as Timestamp | null | undefined) ?? null,
          createdAtMs: timestampToMillis(data.createdAt),
        };
      });

      items.sort((a, b) => b.createdAtMs - a.createdAtMs);

      callback(items);
    },
    (error) => {
      console.error("Notification realtime listener error:", error);

      if (onError) {
        onError(error);
      }
    },
  );
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  if (!notificationId) return;

  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

/**
 * Create a notification.
 *
 * Admin panel can use this function when Firestore rules allow
 * the admin client to write notifications.
 */
export async function createNotification(params: {
  uid: string;
  title: string;
  message: string;
  type?: string;
}): Promise<string> {
  const { uid, title, message, type = "general" } = params;

  if (!uid) {
    throw new Error("Notification UID is required.");
  }

  if (!title.trim()) {
    throw new Error("Notification title is required.");
  }

  if (!message.trim()) {
    throw new Error("Notification message is required.");
  }

  const notificationRef = await addDoc(collection(db, "notifications"), {
    uid,
    title: title.trim(),
    message: message.trim(),
    type,
    read: false,
    createdAt: serverTimestamp(),
  });

  return notificationRef.id;
}
