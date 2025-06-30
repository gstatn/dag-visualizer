import { useState, useRef } from "react";                                    // React hook for state management
import { Settings } from "lucide-react";                            // Settings icon
import { Button } from "@/components/ui/button";                    // Reusable button component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Modal components
import { Switch } from "@/components/ui/switch";                    // Toggle switch component
import { Label } from "@/components/ui/label";                      // Label component
import FileUploadModal, { GraphData } from "@/components/FileUploadModal";         // Custom file upload modal with GraphData type
import GraphVisualizer, { GraphVisualizerHandle } from "@/components/GraphVisualizer";         // Graph visualization component
import { ArrowLeft, Trash2 } from 'lucide-react';                  // Icons

// Layout definitions (moved from GraphVisualizer)
const AVAILABLE_LAYOUTS = {
  dagre: { name: 'Dagre', description: 'Hierarchical layout ideal for DAGs and trees' },
  circle: { name: 'Circle', description: 'Arranges nodes in a circle, good for showing connections' },
  concentric: { name: 'Concentric', description: 'Concentric circles based on node importance' },
  grid: { name: 'Grid', description: 'Organized grid layout, clean and systematic' },
  breadthfirst: { name: 'Breadthfirst', description: 'Tree-like layout using breadth-first traversal' },
  cose: { name: 'CoSE', description: 'Force-directed layout, good for showing clusters' }
} as const;

type LayoutKey = keyof typeof AVAILABLE_LAYOUTS;

const Index = () => {
  // STATE MANAGEMENT - Things that can change and cause re-renders
  const [isDarkMode, setIsDarkMode] = useState(true);               // Dark mode on/off (starts as dark)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // File upload modal open/closed
  const [graphData, setGraphData] = useState<GraphData | null>(null); // Store uploaded graph data
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);   // Sidebar collapse state
  const [currentLayout, setCurrentLayout] = useState<LayoutKey>('dagre'); // Current graph layout
  
  // Ref to access GraphVisualizer methods
  const graphVisualizerRef = useRef<GraphVisualizerHandle>(null);

  // Handle when user uploads data
  const handleDataUploaded = (data: GraphData) => {
    console.log("Index.tsx received graph data:", data);
    setGraphData(data);
  };

  // Clear current graph data
  const clearGraphData = () => {
    setGraphData(null);
  };

  // Handle layout change
  const handleLayoutChange = (layoutKey: LayoutKey) => {
    setCurrentLayout(layoutKey);
    if (graphVisualizerRef.current) {
      graphVisualizerRef.current.applyLayout(layoutKey);
    }
  };

  // Handle reset view
  const handleResetView = () => {
    if (graphVisualizerRef.current) {
      graphVisualizerRef.current.resetView();
    }
  };

  // Handle export image
  const handleExportImage = () => {
    if (graphVisualizerRef.current) {
      graphVisualizerRef.current.exportImage('png');
    }
  };

  // DARK MODE EFFECT - Apply dark mode to entire document
  if (isDarkMode) {
    document.documentElement.classList.add('dark');                 // Add 'dark' class to <html> element
  } else {
    document.documentElement.classList.remove('dark');             // Remove 'dark' class from <html> element
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-[rgb(32,32,32)] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* MAIN LAYOUT - Full screen container with smooth color transitions */}
      
      <div className="flex h-screen">
        {/* LEFT SECTION - Sidebar with tools */}
        <div className={`transition-all duration-300 border-r-[1px] ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        } ${
          isDarkMode ? 'bg-gray-1000 border-gray-500' : 'bg-white border-gray-200'
        } p-6 flex flex-col relative`}>  
          
          <div className="flex-1 flex flex-col justify-start items-center">
            {/* COLLAPSE BUTTON */}
            <Button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`absolute top-4 right-4 p-3 bg-transparent border-2 rounded transition-colors ${
                isDarkMode 
                  ? 'border-gray-500 hover:bg-white/5 text-gray-300' 
                  : 'border-gray-200 hover:bg-black/5 text-gray-600'
                }`}
            >
              <ArrowLeft 
                size={26} 
                strokeWidth={3} 
                className={`transition-transform duration-300 ${
                  sidebarCollapsed ? 'rotate-180' : ''
                }`}
              />
            </Button>
          
            {/* SIDEBAR CONTENT - Only show when not collapsed */}
            {!sidebarCollapsed && (
              <>
                <h2 className="text-xl font-semibold mb-6 mt-16">Graph Data Tools</h2>
                
                {/* Upload button - always visible */}
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className={`w-full py-6 text-lg transition-all duration-200 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Upload Graph Data
                </Button>

                {/* Graph metadata and controls - only show when data is loaded */}
                {graphData && (
                  <div className="w-full mt-6 space-y-4">
                    {/* Graph metadata */}
                    <div className={`p-4 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-gray-300' 
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}>
                      <h3 className="font-semibold mb-2">Graph Information</h3>
                      <div className="text-sm space-y-1">
                        <div><strong>Name:</strong> {graphData.metadata?.fileName || 'Unknown'}</div>
                        <div><strong>Type:</strong> {graphData.metadata?.fileType?.toUpperCase() || 'Unknown'}</div>
                        <div><strong>Nodes:</strong> {graphData.metadata?.nodeCount || graphData.nodes.length}</div>
                        <div><strong>Edges:</strong> {graphData.metadata?.edgeCount || graphData.edges.length}</div>
                      </div>
                    </div>

                    {/* Layout selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Graph Layout</label>
                      <select
                        value={currentLayout}
                        onChange={(e) => handleLayoutChange(e.target.value as LayoutKey)}
                        className={`w-full px-3 py-2 text-sm rounded border transition-colors ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
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
                      <p className="text-xs text-gray-500">{AVAILABLE_LAYOUTS[currentLayout].description}</p>
                    </div>

                    {/* Control buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleResetView}
                        variant="outline"
                        className={`w-full py-2 transition-all duration-200 ${
                          isDarkMode 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Reset View
                      </Button>

                      <Button
                        onClick={handleExportImage}
                        variant="outline"
                        className={`w-full py-2 transition-all duration-200 ${
                          isDarkMode 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Export as PNG
                      </Button>

                      <Button
                        onClick={clearGraphData}
                        variant="outline"
                        className={`w-full py-2 transition-all duration-200 ${
                          isDarkMode 
                            ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
                            : 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Graph
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT SECTION - Main content area with graph visualization */}
        <div className={`flex-1 transition-colors duration-300 ${
          isDarkMode ? 'bg-[rgb(32,32,32)]' : 'bg-gray-50'
        } flex flex-col`}>
          
          {/* Main Content Area */}
          <div className="flex-1 p-6">
            {graphData ? (
              // Show graph when data is available
              <GraphVisualizer 
                ref={graphVisualizerRef}
                data={graphData}
                isDarkMode={isDarkMode}
                currentLayout={currentLayout}
                width="100%"
                height="calc(100vh - 130px)"
              />
            ) : (
              // Show placeholder when no data
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>
                    <div className="w-12 h-12 border-2 border-dashed border-current rounded"></div>
                  </div>
                  
                  <h1 className="text-3xl font-bold mb-2">Visualizer</h1>
                  <h2 className="text-xl font-semibold mb-2">No Graph Data</h2>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Upload a graph file to visualize your data
                  </p>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Supported formats: .txt * .json (More to be added soon!)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SETTINGS BUTTON - Fixed position in bottom-left corner */}
      <div className="fixed bottom-2 left-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className={`rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-900'
              }`}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Settings
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
                <Label htmlFor="dark-mode" className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Dark Mode
                </Label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILE UPLOAD MODAL */}
      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        isDarkMode={isDarkMode}
        onDataUploaded={handleDataUploaded}
      />
    </div>
  );
};

export default Index;