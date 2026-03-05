import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  DocumentData,
  onSnapshot
} from 'firebase/firestore';

interface StoryData {
  storeId: string;
  lastPromoAt: number;
}

interface PromotionsContextType {
  promotions: Promotion[];
  stories: StoryData[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
}

const PromotionsContext = createContext<PromotionsContextType | undefined>(undefined);

const PAGE_SIZE = 5;

export const PromotionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch Stories (Active Promotions Metadata)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const fetchStories = async () => {
      try {
        // Buscar as últimas 50 promoções para garantir que pegamos todos os stories recentes
        // Isso é independente da paginação do feed principal
        const q = query(
          collection(db, 'promotions'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(q);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const validPromos = snapshot.docs
          .map(doc => doc.data() as Promotion)
          .filter(promo => {
            if (!promo.expiresAt) return true;
            try {
              const [day, month, year] = promo.expiresAt.split('/').map(Number);
              const expiryDate = new Date(year, month - 1, day);
              expiryDate.setHours(23, 59, 59, 999);
              return expiryDate >= now;
            } catch {
              return true;
            }
          });

        // Agrupar por loja e pegar a data mais recente
        const storiesMap = new Map<string, number>();
        validPromos.forEach(promo => {
          const currentLast = storiesMap.get(promo.storeId) || 0;
          const promoTime = (promo as any).createdAt?.seconds || 0;
          if (promoTime > currentLast) {
            storiesMap.set(promo.storeId, promoTime);
          }
        });

        const storiesList = Array.from(storiesMap.entries())
          .map(([storeId, lastPromoAt]) => ({ storeId, lastPromoAt }))
          .sort((a, b) => b.lastPromoAt - a.lastPromoAt);

        setStories(storiesList);
      } catch (err) {
        console.error("Erro ao carregar stories:", err);
      }
    };

    fetchStories();
  }, []);

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

      setPromotions(prev => {
        // Evitar duplicatas ao adicionar novos itens
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPromos = activePromos.filter(p => !existingIds.has(p.id));
        return isInitial ? activePromos : [...prev, ...uniqueNewPromos];
      });
    } catch (err: any) {
      console.error("Erro ao carregar promoções:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastDoc]);

  // Carregar inicial
  useEffect(() => {
    fetchPromotions(true);
  }, []);

  // Listener para atualizações em tempo real (apenas para novas promoções no topo)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const q = query(
      collection(db, 'promotions'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newPromo = { id: change.doc.id, ...change.doc.data() } as Promotion;
          
          // Verificar validade
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          let isValid = true;
          
          if (newPromo.expiresAt) {
            try {
              const [day, month, year] = newPromo.expiresAt.split('/').map(Number);
              const expiryDate = new Date(year, month - 1, day);
              expiryDate.setHours(23, 59, 59, 999);
              if (expiryDate < now) isValid = false;
            } catch (e) {
              // Ignorar erro de data
            }
          }

          if (isValid) {
            setPromotions(prev => {
              if (prev.some(p => p.id === newPromo.id)) return prev;
              return [newPromo, ...prev];
            });
          }
        }
        
        if (change.type === 'removed') {
           setPromotions(prev => prev.filter(p => p.id !== change.doc.id));
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchPromotions(false);
    }
  }, [loading, loadingMore, hasMore, fetchPromotions]);

  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchPromotions(true);
  }, [fetchPromotions]);

  return (
    <PromotionsContext.Provider value={{ promotions, stories, loading, loadingMore, hasMore, error, loadMore, refresh }}>
      {children}
    </PromotionsContext.Provider>
  );
};

export const usePromotionsContext = () => {
  const context = useContext(PromotionsContext);
  if (context === undefined) {
    throw new Error('usePromotionsContext must be used within a PromotionsProvider');
  }
  return context;
};
