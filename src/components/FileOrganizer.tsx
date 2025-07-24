import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, File, FileText, Image, Archive, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface OrganizedFile {
  id: string;
  file: File;
  type: 'pdf' | 'image' | 'archive' | 'other';
}

interface FileOrganizerProps {
  files: File[];
  onFilesReorganized: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
}

const getFileType = (file: File): OrganizedFile['type'] => {
  if (file.type.includes('pdf')) return 'pdf';
  if (file.type.includes('image')) return 'image';
  if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return 'archive';
  return 'other';
};

const getFileIcon = (type: OrganizedFile['type']) => {
  switch (type) {
    case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
    case 'image': return <Image className="w-4 h-4 text-blue-400" />;
    case 'archive': return <Archive className="w-4 h-4 text-yellow-400" />;
    default: return <File className="w-4 h-4 text-gray-400" />;
  }
};

export const FileOrganizer = ({ files, onFilesReorganized, onRemoveFile, onClearAll }: FileOrganizerProps) => {
  const [organizedFiles, setOrganizedFiles] = useState<OrganizedFile[]>(
    files.map(file => ({
      id: crypto.randomUUID(),
      file,
      type: getFileType(file)
    }))
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(organizedFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrganizedFiles(items);
    onFilesReorganized(items.map(item => item.file));
  }, [organizedFiles, onFilesReorganized]);

  const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= organizedFiles.length) return;

    const items = Array.from(organizedFiles);
    const [movedItem] = items.splice(index, 1);
    items.splice(newIndex, 0, movedItem);

    setOrganizedFiles(items);
    onFilesReorganized(items.map(item => item.file));
  }, [organizedFiles, onFilesReorganized]);

  const handleRemoveFile = useCallback((index: number) => {
    const items = Array.from(organizedFiles);
    items.splice(index, 1);
    setOrganizedFiles(items);
    onRemoveFile(index);
  }, [organizedFiles, onRemoveFile]);

  const sortByType = useCallback(() => {
    const sorted = [...organizedFiles].sort((a, b) => {
      const typeOrder = { pdf: 0, image: 1, archive: 2, other: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
    setOrganizedFiles(sorted);
    onFilesReorganized(sorted.map(item => item.file));
  }, [organizedFiles, onFilesReorganized]);

  const sortByName = useCallback(() => {
    const sorted = [...organizedFiles].sort((a, b) => 
      a.file.name.toLowerCase().localeCompare(b.file.name.toLowerCase())
    );
    setOrganizedFiles(sorted);
    onFilesReorganized(sorted.map(item => item.file));
  }, [organizedFiles, onFilesReorganized]);

  const sortBySize = useCallback(() => {
    const sorted = [...organizedFiles].sort((a, b) => b.file.size - a.file.size);
    setOrganizedFiles(sorted);
    onFilesReorganized(sorted.map(item => item.file));
  }, [organizedFiles, onFilesReorganized]);

  if (organizedFiles.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 text-center">
        <p className="text-slate-400">No files to organize</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-white text-lg font-semibold">File Organization</h3>
            <p className="text-slate-400 text-sm">Drag and drop to reorder files</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={sortByType} size="sm" variant="outline" className="text-xs">
              Sort by Type
            </Button>
            <Button onClick={sortByName} size="sm" variant="outline" className="text-xs">
              Sort by Name
            </Button>
            <Button onClick={sortBySize} size="sm" variant="outline" className="text-xs">
              Sort by Size
            </Button>
            <Button onClick={onClearAll} size="sm" variant="destructive" className="text-xs">
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="file-organizer">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "space-y-2 min-h-[100px]",
                  snapshot.isDraggingOver && "bg-blue-500/10 rounded-lg"
                )}
              >
                {organizedFiles.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600 transition-all",
                          snapshot.isDragging && "shadow-lg scale-105 bg-slate-600/70"
                        )}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-slate-400 hover:text-white cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(item.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {item.file.name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {formatFileSize(item.file.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => moveFile(index, 'up')}
                            disabled={index === 0}
                            size="sm"
                            variant="ghost"
                            className="w-7 h-7 p-0"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => moveFile(index, 'down')}
                            disabled={index === organizedFiles.length - 1}
                            size="sm"
                            variant="ghost"
                            className="w-7 h-7 p-0"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleRemoveFile(index)}
                            size="sm"
                            variant="ghost"
                            className="w-7 h-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};