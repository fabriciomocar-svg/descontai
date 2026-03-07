import { AuthUser } from '../types';
import { db, auth, isFirebaseConfigured } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { signOut, deleteUser } from 'firebase/auth';

const AUTH_KEY = 'descontai_auth_user';

export const getAuthUser = (): AuthUser | null => {
  const stored = localStorage.getItem(AUTH_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setAuthUser = (user: AuthUser | null) => {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('auth_change'));
};

export const logoutUser = async () => {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Erro ao deslogar do Firebase", e);
    }
  }
  setAuthUser(null);
};

export const deleteAccount = async () => {
  if (!auth || !auth.currentUser) return;
  
  const user = auth.currentUser;
  const userId = user.uid;

  try {
    // 1. Delete user document from Firestore
    if (db) {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    }

    // 2. Delete user from Firebase Auth
    await deleteUser(user);
    
    // 3. Clear local storage and state
    setAuthUser(null);
    localStorage.clear();
    
    // 4. Reload to ensure clean state
    window.location.reload();
  } catch (error: any) {
    console.error("Error deleting account:", error);
    if (error.code === 'auth/requires-recent-login') {
      throw new Error("Para sua segurança, faça login novamente antes de excluir sua conta.");
    }
    throw error;
  }
};

// Salva metadados do usuário no Firestore (como o Role)
export const saveUserMetadata = async (userId: string, data: Partial<AuthUser>) => {
  if (!isFirebaseConfigured || !db) return;
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, data, { merge: true });
};

export const getUserMetadata = async (userId: string): Promise<AuthUser | null> => {
  if (!isFirebaseConfigured || !db) return null;
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() as AuthUser : null;
};
