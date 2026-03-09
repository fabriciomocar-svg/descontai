import { db, isFirebaseConfigured } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, increment, setDoc } from 'firebase/firestore';
import { getAuthUser } from './auth';

export interface Comment {
  id: string;
  promotionId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}

export const getComments = async (promotionId: string): Promise<Comment[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const commentsCol = collection(db, 'promotions', promotionId, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      console.error("Erro de permissão ao buscar comentários:", e);
      throw new Error("Você não tem permissão para ver os comentários.");
    }
    console.error("Erro ao buscar comentários:", e);
    return [];
  }
};

export const addComment = async (promotionId: string, text: string): Promise<Comment | null> => {
  if (!isFirebaseConfigured || !db) return null;
  const user = getAuthUser();
  if (!user) throw new Error("Usuário não autenticado");

  try {
    const commentsCol = collection(db, 'promotions', promotionId, 'comments');
    const newComment = {
      promotionId,
      userId: user.id,
      userName: user.name,
      userPhoto: user.photoURL || '',
      text,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(commentsCol, newComment);
    
    // Increment comment count on promotion
    const promoRef = doc(db, 'promotions', promotionId);
    await setDoc(promoRef, { commentsCount: increment(1) }, { merge: true });

    return { id: docRef.id, ...newComment } as Comment;
  } catch (e) {
    console.error("Erro ao adicionar comentário:", e);
    throw e;
  }
};
