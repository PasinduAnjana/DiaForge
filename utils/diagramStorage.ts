import { Node, Edge, Viewport } from 'reactflow';

export interface DiaFlowDocument {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
}

const STORAGE_KEY = 'diaflow_saved_state';
const TITLE_STORAGE_KEY = 'diaflow_diagram_title';

/**
 * Exports current nodes and edges to a downloadable .diaflow (JSON) file
 */
export const exportDiagramToFile = (
  nodes: Node[],
  edges: Edge[],
  diagramName: string = 'architecture-diagram',
  viewport?: Viewport
) => {
  const docData: DiaFlowDocument = {
    version: '1.0',
    name: diagramName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
    viewport,
  };

  const jsonString = JSON.stringify(docData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = window.document.createElement('a');
  const safeFilename = (diagramName.trim() || 'architecture-diagram')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');
  link.download = `${safeFilename}.diaflow`;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Validates and parses raw JSON string into DiaFlowDocument
 */
export const parseDiagramJSON = (jsonString: string): DiaFlowDocument => {
  try {
    const data = JSON.parse(jsonString);

    // Support both standard { nodes, edges } and full DiaFlowDocument
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('Invalid diagram file: missing nodes or edges array.');
    }

    return {
      version: data.version || '1.0',
      name: data.name || 'Imported Diagram',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: data.nodes,
      edges: data.edges,
      viewport: data.viewport,
    };
  } catch (error) {
    throw new Error(`Failed to parse diagram JSON: ${(error as Error).message}`);
  }
};

/**
 * Reads a File object and returns parsed DiaFlowDocument
 */
export const readDiagramFile = (file: File): Promise<DiaFlowDocument> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const doc = parseDiagramJSON(text);
        resolve(doc);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
};

/**
 * LocalStorage Auto-Save
 */
export const saveDiagramToStorage = (
  nodes: Node[],
  edges: Edge[],
  diagramName: string = 'Untitled Diagram',
  viewport?: Viewport
) => {
  if (typeof window === 'undefined') return;

  try {
    const doc: DiaFlowDocument = {
      version: '1.0',
      name: diagramName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      viewport,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    localStorage.setItem(TITLE_STORAGE_KEY, diagramName);
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
};

/**
 * LocalStorage Load
 */
export const loadDiagramFromStorage = (): DiaFlowDocument | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseDiagramJSON(raw);
  } catch (err) {
    console.warn('LocalStorage load failed:', err);
    return null;
  }
};

/**
 * LocalStorage Clear
 */
export const clearDiagramStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('LocalStorage clear failed:', err);
  }
};
