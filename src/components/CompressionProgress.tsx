import { Progress } from '@/components/ui/progress';
import { EnhancedProgress } from '@/components/ui/enhanced-progress';
import { Loader2, Cpu, FileText, Zap, CheckCircle2, Clock, HardDrive } from 'lucide-react';
import { CompressedFile } from '@/pages/Index';
import { useEffect, useState } from 'react';

interface CompressionProgressProps {
  files: CompressedFile[];
}

interface ProgressStage {
  name: string;
  description: string;
  icon: React.ReactNode;
  range: [number, number]; // [start%, end%]
  color: string;
}

const PROGRESS_STAGES: ProgressStage[] = [
  {
    name: "Initializing",
    description: "Loading WebAssembly engine...",
    icon: <Cpu className="w-4 h-4" />,
    range: [0, 10],
    color: "text-blue-400"
  },
  {
    name: "Parsing",
    description: "Analyzing file structure...",
    icon: <FileText className="w-4 h-4" />,
    range: [10, 20],
    color: "text-yellow-400"
  },
  {
    name: "Processing",
    description: "Compressing pages with WASM...",
    icon: <Zap className="w-4 h-4" />,
    range: [20, 90],
    color: "text-purple-400"
  },
  {
    name: "Finalizing",
    description: "Building optimized output...",
    icon: <HardDrive className="w-4 h-4" />,
    range: [90, 100],
    color: "text-green-400"
  }
];

function getCurrentStage(progress: number): ProgressStage {
  return PROGRESS_STAGES.find(stage => 
    progress >= stage.range[0] && progress <= stage.range[1]
  ) || PROGRESS_STAGES[0];
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

function estimateTimeRemaining(progress: number, elapsedTime: number): number {
  if (progress <= 0) return 0;
  const totalEstimatedTime = (elapsedTime / progress) * 100;
  return Math.max(0, totalEstimatedTime - elapsedTime);
}

export const CompressionProgress = ({ files }: CompressionProgressProps) => {
  const [startTime] = useState(() => Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const averageProgress = files.reduce((sum, file) => sum + (file.progress || 0), 0) / files.length;
  const elapsedTime = (currentTime - startTime) / 1000;
  const currentStage = getCurrentStage(averageProgress);
  const totalBytes = files.reduce((sum, file) => sum + file.originalFile.size, 0);
  const processedBytes = totalBytes * (averageProgress / 100);
  const speed = elapsedTime > 0 ? processedBytes / elapsedTime : 0;
  const timeRemaining = estimateTimeRemaining(averageProgress, elapsedTime);

  if (files.length === 0) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-white text-lg font-semibold">
            VaultCompress Processing
          </h3>
          <p className="text-slate-400 text-sm">
            {files.length} file{files.length > 1 ? 's' : ''} • 100% private processing
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="text-white font-mono">{averageProgress.toFixed(1)}%</div>
          <div className="text-slate-400">Complete</div>
        </div>
      </div>

      {/* Current Stage Indicator */}
      <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${currentStage.color} animate-pulse`}>
            {currentStage.icon}
          </div>
          <div>
            <div className="text-white font-medium">{currentStage.name}</div>
            <div className="text-slate-400 text-sm">{currentStage.description}</div>
          </div>
        </div>
        
        {/* Stage Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Stage Progress</span>
            <span>
              {Math.max(0, Math.min(100, 
                ((averageProgress - currentStage.range[0]) / 
                 (currentStage.range[1] - currentStage.range[0])) * 100
              )).toFixed(0)}%
            </span>
          </div>
          <EnhancedProgress 
            value={Math.max(0, Math.min(100, 
              ((averageProgress - currentStage.range[0]) / 
               (currentStage.range[1] - currentStage.range[0])) * 100
            ))} 
            stage={currentStage.name}
            animated={true}
            className="h-2" 
          />
        </div>
      </div>

      {/* Overall Progress */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Overall Progress</span>
          <span className="text-white font-mono">{averageProgress.toFixed(1)}%</span>
        </div>
        <EnhancedProgress value={averageProgress} className="h-4" />
        
        {/* Progress Statistics */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center p-2 bg-slate-700/20 rounded">
            <div className="text-slate-400">Elapsed</div>
            <div className="text-white font-mono">{formatTime(elapsedTime)}</div>
          </div>
          <div className="text-center p-2 bg-slate-700/20 rounded">
            <div className="text-slate-400">Speed</div>
            <div className="text-white font-mono">{formatSpeed(speed)}</div>
          </div>
          <div className="text-center p-2 bg-slate-700/20 rounded">
            <div className="text-slate-400">Remaining</div>
            <div className="text-white font-mono">
              {timeRemaining > 0 ? formatTime(timeRemaining) : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Individual File Progress */}
      <div className="space-y-3">
        <div className="text-sm text-slate-400 font-medium">Individual Files</div>
        {files.map((file, index) => {
          const fileProgress = file.progress || 0;
          const fileStage = getCurrentStage(fileProgress);
          const isCompleted = fileProgress >= 100;
          const isActive = fileProgress > 0 && fileProgress < 100;
          
          return (
            <div 
              key={file.id} 
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : isActive 
                    ? 'bg-blue-500/10 border-blue-500/30 animate-pulse' 
                    : 'bg-slate-700/20 border-slate-600/30'
              }`}
            >
              {/* File Status Icon */}
              <div className={`flex-shrink-0 ${
                isCompleted ? 'text-green-400' : isActive ? fileStage.color : 'text-slate-500'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isActive ? (
                  <div className="animate-spin">
                    {fileStage.icon}
                  </div>
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-sm font-medium truncate">
                    {file.originalFile.name}
                  </p>
                  {file.pageCount && (
                    <span className="text-xs text-slate-400 bg-slate-600/50 px-2 py-0.5 rounded">
                      {file.processedPages || 0}/{file.pageCount} pages
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                  <span>
                    {isCompleted ? 'Completed' : isActive ? fileStage.name : 'Pending'}
                    {isActive && ` • ${fileStage.description}`}
                  </span>
                  <span>{(file.originalFile.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>

                {/* File Progress Bar */}
                <div className="flex items-center gap-2">
                  <EnhancedProgress 
                    value={fileProgress} 
                    stage={isActive ? fileStage.name : undefined}
                    animated={isActive}
                    className="h-2 flex-1" 
                  />
                  <span className="text-xs text-white font-mono w-12 text-right">
                    {fileProgress.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Status */}
      <div className="mt-4 pt-4 border-t border-slate-600/30 text-center">
        <div className="text-xs text-slate-400">
          🔒 All processing happens locally in your browser - your files never leave your device
        </div>
      </div>
    </div>
  );
};
