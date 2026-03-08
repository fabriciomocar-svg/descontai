
export type UserRole = 'CONSUMER' | 'MERCHANT' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  merchantId?: string;
  photoURL?: string;
  savedPromotions?: string[];
  likedPromotions?: string[];
  fcmToken?: string;
}

export interface Store {
  id: string;
  name: string;
  category: string;
  categories?: string[];
  logo: string;
  coverImage?: string;
  rating: number;
  address: string;
  isPartner: boolean;
  ownerEmail?: string;
  merchantPassword?: string;
  phone?: string;
  instagram?: string;
  description?: string;
  lat?: number;
  lng?: number;
}

export interface Promotion {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo: string;
  videoUrl?: string;
  imageUrl: string;
  description: string;
  discount: string;
  expiresAt: string;
  likes: number;
  saves?: number;
  views?: number;
  saved: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  category?: string;
}

export interface Chat {
  id: string;
  userId: string;
  userName: string;
  merchantId: string;
  storeName: string;
  promotionId?: string;
  lastMessage: string;
  updatedAt: any;
  unreadCount?: number;
  lastSenderId?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export type ViewType = 'AUTH' | 'FEED' | 'EXPLORE' | 'MERCHANT' | 'PROFILE' | 'ADMIN_STORES' | 'STORE_PROFILE' | 'MERCHANT_SETTINGS' | 'FAQ_MANAGER' | 'FAQ_VIEW' | 'MESSAGES' | 'CHAT' | 'PRIVACY_VIEW';
