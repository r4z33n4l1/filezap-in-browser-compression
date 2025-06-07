import { useState, useEffect } from 'react';
import { Cpu, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { loadWasm } from '@/lib/wasm';

interface WasmStatusProps {
  className?: string;
}

export const WasmStatus = ({ className = '' }: WasmStatusProps) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadTime, setLoadTime] = useState<number>(0);
  const [wasmSize, setWasmSize] = useState<string>('');

  useEffect(() => {
    const startTime = Date.now();
    
    loadWasm()
      .then(() => {
        const endTime = Date.now();
        setLoadTime(endTime - startTime);
        setStatus('ready');
        
        // Get WASM file size
        fetch('/pdf-turbo.wasm', { method: 'HEAD' })
          .then(response => {
            const size = response.headers.get('content-length');
            if (size) {
              const sizeInMB = (parseInt(size) / 1024 / 1024).toFixed(1);
              setWasmSize(`${sizeInMB} MB`);
            }
          })
          .catch(() => setWasmSize('~3 MB'));
      })
      .catch((error) => {
        console.error('WASM loading failed:', error);
        setStatus('error');
      });
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Loading WASM Engine...';
      case 'ready':
        return `WASM Ready (${loadTime}ms)`;
      case 'error':
        return 'WASM Failed to Load';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-500/20 bg-blue-600/10 text-blue-300';
      case 'ready':
        return 'border-green-500/20 bg-green-600/10 text-green-300';
      case 'error':
        return 'border-red-500/20 bg-red-600/10 text-red-300';
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor()} ${className}`}>
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5 text-purple-400" />
        {getStatusIcon()}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {getStatusText()}
          {wasmSize && status === 'ready' && (
            <span className="text-xs opacity-70">• {wasmSize}</span>
          )}
        </div>
        
        {status === 'ready' && (
          <div className="text-xs opacity-70 mt-1">
            Go-powered compression engine ready for ultra-fast processing
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-xs opacity-70 mt-1">
            Falling back to JavaScript compression
          </div>
        )}
      </div>
      
      {status === 'ready' && (
        <div className="flex gap-1">
          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
            PDF
          </span>
          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded">
            Images
          </span>
        </div>
      )}
    </div>
  );
}; 