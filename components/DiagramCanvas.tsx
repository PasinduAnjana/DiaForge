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
import { 
  DownloadCloud, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  Workflow, 
  FolderOpen, 
  Save, 
  FilePlus 
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  exportDiagramToFile,
  readDiagramFile,
  saveDiagramToStorage,
  loadDiagramFromStorage,
  clearDiagramStorage,
} from '@/utils/diagramStorage';

let id = 0;
const getId = () => `node_${id++}_${Date.now()}`;

const DiagramFlow = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('Untitled Architecture');
  const [isSaved, setIsSaved] = useState(true);

  const { screenToFlowPosition, fitView, getViewport, setViewport } = useReactFlow();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    setMounted(true);
    const saved = loadDiagramFromStorage();
    if (saved) {
      if (saved.nodes && saved.nodes.length > 0) setNodes(saved.nodes);
      if (saved.edges && saved.edges.length > 0) setEdges(saved.edges);
      if (saved.name) setTitle(saved.name);
      if (saved.viewport) {
        setTimeout(() => setViewport(saved.viewport!), 50);
      }
    }
  }, [setNodes, setEdges, setViewport]);

  // 2. Debounced Auto-Save
  useEffect(() => {
    if (!mounted) return;
    setIsSaved(false);
    const timer = setTimeout(() => {
      saveDiagramToStorage(nodes, edges, title, getViewport());
      setIsSaved(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [nodes, edges, title, mounted, getViewport]);

  // 3. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Delete Node(s) or Edge(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setNodes((nds) => {
          const selectedNodeIds = new Set(nds.filter((n) => n.selected).map((n) => n.id));
          
          setEdges((eds) =>
            eds.filter(
              (edge) =>
                !edge.selected &&
                !selectedNodeIds.has(edge.source) &&
                !selectedNodeIds.has(edge.target)
            )
          );

          if (selectedNodeIds.size === 0) return nds;
          return nds.filter((n) => !n.selected);
        });
      }

      // Rotate Orientation (R key)
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

      // Save shortcut (Cmd/Ctrl + S)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        exportDiagramToFile(nodes, edges, title, getViewport());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setNodes, setEdges, nodes, edges, title, getViewport]);

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
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      // Check if a file was dropped directly onto the canvas
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        if (file.name.endsWith('.diaflow') || file.name.endsWith('.json')) {
          try {
            const doc = await readDiagramFile(file);
            setNodes(doc.nodes || []);
            setEdges(doc.edges || []);
            if (doc.name) setTitle(doc.name);
            setTimeout(() => fitView({ padding: 0.2 }), 50);
            return;
          } catch (err) {
            alert(`Could not open file: ${(err as Error).message}`);
          }
        }
      }

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
    [screenToFlowPosition, setNodes, setEdges, fitView],
  );

  // File Upload Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const doc = await readDiagramFile(file);
      setNodes(doc.nodes || []);
      setEdges(doc.edges || []);
      if (doc.name) setTitle(doc.name);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    } catch (err) {
      alert(`Error loading diagram: ${(err as Error).message}`);
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  // Reset / New Diagram
  const handleNewDiagram = () => {
    if (nodes.length > 0) {
      const confirmed = window.confirm('Start a new diagram? Make sure to save your current work first.');
      if (!confirmed) return;
    }
    setNodes([]);
    setEdges([]);
    setTitle('Untitled Architecture');
    clearDiagramStorage();
  };

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

    const filename = (title.trim() || 'architecture-diagram').toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    if (format === 'png') {
      toPng(reactFlowWrapper.current, options).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      });
    } else {
      toSvg(reactFlowWrapper.current, options).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${filename}.svg`;
        link.href = dataUrl;
        link.click();
      });
    }
  }, [title]);

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
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".diaflow,.json,application/json"
        className="hidden"
      />

      {/* Header Panel */}
      <header className="h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-5 bg-white dark:bg-zinc-950 z-20 shadow-sm dark:shadow-black/50 transition-colors">
        {/* Left: Brand & Diagram Title */}
        <div className="flex items-center gap-3">
          <Workflow className="w-6 h-6 text-indigo-600 dark:text-indigo-500 shrink-0" />
          <h1 className="font-bold text-lg tracking-tight text-zinc-800 dark:text-zinc-100">DiaFlow</h1>
          
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-800 mx-1" />

          {/* Editable Title */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs font-semibold px-2 py-1 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 dark:focus:border-indigo-400 text-zinc-700 dark:text-zinc-200 transition-colors min-w-[160px] max-w-[240px] truncate"
              title="Click to rename diagram"
            />

            {/* Auto-save indicator */}
            <span className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-400 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {isSaved ? 'Saved' : 'Saving...'}
            </span>
          </div>
        </div>
        
        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-3">
          {/* File Operations: New, Open, Save */}
          <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleNewDiagram}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors"
              title="New Diagram"
            >
              <FilePlus size={14} className="text-zinc-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors"
              title="Open .diaflow file"
            >
              <FolderOpen size={14} className="text-zinc-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Open</span>
            </button>
            <button
              onClick={() => exportDiagramToFile(nodes, edges, title, getViewport())}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors font-semibold"
              title="Save Diagram (.diaflow)"
            >
              <Save size={14} />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>

          {/* Export & Clipboard */}
          <div className="flex items-center gap-1.5 export-buttons border-l border-zinc-200 dark:border-zinc-800 pl-3">
            <button 
              onClick={copyImage} 
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
              title="Copy to Clipboard"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button 
              onClick={() => downloadImage('png')} 
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
              <DownloadCloud size={14} />
              PNG
            </button>
            <button 
              onClick={() => downloadImage('svg')} 
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-sm shadow-indigo-600/20"
            >
              <DownloadCloud size={14} />
              SVG
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="theme-toggle flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors ml-1"
            title="Toggle theme"
          >
            {mounted && isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>
      
      {/* Workspace Body */}
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
            onEdgeDoubleClick={(_, edge) => setEdges((eds) => eds.filter((e) => e.id !== edge.id))}
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

