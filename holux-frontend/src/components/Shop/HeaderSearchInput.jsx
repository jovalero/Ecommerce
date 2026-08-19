import React, { useState, useEffect, useRef, memo } from 'react';
import { Search, X } from 'lucide-react';

const HeaderSearchInput = memo(function HeaderSearchInput({
  isOpen,
  onToggle,
  onSearch,
  currentQuery = '',
  onNavigateToCatalog
}) {
  const [localValue, setLocalValue] = useState(currentQuery);
  const inputRef = useRef(null);

  // Sync when external query changes
  useEffect(() => {
    setLocalValue(currentQuery);
  }, [currentQuery]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search trigger (~200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== currentQuery) {
        onSearch(localValue);
        if (localValue.trim() && onNavigateToCatalog) {
          onNavigateToCatalog();
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [localValue, currentQuery, onSearch, onNavigateToCatalog]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(localValue);
      if (onNavigateToCatalog) {
        onNavigateToCatalog();
      }
    } else if (e.key === 'Escape') {
      setLocalValue('');
      onSearch('');
      onToggle(false);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex items-center gap-2 relative">
      {isOpen && (
        <div className="relative flex items-center animate-in fade-in duration-150">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Buscar equipo, marca..."
            className="bg-white/15 text-white placeholder-gray-400 border border-[#3C6E71]/60 rounded-full pl-3.5 pr-8 py-1.5 text-xs outline-none focus:border-[#3C6E71] focus:bg-white/25 transition-all w-40 sm:w-56"
          />
          {localValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 text-gray-400 hover:text-white p-0.5 cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setLocalValue('');
            onSearch('');
            onToggle(false);
          } else {
            onToggle(true);
          }
        }}
        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
        title={isOpen ? "Cerrar búsqueda" : "Buscar productos en catálogo"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-red-400" />
        ) : (
          <Search className="w-5 h-5 text-[#F2EFE9]" />
        )}
      </button>
    </div>
  );
});

export default HeaderSearchInput;
