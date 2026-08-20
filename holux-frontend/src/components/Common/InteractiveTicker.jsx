import React, { useRef, useEffect, useState, memo } from 'react';

/**
 * InteractiveTicker: Ultra-smooth auto-scrolling ticker with seamless loop,
 * GPU hardware acceleration, and full mouse/touch drag-and-swipe interaction.
 */
export const InteractiveTicker = memo(function InteractiveTicker({
  phrases = [],
  speed = 0.8, // pixels per frame (~50px/sec at 60fps)
  className = ''
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const singleContentRef = useRef(null);

  const posRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const startXRef = useRef(0);
  const dragStartPosRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);

  useEffect(() => {
    let singleWidth = 0;

    const measureWidth = () => {
      if (singleContentRef.current) {
        singleWidth = singleContentRef.current.offsetWidth || 1000;
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);

    const loop = () => {
      if (!isDraggingRef.current && !isHoveredRef.current) {
        posRef.current -= speed;
      }

      if (singleWidth > 0) {
        // Wrap around seamlessly
        if (posRef.current <= -singleWidth) {
          posRef.current += singleWidth;
        } else if (posRef.current > 0) {
          posRef.current -= singleWidth;
        }
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener('resize', measureWidth);
    };
  }, [speed, phrases]);

  // Mouse Handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    dragStartPosRef.current = posRef.current;
    setIsCursorGrabbing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const currentX = e.pageX;
    const delta = currentX - startXRef.current;
    posRef.current = dragStartPosRef.current + delta;

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
    }
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsCursorGrabbing(false);
    }
  };

  // Touch Handlers (Mobile & Tablets)
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX;
    dragStartPosRef.current = posRef.current;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || !e.touches || e.touches.length === 0) return;
    const currentX = e.touches[0].pageX;
    const delta = currentX - startXRef.current;
    posRef.current = dragStartPosRef.current + delta;

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={() => {
        handleMouseUpOrLeave();
        isHoveredRef.current = false;
      }}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`w-full overflow-hidden bg-black text-[#F2EFE9] py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest font-sans border-b border-black/10 select-none ${
        isCursorGrabbing ? 'cursor-grabbing' : 'cursor-grab'
      } ${className}`}
      title="Hacé click y arrastrá para deslizar"
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap will-change-transform"
        style={{
          width: 'max-content',
          transform: 'translate3d(0, 0, 0)'
        }}
      >
        {/* Track 1 (Original) */}
        <div ref={singleContentRef} className="flex items-center gap-12 sm:gap-16 px-6 shrink-0">
          {phrases.map((phrase, idx) => (
            <span key={`p1-${idx}`} className="inline-block hover:text-white transition-colors">
              {phrase}
            </span>
          ))}
        </div>

        {/* Track 2 (Clone 1 for seamless infinite loop) */}
        <div className="flex items-center gap-12 sm:gap-16 px-6 shrink-0" aria-hidden="true">
          {phrases.map((phrase, idx) => (
            <span key={`p2-${idx}`} className="inline-block hover:text-white transition-colors">
              {phrase}
            </span>
          ))}
        </div>

        {/* Track 3 (Clone 2 for wide displays or fast drag) */}
        <div className="flex items-center gap-12 sm:gap-16 px-6 shrink-0" aria-hidden="true">
          {phrases.map((phrase, idx) => (
            <span key={`p3-${idx}`} className="inline-block hover:text-white transition-colors">
              {phrase}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default InteractiveTicker;
