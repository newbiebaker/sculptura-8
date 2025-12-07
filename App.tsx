import React, { useState, useEffect, useRef } from 'react';
import { Project, Folder } from './types';
import ProjectItem from './components/ProjectItem';
import FolderItem from './components/FolderItem';
import UploadZone from './components/UploadZone';
import NoiseBackground from './components/NoiseBackground';
import HeaderLens from './components/HeaderLens';
import CustomCursor from './components/CustomCursor';
import { FolderPlus, KeyRound, Wrench, Eye, EyeClosed, Activity, Grid2x2, Folder as FolderIcon, Droplets, Sun, ShieldCheck, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  
  const [title, setTitle] = useState("index.html");
  
  // Background Customization State
  const [noiseVariance, setNoiseVariance] = useState(15);
  const [noiseScale, setNoiseScale] = useState(2);
  const [noiseBlur, setNoiseBlur] = useState(0); 
  const [noiseVignette, setNoiseVignette] = useState(0);
  
  // RGB Channels
  const [noiseRed, setNoiseRed] = useState(240);
  const [noiseGreen, setNoiseGreen] = useState(240);
  const [noiseBlue, setNoiseBlue] = useState(240);
  
  // Master Brightness (Offset)
  const [masterBrightness, setMasterBrightness] = useState(0);

  // Safety Spectrum (0-100)
  const [safetyLevel, setSafetyLevel] = useState(0);
  
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);

  // Hover state for Image Projects
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  // Mouse Tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);
  const headerRef = useRef<HTMLInputElement>(null);
  const [headerRect, setHeaderRect] = useState<DOMRect | null>(null);

  // Interaction States
  const [logoMode, setLogoMode] = useState<'eye' | 'hand'>('eye');
  const isEditing = logoMode === 'hand';

  const [dragX, setDragX] = useState(0);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  
  const [showPatternLock, setShowPatternLock] = useState(false);
  const [patternSequence, setPatternSequence] = useState<number[]>([]);
  
  const logoRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startDragXRef = useRef(0);

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Drag Reordering State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Track global mouse movement for Lens and Preview
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update header rect for lens calculation
  useEffect(() => {
      if (headerRef.current) {
          setHeaderRect(headerRef.current.getBoundingClientRect());
      }
  }, [title, isEditing]); // Update when title or mode changes

  // Manage Body Theme Colors based on Safety Level
  useEffect(() => {
    const body = document.body;
    
    body.classList.remove(
        'bg-[#808080]', 'text-white', 'selection:bg-white', 'selection:text-[#808080]',
        'bg-white', 'text-[#808080]', 'selection:bg-[#808080]', 'selection:text-white',
        'bg-[#1a1a1a]', 'text-black', 'selection:bg-black', 'selection:text-white'
    );

    // If Safety is high (> 50), enforce strict high contrast classes for text
    const isSafeMode = safetyLevel > 50;

    if (logoMode === 'eye') {
        // View Mode
        if (isSafeMode) {
             body.classList.add('bg-white', 'text-black', 'selection:bg-black', 'selection:text-white');
        } else {
             body.classList.add('bg-white', 'text-[#808080]', 'selection:bg-[#808080]', 'selection:text-white');
        }
    } else {
        // Edit Mode
        if (isSafeMode) {
             body.classList.add('bg-[#1a1a1a]', 'text-white', 'selection:bg-white', 'selection:text-black');
        } else {
             body.classList.add('bg-[#808080]', 'text-white', 'selection:bg-white', 'selection:text-[#808080]');
        }
    }
  }, [logoMode, safetyLevel]);

  useEffect(() => {
    if (isCreatingFolder) {
        folderInputRef.current?.focus();
    }
  }, [isCreatingFolder]);

  // Global pointer events for dragging
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingLogo) return;
        const currentX = e.clientX;
        const diff = currentX - startXRef.current;
        const maxDrag = isEditing ? 320 : 160;
        setDragX(Math.max(0, Math.min(startDragXRef.current + diff, maxDrag)));
    };

    const handlePointerUp = () => {
        if (isDraggingLogo) {
            setIsDraggingLogo(false);
            if (dragX < 10) {
                 setDragX(0);
                 if (isEditing) {
                     setLogoMode('eye');
                 }
            }
        }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingLogo, isEditing, dragX]);

  const processUploadedFiles = (files: File[], folderId: string | null) => {
    const newProjects: Project[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      uploadedAt: new Date(),
      folderId: folderId,
      isVisible: true
    }));
    setProjects(prev => [...newProjects, ...prev]);
  };

  const handleFilesSelected = (files: File[]) => {
    processUploadedFiles(files, null);
  };

  const handleFolderUpload = (files: File[], folderId: string) => {
    processUploadedFiles(files, folderId);
  };

  const confirmFolderCreation = () => {
      const name = folderInputRef.current?.value.trim();
      if (name) {
          const newFolder: Folder = {
              id: Math.random().toString(36).substring(7),
              name: name,
              createdAt: new Date(),
              isVisible: true,
              parentId: null
          };
          setFolders(prev => [newFolder, ...prev]);
      }
      setIsCreatingFolder(false);
  };

  const handleCreateFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') confirmFolderCreation();
    else if (e.key === 'Escape') {
        if (folderInputRef.current) folderInputRef.current.value = '';
        setIsCreatingFolder(false);
    }
  };

  const removeProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    if (confirm(`Are you sure you want to delete ${project.name}?`)) {
        URL.revokeObjectURL(project.url);
        setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const removeFolder = (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;
    if (confirm(`Are you sure you want to delete ${folder.name}?`)) {
        const folderProjects = projects.filter(p => p.folderId === id);
        folderProjects.forEach(p => URL.revokeObjectURL(p.url));
        
        const idsToDelete = new Set<string>([id]);
        let queue = [id];
        while(queue.length > 0) {
            const currentId = queue.shift()!;
            const children = folders.filter(f => f.parentId === currentId);
            children.forEach(c => {
                idsToDelete.add(c.id);
                queue.push(c.id);
            });
        }
        setProjects(prev => prev.filter(p => !p.folderId || !idsToDelete.has(p.folderId)));
        setFolders(prev => prev.filter(f => !idsToDelete.has(f.id)));
    }
  };

  const renameFolder = (id: string, newName: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const toggleProjectVisibility = (id: string) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, isVisible: !p.isVisible } : p));
  };

  const toggleFolderVisibility = (id: string) => {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, isVisible: !f.isVisible } : f));
  };

  const moveProject = (projectId: string, folderId: string | null) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, folderId } : p));
  };

  const reorderFolders = (dragId: string, hoverId: string) => {
    setFolders(prev => {
        const fromIndex = prev.findIndex(f => f.id === dragId);
        const toIndex = prev.findIndex(f => f.id === hoverId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
        
        const newFolders = [...prev];
        const [moved] = newFolders.splice(fromIndex, 1);
        newFolders.splice(toIndex, 0, moved);
        return newFolders;
    });
  };

  const nestFolder = (childId: string, parentId: string | null) => {
      if (childId === parentId) return;
      let currentCheckId = parentId;
      while (currentCheckId) {
          if (currentCheckId === childId) {
              console.warn("Circular dependency detected");
              return;
          }
          const parent = folders.find(f => f.id === currentCheckId);
          currentCheckId = parent?.parentId || null;
      }
      setFolders(prev => prev.map(f => f.id === childId ? { ...f, parentId } : f));
  };

  const handleLogoMouseDown = (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDraggingLogo(true);
      startXRef.current = e.clientX;
      startDragXRef.current = dragX;
  };

  const handleKeyClick = () => {
      setShowPatternLock(true);
      setPatternSequence([]);
      setIsDraggingLogo(false);
  };

  const handleNewGroupClick = () => {
      setIsCreatingFolder(true);
  }

  const handleDotClick = (index: number) => {
      if (patternSequence.length >= 4) return;
      const newSequence = [...patternSequence, index];
      setPatternSequence(newSequence);
      if (newSequence.length === 4) {
          const targetSequence = [1, 1, 8, 2];
          const isMatch = newSequence.every((val, i) => val === targetSequence[i]);
          setTimeout(() => {
             if (isMatch) setLogoMode(logoMode === 'eye' ? 'hand' : 'eye');
             setShowPatternLock(false);
             setPatternSequence([]);
          }, 300);
      }
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) return;
    if (e.dataTransfer.types.includes('application/json') || e.dataTransfer.types.includes('Files')) {
        if (!isRootDragOver) setIsRootDragOver(true);
        e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsRootDragOver(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRootDragOver(false);
    if (!isEditing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      const validFiles = fileList.filter(file => 
          file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type.startsWith('image/')
      );
      if (validFiles.length > 0) processUploadedFiles(validFiles, null);
      return;
    }

    const jsonString = e.dataTransfer.getData('application/json');
    if (!jsonString) return;
    try {
      const data = JSON.parse(jsonString);
      if (data.folderId) nestFolder(data.folderId, null);
      if (data.projectId) moveProject(data.projectId, null);
    } catch (err) {
      console.error(err);
    }
    setDraggedItemId(null);
  };

  useEffect(() => {
    return () => {
      projects.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, []);

  const displayProjects = isEditing ? projects : projects.filter(p => p.isVisible);
  const displayFolders = isEditing ? folders : folders.filter(f => f.isVisible);
  
  const rootProjects = displayProjects.filter(p => !p.folderId);
  const rootFolders = displayFolders.filter(f => !f.parentId || !displayFolders.some(parent => parent.id === f.parentId));

  // --- Safe Spectrum Calculation ---
  const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

  const finalVariance = lerp(noiseVariance, 4, safetyLevel / 100);
  
  const calculateFinalColor = (userVal: number) => {
      const base = userVal + masterBrightness;
      const clampedUser = Math.min(255, Math.max(0, base));
      let targetSafe = 255; 
      if (isEditing) targetSafe = 40; 
      let source = clampedUser;
      if (isEditing) source = 255 - clampedUser;
      return lerp(source, targetSafe, safetyLevel / 100);
  };

  // Determine text color for the preview bubble (simulating View mode)
  const viewModeTextColor = safetyLevel > 50 ? 'text-black' : 'text-[#808080]';

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 relative transition-colors duration-500">
      
      <CustomCursor isEditing={isEditing} isDragging={isDraggingLogo} />

      {/* Main Background */}
      <NoiseBackground 
        theme={isEditing ? 'dark' : 'light'} 
        variance={finalVariance} 
        scale={noiseScale} 
        blur={noiseBlur}
        vignette={noiseVignette}
        red={calculateFinalColor(noiseRed)}
        green={calculateFinalColor(noiseGreen)}
        blue={calculateFinalColor(noiseBlue)}
        imageUrl={hoveredImage}
      />

      {/* Header Lens Popup (Visible when hovering header in any mode) */}
      <HeaderLens 
        title={title}
        cursorPos={mousePos}
        isHoveringHeader={isHoveringHeader}
        headerRect={headerRect}
      />
      
      {/* Softening Overlay */}
      <div 
        className={`fixed inset-0 pointer-events-none z-0 transition-all duration-500 ${isEditing ? 'bg-[#808080]/10' : 'bg-white/10'}`}
      />

      {/* Dynamic Cursor Popup Preview (When Adjusting Sliders) */}
      {isEditing && isHoveringSlider && (
        <div 
            className="fixed z-50 rounded-full overflow-hidden shadow-2xl pointer-events-none animate-in fade-in duration-200"
            style={{
                width: '180px',
                height: '180px',
                left: mousePos.x,
                top: mousePos.y - 120, // Position ABOVE cursor
                transform: 'translateX(-50%)'
            }}
        >
            <NoiseBackground 
                theme="light" 
                variance={finalVariance} 
                red={calculateFinalColor(noiseRed)} 
                green={calculateFinalColor(noiseGreen)}
                blue={calculateFinalColor(noiseBlue)}
                scale={noiseScale}
                blur={noiseBlur}
                vignette={noiseVignette}
                className="absolute inset-0 w-full h-full" 
            />
            
            {/* 1:1 Scale Header Text Preview - Centered in bubble */}
             <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                 <h1 className={`text-4xl md:text-5xl font-light tracking-tight select-none whitespace-nowrap ${viewModeTextColor}`}>
                     {title}
                 </h1>
             </div>
        </div>
      )}

      {/* Pattern Lock */}
      {showPatternLock && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
             <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: '38.2%' }}>
                 <div className="grid grid-cols-3 gap-8 p-8">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dotIndex) => {
                        const clickCount = patternSequence.filter(i => i === dotIndex).length;
                        const scale = 1 + (clickCount * 0.5);
                        const isActive = clickCount > 0;
                        return (
                            <button
                                key={dotIndex}
                                onClick={() => handleDotClick(dotIndex)}
                                style={{ transform: `scale(${scale})` }}
                                className={`w-4 h-4 rounded-full transition-all duration-200 ${isActive ? 'bg-white opacity-100' : 'bg-white opacity-20 hover:opacity-40'} cursor-pointer`}
                            />
                        );
                    })}
                 </div>
             </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-2xl mt-16 md:mt-24 flex flex-col items-start gap-6 z-10 shrink-0 relative">
        {isEditing ? (
            <input 
                ref={headerRef as any}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onMouseEnter={() => setIsHoveringHeader(true)}
                onMouseLeave={() => setIsHoveringHeader(false)}
                className="text-4xl md:text-5xl font-light tracking-tight text-current bg-transparent border-none outline-none placeholder-current/30 w-full"
                placeholder="Site Title"
            />
        ) : (
            <h1 
                ref={headerRef as any}
                onMouseEnter={() => setIsHoveringHeader(true)}
                onMouseLeave={() => setIsHoveringHeader(false)}
                className="text-4xl md:text-5xl font-light tracking-tight text-current select-none cursor-default"
            >
                {title}
            </h1>
        )}

        <div className="flex items-center justify-between w-full flex-wrap gap-y-4">
            <div className="relative w-8 h-8 flex-shrink-0">
                <button 
                    onClick={handleKeyClick}
                    disabled={dragX < 20}
                    className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center bg-current/10 rounded-full text-current opacity-0 transition-opacity z-0 hover:bg-current/20 cursor-pointer"
                    style={{ opacity: Math.max(0, Math.min(dragX / 30, 0.8)), pointerEvents: dragX > 20 ? 'auto' : 'none' }}
                >
                    <KeyRound size={14} strokeWidth={0.5} absoluteStrokeWidth />
                </button>

                {isEditing && (
                <button 
                    onClick={handleNewGroupClick}
                    disabled={dragX < 60}
                    className="absolute top-0 w-8 h-8 flex items-center justify-center bg-current/10 rounded-full text-current opacity-0 transition-all z-0 hover:bg-current/20 cursor-pointer"
                    style={{ left: '46px', opacity: Math.max(0, Math.min((dragX - 40) / 30, 0.8)), pointerEvents: dragX > 60 ? 'auto' : 'none' }}
                >
                    <FolderPlus size={14} strokeWidth={0.5} absoluteStrokeWidth />
                </button>
                )}

                <div 
                    ref={logoRef}
                    onPointerDown={handleLogoMouseDown}
                    onMouseEnter={() => setIsHoveringLogo(true)}
                    onMouseLeave={() => setIsHoveringLogo(false)}
                    className="absolute inset-0 z-20 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#808080] shadow-lg shadow-black/10 cursor-grab active:cursor-grabbing touch-none overflow-hidden"
                    style={{
                        transform: `translateX(${dragX}px)`,
                        transition: isDraggingLogo ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                >
                    {logoMode === 'eye' ? (
                        isHoveringLogo ? <EyeClosed size={18} strokeWidth={0.5} absoluteStrokeWidth /> : <Eye size={18} strokeWidth={0.5} absoluteStrokeWidth />
                    ) : (
                        <Wrench size={16} strokeWidth={0.5} absoluteStrokeWidth />
                    )}
                </div>

                {isEditing && (
                    <div 
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-4 whitespace-nowrap text-xs font-mono text-current opacity-40 select-none animate-in fade-in duration-300 slide-in-from-left-2"
                        style={{
                            transform: `translateX(${dragX}px)`,
                            transition: isDraggingLogo ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                    >
                        {folders.length} • {projects.length}
                    </div>
                )}
            </div>
        </div>

        {/* Customization Sliders */}
        {isEditing && (
            <div 
                className="w-full flex flex-col gap-6 mt-4 p-6 bg-current/5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500"
                onMouseEnter={() => setIsHoveringSlider(true)}
                onMouseLeave={() => setIsHoveringSlider(false)}
            >
                {/* Sliders content (Same as before) */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 w-full">
                    {/* ... Texture Sliders ... */}
                    <div className="flex items-center gap-3 flex-1 min-w-[120px]" title="Noise Variance">
                        <Activity size={16} strokeWidth={1} className="text-current opacity-60" />
                        <input 
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={noiseVariance}
                            onChange={(e) => setNoiseVariance(parseInt(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                     <div className="flex items-center gap-3 flex-1 min-w-[120px]" title="Pixel Scale">
                        <Grid2x2 size={16} strokeWidth={1} className="text-current opacity-60" />
                        <input 
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={noiseScale}
                            onChange={(e) => setNoiseScale(parseFloat(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                     <div className="flex items-center gap-3 flex-1 min-w-[120px]" title="Blur Radius">
                        <Droplets size={16} strokeWidth={1} className="text-current opacity-60" />
                        <input 
                            type="range"
                            min="0"
                            max="20"
                            step="0.5"
                            value={noiseBlur}
                            onChange={(e) => setNoiseBlur(parseFloat(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                     <div className="flex items-center gap-3 flex-1 min-w-[120px]" title="Vignette Strength">
                        <Zap size={16} strokeWidth={1} className="text-current opacity-60" />
                        <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={noiseVignette}
                            onChange={(e) => setNoiseVignette(parseFloat(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                </div>

                {/* Row 2: Color */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 w-full border-t border-current/5 pt-4">
                     <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                        <div className="w-3 h-3 rounded-full bg-red-400 opacity-60" />
                        <input 
                            type="range"
                            min="0"
                            max="255"
                            step="1"
                            value={noiseRed}
                            onChange={(e) => setNoiseRed(parseInt(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                     <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                        <div className="w-3 h-3 rounded-full bg-green-400 opacity-60" />
                        <input 
                            type="range"
                            min="0"
                            max="255"
                            step="1"
                            value={noiseGreen}
                            onChange={(e) => setNoiseGreen(parseInt(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                     <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                        <div className="w-3 h-3 rounded-full bg-blue-400 opacity-60" />
                        <input 
                            type="range"
                            min="0"
                            max="255"
                            step="1"
                            value={noiseBlue}
                            onChange={(e) => setNoiseBlue(parseInt(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>
                </div>
                
                {/* Row 3: Brightness & Safety */}
                <div className="flex flex-wrap items-center justify-between gap-6 w-full border-t border-current/5 pt-4">
                     <div className="flex items-center gap-3 flex-[2] min-w-[200px]" title="Master Brightness Offset">
                        <Sun size={16} strokeWidth={1} className="text-current opacity-60" />
                        <input 
                            type="range"
                            min="-100"
                            max="100"
                            step="1"
                            value={masterBrightness}
                            onChange={(e) => setMasterBrightness(parseInt(e.target.value))}
                            className="w-full h-1 bg-current/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 flex-[2] min-w-[200px]" title="Spectrum of Safety: 0% = Custom/Raw, 100% = High Contrast/Safe">
                         <ShieldCheck 
                            size={16} 
                            strokeWidth={1} 
                            className={`transition-colors duration-300 ${safetyLevel > 50 ? 'text-green-500' : 'text-current opacity-60'}`} 
                         />
                         <input 
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={safetyLevel}
                            onChange={(e) => setSafetyLevel(parseInt(e.target.value))}
                            className={`w-full h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all
                                ${safetyLevel > 50 
                                    ? 'bg-green-500/20 [&::-webkit-slider-thumb]:bg-green-500' 
                                    : 'bg-current/20 [&::-webkit-slider-thumb]:bg-white'}
                            `}
                        />
                    </div>
                </div>
            </div>
        )}

        <div className={`w-full transition-all duration-500 ease-in-out overflow-hidden ${isEditing ? 'max-h-60 opacity-100 my-8' : 'max-h-0 opacity-0 my-0'}`}>
            <UploadZone onFilesSelected={handleFilesSelected} />
        </div>
      </div>

      <div className="flex-grow" />

      {/* File System */}
      <div className="w-full max-w-2xl mb-12 flex flex-col justify-end relative z-10">
        {displayProjects.length === 0 && displayFolders.length === 0 && !isCreatingFolder ? (
            <div className="py-12 text-center opacity-20 font-mono text-xs text-current">
               (directory is empty)
            </div>
        ) : (
            <div className="flex flex-col gap-2">
               {isCreatingFolder && (
                 <div className="mb-2 rounded-lg bg-current/5 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <FolderIcon size={16} strokeWidth={1.5} className="text-current opacity-80" absoluteStrokeWidth />
                    <input
                        ref={folderInputRef}
                        type="text"
                        className="bg-transparent border-none outline-none text-current font-mono text-sm w-full placeholder-current/30 focus:ring-0 p-0"
                        placeholder="Folder name"
                        onKeyDown={handleCreateFolderKeyDown}
                        onBlur={confirmFolderCreation}
                        autoFocus
                    />
                 </div>
               )}

               {rootFolders.map(folder => (
                 <FolderItem 
                    key={folder.id}
                    folder={folder}
                    allProjects={displayProjects}
                    allFolders={displayFolders}
                    onRemoveFolder={removeFolder}
                    onRemoveProject={removeProject}
                    onMoveProject={moveProject}
                    onNestFolder={nestFolder}
                    onUpload={handleFolderUpload}
                    onToggleFolderVisibility={toggleFolderVisibility}
                    onToggleProjectVisibility={toggleProjectVisibility}
                    isEditing={isEditing}
                    onReorderFolders={reorderFolders}
                    draggedItemId={draggedItemId}
                    onSetDragId={setDraggedItemId}
                    onRenameFolder={renameFolder}
                 />
               ))}

               <div 
                 onDragOver={handleRootDragOver}
                 onDragLeave={handleRootDragLeave}
                 onDrop={handleRootDrop}
                 className={`flex flex-col min-h-[10px] transition-all duration-200 rounded-lg ${isRootDragOver ? 'bg-current/5 ring-1 ring-current/50 scale-[1.005]' : ''}`}
               >
                   {rootProjects.length > 0 && (
                       rootProjects.map(project => (
                        <ProjectItem 
                            key={project.id} 
                            project={project} 
                            onRemove={removeProject}
                            onToggleVisibility={toggleProjectVisibility}
                            onHover={setHoveredImage} 
                            isEditing={isEditing}
                        />
                        ))
                   )}
               </div>
            </div>
          )}
      </div>

    </div>
  );
};

export default App;