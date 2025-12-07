import React, { useState, useRef } from 'react';
import { Folder, Project } from '../types';
import ProjectItem from './ProjectItem';
import { Trash2, Eye, EyeOff, Folder as FolderIcon, FolderOpen } from 'lucide-react';

interface FolderItemProps {
  folder: Folder;
  allProjects: Project[];
  allFolders: Folder[];
  onRemoveFolder: (id: string) => void;
  onRemoveProject: (id: string) => void;
  onMoveProject: (projectId: string, folderId: string) => void;
  onNestFolder: (childId: string, parentId: string) => void;
  onUpload: (files: File[], folderId: string) => void;
  onToggleFolderVisibility: (id: string) => void;
  onToggleProjectVisibility: (id: string) => void;
  isEditing: boolean;
  level?: number;
  onReorderFolders?: (dragId: string, hoverId: string) => void;
  draggedItemId?: string | null;
  onSetDragId?: (id: string | null) => void;
  onRenameFolder: (id: string, newName: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ 
  folder, 
  allProjects,
  allFolders,
  onRemoveFolder, 
  onRemoveProject,
  onMoveProject,
  onNestFolder,
  onUpload,
  onToggleFolderVisibility,
  onToggleProjectVisibility,
  isEditing,
  level = 0,
  onReorderFolders,
  draggedItemId,
  onSetDragId,
  onRenameFolder
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Derived state for this specific folder
  const myProjects = allProjects.filter(p => p.folderId === folder.id);
  const mySubFolders = allFolders.filter(f => f.parentId === folder.id);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditing) return; 
    e.preventDefault();
    e.stopPropagation();

    // Reordering Logic
    if (draggedItemId && draggedItemId !== folder.id && onReorderFolders) {
        // Only trigger reorder if we are dragging a folder (check if ID exists in folders list passed?)
        // Assuming draggedItemId refers to a folder for now since we only set it in FolderItem.
        // A simple debounce or check might be good, but React usually handles this okay.
        onReorderFolders(draggedItemId, folder.id);
    }
    
    if (
        e.dataTransfer.types.includes('application/json') || 
        e.dataTransfer.types.includes('Files')
    ) {
      if (!isDragOver) setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onSetDragId) onSetDragId(null);

    // Handle external file drops
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      const validFiles = fileList.filter(file => 
          file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')
      );
      if (validFiles.length > 0) {
          onUpload(validFiles, folder.id);
          setIsExpanded(true); 
      }
      return;
    }

    const jsonString = e.dataTransfer.getData('application/json');
    if (!jsonString) return; 
    try {
      const data = JSON.parse(jsonString);
      // Handle Folder Nesting (moving A into B)
      if (data.folderId) {
          if (data.folderId !== folder.id) {
              onNestFolder(data.folderId, folder.id);
              setIsExpanded(true);
          }
          return;
      }
      // Handle Project Move
      if (data.projectId) {
        onMoveProject(data.projectId, folder.id);
        setIsExpanded(true); 
      }
    } catch (err) {
      console.error('Failed to parse drag data', err);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditing) {
        e.preventDefault();
        return;
    }
    e.stopPropagation();
    
    if (onSetDragId) onSetDragId(folder.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ folderId: folder.id }));
    e.dataTransfer.effectAllowed = 'move';

    // Visual Drag: Clone the element
    const target = e.currentTarget as HTMLElement;
    const clone = target.cloneNode(true) as HTMLElement;
    
    // Style the clone to look good while dragging
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.width = `${target.offsetWidth}px`;
    clone.style.opacity = '0.9';
    clone.style.pointerEvents = 'none'; 
    clone.style.zIndex = '9999';
    
    // Remove the nested children from the clone visual if we want it compact? 
    // The prompt asked for "actual visual drag", implying the whole thing. 
    // But dragging a huge open folder is unwieldy. 
    // Let's assume they want the Folder Header + structure.
    // If it's expanded, the clone will be huge. Standard UX collapses on drag usually, but "actual" implies exact copy.
    // We'll leave it as is (exact copy).
    
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 0, 0);

    setTimeout(() => {
        if (document.body.contains(clone)) {
            document.body.removeChild(clone);
        }
    }, 0);
  };

  const hasContent = myProjects.length > 0 || mySubFolders.length > 0;

  return (
    <div 
      ref={elementRef}
      draggable={isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`mb-2 transition-all duration-200
        ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
        ${draggedItemId === folder.id ? 'opacity-20' : 'opacity-100'} 
      `}
    >
      {/* Folder Header */}
      <div 
        className={`flex items-center justify-between p-3 pl-5 pr-5 rounded-[2.5rem] cursor-pointer transition-all duration-300
            ${isDragOver 
                ? 'bg-current/10 backdrop-blur-md shadow-lg scale-[1.01]' 
                : 'bg-current/5 hover:bg-current/10 backdrop-blur-[0.5px]'
            }
        `}
        onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-3">
          {/* Replaced Chevron with Folder Icon toggle */}
          {isExpanded ? (
               <FolderOpen size={16} strokeWidth={1.5} className="text-current opacity-80" />
          ) : (
               <FolderIcon size={16} strokeWidth={1.5} className="text-current opacity-80" />
          )}
          
          {/* Editable Folder Name */}
          {isEditing ? (
            <input
                type="text"
                value={folder.name}
                onChange={(e) => onRenameFolder(folder.id, e.target.value)}
                onClick={(e) => e.stopPropagation()} // Prevent expand/collapse
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on text click
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="bg-transparent border-none outline-none font-mono text-sm text-current font-medium w-full min-w-[50px] focus:ring-0 p-0 placeholder-current/30"
                spellCheck={false}
            />
          ) : (
            <span className={`font-mono text-sm text-current font-medium transition-all duration-300
                ${!folder.isVisible ? 'blur-[4px] opacity-40 select-none' : ''}
            `}>
                {folder.name}
            </span>
          )}
          
          {isEditing && (
            <span className="text-[10px] text-current opacity-30 font-mono animate-in fade-in">
                {myProjects.length + mySubFolders.length}
            </span>
          )}
        </div>

        {isEditing && (
            <div className="flex items-center gap-2">
                {/* Delete Button */}
                {!folder.isVisible && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFolder(folder.id);
                        }}
                        className="p-1.5 text-current opacity-20 hover:opacity-100 hover:text-red-400 transition-colors animate-in zoom-in duration-200"
                        title="Delete Folder"
                    >
                        <Trash2 size={14} strokeWidth={0.5} absoluteStrokeWidth />
                    </button>
                )}
                
                {/* Visibility Toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFolderVisibility(folder.id);
                    }}
                    className="p-1.5 text-current opacity-20 hover:opacity-100 transition-colors"
                    title={folder.isVisible ? "Unsee Folder" : "See Folder"}
                >
                    {folder.isVisible ? <EyeOff size={14} strokeWidth={0.5} absoluteStrokeWidth /> : <Eye size={14} strokeWidth={0.5} absoluteStrokeWidth /> }
                </button>
            </div>
        )}
      </div>

      {/* Folder Contents */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
          <div className="overflow-hidden">
            <div className={`flex flex-col gap-1 pt-2 ${hasContent ? 'pb-1' : ''}`}>
                <div className="ml-5 pl-4 border-l border-current/10 flex flex-col gap-1">
                    {!hasContent ? (
                        <div className="py-2 px-4 text-[10px] text-current opacity-20 font-mono italic">
                        {isEditing ? "empty folder" : "empty"}
                        </div>
                    ) : (
                        <>
                            {mySubFolders.map(subFolder => (
                                <FolderItem 
                                    key={subFolder.id}
                                    folder={subFolder}
                                    allProjects={allProjects}
                                    allFolders={allFolders}
                                    onRemoveFolder={onRemoveFolder}
                                    onRemoveProject={onRemoveProject}
                                    onMoveProject={onMoveProject}
                                    onNestFolder={onNestFolder}
                                    onUpload={onUpload}
                                    onToggleFolderVisibility={onToggleFolderVisibility}
                                    onToggleProjectVisibility={onToggleProjectVisibility}
                                    isEditing={isEditing}
                                    level={level + 1}
                                    onReorderFolders={onReorderFolders}
                                    draggedItemId={draggedItemId}
                                    onSetDragId={onSetDragId}
                                    onRenameFolder={onRenameFolder}
                                />
                            ))}

                            {myProjects.map(project => (
                                <ProjectItem 
                                    key={project.id} 
                                    project={project} 
                                    onRemove={onRemoveProject}
                                    onToggleVisibility={onToggleProjectVisibility}
                                    isEditing={isEditing}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default FolderItem;