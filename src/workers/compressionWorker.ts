
// Real compression worker implementation
import { deflate } from 'pako';

export interface CompressionMessage {
  type: 'compress';
  fileData: ArrayBuffer;
  fileName: string;
  fileType: string;
}

export interface ProgressMessage {
  type: 'progress';
  progress: number;
}

export interface ResultMessage {
  type: 'result';
  compressedData: ArrayBuffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface ErrorMessage {
  type: 'error';
  error: string;
}

// Helper function to compress images using canvas
const compressImage = async (
  arrayBuffer: ArrayBuffer, 
  mimeType: string,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      onProgress(30);
      
      // Calculate new dimensions (reduce by ~30% for compression)
      const scaleFactor = 0.7;
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      
      onProgress(50);
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      onProgress(80);
      
      canvas.toBlob((compressedBlob) => {
        if (!compressedBlob) {
          reject(new Error('Failed to compress image'));
          return;
        }
        
        compressedBlob.arrayBuffer().then(resolve).catch(reject);
      }, mimeType, 0.7); // 70% quality
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
};

// Helper function to compress PDF (basic metadata removal + deflate)
const compressPDF = async (
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  onProgress(20);
  
  // Convert to string to process PDF structure
  const uint8Array = new Uint8Array(arrayBuffer);
  let pdfString = '';
  
  // Read PDF as text (this is a simplified approach)
  for (let i = 0; i < uint8Array.length; i++) {
    pdfString += String.fromCharCode(uint8Array[i]);
  }
  
  onProgress(40);
  
  // Remove some metadata and comments (basic cleanup)
  let cleanedPdf = pdfString
    .replace(/\/Creator\s*\([^)]*\)/g, '') // Remove creator info
    .replace(/\/Producer\s*\([^)]*\)/g, '') // Remove producer info
    .replace(/\/ModDate\s*\([^)]*\)/g, '') // Remove modification date
    .replace(/\/CreationDate\s*\([^)]*\)/g, ''); // Remove creation date
  
  onProgress(60);
  
  // Convert back to Uint8Array
  const cleanedArray = new Uint8Array(cleanedPdf.length);
  for (let i = 0; i < cleanedPdf.length; i++) {
    cleanedArray[i] = cleanedPdf.charCodeAt(i);
  }
  
  onProgress(80);
  
  // Apply deflate compression to the cleaned PDF
  const compressed = deflate(cleanedArray, { level: 9 });
  
  onProgress(100);
  
  return compressed.buffer;
};

// Generic file compression using deflate
const compressGeneric = async (
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  onProgress(30);
  
  const uint8Array = new Uint8Array(arrayBuffer);
  
  onProgress(60);
  
  const compressed = deflate(uint8Array, { level: 9 });
  
  onProgress(100);
  
  return compressed.buffer;
};

// Worker message handler
self.onmessage = async (event: MessageEvent<CompressionMessage>) => {
  const { fileData, fileName, fileType } = event.data;
  const startTime = Date.now();
  
  try {
    self.postMessage({ type: 'progress', progress: 10 } as ProgressMessage);
    
    let compressedData: ArrayBuffer;
    
    // Route to appropriate compression method based on file type
    if (fileType.startsWith('image/')) {
      compressedData = await compressImage(fileData, fileType, (progress) => {
        self.postMessage({ type: 'progress', progress: 10 + (progress * 0.8) } as ProgressMessage);
      });
    } else if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      compressedData = await compressPDF(fileData, (progress) => {
        self.postMessage({ type: 'progress', progress: 10 + (progress * 0.8) } as ProgressMessage);
      });
    } else {
      compressedData = await compressGeneric(fileData, (progress) => {
        self.postMessage({ type: 'progress', progress: 10 + (progress * 0.8) } as ProgressMessage);
      });
    }
    
    const originalSize = fileData.byteLength;
    const compressedSize = compressedData.byteLength;
    const compressionRatio = compressedSize / originalSize;
    const timeElapsed = Date.now() - startTime;
    
    self.postMessage({
      type: 'result',
      compressedData,
      originalSize,
      compressedSize,
      compressionRatio
    } as ResultMessage);
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown compression error'
    } as ErrorMessage);
  }
};
