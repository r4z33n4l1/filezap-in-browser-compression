
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { CompressedFile } from '@/pages/Index';

interface CompressionProgressProps {
  files: CompressedFile[];
}

export const CompressionProgress = ({ files }: CompressionProgressProps) => {
  const averageProgress = files.reduce((sum, file) => sum + (file.progress || 0), 0) / files.length;

  if (files.length === 0) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <div>
          <h3 className="text-white text-lg font-semibold">
            Compressing {files.length} file{files.length > 1 ? 's' : ''}...
          </h3>
          <p className="text-slate-400">
            Using Hybrid-Delta algorithm for optimal compression
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Overall Progress</span>
          <span className="text-white">{averageProgress.toFixed(1)}%</span>
        </div>
        <Progress value={averageProgress} className="h-3" />
        
        {files.map(file => (
          <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {file.originalFile.name}
              </p>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progress: {(file.progress || 0).toFixed(1)}%</span>
                <span>
                  {(file.originalFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>
            <div className="w-20">
              <Progress value={file.progress || 0} className="h-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
