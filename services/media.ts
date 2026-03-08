import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../firebase';
import { compressImage, validateVideo } from '../utils/imageCompression';

export const uploadMedia = async (file: File, userId: string, type: 'image' | 'video'): Promise<string> => {
  if (!isFirebaseConfigured || !storage) {
    console.warn("Firebase não configurado. Retornando string vazia.");
    return '';
  }

  let fileToUpload = file;

  // Comprimir se for imagem
  if (type === 'image') {
    try {
      // Usa os padrões: WebP, 1080p (1920x1920 max), Qualidade 0.8
      fileToUpload = await compressImage(file);
    } catch (e) {
      console.warn("Falha na compressão, enviando original", e);
    }
  }

  const storageRef = ref(storage, `promotions/${userId}/${Date.now()}_${fileToUpload.name}`);
  const uploadSnap = await uploadBytes(storageRef, fileToUpload);
  const downloadUrl = await getDownloadURL(uploadSnap.ref);
  
  return downloadUrl;
};
