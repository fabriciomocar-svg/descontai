
import React, { useState } from 'react';
import { Mail, Lock, User, Store, ArrowRight, Loader2, ShieldCheck, Info, ChevronLeft, MessageSquare, UserCircle, KeyRound } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { setAuthUser, saveUserMetadata, getUserMetadata, getStoreByEmail } from '../constants';
import { UserRole, AuthUser } from '../types';
import { Logo } from './Logo';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');
  const [role, setRole] = useState<UserRole>('CONSUMER');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      alert("Por favor, digite seu e-mail para recuperar a senha.");
      return;
    }

    setLoading(true);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, formData.email);
        alert("E-mail de recuperação enviado! Verifique sua caixa de entrada (e spam) para redefinir sua senha.");
        setMode('LOGIN');
      } else {
        alert("Erro: Serviço de autenticação indisponível.");
      }
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de recuperação:", error);
      if (error.code === 'auth/user-not-found') {
        alert("Este e-mail não está cadastrado.");
      } else if (error.code === 'auth/invalid-email') {
        alert("E-mail inválido.");
      } else {
        alert("Erro ao enviar e-mail. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // --- MASTER ADMIN ACCESS ---
    // Tenta autenticar o admin no Firebase para garantir permissões de nuvem
    if (formData.email === 'admin@descontai.com' && formData.password === 'Bmf352415@') {
      try {
        let userCred;
        try {
          // 1. Tenta o login direto
          userCred = await signInWithEmailAndPassword(auth!, formData.email, formData.password);
        } catch (authErr: any) {
          const errCode = authErr.code || '';
          const errMsg = authErr.message || '';
          // 2. Se não existir ou der erro de credencial, tenta criar
          if (errCode.includes('user-not-found') || errCode.includes('invalid-credential') || errCode.includes('wrong-password') || errMsg.includes('invalid-credential')) {
            try {
              userCred = await createUserWithEmailAndPassword(auth!, formData.email, formData.password);
            } catch (createErr: any) {
              // 3. Se o e-mail já existir (senha diferente no Firebase), usamos o bypass local
              if (createErr.code === 'auth/email-already-in-use') {
                console.warn("Master Admin: E-mail já cadastrado com outra senha no Firebase. Usando bypass local.");
                throw new Error("local-bypass");
              }
              throw createErr;
            }
          } else {
            throw authErr;
          }
        }

        const adminUser: AuthUser = {
          id: userCred.user.uid,
          email: formData.email,
          name: 'Administrador Principal',
          role: 'ADMIN'
        };
        
        try {
          await saveUserMetadata(userCred.user.uid, adminUser);
        } catch (metaErr) {
          console.warn("Não foi possível salvar metadata do admin, mas o login foi realizado.");
        }

        setAuthUser(adminUser);
        setLoading(false);
        return;
      } catch (err: any) {
        // Fallback total para bypass local em caso de qualquer erro de rede ou conflito
        const adminUser: AuthUser = {
          id: 'master_admin',
          email: formData.email,
          name: 'Administrador Principal (Local)',
          role: 'ADMIN'
        };
        setAuthUser(adminUser);
        setLoading(false);
        return;
      }
    }
    // ---------------------------

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      alert("O sistema está em manutenção. Por favor, tente novamente mais tarde.");
      return;
    }

    try {
      if (mode === 'SIGNUP') {
        try {
          if (role === 'MERCHANT') {
            // 1. Cria o usuário no Firebase Auth primeiro para ter permissão de leitura no Firestore
            const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
            
            // 2. Agora que está autenticado, verifica se tem loja
            const store = await getStoreByEmail(formData.email.trim());
            
            if (!store) {
              // Se não tem loja, salva como CONSUMER e avisa
              const newUser: AuthUser = {
                id: userCred.user.uid,
                email: formData.email.trim(),
                name: formData.name,
                role: 'CONSUMER'
              };
              await saveUserMetadata(userCred.user.uid, newUser);
              setAuthUser(newUser);
              setLoading(false);
              alert("Conta criada com sucesso! No entanto, este e-mail ainda não foi registrado como parceiro pelo administrador. Você acessará como Consumidor até que sua loja seja vinculada.");
              return;
            }
            
            // Se tem loja, salva como MERCHANT
            const newUser: AuthUser = {
              id: userCred.user.uid,
              email: formData.email.trim(),
              name: formData.name || store.name,
              role: 'MERCHANT',
              merchantId: store.id
            };
            await saveUserMetadata(userCred.user.uid, newUser);
            setAuthUser(newUser);
          } else {
            const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
            const newUser: AuthUser = {
              id: userCred.user.uid,
              email: formData.email.trim(),
              name: formData.name,
              role: 'CONSUMER'
            };
            await saveUserMetadata(userCred.user.uid, newUser);
            setAuthUser(newUser);
          }
        } catch (signupError: any) {
          const errorCode = signupError.code || '';
          if (errorCode === 'auth/email-already-in-use') {
            // Se o email já existe, tenta fazer login automaticamente
            console.log("Email já em uso. Tentando login automático...");
            try {
              const userCred = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
              let metadata = await getUserMetadata(userCred.user.uid);
              
              if (metadata) {
                setAuthUser(metadata);
                setLoading(false);
                alert("Bem-vindo de volta! Você já tinha uma conta e foi logado automaticamente.");
              } else {
                const newUser: AuthUser = {
                  id: userCred.user.uid,
                  email: formData.email.trim(),
                  name: formData.name || 'Usuário',
                  role: 'CONSUMER'
                };
                await saveUserMetadata(userCred.user.uid, newUser);
                setAuthUser(newUser);
              }
            } catch (loginErr: any) {
              const loginErrorCode = loginErr.code || '';
              if (loginErrorCode.includes('invalid-credential') || loginErrorCode.includes('wrong-password')) {
                throw new Error("Este e-mail já está cadastrado, mas a senha informada está incorreta. Se esqueceu sua senha, entre em contato com o suporte.");
              }
              throw loginErr;
            }
          } else {
            throw signupError;
          }
        }
      } else {
        const userCred = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        let metadata = await getUserMetadata(userCred.user.uid);
        
        if (!metadata && role === 'MERCHANT') {
          // Se não tem metadata mas tentou logar como lojista, verifica se tem loja
          const store = await getStoreByEmail(formData.email.trim());
          if (store) {
            metadata = {
              id: userCred.user.uid,
              email: formData.email.trim(),
              name: store.name,
              role: 'MERCHANT',
              merchantId: store.id
            };
            await saveUserMetadata(userCred.user.uid, metadata);
          } else {
            setLoading(false);
            alert("Este e-mail não está cadastrado como parceiro. Fale com o administrador para registrar sua loja primeiro.");
            return;
          }
        }

        if (metadata) {
          if (role === 'MERCHANT' && metadata.role !== 'MERCHANT' && metadata.role !== 'ADMIN') {
            // Verifica se agora ele tem uma loja vinculada (upgrade de conta)
            const store = await getStoreByEmail(formData.email.trim());
            if (store) {
              metadata = {
                ...metadata,
                role: 'MERCHANT',
                merchantId: store.id
              };
              await saveUserMetadata(userCred.user.uid, metadata);
              setLoading(false);
              alert("Sua conta foi atualizada para Lojista com sucesso!");
            } else {
              setLoading(false);
              alert("Sua conta não tem permissão de lojista. Fale com o administrador para registrar sua loja.");
              return;
            }
          }
          setAuthUser(metadata);
        } else {
          if (role === 'MERCHANT') {
             setLoading(false);
             alert("Erro: Conta não configurada como lojista.");
             return;
          }
          setAuthUser({
            id: userCred.user.uid,
            email: formData.email.trim(),
            name: 'Usuário',
            role: 'CONSUMER'
          });
        }
      }
    } catch (error: any) {
      const errorCode = error.code || '';
      const errorMessage = error.message || '';
      
      // Se for erro de credencial inválida no LOGIN, tenta o smart login para lojistas
      if (mode === 'LOGIN' && (errorCode.includes('invalid-credential') || errorCode.includes('user-not-found') || errorCode.includes('wrong-password') || errorMessage.includes('invalid-credential'))) {
        try {
          if (role === 'MERCHANT') {
            const store = await getStoreByEmail(formData.email.trim());
            if (store) {
              // Se a loja existe e tem uma senha provisória, e a senha bate, tenta criar a conta
              if (store.merchantPassword && store.merchantPassword === formData.password) {
                console.log("Smart Login: Senha provisória correta. Criando conta no Firebase...");
                const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
                const metadata: AuthUser = {
                  id: userCred.user.uid,
                  email: formData.email.trim(),
                  name: store.name,
                  role: 'MERCHANT',
                  merchantId: store.id
                };
                await saveUserMetadata(userCred.user.uid, metadata);
                setAuthUser(metadata);
                setLoading(false);
                return;
              } else if (store.merchantPassword && store.merchantPassword !== formData.password) {
                setLoading(false);
                alert("Senha incorreta para este lojista. Use a senha provisória fornecida pelo administrador.");
                return;
              }
              
              setLoading(false);
              alert("E-mail ou senha incorretos. Verifique seus dados.");
              return;
            } else {
               setLoading(false);
               alert("E-mail ou senha incorretos. Verifique se seu e-mail foi cadastrado pelo administrador.");
               return;
            }
          } else {
            setLoading(false);
            alert("E-mail ou senha incorretos. Se você ainda não tem uma conta, por favor vá na aba de CADASTRAR.");
            return;
          }
        } catch (smartErr: any) {
          console.warn("Erro no Smart Login:", smartErr);
        }
      }

      let userFriendlyMessage = "Ocorreu um erro ao acessar. Tente novamente.";
      
      if (errorCode.includes('email-already-in-use')) {
        userFriendlyMessage = "Este e-mail já está cadastrado. Por favor, vá para a aba de ENTRAR (Login).";
      } else if (errorCode.includes('invalid-credential') || errorCode.includes('user-not-found') || errorCode.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        userFriendlyMessage = "E-mail ou senha incorretos. Verifique seus dados ou crie uma conta na aba de CADASTRAR.";
      } else if (errorCode.includes('weak-password')) {
        userFriendlyMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (errorCode.includes('invalid-email')) {
        userFriendlyMessage = "O formato do e-mail é inválido.";
      } else if (errorCode.includes('too-many-requests')) {
        userFriendlyMessage = "Muitas tentativas sem sucesso. Sua conta pode ter sido temporariamente bloqueada. Tente novamente mais tarde.";
      } else if (errorCode.includes('operation-not-allowed')) {
        userFriendlyMessage = "O login por e-mail/senha não está habilitado no Firebase. Fale com o administrador.";
      } else if (errorMessage.includes('network-request-failed')) {
        userFriendlyMessage = "Erro de conexão. Verifique sua internet.";
      }
      
      setLoading(false);
      alert(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setMode('LOGIN');
  };

  return (
    <div className="h-full w-full bg-white flex flex-col p-8 overflow-y-auto relative no-scrollbar">
      <div className="flex flex-col items-center mt-6 mb-8">
        <Logo size="xl" />
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Nuvem Habilitada</p>
      </div>

      <div className="bg-gray-100 p-1.5 rounded-2xl flex mb-8">
        <button 
          onClick={() => switchRole('CONSUMER')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all duration-300 ${role === 'CONSUMER' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-400'}`}
        >
          <User size={14} /> CONSUMIDOR
        </button>
        <button 
          onClick={() => switchRole('MERCHANT')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all duration-300 ${role === 'MERCHANT' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-400'}`}
        >
          <Store size={14} /> LOJISTA
        </button>
      </div>

      <div className="flex flex-col flex-1">
        <div className="animate-fade-in">
          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight italic leading-none">
              {mode === 'LOGIN' ? 'ENTRAR' : mode === 'SIGNUP' ? 'CADASTRAR' : 'RECUPERAR'}
            </h2>
            {role === 'CONSUMER' && (
               <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">Comunidade</span>
            )}
            {role === 'MERCHANT' && (
               <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-md uppercase">Business</span>
            )}
          </div>

          {mode === 'FORGOT_PASSWORD' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Digite seu e-mail abaixo e enviaremos um link para você redefinir sua senha.
              </p>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="email" placeholder="E-mail cadastrado" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <button disabled={loading} className="w-full bg-indigo-600 py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 disabled:opacity-50 mt-4 active:scale-95 transition-transform">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>ENVIAR LINK <ArrowRight size={18} /></>}
              </button>
              <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-4">
                Voltar para Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'SIGNUP' && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required placeholder="Nome Completo" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="email" placeholder="E-mail" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="password" placeholder="Senha" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              
              {mode === 'LOGIN' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode('FORGOT_PASSWORD')} className="text-xs font-bold text-indigo-600 hover:underline">
                    Esqueceu a senha?
                  </button>
                </div>
              )}
              
              <button disabled={loading} className="w-full bg-indigo-600 py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 disabled:opacity-50 mt-4 active:scale-95 transition-transform">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>{mode === 'LOGIN' ? 'ACESSAR AGORA' : 'CRIAR MINHA CONTA'} <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {mode !== 'FORGOT_PASSWORD' && (
            <div className="mt-8 flex flex-col gap-4">
              <button onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {mode === 'LOGIN' ? 'Novo por aqui? Criar conta' : 'Já tem acesso? Fazer Login'}
              </button>

              {role === 'MERCHANT' && (
                <>
                  <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      <strong className="font-black uppercase">Atenção:</strong> Para criar uma conta de lojista, seu e-mail já deve ter sido pré-cadastrado pelo administrador da plataforma.
                    </p>
                  </div>

                  <a 
                    href="https://wa.me/5535992220298?text=Olá! Gostaria de me cadastrar como lojista no Descontaí."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full bg-[#25D366] py-3 rounded-2xl text-white font-black text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-green-100 uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    <MessageSquare size={16} /> Falar com Administrador
                  </a>

                  <p className="text-center text-[9px] text-gray-400 font-medium px-4 mt-2">
                    Acesso exclusivo para lojistas parceiros. <br/>Não possui uma loja? <button type="button" onClick={() => switchRole('CONSUMER')} className="text-indigo-500 font-bold">Volte ao início.</button>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
