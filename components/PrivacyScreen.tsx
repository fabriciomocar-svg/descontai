import React from 'react';
import { ChevronLeft, ShieldCheck, FileText, Trash2 } from 'lucide-react';
import { ViewType } from '../types';

interface PrivacyScreenProps {
  onBack: () => void;
}

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ onBack }) => {
  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24 text-left">
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-2 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="text-gray-600" size={24} />
        </button>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Privacidade & Termos</h1>
      </div>

      <div className="p-6 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-3 text-indigo-600">
            <ShieldCheck size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">Política de Privacidade</h2>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-sm text-gray-600 leading-relaxed space-y-4">
            <p>
              <strong>1. Coleta de Dados:</strong> Coletamos informações como seu nome, endereço de e-mail e foto de perfil (opcional) para criar e gerenciar sua conta. Também podemos coletar sua localização aproximada para exibir ofertas relevantes próximas a você.
            </p>
            <p>
              <strong>2. Uso das Informações:</strong> Utilizamos seus dados para personalizar sua experiência, enviar notificações sobre promoções (se autorizado) e melhorar nossos serviços. Não vendemos seus dados pessoais a terceiros.
            </p>
            <p>
              <strong>3. Segurança:</strong> Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado, alteração ou destruição.
            </p>
            <p>
              <strong>4. Seus Direitos (LGPD):</strong> Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Para exercer esses direitos, utilize as opções no aplicativo ou entre em contato conosco.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3 text-indigo-600">
            <FileText size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">Termos de Uso</h2>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-sm text-gray-600 leading-relaxed space-y-4">
            <p>
              <strong>1. Aceitação:</strong> Ao utilizar nosso aplicativo, você concorda com estes Termos de Uso e nossa Política de Privacidade.
            </p>
            <p>
              <strong>2. Uso do Serviço:</strong> O aplicativo é destinado ao uso pessoal e não comercial. Você concorda em não utilizar o serviço para fins ilegais ou não autorizados.
            </p>
            <p>
              <strong>3. Conteúdo:</strong> As promoções exibidas são de responsabilidade dos lojistas parceiros. Não garantimos a disponibilidade ou precisão das ofertas.
            </p>
            <p>
              <strong>4. Alterações:</strong> Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso continuado do aplicativo após as alterações constitui aceitação dos novos termos.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3 text-rose-600">
            <Trash2 size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">Exclusão de Dados</h2>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 text-sm text-gray-600 leading-relaxed">
            <p>
              Para excluir sua conta e todos os dados associados permanentemente, acesse a tela de <strong>Perfil</strong> e utilize a opção <strong>"Excluir Minha Conta"</strong> na parte inferior da tela. Esta ação é irreversível.
            </p>
          </div>
        </section>
        
        <div className="text-center pt-8 pb-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Última atualização: Março de 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyScreen;
