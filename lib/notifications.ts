import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QuerySnapshot,
  type Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export type NotificationType =
  | "system"
  | "subscription"
  | "payment"
  | "referral"
  | "support"
  | "success"
  | "warning";

export interface NotificationItem {
  id: string;
  uid: string;

  title: string;
  message: string;

  type: NotificationType;

  read: boolean;

  createdAt: Timestamp | Date | null;
}

export interface CreateNotificationInput {
  uid: string;

  title: string;
  message: string;

  type?: NotificationType;

  read?: boolean;
}

function normalizeNotification(
  id: string,
  data: DocumentData
): NotificationItem {
  return {
    id,
    uid: String(data.uid ?? ""),

    title: String(data.title ?? ""),
    message: String(data.message ?? ""),

    type: (data.type ?? "system") as NotificationType,

    read: Boolean(data.read ?? false),

    createdAt: data.createdAt ?? null,
  };
}

/**
 * Get user's notifications once.
 */
export async function getMyNotifications(
  uid: string
): Promise<NotificationItem[]> {
  if (!uid) {
    return [];
  }

  const notificationsRef = collection(db, "notifications");

  const q = query(
    notificationsRef,
    where("uid", "==", uid),
    limit(50)
  );

  const snapshot = await getDocs(q);

  const notifications = snapshot.docs.map((item) =>
    normalizeNotification(item.id, item.data())
  );

  notifications.sort((a, b) => {
    const aTime =
      a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : a.createdAt?.toMillis?.() ?? 0;

    const bTime =
      b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : b.createdAt?.toMillis?.() ?? 0;

    return bTime - aTime;
  });

  return notifications;
}

/**
 * Realtime notification listener.
 *
 * Whenever Admin Panel creates/updates a notification,
 * this callback receives the latest notification list.
 */
export function subscribeToMyNotifications(
  uid: string,
  callback: (notifications: NotificationItem[]) => void,
  onError?: (error: Error) => void
) {
  if (!uid) {
    callback([]);
    return () => {};
  }

  const notificationsRef = collection(db, "notifications");

  const q = query(
    notificationsRef,
    where("uid", "==", uid),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const notifications = snapshot.docs.map((item) =>
        normalizeNotification(item.id, item.data())
      );

      notifications.sort((a, b) => {
        const aTime =
          a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : a.createdAt?.toMillis?.() ?? 0;

        const bTime =
          b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : b.createdAt?.toMillis?.() ?? 0;

        return bTime - aTime;
      });

      callback(notifications);
    },
    (error) => {
      console.error("Notification listener error:", error);

      onError?.(error);
    }
  );
}

/**
 * Mark notification as read.
 */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  if (!notificationId) {
    return;
  }

  const notificationRef = doc(
    db,
    "notifications",
    notificationId
  );

  await updateDoc(notificationRef, {
    read: true,
  });
}

/**
 * Create notification.
 *
 * Admin Panel can use the same Firebase collection.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<string> {
  if (!input.uid) {
    throw new Error("Notification UID is required.");
  }

  if (!input.title.trim()) {
    throw new Error("Notification title is required.");
  }

  if (!input.message.trim()) {
    throw new Error("Notification message is required.");
  }

  const notificationsRef = collection(db, "notifications");

  const notification = await addDoc(notificationsRef, {
    uid: input.uid,

    title: input.title.trim(),

    message: input.message.trim(),

    type: input.type ?? "system",

    read: input.read ?? false,

    createdAt: new Date(),
  });

  return notification.id;
}
