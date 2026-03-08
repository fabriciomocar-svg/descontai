import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { getComments, addComment, Comment } from '../services/comments';
import { getAuthUser } from '../services/auth';
import { useToast } from '../context/ToastContext';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotionId: string;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, promotionId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { error } = useToast();
  const user = getAuthUser();

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, promotionId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const fetchedComments = await getComments(promotionId);
      setComments(fetchedComments);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      error("Você precisa estar logado para comentar.");
      return;
    }

    setSubmitting(true);
    try {
      const added = await addComment(promotionId, newComment.trim());
      if (added) {
        setComments([added, ...comments]);
        setNewComment('');
      }
    } catch (err: any) {
      error("Erro ao enviar comentário: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full h-[70vh] sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-[32px] rounded-t-[32px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-black text-gray-900">Comentários</h3>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm font-medium">Nenhum comentário ainda.</p>
              <p className="text-xs mt-1">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {comment.userPhoto ? (
                    <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-600 font-bold text-xs">
                      {comment.userName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm text-gray-900">{comment.userName}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          {user ? (
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="w-full bg-transparent p-3 text-sm outline-none resize-none max-h-32 min-h-[44px]"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
              </div>
              <button 
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0 flex items-center justify-center"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
          ) : (
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 font-medium">Faça login para comentar.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CommentsModal;
