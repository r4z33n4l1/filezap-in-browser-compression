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
  const filter = dict.lookupMaybe(PDFName.of('Filter'), PDFName);
  if (filter) {
    const filterStr = filter.toString();
    if (filterStr.includes('DCT')) return 'image/jpeg';
    if (filterStr.includes('JPX')) return 'image/jp2';
    if (filterStr.includes('Flate')) return 'image/png';
  }
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

// Enhanced PDF compression with aggressive image optimization
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
          const subtype = stream?.dict?.get(PDFName.of('Subtype'));
          if (subtype && subtype.toString() === '/Image') {
            totalImages++;
          }
        }
      }
    }

    onProgress(20);

    // Second pass: compress images with multiple quality levels
    for (const page of pages) {
      const res = page.node.Resources();
      const xobjs = res?.lookupMaybe(PDFName.of('XObject'), PDFDict);

      if (!xobjs) continue;

      for (const [key, ref] of xobjs.entries()) {
        try {
          const stream = doc.context.lookup(ref) as PDFStream;
          const subtype = stream?.dict?.get(PDFName.of('Subtype'));
          
          if (subtype && subtype.toString() === '/Image') {
            
            const mime = mimeFor(stream.dict);
            const origBytes = stream.getContents();
            
            // Skip very small images (likely icons/logos)
            if (origBytes.length < 5000) {
              done++;
              continue;
            }

            // Try multiple compression levels for best results
            let bestCompressed = origBytes;
            const compressionLevels = [
              { maxSizeMB: 0.3, quality: 0.6, maxDim: 1600 },
              { maxSizeMB: 0.5, quality: 0.7, maxDim: 1920 },
              { maxSizeMB: 0.8, quality: 0.8, maxDim: 2048 }
            ];

            for (const level of compressionLevels) {
              try {
                const compressedFile = await imageCompression(
                  new File([origBytes], 'img', { type: mime }),
                  { 
                    maxSizeMB: level.maxSizeMB, 
                    maxWidthOrHeight: level.maxDim, 
                    initialQuality: level.quality,
                    useWebWorker: false,
                    fileType: 'image/jpeg' // Force JPEG for better compression
                  }
                );
                
                const compressedBytes = new Uint8Array(await compressedFile.arrayBuffer());

                // Keep the best compression that saves at least 20%
                if (compressedBytes.length < bestCompressed.length * 0.8) {
                  bestCompressed = compressedBytes;
                }
              } catch (levelError) {
                console.warn(`Compression level ${level.quality} failed:`, levelError);
              }
            }

            // Only replace if we achieved significant savings
            if (bestCompressed.length < origBytes.length * 0.8) {
              const newStream = rebuildImage(stream, bestCompressed, doc);
              const newRef = doc.context.register(newStream);
              xobjs.set(key, newRef);
              
              console.log(`Image compressed: ${origBytes.length} → ${bestCompressed.length} bytes (${((1 - bestCompressed.length / origBytes.length) * 100).toFixed(1)}% saved)`);
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

    // Aggressive metadata removal
    doc.setTitle('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setAuthor('');
    doc.setProducer('');
    doc.setCreator('');
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));

    onProgress(90);

    // Save with maximum compression settings
    const optimized = await doc.save({ 
      useObjectStreams: true, // Critical for compression
      addDefaultPage: false,
      objectsPerTick: 100, // Process more objects per tick
      updateFieldAppearances: false // Skip unnecessary updates
    });
    
    onProgress(100);
    return optimized.buffer;
    
  } catch (error) {
    console.error('Advanced PDF compression failed:', error);
    throw error;
  }
};

// Enhanced image compression with better quality control
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
    
    // Try multiple compression strategies
    const strategies = [
      { maxSizeMB: 0.5, maxWidthOrHeight: 1600, initialQuality: 0.7 },
      { maxSizeMB: 0.8, maxWidthOrHeight: 1920, initialQuality: 0.8 },
      { maxSizeMB: 1.2, maxWidthOrHeight: 2048, initialQuality: 0.85 }
    ];
    
    let bestResult = arrayBuffer;
    
    for (const strategy of strategies) {
      try {
        onProgress(40 + (strategies.indexOf(strategy) + 1) * 15);
        
        const compressedFile = await imageCompression(file, {
          ...strategy,
          useWebWorker: false,
          fileType: mimeType.startsWith('image/png') ? 'image/png' : 'image/jpeg'
        });
        
        const result = await compressedFile.arrayBuffer();
        
        // Keep the best compression that maintains reasonable quality
        if (result.byteLength < bestResult.byteLength) {
          bestResult = result;
        }
      } catch (strategyError) {
        console.warn('Compression strategy failed:', strategyError);
      }
    }
    
    onProgress(100);
    return bestResult;
    
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced PDF compression with better fallbacks
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
      // Fallback: basic PDF optimization with aggressive settings
      onProgress(30);
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      onProgress(60);
      
      // Remove all metadata aggressively
      pdfDoc.setTitle('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setAuthor('');
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      pdfDoc.setCreationDate(new Date(0));
      pdfDoc.setModificationDate(new Date(0));
      
      onProgress(80);
      
      const optimizedPdfBytes = await pdfDoc.save({
        useObjectStreams: true, // Always enable for better compression
        addDefaultPage: false,
        objectsPerTick: 100,
        updateFieldAppearances: false
      });
      
      onProgress(100);
      return optimizedPdfBytes.buffer;
      
    } catch (fallbackError) {
      console.error('PDF fallback compression failed, using deflate:', fallbackError);
      
      // Last resort: high-level deflate compression
      onProgress(50);
      const uint8Array = new Uint8Array(arrayBuffer);
      onProgress(80);
      const compressed = deflate(uint8Array, { level: 9, windowBits: 15, memLevel: 9 });
      onProgress(100);
      
      return compressed.buffer;
    }
  }
};

// Enhanced generic compression
const compressGeneric = async (
  arrayBuffer: ArrayBuffer,
  onProgress: (progress: number) => void
): Promise<ArrayBuffer> => {
  onProgress(30);
  
  const uint8Array = new Uint8Array(arrayBuffer);
  
  onProgress(60);
  
  // Use maximum compression settings
  const compressed = deflate(uint8Array, { 
    level: 9, // Maximum compression
    windowBits: 15, // Maximum window size
    memLevel: 9, // Maximum memory usage
    strategy: 0 // Default strategy for best compression
  });
  
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
    
    // Log compression results
    console.log(`Compression completed for ${fileName}:
      Original: ${originalSize} bytes
      Compressed: ${compressedSize} bytes
      Ratio: ${compressionRatio.toFixed(3)}
      Savings: ${((1 - compressionRatio) * 100).toFixed(1)}%`);
    
    self.postMessage({
      type: 'result',
      compressedData,
      originalSize,
      compressedSize,
      compressionRatio
    } as ResultMessage);
    
  } catch (error) {
    console.error('Compression failed:', error);
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown compression error'
    } as ErrorMessage);
  }
};
