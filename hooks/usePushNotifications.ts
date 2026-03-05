import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import { getAuthUser, saveUserMetadata } from '../constants';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!messaging) return;

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          setFcmToken(token);
          console.log('FCM Token:', token);
          
          // Save token to user profile
          const user = getAuthUser();
          if (user) {
            await saveUserMetadata(user.id, { fcmToken: token } as any);
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // Customize how you handle foreground messages here
        // e.g., show a toast notification
        if (payload.notification) {
          new Notification(payload.notification.title || 'Nova mensagem', {
            body: payload.notification.body,
            icon: '/pwa-192x192.png'
          });
        }
      });

      return () => unsubscribe();
    }
  }, []);

  return { permission, requestPermission, fcmToken };
};
