export async function compressImageFile(file: File, maxDimension = 960): Promise<{
  dataUrl: string;
  base64: string;
  mimeType: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const img = new Image();
      img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const base64Only = result.split(',')[1] || '';
          resolve({
            dataUrl: result,
            base64: base64Only,
            mimeType: file.type || 'image/jpeg',
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.78);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ dataUrl, base64, mimeType });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo procesar el audio.'));
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}
