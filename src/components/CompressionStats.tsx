
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Files Processed</p>
            <p className="text-white text-2xl font-bold">
              {completedFiles}/{totalFiles}
            </p>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-600/20 rounded-lg">
            <TrendingDown className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Compression</p>
            <p className="text-white text-2xl font-bold">
              {compressionPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
        <p className="text-green-400 text-sm">
          {formatFileSize(spaceSaved)} saved
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Original Size</p>
            <p className="text-white text-2xl font-bold">
              {formatFileSize(totalOriginalSize)}
            </p>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          → {formatFileSize(totalCompressedSize)}
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-600/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Efficiency</p>
            <p className="text-white text-2xl font-bold">
              {compressionRatio < 0.5 ? 'High' : compressionRatio < 0.8 ? 'Good' : 'Low'}
            </p>
          </div>
        </div>
        <p className="text-emerald-400 text-sm">
          Hybrid-Delta Algorithm
        </p>
      </div>
    </div>
  );
};
