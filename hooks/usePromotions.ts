
import { useState, useEffect, useCallback } from 'react';
import { Promotion } from '../types';
import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

const PAGE_SIZE = 5;

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async (isInitial = false) => {
    if (!isFirebaseConfigured || !db) {
      setPromotions([]);
      setLoading(false);
      return;
    }

    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let q = query(
        collection(db, 'promotions'), 
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!isInitial && lastDoc) {
        q = query(
          collection(db, 'promotions'), 
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      
      const newPromos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];

      // Filtrar promoções expiradas
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const activePromos = newPromos.filter(promo => {
        if (!promo.expiresAt) return true;
        try {
          const [day, month, year] = promo.expiresAt.split('/').map(Number);
          const expiryDate = new Date(year, month - 1, day);
          expiryDate.setHours(23, 59, 59, 999);
          return expiryDate >= now;
        } catch (e) {
          return true;
        }
      });

      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      setPromotions(prev => isInitial ? activePromos : [...prev, ...activePromos]);
    } catch (err: any) {
      console.error("Erro ao carregar promoções:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastDoc]);

  useEffect(() => {
    fetchPromotions(true);
  }, []);

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchPromotions(false);
    }
  };

  const refresh = () => {
    setLastDoc(null);
    setHasMore(true);
    fetchPromotions(true);
  };

  return { 
    promotions, 
    loading, 
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    error, 
    isUsingMock: false
  };
};
