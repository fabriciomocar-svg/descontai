
import { Store, Promotion, AuthUser, UserRole, FAQ, Category } from './types';
import { db, auth, isFirebaseConfigured } from './firebase';
export { db, auth, isFirebaseConfigured };
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  orderBy
} from 'firebase/firestore';
import { signOut, deleteUser } from 'firebase/auth';

const AUTH_KEY = 'descontai_auth_user';

// --- Funções de Usuário (Auth & Firestore Sync) ---

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

// --- Funções de Lojas (v1.1) ---

export const getStores = async (): Promise<Store[]> => {
  if (!isFirebaseConfigured || !db) return [];
  
  const user = getAuthUser();
  if (!user) return [];

  try {
    const storesCol = collection(db, 'stores');
    const snap = await getDocs(storesCol);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      console.warn("⚠️ ERRO DE PERMISSÃO: O Firestore bloqueou a leitura das lojas. Verifique se as 'Rules' no Console do Firebase permitem leitura pública ou para usuários autenticados.");
    } else {
      console.error("Erro ao buscar lojas:", e);
    }
    return [];
  }
};

export const getStoreById = async (id: string): Promise<Store | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const storeRef = doc(db, 'stores', id);
    const snap = await getDoc(storeRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } as Store : null;
  } catch (e: any) {
    if (e.code !== 'permission-denied') console.error("Erro ao buscar loja:", e);
    return null;
  }
};

export const getStoreByEmail = async (email: string): Promise<Store | null> => {
  const normalizedEmail = email.toLowerCase().trim();
  if (!isFirebaseConfigured || !db) return null;
  try {
    const storesCol = collection(db, 'stores');
    const q = query(storesCol, where('ownerEmail', '==', normalizedEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Store;
    }
    return null;
  } catch (e: any) {
    if (e.code !== 'permission-denied') console.error("Erro ao buscar loja por email:", e);
    return null;
  }
};

export const saveStore = async (store: Partial<Store>) => {
  const storeToSave = { ...store };
  if (storeToSave.ownerEmail) {
    storeToSave.ownerEmail = storeToSave.ownerEmail.toLowerCase().trim();
  }

  if (!isFirebaseConfigured || !db) {
    throw new Error("O banco de dados não está configurado.");
  }

  const user = getAuthUser();
  if (!user) {
    throw new Error("Você precisa estar autenticado para realizar esta ação.");
  }

  try {
    const storesCol = collection(db, 'stores');
    if (store.id) {
      const storeRef = doc(db, 'stores', store.id);
      const { id, ...data } = storeToSave;
      // Remove undefined values to prevent Firestore errors
      Object.keys(data).forEach(key => data[key as keyof typeof data] === undefined && delete data[key as keyof typeof data]);
      await setDoc(storeRef, data, { merge: true });
    } else {
      const { id, ...data } = storeToSave;
      // Remove undefined values to prevent Firestore errors
      Object.keys(data).forEach(key => data[key as keyof typeof data] === undefined && delete data[key as keyof typeof data]);
      await addDoc(storesCol, {
        ...data,
        createdAt: serverTimestamp()
      });
    }
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      throw new Error("⚠️ PERMISSÃO NEGADA: O Firestore bloqueou a gravação. Vá no Console do Firebase > Firestore > Rules e altere para permitir escrita (ex: allow write: if true; para testes ou allow write: if request.auth != null; para produção).");
    }
    console.error("Erro ao salvar loja no Firestore:", e);
    throw e;
  }
};

export const deleteStore = async (id: string) => {
  if (!isFirebaseConfigured || !db) {
    console.error("Firebase não configurado ao tentar deletar loja.");
    return;
  }
  
  console.log(`Iniciando exclusão da loja: ${id}`);
  try {
    const storeRef = doc(db, 'stores', id);
    const storeSnap = await getDoc(storeRef);
    
    if (storeSnap.exists()) {
      const storeData = storeSnap.data() as Store;
      const email = storeData.ownerEmail?.toLowerCase().trim();
      
      // 1. Deletar todas as promoções desta loja
      try {
        const promosCol = collection(db, 'promotions');
        const qPromos = query(promosCol, where('storeId', '==', id));
        const promosSnap = await getDocs(qPromos);
        const deletePromoPromises = promosSnap.docs.map(pDoc => deleteDoc(doc(db, 'promotions', pDoc.id)));
        await Promise.all(deletePromoPromises);
        console.log(`${promosSnap.size} promoções da loja removidas.`);
      } catch (promoErr) {
        console.warn("Erro ao remover promoções da loja, prosseguindo...", promoErr);
      }

      // 2. Tentar remover o usuário associado
      if (email) {
        console.log(`Lojista associado encontrado: ${email}. Tentando remover usuário...`);
        try {
          const usersCol = collection(db, 'users');
          const q = query(usersCol, where('email', '==', email));
          const userSnap = await getDocs(q);
          
          if (!userSnap.empty) {
            const userDocId = userSnap.docs[0].id;
            await deleteDoc(doc(db, 'users', userDocId));
            console.log(`Usuário ${email} removido com sucesso.`);
          }
        } catch (userErr: any) {
          if (userErr.code !== 'permission-denied') {
            console.warn("Não foi possível deletar o documento do usuário:", userErr);
          } else {
            console.warn("Sem permissão para deletar o documento do usuário, prosseguindo com a loja.");
          }
        }
      }
    }

    await deleteDoc(storeRef);
    console.log(`Loja ${id} removida com sucesso do Firestore.`);
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      console.error("Erro de permissão ao deletar loja:", e);
      throw new Error("⚠️ PERMISSÃO NEGADA: O Firestore bloqueou a exclusão. Verifique as 'Rules' no Console do Firebase.");
    }
    console.error("Erro ao deletar loja:", e);
    throw e;
  }
};

export const deleteAllStores = async () => {
  if (!isFirebaseConfigured || !db) return;
  
  try {
    console.log("Iniciando reset total do banco de dados...");
    
    // 1. Deletar todas as lojas
    const storesCol = collection(db, 'stores');
    const storesSnap = await getDocs(storesCol);
    const deleteStorePromises = storesSnap.docs.map(docSnap => deleteDoc(doc(db, 'stores', docSnap.id)));
    
    // 2. Deletar todas as promoções
    const promosCol = collection(db, 'promotions');
    const promosSnap = await getDocs(promosCol);
    const deletePromoPromises = promosSnap.docs.map(docSnap => deleteDoc(doc(db, 'promotions', docSnap.id)));
    
    // 3. Deletar todos os usuários (exceto o admin principal se desejar manter o registro, mas aqui vamos limpar tudo conforme pedido)
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    // Filtramos para não deletar o metadata do admin principal para evitar problemas de permissão imediatos, 
    // mas deletamos todos os outros.
    const deleteUserPromises = usersSnap.docs
      .filter(docSnap => docSnap.data().email !== 'admin@descontai.com')
      .map(docSnap => deleteDoc(doc(db, 'users', docSnap.id)));

    await Promise.all([
      ...deleteStorePromises,
      ...deletePromoPromises,
      ...deleteUserPromises
    ]);
    
    console.log("Reset total concluído com sucesso.");
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      console.error("Erro de permissão no reset total:", e);
      throw new Error("⚠️ PERMISSÃO NEGADA: O Firestore bloqueou o reset total. Verifique as 'Rules' no Console do Firebase.");
    }
    console.error("Erro ao realizar reset total:", e);
    throw e;
  }
};

export const deletePromotion = async (id: string) => {
  if (!isFirebaseConfigured || !db) {
    console.error("❌ ERRO CRÍTICO: Firebase não configurado ou DB nulo no momento da exclusão.");
    throw new Error("Banco de dados desconectado. Verifique sua conexão ou configuração.");
  }
  
  console.log(`🗑️ Iniciando exclusão do documento: promotions/${id}`);
  
  try {
    const promoRef = doc(db, 'promotions', id);
    await deleteDoc(promoRef);
    console.log(`✅ Documento promotions/${id} excluído com sucesso!`);
  } catch (e: any) {
    console.error(`❌ ERRO AO DELETAR (Code: ${e.code}):`, e);
    throw e;
  }
};

export const saveLocalPromotion = async (promo: Omit<Promotion, 'id'>) => {
  if (!isFirebaseConfigured || !db) return;
  const promosCol = collection(db, 'promotions');
  await addDoc(promosCol, {
    ...promo,
    createdAt: serverTimestamp()
  });
};

export const getLocalPromotions = () => []; 
export const clearLocalPromotions = () => {};
export const getMerchantProfile = () => ({ name: 'Carregando...', logo: '' });
export const saveMerchantProfile = () => {};

export const seedDemoData = () => {};

// --- Analytics (Visitas) ---

export const trackVisit = async () => {
  if (!isFirebaseConfigured || !db) return;
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const visitRef = doc(db, 'analytics', `visits_${today}`);
  
  try {
    // Incrementa o contador do dia atual. Se não existir, o setDoc com merge cria.
    await setDoc(visitRef, { 
      count: increment(1),
      date: today,
      lastUpdate: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn("Erro ao registrar visita:", e);
  }
};

export const getDailyVisits = async (): Promise<number> => {
  if (!isFirebaseConfigured || !db) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const visitRef = doc(db, 'analytics', `visits_${today}`);
  
  try {
    const snap = await getDoc(visitRef);
    if (snap.exists()) {
      return snap.data().count || 0;
    }
    return 0;
  } catch (e) {
    console.error("Erro ao buscar visitas diárias:", e);
    return 0;
  }
};

// --- Funções de Interação (Salvar/Curtir) ---

export const toggleSavePromotion = async (promotionId: string, currentlySaved: boolean) => {
  if (!isFirebaseConfigured || !db) return;
  
  const user = getAuthUser();
  if (!user) return;

  try {
    const userRef = doc(db, 'users', user.id);
    const promoRef = doc(db, 'promotions', promotionId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      let savedPromotions = userData.savedPromotions || [];
      
      if (currentlySaved) {
        // Remove from saved
        savedPromotions = savedPromotions.filter((id: string) => id !== promotionId);
        await setDoc(promoRef, { saves: increment(-1) }, { merge: true });
      } else {
        // Add to saved
        if (!savedPromotions.includes(promotionId)) {
          savedPromotions.push(promotionId);
          await setDoc(promoRef, { saves: increment(1) }, { merge: true });
        }
      }
      
      await setDoc(userRef, { savedPromotions }, { merge: true });
    } else {
      // Create user doc if it doesn't exist
      if (!currentlySaved) {
        await setDoc(userRef, { savedPromotions: [promotionId] }, { merge: true });
        await setDoc(promoRef, { saves: increment(1) }, { merge: true });
      }
    }
  } catch (e) {
    console.error("Erro ao salvar/remover promoção:", e);
    throw e;
  }
};

export const toggleLikePromotion = async (promotionId: string, currentlyLiked: boolean) => {
  if (!isFirebaseConfigured || !db) return;
  
  const user = getAuthUser();
  if (!user) return;

  try {
    const userRef = doc(db, 'users', user.id);
    const promoRef = doc(db, 'promotions', promotionId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      let likedPromotions = userData.likedPromotions || [];
      
      if (currentlyLiked) {
        // Remove from liked
        likedPromotions = likedPromotions.filter((id: string) => id !== promotionId);
        await setDoc(promoRef, { likes: increment(-1) }, { merge: true });
      } else {
        // Add to liked
        if (!likedPromotions.includes(promotionId)) {
          likedPromotions.push(promotionId);
          await setDoc(promoRef, { likes: increment(1) }, { merge: true });
        }
      }
      
      await setDoc(userRef, { likedPromotions }, { merge: true });
    } else {
      // Create user doc if it doesn't exist
      if (!currentlyLiked) {
        await setDoc(userRef, { likedPromotions: [promotionId] }, { merge: true });
        await setDoc(promoRef, { likes: increment(1) }, { merge: true });
      }
    }
  } catch (e) {
    console.error("Erro ao curtir/descurtir promoção:", e);
    throw e;
  }
};

export const incrementPromotionView = async (promotionId: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const promoRef = doc(db, 'promotions', promotionId);
    await setDoc(promoRef, { views: increment(1) }, { merge: true });
  } catch (e) {
    console.warn("Erro ao incrementar visualização:", e);
  }
};

// --- FAQ Functions ---

export const getFAQs = async (): Promise<FAQ[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const faqCol = collection(db, 'faqs');
    const q = query(faqCol, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ));
  } catch (e) {
    console.error("Erro ao buscar FAQs:", e);
    return [];
  }
};

export const saveFAQ = async (faq: Partial<FAQ>) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const faqCol = collection(db, 'faqs');
    if (faq.id) {
      const faqRef = doc(db, 'faqs', faq.id);
      const { id, ...data } = faq;
      await setDoc(faqRef, data, { merge: true });
    } else {
      await addDoc(faqCol, {
        ...faq,
        createdAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.error("Erro ao salvar FAQ:", e);
    throw e;
  }
};

export const deleteFAQ = async (id: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const faqRef = doc(db, 'faqs', id);
    await deleteDoc(faqRef);
  } catch (e) {
    console.error("Erro ao deletar FAQ:", e);
    throw e;
  }
};

// --- Chat Functions ---

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

// --- Geolocation Functions ---
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const getUserLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.warn("Geolocation error:", error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

export const getCategories = async (): Promise<Category[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const categoriesCol = collection(db, 'categories');
    const snap = await getDocs(categoriesCol);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (e) {
    console.error("Erro ao buscar categorias:", e);
    return [];
  }
};

export const addCategory = async (name: string): Promise<Category | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const categoriesCol = collection(db, 'categories');
    const docRef = await addDoc(categoriesCol, { name });
    return { id: docRef.id, name };
  } catch (e) {
    console.error("Erro ao adicionar categoria:", e);
    return null;
  }
};

export const deleteCategory = async (id: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const categoryRef = doc(db, 'categories', id);
    await deleteDoc(categoryRef);
  } catch (e) {
    console.error("Erro ao deletar categoria:", e);
    throw e;
  }
};
