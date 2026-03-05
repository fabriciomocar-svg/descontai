/**
 * Utilitário para compressão de imagens no cliente antes do upload.
 * Reduz significativamente o tamanho do arquivo mantendo qualidade aceitável para web/mobile.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 a 1.0
  type?: string; // 'image/jpeg', 'image/webp', etc.
}

export const compressImage = (file: File, options: CompressionOptions = {}): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1280,
      maxHeight = 1280,
      quality = 0.8,
      type = 'image/jpeg'
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
            const compressedFile = new File([blob], file.name, {
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
