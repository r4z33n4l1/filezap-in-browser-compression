
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
    <div
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300",
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
      
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <Upload className={cn(
            "w-16 h-16 mx-auto transition-all duration-300",
            isDragOver ? "text-blue-400 scale-110" : "text-slate-400"
          )} />
          <div className="absolute -top-2 -right-2 animate-bounce">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-slate-400 text-lg mb-4">
            Support for PDFs, images, and archives
          </p>
          <div className="flex justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </div>
            <div className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              <span>Images</span>
            </div>
            <div className="flex items-center gap-1">
              <Archive className="w-4 h-4" />
              <span>Archives</span>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
          Select Files
        </div>
      </div>
    </div>
  );
};
