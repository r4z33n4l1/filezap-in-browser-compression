import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface CompressionOptions {
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
}

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  pageCount: number;
  processedPages: number;
}

export class PDFCompressor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    // Create off-screen canvas for rendering
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async compressPDF(
    pdfBuffer: ArrayBuffer,
    options: CompressionOptions,
    onProgress?: (progress: number) => void
  ): Promise<{ buffer: ArrayBuffer; stats: CompressionResult }> {
    try {
      console.log('🔄 Starting PDF compression using pages-to-images approach...');
      
      // Load the source PDF
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdfDocument = await loadingTask.promise;
      
      console.log(`📄 PDF loaded: ${pdfDocument.numPages} pages`);
      
      // Create new PDF document
      const newPdfDoc = await PDFDocument.create();
      
      const compressionSettings = this.getCompressionSettings(options.compressionLevel);
      let processedPages = 0;
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        try {
          console.log(`🖼️ Processing page ${pageNum}/${pdfDocument.numPages}`);
          
          // Get the page
          const page = await pdfDocument.getPage(pageNum);
          
          // Render page to image
          const imageData = await this.renderPageToImage(page, compressionSettings);
          
          // Add compressed image to new PDF
          await this.addImageToPDF(newPdfDoc, imageData, page);
          
          processedPages++;
          
          // Report progress
          const progress = (processedPages / pdfDocument.numPages) * 100;
          onProgress?.(progress);
          
        } catch (error) {
          console.warn(`⚠️ Failed to process page ${pageNum}:`, error);
          // Continue with other pages
        }
      }
      
      // Generate the compressed PDF
      console.log('📦 Generating compressed PDF...');
      const compressedBuffer = await newPdfDoc.save();
      
      const stats: CompressionResult = {
        originalSize: pdfBuffer.byteLength,
        compressedSize: compressedBuffer.byteLength,
        compressionRatio: (1 - compressedBuffer.byteLength / pdfBuffer.byteLength) * 100,
        pageCount: pdfDocument.numPages,
        processedPages
      };
      
      console.log('✅ PDF compression complete:', stats);
      
      return {
        buffer: compressedBuffer.buffer,
        stats
      };
      
    } catch (error) {
      console.error('❌ PDF compression failed:', error);
      throw new Error(`PDF compression failed: ${error.message}`);
    }
  }

  private async renderPageToImage(
    page: pdfjsLib.PDFPageProxy, 
    settings: { scale: number; quality: number; maxDimension: number }
  ): Promise<ImageData> {
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
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, width, height);
    
    // Render page to canvas
    const renderContext = {
      canvasContext: this.ctx,
      viewport: page.getViewport({ scale: width / viewport.width })
    };
    
    await page.render(renderContext).promise;
    
    // Get image data
    return this.ctx.getImageData(0, 0, width, height);
  }

  private async addImageToPDF(
    pdfDoc: PDFDocument,
    imageData: ImageData,
    originalPage: pdfjsLib.PDFPageProxy
  ): Promise<void> {
    // Convert ImageData to JPEG blob
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0);
    
    // Convert to JPEG with compression
    const blob = await new Promise<Blob>((resolve) => {
      this.canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
    
    if (!blob) {
      throw new Error('Failed to convert page to image');
    }
    
    // Convert blob to array buffer
    const imageBuffer = await blob.arrayBuffer();
    
    // Embed image in PDF
    const image = await pdfDoc.embedJpg(imageBuffer);
    
    // Get original page dimensions
    const viewport = originalPage.getViewport({ scale: 1 });
    
    // Add page with image
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
        return { scale: 1.0, quality: 0.9, maxDimension: 2048 };
      case 'medium':
        return { scale: 0.8, quality: 0.75, maxDimension: 1600 };
      case 'high':
        return { scale: 0.6, quality: 0.6, maxDimension: 1200 };
      case 'maximum':
        return { scale: 0.4, quality: 0.5, maxDimension: 800 };
      default:
        return { scale: 0.75, quality: 0.7, maxDimension: 1400 };
    }
  }
}

// Utility function for easy usage
export async function compressPDFPages(
  pdfBuffer: ArrayBuffer,
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum' = 'medium',
  onProgress?: (progress: number) => void
): Promise<{ buffer: ArrayBuffer; stats: CompressionResult }> {
  const compressor = new PDFCompressor();
  
  return compressor.compressPDF(
    pdfBuffer,
    {
      quality: 0.7,
      compressionLevel
    },
    onProgress
  );
} 