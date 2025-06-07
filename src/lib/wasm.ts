// WebAssembly loader for PDF-Turbo compression engine
declare global {
  interface Window {
    Go: any;
    compressPDF: (data: Uint8Array, progress?: (p: number) => void) => Promise<{
      data: Uint8Array;
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    }>;
    compressImage: (data: Uint8Array, mimeType: string, progress?: (p: number) => void) => Promise<{
      data: Uint8Array;
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    }>;
    compressBatch: (files: Array<{data: Uint8Array, type: string}>, progress?: (p: number) => void) => Promise<Array<{
      data: Uint8Array;
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    }>>;
    wasmReady: boolean;
  }
}

interface WasmModule {
  compressPDF: (data: Uint8Array, progress?: (p: number) => void) => Promise<{
    data: Uint8Array;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }>;
  compressImage: (data: Uint8Array, mimeType: string, progress?: (p: number) => void) => Promise<{
    data: Uint8Array;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }>;
  compressBatch: (files: Array<{data: Uint8Array, type: string}>, progress?: (p: number) => void) => Promise<Array<{
    data: Uint8Array;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }>>;
  isReady: boolean;
}

let wasmModule: WasmModule | null = null;
let isLoading = false;

export const loadWasm = async (): Promise<WasmModule> => {
  // Return cached module if already loaded
  if (wasmModule?.isReady) {
    return wasmModule;
  }

  // Prevent multiple simultaneous loads
  if (isLoading) {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (wasmModule?.isReady) {
          resolve(wasmModule);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  isLoading = true;

  try {
    console.log('🚀 Loading PDF-Turbo WASM module...');

    // Load the Go WASM runtime
    if (!window.Go) {
      console.log('📦 Loading Go WASM runtime script...');
      // Dynamically load the wasm_exec.js script
      const script = document.createElement('script');
      script.src = '/wasm_exec.js';
      document.head.appendChild(script);
      
      // Wait for script to load
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('✅ Go WASM runtime script loaded');
          resolve(undefined);
        };
        script.onerror = (error) => {
          console.error('❌ Failed to load WASM runtime script:', error);
          reject(error);
        };
      });
      
      if (!window.Go) {
        throw new Error('Failed to load Go WASM runtime - window.Go not available');
      }
    } else {
      console.log('✅ Go WASM runtime already available');
    }

    // Initialize Go
    const go = new window.Go();

    // Load the WASM binary
    console.log('📦 Fetching WASM binary...');
    const wasmResponse = await fetch('/pdf-turbo.wasm');
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch WASM binary: ${wasmResponse.status}`);
    }

    const wasmBuffer = await wasmResponse.arrayBuffer();
    console.log(`✅ WASM binary loaded (${(wasmBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);

    // Instantiate the WASM module
    console.log('⚙️ Instantiating WASM module...');
    const { instance } = await WebAssembly.instantiate(wasmBuffer, go.importObject);

    // Run the Go program
    console.log('🏃 Starting Go runtime...');
    go.run(instance);

    // Wait for WASM to be ready (with timeout)
    const waitForReady = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WASM initialization timeout'));
        }, 10000); // 10 second timeout

        const checkReady = () => {
          if (window.wasmReady && window.compressPDF && window.compressImage && window.compressBatch) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
      });
    };

    await waitForReady();

    // Create the module wrapper
    wasmModule = {
      compressPDF: window.compressPDF,
      compressImage: window.compressImage,
      compressBatch: window.compressBatch,
      isReady: true
    };

    console.log('🎉 PDF-Turbo WASM module ready!');
    return wasmModule;

  } catch (error) {
    console.error('❌ Failed to load WASM module:', error);
    isLoading = false;
    throw error;
  } finally {
    isLoading = false;
  }
};

// Helper function to check if file is PDF
export const isPDF = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

// Helper function to check if file is image
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/') || 
         /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(file.name);
};

// Helper function to get optimal compression settings based on file size
export const getCompressionSettings = (fileSize: number) => {
  if (fileSize < 1024 * 1024) { // < 1MB
    return { quality: 0.9, maxDimension: 2048 };
  } else if (fileSize < 5 * 1024 * 1024) { // < 5MB
    return { quality: 0.8, maxDimension: 1920 };
  } else if (fileSize < 20 * 1024 * 1024) { // < 20MB
    return { quality: 0.7, maxDimension: 1600 };
  } else {
    return { quality: 0.6, maxDimension: 1200 };
  }
};

// Compression wrapper with automatic type detection and enhanced logging
export const compressFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timeElapsed: number;
}> => {
  console.log(`[WASM] Starting compression for file: ${file.name} (${file.type}, ${file.size} bytes)`);
  
  const startTime = Date.now();
  const wasm = await loadWasm();
  
  console.log(`[WASM] WASM module loaded successfully`);
  
  const arrayBuffer = await file.arrayBuffer();
  console.log(`[WASM] File converted to ArrayBuffer: ${arrayBuffer.byteLength} bytes`);
  
  const uint8Array = new Uint8Array(arrayBuffer);
  console.log(`[WASM] Created Uint8Array: length=${uint8Array.length}, constructor=${uint8Array.constructor.name}`);
  
  // Validate the Uint8Array
  if (!(uint8Array instanceof Uint8Array)) {
    throw new Error(`Expected Uint8Array, got ${typeof uint8Array}`);
  }

  let result;
  
  if (isPDF(file)) {
    console.log(`[WASM] Calling compressPDF for PDF file`);
    result = await wasm.compressPDF(uint8Array, onProgress);
  } else if (isImage(file)) {
    console.log(`[WASM] Calling compressImage for image file (${file.type})`);
    result = await wasm.compressImage(uint8Array, file.type, onProgress);
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  
  console.log(`[WASM] Compression completed successfully`)

  const timeElapsed = Date.now() - startTime;
  
  // Preserve original MIME type for blob
  const mimeType = file.type || 'application/octet-stream';
  const compressedBlob = new Blob([result.data], { type: mimeType });

  return {
    compressedBlob,
    originalSize: result.originalSize,
    compressedSize: result.compressedSize,
    compressionRatio: result.compressionRatio,
    timeElapsed
  };
};

// Batch compression
export const compressFiles = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<Array<{
  file: File;
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}>> => {
  const wasm = await loadWasm();
  
  const fileDataArray = await Promise.all(
    files.map(async (file) => ({
      data: new Uint8Array(await file.arrayBuffer()),
      type: file.type
    }))
  );

  const results = await wasm.compressBatch(fileDataArray, onProgress);

  return results.map((result, index) => ({
    file: files[index],
    compressedBlob: new Blob([result.data], { type: files[index].type }),
    originalSize: result.originalSize,
    compressedSize: result.compressedSize,
    compressionRatio: result.compressionRatio
  }));
};

export default loadWasm; 