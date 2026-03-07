import { db, isFirebaseConfigured } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';

export const trackVisit = async () => {
  if (!isFirebaseConfigured || !db) return;
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const visitRef = doc(db, 'analytics', `visits_${today}`);
  
  try {
    // Incrementa o contador do dia atual. Se não existir, o setDoc com merge cria.
    await setDoc(visitRef, { 
      count: increment(1),
      date: today,
      lastUpdate: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn("Erro ao registrar visita:", e);
  }
};

export const getDailyVisits = async (): Promise<number> => {
  if (!isFirebaseConfigured || !db) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const visitRef = doc(db, 'analytics', `visits_${today}`);
  
  try {
    const snap = await getDoc(visitRef);
    if (snap.exists()) {
      return snap.data().count || 0;
    }
    return 0;
  } catch (e) {
    console.error("Erro ao buscar visitas diárias:", e);
    return 0;
  }
};
