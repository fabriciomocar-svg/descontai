import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { getAuthUser, saveUserMetadata } from './auth';

// Chave VAPID pública (necessária para Web Push)
// Em produção, isso deve vir de uma variável de ambiente
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BM22eD3TcRGaLQtBdZ2EBNHW4BM_PLACEHOLDER_KEY_CHANGE_THIS';

export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn('Firebase Messaging não está inicializado.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permissão de notificação concedida.');
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        console.log('FCM Token:', token);
        
        // Salvar token no perfil do usuário se estiver logado
        const user = getAuthUser();
        if (user) {
          await saveUserMetadata(user.id, { fcmToken: token });
        }
        
        return token;
      } else {
        console.warn('Não foi possível obter o token FCM.');
      }
    } else {
      console.log('Permissão de notificação negada.');
    }
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
  }
  
  return null;
};

export const onMessageListener = () => {
  if (!messaging) return new Promise(() => {});
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Mensagem recebida em primeiro plano:', payload);
      resolve(payload);
    });
  });
};
