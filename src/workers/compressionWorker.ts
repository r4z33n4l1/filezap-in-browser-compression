
import { PDFDocument } from 'pdf-lib';
import { deflate } from 'pako';
import imageCompression from 'browser-image-compression';

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

// Helper function to compress images using browser-image-compression
const compressImage = async (
  arrayBuffer: ArrayBuffer, 
  mimeType: string,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  try {
    onProgress(20);
    
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const file = new File([blob], 'image', { type: mimeType });
    
    onProgress(40);
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: false,
      quality: 0.8
    };
    
    onProgress(60);
    
    const compressedFile = await imageCompression(file, options);
    
    onProgress(90);
    
    const compressedArrayBuffer = await compressedFile.arrayBuffer();
    
    onProgress(100);
    
    return compressedArrayBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Proper PDF compression using pdf-lib
const compressPDF = async (
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  try {
    onProgress(10);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    onProgress(30);
    
    // Remove metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setAuthor('');
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    
    onProgress(70);
    
    // Save the optimized PDF with compression settings
    const optimizedPdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });
    
    onProgress(100);
    
    return optimizedPdfBytes.buffer;
    
  } catch (error) {
    console.error('PDF compression error:', error);
    
    // Fallback: try basic deflate compression on the original PDF
    onProgress(50);
    const uint8Array = new Uint8Array(arrayBuffer);
    onProgress(80);
    const compressed = deflate(uint8Array, { level: 6 });
    onProgress(100);
    
    return compressed.buffer;
  }
};

// Generic file compression using deflate
const compressGeneric = async (
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  onProgress(30);
  
  const uint8Array = new Uint8Array(arrayBuffer);
  
  onProgress(60);
  
  const compressed = deflate(uint8Array, { level: 6 });
  
  onProgress(100);
  
  return compressed.buffer;
};

// Worker message handler
self.onmessage = async (event: MessageEvent<CompressionMessage>) => {
  const { fileData, fileName, fileType } = event.data;
  
  try {
    self.postMessage({ type: 'progress', progress: 5 } as ProgressMessage);
    
    let compressedData: ArrayBuffer;
    
    // Route to appropriate compression method based on file type
    if (fileType.startsWith('image/')) {
      compressedData = await compressImage(fileData, fileType, (progress) => {
        self.postMessage({ type: 'progress', progress: 5 + (progress * 0.9) } as ProgressMessage);
      });
    } else if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      compressedData = await compressPDF(fileData, (progress) => {
        self.postMessage({ type: 'progress', progress: 5 + (progress * 0.9) } as ProgressMessage);
      });
    } else {
      compressedData = await compressGeneric(fileData, (progress) => {
        self.postMessage({ type: 'progress', progress: 5 + (progress * 0.9) } as ProgressMessage);
      });
    }
    
    const originalSize = fileData.byteLength;
    const compressedSize = compressedData.byteLength;
    const compressionRatio = compressedSize / originalSize;
    
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
