
import { Download, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompressedFile } from '@/pages/Index';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: CompressedFile[];
  onRemoveFile: (fileId: string) => void;
  onClearAll: () => void;
}

export const FileList = ({ files, onRemoveFile, onClearAll }: FileListProps) => {
  const handleDownload = (file: CompressedFile) => {
    if (!file.compressedBlob) return;
    
    try {
      const url = URL.createObjectURL(file.compressedBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Add compressed prefix and maintain original extension
      const fileExtension = file.originalFile.name.split('.').pop() || '';
      const nameWithoutExt = file.originalFile.name.replace(/\.[^/.]+$/, '');
      a.download = `${nameWithoutExt}_compressed.${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Downloaded compressed file: ${a.download} (${file.compressedSize} bytes)`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadAll = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.compressedBlob);
    
    completedFiles.forEach((file, index) => {
      // Stagger downloads to avoid browser blocking
      setTimeout(() => handleDownload(file), index * 100);
    });
  };

  const getStatusIcon = (status: CompressedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />;
      case 'compressing':
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 animate-pulse flex-shrink-0" />;
      default:
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: CompressedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/20 bg-green-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      case 'compressing':
        return 'border-blue-500/20 bg-blue-500/5';
      default:
        return 'border-slate-600/20 bg-slate-800/20';
    }
  };

  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <div className="w-full overflow-hidden">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
        <div className="p-2 sm:p-3 md:p-4 lg:p-6 border-b border-slate-700">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div>
              <h3 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-semibold truncate">
                File Processing Queue
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm">
                {completedFiles.length} of {files.length} files completed
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              {completedFiles.length > 0 && (
                <Button
                  onClick={handleDownloadAll}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-[10px] sm:text-xs md:text-sm h-7 sm:h-8"
                >
                  <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-1" />
                  <span className="truncate">Download All ({completedFiles.length})</span>
                </Button>
              )}
              <Button
                onClick={onClearAll}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 text-[10px] sm:text-xs md:text-sm h-7 sm:h-8"
              >
                <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-1" />
                <span className="truncate">Clear All</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="space-y-1 sm:space-y-2">
            {files.map(file => (
              <div 
                key={file.id} 
                className={cn(
                  "p-2 sm:p-3 rounded-lg border transition-all duration-200 min-w-0",
                  getStatusColor(file.status)
                )}
              >
                <div className="flex items-start gap-1 sm:gap-2 md:gap-3 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-1">
                      <p className="text-white text-xs sm:text-sm md:text-base font-medium truncate min-w-0">
                        {file.originalFile.name}
                      </p>
                      {file.status === 'completed' && file.compressionRatio && (
                        <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 text-[10px] sm:text-xs rounded-full self-start sm:self-auto flex-shrink-0">
                          -{((1 - file.compressionRatio) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-1 sm:gap-2 lg:gap-3 text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">
                      <span className="truncate min-w-0">Original: {formatFileSize(file.originalSize)}</span>
                      {file.compressedSize && (
                        <span className="truncate min-w-0">Compressed: {formatFileSize(file.compressedSize)}</span>
                      )}
                      {file.timeElapsed && (
                        <span className="truncate min-w-0">Time: {(file.timeElapsed / 1000).toFixed(1)}s</span>
                      )}
                      {file.pageCount && (
                        <span className="truncate min-w-0">Pages: {file.pageCount}</span>
                      )}
                      {file.processedPages && file.pageCount && (
                        <span className="truncate min-w-0">Processed: {file.processedPages}/{file.pageCount}</span>
                      )}
                    </div>
                    
                    {file.error && (
                      <div className="text-red-400 text-[10px] sm:text-xs min-w-0">
                        <p className="font-medium truncate">Error: {file.error}</p>
                        {file.error.includes('PDF') && (
                          <p className="text-slate-500 mt-1 text-[9px] sm:text-[10px] leading-tight">
                            Try a different PDF or check if the file is corrupted
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0">
                    {file.status === 'completed' && file.compressedBlob && (
                      <Button
                        onClick={() => handleDownload(file)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 p-0"
                      >
                        <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Button>
                    )}
                    <Button
                      onClick={() => onRemoveFile(file.id)}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-400 hover:bg-slate-700 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 p-0"
                    >
                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
