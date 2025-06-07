
import { Shield, Zap, HardDrive } from 'lucide-react';

export const Header = () => {
  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Shrink-It
              <span className="text-blue-400 ml-2">Pro</span>
            </h1>
            <p className="text-slate-300 text-lg">
              Advanced client-side file compression powered by Hybrid-Delta algorithm
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <Shield className="w-4 h-4" />
              <span>100% Private</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Zap className="w-4 h-4" />
              <span>Ultra-Fast</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <HardDrive className="w-4 h-4" />
              <span>Multi-Format</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
