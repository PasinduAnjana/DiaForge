import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { ALL_LUCIDE_ICONS, CURATED_ICON_LIST, IconItem } from './iconRegistry';
import { NodeColorTheme } from '../base/BaseNode';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  currentIconName?: string;
  currentColor?: string;
  onSelectColor?: (color: NodeColorTheme) => void;
}

const CATEGORIES = [
  'All',
  'General',
  'Data & Storage',
  'Networking',
  'Security & Auth',
  'Payments',
  'Communication',
  'DevOps',
  'Monitoring',
];

const COLOR_OPTIONS: { name: NodeColorTheme; label: string; bg: string }[] = [
  { name: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { name: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { name: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { name: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
  { name: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { name: 'green', label: 'Green', bg: 'bg-green-500' },
  { name: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { name: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { name: 'zinc', label: 'Zinc', bg: 'bg-zinc-500' },
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
  currentIconName,
  currentColor = 'indigo',
  onSelectColor,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();

    // When typing a search query, search the entire collection of 1000+ Lucide icons
    if (query.length > 0) {
      return ALL_LUCIDE_ICONS.filter((item: IconItem) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.label.toLowerCase().includes(query)
        );
      }).slice(0, 140);
    }

    // Default category browsing from curated set
    if (selectedCategory === 'All') {
      return CURATED_ICON_LIST;
    }

    return CURATED_ICON_LIST.filter(
      (item: IconItem) => item.category === selectedCategory
    );
  }, [search, selectedCategory]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Customize Node
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Choose icon and color theme
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Color Palette Selector */}
        {onSelectColor && (
          <div className="px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Color Theme</span>
            <div className="flex items-center gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onSelectColor(c.name)}
                  title={c.label}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer ${c.bg} ${
                    currentColor === c.name
                      ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900 scale-110'
                      : 'hover:scale-115 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search 1,000+ icons (e.g. database, stripe, lock, cloud)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-indigo-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 transition-colors"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pt-2 pb-1 no-scrollbar">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-3 min-h-[220px]">
          {filteredIcons.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 text-zinc-400 text-xs">
              No matching icons found
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
              {filteredIcons.map((item: IconItem) => {
                const IconComponent = item.icon;
                const isSelected = currentIconName === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      onSelectIcon(item.name);
                      onClose();
                    }}
                    title={item.label}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg transition-all group ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <IconComponent size={20} className="transition-transform group-hover:scale-110" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center text-[11px] text-zinc-400">
          <span>{filteredIcons.length} icons available</span>
          <span className="font-mono text-[10px]">ESC to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IconPickerModal;
