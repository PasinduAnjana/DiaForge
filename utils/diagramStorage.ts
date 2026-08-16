import { Node, Edge, Viewport } from 'reactflow';
import { DiaFlowDocumentSchema, DiaFlowDocument } from '@/schemas/diagram.schema';

const STORAGE_KEY = 'diaflow_saved_state';
const TITLE_STORAGE_KEY = 'diaflow_diagram_title';

export type { DiaFlowDocument };

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
    lastModified: new Date().toISOString(),
    nodes: nodes as any,
    edges: edges as any,
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
 * Validates and parses raw JSON string into DiaFlowDocument using Zod schema
 */
export const parseDiagramJSON = (jsonString: string): DiaFlowDocument => {
  try {
    const raw = JSON.parse(jsonString);
    const result = DiaFlowDocumentSchema.safeParse(raw);

    if (!result.success) {
      const errorMsg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Diagram validation failed: ${errorMsg}`);
    }

    return result.data as unknown as DiaFlowDocument;
  } catch (error) {
    throw new Error(`Failed to parse diagram JSON: ${(error as Error).message}`);
  }
};

/**
 * Reads a File object and returns validated DiaFlowDocument
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
    reader.onerror = () => reject(new Error('Failed to read diagram file.'));
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
      lastModified: new Date().toISOString(),
      nodes: nodes as any,
      edges: edges as any,
      viewport,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    localStorage.setItem(TITLE_STORAGE_KEY, diagramName);
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
};

/**
 * LocalStorage Load with Zod Safe Parsing
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
