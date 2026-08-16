import React, { useEffect, useState, useRef } from 'react';
import { useReactFlow } from 'reactflow';

export interface EditableLabelProps {
  id: string;
  initialLabel: string;
  defaultLabel: string;
  className?: string;
  inputClassName?: string;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onSave?: (newLabel: string) => void;
}

export const EditableLabel = ({
  id,
  initialLabel,
  defaultLabel,
  className = '',
  inputClassName = '',
  isEditing,
  setIsEditing,
  onSave,
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
    if (onSave) {
      onSave(newText);
    } else {
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
    }
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
        className={`bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-indigo-500 dark:border-indigo-400 rounded px-1.5 py-0.5 outline-none text-center shadow-sm text-sm font-medium ${inputClassName}`}
      />
    );
  }

  return (
    <div
      className={`truncate cursor-text select-none text-sm font-medium ${className}`}
      title="Double click to edit"
    >
      {text}
    </div>
  );
};

export default EditableLabel;
