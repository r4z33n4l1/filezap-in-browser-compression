
import { useState, useCallback } from 'react';
import { FileDropZone } from '@/components/FileDropZone';
import { CompressionProgress } from '@/components/CompressionProgress';
import { FileList } from '@/components/FileList';
import { Header } from '@/components/Header';
import { CompressionStats } from '@/components/CompressionStats';
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
}

const Index = () => {
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const { compressFile, isCompressing } = useCompression();

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const fileEntries: CompressedFile[] = newFiles.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalSize: file.size,
      status: 'pending' as const,
    }));
    
    setFiles(prev => [...prev, ...fileEntries]);
    
    // Start compression for each file
    fileEntries.forEach(fileEntry => {
      compressFile(fileEntry.originalFile, {
        onProgress: (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileEntry.id ? { ...f, progress } : f
          ));
        },
        onComplete: (result) => {
          setFiles(prev => prev.map(f => 
            f.id === fileEntry.id ? {
              ...f,
              status: 'completed',
              compressedBlob: result.compressedBlob,
              compressedSize: result.compressedSize,
              compressionRatio: result.compressionRatio,
              timeElapsed: result.timeElapsed,
              progress: 100
            } : f
          ));
        },
        onError: (error) => {
          setFiles(prev => prev.map(f => 
            f.id === fileEntry.id ? {
              ...f,
              status: 'error',
              error: error.message,
              progress: 0
            } : f
          ));
        }
      });
      
      setFiles(prev => prev.map(f => 
        f.id === fileEntry.id ? { ...f, status: 'compressing' } : f
      ));
    });
  }, [compressFile]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const totalOriginalSize = files.reduce((sum, file) => sum + file.originalSize, 0);
  const totalCompressedSize = files.reduce((sum, file) => sum + (file.compressedSize || 0), 0);
  const overallCompressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 0;
  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8">
          {/* Drop Zone */}
          <FileDropZone 
            onFilesAdded={handleFilesAdded}
            isProcessing={isCompressing}
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
          
          {/* Progress Overview */}
          {isCompressing && (
            <CompressionProgress 
              files={files.filter(f => f.status === 'compressing')}
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
