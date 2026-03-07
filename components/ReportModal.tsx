import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { reportContent } from '../services/moderation';
import { useToast } from '../context/ToastContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'promotion' | 'store' | 'user' | 'chat';
}

const REPORT_REASONS = [
  "Conteúdo Inapropriado",
  "Spam ou Fraude",
  "Discurso de Ódio",
  "Informação Falsa",
  "Violação de Direitos Autorais",
  "Outro"
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, contentId, contentType }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async () => {
    if (!selectedReason) {
      error("Selecione um motivo para a denúncia.");
      return;
    }

    setLoading(true);
    try {
      await reportContent({
        contentId,
        contentType,
        reason: selectedReason,
        description
      });
      success("Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.");
      onClose();
    } catch (err: any) {
      error("Erro ao enviar denúncia: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={20} />
                <h3 className="font-bold text-lg">Denunciar Conteúdo</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Selecione o motivo que melhor descreve o problema com este conteúdo. Sua denúncia é anônima.
              </p>

              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedReason === reason
                        ? 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {selectedReason === 'Outro' && (
                <textarea
                  className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                  placeholder="Descreva o problema com mais detalhes..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}

              <div className="pt-2 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedReason}
                  className="flex-1 py-3 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar Denúncia'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
