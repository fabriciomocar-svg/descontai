import { FAQ } from '../types';
import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  doc, 
  setDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

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
