interface ImageCompressionResult {
  buffer: ArrayBuffer;
  mimeType: string;
  quality: number;
}

export async function compressImageAdvanced(
  imageBuffer: ArrayBuffer,
  originalMimeType: string,
  quality: number = 0.8
): Promise<ImageCompressionResult> {
  return new Promise((resolve, reject) => {
    // Create a blob from the buffer
    const blob = new Blob([imageBuffer], { type: originalMimeType });
    
    // Create an image element
    const img = new Image();
    img.onload = () => {
      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Calculate compressed dimensions (max 1920px)
      const maxDimension = 1920;
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      // Set canvas size and draw image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with compression
      canvas.toBlob(
        (compressedBlob) => {
          if (!compressedBlob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Convert blob back to ArrayBuffer
          compressedBlob.arrayBuffer().then(buffer => {
            resolve({
              buffer,
              mimeType: 'image/jpeg',
              quality
            });
          }).catch(reject);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
} 