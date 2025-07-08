import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import cytoscape from 'cytoscape';
import { GraphData } from './FileUploadModal'; // Import the interface

// Import dagre layout using ES6 imports
import dagreLayout from 'cytoscape-dagre';

// Register the dagre layout extension
cytoscape.use(dagreLayout);

interface GraphVisualizerProps {
  data: GraphData | null;
  isDarkMode: boolean;
  currentLayout: string;
  width?: string;
  height?: string;
  onNodeSelectionChange?: (nodeData: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
  } | null) => void;
}

// Expose these methods to parent component - UPDATED with shape functionality
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

// Layout definitions with their configurations
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

// Type for storing original node styles - UPDATED with shape
interface OriginalNodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  opacity: number;
  shape: string;
  width: string;
  height: string;
}

// Resize handle interface
interface ResizeHandle {
  id: string;
  nodeId: string;
  position: 'tl' | 'tr' | 'bl' | 'br'; // top-left, top-right, bottom-left, bottom-right
  x: number;
  y: number;
}

// Helper function to convert our shape names to Cytoscape shape names
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

// Helper function to get shape constraints
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

const GraphVisualizer = forwardRef<GraphVisualizerHandle, GraphVisualizerProps>(({ 
  data, 
  isDarkMode, 
  currentLayout,
  width = "100%", 
  height = "600px",
  onNodeSelectionChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);

  // Store original styles for reset functionality
  const originalStyles = useRef<Map<string, OriginalNodeStyle>>(new Map());
  
  // Resize state
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

  // Function to store original node styles - UPDATED with dimensions
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

  // Helper function to get selected node data for customization panel
  const getSelectedNodeData = (cy: cytoscape.Core) => {
    const selectedNodes = cy.$(':selected').nodes();
    if (selectedNodes.length === 1) {
      const node = selectedNodes[0];
      return {
        backgroundColor: node.style('background-color'),
        borderColor: node.style('border-color'),
        borderWidth: parseFloat(node.style('border-width')) || 2,
        opacity: parseFloat(node.style('opacity')) || 1
      };
    } else if (selectedNodes.length > 1) {
      const firstNode = selectedNodes[0];
      return {
        backgroundColor: firstNode.style('background-color'),
        borderColor: firstNode.style('border-color'),
        borderWidth: parseFloat(firstNode.style('border-width')) || 2,
        opacity: parseFloat(firstNode.style('opacity')) || 1
      };
    }
    return null;
  };

  // Function to create resize handles for selected nodes
  const createResizeHandles = (cy: cytoscape.Core) => {
    const selectedNodes = cy.$(':selected').nodes();
    const handles: ResizeHandle[] = [];

    selectedNodes.forEach(node => {
      const bb = node.renderedBoundingBox();
      const nodeId = node.id();
      
      // Create 4 corner handles
      const positions = [
        { pos: 'tl' as const, x: bb.x1, y: bb.y1 },
        { pos: 'tr' as const, x: bb.x2, y: bb.y1 },
        { pos: 'bl' as const, x: bb.x1, y: bb.y2 },
        { pos: 'br' as const, x: bb.x2, y: bb.y2 }
      ];

      positions.forEach(({ pos, x, y }) => {
        handles.push({
          id: `${nodeId}-${pos}`,
          nodeId,
          position: pos,
          x,
          y
        });
      });
    });

    setResizeHandles(handles);
  };

  // Function to clear resize handles
  const clearResizeHandles = () => {
    setResizeHandles([]);
  };

  // Function to handle mouse down on resize handle
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

    // Disable cytoscape panning during resize
    cyRef.current.panningEnabled(false);
    cyRef.current.zoomingEnabled(false);
  };

  // Function to handle mouse move during resize
  const handleResizeMove = (event: MouseEvent) => {
    if (!isDragging || !dragState || !cyRef.current) return;

    event.preventDefault();

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    
    // Get zoom level to adjust sensitivity
    const zoom = cyRef.current.zoom();
    const adjustedDeltaX = deltaX / zoom;
    const adjustedDeltaY = deltaY / zoom;

    // Calculate new dimensions based on handle position and shape constraints
    let newWidth = dragState.originalWidth;
    let newHeight = dragState.originalHeight;

    const constraints = getShapeConstraints(dragState.shape);
    const sensitivity = 2; // Reduce sensitivity for smoother resize

    // Apply resize based on handle position
    switch (dragState.position) {
      case 'br': // bottom-right
        newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalWidth + adjustedDeltaX / sensitivity));
        newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalHeight + adjustedDeltaY / sensitivity));
        break;
      case 'bl': // bottom-left
        newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalWidth - adjustedDeltaX / sensitivity));
        newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalHeight + adjustedDeltaY / sensitivity));
        break;
      case 'tr': // top-right
        newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalWidth + adjustedDeltaX / sensitivity));
        newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalHeight - adjustedDeltaY / sensitivity));
        break;
      case 'tl': // top-left
        newWidth = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalWidth - adjustedDeltaX / sensitivity));
        newHeight = Math.max(constraints.minSize, Math.min(constraints.maxSize, 
          dragState.originalHeight - adjustedDeltaY / sensitivity));
        break;
    }

    // Maintain aspect ratio for certain shapes
    if (constraints.maintainAspectRatio) {
      const aspectRatio = dragState.originalWidth / dragState.originalHeight;
      if (Math.abs(adjustedDeltaX) > Math.abs(adjustedDeltaY)) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
    }

    // Apply the new dimensions
    const node = cyRef.current.getElementById(dragState.nodeId);
    node.style({
      'width': `${newWidth}px`,
      'height': `${newHeight}px`
    });

    // Update resize handles positions
    createResizeHandles(cyRef.current);
  };

  // Function to handle mouse up to end resize
  const handleResizeEnd = () => {
    if (!cyRef.current) return;

    setIsDragging(false);
    setDragState(null);

    // Re-enable cytoscape panning
    cyRef.current.panningEnabled(true);
    cyRef.current.zoomingEnabled(true);

    // Update handles one final time
    createResizeHandles(cyRef.current);
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    applyLayout: (layoutKey: string) => {
      if (!cyRef.current || isLayoutRunning) return;
      
      setIsLayoutRunning(true);
      clearResizeHandles(); // Clear handles during layout change
      
      const layoutConfig = AVAILABLE_LAYOUTS[layoutKey as keyof typeof AVAILABLE_LAYOUTS]?.config;
      if (!layoutConfig) return;
      
      const layout = cyRef.current.layout(layoutConfig);
      
      layout.on('layoutstop', () => {
        setIsLayoutRunning(false);
        if (cyRef.current) {
          cyRef.current.fit();
          // Recreate handles for selected nodes after layout
          const selectedNodes = cyRef.current.$(':selected').nodes();
          if (selectedNodes.length > 0) {
            createResizeHandles(cyRef.current);
          }
        }
      });
      
      layout.run();
    },
    resetView: () => {
      if (cyRef.current) {
        cyRef.current.fit();
        cyRef.current.center();
        // Update handle positions after view reset
        if (resizeHandles.length > 0) {
          createResizeHandles(cyRef.current);
        }
      }
    },
    exportImage: (format: 'png' | 'jpg' = 'png') => {
      if (cyRef.current) {
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
      }
    },
    changeSelectedNodesColor: (color: string) => {
      if (cyRef.current) {
        const selectedNodes = cyRef.current.$(':selected').nodes();
        if (selectedNodes.length > 0) {
          selectedNodes.style('background-color', color);
          console.log(`Changed color of ${selectedNodes.length} selected nodes to ${color}`);
          
          if (onNodeSelectionChange) {
            onNodeSelectionChange(getSelectedNodeData(cyRef.current));
          }
        } else {
          console.log('No nodes selected for color change');
        }
      }
    },
    changeSelectedNodesBorder: (borderColor: string, borderWidth: number) => {
      if (cyRef.current) {
        const selectedNodes = cyRef.current.$(':selected').nodes();
        if (selectedNodes.length > 0) {
          selectedNodes.style('border-color', borderColor);
          selectedNodes.style('border-width', `${borderWidth}px`);
          console.log(`Changed border of ${selectedNodes.length} selected nodes to ${borderColor} with width ${borderWidth}px`);
          
          if (onNodeSelectionChange) {
            onNodeSelectionChange(getSelectedNodeData(cyRef.current));
          }
        } else {
          console.log('No nodes selected for border change');
        }
      }
    },
    changeSelectedNodesOpacity: (opacity: number) => {
      if (cyRef.current) {
        const selectedNodes = cyRef.current.$(':selected').nodes();
        if (selectedNodes.length > 0) {
          selectedNodes.style('opacity', opacity);
          console.log(`Changed opacity of ${selectedNodes.length} selected nodes to ${opacity}`);
          
          if (onNodeSelectionChange) {
            onNodeSelectionChange(getSelectedNodeData(cyRef.current));
          }
        } else {
          console.log('No nodes selected for opacity change');
        }
      }
    },
    changeSelectedNodesShape: (shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square') => {
      console.log('GraphVisualizer: changeSelectedNodesShape called with shape:', shape);
      
      if (cyRef.current) {
        const selectedNodes = cyRef.current.$(':selected').nodes();
        console.log('Selected nodes count:', selectedNodes.length);
        
        if (selectedNodes.length > 0) {
          const cytoscapeShape = convertShapeToCytoscape(shape);
          console.log('Converting shape:', shape, 'to Cytoscape shape:', cytoscapeShape);
          
          selectedNodes.forEach((node, index) => {
            console.log(`Processing node ${index + 1}:`, node.id());
            
            // Store original shape for constraints
            node.data('originalShape', shape);
            
            // Apply shape
            node.style('shape', cytoscapeShape);
            
            // Set dimensions based on shape with constraints
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
          
          // Update resize handles for new shape
          setTimeout(() => {
            if (cyRef.current) {
              cyRef.current.forceRender();
              createResizeHandles(cyRef.current);
            }
          }, 10);
          
          console.log(`✅ Changed shape of ${selectedNodes.length} selected nodes to ${shape}`);
          
          if (onNodeSelectionChange) {
            onNodeSelectionChange(getSelectedNodeData(cyRef.current));
          }
        } else {
          console.log('❌ No nodes selected for shape change');
          alert('Please select one or more nodes first by clicking on them, then click a shape button.');
        }
      } else {
        console.log('❌ Cytoscape instance not available');
      }
    },
    resetAllNodesToOriginal: () => {
      if (cyRef.current) {
        const allNodes = cyRef.current.nodes();
        allNodes.forEach(node => {
          const nodeId = node.id();
          const originalStyle = originalStyles.current.get(nodeId);
          if (originalStyle) {
            node.style('background-color', originalStyle.backgroundColor);
            node.style('border-color', originalStyle.borderColor);
            node.style('border-width', originalStyle.borderWidth);
            node.style('opacity', originalStyle.opacity);
            node.style('shape', originalStyle.shape);
            node.style('width', originalStyle.width);
            node.style('height', originalStyle.height);
            // Clear stored shape data
            node.removeData('originalShape');
          }
        });
        console.log(`Reset all ${allNodes.length} nodes to original style`);
        
        // Clear resize handles and update selection
        clearResizeHandles();
        if (onNodeSelectionChange) {
          onNodeSelectionChange(getSelectedNodeData(cyRef.current));
        }
      }
    }
  }));

  // Add global mouse event listeners for resize functionality
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      handleResizeMove(event);
    };

    const handleGlobalMouseUp = () => {
      handleResizeEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragState]);

  // Initialize or update the graph when data changes
  useEffect(() => {
    if (!data || !containerRef.current) {
      return;
    }

    setIsLoading(true);
    clearResizeHandles(); // Clear handles when data changes

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Convert our data format to Cytoscape format
    const elements = [
      // Add nodes
      ...data.nodes.map(node => ({
        data: {
          id: node.id,
          label: node.label || node.id,
          ...node
        }
      })),
      // Add edges
      ...data.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          ...edge
        }
      }))
    ];

    // Create new Cytoscape instance
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

    // Store original styles after creating the graph
    storeOriginalStyles(cyRef.current);

    // Add event listeners
    cyRef.current.on('tap', 'node', (event) => {
      const node = event.target;
      console.log('Node clicked:', node.data());
    });

    cyRef.current.on('tap', 'edge', (event) => {
      const edge = event.target;
      console.log('Edge clicked:', edge.data());
    });

    // Add event listener for selection changes
    cyRef.current.on('select', 'node', (event) => {
      const node = event.target;
      console.log('Node selected:', node.data().id);
      
      // Create resize handles for selected nodes
      createResizeHandles(cyRef.current!);
      
      if (onNodeSelectionChange) {
        onNodeSelectionChange(getSelectedNodeData(cyRef.current!));
      }
    });

    cyRef.current.on('unselect', 'node', (event) => {
      const node = event.target;
      console.log('Node unselected:', node.data().id);
      
      // Update resize handles
      createResizeHandles(cyRef.current!);
      
      if (onNodeSelectionChange) {
        onNodeSelectionChange(getSelectedNodeData(cyRef.current!));
      }
    });

    // Add event listener for clicking empty space to clear selection
    cyRef.current.on('tap', (event) => {
      if (event.target === cyRef.current) {
        console.log('Background clicked - clearing selection');
        clearResizeHandles();
        if (onNodeSelectionChange) {
          onNodeSelectionChange(null);
        }
      }
    });

    // Update resize handles on viewport changes (zoom/pan)
    cyRef.current.on('viewport', () => {
      if (resizeHandles.length > 0 && cyRef.current) {
        createResizeHandles(cyRef.current);
      }
    });

    // Fit the graph to the container
    cyRef.current.fit();
    setIsLoading(false);

    // Cleanup function
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      clearResizeHandles();
    };
  }, [data, isDarkMode, currentLayout, onNodeSelectionChange]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit();
        // Update resize handles after container resize
        if (resizeHandles.length > 0) {
          createResizeHandles(cyRef.current);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeHandles.length]);

  return (
    <div className="relative">
      {/* Loading overlay */}
      {(isLoading || isLayoutRunning) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-lg">
          <div className="text-white flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>{isLoading ? 'Loading graph...' : 'Applying layout...'}</span>
          </div>
        </div>
      )}

      {/* Graph container */}
      <div 
        ref={containerRef}
        className={`border rounded-lg ${
          isDarkMode ? 'border-gray-700' : 'border-gray-300'
        }`}
        style={{ 
          width: width, 
          height: height || "600px",
          minHeight: "500px"
        }}
      />

      {/* Resize handles overlay */}
      {resizeHandles.map((handle) => (
        <div
          key={handle.id}
          className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors z-20"
          style={{
            left: handle.x - 6, // Center the handle
            top: handle.y - 6,
            cursor: handle.position === 'tl' || handle.position === 'br' ? 'nw-resize' : 'ne-resize'
          }}
          onMouseDown={(e) => handleResizeStart(handle.id, handle.nodeId, handle.position, e.nativeEvent)}
        />
      ))}
    </div>
  );
});

GraphVisualizer.displayName = 'GraphVisualizer';

export default GraphVisualizer;