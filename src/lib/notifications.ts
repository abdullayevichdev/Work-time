import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export type NotificationType = 'message' | 'application' | 'job_update' | 'premium_update';

export async function sendNotification(
  userId: string,
  title: string,
  content: string,
  type: NotificationType = 'job_update'
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      content,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export function showToast(title: string, message: string) {
  toast(title, {
    description: message,
  });
}
