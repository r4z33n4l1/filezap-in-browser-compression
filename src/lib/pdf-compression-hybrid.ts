import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { loadWasm } from './wasm';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface HybridCompressionResult {
  buffer: ArrayBuffer;
  stats: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    pageCount: number;
    processedPages: number;
  };
}

export class HybridPDFCompressor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wasmLoaded: boolean = false;

  constructor() {
    // Create off-screen canvas for rendering
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  async compressPDF(
    pdfBuffer: ArrayBuffer,
    compressionLevel: 'low' | 'medium' | 'high' | 'maximum' = 'medium',
    onProgress?: (progress: number) => void
  ): Promise<HybridCompressionResult> {
    try {
      console.log('🚀 Starting HYBRID PDF compression (PDF.js + WASM + PDF-lib)...');
      
      // Capture original size immediately
      const originalSize = pdfBuffer.byteLength;
      console.log(`📏 Original PDF size: ${originalSize} bytes`);
      
      // Step 1: Load WASM module
      if (!this.wasmLoaded) {
        console.log('⚡ Loading WASM module...');
        onProgress?.(5);
        await loadWasm();
        this.wasmLoaded = true;
        console.log('✅ WASM module loaded');
      }
      
      // Step 2: Load PDF with PDF.js
      console.log('📖 Loading PDF with PDF.js...');
      onProgress?.(10);
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdfDocument = await loadingTask.promise;
      
      console.log(`📄 PDF loaded: ${pdfDocument.numPages} pages`);
      
      // Step 3: Create new PDF document
      const newPdfDoc = await PDFDocument.create();
      
      let processedPages = 0;
      const compressionSettings = this.getCompressionSettings(compressionLevel);
      
      // Step 4: Process each page (PDF.js → WASM → PDF-lib)
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        try {
          console.log(`🔄 Processing page ${pageNum}/${pdfDocument.numPages}`);
          
          // Step 4a: Render page to image with PDF.js
          const page = await pdfDocument.getPage(pageNum);
          const imageBuffer = await this.renderPageToImageBuffer(page, compressionSettings);
          
          // Step 4b: Compress image with WASM
          console.log(`⚡ Compressing page ${pageNum} with WASM...`);
          const wasmResult = await window.compressImage(
            new Uint8Array(imageBuffer),
            'image/png',
            () => {} // Progress callback (not needed per page)
          );
          const compressedImageBuffer = wasmResult.data.buffer;
          
          // Step 4c: Add compressed image to new PDF with PDF-lib
          await this.addImageToPDF(newPdfDoc, compressedImageBuffer, page);
          
          processedPages++;
          
          // Report progress (10% setup + 80% processing + 10% finalization)
          const progress = 10 + (processedPages / pdfDocument.numPages) * 80;
          onProgress?.(progress);
          
        } catch (error) {
          console.warn(`⚠️ Failed to process page ${pageNum}:`, error);
          // Continue with other pages
        }
      }
      
      // Step 5: Generate the final compressed PDF
      console.log('📦 Generating final compressed PDF...');
      onProgress?.(95);
      const compressedBuffer = await newPdfDoc.save();
      const compressedSize = compressedBuffer.byteLength;
      
      const stats = {
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0,
        pageCount: pdfDocument.numPages,
        processedPages
      };
      
      console.log('🎉 HYBRID PDF compression complete:', stats);
      onProgress?.(100);
      
      return {
        buffer: compressedBuffer.buffer,
        stats
      };
      
    } catch (error) {
      console.error('💥 HYBRID PDF compression failed:', error);
      throw new Error(`Hybrid PDF compression failed: ${error.message}`);
    }
  }

  private async renderPageToImageBuffer(
    page: pdfjsLib.PDFPageProxy, 
    settings: { scale: number; maxDimension: number }
  ): Promise<ArrayBuffer> {
    // Calculate viewport with appropriate scale
    const viewport = page.getViewport({ scale: settings.scale });
    
    // Limit maximum dimensions
    let { width, height } = viewport;
    if (width > settings.maxDimension || height > settings.maxDimension) {
      const ratio = Math.min(settings.maxDimension / width, settings.maxDimension / height);
      width *= ratio;
      height *= ratio;
    }
    
    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Clear canvas with white background
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, width, height);
    
    // Render page to canvas
    const renderContext = {
      canvasContext: this.ctx,
      viewport: page.getViewport({ scale: width / viewport.width })
    };
    
    await page.render(renderContext).promise;
    
    // Convert canvas to PNG buffer (uncompressed for WASM)
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          blob.arrayBuffer().then(resolve);
        } else {
          throw new Error('Failed to convert canvas to blob');
        }
      }, 'image/png'); // PNG for lossless → WASM compression
    });
  }

  private async addImageToPDF(
    pdfDoc: PDFDocument,
    compressedImageBuffer: ArrayBuffer,
    originalPage: pdfjsLib.PDFPageProxy
  ): Promise<void> {
    // Embed compressed image in PDF
    const image = await pdfDoc.embedJpg(compressedImageBuffer);
    
    // Get original page dimensions
    const viewport = originalPage.getViewport({ scale: 1 });
    
    // Add page with compressed image
    const page = pdfDoc.addPage([viewport.width, viewport.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  private getCompressionSettings(level: string) {
    switch (level) {
      case 'low':
        return { scale: 1.0, maxDimension: 2048 };
      case 'medium':
        return { scale: 0.85, maxDimension: 1600 };
      case 'high':
        return { scale: 0.7, maxDimension: 1200 };
      case 'maximum':
        return { scale: 0.5, maxDimension: 800 };
      default:
        return { scale: 0.8, maxDimension: 1400 };
    }
  }
}

// Utility function for easy usage
export async function compressPDFHybrid(
  pdfBuffer: ArrayBuffer,
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum' = 'medium',
  onProgress?: (progress: number) => void
): Promise<HybridCompressionResult> {
  const compressor = new HybridPDFCompressor();
  return compressor.compressPDF(pdfBuffer, compressionLevel, onProgress);
} 