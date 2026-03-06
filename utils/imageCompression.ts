/**
 * Utilitário para compressão de mídia no cliente antes do upload.
 * Reduz significativamente o tamanho do arquivo mantendo qualidade aceitável para web/mobile.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 a 1.0
  type?: string; // 'image/webp' (recomendado) ou 'image/jpeg'
}

export const compressImage = (file: File, options: CompressionOptions = {}): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920, // 1080p (Full HD)
      maxHeight = 1920,
      quality = 0.8,
      type = 'image/webp'
    } = options;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para Blob/File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha na compressão da imagem'));
              return;
            }
            
            // Criar novo arquivo com o blob comprimido
            // Se for WebP, mudar a extensão
            const newName = file.name.replace(/\.[^/.]+$/, "") + (type === 'image/webp' ? '.webp' : '.jpg');
            
            const compressedFile = new File([blob], newName, {
              type: type,
              lastModified: Date.now(),
            });

            console.log(`📸 Compressão: Original ${(file.size / 1024).toFixed(2)}KB -> Comprimido ${(compressedFile.size / 1024).toFixed(2)}KB`);
            resolve(compressedFile);
          },
          type,
          quality
        );
      };
      
      img.onerror = (error) => reject(error);
    };
    
    reader.onerror = (error) => reject(error);
  });
};

export const validateVideo = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 1. Validar Tamanho (Max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      reject(new Error(`O vídeo é muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O limite é 50MB.`));
      return;
    }

    // 2. Validar Duração e Resolução (usando elemento de vídeo temporário)
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      
      // Duração máxima: 60 segundos
      if (video.duration > 60) {
        reject(new Error(`O vídeo é muito longo (${Math.round(video.duration)}s). O limite é 60 segundos.`));
        return;
      }

      // Resolução mínima/máxima (opcional, apenas log por enquanto)
      console.log(`🎥 Vídeo Info: ${video.videoWidth}x${video.videoHeight}, ${video.duration}s`);
      
      resolve();
    };

    video.onerror = () => {
      reject(new Error('Arquivo de vídeo inválido ou corrompido.'));
    };

    video.src = URL.createObjectURL(file);
  });
};
