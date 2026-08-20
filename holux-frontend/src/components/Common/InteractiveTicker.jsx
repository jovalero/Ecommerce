import React, { useRef, useEffect, useState, memo } from 'react';

/**
 * InteractiveTicker: Ultra-smooth ticker with seamless infinite loop,
 * GPU hardware acceleration, and lag-free mouse/touch drag-and-swipe interaction.
 */
export const InteractiveTicker = memo(function InteractiveTicker({
  phrases = [],
  speed = 45, // pixels per second
  className = ''
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const singleContentRef = useRef(null);

  const posRef = useRef(0);
  const singleWidthRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const startXRef = useRef(0);
  const dragStartPosRef = useRef(0);
  const lastTimeRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      if (singleContentRef.current) {
        singleWidthRef.current = singleContentRef.current.offsetWidth || 1000;
      }
    };

    updateWidth();
    if (document.fonts) {
      document.fonts.ready.then(updateWidth);
    }
    window.addEventListener('resize', updateWidth);

    const loop = (currentTime) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }
      const deltaSeconds = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      const singleWidth = singleWidthRef.current;

      if (!isDraggingRef.current && !isHoveredRef.current) {
        posRef.current -= speed * deltaSeconds;
      }

      if (singleWidth > 0) {
        // Continuous wrap-around for infinite loop in both directions
        while (posRef.current <= -singleWidth) {
          posRef.current += singleWidth;
        }
        while (posRef.current > 0) {
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
      window.removeEventListener('resize', updateWidth);
    };
  }, [speed, phrases]);

  // Pointer Events (Unified Mouse + Touch with Pointer Capture)
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    dragStartPosRef.current = posRef.current;
    setIsCursorGrabbing(true);

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    let newPos = dragStartPosRef.current + delta;
    const singleWidth = singleWidthRef.current;

    if (singleWidth > 0) {
      while (newPos <= -singleWidth) {
        newPos += singleWidth;
      }
      while (newPos > 0) {
        newPos -= singleWidth;
      }
    }

    posRef.current = newPos;

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsCursorGrabbing(false);
      lastTimeRef.current = performance.now();

      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className={`w-full overflow-hidden bg-black text-[#F2EFE9] py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest font-sans border-b border-black/10 select-none touch-pan-y ${
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
