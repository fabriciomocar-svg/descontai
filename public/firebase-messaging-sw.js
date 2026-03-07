// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// This is required for the service worker to know which Firebase project to connect to.
firebase.initializeApp({
  apiKey: "AIzaSyBedPAIFi22eD3TcRGaLQtBdZ2EBNHW4BM",
  authDomain: "descontai-app.firebaseapp.com",
  projectId: "descontai-app",
  storageBucket: "descontai-app.firebasestorage.app",
  messagingSenderId: "769936795657",
  appId: "1:769936795657:web:c5297d6efa8a308b5670d8",
  measurementId: "G-XXXXXXXXXX"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
