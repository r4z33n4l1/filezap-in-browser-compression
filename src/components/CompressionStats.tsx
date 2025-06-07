
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 bg-blue-600/20 rounded-lg">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 text-xs sm:text-sm">Files</p>
            <p className="text-white text-sm sm:text-lg md:text-2xl font-bold truncate">
              {completedFiles}/{totalFiles}
            </p>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 sm:h-2">
          <div 
            className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 bg-green-600/20 rounded-lg">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 text-xs sm:text-sm">Savings</p>
            <p className="text-white text-sm sm:text-lg md:text-2xl font-bold truncate">
              {compressionPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
        <p className="text-green-400 text-xs sm:text-sm truncate">
          {formatFileSize(spaceSaved)} saved
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 bg-purple-600/20 rounded-lg">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 text-xs sm:text-sm">Original</p>
            <p className="text-white text-sm sm:text-lg md:text-2xl font-bold truncate">
              {formatFileSize(totalOriginalSize)}
            </p>
          </div>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm truncate">
          → {formatFileSize(totalCompressedSize)}
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 bg-emerald-600/20 rounded-lg">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 text-xs sm:text-sm">Quality</p>
            <p className="text-white text-sm sm:text-lg md:text-2xl font-bold truncate">
              {compressionRatio < 0.5 ? 'High' : compressionRatio < 0.8 ? 'Good' : 'Low'}
            </p>
          </div>
        </div>
        <p className="text-emerald-400 text-xs sm:text-sm truncate">
          Hybrid Algorithm
        </p>
      </div>
    </div>
  );
};
