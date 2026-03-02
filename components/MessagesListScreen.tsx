import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, Loader2 } from 'lucide-react';
import { getAuthUser, getStores, getOrCreateChat } from '../constants';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { Chat, ViewType, Store } from '../types';

interface MessagesListScreenProps {
  onBack: () => void;
  onOpenChat: (chatId: string, recipientName: string) => void;
}

const MessagesListScreen: React.FC<MessagesListScreenProps> = ({ onBack, onOpenChat }) => {
  const user = getAuthUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) return;

    // Fetch Chats
    const chatsCol = collection(db, 'chats');
    const isMerchant = user.role === 'MERCHANT';
    const field = isMerchant ? 'merchantId' : 'userId';
    const value = isMerchant ? user.merchantId : user.id;

    const q = query(chatsCol, where(field, '==', value));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      
      // Sort client-side
      chatList.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });

      setChats(chatList);
      setLoading(false);
    });

    // Fetch Stores for "New Chat" (only for regular users)
    if (!isMerchant) {
      const fetchStores = async () => {
        try {
          const allStores = await getStores();
          setStores(allStores.filter(s => s.isPartner));
        } catch (err) {
          console.error("Error fetching stores", err);
        }
      };
      fetchStores();
    }

    return () => unsubscribe();
  }, [user]);

  const handleStoreClick = async (store: Store) => {
    if (!user) return;
    const chatId = await getOrCreateChat(user.id, store.id, user.name, store.name);
    if (chatId) {
      onOpenChat(chatId, store.name);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative z-[50]">
      <div className="bg-white p-4 flex items-center gap-3 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="font-black text-gray-900 text-lg leading-tight">Mensagens</h2>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Suas Conversas</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-24">
        {/* New Chat Section (Stores) */}
        {user?.role !== 'MERCHANT' && stores.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Iniciar Nova Conversa</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {stores.map((store) => (
                <button 
                  key={store.id} 
                  onClick={() => handleStoreClick(store)}
                  className="flex flex-col items-center gap-2 shrink-0 group"
                >
                  <div className="p-[2px] rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 shadow-sm group-active:scale-95 transition-transform">
                    <div className="p-0.5 bg-white rounded-full">
                      <img 
                        src={store.logo} 
                        alt={store.name} 
                        className="w-14 h-14 rounded-full object-cover border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-700 font-bold truncate w-16 text-center">
                    {store.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing Chats List */}
        <div>
          {user?.role !== 'MERCHANT' && chats.length > 0 && (
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Recentes</h3>
          )}
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
              <p className="text-xs mt-1">Selecione uma loja acima para começar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map((chat) => {
                const isMerchant = user?.role === 'MERCHANT';
                const recipientName = isMerchant ? chat.userName : chat.storeName;
                
                return (
                  <button 
                    key={chat.id}
                    onClick={() => onOpenChat(chat.id, recipientName)}
                    className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:bg-gray-50 transition-colors active:scale-[0.98] text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0">
                      {recipientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{recipientName}</h3>
                        {chat.updatedAt && (
                          <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                            {new Date(chat.updatedAt?.toDate?.() || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage || 'Nova conversa iniciada'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesListScreen;
