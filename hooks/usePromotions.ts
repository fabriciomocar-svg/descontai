
import { useState, useEffect } from 'react';
import { Promotion } from '../types';
import { db, auth, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
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
        
        // Filtrar promoções expiradas
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Zerar hora para comparar apenas data

        const activePromos = promoList.filter(promo => {
          if (!promo.expiresAt) return true; // Se não tiver data, assume válida
          
          try {
            // Formato esperado: DD/MM/YYYY
            const [day, month, year] = promo.expiresAt.split('/').map(Number);
            const expiryDate = new Date(year, month - 1, day);
            expiryDate.setHours(23, 59, 59, 999); // Expira no final do dia
            
            return expiryDate >= now;
          } catch (e) {
            console.warn(`Erro ao processar data de validade da promoção ${promo.id}:`, e);
            return true; // Em caso de erro, mantém (melhor mostrar do que esconder indevidamente)
          }
        });

        setPromotions(activePromos);
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
