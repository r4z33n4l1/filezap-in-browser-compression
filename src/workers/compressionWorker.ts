
import { PDFDocument, PDFName, PDFDict, PDFStream, PDFRawStream } from 'pdf-lib';
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

// Guess MIME from PDF image dictionary
const mimeFor = (dict: PDFDict): string => {
  const filter = dict.lookupMaybe(PDFName.of('Filter'));
  if (filter?.toString().includes('DCT')) return 'image/jpeg';
  if (filter?.toString().includes('JPX')) return 'image/jp2';
  if (filter?.toString().includes('Flate')) return 'image/png';
  return 'image/jpeg'; // Default fallback
};

// Rebuild the image stream object with new bytes
const rebuildImage = (
  oldStream: PDFStream,
  newBytes: Uint8Array,
  doc: PDFDocument
): PDFRawStream => {
  const newDict = oldStream.dict.clone(doc.context);
  newDict.set(PDFName.of('Length'), doc.context.obj(newBytes.length));
  newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode')); // Re-encode to JPEG
  return PDFRawStream.of(newDict, newBytes);
};

// Advanced PDF compression with per-page image optimization
const compressImagesInPdf = async (
  pdfBytes: ArrayBuffer,
  onProgress: (p: number) => void
): Promise<ArrayBuffer> => {
  try {
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const pages = doc.getPages();
    let done = 0, totalImages = 0;

    onProgress(10);

    // First pass: count images for progress tracking
    for (const page of pages) {
      const res = page.node.Resources();
      const xobjs = res?.lookupMaybe(PDFName.of('XObject'), PDFDict);
      if (xobjs) {
        for (const [, ref] of xobjs.entries()) {
          const stream = doc.context.lookup(ref) as PDFStream;
          if (stream?.dict?.get(PDFName.of('Subtype'))?.equals(PDFName.of('Image'))) {
            totalImages++;
          }
        }
      }
    }

    onProgress(20);

    // Second pass: compress images
    for (const page of pages) {
      const res = page.node.Resources();
      const xobjs = res?.lookupMaybe(PDFName.of('XObject'), PDFDict);

      if (!xobjs) continue;

      for (const [key, ref] of xobjs.entries()) {
        try {
          const stream = doc.context.lookup(ref) as PDFStream;
          if (stream?.dict?.get(PDFName.of('Subtype'))?.equals(PDFName.of('Image'))) {
            
            const mime = mimeFor(stream.dict);
            const origBytes = stream.getContents();
            
            // Skip very small images (likely icons/logos)
            if (origBytes.length < 10000) {
              done++;
              continue;
            }

            try {
              const compressedFile = await imageCompression(
                new File([origBytes], 'img', { type: mime }),
                { 
                  maxSizeMB: 0.8, 
                  maxWidthOrHeight: 1920, 
                  quality: 0.75,
                  useWebWorker: false
                }
              );
              
              const compressedBytes = new Uint8Array(await compressedFile.arrayBuffer());

              // Only replace if we saved more than 10% (quality guardrail)
              if (compressedBytes.length < 0.9 * origBytes.length) {
                const newStream = rebuildImage(stream, compressedBytes, doc);
                const newRef = doc.context.register(newStream);
                xobjs.set(key, newRef);
              }
              
            } catch (imageError) {
              console.warn('Failed to compress individual image:', imageError);
              // Continue with original image
            }
          }
        } catch (streamError) {
          console.warn('Failed to process stream:', streamError);
          // Continue with next image
        }
        
        onProgress(20 + (++done / Math.max(totalImages, 1)) * 60); // 20-80% for images
      }
    }

    onProgress(85);

    // Remove metadata to reduce size
    doc.setTitle('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setAuthor('');
    doc.setProducer('');
    doc.setCreator('');

    onProgress(90);

    // Save with object streams enabled for maximum compression
    const optimized = await doc.save({ 
      useObjectStreams: true, // This is the key setting for better compression
      objectsPerTick: 50 
    });
    
    onProgress(100);
    return optimized.buffer;
    
  } catch (error) {
    console.error('Advanced PDF compression failed:', error);
    throw error;
  }
};

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

// Basic PDF compression (fallback for simple cases)
const compressPDF = async (
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  try {
    onProgress(10);
    
    // Try advanced compression first
    return await compressImagesInPdf(arrayBuffer, (progress) => {
      onProgress(progress);
    });
    
  } catch (error) {
    console.error('Advanced PDF compression failed, using fallback:', error);
    
    try {
      // Fallback: basic PDF optimization
      onProgress(30);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      onProgress(60);
      
      // Remove metadata
      pdfDoc.setTitle('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setAuthor('');
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      
      onProgress(80);
      
      const optimizedPdfBytes = await pdfDoc.save({
        useObjectStreams: true, // Enable object streams for better compression
        addDefaultPage: false,
      });
      
      onProgress(100);
      return optimizedPdfBytes.buffer;
      
    } catch (fallbackError) {
      console.error('PDF fallback compression failed, using deflate:', fallbackError);
      
      // Last resort: deflate compression
      onProgress(50);
      const uint8Array = new Uint8Array(arrayBuffer);
      onProgress(80);
      const compressed = deflate(uint8Array, { level: 6 });
      onProgress(100);
      
      return compressed.buffer;
    }
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
