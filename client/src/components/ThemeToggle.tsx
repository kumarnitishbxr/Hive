import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const options: { value: Theme; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop }
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          setTheme(options[focusedIndex].value);
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
      default:
        break;
    }
  };

  const selectTheme = (value: Theme) => {
    setTheme(value);
    setIsOpen(false);
  };

  // Get matching icon based on current theme configuration
  const getActiveIcon = () => {
    if (theme === 'light') return <Sun size={17} />;
    if (theme === 'dark') return <Moon size={17} />;
    return <Laptop size={17} />;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* 40px x 40px Compact Glass Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 hover:border-white/15 dark:bg-white/5 dark:border-white/8 dark:hover:border-white/15 flex items-center justify-center text-gray-400 hover:text-white transition duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Toggle Theme Menu"
      >
        {getActiveIcon()}
      </button>

      {/* Animated Dropdown Menu options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 origin-top-right rounded-2xl border border-white/8 bg-[#111827]/90 dark:bg-[#111827]/90 backdrop-blur-xl p-1.5 shadow-2xl z-50 focus:outline-none"
            role="listbox"
            tabIndex={-1}
          >
            <div className="space-y-0.5">
              {options.map((opt, idx) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.value;
                const isFocused = focusedIndex === idx;

                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectTheme(opt.value)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer outline-none ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : isFocused 
                          ? 'bg-white/5 text-white' 
                          : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={isSelected ? 'text-white' : 'text-gray-500'} />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={12} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ThemeToggle;
