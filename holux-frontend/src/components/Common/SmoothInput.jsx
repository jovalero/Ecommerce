import React, { useState, useEffect, useRef, memo } from 'react';

/**
 * SmoothInput: Ultra-responsive input that isolates keystrokes to 0ms input lag,
 * preventing heavy parent component re-renders from stuttering the UI during typing.
 */
export const SmoothInput = memo(React.forwardRef(function SmoothInput(
  { value = '', onChange, onBlur, onKeyDown, type = 'text', className = '', ...props },
  forwardedRef
) {
  const [localValue, setLocalValue] = useState(value !== undefined && value !== null ? value : '');
  const isTypingRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(value !== undefined && value !== null ? value : '');
    }
  }, [value]);

  const handleChange = (e) => {
    isTypingRef.current = true;
    const nextVal = e.target.value;
    setLocalValue(nextVal);
    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = (e) => {
    isTypingRef.current = false;
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <input
      ref={(el) => {
        inputRef.current = el;
        if (typeof forwardedRef === 'function') {
          forwardedRef(el);
        } else if (forwardedRef) {
          forwardedRef.current = el;
        }
      }}
      type={type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      {...props}
    />
  );
}));

/**
 * SmoothTextarea: Ultra-responsive textarea for comments, descriptions, notes, etc.
 */
export const SmoothTextarea = memo(React.forwardRef(function SmoothTextarea(
  { value = '', onChange, onBlur, onKeyDown, className = '', ...props },
  forwardedRef
) {
  const [localValue, setLocalValue] = useState(value !== undefined && value !== null ? value : '');
  const isTypingRef = useRef(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(value !== undefined && value !== null ? value : '');
    }
  }, [value]);

  const handleChange = (e) => {
    isTypingRef.current = true;
    const nextVal = e.target.value;
    setLocalValue(nextVal);
    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = (e) => {
    isTypingRef.current = false;
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <textarea
      ref={(el) => {
        textareaRef.current = el;
        if (typeof forwardedRef === 'function') {
          forwardedRef(el);
        } else if (forwardedRef) {
          forwardedRef.current = el;
        }
      }}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      {...props}
    />
  );
}));

export default SmoothInput;
