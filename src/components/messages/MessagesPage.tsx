import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp, updateDoc, onSnapshot } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ADMIN_USERS } from '@/constants';
import { sendNotification } from '@/lib/notifications';
import { useConversations, useMessages, sendMessage } from '@/hooks/useMessages';
import { toast } from 'sonner';

export function MessagesPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { conversations, loading: loadingConvs } = useConversations();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  
  // Real-time messages listener for selected conversation
  const { messages, loading: loadingMsgs } = useMessages(selectedChat?.id || null);
  const [newMessage, setNewMessage] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  
  // Real-time cached user profiles lookup
  const [profiles, setProfiles] = useState<{[uid: string]: any}>({});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Typing indicators state
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [typingUsersList, setTypingUsersList] = useState<any>({});

  const isOwner = !!(auth.currentUser?.email && ADMIN_USERS[auth.currentUser.email.toLowerCase()]);
  const isParticipant = !!(selectedChat && selectedChat.participants?.includes(auth.currentUser?.uid));
  const canChat = isOwner || isParticipant;

  const getDirectConversationId = (userId: string) => {
    if (!auth.currentUser) return userId;
    return [auth.currentUser.uid, userId].sort().join('_');
  };

  const openOwnerChat = async (userId: string) => {
    if (!auth.currentUser) return;
    const convId = getDirectConversationId(userId);
    const convRef = doc(db, 'conversations', convId);
    await setDoc(convRef, {
      participants: [auth.currentUser.uid, userId],
      lastMessage: t('start_chat_placeholder') || 'Suhbatni boshlang...',
      lastMessageAt: serverTimestamp()
    }, { merge: true });
    setSelectedChat({
      id: convId,
      participants: [auth.currentUser.uid, userId]
    });
  };

  // Fetch participant profiles dynamically on demand
  useEffect(() => {
    const fetchProfiles = async () => {
      const uidsToFetch = new Set<string>();
      conversations.forEach(c => {
        c.participants?.forEach(uid => {
          if (auth.currentUser && uid !== auth.currentUser.uid && uid !== 'platform_support') {
            uidsToFetch.add(uid);
          }
        });
      });

      if (initialUserId && auth.currentUser && initialUserId !== auth.currentUser.uid) {
        uidsToFetch.add(initialUserId);
      }

      if (isOwner) {
        allUsers.forEach((u) => {
          if (u.id && auth.currentUser && u.id !== auth.currentUser.uid) {
            uidsToFetch.add(u.id);
          }
        });
      }

      for (const uid of uidsToFetch) {
        if (!profiles[uid]) {
          try {
            const docSnap = await getDoc(doc(db, 'users', uid));
            if (docSnap.exists()) {
              setProfiles(prev => ({ ...prev, [uid]: docSnap.data() }));
            }
          } catch (e) {
            console.error("Error fetching user profile for chat:", e);
          }
        }
      }
    };

    fetchProfiles();
  }, [conversations, initialUserId, profiles, allUsers, isOwner]);

  useEffect(() => {
    if (!auth.currentUser || !isOwner) {
      setAllUsers([]);
      return;
    }

    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const users = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((u) => u.id !== auth.currentUser?.uid && !u.isDeleted);
      setAllUsers(users);
    }, (err) => {
      console.error('Error fetching users for owner chat list:', err);
    });

    return () => unsub();
  }, [isOwner]);

  // Handle auto-selecting initialUserId
  useEffect(() => {
    if (initialUserId && auth.currentUser) {
      const existing = conversations.find(c => c.participants?.includes(initialUserId));
      if (existing) {
        setSelectedChat(existing);
      } else {
        const createInitialConv = async () => {
          const convId = [auth.currentUser.uid, initialUserId].sort().join('_');
          const convRef = doc(db, 'conversations', convId);
          await setDoc(convRef, {
            participants: [auth.currentUser.uid, initialUserId],
            lastMessage: t('start_chat_placeholder') || 'Suhbatni boshlang...',
            lastMessageAt: serverTimestamp()
          }, { merge: true });
        };
        createInitialConv();
      }
    } else if (!selectedChat && conversations.length > 0 && !isOwner) {
      setSelectedChat(conversations[0]);
    }
  }, [initialUserId, conversations, isOwner, selectedChat, t]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages]);

  const handleSupportClick = async () => {
    if (!auth.currentUser) return;
    const convId = `support_${auth.currentUser.uid}`;
    const convRef = doc(db, 'conversations', convId);
    await setDoc(convRef, {
      participants: [auth.currentUser.uid, 'platform_support'],
      lastMessage: t('support_desc') || 'Support team contact',
      lastMessageAt: serverTimestamp()
    }, { merge: true });

    setSelectedChat({
      id: convId,
      participants: [auth.currentUser.uid, 'platform_support'],
      name: t('support_chat_name'),
      avatar: '',
      isSupport: true
    });
  };

  // Monitor typing indicators listener
  useEffect(() => {
    if (!selectedChat) {
      setTypingUsersList({});
      return;
    }
    const unsub = onSnapshot(doc(db, 'conversations', selectedChat.id), (docSnap) => {
      if (docSnap.exists()) {
        setTypingUsersList(docSnap.data().typingUsers || {});
      } else {
        setTypingUsersList({});
      }
    }, (err) => {
      console.warn("Typing listener error", err);
    });
    return () => unsub();
  }, [selectedChat]);

  // Handle setting typing indicator state in Firestore when newMessage changes
  useEffect(() => {
    if (!selectedChat || !auth.currentUser || selectedChat.id.startsWith('support_')) return;
    
    if (!newMessage.trim()) {
      if (typing) {
        setTyping(false);
        updateDoc(doc(db, 'conversations', selectedChat.id), {
          [`typingUsers.${auth.currentUser.uid}`]: false
        }).catch(err => console.warn(err));
      }
      return;
    }

    if (!typing) {
      setTyping(true);
      updateDoc(doc(db, 'conversations', selectedChat.id), {
        [`typingUsers.${auth.currentUser.uid}`]: true
      }).catch(err => console.warn(err));
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      if (selectedChat && auth.currentUser) {
        updateDoc(doc(db, 'conversations', selectedChat.id), {
          [`typingUsers.${auth.currentUser.uid}`]: false
        }).catch(err => console.warn(err));
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [newMessage, selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !auth.currentUser) return;
    if (!canChat) {
      toast.error(t('access_denied'), { description: t('access_denied_desc') });
      return;
    }

    // Reset typing status on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(false);
    if (!selectedChat.id.startsWith('support_')) {
      updateDoc(doc(db, 'conversations', selectedChat.id), {
        [`typingUsers.${auth.currentUser.uid}`]: false
      }).catch(err => console.warn(err));
    }

    try {
      await sendMessage(selectedChat.id, newMessage);

      // Trigger notifications for the recipient
      const recipientId = selectedChat.participants?.find((uid: string) => uid !== auth.currentUser.uid);
      if (recipientId && recipientId !== 'platform_support') {
        const senderName = auth.currentUser.displayName || 'User';
        await sendNotification(recipientId, senderName, newMessage, 'message');
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Helper to format chat info
  const getChatInfo = (chat: any) => {
    const isSupport = chat.participants?.includes('platform_support');
    if (isSupport) {
      return {
        name: t('support_chat_name'),
        avatar: '',
        isSupport: true
      };
    }

    const otherUid = chat.participants?.find((uid: string) => auth.currentUser && uid !== auth.currentUser.uid);
    const profile = profiles[otherUid || ''];
    return {
      name: profile?.full_name || profile?.displayName || otherUid || 'User',
      avatar: profile?.photo_url || profile?.photoURL || '',
      isSupport: false
    };
  };

  const convByOtherUid: Record<string, any> = {};
  conversations.forEach((chat) => {
    const otherUid = chat.participants?.find((uid: string) => auth.currentUser && uid !== auth.currentUser.uid && uid !== 'platform_support');
    if (otherUid) {
      convByOtherUid[otherUid] = chat;
    }
  });

  const filteredUsers = allUsers.filter((u) => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return true;
    const name = (u.full_name || u.displayName || u.email || '').toLowerCase();
    return name.includes(q);
  });

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 h-[calc(100vh-80px)]">
      <div className="glass border-white/10 rounded-3xl overflow-hidden flex h-full">
        {/* Sidebar */}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/10 flex-col`}>
          <div className="p-6 border-b border-white/10 space-y-4">
            <h2 className="text-xl font-bold">{t("messages_title")}</h2>
            
            {!isOwner && (
              <Button 
                onClick={handleSupportClick}
                className={`w-full gap-2 font-bold h-11 transition-all ${selectedChat?.participants?.includes('platform_support') ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <ShieldCheck className="w-4 h-4" />
                {t('contact_support')}
              </Button>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder={t("search_chats")}
                className="pl-10 bg-white/5 border-white/10"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isOwner ? filteredUsers.map((u) => {
              const chat = convByOtherUid[u.id];
              const convId = getDirectConversationId(u.id);
              const isSelected = selectedChat?.id === convId;
              const displayName = u.full_name || u.displayName || u.email || 'User';
              return (
                <div
                  key={u.id}
                  onClick={() => openOwnerChat(u.id)}
                  className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/10' : ''}`}
                >
                  <Avatar className="border border-white/10">
                    <AvatarImage src={(u.photo_url || u.photoURL) || undefined} />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold truncate text-indigo-950 text-sharp">{displayName}</h4>
                      {chat?.lastMessageAt && (
                        <span className="text-[10px] text-indigo-950/40">
                          {chat.lastMessageAt?.toDate ? chat.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-950/40 truncate">{chat?.lastMessage || t('start_chat_placeholder')}</p>
                  </div>
                </div>
              );
            }) : conversations.map((chat) => {
              const info = getChatInfo(chat);
              const isSelected = selectedChat?.id === chat.id;
              
              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/10' : ''}`}
                >
                  <Avatar className="border border-white/10">
                    <AvatarImage src={info.avatar || undefined} />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold truncate text-indigo-950 text-sharp">{info.name}</h4>
                      {chat.lastMessageAt && (
                        <span className="text-[10px] text-indigo-950/40">
                          {chat.lastMessageAt?.toDate ? chat.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-950/40 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              );
            })}
            {!loadingConvs && (isOwner ? filteredUsers.length === 0 : conversations.length === 0) && (
              <div className="p-8 text-center text-indigo-950/20 text-sm">{t("no_conversations")}</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10 border border-white/10">
                  <AvatarImage src={getChatInfo(selectedChat).avatar || undefined} />
                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-indigo-950 text-sharp">{getChatInfo(selectedChat).name}</h3>
                  <p className="text-[10px] text-green-500">{t("online")}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => {
                  const isOwn = msg.senderId === auth.currentUser?.uid;
                  const otherUid = selectedChat.participants?.find((uid: string) => auth.currentUser && uid !== auth.currentUser.uid);
                  const profile = profiles[otherUid || ''];
                  const senderName = isOwn ? 'You' : (profile?.full_name || profile?.displayName || 'User');
                  
                  return (
                    <div
                      key={i}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col gap-1 max-w-[70%]">
                        {!isOwn && (
                          <span className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-wider ml-2">
                            {senderName}
                          </span>
                        )}
                        <div
                          className={`p-4 rounded-2xl text-sm shadow-sm ${
                            isOwn
                              ? 'bg-primary text-white rounded-tr-none shadow-primary/20'
                              : 'bg-white text-indigo-950 rounded-tl-none border border-indigo-900/10'
                          }`}
                        >
                          {msg.text}
                          <div className={`text-[10px] mt-2 font-medium ${isOwn ? 'text-white/70' : 'text-indigo-950/40'}`}>
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Typing Indicators */}
              {Object.keys(typingUsersList).some(uid => uid !== auth.currentUser?.uid && typingUsersList[uid] === true) && (
                <div className="px-6 py-2.5 text-[10px] font-black uppercase text-emerald-500 tracking-wider animate-pulse bg-white/20 text-left border-t border-black/5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                  <span>{getChatInfo(selectedChat).name} yozmoqda...</span>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-6 border-t border-black/5 bg-white/40">
                <div className="flex gap-4">
                  <Input
                    placeholder={canChat ? t("type_message") : (t('access_denied_desc') || 'Ruxsat yo‘q')}
                    className="bg-white/50 border-black/5 text-indigo-950 focus:border-primary"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!canChat}
                  />
                  <Button type="submit" className="bg-primary hover:bg-primary/80 text-white" disabled={!canChat}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-indigo-950/20">
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
