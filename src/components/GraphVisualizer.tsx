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
      nodeOverlap: 10, //  Node repulsion (overlapping) multiplier
      refresh: 10,
      fit: true,
      padding: 20,
      randomize: false,
      componentSpacing: 80,
      nodeRepulsion: 200000,
      edgeElasticity: 50,
      nestingFactor: 1, // controls clusters the higher the more pull toward center
      gravity: 40,
      numIter: 600,
      initialTemp: 100, // Initial temperature (maximum node displacement)
      coolingFactor: 0.9,  // Cooling factor (how the temperature is reduced between consecutive iterations
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
}

// Helper function to convert our shape names to Cytoscape shape names
const convertShapeToCytoscape = (shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'square'): string => {
  console.log('Converting shape:', shape);
  // Cytoscape.js supported shapes: ellipse, triangle, rectangle, roundrectangle, 
  // bottomroundrectangle, cutrectangle, barrel, rhomboid, diamond, pentagon, 
  // hexagon, concavehexagon, heptagon, octagon, star, tag, vee
  switch (shape) {
    case 'circle':
      return 'ellipse'; // Will be made circular with equal width/height
    case 'rectangle':
      return 'rectangle';
    case 'diamond':
      return 'diamond';
    case 'ellipse':
      return 'ellipse';
    case 'square':
      return 'rectangle'; // Will be made square with equal width/height
    default:
      console.warn('Unknown shape:', shape, 'defaulting to ellipse');
      return 'ellipse';
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

  // Function to store original node styles - UPDATED with shape
  const storeOriginalStyles = (cy: cytoscape.Core) => {
    cy.nodes().forEach(node => {
      const nodeId = node.id();
      originalStyles.current.set(nodeId, {
        backgroundColor: node.style('background-color'),
        borderColor: node.style('border-color'),
        borderWidth: node.style('border-width'),
        opacity: parseFloat(node.style('opacity')) || 1,
        shape: node.style('shape')
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
      // Multiple nodes selected - could return average values or first node's values
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

  // Expose methods to parent component via ref - UPDATED with shape functionality
  useImperativeHandle(ref, () => ({
    applyLayout: (layoutKey: string) => {
      if (!cyRef.current || isLayoutRunning) return;
      
      setIsLayoutRunning(true);
      
      const layoutConfig = AVAILABLE_LAYOUTS[layoutKey as keyof typeof AVAILABLE_LAYOUTS]?.config;
      if (!layoutConfig) return;
      
      const layout = cyRef.current.layout(layoutConfig);
      
      layout.on('layoutstop', () => {
        setIsLayoutRunning(false);
        if (cyRef.current) {
          cyRef.current.fit();
        }
      });
      
      layout.run();
    },
    resetView: () => {
      if (cyRef.current) {
        cyRef.current.fit();
        cyRef.current.center();
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
          
          // Update customization panel with new data
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
          
          // Update customization panel with new data
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
          
          // Update customization panel with new data
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
            
            // Apply shape directly - one property at a time to ensure it works
            node.style('shape', cytoscapeShape);
            
            // Set dimensions based on shape
            if (shape === 'square') {
              node.style('width', '60px');
              node.style('height', '60px');
            } 
            else if (shape === 'circle') {
              node.style('width', '60px');
              node.style('height', '60px');
            }
            else if (shape === 'ellipse') {
              node.style('width', '80px');
              node.style('height', '50px');
            }
            else if (shape === 'rectangle') {
              node.style('width', '80px');
              node.style('height', '50px');
            }
            else if (shape === 'diamond') {
              node.style('width', '60px');
              node.style('height', '60px');
            }
            
            console.log(`Applied shape to node ${node.id()}: ${cytoscapeShape}`);
            console.log(`Node ${node.id()} current shape after change:`, node.style('shape'));
            console.log(`Node ${node.id()} current width:`, node.style('width'));
            console.log(`Node ${node.id()} current height:`, node.style('height'));
          });
          
          // Force multiple re-renders to ensure the change is visible
          setTimeout(() => {
            if (cyRef.current) {
              cyRef.current.forceRender();
              cyRef.current.resize();
            }
          }, 10);
          
          console.log(`✅ Changed shape of ${selectedNodes.length} selected nodes to ${shape}`);
          
          // Update customization panel with new data
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
            // Reset dimensions to default
            node.style('width', '60px');
            node.style('height', '60px');
          }
        });
        console.log(`Reset all ${allNodes.length} nodes to original style`);
        
        // Update customization panel after reset
        if (onNodeSelectionChange) {
          onNodeSelectionChange(getSelectedNodeData(cyRef.current));
        }
      }
    }
  }));

  // Initialize or update the graph when data changes
  useEffect(() => {
    if (!data || !containerRef.current) {
      return;
    }

    setIsLoading(true);

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
            'shape': 'ellipse' // Default shape
          }
        },
        {
          selector: 'node:selected',
          style: {
            // Keep border visible when selected with RED color
            'border-width': '4px',
            'border-color': '#FF0000', // Bright red border for selected nodes
            'border-style': 'solid',
            // Add an overlay color to make selection more visible
            'overlay-color': '#FF0000', // Bright red overlay
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
            'line-color': '#FF0000', // Bright red for selected edges
            'target-arrow-color': '#FF0000', // Bright red arrows
            'width': 4
          }
        }
      ],
      layout: AVAILABLE_LAYOUTS[currentLayout as keyof typeof AVAILABLE_LAYOUTS]?.config || AVAILABLE_LAYOUTS.dagre.config,
      // Interaction options
      userZoomingEnabled: true,
      wheelSensitivity: 5,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'additive', // Changed to additive to allow multiple selection
      // Performance options for large graphs
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

    // Add event listener for selection changes to update customization panel
    cyRef.current.on('select', 'node', (event) => {
      const node = event.target;
      console.log('Node selected:', node.data().id);
      
      // Update customization panel with selected node data
      if (onNodeSelectionChange) {
        onNodeSelectionChange(getSelectedNodeData(cyRef.current!));
      }
    });

    cyRef.current.on('unselect', 'node', (event) => {
      const node = event.target;
      console.log('Node unselected:', node.data().id);
      
      // Update customization panel with remaining selected node data
      if (onNodeSelectionChange) {
        onNodeSelectionChange(getSelectedNodeData(cyRef.current!));
      }
    });

    // Add event listener for clicking empty space to clear selection
    cyRef.current.on('tap', (event) => {
      // Only trigger if clicking on the background (not on a node or edge)
      if (event.target === cyRef.current) {
        console.log('Background clicked - clearing selection');
        if (onNodeSelectionChange) {
          onNodeSelectionChange(null);
        }
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
    };
  }, [data, isDarkMode, currentLayout, onNodeSelectionChange]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    </div>
  );
});

GraphVisualizer.displayName = 'GraphVisualizer';

export default GraphVisualizer;