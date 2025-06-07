
import { useState, useCallback, useRef } from 'react';

interface CompressionCallbacks {
  onProgress: (progress: number) => void;
  onComplete: (result: {
    compressedBlob: Blob;
    compressedSize: number;
    compressionRatio: number;
    timeElapsed: number;
  }) => void;
  onError: (error: Error) => void;
}

export const useCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const initializeWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/compressionWorker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }, []);

  const compressFile = useCallback(async (
    file: File, 
    callbacks: CompressionCallbacks
  ) => {
    setIsCompressing(true);
    const startTime = Date.now();

    try {
      const worker = initializeWorker();
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Set up worker message handlers
      const handleMessage = (event: MessageEvent) => {
        const { type, ...data } = event.data;
        
        switch (type) {
          case 'progress':
            callbacks.onProgress(data.progress);
            break;
            
          case 'result':
            const timeElapsed = Date.now() - startTime;
            
            // Create blob with proper MIME type preservation
            const mimeType = file.type || 'application/octet-stream';
            const compressedBlob = new Blob([data.compressedData], { 
              type: mimeType 
            });
            
            console.log(`Compression completed:
              Original: ${data.originalSize} bytes
              Compressed: ${data.compressedSize} bytes
              Ratio: ${data.compressionRatio.toFixed(3)}
              Time: ${timeElapsed}ms`);
            
            callbacks.onComplete({
              compressedBlob,
              compressedSize: data.compressedSize,
              compressionRatio: data.compressionRatio,
              timeElapsed
            });
            
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            break;
            
          case 'error':
            console.error('Compression worker error:', data.error);
            callbacks.onError(new Error(data.error));
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            break;
        }
      };
      
      const handleError = (error: ErrorEvent) => {
        console.error('Worker runtime error:', error);
        callbacks.onError(new Error(`Worker error: ${error.message}`));
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
      };
      
      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);
      
      // Send compression task to worker
      worker.postMessage({
        type: 'compress',
        fileData: arrayBuffer,
        fileName: file.name,
        fileType: file.type
      });
      
    } catch (error) {
      console.error('Compression setup error:', error);
      callbacks.onError(error instanceof Error ? error : new Error('Compression failed'));
    } finally {
      setIsCompressing(false);
    }
  }, [initializeWorker]);

  // Cleanup worker on unmount
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    compressFile,
    isCompressing,
    cleanup
  };
};
