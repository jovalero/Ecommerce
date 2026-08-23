import React, { useState, useEffect, useRef, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_SLIDES = [
  {
    span: "EQUIPAMIENTO PROFESIONAL DE MONTAÑA",
    title: "HACIA LO ALTO",
    highlight: "SIN LÍMITES",
    desc: "Diseñamos indumentaria y equipo técnico de alto rendimiento para resistir las condiciones climáticas más extremas de la cordillera.",
    cta: "VER EQUIPAMIENTO",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    span: "EXPEDICIONES Y AVENTURA",
    title: "EQUÍPATE PARA",
    highlight: "CADA DESAFÍO",
    desc: "Descubre nuestra línea de carpas de alta resistencia, bolsas de dormir térmicas y accesorios técnicos homologados para trekking y camping.",
    cta: "EXPLORAR CARPAS",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80"
  },
  {
    span: "COLECCIÓN CALZADO Y ABRIGO",
    title: "RESISTENCIA EN",
    highlight: "CADA PASO",
    desc: "Botas técnicas con agarre de alta tracción y camperas cortavientos Fitz Roy diseñadas con aislamiento de nivel profesional.",
    cta: "VER CALZADO",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1600&q=80"
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

  return (
    <div
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="group relative overflow-hidden bg-[#1C2321] text-[#F2EFE9] h-[550px] sm:h-[650px] md:h-[calc(100vh-140px)] md:min-h-[650px] flex items-center border-b border-[#3C6E71]/15 select-none cursor-default"
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
          : (hasText ? 0.45 : 0);

        return (
          <div
            key={idx}
            onClick={!hasText ? handleSlideClick : undefined}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out will-change-[opacity] ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            } ${!hasText ? 'cursor-pointer' : ''}`}
            style={{ transform: 'translate3d(0, 0, 0)' }}
          >
            {/* Background Image with async decoding */}
            <picture className="absolute inset-0 w-full h-full">
              {slide.mobileImage && (
                <source media="(max-width: 640px)" srcSet={slide.mobileImage} />
              )}
              <img
                src={slide.image}
                alt={slide.title || 'Banner Holux'}
                decoding="async"
                loading="eager"
                fetchPriority={idx === 0 ? "high" : "auto"}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-100"
              />
            </picture>

            {/* Black Overlay with customizable opacity */}
            {overlayDarkness > 0 && (
              <div
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                style={{ backgroundColor: `rgba(0, 0, 0, ${overlayDarkness})` }}
              />
            )}

            {/* Text Content Area ONLY when there is text */}
            {hasText && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
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
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSlideClick();
                        }}
                        className="px-6 py-3 sm:px-8 sm:py-3.5 bg-black hover:bg-neutral-800 text-white font-display text-xs sm:text-sm font-bold tracking-widest rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2 border border-white/10"
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

      {/* Top and bottom gradient shadows for seamless transition */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

      {/* Left Control Arrow (Visible on hover) */}
      <button
        onClick={handlePrev}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 p-3.5 bg-black/40 hover:bg-[#3C6E71]/80 text-white rounded-full transition-all duration-300 z-20 cursor-pointer flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100"
        title="Slide anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right Control Arrow (Visible on hover) */}
      <button
        onClick={handleNext}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3.5 bg-black/40 hover:bg-[#3C6E71]/80 text-white rounded-full transition-all duration-300 z-20 cursor-pointer flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100"
        title="Siguiente slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

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