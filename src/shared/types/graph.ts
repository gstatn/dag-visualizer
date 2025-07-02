// shared/types/graph.ts
export interface GraphData {
  nodes: Array<{
    id: string;
    label?: string;
    [key: string]: string | number | boolean | undefined;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    [key: string]: string | number | boolean | undefined;
  }>;
  metadata?: {
    fileType: string;
    fileName: string;
    nodeCount: number;
    edgeCount: number;
  };
}

export interface GraphVisualizerHandle {
  applyLayout: (layoutKey: string) => void;
  resetView: () => void;
  exportImage: (format?: 'png' | 'jpg') => void;
}