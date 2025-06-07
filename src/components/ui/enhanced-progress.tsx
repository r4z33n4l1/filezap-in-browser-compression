
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
            <IconComponent className={cn(
              "w-4 h-4 transition-all duration-300", 
              stageColor, 
              animated && "animate-pulse"
            )} />
          )}
          <span className="text-foreground font-medium">{stage}</span>
          <span className="text-muted-foreground text-xs ml-auto">{value.toFixed(1)}%</span>
        </div>
      )}
      
      <div className="relative overflow-hidden">
        <Progress 
          value={value} 
          className={cn(
            "h-3 transition-all duration-500 ease-out",
            animated && "animate-pulse"
          )}
        />
        
        {/* Animated shimmer effect */}
        {animated && value > 0 && value < 100 && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
              style={{
                width: '40%',
                transform: `translateX(${(value / 100) * 150 - 40}%)`,
                transition: 'transform 0.5s ease-out'
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
      
      {/* Mobile-friendly stage indicators */}
      {showStages && (
        <div className="grid grid-cols-5 gap-1 text-xs">
          {Object.entries(STAGE_ICONS).map(([stageName, Icon], index) => {
            const isActive = stage === stageName;
            const isCompleted = value >= (index + 1) * 20;
            
            return (
              <div
                key={stageName}
                className={cn(
                  "flex flex-col items-center gap-1 p-1 rounded transition-all duration-300",
                  isActive ? "scale-110 bg-accent/20" : "scale-90",
                  isCompleted ? "text-green-400" : isActive ? stageColor : "text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "w-3 h-3 sm:w-4 sm:h-4",
                  isActive && animated && "animate-pulse"
                )} />
                <span className="text-[10px] sm:text-xs truncate text-center leading-tight">
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
