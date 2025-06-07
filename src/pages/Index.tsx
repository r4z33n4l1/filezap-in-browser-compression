import { useState, useCallback } from 'react';
import { FileDropZone } from '@/components/FileDropZone';
import { CompressionProgress } from '@/components/CompressionProgress';
import { FileList } from '@/components/FileList';
import { Header } from '@/components/Header';
import { CompressionStats } from '@/components/CompressionStats';
import { WasmStatus } from '@/components/WasmStatus';
import { PerformanceStats } from '@/components/PerformanceStats';
import { WasmDebugPanel } from '@/components/WasmDebugPanel';
import { useCompression } from '@/hooks/useCompression';

export interface CompressedFile {
  id: string;
  originalFile: File;
  compressedBlob?: Blob;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  status: 'pending' | 'compressing' | 'completed' | 'error';
  error?: string;
  progress?: number;
  timeElapsed?: number;
  pageCount?: number;
  processedPages?: number;
}

const Index = () => {
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const { compressFile, isCompressing, progress, result, error, reset } = useCompression();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    console.log('📤 Adding files for compression:', newFiles.length);
    
    const fileEntries: CompressedFile[] = newFiles.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalSize: file.size,
      status: 'pending' as const,
    }));
    
    setFiles(prev => [...prev, ...fileEntries]);
    
    // Process files one by one
    for (const fileEntry of fileEntries) {
      try {
        console.log(`🔄 Starting compression for: ${fileEntry.originalFile.name}`);
        
        // Set as active file
        setActiveFileId(fileEntry.id);
        setFiles(prev => prev.map(f => 
          f.id === fileEntry.id ? { ...f, status: 'compressing' } : f
        ));
        
        // Start compression
        const startTime = Date.now();
        const compressionOutput = await compressFile(fileEntry.originalFile);
        const endTime = Date.now();
        
        // Check if compression was successful
        if (compressionOutput && compressionOutput.buffer.byteLength > 0) {
          const { buffer: compressedBuffer, result: compressionResult } = compressionOutput;
          
          // Create blob from buffer
          const compressedBlob = new Blob([compressedBuffer], { 
            type: compressionResult.mimeType 
          });
          
          console.log(`✅ Compression completed for: ${fileEntry.originalFile.name}`);
          console.log(`📊 Stats:`, compressionResult);
          
          setFiles(prev => prev.map(f => 
            f.id === fileEntry.id ? {
              ...f,
              status: 'completed',
              compressedBlob,
              compressedSize: compressionResult.compressedSize,
              compressionRatio: compressionResult.compressionRatio,
              timeElapsed: endTime - startTime,
              progress: 100,
              pageCount: compressionResult.pageCount,
              processedPages: compressionResult.processedPages
            } : f
          ));
        } else {
          // Handle error case
          const errorMessage = error || 'Compression returned empty buffer';
          console.error(`❌ Compression failed for: ${fileEntry.originalFile.name}`, errorMessage);
          console.error(`🔍 Debug info:`, { 
            compressionOutput: !!compressionOutput, 
            bufferSize: compressionOutput?.buffer?.byteLength || 0,
            error 
          });
          
          setFiles(prev => prev.map(f => 
            f.id === fileEntry.id ? {
              ...f,
              status: 'error',
              error: errorMessage,
              progress: 0
            } : f
          ));
        }
        
        // Reset compression state for next file
        reset();
        
      } catch (compressionError) {
        console.error(`💥 Exception during compression:`, compressionError);
        
        setFiles(prev => prev.map(f => 
          f.id === fileEntry.id ? {
            ...f,
            status: 'error',
            error: compressionError instanceof Error ? compressionError.message : 'Unknown error',
            progress: 0
          } : f
        ));
        
        reset();
      }
    }
    
    setActiveFileId(null);
    console.log('🏁 All files processed');
    
  }, [compressFile, result, error, reset]);

  // Update progress for active file
  useState(() => {
    if (activeFileId && progress > 0) {
      setFiles(prev => prev.map(f => 
        f.id === activeFileId ? { ...f, progress } : f
      ));
    }
  });

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    reset();
  }, [reset]);

  const totalOriginalSize = files.reduce((sum, file) => sum + file.originalSize, 0);
  const totalCompressedSize = files.reduce((sum, file) => sum + (file.compressedSize || 0), 0);
  const overallCompressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 0;
  const completedFiles = files.filter(f => f.status === 'completed');
  const totalTimeElapsed = files.reduce((sum, file) => sum + (file.timeElapsed || 0), 0);
  const compressingFiles = files.filter(f => f.status === 'compressing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white">
            <h2 className="text-xl font-bold mb-2">⚡ HYBRID: PDF.js + WASM + PDF-lib</h2>
            <p className="text-sm opacity-90">
              <strong>PDF.js</strong> renders pages → <strong>WASM</strong> compresses images → <strong>PDF-lib</strong> rebuilds PDF!
              {files.length > 0 && ` Processing ${files.length} files...`}
            </p>
          </div>
          
          {/* WASM Status - Hidden since we're using JavaScript now */}
          {/* <WasmStatus /> */}
          
          {/* Debug Panel - Remove in production */}
          <WasmDebugPanel />
          
          {/* Drop Zone */}
          <FileDropZone 
            onFilesAdded={handleFilesAdded}
            isProcessing={isCompressing || compressingFiles.length > 0}
          />
          
          {/* Compression Stats */}
          {files.length > 0 && (
            <CompressionStats
              totalFiles={files.length}
              completedFiles={completedFiles.length}
              totalOriginalSize={totalOriginalSize}
              totalCompressedSize={totalCompressedSize}
              compressionRatio={overallCompressionRatio}
            />
          )}
          
          {/* Performance Stats */}
          {completedFiles.length > 0 && (
            <PerformanceStats
              totalFiles={completedFiles.length}
              totalTimeElapsed={totalTimeElapsed}
              totalOriginalSize={totalOriginalSize}
              totalCompressedSize={totalCompressedSize}
              averageCompressionRatio={overallCompressionRatio}
            />
          )}
          
          {/* Progress Overview */}
          {(isCompressing || compressingFiles.length > 0) && (
            <CompressionProgress 
              files={compressingFiles}
            />
          )}
          
          {/* File List */}
          {files.length > 0 && (
            <FileList 
              files={files}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
