
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
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />;
      case 'compressing':
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />;
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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-700">
      <div className="p-3 sm:p-4 md:p-6 border-b border-slate-700">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold">
              File Processing Queue
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              {completedFiles.length} of {files.length} files completed
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {completedFiles.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Download All ({completedFiles.length})
              </Button>
            )}
            <Button
              onClick={onClearAll}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs sm:text-sm"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 md:p-6">
        <div className="space-y-2 sm:space-y-3">
          {files.map(file => (
            <div 
              key={file.id} 
              className={cn(
                "p-3 sm:p-4 rounded-lg border transition-all duration-200",
                getStatusColor(file.status)
              )}
            >
              <div className="flex items-start gap-2 sm:gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(file.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <p className="text-white text-sm sm:text-base font-medium truncate">
                      {file.originalFile.name}
                    </p>
                    {file.status === 'completed' && file.compressionRatio && (
                      <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full self-start sm:self-auto">
                        -{((1 - file.compressionRatio) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-slate-400 mb-2">
                    <span className="truncate">Original: {formatFileSize(file.originalSize)}</span>
                    {file.compressedSize && (
                      <span className="truncate">Compressed: {formatFileSize(file.compressedSize)}</span>
                    )}
                    {file.timeElapsed && (
                      <span className="truncate">Time: {(file.timeElapsed / 1000).toFixed(1)}s</span>
                    )}
                    {file.pageCount && (
                      <span className="truncate">Pages: {file.pageCount}</span>
                    )}
                    {file.processedPages && file.pageCount && (
                      <span className="truncate">Processed: {file.processedPages}/{file.pageCount}</span>
                    )}
                  </div>
                  
                  {file.error && (
                    <div className="text-red-400 text-xs sm:text-sm">
                      <p className="font-medium">Error: {file.error}</p>
                      {file.error.includes('PDF') && (
                        <p className="text-slate-500 mt-1">
                          Try a different PDF or check if the file is corrupted
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  {file.status === 'completed' && file.compressedBlob && (
                    <Button
                      onClick={() => handleDownload(file)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 w-8 h-8 p-0 sm:w-auto sm:h-auto sm:p-2"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => onRemoveFile(file.id)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-400 hover:bg-slate-700 w-8 h-8 p-0 sm:w-auto sm:h-auto sm:p-2"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
