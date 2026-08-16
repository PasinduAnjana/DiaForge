'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  applyNodeChanges,
  NodeChange,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  useReactFlow,
  MarkerType,
  ConnectionMode,
  SelectionMode,
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
  FilePlus,
  Play,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  HelpCircle,
  Sparkles,
  Bot,
  LayoutGrid,
  Database,
  Cloud,
  GitBranch,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  exportDiagramToFile,
  readDiagramFile,
  saveDiagramToStorage,
  loadDiagramFromStorage,
  clearDiagramStorage,
  inferDiagramTypeFromNodes,
} from '@/utils/diagramStorage';
import { getLayoutedElements } from '@/utils/autoLayout';
import { AIPromptModal } from './ai/AIPromptModal';
import { AICopilotDrawer } from './ai/AICopilotDrawer';
import { AISettingsModal } from './ai/AISettingsModal';
import { NewDiagramModal } from './modals/NewDiagramModal';
import { EditableEdge } from './edges/EditableEdge';
import { AIClientConfig } from '@/utils/aiClient';
import { DiagramType } from '@/schemas/diagram.schema';

const edgeTypes = {
  default: EditableEdge,
  smoothstep: EditableEdge,
  straight: EditableEdge,
};

let id = 0;
const getId = () => `node_${id++}_${Date.now()}`;

// Threshold in pixels for connection point alignment snapping
const PORT_ALIGN_THRESHOLD = 8;

const DiagramFlow = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [diagramType, setDiagramType] = useState<DiagramType>('system_design');
  const [title, setTitle] = useState('Untitled Architecture');
  const [isSaved, setIsSaved] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // AI States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIClientConfig>({
    provider: 'groq',
    apiKey: '',
    model: 'llama-3.1-8b-instant',
  });

  const { screenToFlowPosition, fitView, getViewport, setViewport, zoomIn, zoomOut } = useReactFlow();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load custom AI configuration on mount and migrate legacy rate-limited models
  useEffect(() => {
    try {
      const stored = localStorage.getItem('diaflow_ai_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.model === 'llama-3.3-70b-versatile' || !parsed.model) {
          parsed.model = 'llama-3.1-8b-instant';
          localStorage.setItem('diaflow_ai_config', JSON.stringify(parsed));
        }
        setAiConfig(parsed);
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  const handleSaveAIConfig = (newConfig: AIClientConfig) => {
    setAiConfig(newConfig);
    try {
      localStorage.setItem('diaflow_ai_config', JSON.stringify(newConfig));
    } catch {
      // Ignore
    }
  };

  const handleAutoLayout = useCallback((direction: 'LR' | 'TB' = 'LR') => {
    if (nodes.length === 0) return;
    const layouted = getLayoutedElements(nodes, edges, { direction });
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [nodes, edges, fitView, setNodes, setEdges]);

  const enterPresentMode = useCallback(() => {
    setIsPresenting(true);
    // Deselect all nodes and edges for presentation
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 100);
  }, [fitView, setNodes, setEdges]);

  const exitPresentMode = useCallback(() => {
    setIsPresenting(false);
  }, []);

  // Smart Alignment on Node Drag: Snaps connection ports when dragging a single node
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);

        const posChanges = changes.filter(
          (c) => c.type === 'position' && (c as { dragging?: boolean }).dragging && (c as { position?: unknown }).position
        );

        // Only snap if dragging a single node (allows multi-node selection to move together seamlessly)
        if (posChanges.length === 1) {
          const dragChange = posChanges[0] as { id: string };
          const draggedNode = nextNodes.find((n) => n.id === dragChange.id);
          if (draggedNode) {
            const dX = draggedNode.position.x;
            const dY = draggedNode.position.y;
            const dW = (draggedNode.width as number) || 120;
            const dH = (draggedNode.height as number) || 44;
            const dCenterX = dX + dW / 2;
            const dCenterY = dY + dH / 2;

            let snapX = dX;
            let snapY = dY;
            let minDiffX = PORT_ALIGN_THRESHOLD;
            let minDiffY = PORT_ALIGN_THRESHOLD;

            for (const other of nextNodes) {
              if (other.id === draggedNode.id || other.selected) continue;
              const oX = other.position.x;
              const oY = other.position.y;
              const oW = (other.width as number) || 120;
              const oH = (other.height as number) || 44;
              const oCenterX = oX + oW / 2;
              const oCenterY = oY + oH / 2;

              // 1. Horizontal Port Alignment
              const diffCenterY = Math.abs(dCenterY - oCenterY);
              if (diffCenterY < minDiffY) {
                minDiffY = diffCenterY;
                snapY = oCenterY - dH / 2;
              }

              // 2. Vertical Port Alignment
              const diffCenterX = Math.abs(dCenterX - oCenterX);
              if (diffCenterX < minDiffX) {
                minDiffX = diffCenterX;
                snapX = oCenterX - dW / 2;
              }
            }

            if (snapX !== dX || snapY !== dY) {
              draggedNode.position = { x: snapX, y: snapY };
            }
          }
        }

        return nextNodes;
      });
    },
    [setNodes]
  );

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    setMounted(true);
    const saved = loadDiagramFromStorage();
    if (saved && saved.nodes && saved.nodes.length > 0) {
      setNodes(saved.nodes);
      if (saved.edges && saved.edges.length > 0) setEdges(saved.edges);
      if (saved.name) setTitle(saved.name);
      const resolvedType = inferDiagramTypeFromNodes(saved.nodes, saved.diagramType);
      setDiagramType(resolvedType);
      if (saved.viewport) {
        setTimeout(() => setViewport(saved.viewport!), 50);
      }
    } else {
      // Prompt for Diagram Type on fresh / empty visit
      setIsNewModalOpen(true);
    }
  }, [setNodes, setEdges, setViewport]);

  // 2. Debounced Auto-Save
  useEffect(() => {
    if (!mounted || isPresenting) return;
    setIsSaved(false);
    const timer = setTimeout(() => {
      saveDiagramToStorage(nodes, edges, title, getViewport(), diagramType);
      setIsSaved(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [nodes, edges, title, diagramType, mounted, getViewport, isPresenting]);

  // 3. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle / Exit Present Mode or Close Help on ESC
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (isPresenting) {
          exitPresentMode();
          return;
        }
      }

      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Present shortcut (P key)
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (isPresenting) {
          exitPresentMode();
        } else {
          enterPresentMode();
        }
        return;
      }

      // Select All (Cmd/Ctrl + A)
      if (!isPresenting && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
        setEdges((eds) => eds.map((edge) => ({ ...edge, selected: true })));
        return;
      }

      // Delete Node(s) or Edge(s) (only in edit mode)
      if (!isPresenting && (e.key === 'Delete' || e.key === 'Backspace')) {
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

      // Save shortcut (Cmd/Ctrl + S)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        exportDiagramToFile(nodes, edges, title, getViewport(), diagramType);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setNodes, setEdges, nodes, edges, title, diagramType, getViewport, isPresenting, enterPresentMode, exitPresentMode]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      if (isPresenting) return;
      const isER = diagramType === 'erd';

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: isER ? 'straight' : 'smoothstep',
            data: {
              ...((params as Edge).data || {}),
              isStraight: isER,
            },
            animated: !isER,
            style: { stroke: isER ? '#71717a' : '#a1a1aa', strokeWidth: 2 },
            markerEnd: isER
              ? undefined
              : { type: MarkerType.ArrowClosed, color: '#a1a1aa' },
          },
          eds
        )
      );
    },
    [setEdges, isPresenting, diagramType]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (isPresenting) return;

      // Check if a file was dropped directly onto the canvas
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        if (file.name.endsWith('.diaflow') || file.name.endsWith('.json')) {
          try {
            const doc = await readDiagramFile(file);
            setNodes(doc.nodes || []);
            setEdges(doc.edges || []);
            if (doc.name) setTitle(doc.name);
            const resolvedType = inferDiagramTypeFromNodes(doc.nodes, doc.diagramType);
            setDiagramType(resolvedType);
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
    [screenToFlowPosition, setNodes, setEdges, fitView, isPresenting],
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
      const resolvedType = inferDiagramTypeFromNodes(doc.nodes, doc.diagramType);
      setDiagramType(resolvedType);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    } catch (err) {
      alert(`Error loading diagram: ${(err as Error).message}`);
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  // Select / Switch Diagram Type
  const handleSelectDiagramType = (type: DiagramType, startWithAI = false) => {
    setDiagramType(type);
    setNodes([]);
    setEdges([]);
    const defaultTitles: Record<DiagramType, string> = {
      system_design: 'Untitled Architecture',
      erd: 'Untitled Database ERD',
      flowchart: 'Untitled Flowchart',
    };
    setTitle(defaultTitles[type] || 'Untitled Diagram');
    setIsNewModalOpen(false);
    clearDiagramStorage();
    if (startWithAI) {
      setTimeout(() => setIsAIModalOpen(true), 120);
    }
  };

  // Reset / New Diagram
  const handleNewDiagram = () => {
    setIsNewModalOpen(true);
  };

  const downloadImage = useCallback((format: 'png' | 'svg') => {
    if (reactFlowWrapper.current === null) return;
    
    const filter = (node: HTMLElement) => {
      const exclusionClasses = ['react-flow__controls', 'react-flow__panel', 'export-buttons', 'theme-toggle', 'presenter-bar'];
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
      const exclusionClasses = ['react-flow__controls', 'react-flow__panel', 'export-buttons', 'theme-toggle', 'presenter-bar'];
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
    if (isPresenting) return;
    document.documentElement.classList.add('is-connecting');
  }, [isPresenting]);

  const onConnectEnd = useCallback(() => {
    document.documentElement.classList.remove('is-connecting');
  }, []);

  return (
    <div className={`flex flex-col h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden transition-colors ${isPresenting ? 'is-presenting' : ''}`}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".diaflow,.json,application/json"
        className="hidden"
      />

      {/* Header Panel (Hidden during presentation mode) */}
      {!isPresenting && (
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
                className="text-xs font-semibold px-2 py-1 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded border border-transparent hover:border-zinc-200 dark:border-zinc-700 outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-indigo-500 dark:focus:border-indigo-400 text-zinc-700 dark:text-zinc-200 transition-colors min-w-[160px] max-w-[240px] truncate"
                title="Click to rename diagram"
              />

              {/* Diagram Domain Pill Selector */}
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer group"
                title="Click to change diagram domain / start new"
              >
                {diagramType === 'erd' ? (
                  <Database size={13} className="text-emerald-500" />
                ) : diagramType === 'flowchart' ? (
                  <GitBranch size={13} className="text-amber-500" />
                ) : (
                  <Cloud size={13} className="text-indigo-500" />
                )}
                <span>
                  {diagramType === 'erd'
                    ? 'ER Diagram'
                    : diagramType === 'flowchart'
                    ? 'Flowchart'
                    : 'System Design'}
                </span>
                <span className="text-[10px] text-zinc-400">▾</span>
              </button>

              {/* Auto-save indicator */}
              <span className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-400 select-none">
                <span className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {isSaved ? 'Saved' : 'Saving...'}
              </span>
            </div>
          </div>
          
        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-2.5">
          {/* AI Copilot Drawer Toggle */}
          <button
            onClick={() => setIsCopilotOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isCopilotOpen
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="AI Architecture Copilot (Chat, Security Audit, Flow Review)"
          >
            <Bot size={14} className="text-indigo-500" />
            <span className="hidden md:inline">Copilot</span>
          </button>

          {/* Auto Layout Button */}
          <button
            onClick={() => handleAutoLayout('LR')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
            title="Auto-Layout into Clean Tiered Hierarchy"
          >
            <LayoutGrid size={13} className="text-zinc-500 dark:text-zinc-400" />
            <span className="hidden lg:inline">Layout</span>
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 my-auto" />

          {/* Present Button */}
          <button
            onClick={enterPresentMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
            title="Present Diagram (P key)"
          >
            <Play size={13} className="fill-current" />
            <span>Present</span>
          </button>

          {/* File Operations: New, Open, Save */}
          <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleNewDiagram}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              title="New Diagram"
            >
              <FilePlus size={13} className="text-zinc-500 dark:text-zinc-400" />
              <span className="hidden xl:inline">New</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              title="Open .diaflow file"
            >
              <FolderOpen size={13} className="text-zinc-500 dark:text-zinc-400" />
              <span className="hidden xl:inline">Open</span>
            </button>
            <button
              onClick={() => exportDiagramToFile(nodes, edges, title, getViewport(), diagramType)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors font-semibold cursor-pointer"
              title="Save Diagram (.diaflow)"
            >
              <Save size={13} />
              <span className="hidden xl:inline">Save</span>
            </button>
          </div>

          {/* Export & Clipboard */}
          <div className="flex items-center gap-1.5 export-buttons border-l border-zinc-200 dark:border-zinc-800 pl-2.5">
            <button 
              onClick={copyImage} 
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer"
              title="Copy to Clipboard"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              <span className="hidden 2xl:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button 
              onClick={() => downloadImage('png')} 
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer"
              title="Download PNG"
            >
              <DownloadCloud size={13} />
              <span className="hidden 2xl:inline">PNG</span>
            </button>
            <button 
              onClick={() => downloadImage('svg')} 
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer"
              title="Download SVG"
            >
              <DownloadCloud size={13} />
              <span className="hidden 2xl:inline">SVG</span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="theme-toggle flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors ml-0.5 cursor-pointer"
            title="Toggle theme"
          >
            {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
    )}
    
    {/* Workspace Body */}
    <div className="flex flex-1 min-h-0 w-full relative overflow-hidden">
      {/* Sidebar hidden in present mode */}
      {!isPresenting && (
        <Sidebar
          diagramType={diagramType}
          onChangeDiagramType={() => setIsNewModalOpen(true)}
        />
      )}

      {/* Main Flow Canvas */}
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
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable={!isPresenting}
          nodesConnectable={!isPresenting}
          elementsSelectable={!isPresenting}
          nodesFocusable={!isPresenting}
          edgesFocusable={!isPresenting}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
          selectionKeyCode={['Shift', 'Control', 'Meta']}
          selectNodesOnDrag={true}
          connectionRadius={32}
          connectionMode={ConnectionMode.Loose}
          proOptions={{ hideAttribution: true }}
          className={`transition-colors ${isDark ? 'dark' : ''} ${isPresenting ? 'is-presenting' : ''}`}
          defaultEdgeOptions={{
            type: diagramType === 'erd' ? 'straight' : 'smoothstep',
            data: { isStraight: diagramType === 'erd' },
            animated: diagramType !== 'erd',
            style: { stroke: diagramType === 'erd' ? '#71717a' : '#a1a1aa', strokeWidth: 2 },
            markerEnd: diagramType === 'erd' ? undefined : { type: MarkerType.ArrowClosed, color: '#a1a1aa' },
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          onEdgeDoubleClick={(_, edge) => {
            if (isPresenting) return;
            setEdges((eds) =>
              eds.map((e) =>
                e.id === edge.id
                  ? { ...e, data: { ...e.data, isEditing: true } }
                  : e
              )
            );
          }}
        >
          <Background color={isDark ? '#3f3f46' : '#d4d4d8'} gap={20} size={1} />
          {!isPresenting && (
            <Controls className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 !fill-zinc-600 dark:!fill-zinc-400 !text-zinc-600 dark:!text-zinc-400 shadow-xl" showInteractive={false} />
          )}
        </ReactFlow>

        {/* Floating Help & Shortcuts Widget */}
        {!isPresenting && (
          <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end">
            {/* Help Popover */}
            {showHelp && (
              <div className="mb-2.5 w-76 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3.5 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5 text-xs">
                    <HelpCircle size={14} className="text-indigo-500" />
                    Shortcuts & Tips
                  </span>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Box / Marquee Select</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">Shift + Drag</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Select Multiple</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">Shift / Ctrl + Click</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Select All</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">Ctrl / ⌘ + A</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Move Group</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Drag any selected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Present Mode</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">P</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Add / Edit Wire Label</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Double-click wire</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Delete Selected</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">Del / Backspace</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Save Diagram</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">Ctrl / ⌘ + S</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Edit Node Label</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Double-click node</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Change Icon & Color</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Click node icon</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Open Diagram</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Drag & drop .diaflow</span>
                  </div>
                </div>
              </div>
            )}

            {/* Small Help Icon Button */}
            <button
              onClick={() => setShowHelp((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-lg transition-all cursor-pointer ${
                showHelp
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
              title="Keyboard Shortcuts & Tips"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        )}

        {/* Floating Presenter Bar */}
        {isPresenting && (
          <div className="presenter-bar absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 px-1 truncate max-w-[200px]">
              {title}
            </span>
            
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

            <button
              onClick={() => zoomIn({ duration: 200 })}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => zoomOut({ duration: 200 })}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => fitView({ padding: 0.15, duration: 400 })}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full transition-colors"
              title="Fit View"
            >
              <Maximize2 size={13} />
              <span>Fit</span>
            </button>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={exitPresentMode}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors shadow-sm"
              title="Exit Presentation Mode (ESC)"
            >
              <X size={14} />
              <span>Exit</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Copilot Slide-over Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen && !isPresenting}
        onClose={() => setIsCopilotOpen(false)}
        nodes={nodes}
        edges={edges}
        title={title}
        onUpdateDiagram={(newNodes, newEdges) => {
          setNodes(newNodes);
          setEdges(newEdges);
          setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        aiConfig={aiConfig}
      />
    </div>

    {/* AI Prompt Modal (Text-to-Diagram) */}
    <AIPromptModal
      isOpen={isAIModalOpen}
      diagramType={diagramType}
      onClose={() => setIsAIModalOpen(false)}
      onApplyDiagram={(newNodes, newEdges, newTitle, summary) => {
        setNodes(newNodes);
        setEdges(newEdges);
        if (newTitle) setTitle(newTitle);
        setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 80);
      }}
      onOpenSettings={() => {
        setIsAIModalOpen(false);
        setIsSettingsOpen(true);
      }}
      aiConfig={aiConfig}
    />

      {/* AI Settings Modal (Multi-Provider Configuration) */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onSaveConfig={handleSaveAIConfig}
      />

      {/* New Diagram / Type Selector Modal */}
      <NewDiagramModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSelectType={handleSelectDiagramType}
      />
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

