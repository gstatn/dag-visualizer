import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import cytoscape from 'cytoscape';
import { GraphData } from './FileUploadModal'; // shared data shape

// Layout extension: dagre
import dagreLayout from 'cytoscape-dagre';
cytoscape.use(dagreLayout);

// ----- Props & public handle -----
interface GraphVisualizerProps {
  data: GraphData | null;   // graph data to render
  isDarkMode: boolean;      // theme flag for styles
  currentLayout: string;    // active layout key
  width?: string;           // container width
  height?: string;          // container height
  onNodeSelectionChange?: (nodeData: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
  } | null) => void;        // emits selected-node style snapshot
}

// Public methods exposed to parent via ref
export interface GraphVisualizerHandle {
  applyLayout: (layoutKey: string) => void;
  resetView: () => void;
  exportImage: (format?: 'png' | 'jpg') => void;
  changeSelectedNodesColor: (color: string) => void;
  changeSelectedNodesBorder: (borderColor: string, borderWidth: number) => void;
  changeSelectedNodesOpacity: (opacity: number) => void;
  changeSelectedNodesShape: (shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square') => void;
  resetAllNodesToOriginal: () => void;
}

// ----- Layout presets -----
const AVAILABLE_LAYOUTS = {
  dagre: {
    name: 'Dagre',
    description: 'Hierarchical layout ideal for DAGs and trees',
    config: {
      name: 'dagre',
      rankDir: 'TB',
      spacingFactor: 1.5,
      nodeDimensionsIncludeLabels: true
    } as cytoscape.LayoutOptions
  },
  circle: {
    name: 'Circle',
    description: 'Arranges nodes in a circle, good for showing connections',
    config: {
      name: 'circle',
      radius: Math.min(300, window.innerWidth / 6),
      startAngle: -Math.PI / 2
    } as cytoscape.LayoutOptions
  },
  concentric: {
    name: 'Concentric',
    description: 'Concentric circles based on node importance',
    config: {
      name: 'concentric',
      concentric: (node: cytoscape.NodeSingular) => node.degree(false),
      levelWidth: () => 1,
      spacingFactor: 1.5,
      minNodeSpacing: 50
    } as cytoscape.LayoutOptions
  },
  grid: {
    name: 'Grid',
    description: 'Organized grid layout, clean and systematic',
    config: {
      name: 'grid',
      rows: undefined,
      cols: undefined,
      spacingFactor: 1.2
    } as cytoscape.LayoutOptions
  },
  breadthfirst: {
    name: 'Breadthfirst',
    description: 'Tree-like layout using breadth-first traversal',
    config: {
      name: 'breadthfirst',
      directed: true,
      spacingFactor: 1.5,
      avoidOverlap: true
    } as cytoscape.LayoutOptions
  },
  cose: {
    name: 'CoSE',
    description: 'Force-directed layout, good for showing clusters',
    config: {
      name: 'cose',
      idealEdgeLength: 80,
      nodeOverlap: 10,
      refresh: 10,
      fit: true,
      padding: 20,
      randomize: false,
      componentSpacing: 80,
      nodeRepulsion: 200000,
      edgeElasticity: 50,
      nestingFactor: 1,
      gravity: 40,
      numIter: 600,
      initialTemp: 100,
      coolingFactor: 0.9,
      minTemp: 1.0,
      animate: false
    } as cytoscape.LayoutOptions
  }
} as const;

// Original styles for reset (includes size/shape)
interface OriginalNodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  opacity: number;
  shape: string;
  width: string;
  height: string;
}

// Small handle used to resize nodes via overlay UI
interface ResizeHandle {
  id: string;
  nodeId: string;
  position: 'tl' | 'tr' | 'bl' | 'br';
  x: number;
  y: number;
}

// Map app shapes to Cytoscape names
const convertShapeToCytoscape = (shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square'): string => {
  console.log('Converting shape:', shape);
  switch (shape) {
    case 'circle':
      return 'ellipse';
    case 'rectangle':
      return 'rectangle';
    case 'diamond':
      return 'diamond';
    case 'ellipse':
      return 'ellipse';
    case 'square':
      return 'rectangle';
    default:
      console.warn('Unknown shape:', shape, 'defaulting to ellipse');
      return 'ellipse';
  }
};

// Constraints per shape for resizing
const getShapeConstraints = (shape: string) => {
  switch (shape) {
    case 'circle':
    case 'square':
      return { maintainAspectRatio: true, minSize: 30, maxSize: 200 };
    case 'diamond':
      return { maintainAspectRatio: true, minSize: 30, maxSize: 200 };
    default:
      return { maintainAspectRatio: false, minSize: 30, maxSize: 200 };
  }
};

const GraphVisualizer = forwardRef<GraphVisualizerHandle, GraphVisualizerProps>(
  ({ data, isDarkMode, currentLayout, width = "100%", height = "600px", onNodeSelectionChange }, ref) => {
    // ----- Refs & local state -----
    const containerRef = useRef<HTMLDivElement>(null);          // DOM container for Cytoscape
    const cyRef = useRef<cytoscape.Core | null>(null);          // Cytoscape instance
    const [isLoading, setIsLoading] = useState(false);          // initial draw/loading flag
    const [isLayoutRunning, setIsLayoutRunning] = useState(false); // layout running flag

    const originalStyles = useRef<Map<string, OriginalNodeStyle>>(new Map()); // saved node styles

    // Resize overlay state
    const [resizeHandles, setResizeHandles] = useState<ResizeHandle[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState<{
      handleId: string;
      nodeId: string;
      position: string;
      startX: number;
      startY: number;
      originalWidth: number;
      originalHeight: number;
      shape: string;
    } | null>(null);

    // Save original styles for each node (used by "reset all")
    const storeOriginalStyles = (cy: cytoscape.Core) => {
      cy.nodes().forEach(node => {
        const nodeId = node.id();
        originalStyles.current.set(nodeId, {
          backgroundColor: node.style('background-color'),
          borderColor: node.style('border-color'),
          borderWidth: node.style('border-width'),
          opacity: parseFloat(node.style('opacity')) || 1,
          shape: node.style('shape'),
          width: node.style('width'),
          height: node.style('height')
        });
      });
    };

    // Read styles from current selection (for side panel defaults)
    const getSelectedNodeData = (cy: cytoscape.Core) => {
      const selectedNodes = cy.$(':selected').nodes();
      if (selectedNodes.length === 0) return null;

      const node = selectedNodes[0]; // sample first for simplicity
      return {
        backgroundColor: node.style('background-color'),
        borderColor: node.style('border-color'),
        borderWidth: parseFloat(node.style('border-width')) || 2,
        opacity: parseFloat(node.style('opacity')) || 1
      };
    };

    // Build 4 corner handles for each selected node
    const createResizeHandles = (cy: cytoscape.Core) => {
      const selectedNodes = cy.$(':selected').nodes();
      const handles: ResizeHandle[] = [];

      selectedNodes.forEach(node => {
        const bb = node.renderedBoundingBox();
        const nodeId = node.id();

        const positions = [
          { pos: 'tl' as const, x: bb.x1, y: bb.y1 },
          { pos: 'tr' as const, x: bb.x2, y: bb.y1 },
          { pos: 'bl' as const, x: bb.x1, y: bb.y2 },
          { pos: 'br' as const, x: bb.x2, y: bb.y2 }
        ];

        positions.forEach(({ pos, x, y }) => {
          handles.push({ id: `${nodeId}-${pos}`, nodeId, position: pos, x, y });
        });
      });

      setResizeHandles(handles);
    };

    // Clear all handles
    const clearResizeHandles = () => {
      setResizeHandles([]);
    };

    // Start node resize
    const handleResizeStart = (handleId: string, nodeId: string, position: string, event: MouseEvent) => {
      if (!cyRef.current) return;

      event.preventDefault();
      event.stopPropagation();

      const node = cyRef.current.getElementById(nodeId);
      if (!node.length) return;

      const currentWidth = parseFloat(node.style('width'));
      const currentHeight = parseFloat(node.style('height'));
      const shape = node.data('originalShape') || node.style('shape');

      setIsDragging(true);
      setDragState({
        handleId,
        nodeId,
        position,
        startX: event.clientX,
        startY: event.clientY,
        originalWidth: currentWidth,
        originalHeight: currentHeight,
        shape
      });

      // Disable pan/zoom during drag
      cyRef.current.panningEnabled(false);
      cyRef.current.zoomingEnabled(false);
    };

    // Continue node resize
    const handleResizeMove = (event: MouseEvent) => {
      if (!isDragging || !dragState || !cyRef.current) return;

      event.preventDefault();

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      // Adjust deltas by zoom factor for consistent feel
      const zoom = cyRef.current.zoom();
      const adjustedDeltaX = deltaX / zoom;
      const adjustedDeltaY = deltaY / zoom;

      let newWidth = dragState.originalWidth;
      let newHeight = dragState.originalHeight;

      const constraints = getShapeConstraints(dragState.shape);
      const sensitivity = 2; // smooth out changes

      switch (dragState.position) {
        case 'br':
          newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalWidth + adjustedDeltaX / sensitivity));
          newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalHeight + adjustedDeltaY / sensitivity));
          break;
        case 'bl':
          newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalWidth - adjustedDeltaX / sensitivity));
          newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalHeight + adjustedDeltaY / sensitivity));
          break;
        case 'tr':
          newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalWidth + adjustedDeltaX / sensitivity));
          newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalHeight - adjustedDeltaY / sensitivity));
          break;
        case 'tl':
          newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalWidth - adjustedDeltaX / sensitivity));
          newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, dragState.originalHeight - adjustedDeltaY / sensitivity));
          break;
      }

      // Keep aspect ratio if required
      if (constraints.maintainAspectRatio) {
        const aspectRatio = dragState.originalWidth / dragState.originalHeight;
        if (Math.abs(adjustedDeltaX) > Math.abs(adjustedDeltaY)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }

      // Apply new size
      const node = cyRef.current.getElementById(dragState.nodeId);
      node.style({ width: `${newWidth}px`, height: `${newHeight}px` });

      // Refresh handles position
      createResizeHandles(cyRef.current);
    };

    // End node resize
    const handleResizeEnd = () => {
      if (!cyRef.current) return;

      setIsDragging(false);
      setDragState(null);

      cyRef.current.panningEnabled(true);
      cyRef.current.zoomingEnabled(true);

      createResizeHandles(cyRef.current);
    };

    // ----- Public API via ref -----
    useImperativeHandle(ref, () => ({
      applyLayout: (layoutKey: string) => {
        if (!cyRef.current || isLayoutRunning) return;

        setIsLayoutRunning(true);
        clearResizeHandles();

        const layoutConfig = AVAILABLE_LAYOUTS[layoutKey as keyof typeof AVAILABLE_LAYOUTS]?.config;
        if (!layoutConfig) return;

        const layout = cyRef.current.layout(layoutConfig);

        layout.on('layoutstop', () => {
          setIsLayoutRunning(false);
          if (cyRef.current) {
            cyRef.current.fit();
            const selected = cyRef.current.$(':selected').nodes();
            if (selected.length > 0) createResizeHandles(cyRef.current);
          }
        });

        layout.run();
      },

      resetView: () => {
        if (!cyRef.current) return;
        cyRef.current.fit();
        cyRef.current.center();
        if (resizeHandles.length > 0) createResizeHandles(cyRef.current);
      },

      exportImage: (format: 'png' | 'jpg' = 'png') => {
        if (!cyRef.current) return;

        const dataUrl = cyRef.current.png({
          output: 'blob',
          bg: isDarkMode ? '#1F2937' : '#FFFFFF',
          full: true
        }) as Blob;

        const url = URL.createObjectURL(dataUrl);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graph-${currentLayout}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },

      changeSelectedNodesColor: (color: string) => {
        if (!cyRef.current) return;

        const selectedNodes = cyRef.current.$(':selected').nodes();
        if (selectedNodes.length === 0) {
          console.log('No nodes selected for color change');
          return;
        }

        selectedNodes.style('background-color', color);
        console.log(`Changed color of ${selectedNodes.length} selected nodes to ${color}`);

        onNodeSelectionChange?.(getSelectedNodeData(cyRef.current));
      },

      changeSelectedNodesBorder: (borderColor: string, borderWidth: number) => {
        if (!cyRef.current) return;

        const selectedNodes = cyRef.current.$(':selected').nodes();
        if (selectedNodes.length === 0) {
          console.log('No nodes selected for border change');
          return;
        }

        selectedNodes.style('border-color', borderColor);
        selectedNodes.style('border-width', `${borderWidth}px`);
        console.log(`Changed border of ${selectedNodes.length} selected nodes to ${borderColor} with width ${borderWidth}px`);

        onNodeSelectionChange?.(getSelectedNodeData(cyRef.current));
      },

      changeSelectedNodesOpacity: (opacity: number) => {
        if (!cyRef.current) return;

        const selectedNodes = cyRef.current.$(':selected').nodes();
        if (selectedNodes.length === 0) {
          console.log('No nodes selected for opacity change');
          return;
        }

        selectedNodes.style('opacity', opacity);
        console.log(`Changed opacity of ${selectedNodes.length} selected nodes to ${opacity}`);

        onNodeSelectionChange?.(getSelectedNodeData(cyRef.current));
      },

      changeSelectedNodesShape: (shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square') => {
        console.log('GraphVisualizer: changeSelectedNodesShape called with shape:', shape);

        if (!cyRef.current) return;

        const selectedNodes = cyRef.current.$(':selected').nodes();
        console.log('Selected nodes count:', selectedNodes.length);
        if (selectedNodes.length === 0) {
          console.log('❌ No nodes selected for shape change');
          alert('Please select one or more nodes first by clicking on them, then click a shape button.');
          return;
        }

        const cytoscapeShape = convertShapeToCytoscape(shape);
        console.log('Converting shape:', shape, 'to Cytoscape shape:', cytoscapeShape);

        selectedNodes.forEach((node, index) => {
          console.log(`Processing node ${index + 1}:`, node.id());

          // Keep app-shape in data for constraints
          node.data('originalShape', shape);

          // Apply shape to style
          node.style('shape', cytoscapeShape);

          // Reasonable defaults per shape
          const constraints = getShapeConstraints(shape);
          if (constraints.maintainAspectRatio) {
            node.style('width', '60px');
            node.style('height', '60px');
          } else if (shape === 'ellipse') {
            node.style('width', '80px');
            node.style('height', '50px');
          } else if (shape === 'rectangle') {
            node.style('width', '80px');
            node.style('height', '50px');
          }

          console.log(`Applied shape to node ${node.id()}: ${cytoscapeShape}`);
        });

        // Update overlay for new sizes
        setTimeout(() => {
          if (cyRef.current) {
            cyRef.current.forceRender?.();
            createResizeHandles(cyRef.current);
          }
        }, 10);

        console.log(`✅ Changed shape of ${selectedNodes.length} selected nodes to ${shape}`);
        onNodeSelectionChange?.(getSelectedNodeData(cyRef.current));
      },

      resetAllNodesToOriginal: () => {
        if (!cyRef.current) return;

        const allNodes = cyRef.current.nodes();
        allNodes.forEach(node => {
          const nodeId = node.id();
          const originalStyle = originalStyles.current.get(nodeId);
          if (!originalStyle) return;

          node.style('background-color', originalStyle.backgroundColor);
          node.style('border-color', originalStyle.borderColor);
          node.style('border-width', originalStyle.borderWidth);
          node.style('opacity', originalStyle.opacity);
          node.style('shape', originalStyle.shape);
          node.style('width', originalStyle.width);
          node.style('height', originalStyle.height);

          node.removeData('originalShape');
        });

        console.log(`Reset all ${allNodes.length} nodes to original style`);

        clearResizeHandles();
        onNodeSelectionChange?.(getSelectedNodeData(cyRef.current));
      }
    }));

    // Global mouse listeners for resizing
    useEffect(() => {
      const handleGlobalMouseMove = (event: MouseEvent) => handleResizeMove(event);
      const handleGlobalMouseUp = () => handleResizeEnd();

      if (isDragging) {
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
      }
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }, [isDragging, dragState]);

    // Create / update Cytoscape when data or visuals change
    useEffect(() => {
      if (!data || !containerRef.current) return;

      setIsLoading(true);
      clearResizeHandles();

      // Tear down old instance if present
      if (cyRef.current) cyRef.current.destroy();

      // Convert GraphData -> Cytoscape elements
      const elements = [
        ...data.nodes.map(node => ({
          data: { id: node.id, label: node.label || node.id, ...node }
        })),
        ...data.edges.map(edge => ({
          data: { id: edge.id, source: edge.source, target: edge.target, label: edge.label, ...edge }
        }))
      ];

      // Build Cytoscape core
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': isDarkMode ? '#3B82F6' : '#2563EB',
              'label': 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': isDarkMode ? '#F8FAFC' : '#1E293B',
              'font-size': '12px',
              'font-weight': 'bold',
              'width': '60px',
              'height': '60px',
              'border-width': '2px',
              'border-color': isDarkMode ? '#1E40AF' : '#1D4ED8',
              'text-wrap': 'wrap',
              'text-max-width': '80px',
              'opacity': 1,
              'shape': 'ellipse'
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': '4px',
              'border-color': '#FF0000',
              'border-style': 'solid',
              'overlay-color': '#FF0000',
              'overlay-opacity': 0.15
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': isDarkMode ? '#6B7280' : '#9CA3AF',
              'target-arrow-color': isDarkMode ? '#6B7280' : '#9CA3AF',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'text-rotation': 'autorotate',
              'font-size': '10px',
              'color': isDarkMode ? '#D1D5DB' : '#4B5563',
              'text-background-color': isDarkMode ? '#1F2937' : '#F9FAFB',
              'text-background-opacity': 0.8,
              'text-background-padding': '2px'
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'line-color': '#FF0000',
              'target-arrow-color': '#FF0000',
              'width': 4
            }
          }
        ],
        layout: AVAILABLE_LAYOUTS[currentLayout as keyof typeof AVAILABLE_LAYOUTS]?.config || AVAILABLE_LAYOUTS.dagre.config,
        userZoomingEnabled: true,
        wheelSensitivity: 5,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        selectionType: 'additive',
        hideEdgesOnViewport: data.edges.length > 100,
        hideLabelsOnViewport: data.nodes.length > 50,
        pixelRatio: 'auto'
      });

      // Save original styles once graph is ready
      storeOriginalStyles(cyRef.current);

      // Basic tap diagnostics
      cyRef.current.on('tap', 'node', (event) => {
        const node = event.target;
        console.log('Node clicked:', node.data());
      });
      cyRef.current.on('tap', 'edge', (event) => {
        const edge = event.target;
        console.log('Edge clicked:', edge.data());
      });

      // Selection changes -> update handles + emit style snapshot
      cyRef.current.on('select', 'node', (event) => {
        const node = event.target;
        console.log('Node selected:', node.data().id);
        createResizeHandles(cyRef.current!);
        onNodeSelectionChange?.(getSelectedNodeData(cyRef.current!));
      });

      cyRef.current.on('unselect', 'node', (event) => {
        const node = event.target;
        console.log('Node unselected:', node.data().id);
        createResizeHandles(cyRef.current!);
        onNodeSelectionChange?.(getSelectedNodeData(cyRef.current!));
      });

      // Clicking empty space clears selection
      cyRef.current.on('tap', (event) => {
        if (event.target === cyRef.current) {
          console.log('Background clicked - clearing selection');
          clearResizeHandles();
          onNodeSelectionChange?.(null);
        }
      });

      // Keep handles aligned during pan/zoom
      cyRef.current.on('viewport', () => {
        if (resizeHandles.length > 0 && cyRef.current) createResizeHandles(cyRef.current);
      });

      // Initial fit
      cyRef.current.fit();
      setIsLoading(false);

      // Cleanup on re-init/unmount
      return () => {
        if (cyRef.current) {
          cyRef.current.destroy();
          cyRef.current = null;
        }
        clearResizeHandles();
      };
    }, [data, isDarkMode, currentLayout, onNodeSelectionChange]);

    // Window resize -> resize/fit and refresh handles
    useEffect(() => {
      const handleResize = () => {
        if (!cyRef.current) return;
        cyRef.current.resize();
        cyRef.current.fit();
        if (resizeHandles.length > 0) createResizeHandles(cyRef.current);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [resizeHandles.length]);

    // ----- Render -----
    return (
      <div className="relative">
        {/* Busy overlay for load/layout */}
        {(isLoading || isLayoutRunning) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-lg">
            <div className="text-white flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>{isLoading ? 'Loading graph...' : 'Applying layout...'}</span>
            </div>
          </div>
        )}

        {/* Cytoscape container */}
        <div
          ref={containerRef}
          className={`border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
          style={{ width: width, height: height || "600px", minHeight: "500px" }}
        />

        {/* Resize handles overlay (absolute to page; positions use rendered coords) */}
        {resizeHandles.map((handle) => (
          <div
            key={handle.id}
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors z-20"
            style={{
              left: handle.x - 6, // center on point
              top: handle.y - 6,
              cursor: handle.position === 'tl' || handle.position === 'br' ? 'nw-resize' : 'ne-resize'
            }}
            onMouseDown={(e) => handleResizeStart(handle.id, handle.nodeId, handle.position, e.nativeEvent)}
          />
        ))}
      </div>
    );
  }
);

GraphVisualizer.displayName = 'GraphVisualizer';

export default GraphVisualizer;
