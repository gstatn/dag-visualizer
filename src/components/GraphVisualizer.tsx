import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { GraphData } from './FileUploadModal'; // Import the interface

// Import dagre layout using ES6 imports
import dagreLayout from 'cytoscape-dagre';

// Register the dagre layout extension
cytoscape.use(dagreLayout);

interface GraphVisualizerProps {
  data: GraphData | null;
  isDarkMode: boolean;
  width?: string;
  height?: string;
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
      nestingFactor: 1.2,
      gravity: 40,
      numIter: 100,        // Reduced from 1000
      initialTemp: 100,    // Reduced from 200
      coolingFactor: 0.9,  // Faster cooling
      minTemp: 1.0,
      animate: false       // Disable animation for faster completion
    } as cytoscape.LayoutOptions
  }
} as const;

type LayoutKey = keyof typeof AVAILABLE_LAYOUTS;

const GraphVisualizer = ({ 
  data, 
  isDarkMode, 
  width = "100%", 
  height = "600px" 
}: GraphVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutKey>('dagre');
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);

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
          ...node // Include any additional properties
        }
      })),
      // Add edges
      ...data.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          ...edge // Include any additional properties
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
            'text-max-width': '80px'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': isDarkMode ? '#EF4444' : '#DC2626',
            'border-color': isDarkMode ? '#B91C1C' : '#991B1B'
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
            'line-color': isDarkMode ? '#EF4444' : '#DC2626',
            'target-arrow-color': isDarkMode ? '#EF4444' : '#DC2626',
            'width': 3
          }
        }
      ],
      layout: AVAILABLE_LAYOUTS[currentLayout].config,
      // Interaction options
      userZoomingEnabled: true,
      wheelSensitivity: 5,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'single',
      // Performance options for large graphs
      hideEdgesOnViewport: data.edges.length > 100,
      hideLabelsOnViewport: data.nodes.length > 50,
      pixelRatio: 'auto'
    });

    // Add event listeners
    cyRef.current.on('tap', 'node', (event) => {
      const node = event.target;
      console.log('Node clicked:', node.data());
    });

    cyRef.current.on('tap', 'edge', (event) => {
      const edge = event.target;
      console.log('Edge clicked:', edge.data());
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
  }, [data, isDarkMode, currentLayout]);

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

  // Apply layout change
  const applyLayout = (layoutKey: LayoutKey) => {
    if (!cyRef.current || isLayoutRunning) return;
    
    setIsLayoutRunning(true);
    setCurrentLayout(layoutKey);
    
    const layoutConfig = AVAILABLE_LAYOUTS[layoutKey].config;
    const layout = cyRef.current.layout(layoutConfig);
    
    layout.on('layoutstop', () => {
      setIsLayoutRunning(false);
      if (cyRef.current) {
        cyRef.current.fit();
      }
    });
    
    layout.run();
  };

  // Method to export graph as image
  const exportImage = (format: 'png' | 'jpg' = 'png') => {
    if (cyRef.current) {
      const dataUrl = cyRef.current.png({
        output: 'blob',
        bg: isDarkMode ? '#1F2937' : '#FFFFFF',
        full: true
      }) as Blob;
      
      // Create download link
      const url = URL.createObjectURL(dataUrl);
      const link = document.createElement('a');
      link.href = url;
      link.download = `graph-${currentLayout}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Method to reset view
  const resetView = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  };

  return (
    <div className="relative">
      {/* Graph metadata display */}
      {data.metadata && (
        <div className={`mb-4 p-3 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 text-gray-300' 
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span>
                <strong>{data.metadata.fileName}</strong> ({data.metadata.fileType.toUpperCase()})
              </span>
              <span className="ml-4">
                {data.metadata.nodeCount} nodes, {data.metadata.edgeCount} edges
              </span>
            </div>
            
            {/* Control buttons in header */}
            <div className="flex space-x-2 items-center">
              <button
                onClick={resetView}
                className={`px-3 py-2 text-sm rounded border transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Reset View
              </button>
             
              <button
                onClick={() => exportImage('png')}
                className={`px-3 py-2 text-sm rounded border transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Export PNG
              </button>

              {/* Layout Dropdown */}
              <div className="relative">
                <select
                  value={currentLayout}
                  onChange={(e) => applyLayout(e.target.value as LayoutKey)}
                  disabled={isLayoutRunning}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } ${
                    isLayoutRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={AVAILABLE_LAYOUTS[currentLayout].description}
                >
                  {Object.entries(AVAILABLE_LAYOUTS).map(([key, layout]) => (
                    <option
                      key={key}
                      value={key}
                      className={isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}
                    >
                      {layout.name}
                    </option>
                  ))}
                </select>
               
                {/* Loading indicator overlay for dropdown */}
                {isLayoutRunning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded">
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



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
};

export default GraphVisualizer;