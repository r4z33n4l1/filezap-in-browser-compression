import { useState } from 'react';
import { loadWasm } from '@/lib/wasm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const WasmDebugPanel = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testWasmBasic = async () => {
    setStatus('Testing WASM Basic...');
    addLog('Starting basic WASM test');
    
    try {
      const wasm = await loadWasm();
      addLog('WASM module loaded successfully');
      
      // Test basic functionality
      if (window.wasmReady) {
        addLog('✅ window.wasmReady is true');
      } else {
        addLog('❌ window.wasmReady is false or undefined');
      }
      
      if (window.compressPDF) {
        addLog('✅ window.compressPDF function is available');
      } else {
        addLog('❌ window.compressPDF function is missing');
      }
      
      if (window.compressImage) {
        addLog('✅ window.compressImage function is available');
      } else {
        addLog('❌ window.compressImage function is missing');
      }
      
      setStatus('Basic test completed');
      
    } catch (error) {
      addLog(`❌ Basic test failed: ${error}`);
      setStatus('Basic test failed');
    }
  };

  const testWasmWithDummyData = async () => {
    setStatus('Testing WASM with dummy data...');
    addLog('Starting dummy data test');
    
    try {
      const wasm = await loadWasm();
      
      // Create a valid 1x1 pixel PNG (67 bytes total)
      const dummyPngData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // RGB, no compression, no filter, no interlace
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, // RGB data (red pixel)
        0x01, 0x00, 0x01, 0x5C, 0xDD, 0x8D, 0xB4, 0x00, // CRC32
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
        0x42, 0x60, 0x82                                   // CRC32
      ]);
      
      addLog(`Created dummy PNG data: ${dummyPngData.length} bytes`);
      addLog(`Data type: ${dummyPngData.constructor.name}`);
      
      const result = await wasm.compressImage(
        dummyPngData, 
        'image/png',
        (progress) => addLog(`Progress: ${progress}%`)
      );
      
      addLog(`✅ Image compression test successful`);
      addLog(`Original: ${result.originalSize} bytes, Compressed: ${result.compressedSize} bytes`);
      addLog(`Ratio: ${result.compressionRatio.toFixed(3)}`);
      
      setStatus('Dummy data test completed');
      
    } catch (error) {
      addLog(`❌ Dummy data test failed: ${error}`);
      setStatus('Dummy data test failed');
    }
  };

  const testPDFCompression = async () => {
    setStatus('Testing PDF compression...');
    addLog('Starting PDF compression test');
    
    try {
      const wasm = await loadWasm();
      
      // Create a minimal valid PDF
      const dummyPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000267 00000 n 
0000000323 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
415
%%EOF`;
      
      const pdfBytes = new TextEncoder().encode(dummyPDF);
      addLog(`Created dummy PDF: ${pdfBytes.length} bytes`);
      
      const result = await wasm.compressPDF(
        pdfBytes,
        (progress) => addLog(`Progress: ${progress}%`)
      );
      
      addLog(`✅ PDF compression test successful`);
      addLog(`Original: ${result.originalSize} bytes, Compressed: ${result.compressedSize} bytes`);
      addLog(`Compression ratio: ${result.compressionRatio.toFixed(3)}`);
      addLog(`Savings: ${((1 - result.compressionRatio) * 100).toFixed(1)}%`);
      
      setStatus('PDF test completed');
      
    } catch (error) {
      addLog(`❌ PDF test failed: ${error}`);
      setStatus('PDF test failed');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus('Ready');
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🔧 WASM Debug Panel
          <span className="text-sm font-normal text-slate-400">({status})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testWasmBasic}
            variant="outline"
            size="sm"
            disabled={status.includes('Testing')}
          >
            Test Basic WASM
          </Button>
          <Button 
            onClick={testWasmWithDummyData}
            variant="outline"
            size="sm"
            disabled={status.includes('Testing')}
          >
            Test Image
          </Button>
          <Button 
            onClick={testPDFCompression}
            variant="outline"
            size="sm"
            disabled={status.includes('Testing')}
          >
            Test PDF
          </Button>
          <Button 
            onClick={clearLogs}
            variant="outline"
            size="sm"
          >
            Clear Logs
          </Button>
        </div>
        
        <div className="bg-black/20 border border-slate-600 rounded p-3 max-h-64 overflow-y-auto">
          <div className="text-xs font-mono text-slate-300">
            {logs.length === 0 ? (
              <div className="text-slate-500">No logs yet. Click a test button to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 