import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

export const logViewPromotion = (promotionId: string, storeName: string) => {
  if (analytics) {
    logEvent(analytics, 'view_promotion', {
      promotion_id: promotionId,
      store_name: storeName
    });
  }
};

export const logClickVisitStore = (storeId: string, storeName: string) => {
  if (analytics) {
    logEvent(analytics, 'click_visit_store', {
      store_id: storeId,
      store_name: storeName
    });
  }
};

export const logFeedTime = (seconds: number) => {
  if (analytics) {
    logEvent(analytics, 'feed_time', {
      duration_seconds: seconds
    });
  }
};

export const logScreenView = (screenName: string) => {
  if (analytics) {
    logEvent(analytics, 'screen_view', {
      firebase_screen: screenName,
      screen_name: screenName
    } as any);
  }
};
