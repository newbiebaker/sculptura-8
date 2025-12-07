import React, { useEffect, useState } from 'react';

interface ImageLensProps {
  imageUrl: string | null;
  cursorPos: { x: number; y: number };
  isActive: boolean;
}

const ImageLens: React.FC<ImageLensProps> = ({ imageUrl, cursorPos, isActive }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const lensSize = 250; // Increased size slightly for better visibility

  useEffect(() => {
    if (!imageUrl) {
      setImg(null);
      return;
    }
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => setImg(image);
  }, [imageUrl]);

  if (!isActive || !img || !imageUrl) return null;

  // Calculate Mapping
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  // Calculate rendered dimensions of the background image (object-fit: cover)
  const scale = Math.max(screenW / imgW, screenH / imgH);
  const renderW = imgW * scale;
  const renderH = imgH * scale;

  // Calculate offset (centering)
  const offsetX = (screenW - renderW) / 2;
  const offsetY = (screenH - renderH) / 2;

  // Map cursor position (screen) to image position (pixels in the scaled image)
  // lens shows 1:1 pixels of the ORIGINAL image.
  // We need to map cursor X on screen -> X on Original Image.
  
  // screenX = offsetX + (originalX * scale)
  // originalX = (screenX - offsetX) / scale
  const originalX = (cursorPos.x - offsetX) / scale;
  const originalY = (cursorPos.y - offsetY) / scale;

  // Background Position for the lens div
  // The lens background is the NATIVE image (1:1).
  // We want point (originalX, originalY) to be at the center of the lens (radius, radius).
  
  const radius = lensSize / 2;
  const bgPosX = radius - originalX;
  const bgPosY = radius - originalY;

  return (
    <div 
      className="fixed z-[9999] pointer-events-none rounded-full overflow-hidden bg-black shadow-[0_0_0_4px_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.5)] border border-white/50"
      style={{
        width: lensSize,
        height: lensSize,
        left: cursorPos.x + 24, // Slight offset so cursor doesn't cover it
        top: cursorPos.y + 24,
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
        // Default background-size is auto (native 1:1), which is what we want for the "Cut Out" effect
      }}
    >
        {/* Crosshair / Overlay for aiming feel */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,1)]" />
        </div>
    </div>
  );
};

export default ImageLens;