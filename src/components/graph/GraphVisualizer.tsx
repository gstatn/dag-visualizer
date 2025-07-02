import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import cytoscape from 'cytoscape';
// FIXED IMPORT - Use shared types
import { GraphData, GraphVisualizerHandle } from '@/shared/types/graph';
import { AVAILABLE_LAYOUTS } from '@/shared/constants/layouts';

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
}

const GraphVisualizer = forwardRef<GraphVisualizerHandle, GraphVisualizerProps>(({ 
  data, 
  isDarkMode, 
  currentLayout,
  width = "100%", 
  height = "600px" 
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);

  // Expose methods to parent component via ref
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
      layout: AVAILABLE_LAYOUTS[currentLayout as keyof typeof AVAILABLE_LAYOUTS]?.config || AVAILABLE_LAYOUTS.dagre.config,
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