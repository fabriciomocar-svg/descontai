import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';

export const getOrCreateChat = async (userId: string, merchantId: string, userName: string, storeName: string, promotionId?: string) => {
  if (!isFirebaseConfigured || !db) return null;
  const chatId = `${userId}_${merchantId}`;
  const chatRef = doc(db, 'chats', chatId);
  
  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, {
        id: chatId,
        userId,
        merchantId,
        userName,
        storeName,
        promotionId: promotionId || null,
        lastMessage: '',
        updatedAt: serverTimestamp()
      });
    } else if (promotionId) {
      // Update promotionId context if provided
      await setDoc(chatRef, { promotionId }, { merge: true });
    }
    return chatId;
  } catch (e) {
    console.error("Erro ao criar/buscar chat:", e);
    return null;
  }
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesCol, {
      chatId,
      senderId,
      text,
      createdAt: serverTimestamp()
    });
    
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      lastMessage: text,
      updatedAt: serverTimestamp(),
      lastSenderId: senderId,
      unreadCount: increment(1)
    }, { merge: true });
  } catch (e) {
    console.error("Erro ao enviar mensagem:", e);
    throw e;
  }
};

export const markChatAsRead = async (chatId: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, { unreadCount: 0 }, { merge: true });
  } catch (e) {
    console.error("Erro ao marcar chat como lido:", e);
  }
};
