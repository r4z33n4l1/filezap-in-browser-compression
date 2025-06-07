
import { Zap, Clock, Cpu, HardDrive } from 'lucide-react';

interface PerformanceStatsProps {
  totalFiles: number;
  totalTimeElapsed: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
}

export const PerformanceStats = ({
  totalFiles,
  totalTimeElapsed,
  totalOriginalSize,
  totalCompressedSize,
  averageCompressionRatio
}: PerformanceStatsProps) => {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const compressionSpeed = totalFiles > 0 ? (totalOriginalSize / 1024 / 1024) / (totalTimeElapsed / 1000) : 0;
  const spaceSaved = totalOriginalSize - totalCompressedSize;
  const spaceSavedPercentage = totalOriginalSize > 0 ? (spaceSaved / totalOriginalSize) * 100 : 0;

  if (totalFiles === 0) return null;

  return (
    <div className="w-full overflow-hidden">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-3 md:p-4 lg:p-6">
        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4 flex items-center gap-1 sm:gap-2">
          <Zap className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400 flex-shrink-0" />
          <span className="truncate">Performance Statistics</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 md:gap-3 lg:gap-4">
          {/* Processing Speed */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
              <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-blue-300 truncate">Speed</span>
            </div>
            <div className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-white truncate">
              {compressionSpeed.toFixed(1)}
            </div>
            <div className="text-[10px] sm:text-xs text-blue-300">MB/s</div>
          </div>

          {/* Total Time */}
          <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-green-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-green-300 truncate">Time</span>
            </div>
            <div className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-white truncate">
              {formatTime(totalTimeElapsed)}
            </div>
            <div className="text-[10px] sm:text-xs text-green-300">Total</div>
          </div>

          {/* Space Saved */}
          <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
              <HardDrive className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-purple-300 truncate">Saved</span>
            </div>
            <div className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-white truncate">
              {formatSize(spaceSaved)}
            </div>
            <div className="text-[10px] sm:text-xs text-purple-300">
              {spaceSavedPercentage.toFixed(1)}%
            </div>
          </div>

          {/* Compression Ratio */}
          <div className="bg-orange-600/10 border border-orange-500/20 rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-orange-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-orange-300 truncate">Ratio</span>
            </div>
            <div className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-white truncate">
              {(averageCompressionRatio * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] sm:text-xs text-orange-300">Average</div>
          </div>
        </div>

        {/* WASM Benefits */}
        <div className="mt-2 sm:mt-3 md:mt-4 p-1.5 sm:p-2 md:p-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg">
          <div className="text-[10px] sm:text-xs md:text-sm text-blue-300 font-medium mb-1">
            🚀 WebAssembly Performance Benefits
          </div>
          <div className="text-[9px] sm:text-[10px] md:text-xs text-slate-300 leading-relaxed">
            • 5-10x faster than JavaScript compression
            • Native Go performance in the browser
            • Zero server uploads - complete privacy
            • Parallel processing with goroutines
          </div>
        </div>
      </div>
    </div>
  );
}; 
