
import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react';
import { getFAQs } from '../constants';
import { FAQ } from '../types';

interface FAQScreenProps {
  onBack: () => void;
}

const FAQScreen: React.FC<FAQScreenProps> = ({ onBack }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFAQs = async () => {
      const data = await getFAQs();
      setFaqs(data);
      setLoading(false);
    };
    fetchFAQs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white overflow-y-auto no-scrollbar pb-24 text-left">
      <div className="bg-white p-6 sticky top-0 z-10 border-b border-gray-100 shadow-sm flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Central de Ajuda</h1>
      </div>

      <div className="p-6">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Como podemos ajudar?" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`border rounded-2xl transition-all ${openId === faq.id ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-100 bg-white'}`}
              >
                <button 
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">
                      {faq.category || 'Geral'}
                    </span>
                    <h3 className="text-sm font-bold text-gray-800 leading-tight">{faq.question}</h3>
                  </div>
                  {openId === faq.id ? <ChevronUp size={18} className="text-indigo-500" /> : <ChevronDown size={18} className="text-gray-300" />}
                </button>
                
                {openId === faq.id && (
                  <div className="px-5 pb-5 animate-fade-in">
                    <div className="h-px bg-indigo-100/50 mb-4" />
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <HelpCircle size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum resultado encontrado.</p>
            </div>
          )}
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-[32px] border border-gray-100 text-center">
          <h4 className="text-sm font-black text-gray-900 mb-2">Ainda precisa de ajuda?</h4>
          <p className="text-xs text-gray-500 font-medium mb-6">Nossa equipe está pronta para te atender via WhatsApp.</p>
          <a 
            href="https://wa.me/5535992220298" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all"
          >
            Falar com Suporte
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQScreen;
