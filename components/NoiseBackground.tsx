import React, { useEffect, useRef, useState } from 'react';

interface NoiseBackgroundProps {
  theme: 'light' | 'dark';
  variance: number;
  red?: number;
  green?: number;
  blue?: number;
  scale?: number;
  blur?: number;
  vignette?: number;
  imageUrl?: string | null;
  className?: string;
}

const NoiseBackground: React.FC<NoiseBackgroundProps> = ({ 
    theme, 
    variance, 
    red: redOverride,
    green: greenOverride,
    blue: blueOverride,
    scale = 1,
    blur = 0,
    vignette = 0,
    imageUrl,
    className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setLoadedImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => setLoadedImage(img);
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Detect Endianness
    const isLittleEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78;

    const render = () => {
       const dpr = window.devicePixelRatio || 1;
       const rect = canvas.getBoundingClientRect();
       const w = rect.width || window.innerWidth;
       const h = rect.height || window.innerHeight;

       // Ensure a minimum resolution for "organic" feel (avoid blockiness unless scaled)
       const safeScale = Math.max(1, scale);
       const canvasWidth = Math.ceil((w * dpr) / safeScale);
       const canvasHeight = Math.ceil((h * dpr) / safeScale);

       if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
           canvas.width = canvasWidth;
           canvas.height = canvasHeight;
       }

       const width = canvas.width;
       const height = canvas.height;
       const cx = width / 2;
       const cy = height / 2;
       const maxDist = Math.sqrt(cx * cx + cy * cy);

       // 1. Image Data Preparation
       let imagePixelData: Uint8ClampedArray | null = null;
       
       if (loadedImage) {
           const tempCanvas = document.createElement('canvas');
           tempCanvas.width = width;
           tempCanvas.height = height;
           const tempCtx = tempCanvas.getContext('2d');
           if (tempCtx) {
               // Object-fit: cover
               const imgAspect = loadedImage.width / loadedImage.height;
               const canvasAspect = width / height;
               let renderW, renderH, offsetX, offsetY;

               if (canvasAspect > imgAspect) {
                   renderW = width;
                   renderH = width / imgAspect;
                   offsetX = 0;
                   offsetY = (height - renderH) / 2;
               } else {
                   renderH = height;
                   renderW = height * imgAspect;
                   offsetX = (width - renderW) / 2;
                   offsetY = 0;
               }
               
               // Use better quality smoothing for base image
               tempCtx.imageSmoothingEnabled = true;
               tempCtx.imageSmoothingQuality = 'high';
               tempCtx.drawImage(loadedImage, offsetX, offsetY, renderW, renderH);
               imagePixelData = tempCtx.getImageData(0, 0, width, height).data;
           }
       }

       const imgData = ctx.createImageData(width, height);
       const buffer32 = new Uint32Array(imgData.data.buffer);
       const len = buffer32.length;

       const defaultBase = theme === 'light' ? 250 : 35;
       const rUser = redOverride !== undefined ? redOverride : defaultBase;
       const gUser = greenOverride !== undefined ? greenOverride : defaultBase;
       const bUser = blueOverride !== undefined ? blueOverride : defaultBase;
       
       const rGain = rUser / 255;
       const gGain = gUser / 255;
       const bGain = bUser / 255;

       const v = variance; 
       
       // Pre-calculate vignette strength to avoid multiplication in loop if 0
       const useVignette = vignette > 0;
       const vigStrength = vignette * 1.5; // boost slightly for visibility

       for (let i = 0; i < len; i++) {
           const x = i % width;
           const y = (i / width) | 0;
           const channel = i % 3; // RGB Stripe

           // Vignette Calculation
           let attenuation = 1.0;
           if (useVignette) {
               const dx = x - cx;
               const dy = y - cy;
               const dist = Math.sqrt(dx*dx + dy*dy);
               attenuation = 1 - (dist / maxDist) * vigStrength;
               if (attenuation < 0) attenuation = 0;
           }

           let intensity = 0;

           if (imagePixelData) {
               // Sample Image Pixel
               const pixelIndex = i * 4;
               let sourceVal = 0;
               if (channel === 0) sourceVal = imagePixelData[pixelIndex];
               else if (channel === 1) sourceVal = imagePixelData[pixelIndex + 1];
               else sourceVal = imagePixelData[pixelIndex + 2];

               // Apply Channel Gain (Filter)
               if (channel === 0) sourceVal *= rGain;
               else if (channel === 1) sourceVal *= gGain;
               else sourceVal *= bGain;

               // Apply Noise
               const noise = (Math.random() - 0.5) * v * 2;
               
               intensity = (sourceVal + noise) * attenuation;

           } else {
               // Standard Noise
               let base = 0;
               if (channel === 0) base = rUser;
               else if (channel === 1) base = gUser;
               else base = bUser;

               const noise = (Math.random() - 0.5) * v * 2; // Bi-directional noise for organic feel
               intensity = (base + noise) * attenuation;
           }

           // Clamp
           intensity = intensity > 255 ? 255 : (intensity < 0 ? 0 : intensity);
           const finalInt = intensity | 0;

           // Write Buffer
           if (isLittleEndian) {
               if (channel === 0) buffer32[i] = 0xFF000000 | finalInt; 
               else if (channel === 1) buffer32[i] = 0xFF000000 | (finalInt << 8);
               else buffer32[i] = 0xFF000000 | (finalInt << 16);
           } else {
               if (channel === 0) buffer32[i] = (finalInt << 24) | 0x000000FF;
               else if (channel === 1) buffer32[i] = (finalInt << 16) | 0x000000FF;
               else buffer32[i] = (finalInt << 8) | 0x000000FF;
           }
       }
       
       ctx.putImageData(imgData, 0, 0);
    };

    let resizeTimeout: number;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(render, 100); 
    };

    window.addEventListener('resize', handleResize);
    render();

    return () => {
        window.removeEventListener('resize', handleResize);
    };
  }, [theme, variance, redOverride, greenOverride, blueOverride, scale, loadedImage, vignette]); 

  const cssClass = className || "fixed inset-0 pointer-events-none z-0 w-full h-full";

  return (
    <canvas 
        ref={canvasRef} 
        className={cssClass}
        style={{ 
            imageRendering: 'pixelated', 
            filter: `blur(${blur}px)`
        }}
    />
  );
};

export default NoiseBackground;