import React, { useEffect, useRef, useState } from 'react';

interface HeaderLensProps {
  title: string;
  cursorPos: { x: number; y: number };
  isHoveringHeader: boolean;
  headerRect: DOMRect | null;
}

const HeaderLens: React.FC<HeaderLensProps> = ({ title, cursorPos, isHoveringHeader, headerRect }) => {
  if (!isHoveringHeader || !headerRect) return null;

  const lensSize = 140;
  const radius = lensSize / 2;

  // The lens is displayed next to the cursor (offset)
  const lensX = cursorPos.x + 20;
  const lensY = cursorPos.y; // Centered vertically on cursor? or just offset X

  // We want to simulate a "cutout" or "window" into the header.
  // The content inside the lens should be the header text.
  // The position of the inner text relative to the lens container needs to match
  // the position of the real header relative to the cursor (if the lens were AT the cursor).
  
  // Wait, if it's a "cut out ... next to the cursor":
  // This implies the lens shows what is *under* the cursor, but displayed *offset* from the cursor.
  // So we take the viewport coordinates of the cursor: (cx, cy)
  // We want to show the content at (cx, cy) inside the lens.
  // Since the lens is at (lx, ly), we must shift the content by (lx - cx, ly - cy) so that
  // the point (cx, cy) in the content aligns with the center of the lens?
  // No, simpler:
  // Inside the lens (which is width W, height H), we want the center (W/2, H/2) to correspond to the cursor position (cx, cy) on the page.
  // So Content Left = (W/2) - cx
  // Content Top = (H/2) - cy
  // However, the Content itself (the header) has a specific position on page: (headerRect.left, headerRect.top).
  // So we render the header inside the lens at:
  // Left = (W/2) - cx + headerRect.left
  // Top = (H/2) - cy + headerRect.top

  const innerLeft = radius - cursorPos.x + headerRect.left;
  const innerTop = radius - cursorPos.y + headerRect.top;

  return (
    <div 
        className="fixed z-[9999] pointer-events-none rounded-full overflow-hidden bg-white border border-black/10 shadow-2xl"
        style={{
            width: lensSize,
            height: lensSize,
            left: lensX,
            top: lensY - radius, // Center vertically on cursor
        }}
    >
        {/* Inner Container to hold the cloned text */}
        <div 
            className="absolute whitespace-nowrap"
            style={{
                left: innerLeft,
                top: innerTop,
                width: headerRect.width,
                height: headerRect.height,
            }}
        >
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black select-none">
                {title}
            </h1>
        </div>
    </div>
  );
};

export default HeaderLens;