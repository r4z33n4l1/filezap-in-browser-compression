
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
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 md:p-6">
      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
        Performance Statistics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {/* Processing Speed */}
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Cpu className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            <span className="text-xs sm:text-sm text-blue-300">Speed</span>
          </div>
          <div className="text-sm sm:text-lg md:text-xl font-bold text-white">
            {compressionSpeed.toFixed(1)}
          </div>
          <div className="text-xs text-blue-300">MB/s</div>
        </div>

        {/* Total Time */}
        <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-xs sm:text-sm text-green-300">Time</span>
          </div>
          <div className="text-sm sm:text-lg md:text-xl font-bold text-white">
            {formatTime(totalTimeElapsed)}
          </div>
          <div className="text-xs text-green-300">Total</div>
        </div>

        {/* Space Saved */}
        <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <HardDrive className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-xs sm:text-sm text-purple-300">Saved</span>
          </div>
          <div className="text-sm sm:text-lg md:text-xl font-bold text-white">
            {formatSize(spaceSaved)}
          </div>
          <div className="text-xs text-purple-300">
            {spaceSavedPercentage.toFixed(1)}%
          </div>
        </div>

        {/* Compression Ratio */}
        <div className="bg-orange-600/10 border border-orange-500/20 rounded-lg p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
            <span className="text-xs sm:text-sm text-orange-300">Ratio</span>
          </div>
          <div className="text-sm sm:text-lg md:text-xl font-bold text-white">
            {(averageCompressionRatio * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-orange-300">Average</div>
        </div>
      </div>

      {/* WASM Benefits */}
      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg">
        <div className="text-xs sm:text-sm text-blue-300 font-medium mb-1">
          🚀 WebAssembly Performance Benefits
        </div>
        <div className="text-xs text-slate-300">
          • 5-10x faster than JavaScript compression
          • Native Go performance in the browser
          • Zero server uploads - complete privacy
          • Parallel processing with goroutines
        </div>
      </div>
    </div>
  );
}; 
