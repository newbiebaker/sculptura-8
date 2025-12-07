import React, { useCallback, useRef, useState } from 'react';
import { Upload, XCircle } from 'lucide-react';
import { DragStatus } from '../types';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, className = '' }) => {
  const [status, setStatus] = useState<DragStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== 'dragging') setStatus('dragging');
  }, [status]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent flickering: Only set to idle if moving OUT of the container,
    // not into a child element.
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
    }

    setStatus('idle');
  }, []);

  const validateAndProcessFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      const isHtml = file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm');
      const isImage = file.type.startsWith('image/');
      
      if (isHtml || isImage) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name} is not a supported file.`);
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors[0]); // Just show first error for minimalism
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage(null);
      }, 3000);
    } else {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1000);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    validateAndProcessFiles(e.dataTransfer.files);
  }, [onFilesSelected]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndProcessFiles(e.target.files);
    // Reset value so same file can be selected again if deleted
    e.target.value = '';
  };

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileDialog}
      className={`
        relative group cursor-pointer
        flex flex-col items-center justify-center 
        w-full h-32 md:h-40
        rounded-[2.5rem]
        transition-all duration-500 ease-out
        bg-white text-[#808080]
        ${status === 'dragging' ? 'scale-[1.01] opacity-100' : 'opacity-90 hover:opacity-100'}
        ${status === 'error' ? 'bg-red-50' : ''}
        ${status === 'success' ? 'bg-green-50' : ''}
        ${className}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".html,.htm,.png,.jpg,.jpeg,.gif,.webp"
        multiple
      />

      <div className="flex flex-col items-center gap-3 text-current opacity-40 group-hover:opacity-80 transition-colors">
        {status === 'error' ? (
          <XCircle size={24} strokeWidth={0.5} className="text-red-400" absoluteStrokeWidth />
        ) : (
          <Upload 
            size={24} 
            strokeWidth={0.5}
            absoluteStrokeWidth
            className={`transition-transform duration-300 ${status === 'dragging' ? '-translate-y-1' : ''}`} 
          />
        )}
        
        <p className="text-sm font-mono tracking-tight opacity-70">
            {status === 'dragging' && "Drop files here"}
            {status === 'idle' && "Drag html or images here"}
            {status === 'error' && errorMessage}
            {status === 'success' && "Uploaded"}
        </p>
      </div>
    </div>
  );
};

export default UploadZone;