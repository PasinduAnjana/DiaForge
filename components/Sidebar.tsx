import React, { useState, useMemo } from 'react';
import { GripVertical, Search, X } from 'lucide-react';
import { NODE_REGISTRY, NODE_CATEGORIES } from './nodes/registry';
import { NodeCategory, NodeDefinition } from './nodes/types';

const COLOR_THEME_CLASSES: Record<
  string,
  {
    icon: string;
    hoverBorder: string;
    hoverBg: string;
  }
> = {
  blue: {
    icon: 'text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500/50',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
  },
  green: {
    icon: 'text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300',
    hoverBorder: 'hover:border-green-400 dark:hover:border-green-500/50',
    hoverBg: 'hover:bg-green-50 dark:hover:bg-green-500/10',
  },
  emerald: {
    icon: 'text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
    hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500/50',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
  },
  purple: {
    icon: 'text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300',
    hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-500/50',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
  },
  indigo: {
    icon: 'text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300',
    hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500/50',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
  },
  amber: {
    icon: 'text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300',
    hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500/50',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
  },
  rose: {
    icon: 'text-rose-500 dark:text-rose-400 group-hover:text-rose-600 dark:group-hover:text-rose-300',
    hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-500/50',
    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
  },
  cyan: {
    icon: 'text-cyan-500 dark:text-cyan-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300',
    hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500/50',
    hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
  },
  zinc: {
    icon: 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300',
    hoverBorder: 'hover:border-zinc-400 dark:hover:border-zinc-600',
    hoverBg: 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
  },
};

export const Sidebar = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredNodes = useMemo(() => {
    return NODE_REGISTRY.filter((node) => {
      const matchesSearch =
        node.label.toLowerCase().includes(search.toLowerCase()) ||
        node.category.toLowerCase().includes(search.toLowerCase()) ||
        (node.description && node.description.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || node.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const groupedNodes = useMemo(() => {
    if (selectedCategory !== 'All' || search.trim() !== '') {
      return { 'Search Results': filteredNodes };
    }

    const groups: Partial<Record<NodeCategory, NodeDefinition[]>> = {};
    for (const cat of NODE_CATEGORIES) {
      const items = NODE_REGISTRY.filter((n) => n.category === cat);
      if (items.length > 0) {
        groups[cat] = items;
      }
    }
    return groups;
  }, [filteredNodes, selectedCategory, search]);

  return (
    <aside className="w-72 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col text-zinc-700 dark:text-zinc-300 z-10 relative shadow-xl dark:shadow-black/50 transition-colors h-full min-h-0 shrink-0">
      {/* Header & Search */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Components ({NODE_REGISTRY.length})
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors text-zinc-800 dark:text-zinc-200"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {['All', ...NODE_CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300/70 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Node Palette List (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {Object.entries(groupedNodes).map(([groupTitle, nodes]) => {
          if (!nodes || nodes.length === 0) return null;
          return (
            <div key={groupTitle} className="space-y-2">
              <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                {groupTitle}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {nodes.map((node) => {
                  const theme = COLOR_THEME_CLASSES[node.color] || COLOR_THEME_CLASSES.indigo;
                  const Icon = node.icon;

                  return (
                    <div
                      key={node.type}
                      onDragStart={(e) => onDragStart(e, node.type)}
                      draggable
                      className={`group p-2.5 border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 rounded-lg cursor-grab active:cursor-grabbing ${theme.hoverBorder} ${theme.hoverBg} transition-all flex items-center justify-between shadow-sm select-none hover:shadow`}
                      title={node.description || node.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800/60 shrink-0">
                          <Icon size={16} className={`${theme.icon} transition-colors`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                            {node.label}
                          </div>
                          {node.description && (
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-tight">
                              {node.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <GripVertical
                        size={13}
                        className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 shrink-0 ml-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No components match your search.
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
