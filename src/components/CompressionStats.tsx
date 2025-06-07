
import { TrendingDown, Clock, CheckCircle, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface CompressionStatsProps {
  totalFiles: number;
  completedFiles: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
}

export const CompressionStats = ({
  totalFiles,
  completedFiles,
  totalOriginalSize,
  totalCompressedSize,
  compressionRatio
}: CompressionStatsProps) => {
  const compressionPercentage = (1 - compressionRatio) * 100;
  const spaceSaved = totalOriginalSize - totalCompressedSize;

  return (
    <div className="w-full overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 md:gap-3 lg:gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 border border-slate-700 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <div className="p-1 sm:p-1.5 bg-blue-600/20 rounded-lg flex-shrink-0">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-400 text-[10px] sm:text-xs">Files</p>
              <p className="text-white text-xs sm:text-sm md:text-lg font-bold truncate">
                {completedFiles}/{totalFiles}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1 sm:h-1.5">
            <div 
              className="bg-blue-500 h-1 sm:h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 border border-slate-700 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <div className="p-1 sm:p-1.5 bg-green-600/20 rounded-lg flex-shrink-0">
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-400 text-[10px] sm:text-xs">Savings</p>
              <p className="text-white text-xs sm:text-sm md:text-lg font-bold truncate">
                {compressionPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="text-green-400 text-[10px] sm:text-xs truncate">
            {formatFileSize(spaceSaved)} saved
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 border border-slate-700 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <div className="p-1 sm:p-1.5 bg-purple-600/20 rounded-lg flex-shrink-0">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-400 text-[10px] sm:text-xs">Original</p>
              <p className="text-white text-xs sm:text-sm md:text-lg font-bold truncate">
                {formatFileSize(totalOriginalSize)}
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-[10px] sm:text-xs truncate">
            → {formatFileSize(totalCompressedSize)}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 border border-slate-700 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <div className="p-1 sm:p-1.5 bg-emerald-600/20 rounded-lg flex-shrink-0">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-400 text-[10px] sm:text-xs">Quality</p>
              <p className="text-white text-xs sm:text-sm md:text-lg font-bold truncate">
                {compressionRatio < 0.5 ? 'High' : compressionRatio < 0.8 ? 'Good' : 'Low'}
              </p>
            </div>
          </div>
          <p className="text-emerald-400 text-[10px] sm:text-xs truncate">
            Hybrid Algorithm
          </p>
        </div>
      </div>
    </div>
  );
};
