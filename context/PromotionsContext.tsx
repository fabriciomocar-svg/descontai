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

import { deletePromotion } from '../constants';

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

  const PAGE_SIZE = 10;

  export const PromotionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = React.useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch Stories (Active Promotions Metadata) - Real-time
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    // Monitorar metadados de promoções para os stories (círculos)
    const q = query(
      collection(db, 'promotions'),
      orderBy('createdAt', 'desc'),
      limit(300) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const validPromos: Promotion[] = [];

      snapshot.docs.forEach(doc => {
        const promo = doc.data() as Promotion;
        let isValid = true;

        if (promo.expiresAt) {
          try {
            const [day, month, year] = promo.expiresAt.split('/').map(Number);
            const expiryDate = new Date(year, month - 1, day);
            expiryDate.setHours(23, 59, 59, 999);
            
            if (expiryDate < now) {
              isValid = false;
              // Deletar promoção expirada do backend
              console.log(`🗑️ Story expirado (filtrado): ${doc.id}`);
            }
          } catch {
            // Se der erro na data, assume válido por segurança ou inválido? 
            // Melhor manter válido para não deletar por erro de parse
          }
        }

        if (isValid) {
          validPromos.push(promo);
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

      // Converter para lista e ordenar: Mais recente primeiro (Esquerda -> Direita)
      const storiesList = Array.from(storiesMap.entries())
        .map(([storeId, lastPromoAt]) => ({ storeId, lastPromoAt }))
        .sort((a, b) => b.lastPromoAt - a.lastPromoAt);

      setStories(storiesList);
    }, (err) => {
      console.error("Erro ao carregar stories em tempo real:", err);
    });

    return () => unsubscribe();
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
        lastDocRef.current = null; // Reset cursor on initial load
      } else {
        setLoadingMore(true);
      }

      let q = query(
        collection(db, 'promotions'), 
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!isInitial && lastDocRef.current) {
        q = query(
          collection(db, 'promotions'), 
          orderBy('createdAt', 'desc'),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      
      const newPromos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];

      // Filtrar promoções expiradas e deletar do backend
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const activePromos: Promotion[] = [];

      for (const promo of newPromos) {
        let isValid = true;
        if (promo.expiresAt) {
          try {
            const [day, month, year] = promo.expiresAt.split('/').map(Number);
            const expiryDate = new Date(year, month - 1, day);
            expiryDate.setHours(23, 59, 59, 999);
            
            if (expiryDate < now) {
              isValid = false;
              console.log(`🗑️ Promoção expirada no feed (filtrada): ${promo.id}`);
            }
          } catch (e) {
            // Ignorar erro de data
          }
        }
        
        if (isValid) {
          activePromos.push(promo);
        }
      }

      // Update cursor
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }

      // Check if we reached the end of the collection
      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // Se baixamos dados mas tudo foi filtrado (expirado), e ainda tem mais no banco,
      // buscamos a próxima página automaticamente para não travar o scroll.
      if (activePromos.length === 0 && snapshot.docs.length === PAGE_SIZE) {
        console.log("Página cheia de itens expirados, buscando próxima...");
        return fetchPromotions(false);
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
      if (isInitial) setLoading(false);
      setLoadingMore(false);
    }
  }, []);

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
