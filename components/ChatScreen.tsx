import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Loader2 } from 'lucide-react';
import { getAuthUser, sendMessage, markChatAsRead } from '../constants';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ChatMessage } from '../types';

interface ChatScreenProps {
  chatId: string;
  recipientName: string;
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, recipientName, onBack }) => {
  const user = getAuthUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) return;

    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  useEffect(() => {
    if (user && chatId) {
      markChatAsRead(chatId);
    }
  }, [messages, user, chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendMessage(chatId, user.id, text);
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
      setNewMessage(text); // Restore message on failure
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative z-[60]">
      <div className="bg-white p-4 flex items-center gap-3 border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="font-black text-gray-900 text-lg leading-tight">{recipientName}</h2>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Chat em tempo real</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
            <p className="text-xs mt-1">Envie uma mensagem para começar!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
