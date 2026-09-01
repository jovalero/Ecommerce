import React, { useState, useEffect, useRef, memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { initialStoreData } from '../../config/initialStoreData';

const DEFAULT_SLIDES = initialStoreData?.hero_slides || [
  {
    span: "FRAGANCIAS EXCLUSIVAS Y DE AUTOR",
    title: "PERFUMES DE LUJO",
    highlight: "100% ORIGINALES",
    desc: "Descubrí nuestra exclusiva selección de perfumería internacional importada de primeras marcas para hombre y mujer.",
    cta: "VER PERFUMERÍA",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80"
  }
];

export const HeroSlider = memo(function HeroSlider({
  slides = DEFAULT_SLIDES,
  autoPlayInterval = 6000
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isHoveredRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Preload and decode all slide images upfront to eliminate image decode jank
  useEffect(() => {
    slides.forEach((slide) => {
      if (slide.image) {
        const img = new Image();
        img.src = slide.image;
        if (img.decode) {
          img.decode().catch(() => {});
        }
      }
      if (slide.mobileImage) {
        const mImg = new Image();
        mImg.src = slide.mobileImage;
        if (mImg.decode) {
          mImg.decode().catch(() => {});
        }
      }
    });
  }, [slides]);

  // Auto-play timer isolated inside this component (Zero impact on parent App re-renders)
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const handlePrev = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  // Touch Swipe Handlers (No state updates on move to keep 60/120fps)
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="group relative overflow-hidden bg-black text-[#F2EFE9] h-[550px] sm:h-[650px] md:h-[calc(100vh-140px)] md:min-h-[650px] flex items-center border-b border-[#3C6E71]/15 select-none cursor-default"
    >
      {/* Slide images with smooth GPU-accelerated crossfade transitions */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentSlide;
        const hasText = Boolean(
          (slide.title && slide.title.trim()) ||
          (slide.span && slide.span.trim()) ||
          (slide.highlight && slide.highlight.trim()) ||
          (slide.desc && slide.desc.trim()) ||
          (slide.cta && slide.cta.trim())
        );

        const hasOnlyCta = Boolean(
          slide.cta && slide.cta.trim() &&
          (!slide.title || !slide.title.trim()) &&
          (!slide.span || !slide.span.trim()) &&
          (!slide.desc || !slide.desc.trim())
        );

        const handleSlideClick = () => {
          if (slide.link) {
            if (slide.link.startsWith('#') || slide.link.startsWith('/')) {
              window.location.hash = slide.link.replace(/^#\/?/, '#/');
            } else {
              window.open(slide.link, '_blank');
            }
          } else {
            window.location.hash = '#/catalogo';
          }
        };

        const overlayDarkness = slide.overlayOpacity !== undefined 
          ? Number(slide.overlayOpacity) / 100 
          : 0;

        return (
          <div
            key={idx}
            onClick={handleSlideClick}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out will-change-[opacity] cursor-pointer ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            style={{ transform: 'translate3d(0, 0, 0)' }}
          >
            {/* Mobile / Tablet Portrait Image (100% Guaranteed on all phones) */}
            <img
              src={slide.mobileImage || slide.image}
              alt={slide.title || 'Banner Holux Mobile'}
              decoding="async"
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover object-center block md:hidden opacity-100"
            />
            {/* Desktop / Laptop Horizontal Image */}
            <img
              src={slide.image || slide.mobileImage}
              alt={slide.title || 'Banner Holux Desktop'}
              decoding="async"
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover object-center hidden md:block opacity-100"
            />

            {/* Black Overlay and gradients ONLY when overlayDarkness > 0 */}
            {overlayDarkness > 0 && (
              <>
                <div
                  className="absolute inset-0 transition-opacity duration-500 pointer-events-none z-1"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${overlayDarkness})` }}
                />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-1" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-1" />
              </>
            )}

            {/* Text & CTA Content Area */}
            {hasText && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10 pointer-events-none">
                <div
                  className={`max-w-3xl space-y-3 sm:space-y-4 transition-all duration-700 delay-100 transform ${
                    isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                >
                  {slide.span && slide.span.trim() && (
                    <span className="text-xs sm:text-sm font-semibold text-orange-200 tracking-[0.2em] uppercase font-sans block drop-shadow">
                      {slide.span}
                    </span>
                  )}
                  {slide.title && slide.title.trim() && (
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold tracking-wide text-white leading-tight uppercase drop-shadow-md">
                      {slide.title} {slide.highlight && <br className="hidden sm:inline" />}
                      {slide.highlight && slide.highlight.trim() && (
                        <span className="text-[#3C6E71] bg-white/10 px-3 py-1 rounded-lg inline-block mt-2 sm:mt-0 font-bold ml-2">
                          {slide.highlight}
                        </span>
                      )}
                    </h1>
                  )}
                  {slide.desc && slide.desc.trim() && (
                    <p className="text-xs sm:text-base text-gray-200 max-w-xl mx-auto leading-relaxed font-sans hidden sm:block font-medium">
                      {slide.desc}
                    </p>
                  )}
                  {slide.cta && slide.cta.trim() && (
                    <div className="pt-2 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSlideClick();
                        }}
                        className="px-6 py-3 sm:px-8 sm:py-3.5 bg-black hover:bg-neutral-800 text-white font-display text-xs sm:text-sm font-bold tracking-widest rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2 border border-white/10 active:scale-95 uppercase"
                      >
                        {slide.cta}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}


      {/* Carousel Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentSlide ? 'bg-[#3C6E71] w-6' : 'bg-white/50 hover:bg-white/80 w-2.5'
            }`}
            title={`Ver slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

export default HeroSlider;