import React from 'react';
import { Database, Server, Box, GripVertical } from 'lucide-react';

const Sidebar = () => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-6 text-zinc-700 dark:text-zinc-300 z-10 relative shadow-xl dark:shadow-black/50 transition-colors">
      <div>
        <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Drag & Drop Nodes</h2>
        
        <div className="flex flex-col gap-3">
          <div 
            className="group p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all flex items-center justify-between shadow-sm"
            onDragStart={(event) => onDragStart(event, 'database')}
            draggable
          >
            <div className="flex items-center gap-3">
              <Database size={18} className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors" />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Database</span>
            </div>
            <GripVertical size={14} className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400" />
          </div>
          
          <div 
            className="group p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-lg cursor-grab active:cursor-grabbing hover:border-green-400 dark:hover:border-green-500/50 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all flex items-center justify-between shadow-sm"
            onDragStart={(event) => onDragStart(event, 'server')}
            draggable
          >
            <div className="flex items-center gap-3">
              <Server size={18} className="text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors" />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Server</span>
            </div>
            <GripVertical size={14} className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400" />
          </div>

          <div 
            className="group p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-lg cursor-grab active:cursor-grabbing hover:border-purple-400 dark:hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all flex items-center justify-between shadow-sm"
            onDragStart={(event) => onDragStart(event, 'custom')}
            draggable
          >
            <div className="flex items-center gap-3">
              <Box size={18} className="text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors" />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Custom Node</span>
            </div>
            <GripVertical size={14} className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400" />
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800/50 text-xs text-zinc-500 leading-relaxed space-y-1.5">
        <p>• <strong>Drag & drop</strong> to add nodes</p>
        <p>• <strong>Connect</strong> handles for edges</p>
        <p>• <strong>Double-click</strong> node to edit label</p>
        <p>• <strong>Delete / Backspace</strong> to remove</p>
        <p>• <strong>R</strong> key to rotate orientation</p>
      </div>
    </aside>
  );
};

export default Sidebar;
