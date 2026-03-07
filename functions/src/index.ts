import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function agendada para rodar diariamente à meia-noite (Horário de Brasília).
 * Remove promoções cuja data de validade (expiresAt) já passou.
 * Também remove a mídia (imagem/vídeo) associada do Storage.
 */
export const cleanupExpiredPromotions = functions.pubsub
  .schedule('0 0 * * *') // Roda todo dia à meia-noite
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage().bucket();
    const now = new Date();
    
    // Zera a hora para comparar apenas a data (início do dia de hoje)
    // Se a promoção expirou ontem (data < hoje), ela deve ser removida.
    now.setHours(0, 0, 0, 0);

    console.log('🧹 Iniciando limpeza diária de promoções expiradas...');

    try {
      // Nota: O ideal seria ter um campo 'expiresAtTimestamp' para query direta.
      // Como usamos string DD/MM/YYYY, precisamos buscar tudo e filtrar.
      // Para escalar, adicione um campo timestamp na criação da promoção.
      const snapshot = await db.collection('promotions').get();
      
      const expiredDocs: admin.firestore.QueryDocumentSnapshot[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.expiresAt) {
          try {
            // Converte DD/MM/YYYY para Date
            const [day, month, year] = data.expiresAt.split('/').map(Number);
            const expiryDate = new Date(year, month - 1, day);
            
            // Define o final do dia da expiração (23:59:59)
            expiryDate.setHours(23, 59, 59, 999);

            // Se a data de expiração é anterior a AGORA, expirou.
            if (expiryDate < now) {
              expiredDocs.push(doc);
            }
          } catch (e) {
            console.warn(`⚠️ Erro ao processar data da promoção ${doc.id}:`, e);
          }
        }
      });

      if (expiredDocs.length === 0) {
        console.log('✅ Nenhuma promoção expirada encontrada hoje.');
        return null;
      }

      console.log(`🗑️ Encontradas ${expiredDocs.length} promoções expiradas. Iniciando exclusão...`);

      // Processa em lotes de 500 (limite do Firestore Batch)
      const BATCH_SIZE = 500;
      const batches = [];
      
      for (let i = 0; i < expiredDocs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = expiredDocs.slice(i, i + BATCH_SIZE);
        
        const deletePromises = chunk.map(async (doc) => {
          const data = doc.data();
          
          // 1. Adiciona ao batch de exclusão do Firestore (DELETA O DOCUMENTO)
          batch.delete(doc.ref);

          // 2. Tenta excluir a imagem/vídeo do Storage (se existir)
          if (data.mediaUrl || data.imageUrl || data.videoUrl) {
            const urlToDelete = data.mediaUrl || data.videoUrl || data.imageUrl;
            if (urlToDelete && urlToDelete.includes('firebasestorage.googleapis.com')) {
              try {
                // Extrai o caminho do arquivo da URL
                const matches = urlToDelete.match(/\/o\/(.*?)\?alt=/);
                if (matches && matches[1]) {
                  const filePath = decodeURIComponent(matches[1]);
                  await storage.file(filePath).delete();
                  console.log(`🖼️ Mídia removida: ${filePath}`);
                }
              } catch (storageError) {
                console.warn(`⚠️ Falha ao excluir mídia da promoção ${doc.id}:`, storageError);
              }
            }
          }
        });

        // Aguarda as operações de storage
        await Promise.all(deletePromises);
        batches.push(batch.commit());
      }

      await Promise.all(batches);
      console.log(`✅ Limpeza concluída! ${expiredDocs.length} promoções removidas permanentemente.`);

      return null;
    } catch (error) {
      console.error('❌ Erro fatal na limpeza de promoções:', error);
      return null;
    }
  });
