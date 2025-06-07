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

interface CompressionState {
  isCompressing: boolean
  progress: number
  result: CompressionResult | null
  error: string | null
}

interface PDFCompressionStats {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  pageCount: number
  processedPages: number
}

export function useCompression() {
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    result: null,
    error: null,
  })

  const compressFile = useCallback(async (file: File): Promise<{
    buffer: ArrayBuffer;
    result: CompressionResult;
  } | null> => {
    setState({
      isCompressing: true,
      progress: 0,
      result: null,
      error: null,
    })

    try {
      console.log(`🔄 Starting compression for ${file.name} (${file.size} bytes)`)
      
      const arrayBuffer = await file.arrayBuffer()
      let compressedBuffer: ArrayBuffer
      let compressionResult: CompressionResult

      if (file.type === 'application/pdf') {
        console.log('📄 Using HYBRID PDF compression (PDF.js + WASM + PDF-lib)...')
        
        // Use our new HYBRID PDF compression approach
        const result = await compressPDFHybrid(
          arrayBuffer,
          'medium', // Default compression level
          (progress) => {
            setState(prev => ({ ...prev, progress }))
          }
        )
        
        compressedBuffer = result.buffer
        const stats = result.stats
        
        console.log('📊 Hybrid compression stats:', stats)
        
        // Validate the result
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
        
        setState(prev => ({
          ...prev,
          progress: 100,
          result: compressionResult
        }))
        
      } else if (file.type.startsWith('image/')) {
        console.log('🖼️ Using advanced image compression...')
        
        setState(prev => ({ ...prev, progress: 50 }))
        
        const result = await compressImageAdvanced(arrayBuffer, file.type)
        compressedBuffer = result.buffer
        
        // Validate the image result
        if (!compressedBuffer || compressedBuffer.byteLength === 0) {
          throw new Error('Image compression failed - empty buffer')
        }
        
        compressionResult = {
          originalSize: file.size,
          compressedSize: result.buffer.byteLength,
          compressionRatio: ((file.size - result.buffer.byteLength) / file.size) * 100,
          mimeType: result.mimeType
        }
        
        setState(prev => ({
          ...prev,
          progress: 100,
          result: compressionResult
        }))
        
      } else {
        throw new Error(`Unsupported file type: ${file.type}`)
      }

      console.log('✅ Compression completed successfully')
      
      setState(prev => ({ ...prev, isCompressing: false }))
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
      }))
      
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isCompressing: false,
      progress: 0,
      result: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    compressFile,
    reset,
  }
}
