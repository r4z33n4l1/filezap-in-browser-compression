
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
  range: [number, number];
  color: string;
}

const PROGRESS_STAGES: ProgressStage[] = [
  {
    name: "Initializing",
    description: "Setting up compression engine...",
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
    description: "Compressing content...",
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
    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 animate-spin" />
          <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground text-lg sm:text-xl font-semibold">
            VaultCompress Processing
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {files.length} file{files.length > 1 ? 's' : ''} • 100% private processing
          </p>
        </div>
        <div className="text-right text-sm shrink-0">
          <div className="text-foreground font-mono text-lg sm:text-xl">{averageProgress.toFixed(1)}%</div>
          <div className="text-muted-foreground text-xs">Complete</div>
        </div>
      </div>

      {/* Current Stage Indicator - Mobile optimized */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-accent/20 rounded-lg border border-accent/30">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className={`${currentStage.color} animate-pulse`}>
            {currentStage.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-foreground font-medium text-sm sm:text-base">{currentStage.name}</div>
            <div className="text-muted-foreground text-xs sm:text-sm truncate">{currentStage.description}</div>
          </div>
        </div>
        
        {/* Stage Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
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

      {/* Overall Progress - Mobile optimized */}
      <div className="space-y-3 mb-4 sm:mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="text-foreground font-mono">{averageProgress.toFixed(1)}%</span>
        </div>
        <EnhancedProgress 
          value={averageProgress} 
          animated={true} 
          className="h-3 sm:h-4" 
        />
        
        {/* Progress Statistics - Mobile grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs">
          <div className="text-center p-2 bg-accent/10 rounded">
            <div className="text-muted-foreground">Elapsed</div>
            <div className="text-foreground font-mono text-xs sm:text-sm">{formatTime(elapsedTime)}</div>
          </div>
          <div className="text-center p-2 bg-accent/10 rounded">
            <div className="text-muted-foreground">Speed</div>
            <div className="text-foreground font-mono text-xs sm:text-sm">{formatSpeed(speed)}</div>
          </div>
          <div className="text-center p-2 bg-accent/10 rounded">
            <div className="text-muted-foreground">Remaining</div>
            <div className="text-foreground font-mono text-xs sm:text-sm">
              {timeRemaining > 0 ? formatTime(timeRemaining) : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Individual File Progress - Mobile optimized */}
      <div className="space-y-2 sm:space-y-3">
        <div className="text-sm text-muted-foreground font-medium">Individual Files</div>
        {files.map((file, index) => {
          const fileProgress = file.progress || 0;
          const fileStage = getCurrentStage(fileProgress);
          const isCompleted = fileProgress >= 100;
          const isActive = fileProgress > 0 && fileProgress < 100;
          
          return (
            <div 
              key={file.id} 
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : isActive 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-accent/10 border-accent/30'
              }`}
            >
              {/* File Status Icon */}
              <div className={`flex-shrink-0 ${
                isCompleted ? 'text-green-400' : isActive ? fileStage.color : 'text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : isActive ? (
                  <div className="animate-spin">
                    {fileStage.icon}
                  </div>
                ) : (
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <p className="text-foreground text-sm font-medium truncate">
                    {file.originalFile.name}
                  </p>
                  {file.pageCount && (
                    <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded self-start sm:self-auto">
                      {file.processedPages || 0}/{file.pageCount} pages
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-muted-foreground mb-2 gap-1">
                  <span>
                    {isCompleted ? 'Completed' : isActive ? fileStage.name : 'Pending'}
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
                  <span className="text-xs text-foreground font-mono w-10 sm:w-12 text-right">
                    {fileProgress.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Status */}
      <div className="mt-4 pt-4 border-t text-center">
        <div className="text-xs text-muted-foreground">
          🔒 All processing happens locally in your browser - your files never leave your device
        </div>
      </div>
    </div>
  );
};
