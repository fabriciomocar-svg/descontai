
import { usePromotionsContext } from '../context/PromotionsContext';

export const usePromotions = () => {
  const context = usePromotionsContext();
  return { ...context, isUsingMock: false };
};
