import { useState, useCallback, useEffect } from 'react';
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
  const { compressFile, isCompressing, progress, result, error, reset, currentStage } = useCompression();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    console.log('📤 Adding files for compression:', newFiles.length);
    
    const fileEntries: CompressedFile[] = newFiles.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalSize: file.size,
      status: 'pending' as const,
      progress: 0,
    }));
    
    setFiles(prev => [...prev, ...fileEntries]);
    
    // Process files one by one
    for (const fileEntry of fileEntries) {
      try {
        console.log(`🔄 Starting compression for: ${fileEntry.originalFile.name}`);
        
        // Set as active file
        setActiveFileId(fileEntry.id);
        setFiles(prev => prev.map(f => 
          f.id === fileEntry.id ? { ...f, status: 'compressing', progress: 0 } : f
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

  // Update progress for active file in real-time
  useEffect(() => {
    if (activeFileId && progress >= 0) {
      console.log(`📊 Updating progress for file ${activeFileId}: ${progress.toFixed(1)}%`);
      setFiles(prev => prev.map(f => 
        f.id === activeFileId ? { ...f, progress } : f
      ));
    }
  }, [activeFileId, progress]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
      <Header />
      
      <main className="container mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-4 md:py-8 max-w-6xl">
        <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-2 sm:p-3 md:p-4 text-white">
            <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold mb-1 sm:mb-2">🔒 VaultCompress: Privacy-First Architecture</h2>
            <p className="text-[10px] sm:text-xs md:text-sm opacity-90 leading-tight">
              <strong>100% Local Processing</strong> → Zero uploads, zero tracking, zero data collection!
              {files.length > 0 && ` Processing ${files.length} files privately...`}
            </p>
          </div>
          
          {/* Debug Panel - Remove in production */}
          <WasmDebugPanel />
          
          {/* Drop Zone */}
          <div className="w-full min-w-0">
            <FileDropZone 
              onFilesAdded={handleFilesAdded}
              isProcessing={isCompressing || compressingFiles.length > 0}
            />
          </div>
          
          {/* Compression Stats */}
          {files.length > 0 && (
            <div className="w-full min-w-0 overflow-hidden">
              <CompressionStats
                totalFiles={files.length}
                completedFiles={completedFiles.length}
                totalOriginalSize={totalOriginalSize}
                totalCompressedSize={totalCompressedSize}
                compressionRatio={overallCompressionRatio}
              />
            </div>
          )}
          
          {/* Performance Stats */}
          {completedFiles.length > 0 && (
            <div className="w-full min-w-0 overflow-hidden">
              <PerformanceStats
                totalFiles={completedFiles.length}
                totalTimeElapsed={totalTimeElapsed}
                totalOriginalSize={totalOriginalSize}
                totalCompressedSize={totalCompressedSize}
                averageCompressionRatio={overallCompressionRatio}
              />
            </div>
          )}
          
          {/* Progress Overview */}
          {(isCompressing || compressingFiles.length > 0) && (
            <div className="w-full min-w-0 overflow-hidden">
              <CompressionProgress 
                files={compressingFiles}
              />
            </div>
          )}
          
          {/* File List */}
          {files.length > 0 && (
            <div className="w-full min-w-0 overflow-hidden">
              <FileList 
                files={files}
                onRemoveFile={handleRemoveFile}
                onClearAll={handleClearAll}
              />
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm mt-4 sm:mt-8 md:mt-16 overflow-x-hidden">
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-1 sm:mb-2">VaultCompress</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Privacy-first file compression tool. All processing happens locally in your browser - 
                your files never leave your device.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-6 sm:items-center">
              <div className="text-slate-400 text-xs sm:text-sm">
                <p>Created by <strong className="text-white">Razeen Ali</strong></p>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                <a 
                  href="https://razeenali.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  🌐 Website
                </a>
                <a 
                  href="https://linkedin.com/in/razeenal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  💼 LinkedIn
                </a>
                <a 
                  href="https://github.com/r4z33n4l1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  🐙 GitHub
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-3 sm:mt-4 md:mt-6 pt-2 sm:pt-3 md:pt-4 text-center text-slate-500 text-xs">
            <p>© 2024 Razeen Ali. Open source under MIT License. Built with React + WebAssembly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
