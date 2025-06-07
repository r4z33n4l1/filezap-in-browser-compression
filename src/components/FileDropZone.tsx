
import { useCallback, useState } from 'react';
import { Upload, FileText, Image, Archive, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFilesAdded: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileDropZone = ({ onFilesAdded, isProcessing }: FileDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesAdded(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [onFilesAdded]);

  return (
    <div className="w-full overflow-hidden">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 text-center transition-all duration-300 min-w-0",
          isDragOver 
            ? "border-blue-400 bg-blue-400/10 scale-[1.02]" 
            : "border-slate-600 bg-slate-800/50",
          isProcessing && "opacity-70 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.zip,.rar,.7z"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6">
          <div className="relative">
            <Upload className={cn(
              "w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto transition-all duration-300",
              isDragOver ? "text-blue-400 scale-110" : "text-slate-400"
            )} />
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 animate-bounce">
              <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Zap className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="min-w-0 w-full">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-1 sm:mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg mb-2 sm:mb-4">
              Support for PDFs, images, and archives
            </p>
            <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-slate-500 flex-wrap">
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>PDF</span>
              </div>
              <div className="flex items-center gap-1">
                <Image className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Images</span>
              </div>
              <div className="flex items-center gap-1">
                <Archive className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Archives</span>
              </div>
            </div>
          </div>
          
          <div className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer text-xs sm:text-sm md:text-base">
            Select Files
          </div>
        </div>
      </div>
    </div>
  );
};
