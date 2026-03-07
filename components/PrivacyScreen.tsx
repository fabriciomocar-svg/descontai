import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, FileText, Lock, Eye, Server, UserX, AlertTriangle, Scale } from 'lucide-react';

interface PrivacyScreenProps {
  onBack: () => void;
}

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24 text-left">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-2 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="text-gray-600" size={24} />
        </button>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Legal</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 bg-white border-b border-gray-100 sticky top-[60px] z-10">
        <button 
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'privacy' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Privacidade (LGPD)
        </button>
        <button 
          onClick={() => setActiveTab('terms')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'terms' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Termos de Uso
        </button>
      </div>

      <div className="p-6 space-y-8">
        {activeTab === 'privacy' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-2 text-indigo-700">
                <ShieldCheck size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest">Resumo da Privacidade</h2>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Sua privacidade é nossa prioridade. Esta política descreve como coletamos, usamos e protegemos seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
                <Eye size={16} className="text-gray-400" /> 1. Dados Coletados
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed space-y-2">
                <p>Coletamos os seguintes dados para fornecer nossos serviços:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Dados de Identificação:</strong> Nome, e-mail, foto de perfil (via Google Auth ou cadastro).</li>
                  <li><strong>Dados de Localização:</strong> Geolocalização precisa (GPS) para exibir ofertas próximas (apenas com seu consentimento).</li>
                  <li><strong>Dados de Uso:</strong> Interações com ofertas, lojas visitadas, visualizações e cliques.</li>
                  <li><strong>Dados do Dispositivo:</strong> Modelo do aparelho, sistema operacional e identificadores únicos para notificações push.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
                <Server size={16} className="text-gray-400" /> 2. Finalidade do Tratamento
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed space-y-2">
                <p>Utilizamos seus dados para:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Personalizar o feed de ofertas com base na sua localização e preferências.</li>
                  <li>Permitir a comunicação entre usuários e lojistas via chat.</li>
                  <li>Enviar notificações sobre promoções relevantes e atualizações do serviço.</li>
                  <li>Melhorar a segurança e prevenir fraudes.</li>
                  <li>Cumprir obrigações legais e regulatórias.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
                <Lock size={16} className="text-gray-400" /> 3. Compartilhamento de Dados
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed">
                <p>
                  Não vendemos seus dados pessoais. Compartilhamos informações apenas com:
                </p>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  <li><strong>Lojistas Parceiros:</strong> Apenas quando você inicia um chat ou interage diretamente com uma oferta (ex: nome e foto de perfil).</li>
                  <li><strong>Provedores de Serviço:</strong> Empresas que nos ajudam a operar o app (ex: hospedagem, análise de dados), sob estritos contratos de confidencialidade.</li>
                  <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou ordem judicial.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
                <Scale size={16} className="text-gray-400" /> 4. Seus Direitos (LGPD)
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed">
                <p>Você tem o direito de:</p>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  <li>Confirmar a existência de tratamento de dados.</li>
                  <li>Acessar seus dados.</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                  <li>Revogar seu consentimento a qualquer momento.</li>
                  <li>Solicitar a exclusão dos seus dados pessoais.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
                <UserX size={16} className="text-rose-500" /> 5. Exclusão de Conta
              </h3>
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-xs text-rose-800 leading-relaxed">
                <p>
                  Você pode solicitar a exclusão definitiva da sua conta e de todos os seus dados a qualquer momento através da opção "Excluir Minha Conta" na tela de Perfil ou entrando em contato conosco pelo e-mail <strong>privacidade@descontai.com</strong>.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2 text-gray-700">
                <FileText size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest">Termos de Uso</h2>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ao utilizar o Descontaí, você concorda com estes termos. Leia atentamente.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                1. O Serviço
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed">
                <p>
                  O Descontaí é uma plataforma que conecta usuários a ofertas locais de lojistas parceiros. Não vendemos produtos diretamente; somos intermediários na divulgação de promoções.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                2. Responsabilidades do Usuário
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Você é responsável por manter a confidencialidade da sua conta.</li>
                  <li>Você concorda em fornecer informações verdadeiras e atualizadas.</li>
                  <li>É proibido usar o app para fins ilegais, spam ou assédio.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
                <AlertTriangle size={16} className="text-amber-500" /> 3. Conteúdo Gerado por Usuário
              </h3>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold mb-2">Política de Tolerância Zero:</p>
                <p>
                  Não toleramos conteúdo ofensivo, pornográfico, discurso de ódio, bullying ou qualquer material ilegal.
                </p>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  <li>Todo conteúdo (promoções, mensagens, perfis) pode ser denunciado pelos usuários.</li>
                  <li>Conteúdos denunciados serão analisados em até 24 horas.</li>
                  <li>Usuários que violarem estas regras serão bloqueados e banidos da plataforma.</li>
                  <li>Você pode bloquear usuários abusivos a qualquer momento através do menu de opções.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                4. Isenção de Responsabilidade
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed">
                <p>
                  Não nos responsabilizamos pela qualidade, entrega ou garantia dos produtos anunciados pelos lojistas. Qualquer problema com a compra deve ser resolvido diretamente com o estabelecimento.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                5. Alterações nos Termos
              </h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-600 leading-relaxed">
                <p>
                  Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças significativas. O uso contínuo do app implica aceitação dos novos termos.
                </p>
              </div>
            </section>
          </div>
        )}
        
        <div className="text-center pt-8 pb-4 border-t border-gray-100 mt-8">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Descontaí © 2026 • Versão 1.0.0
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            CNPJ: 00.000.000/0001-00
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyScreen;

