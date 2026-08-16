import { useEffect, useState, useRef } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals, useReactFlow, NodeResizer } from 'reactflow';
import { Database, Server, Box } from 'lucide-react';

interface EditableLabelProps {
  id: string;
  initialLabel: string;
  defaultLabel: string;
  className?: string;
  inputClassName?: string;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

const EditableLabel = ({
  id,
  initialLabel,
  defaultLabel,
  className = '',
  inputClassName = '',
  isEditing,
  setIsEditing,
}: EditableLabelProps) => {
  const { setNodes } = useReactFlow();
  const [text, setText] = useState(initialLabel || defaultLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(initialLabel || defaultLabel);
  }, [initialLabel, defaultLabel]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const save = () => {
    setIsEditing(false);
    const newText = text.trim() || defaultLabel;
    setText(newText);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newText,
            },
          };
        }
        return node;
      })
    );
  };

  const cancel = () => {
    setText(initialLabel || defaultLabel);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') cancel();
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-indigo-500 dark:border-indigo-400 rounded px-1 outline-none text-center shadow-sm ${inputClassName}`}
      />
    );
  }

  return (
    <div
      className={`truncate cursor-text select-none ${className}`}
      title="Double click to edit"
    >
      {text}
    </div>
  );
};

export const DatabaseNode = ({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const isHorizontal = data.orientation === 'horizontal';
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    updateNodeInternals(id);
  }, [isHorizontal, id, updateNodeInternals]);

  const targetPos = isHorizontal ? Position.Left : Position.Top;
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

  return (
    <>
      <NodeResizer 
        isVisible={selected} 
        minWidth={100} 
        minHeight={110} 
        lineClassName="!border-blue-500/60"
        handleClassName="!w-2 !h-2 !bg-white dark:!bg-zinc-900 !border-2 !border-blue-500 !rounded-sm"
      />
      <div 
        onDoubleClick={() => setIsEditing(true)}
        className={`relative w-full h-full min-w-[100px] min-h-[110px] flex flex-col items-center justify-center font-sans transition-all ${selected ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'drop-shadow-md'}`}
      >
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
          <Database size={18} className="text-blue-500 dark:text-blue-400 mt-3 mb-1 shrink-0" />
          <div className="w-full px-2 flex justify-center">
            <EditableLabel
              id={id}
              initialLabel={data.label}
              defaultLabel="Database"
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              className="text-sm font-medium text-zinc-800 dark:text-zinc-100 text-center w-full"
              inputClassName="text-sm w-full font-medium"
            />
          </div>
        </div>

        {/* Bottom Ellipse */}
        <div 
          className={`absolute bottom-0 left-0 w-full h-10 z-0 transition-colors border-2 rounded-[50%] bg-white dark:bg-zinc-900 ${selected ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-700'}`}
        />
        
        <Handle type="source" position={sourcePos} className="!w-3 !h-3 !bg-blue-500 !border-none z-40" />
      </div>
    </>
  );
};

export const ServerNode = ({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const isHorizontal = data.orientation === 'horizontal';
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    updateNodeInternals(id);
  }, [isHorizontal, id, updateNodeInternals]);

  const targetPos = isHorizontal ? Position.Left : Position.Top;
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

  return (
    <>
      <NodeResizer 
        isVisible={selected} 
        minWidth={120} 
        minHeight={44} 
        lineClassName="!border-green-500/60"
        handleClassName="!w-2 !h-2 !bg-white dark:!bg-zinc-900 !border-2 !border-green-500 !rounded-sm"
      />
      <div 
        onDoubleClick={() => setIsEditing(true)}
        className={`px-4 py-2 shadow-md rounded-md bg-white dark:bg-zinc-900 border-2 ${selected ? 'border-green-500' : 'border-zinc-300 dark:border-zinc-700'} text-zinc-800 dark:text-zinc-100 flex items-center gap-2 w-full h-full min-w-[120px] min-h-[44px] transition-colors`}
      >
        <Handle type="target" position={targetPos} className="!w-3 !h-3 !bg-green-500 !border-none z-40" />
        <Server size={16} className="text-green-600 dark:text-green-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <EditableLabel
            id={id}
            initialLabel={data.label}
            defaultLabel="Server"
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            className="text-sm font-medium text-zinc-800 dark:text-zinc-100"
            inputClassName="text-sm w-full font-medium text-left"
          />
        </div>
        <Handle type="source" position={sourcePos} className="!w-3 !h-3 !bg-green-500 !border-none z-40" />
      </div>
    </>
  );
};

export const CustomNode = ({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const isHorizontal = data.orientation === 'horizontal';
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    updateNodeInternals(id);
  }, [isHorizontal, id, updateNodeInternals]);

  const targetPos = isHorizontal ? Position.Left : Position.Top;
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;

  return (
    <>
      <NodeResizer 
        isVisible={selected} 
        minWidth={80} 
        minHeight={80} 
        lineClassName="!border-purple-500/60"
        handleClassName="!w-2 !h-2 !bg-white dark:!bg-zinc-900 !border-2 !border-purple-500 !rounded-sm"
      />
      <div 
        onDoubleClick={() => setIsEditing(true)}
        className={`w-full h-full min-w-[80px] min-h-[80px] shadow-md rounded-md bg-white dark:bg-zinc-900 border-2 ${selected ? 'border-purple-500' : 'border-zinc-300 dark:border-zinc-700'} text-zinc-800 dark:text-zinc-100 flex flex-col items-center justify-center gap-2 transition-colors p-2`}
      >
        <Handle type="target" position={targetPos} className="!w-3 !h-3 !bg-purple-500 !border-none z-40" />
        <Box size={20} className="text-purple-600 dark:text-purple-400 shrink-0" />
        <div className="w-full flex justify-center">
          <EditableLabel
            id={id}
            initialLabel={data.label}
            defaultLabel="Custom Node"
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            className="text-sm font-medium text-zinc-800 dark:text-zinc-100 text-center w-full"
            inputClassName="text-sm w-full font-medium"
          />
        </div>
        <Handle type="source" position={sourcePos} className="!w-3 !h-3 !bg-purple-500 !border-none z-40" />
      </div>
    </>
  );
};


