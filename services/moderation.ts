import { db, isFirebaseConfigured } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuthUser } from './auth';

export interface ReportData {
  contentId: string;
  contentType: 'promotion' | 'store' | 'user' | 'chat';
  reason: string;
  description?: string;
  reportedBy: string;
}

export const reportContent = async (data: Omit<ReportData, 'reportedBy'>) => {
  if (!isFirebaseConfigured || !db) return;
  
  const user = getAuthUser();
  if (!user) throw new Error("Você precisa estar logado para denunciar.");

  try {
    const reportsCol = collection(db, 'reports');
    await addDoc(reportsCol, {
      ...data,
      reportedBy: user.id,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    console.log("Denúncia enviada com sucesso.");
  } catch (e) {
    console.error("Erro ao enviar denúncia:", e);
    throw e;
  }
};

export const blockUser = async (userIdToBlock: string) => {
  if (!isFirebaseConfigured || !db) return;
  
  const currentUser = getAuthUser();
  if (!currentUser) throw new Error("Você precisa estar logado para bloquear usuários.");

  try {
    const userRef = doc(db, 'users', currentUser.id);
    await setDoc(userRef, {
      blockedUsers: arrayUnion(userIdToBlock)
    }, { merge: true });
    
    console.log(`Usuário ${userIdToBlock} bloqueado com sucesso.`);
  } catch (e) {
    console.error("Erro ao bloquear usuário:", e);
    throw e;
  }
};

export const isUserBlocked = async (userId: string): Promise<boolean> => {
  if (!isFirebaseConfigured || !db) return false;
  
  const currentUser = getAuthUser();
  if (!currentUser) return false;

  try {
    const userRef = doc(db, 'users', currentUser.id);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
      const data = snap.data();
      return data.blockedUsers?.includes(userId) || false;
    }
    return false;
  } catch (e) {
    console.error("Erro ao verificar bloqueio:", e);
    return false;
  }
};
