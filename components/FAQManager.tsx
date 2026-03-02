
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Loader2, ChevronDown, ChevronUp, HelpCircle, ArrowLeft } from 'lucide-react';
import { getFAQs, saveFAQ, deleteFAQ } from '../constants';
import { FAQ } from '../types';

interface FAQManagerProps {
  onBack?: () => void;
}

const FAQManager: React.FC<FAQManagerProps> = ({ onBack }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    category: 'Geral',
    order: 0
  });

  const fetchFAQs = async () => {
    setLoading(true);
    const data = await getFAQs();
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const handleSave = async () => {
    if (!formData.question || !formData.answer) {
      alert("Preencha a pergunta e a resposta.");
      return;
    }

    setSaving(true);
    try {
      await saveFAQ(formData);
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ question: '', answer: '', category: 'Geral', order: faqs.length });
      await fetchFAQs();
    } catch (e) {
      alert("Erro ao salvar FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pergunta?")) return;
    
    try {
      await deleteFAQ(id);
      await fetchFAQs();
    } catch (e) {
      alert("Erro ao excluir FAQ.");
    }
  };

  const startEdit = (faq: FAQ) => {
    setFormData(faq);
    setEditingId(faq.id);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-gray-50 overflow-y-auto no-scrollbar pb-24 text-left">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter italic uppercase">Gerenciar FAQ</h1>
            <p className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase">Perguntas Frequentes do App</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setFormData({ question: '', answer: '', category: 'Geral', order: faqs.length });
            setEditingId(null);
            setShowAddModal(true);
          }}
          className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          <Plus size={18} /> Nova Pergunta
        </button>
      </div>

      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border-2 border-dashed border-gray-200 text-center">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma pergunta cadastrada ainda.</p>
          </div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm group hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {faq.category || 'Geral'}
                    </span>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                      Ordem: {faq.order}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 leading-tight mb-2">{faq.question}</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{faq.answer}</p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(faq)}
                    className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(faq.id)}
                    className="p-2 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-black italic mb-6 uppercase tracking-tight">
              {editingId ? 'EDITAR PERGUNTA' : 'NOVA PERGUNTA'}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoria</label>
                <input 
                  type="text" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ex: Pagamentos, Lojas, Geral"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pergunta</label>
                <input 
                  type="text" 
                  value={formData.question} 
                  onChange={e => setFormData({...formData, question: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Qual a sua dúvida?"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Resposta</label>
                <textarea 
                  value={formData.answer} 
                  onChange={e => setFormData({...formData, answer: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[120px]"
                  placeholder="Explique detalhadamente..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ordem de Exibição</label>
                <input 
                  type="number" 
                  value={formData.order} 
                  onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 transition-all mt-4"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? 'SALVANDO...' : 'SALVAR NO FIREBASE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQManager;
