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

const GraphVisualizer = ({ 
  data, 
  isDarkMode, 
  width = "100%", 
  height = "600px" 
}: GraphVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        spacingFactor: 1.5,
        nodeDimensionsIncludeLabels: true
      } as cytoscape.LayoutOptions,
      // Interaction options
      userZoomingEnabled: true,
      wheelSensitivity: 1, // Change this <------ ******************
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
      // TODO: Add custom node click behavior here
    });

    cyRef.current.on('tap', 'edge', (event) => {
      const edge = event.target;
      console.log('Edge clicked:', edge.data());
      // TODO: Add custom edge click behavior here
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
  }, [data, isDarkMode]);

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

  // Method to export graph as image (future feature)
  const exportImage = (format: 'png' | 'jpg' = 'png') => {
    if (cyRef.current) {
      const dataUrl = cyRef.current.png({
        output: 'blob',
        bg: isDarkMode ? '#1F2937' : '#FFFFFF',
        full: true
      }) as Blob;
      // TODO: Implement download functionality
      console.log('Export image:', dataUrl);
    }
  };

  // Method to reset view
  const resetView = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  };

  // Method to change layout (future feature)
  const changeLayout = (layoutName: string) => {
    if (cyRef.current) {
      let layoutOptions: cytoscape.LayoutOptions;
      
      switch (layoutName) {
        case 'dagre':
          layoutOptions = {
            name: 'dagre',
            rankDir: 'TB',
            spacingFactor: 1.5
          } as cytoscape.LayoutOptions;
          break;
        case 'circle':
          layoutOptions = {
            name: 'circle'
          };
          break;
        case 'grid':
          layoutOptions = {
            name: 'grid'
          };
          break;
        default:
          layoutOptions = {
            name: 'breadthfirst',
            directed: true
          };
      }
      
      const layout = cyRef.current.layout(layoutOptions);
      layout.run();
    }
  };

  if (!data) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed rounded-lg ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-800 text-gray-400' 
            : 'border-gray-300 bg-gray-50 text-gray-500'
        }`}
        style={{ width, height }}
      >
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Graph Data</p>
          <p className="text-sm">Upload a file to visualize your graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Graph metadata display */}
      {data.metadata && (
        <div className={`mb-4 p-3 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 text-gray-300' 
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <div className="flex justify-between items-center text-sm">
            <span>
              <strong>{data.metadata.fileName}</strong> ({data.metadata.fileType.toUpperCase()})
            </span>
            <span>
              {data.metadata.nodeCount} nodes, {data.metadata.edgeCount} edges
            </span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-lg">
          <div className="text-white">Loading graph...</div>
        </div>
      )}

      {/* Graph container */}
      <div 
        ref={containerRef}
        className={`border rounded-lg ${
          isDarkMode ? 'border-gray-700' : 'border-gray-300'
        }`}
        style={{ width, height }}
      />

      {/* Control buttons (future feature) */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={resetView}
          className={`px-3 py-1 text-sm rounded border ${
            isDarkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Reset View
        </button>
        {/* TODO: Add more control buttons
        <button onClick={() => changeLayout('circle')}>Circle Layout</button>
        <button onClick={() => changeLayout('grid')}>Grid Layout</button>
        <button onClick={() => exportImage('png')}>Export PNG</button>
        */}
      </div>
    </div>
  );
};

export default GraphVisualizer;