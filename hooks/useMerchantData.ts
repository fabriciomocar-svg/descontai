import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Promotion } from '../types';
import { getAuthUser } from '../constants';

export const useMerchantData = () => {
  const user = getAuthUser();
  const [allMerchantPromos, setAllMerchantPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.merchantId || !isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'promotions'),
      where('storeId', '==', user.merchantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];
      
      // Sort by creation date desc
      promos.sort((a, b) => {
        // Assuming createdAt exists, otherwise fallback
        return (b as any).createdAt?.seconds - (a as any).createdAt?.seconds || 0;
      });

      setAllMerchantPromos(promos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.merchantId]);

  const stats = useMemo(() => {
    return allMerchantPromos.reduce((acc, promo) => {
      return {
        views: acc.views + (promo.views || 0),
        likes: acc.likes + (promo.likes || 0),
        saves: acc.saves + (promo.saves || 0)
      };
    }, { views: 0, likes: 0, saves: 0 });
  }, [allMerchantPromos]);

  return {
    promotions: allMerchantPromos,
    stats,
    loading
  };
};
