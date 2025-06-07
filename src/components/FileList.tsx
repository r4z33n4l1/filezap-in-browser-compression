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
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'compressing':
        return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
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
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white text-xl font-semibold">
              File Processing Queue
            </h3>
            <p className="text-slate-400">
              {completedFiles.length} of {files.length} files completed
            </p>
          </div>
          <div className="flex gap-2">
            {completedFiles.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All ({completedFiles.length})
              </Button>
            )}
            <Button
              onClick={onClearAll}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3">
          {files.map(file => (
            <div 
              key={file.id} 
              className={cn(
                "p-4 rounded-lg border transition-all duration-200",
                getStatusColor(file.status)
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(file.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium truncate">
                      {file.originalFile.name}
                    </p>
                    {file.status === 'completed' && file.compressionRatio && (
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                        -{((1 - file.compressionRatio) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    <span>Original: {formatFileSize(file.originalSize)}</span>
                    {file.compressedSize && (
                      <span>Compressed: {formatFileSize(file.compressedSize)}</span>
                    )}
                    {file.timeElapsed && (
                      <span>Time: {(file.timeElapsed / 1000).toFixed(1)}s</span>
                    )}
                    {file.pageCount && (
                      <span>Pages: {file.pageCount}</span>
                    )}
                    {file.processedPages && file.pageCount && (
                      <span>Processed: {file.processedPages}/{file.pageCount}</span>
                    )}
                  </div>
                  
                  {file.error && (
                    <p className="text-red-400 text-sm mt-1">
                      Error: {file.error}
                      {file.error.includes('PDF') && (
                        <span className="block text-xs text-slate-500 mt-1">
                          Try a different PDF or check if the file is corrupted
                        </span>
                      )}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === 'completed' && file.compressedBlob && (
                    <Button
                      onClick={() => handleDownload(file)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => onRemoveFile(file.id)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-400 hover:bg-slate-700"
                  >
                    <Trash2 className="w-4 h-4" />
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
