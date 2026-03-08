import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase';
import { Chat, ChatMessage, AuthUser } from '../types';
import { getAuthUser } from '../constants';

export const useChat = () => {
  const user = getAuthUser();
  const isMockUser = user?.id?.startsWith('guest_') || user?.id?.startsWith('mock_') || user?.id?.startsWith('master_');

  const useUnreadCount = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      if (!user?.id || !isFirebaseConfigured || !db || isMockUser || !auth?.currentUser) return;

      const chatsCol = collection(db, 'chats');
      
      let q;
      if (user.role === 'MERCHANT' && user.merchantId) {
         q = query(chatsCol, where('merchantId', '==', user.merchantId));
      } else {
         q = query(chatsCol, where('userId', '==', user.id));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let count = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data() as Chat;
          if (data.unreadCount && data.unreadCount > 0 && data.lastSenderId !== user.id) {
            count += data.unreadCount;
          }
        });
        setUnreadCount(count);
      }, (error) => {
        console.error("Error fetching unread count:", error);
      });

      return () => unsubscribe();
    }, [user?.id, user?.merchantId, user?.role, isMockUser]);

    return unreadCount;
  };

  const useChatMessages = (chatId: string | undefined) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!isFirebaseConfigured || !db || !user || !chatId || isMockUser || !auth?.currentUser) {
        setLoading(false);
        return;
      }

      const messagesCol = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesCol, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatMessage[];
        setMessages(msgs);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }, [chatId, user?.id, isMockUser]);

    return { messages, loading };
  };

  const useUserChats = () => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!isFirebaseConfigured || !db || !user || isMockUser || !auth?.currentUser) {
        setLoading(false);
        return;
      }

      const chatsCol = collection(db, 'chats');
      const isMerchant = user.role === 'MERCHANT';
      const field = isMerchant ? 'merchantId' : 'userId';
      const value = isMerchant ? user.merchantId : user.id;

      if (!value) {
          setLoading(false);
          return;
      }

      const q = query(chatsCol, where(field, '==', value));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chat[];
        
        // Sort client-side
        chatList.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });

        setChats(chatList);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user chats:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }, [user?.id, user?.merchantId, user?.role, isMockUser]);

    return { chats, loading };
  };

  const useChatDetails = (chatId: string | undefined) => {
    const [chat, setChat] = useState<Chat | null>(null);
    
    useEffect(() => {
      if (!chatId || !db || isMockUser || !auth?.currentUser) return;
      
      const fetchChat = async () => {
        try {
          const chatDoc = await getDoc(doc(db, 'chats', chatId));
          if (chatDoc.exists()) {
            setChat(chatDoc.data() as Chat);
          }
        } catch (error) {
          console.error("Error fetching chat details:", error);
        }
      };
      
      fetchChat();
    }, [chatId, isMockUser]);

    return chat;
  };

  return {
    useUnreadCount,
    useChatMessages,
    useUserChats,
    useChatDetails
  };
};
