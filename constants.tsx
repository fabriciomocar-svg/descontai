
import { db, auth, isFirebaseConfigured } from './firebase';

export { db, auth, isFirebaseConfigured };

// Re-export everything from new services
export * from './services/auth';
export * from './services/store';
export * from './services/location';
export * from './services/analytics';
export * from './services/faq';
export * from './services/chat';
export * from './services/moderation';
