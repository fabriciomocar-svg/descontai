
import { useState, useEffect } from 'react';
import { Promotion } from '../types';
import { db, auth, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !auth?.currentUser) {
      setPromotions([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const promoList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Promotion[];
        
        setPromotions(promoList);
        setLoading(false);
      }, (error: any) => {
        console.error("Erro ao carregar promoções:", error);
        setPromotions([]);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Erro ao configurar snapshot de promoções:", error);
      setPromotions([]);
      setLoading(false);
    }
  }, []);

  return { 
    promotions, 
    loading, 
    error: null, 
    isUsingMock: false
  };
};
