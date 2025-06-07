
import { useState, useCallback } from 'react'
import { compressPDFHybrid } from '@/lib/pdf-compression-hybrid'
import { compressImageAdvanced } from '@/lib/image-compression'

export interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  mimeType: string
  pageCount?: number
  processedPages?: number
}

export interface ProgressStage {
  name: string
  description: string
  progress: number
}

interface CompressionState {
  isCompressing: boolean
  progress: number
  result: CompressionResult | null
  error: string | null
  currentStage?: ProgressStage
}

interface PDFCompressionStats {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  pageCount: number
  processedPages: number
}

const PROGRESS_STAGES = {
  INITIALIZING: { name: "Initializing", description: "Setting up compression engine..." },
  PARSING: { name: "Parsing", description: "Analyzing PDF structure..." },
  PROCESSING: { name: "Processing", description: "Compressing images and content..." },
  FINALIZING: { name: "Finalizing", description: "Building optimized output..." },
  COMPLETED: { name: "Completed", description: "Compression finished successfully!" }
}

function getStageFromProgress(progress: number): ProgressStage {
  if (progress < 10) {
    return { ...PROGRESS_STAGES.INITIALIZING, progress };
  } else if (progress < 20) {
    return { ...PROGRESS_STAGES.PARSING, progress };
  } else if (progress < 90) {
    return { ...PROGRESS_STAGES.PROCESSING, progress };
  } else if (progress < 100) {
    return { ...PROGRESS_STAGES.FINALIZING, progress };
  } else {
    return { ...PROGRESS_STAGES.COMPLETED, progress };
  }
}

export function useCompression() {
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    result: null,
    error: null,
    currentStage: undefined
  })

  const updateProgress = useCallback((progress: number) => {
    const stage = getStageFromProgress(progress);
    console.log(`📊 Progress update: ${progress.toFixed(1)}% - ${stage.name}`);
    setState(prev => ({ 
      ...prev, 
      progress,
      currentStage: stage
    }));
  }, []);

  const compressFile = useCallback(async (file: File): Promise<{
    buffer: ArrayBuffer;
    result: CompressionResult;
  } | null> => {
    setState({
      isCompressing: true,
      progress: 0,
      result: null,
      error: null,
      currentStage: getStageFromProgress(0)
    })

    try {
      console.log(`🔄 Starting compression for ${file.name} (${file.size} bytes)`)
      
      const arrayBuffer = await file.arrayBuffer()
      let compressedBuffer: ArrayBuffer
      let compressionResult: CompressionResult

      if (file.type === 'application/pdf') {
        console.log('📄 Using HYBRID PDF compression...')
        
        // Create a more granular progress callback for PDF compression
        const pdfProgressCallback = (progress: number) => {
          console.log(`📈 PDF compression progress: ${progress.toFixed(1)}%`);
          updateProgress(progress);
        };
        
        const result = await compressPDFHybrid(
          arrayBuffer,
          'medium',
          pdfProgressCallback
        )
        
        compressedBuffer = result.buffer
        const stats = result.stats
        
        console.log('📊 Hybrid compression stats:', stats)
        
        if (!compressedBuffer || compressedBuffer.byteLength === 0) {
          throw new Error('Compressed buffer is empty or invalid')
        }
        
        if (stats.originalSize === 0) {
          throw new Error('Original size not captured correctly')
        }
        
        compressionResult = {
          originalSize: stats.originalSize,
          compressedSize: stats.compressedSize,
          compressionRatio: stats.compressionRatio,
          mimeType: 'application/pdf',
          pageCount: stats.pageCount,
          processedPages: stats.processedPages
        }
        
      } else if (file.type.startsWith('image/')) {
        console.log('🖼️ Using advanced image compression...')
        
        updateProgress(10);
        updateProgress(30);
        
        const result = await compressImageAdvanced(arrayBuffer, file.type)
        compressedBuffer = result.buffer
        
        updateProgress(90);
        
        if (!compressedBuffer || compressedBuffer.byteLength === 0) {
          throw new Error('Image compression failed - empty buffer')
        }
        
        compressionResult = {
          originalSize: file.size,
          compressedSize: result.buffer.byteLength,
          compressionRatio: ((file.size - result.buffer.byteLength) / file.size) * 100,
          mimeType: result.mimeType
        }
        
      } else {
        throw new Error(`Unsupported file type: ${file.type}`)
      }

      // Ensure we reach 100% completion
      updateProgress(100);
      
      setState(prev => ({
        ...prev,
        progress: 100,
        result: compressionResult,
        currentStage: getStageFromProgress(100),
        isCompressing: false
      }))

      console.log('✅ Compression completed successfully')
      
      return {
        buffer: compressedBuffer,
        result: compressionResult
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('❌ Compression failed:', errorMessage)
      
      setState(prev => ({
        ...prev,
        isCompressing: false,
        progress: 0,
        error: errorMessage,
        currentStage: undefined
      }))
      
      return null
    }
  }, [updateProgress])

  const reset = useCallback(() => {
    setState({
      isCompressing: false,
      progress: 0,
      result: null,
      error: null,
      currentStage: undefined
    })
  }, [])

  return {
    ...state,
    compressFile,
    reset,
  }
}
