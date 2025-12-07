import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  isEditing: boolean;
  isDragging: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ isEditing, isDragging }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const onMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        
        let interactiveElement = null;

        if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
            // Text inputs handled by system cursor usually, or custom I-beam
            setIsHoveringInteractive(false);
            setTargetRect(null);
            return;
        }

        // Priority 1: Semantic interactive elements
        interactiveElement = target.closest('a, button, [role="button"]');
        
        // Priority 2: CSS cursor pointer
        if (!interactiveElement) {
            const computedStyle = window.getComputedStyle(target);
            if (computedStyle.cursor === 'pointer') {
                interactiveElement = target;
            }
        }

        if (interactiveElement) {
            setIsHoveringInteractive(true);
            setTargetRect(interactiveElement.getBoundingClientRect());
        } else {
            setIsHoveringInteractive(false);
            setTargetRect(null);
        }
    };
    
    // Update rect on scroll to keep it sticking correctly
    const onScroll = () => {
       if (isHoveringInteractive) {
           // We'd need to re-find the element to get updated rect.
           // For simplicity in this lightweight cursor, we might just un-stick on scroll or let mousemove handle it.
           // A simple reset is safer to avoid ghost rects.
           setIsHoveringInteractive(false);
           setTargetRect(null);
       }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseover', onMouseOver);
        window.removeEventListener('scroll', onScroll);
    };
  }, [isHoveringInteractive]);

  // Determine styles
  // If dragging (Logo), use specific style.
  // If hovering button, expand to target rect.
  // Else, invisible/small at mouse pos.

  const style: React.CSSProperties = {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 9999,
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', // Smooth expansion
      willChange: 'width, height, transform, borderRadius',
  };

  if (isDragging) {
       // Dragging Logo style
       style.width = '24px';
       style.height = '24px';
       style.left = mousePos.x;
       style.top = mousePos.y;
       style.transform = 'translate(-50%, -50%)';
       style.borderRadius = '9999px';
       style.backgroundColor = isEditing ? 'rgba(255, 255, 255, 0.8)' : 'rgba(128, 128, 128, 0.8)';
       style.mixBlendMode = 'normal';
  } else if (isHoveringInteractive && targetRect) {
      // Embrace the button
      // We animate from "cursor tip" (previous state was mousePos) to "target rect".
      // Since it's React state, the CSS transition handles the interpolation.
      style.width = `${targetRect.width + 8}px`; // Add slight padding
      style.height = `${targetRect.height + 8}px`;
      style.left = `${targetRect.left - 4}px`;
      style.top = `${targetRect.top - 4}px`;
      style.borderRadius = '12px'; // Standard rounded
      // Try to infer border radius? Hard without deeper DOM read. 12px is safe for most UI here.
      style.transform = 'none';
      style.backgroundColor = 'transparent';
      style.border = '1px solid rgba(255, 255, 255, 0.5)';
      style.mixBlendMode = 'difference';
  } else {
      // Default: Hidden/Collapsed at cursor tip
      style.width = '0px';
      style.height = '0px';
      style.left = mousePos.x;
      style.top = mousePos.y;
      style.transform = 'translate(-50%, -50%)';
      style.borderRadius = '9999px';
      style.backgroundColor = 'transparent';
  }

  return <div ref={cursorRef} style={style} />;
};

export default CustomCursor;