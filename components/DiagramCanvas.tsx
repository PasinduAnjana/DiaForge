'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  useReactFlow,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng, toSvg, toBlob } from 'html-to-image';
import Sidebar from './Sidebar';
import { nodeTypes, getNodeDefinition } from './nodes/registry';
import { DownloadCloud, Sun, Moon, Copy, Check, Workflow } from 'lucide-react';
import { useTheme } from 'next-themes';

let id = 0;
const getId = () => `node_${id++}`;

const DiagramFlow = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        setNodes((nds) => {
          const selectedNodeIds = new Set(nds.filter((n) => n.selected).map((n) => n.id));
          if (selectedNodeIds.size === 0) return nds;
          
          setEdges((eds) => eds.filter((edge) => !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target) && !edge.selected));
          return nds.filter((n) => !n.selected);
        });
      }

      if (e.key.toLowerCase() === 'r') {
        setNodes((nds) => nds.map(node => {
          if (node.selected) {
            const currentOrientation = node.data.orientation || 'vertical';
            return {
              ...node,
              data: {
                ...node.data,
                orientation: currentOrientation === 'vertical' ? 'horizontal' : 'vertical'
              }
            };
          }
          return node;
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep', 
      animated: true, 
      style: { stroke: '#a1a1aa', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a1a1aa' },
    }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const nodeDef = getNodeDefinition(type);
      const label = nodeDef ? nodeDef.label : `${type.charAt(0).toUpperCase() + type.slice(1)}`;

      const isContainer = type === 'container';
      const newNode: Node = {
        id: getId(),
        type,
        position,
        zIndex: isContainer ? -1 : 1,
        data: { label },
      };

      setNodes((nds) => {
        if (isContainer) {
          return [newNode, ...nds];
        }
        return nds.concat(newNode);
      });
    },
    [screenToFlowPosition, setNodes],
  );

  const downloadImage = useCallback((format: 'png' | 'svg') => {
    if (reactFlowWrapper.current === null) return;
    
    const filter = (node: HTMLElement) => {
      const exclusionClasses = ['react-flow__controls', 'react-flow__panel', 'export-buttons', 'theme-toggle'];
      return !exclusionClasses.some((className) => node.classList?.contains(className));
    };

    const isDark = document.documentElement.classList.contains('dark');
    const options = { 
      filter, 
      backgroundColor: isDark ? '#09090b' : '#fafafa', 
      pixelRatio: 2 
    };

    if (format === 'png') {
      toPng(reactFlowWrapper.current, options).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'architecture-diagram.png';
        link.href = dataUrl;
        link.click();
      });
    } else {
      toSvg(reactFlowWrapper.current, options).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'architecture-diagram.svg';
        link.href = dataUrl;
        link.click();
      });
    }
  }, []);

  const copyImage = useCallback(() => {
    if (reactFlowWrapper.current === null) return;
    
    const filter = (node: HTMLElement) => {
      const exclusionClasses = ['react-flow__controls', 'react-flow__panel', 'export-buttons', 'theme-toggle'];
      return !exclusionClasses.some((className) => node.classList?.contains(className));
    };

    const isDark = document.documentElement.classList.contains('dark');
    const options = { 
      filter, 
      backgroundColor: isDark ? '#09090b' : '#fafafa', 
      pixelRatio: 2 
    };

    toBlob(reactFlowWrapper.current, options).then((blob) => {
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch((err) => {
          console.error('Failed to copy image to clipboard', err);
          alert('Could not copy to clipboard. Ensure you are in a secure context (HTTPS/localhost).');
        });
      }
    });
  }, []);

  const isDark = mounted ? theme === 'dark' : true;

  const onConnectStart = useCallback(() => {
    document.documentElement.classList.add('is-connecting');
  }, []);

  const onConnectEnd = useCallback(() => {
    document.documentElement.classList.remove('is-connecting');
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden transition-colors">
      {/* Header Panel */}
      <header className="h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white dark:bg-zinc-950 z-20 shadow-sm dark:shadow-black/50 transition-colors">
        <div className="flex items-center gap-3">
          <Workflow className="w-6 h-6 text-indigo-600 dark:text-indigo-500" />
          <h1 className="font-bold text-lg tracking-tight text-zinc-800 dark:text-zinc-100">DiaFlow</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="theme-toggle flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
          >
            {mounted && isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="flex items-center gap-2 export-buttons border-l border-zinc-200 dark:border-zinc-800 pl-4">
            <button 
              onClick={copyImage} 
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
              title="Copy to Clipboard"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => downloadImage('png')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <DownloadCloud size={16} />
              PNG
            </button>
            <button onClick={() => downloadImage('svg')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-md shadow-indigo-600/20">
              <DownloadCloud size={16} />
              SVG
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 min-h-0 w-full relative overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full min-h-0 w-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className={`transition-colors ${isDark ? 'dark' : ''}`}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color={isDark ? '#3f3f46' : '#d4d4d8'} gap={20} size={1} />
            <Controls className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 !fill-zinc-600 dark:!fill-zinc-400 !text-zinc-600 dark:!text-zinc-400 shadow-xl" showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default function DiagramApplication() {
  return (
    <ReactFlowProvider>
      <DiagramFlow />
    </ReactFlowProvider>
  );
}
