import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Chat, ChatMessage, AuthUser } from '../types';
import { getAuthUser } from '../constants';

export const useChat = () => {
  const user = getAuthUser();

  const useUnreadCount = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      if (!user?.id || !isFirebaseConfigured || !db) return;

      const chatsCol = collection(db, 'chats');
      // Query for chats where the user is a participant (either userId or merchantId)
      // However, the original code specifically queried by 'userId' for regular users 
      // and 'merchantId' for merchants in different contexts.
      // Let's stick to the pattern seen in FeedScreen (userId) and MerchantDashboard (merchantId).
      
      // For general unread count, we need to know if the user is acting as a merchant or a regular user
      // or check both if the user can be both.
      // Based on FeedScreen, it checks 'userId'.
      // Based on MerchantDashboard, it checks 'merchantId'.
      
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
      });

      return () => unsubscribe();
    }, [user?.id, user?.merchantId, user?.role]);

    return unreadCount;
  };

  const useChatMessages = (chatId: string | undefined) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!isFirebaseConfigured || !db || !user || !chatId) {
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
      });

      return () => unsubscribe();
    }, [chatId, user?.id]);

    return { messages, loading };
  };

  const useUserChats = () => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!isFirebaseConfigured || !db || !user) {
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
      });

      return () => unsubscribe();
    }, [user?.id, user?.merchantId, user?.role]);

    return { chats, loading };
  };

  const useChatDetails = (chatId: string | undefined) => {
    const [chat, setChat] = useState<Chat | null>(null);
    
    useEffect(() => {
      if (!chatId || !db) return;
      
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
    }, [chatId]);

    return chat;
  };

  return {
    useUnreadCount,
    useChatMessages,
    useUserChats,
    useChatDetails
  };
};
