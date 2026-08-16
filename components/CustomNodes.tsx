import { useEffect } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { Database, Server, Box } from 'lucide-react';

export const DatabaseNode = ({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const isHorizontal = data.orientation === 'horizontal';
  
  useEffect(() => {
    updateNodeInternals(id);
  }, [isHorizontal, id, updateNodeInternals]);

  const targetPos = isHorizontal ? Position.Left : Position.Top;
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

  return (
    <div className={`relative w-28 h-32 flex flex-col items-center justify-center font-sans transition-all ${selected ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'drop-shadow-md'}`}>
      <Handle type="target" position={targetPos} className="!w-3 !h-3 !bg-blue-500 !border-none z-40" />
      
      {/* Top Ellipse (Lid) */}
      <div 
        className={`absolute top-0 left-0 w-full h-10 z-20 transition-colors border-2 rounded-[50%] bg-zinc-100 dark:bg-zinc-800 ${selected ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-700'}`}
      />
      
      {/* Body */}
      <div 
        className={`absolute left-0 w-full z-10 flex flex-col items-center justify-center transition-colors border-x-2 bg-white dark:bg-zinc-900 ${selected ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-700'}`}
        style={{ top: '20px', bottom: '20px' }}
      >
        <Database size={18} className="text-blue-500 dark:text-blue-400 mt-3 mb-1" />
        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100 px-2 text-center truncate w-full">{data.label || 'Database'}</div>
      </div>

      {/* Bottom Ellipse */}
      <div 
        className={`absolute bottom-0 left-0 w-full h-10 z-0 transition-colors border-2 rounded-[50%] bg-white dark:bg-zinc-900 ${selected ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-700'}`}
      />
      
      <Handle type="source" position={sourcePos} className="!w-3 !h-3 !bg-blue-500 !border-none z-40" />
    </div>
  );
};

export const ServerNode = ({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const isHorizontal = data.orientation === 'horizontal';

  useEffect(() => {
    updateNodeInternals(id);
  }, [isHorizontal, id, updateNodeInternals]);

  const targetPos = isHorizontal ? Position.Left : Position.Top;
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white dark:bg-zinc-900 border-2 ${selected ? 'border-green-500' : 'border-zinc-300 dark:border-zinc-700'} text-zinc-800 dark:text-zinc-100 flex items-center gap-2 min-w-[150px] transition-colors`}>
      <Handle type="target" position={targetPos} className="!w-3 !h-3 !bg-green-500 !border-none z-40" />
      <Server size={16} className="text-green-600 dark:text-green-400" />
      <div className="text-sm font-medium">{data.label || 'Server'}</div>
      <Handle type="source" position={sourcePos} className="!w-3 !h-3 !bg-green-500 !border-none z-40" />
    </div>
  );
};

export const CustomNode = ({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const isHorizontal = data.orientation === 'horizontal';

  useEffect(() => {
    updateNodeInternals(id);
  }, [isHorizontal, id, updateNodeInternals]);

  const targetPos = isHorizontal ? Position.Left : Position.Top;
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

  return (
    <div className={`w-24 h-24 shadow-md rounded-md bg-white dark:bg-zinc-900 border-2 ${selected ? 'border-purple-500' : 'border-zinc-300 dark:border-zinc-700'} text-zinc-800 dark:text-zinc-100 flex flex-col items-center justify-center gap-2 transition-colors`}>
      <Handle type="target" position={targetPos} className="!w-3 !h-3 !bg-purple-500 !border-none z-40" />
      <Box size={20} className="text-purple-600 dark:text-purple-400" />
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{data.label || 'Custom Node'}</span>
      <Handle type="source" position={sourcePos} className="!w-3 !h-3 !bg-purple-500 !border-none z-40" />
    </div>
  );
};
