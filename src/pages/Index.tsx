import { useState } from "react";                                    // React hook for state management
import { Settings } from "lucide-react";                            // Settings icon
import { Button } from "@/components/ui/button";                    // Reusable button component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Modal components
import { Switch } from "@/components/ui/switch";                    // Toggle switch component
import { Label } from "@/components/ui/label";                      // Label component
import FileUploadModal, { GraphData } from "@/components/FileUploadModal";         // Custom file upload modal with GraphData type
import GraphVisualizer from "@/components/GraphVisualizer";         // NEW: Graph visualization component
import { ArrowLeft, Trash2 } from 'lucide-react';                  // Icons

const Index = () => {
  // STATE MANAGEMENT - Things that can change and cause re-renders
  const [isDarkMode, setIsDarkMode] = useState(true);               // Dark mode on/off (starts as dark)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // File upload modal open/closed
  const [graphData, setGraphData] = useState<GraphData | null>(null); // NEW: Store uploaded graph data
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);   // NEW: Sidebar collapse state

  // NEW: Handle when user uploads data
  const handleDataUploaded = (data: GraphData) => {
    console.log("🎯 Index.tsx received graph data:", data);
    console.log("📋 Setting graphData state...");
    setGraphData(data);
    console.log("✅ Graph data state updated");
  };

  // NEW: Clear current graph data
  const clearGraphData = () => {
    setGraphData(null);
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
        {/* LEFT SECTION - Sidebar with tools (NEW: collapsible) */}
        <div className={`transition-all duration-300 border-r-[2px] ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        } ${
          isDarkMode ? 'bg-gray-1000 border-gray-500' : 'bg-white border-gray-200'
        } p-6 flex flex-col relative`}>  
          {/* Width: 320px (w-80) when expanded, 64px (w-16) when collapsed */}
          
          <div className="flex-1 flex flex-col justify-start items-center">
            {/* CENTERED CONTENT - Places the content from top to bottom */}

            {/* COLLAPSE BUTTON - NEW: Toggle sidebar */}
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
                {/* Title for the tools section */}
                
                <Button
                  onClick={() => setIsUploadModalOpen(true)}             // Open file upload modal when clicked
                  className={`w-full py-6 text-lg transition-all duration-200 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'       // Dark mode button colors
                      : 'bg-blue-500 hover:bg-blue-600 text-white'       // Light mode button colors
                  }`}
                >
                  Upload Graph Data
                </Button>
                {/* BIG UPLOAD BUTTON - Full width, tall, with hover animation */}

                {/* NEW: Clear Graph Button - Only show when there's data */}
                {graphData && (
                  <Button
                    onClick={clearGraphData}
                    variant="outline"
                    className={`w-full py-3 mt-4 transition-all duration-200 hover:scale-105 ${
                      isDarkMode 
                        ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
                        : 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Graph
                  </Button>
                )}

              </>
            )}
          </div>
        </div>

        {/* RIGHT SECTION - Main content area with graph visualization */}
        <div className={`flex-1 transition-colors duration-300 ${
          isDarkMode ? 'bg-[rgb(32,32,32)]' : 'bg-gray-50'
        } flex flex-col`}>
          {/* Takes up remaining space (flex-1), flex column for header + content */}
          
          {/* NEW: Content Header */}
          <div className={`border-b p-4 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h1 className="text-2xl font-bold">
              {graphData ? 'Graph Visualization' : 'DAG Visualizer'}
            </h1>
            {graphData && (
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Visualizing: {graphData.metadata?.fileName}
              </p>
            )}
          </div>

          {/* NEW: Main Content Area */}
          <div className="flex-1 p-6">
            {graphData ? (
              // Show graph when data is available
              <GraphVisualizer 
                data={graphData}
                isDarkMode={isDarkMode}
                height="calc(100vh - 180px)" // Adjust height to fit in available space
              />
            ) : (
              // Show placeholder when no data
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  {/* PLACEHOLDER CONTENT - Shows when no data is loaded */}
                  
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {/* PLACEHOLDER ICON - Circle with dashed box inside */}
                    <div className="w-12 h-12 border-2 border-dashed border-current rounded"></div>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-2">No Graph Data</h2>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Upload a graph file to visualize your data
                  </p>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Supported formats: .txt, .json, .csv
                  </p>
                  {/* PLACEHOLDER TEXT - Tells user what this area is for */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SETTINGS BUTTON - Fixed position in bottom-left corner */}
      <div className="fixed bottom-6 left-6">
        {/* Fixed positioning = stays in place when scrolling */}
        
        <Dialog>
          {/* SETTINGS MODAL - Click button to open settings */}
          
          <DialogTrigger asChild>
            {/* Trigger = what you click to open the modal */}
            <Button
              size="icon"                                           // Square button sized for icons
              className={`rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'     // Dark mode button
                  : 'bg-white hover:bg-gray-100 text-gray-900'     // Light mode button
              }`}
            >
              <Settings className="h-5 w-5" />                     {/* Settings gear icon */}
            </Button>
          </DialogTrigger>
          
          <DialogContent className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* MODAL CONTENT - What appears when you click settings */}
            
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Settings
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              {/* SETTINGS OPTIONS */}
              
              <div className="flex items-center space-x-2">
                {/* DARK MODE TOGGLE - Switch to turn dark mode on/off */}
                
                <Switch
                  id="dark-mode"                                   // HTML ID for accessibility
                  checked={isDarkMode}                             // Current state (on/off)
                  onCheckedChange={setIsDarkMode}                  // Function to call when toggled
                />
                <Label htmlFor="dark-mode" className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Dark Mode
                </Label>
                {/* Label connects to switch via htmlFor="dark-mode" */}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILE UPLOAD MODAL - The modal component we analyzed earlier */}
      <FileUploadModal 
        isOpen={isUploadModalOpen}                                  // Pass current open state
        onClose={() => setIsUploadModalOpen(false)}                // Function to close modal
        isDarkMode={isDarkMode}                                     // Pass dark mode state for styling
        onDataUploaded={handleDataUploaded}                         // NEW: Pass callback to handle uploaded data
      />
      {/* This modal appears when user clicks "Upload Graph Data" button */}
    </div>
  );
};

export default Index;                                               // Make this component available to other files 