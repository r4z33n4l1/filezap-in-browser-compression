import { cn } from '@/lib/utils';
import { Progress } from './progress';
import { Cpu, FileText, Zap, HardDrive, Sparkles } from 'lucide-react';

interface EnhancedProgressProps {
  value: number;
  stage?: string;
  className?: string;
  showStages?: boolean;
  animated?: boolean;
}

const STAGE_ICONS = {
  'Initializing': Cpu,
  'Parsing': FileText,
  'Processing': Zap,
  'Finalizing': HardDrive,
  'Completed': Sparkles
};

const STAGE_COLORS = {
  'Initializing': 'text-blue-400',
  'Parsing': 'text-yellow-400',
  'Processing': 'text-purple-400',
  'Finalizing': 'text-green-400',
  'Completed': 'text-emerald-400'
};

export function EnhancedProgress({ 
  value, 
  stage, 
  className, 
  showStages = false,
  animated = true 
}: EnhancedProgressProps) {
  const IconComponent = stage ? STAGE_ICONS[stage as keyof typeof STAGE_ICONS] : null;
  const stageColor = stage ? STAGE_COLORS[stage as keyof typeof STAGE_COLORS] : 'text-gray-400';
  
  return (
    <div className={cn("space-y-2", className)}>
      {showStages && stage && (
        <div className="flex items-center gap-2 text-sm">
          {IconComponent && (
            <IconComponent className={cn("w-4 h-4", stageColor, animated && "animate-pulse")} />
          )}
          <span className="text-white font-medium">{stage}</span>
          <span className="text-slate-400 text-xs ml-auto">{value.toFixed(1)}%</span>
        </div>
      )}
      
      <div className="relative">
        <Progress 
          value={value} 
          className={cn(
            "h-3 overflow-hidden",
            animated && "transition-all duration-300 ease-out"
          )}
        />
        
        {/* Animated sparkles for active progress */}
        {animated && value > 0 && value < 100 && (
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{
                width: '30%',
                transform: `translateX(${(value / 100) * 200 - 30}%)`
              }}
            />
          </div>
        )}
        
        {/* Completion sparkle effect */}
        {value >= 100 && animated && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />
          </div>
        )}
      </div>
      
      {/* Stage indicators */}
      {showStages && (
        <div className="flex justify-between text-xs">
          {Object.entries(STAGE_ICONS).map(([stageName, Icon], index) => {
            const isActive = stage === stageName;
            const isCompleted = value >= (index + 1) * 20;
            
            return (
              <div
                key={stageName}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? "scale-110" : "scale-90",
                  isCompleted ? "text-green-400" : isActive ? stageColor : "text-slate-600"
                )}
              >
                <Icon className={cn(
                  "w-3 h-3",
                  isActive && animated && "animate-pulse"
                )} />
                <span className="text-xs truncate w-12 text-center">
                  {stageName.slice(0, 4)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 