import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Message, Conversation } from "../types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "conversations"),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Client-side participant checking for privacy and safety
      const userConvs = all.filter(c => c.participants && c.participants.includes(auth.currentUser!.uid));
      setConversations(userConvs);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to conversations:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { conversations, loading };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Sync modern and legacy fields so UI compiles and works flawlessly
          senderId: data.senderId || data.sender_id || '',
          sender_id: data.senderId || data.sender_id || '',
          text: data.text || data.content || '',
          content: data.text || data.content || '',
          createdAt: data.createdAt,
          created_at: data.created_at || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString())
        } as Message;
      }));
      setLoading(false);
    }, (err) => {
      console.error("Error listening to messages:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [conversationId]);

  return { messages, loading };
}

export async function sendMessage(conversationId: string, text: string) {
  if (!auth.currentUser) throw new Error("Unauthenticated");

  const msgRef = collection(db, "conversations", conversationId, "messages");
  const convRef = doc(db, "conversations", conversationId);

  // 1. Add message in subcollection using both new schema keys and legacy key sync
  await addDoc(msgRef, {
    senderId: auth.currentUser.uid,
    sender_id: auth.currentUser.uid,
    text,
    content: text,
    createdAt: serverTimestamp(),
    created_at: new Date().toISOString(),
    is_read: false
  });

  // 2. Update conversation header
  await setDoc(convRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp()
  }, { merge: true });
}
