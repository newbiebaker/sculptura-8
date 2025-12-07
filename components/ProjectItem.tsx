import React from 'react';
import { Project } from '../types';
import { Trash2, Eye, EyeOff, FileText, Image as ImageIcon } from 'lucide-react';

interface ProjectItemProps {
  project: Project;
  onRemove: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onHover?: (url: string | null) => void;
  isEditing: boolean;
}

const ProjectItem: React.FC<ProjectItemProps> = ({ project, onRemove, onToggleVisibility, onHover, isEditing }) => {
  const isImage = project.name.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const handleMouseEnter = () => {
    if (isImage && onHover) {
      onHover(project.url);
    }
  };

  const handleMouseLeave = () => {
    if (isImage && onHover) {
      onHover(null);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditing) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify({ projectId: project.id }));
    e.dataTransfer.effectAllowed = 'move';

    // Create custom ghost element
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.padding = '8px 16px';
    ghost.style.borderRadius = '8px';
    ghost.style.backgroundColor = 'white';
    ghost.style.color = '#808080';
    ghost.style.fontFamily = '"JetBrains Mono", monospace';
    ghost.style.fontSize = '12px';
    ghost.style.fontWeight = '500';
    ghost.style.whiteSpace = 'nowrap';
    ghost.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.display = 'flex';
    ghost.style.alignItems = 'center';
    ghost.style.gap = '8px';
    ghost.innerHTML = `<span>${isImage ? '🖼️' : '📄'}</span> <span>${project.name}</span>`;
    
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 15);
    
    setTimeout(() => {
        if (document.body.contains(ghost)) {
            document.body.removeChild(ghost);
        }
    }, 0);
  };

  return (
    <div 
      draggable={isEditing}
      onDragStart={handleDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex items-center justify-between py-3 px-4 mb-2 transition-all duration-200 rounded-lg bg-current/5
        ${isEditing ? 'cursor-grab active:cursor-grabbing hover:bg-current/10' : 'cursor-default'}
        ${!project.isVisible ? 'opacity-40 blur-[0.3px]' : ''}
        ${isImage ? 'hover:bg-current/15' : ''} 
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isImage ? (
             <ImageIcon size={16} strokeWidth={1.5} className="flex-shrink-0 text-current opacity-60" />
        ) : (
             <FileText size={16} strokeWidth={1.5} className="flex-shrink-0 text-current opacity-60" />
        )}
       
        <div className="flex flex-col min-w-0">
          <a 
            href={project.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`font-mono text-sm truncate hover:underline underline-offset-4 decoration-current/50 decoration-1 text-current ${!project.isVisible ? 'line-through decoration-current/30' : ''}`}
          >
            {project.name}
          </a>
          {isEditing && (
            <span className="text-[10px] text-current opacity-50 font-mono mt-0.5 animate-in fade-in">
                {formatSize(project.size)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing && onToggleVisibility && (
            <>
                {/* Delete Button */}
                {!project.isVisible && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(project.id);
                        }}
                        className="p-1.5 text-current opacity-40 hover:opacity-100 hover:text-red-400 transition-all animate-in zoom-in duration-200"
                        title="Delete Permanently"
                    >
                        <Trash2 size={14} strokeWidth={0.5} absoluteStrokeWidth />
                    </button>
                )}

                {/* Visibility Toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(project.id);
                    }}
                    className="p-1.5 text-current opacity-40 hover:opacity-100 transition-all"
                    title={project.isVisible ? "Unsee" : "See"}
                >
                    {project.isVisible ? (
                        <EyeOff size={14} strokeWidth={0.5} absoluteStrokeWidth />
                    ) : (
                        <Eye size={14} strokeWidth={0.5} absoluteStrokeWidth />
                    )}
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default ProjectItem;