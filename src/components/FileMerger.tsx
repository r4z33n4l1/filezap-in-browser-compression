import { useState, useCallback } from 'react';
import { Merge, Download, FileText, Image, Archive, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FileMergerProps {
  files: File[];
  onSendToCompressor: (files: File[]) => void;
  onDownloadMerged: (mergedFile: File) => void;
}

interface MergeSettings {
  outputFormat: 'pdf' | 'zip';
  quality: 'high' | 'medium' | 'low';
  mergeMethod: 'sequential' | 'by-type';
}

export const FileMerger = ({ files, onSendToCompressor, onDownloadMerged }: FileMergerProps) => {
  const [settings, setSettings] = useState<MergeSettings>({
    outputFormat: 'pdf',
    quality: 'high',
    mergeMethod: 'sequential'
  });
  const [isMerging, setIsMerging] = useState(false);

  const pdfFiles = files.filter(f => f.type.includes('pdf'));
  const imageFiles = files.filter(f => f.type.includes('image'));
  const otherFiles = files.filter(f => !f.type.includes('pdf') && !f.type.includes('image'));

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const handleMerge = useCallback(async () => {
    if (files.length === 0) return;

    setIsMerging(true);
    
    try {
      // Simulate merging process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (settings.outputFormat === 'pdf' && pdfFiles.length > 0) {
        // For PDF merging, we would use a PDF merging library
        const mergedBlob = new Blob([], { type: 'application/pdf' });
        const mergedFile = new File([mergedBlob], 'merged_files.pdf', { type: 'application/pdf' });
        onDownloadMerged(mergedFile);
      } else {
        // For ZIP merging, we would use JSZip or similar
        const mergedBlob = new Blob([], { type: 'application/zip' });
        const mergedFile = new File([mergedBlob], 'merged_files.zip', { type: 'application/zip' });
        onDownloadMerged(mergedFile);
      }
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsMerging(false);
    }
  }, [files, settings, pdfFiles.length, onDownloadMerged]);

  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
    if (type.includes('image')) return <Image className="w-4 h-4 text-blue-400" />;
    return <Archive className="w-4 h-4 text-yellow-400" />;
  };

  if (files.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 text-center">
        <p className="text-slate-400">No files available for merging</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Merge className="w-5 h-5 text-blue-400" />
          <h3 className="text-white text-lg font-semibold">File Merger</h3>
        </div>
        <p className="text-slate-400 text-sm">
          Merge {files.length} files ({formatFileSize(totalSize)})
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* File Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pdfFiles.length > 0 && (
            <Card className="p-3 bg-red-500/10 border-red-500/20">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-white text-sm font-medium">{pdfFiles.length} PDFs</p>
                  <p className="text-red-300 text-xs">
                    {formatFileSize(pdfFiles.reduce((sum, f) => sum + f.size, 0))}
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {imageFiles.length > 0 && (
            <Card className="p-3 bg-blue-500/10 border-blue-500/20">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-white text-sm font-medium">{imageFiles.length} Images</p>
                  <p className="text-blue-300 text-xs">
                    {formatFileSize(imageFiles.reduce((sum, f) => sum + f.size, 0))}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {otherFiles.length > 0 && (
            <Card className="p-3 bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-white text-sm font-medium">{otherFiles.length} Others</p>
                  <p className="text-yellow-300 text-xs">
                    {formatFileSize(otherFiles.reduce((sum, f) => sum + f.size, 0))}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Merge Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-white text-sm">Output Format</Label>
            <Select 
              value={settings.outputFormat} 
              onValueChange={(value: 'pdf' | 'zip') => 
                setSettings(prev => ({ ...prev, outputFormat: value }))
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf" disabled={pdfFiles.length === 0}>
                  PDF {pdfFiles.length === 0 && '(No PDFs)'}
                </SelectItem>
                <SelectItem value="zip">ZIP Archive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Quality</Label>
            <Select 
              value={settings.quality} 
              onValueChange={(value: 'high' | 'medium' | 'low') => 
                setSettings(prev => ({ ...prev, quality: value }))
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Quality</SelectItem>
                <SelectItem value="medium">Medium Quality</SelectItem>
                <SelectItem value="low">Low Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Merge Method</Label>
            <Select 
              value={settings.mergeMethod} 
              onValueChange={(value: 'sequential' | 'by-type') => 
                setSettings(prev => ({ ...prev, mergeMethod: value }))
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="by-type">By File Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File List Preview */}
        <div className="space-y-2">
          <Label className="text-white text-sm">Files to Merge</Label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-700/30 rounded text-xs">
                {getFileTypeIcon(file.type)}
                <span className="text-white truncate flex-1">{file.name}</span>
                <span className="text-slate-400">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleMerge}
            disabled={isMerging || files.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isMerging ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Merged
              </>
            )}
          </Button>
          
          <Button
            onClick={() => onSendToCompressor(files)}
            variant="outline"
            className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10"
          >
            <Zap className="w-4 h-4 mr-2" />
            Send to Compressor
          </Button>
        </div>
      </div>
    </div>
  );
};