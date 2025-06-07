
import { Shield, Zap, HardDrive, Cpu, Lock, Eye } from 'lucide-react';

export const Header = () => {
  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              FileZap
              <span className="text-yellow-400 ml-2">⚡</span>
            </h1>
            <p className="text-slate-300 text-lg">
              Lightning-fast file compression with WebAssembly performance
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 text-xs bg-green-600/20 text-green-300 rounded-full border border-green-500/20">
                100% Private
              </span>
              <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded-full border border-blue-500/20">
                WebAssembly
              </span>
              <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded-full border border-purple-500/20">
                Zero Upload
              </span>
              <span className="px-2 py-1 text-xs bg-orange-600/20 text-orange-300 rounded-full border border-orange-500/20">
                Offline Ready
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <Lock className="w-4 h-4" />
              <span>Local Only</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Eye className="w-4 h-4 opacity-50 line-through" />
              <span>No Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Cpu className="w-4 h-4" />
              <span>WASM Engine</span>
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <HardDrive className="w-4 h-4" />
              <span>Multi-Format</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-400">
              <Zap className="w-4 h-4" />
              <span>Ultra Fast</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
