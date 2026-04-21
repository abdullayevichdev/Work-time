import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDoc, doc, addDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, User } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function MessagesPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(d => d.data());
      const uniqueUsers = new Map();
      
      msgs.forEach((m: any) => {
        const otherId = m.sender_id === auth.currentUser?.uid ? m.receiver_id : m.sender_id;
        if (!uniqueUsers.has(otherId)) {
          uniqueUsers.set(otherId, {
            id: otherId,
            lastMessage: m.text,
            time: m.created_at,
            name: m.sender_id === auth.currentUser?.uid ? m.receiver_name : m.sender_name,
            avatar: m.sender_id === auth.currentUser?.uid ? m.receiver_avatar : m.sender_avatar
          });
        }
      });

      // If there's an initialUserId that we haven't chatted with yet, manually fetch their details and add to the list
      if (initialUserId && !uniqueUsers.has(initialUserId)) {
        try {
          const userDoc = await getDoc(doc(db, 'users', initialUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const newChat = {
              id: initialUserId,
              lastMessage: 'Yangi xabar yozish...', // or 'New message...'
              time: new Date().toISOString(),
              name: userData.full_name || userData.email || 'User',
              avatar: userData.photo_url || ''
            };
            uniqueUsers.set(initialUserId, newChat);
          }
        } catch (error) {
          console.error("Error fetching initial user for chat:", error);
        }
      }

      const conversationsArray = Array.from(uniqueUsers.values());
      // Sort by time descending
      conversationsArray.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setConversations(conversationsArray);
      
      if (initialUserId && !selectedChat) {
         const autoSelect = conversationsArray.find(c => c.id === initialUserId);
         if (autoSelect) setSelectedChat(autoSelect);
      } else if (!selectedChat && conversationsArray.length > 0) {
         setSelectedChat(conversationsArray[0]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initialUserId]);

  useEffect(() => {
    if (!selectedChat || !auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map(d => d.data())
        .filter((m: any) => m.participants.includes(selectedChat.id));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        sender_id: auth.currentUser.uid,
        sender_name: auth.currentUser.displayName || 'User',
        sender_avatar: auth.currentUser.photoURL || '',
        receiver_id: selectedChat.id,
        receiver_name: selectedChat.name,
        receiver_avatar: selectedChat.avatar || '',
        text: newMessage,
        participants: [auth.currentUser.uid, selectedChat.id],
        created_at: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 h-[calc(100vh-80px)]">
      <div className="glass border-white/10 rounded-3xl overflow-hidden flex h-full">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-white/10 flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold mb-4">{t("messages_title")}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input placeholder={t("search_chats")} className="pl-10 bg-white/5 border-white/10" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors ${selectedChat?.id === chat.id ? 'bg-white/10' : ''}`}
              >
                <Avatar className="border border-white/10">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold truncate">{chat.name}</h4>
                    <span className="text-[10px] text-white/30">{new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-white/40 truncate">{chat.lastMessage}</p>
                </div>
              </div>
            ))}
            {!loading && conversations.length === 0 && (
              <div className="p-8 text-center text-white/20 text-sm">{t("no_conversations")}</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
                <Avatar className="w-10 h-10 border border-white/10">
                  <AvatarImage src={selectedChat.avatar} />
                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{selectedChat.name}</h3>
                  <p className="text-[10px] text-green-400">{t("online")}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender_id === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                        msg.sender_id === auth.currentUser?.uid
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white/10 text-white/80 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                      <div className={`text-[10px] mt-1 ${msg.sender_id === auth.currentUser?.uid ? 'text-white/60' : 'text-white/30'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 bg-white/5">
                <div className="flex gap-4">
                  <Input
                    placeholder={t("type_message")}
                    className="bg-white/5 border-white/10 focus:border-primary"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" className="bg-primary hover:bg-primary/80">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Send className="w-10 h-10" />
              </div>
              <p>{t("select_chat")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
