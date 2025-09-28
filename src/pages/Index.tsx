import { useState, useRef } from "react";
import { Settings, ArrowLeft, Trash2, RotateCcw, Download, Wrench, Brush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FileUploadModal, { GraphData } from "@/components/FileUploadModal";
import GraphVisualizer, { GraphVisualizerHandle } from "@/components/GraphVisualizer";
import CustomizationPanel from "@/components/CustomizationPanel";

// Available layouts (names + descriptions only, configs live inside GraphVisualizer)
const AVAILABLE_LAYOUTS = {
  dagre: { name: "Dagre", description: "Hierarchical layout ideal for DAGs and trees" },
  circle: { name: "Circle", description: "Arranges nodes in a circle, good for showing connections" },
  concentric: { name: "Concentric", description: "Concentric circles based on node importance" },
  grid: { name: "Grid", description: "Organized grid layout, clean and systematic" },
  breadthfirst: { name: "Breadthfirst", description: "Tree-like layout using breadth-first traversal" },
  cose: { name: "CoSE", description: "Force-directed layout, good for showing clusters" },
} as const;

type LayoutKey = keyof typeof AVAILABLE_LAYOUTS;

const Index = () => {
  // Global UI state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showGraphControls, setShowGraphControls] = useState(false);

  // Graph state
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [currentLayout, setCurrentLayout] = useState<LayoutKey>("dagre");
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // Ref for calling GraphVisualizer methods (reset, export, etc.)
  const graphVisualizerRef = useRef<GraphVisualizerHandle>(null);

  /** Callback fired when FileUploadModal processes data */
  const handleDataUploaded = (data: GraphData) => {
    console.log("Index.tsx received graph data:", data);
    setGraphData(data);
  };

  /** Clear loaded graph */
  const clearGraphData = () => setGraphData(null);

  /** Apply a new layout via GraphVisualizer */
  const handleLayoutChange = (layoutKey: LayoutKey) => {
    setCurrentLayout(layoutKey);
    graphVisualizerRef.current?.applyLayout(layoutKey);
  };

  /** Reset camera view */
  const handleResetView = () => graphVisualizerRef.current?.resetView();

  /** Export graph as PNG */
  const handleExportImage = () => graphVisualizerRef.current?.exportImage("png");

  /** Change selected nodes’ fill color */
  const handleColorChange = (color: string) => {
    graphVisualizerRef.current?.changeSelectedNodesColor(color);
  };

  /** Change selected nodes’ border */
  const handleBorderChange = (borderColor: string, borderWidth: number) => {
    graphVisualizerRef.current?.changeSelectedNodesBorder(borderColor, borderWidth);
  };

  /** Change selected nodes’ shape */
  const handleShapeChange = (shape: "circle" | "rectangle" | "diamond" | "ellipse" | "square") => {
    console.log("Index.tsx: handleShapeChange called with shape:", shape);
    graphVisualizerRef.current?.changeSelectedNodesShape(shape);
  };

  /** Reset all nodes to original styling */
  const handleResetNodes = () => graphVisualizerRef.current?.resetAllNodesToOriginal();

  // Apply/remove dark theme at document level
  if (isDarkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-[rgb(32,32,32)] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex h-screen">
        {/* ─────────────── LEFT SIDEBAR ─────────────── */}
        <div
          className={`transition-all duration-300 border-r-[1px] flex-shrink-0 ${
            sidebarCollapsed ? "w-16" : "w-80"
          } ${isDarkMode ? "bg-gray-1000 border-gray-500" : "bg-white border-gray-200"} p-6 flex flex-col relative`}
        >
          <div className="flex-1 flex flex-col justify-start items-center">
            {/* Collapse button */}
            <Button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`absolute top-4 right-4 p-3 bg-transparent border-2 rounded transition-colors ${
                isDarkMode ? "border-gray-500 hover:bg-white/5 text-gray-300" : "border-gray-200 hover:bg-black/5 text-gray-600"
              }`}
            >
              <ArrowLeft
                size={26}
                strokeWidth={3}
                className={`transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`}
              />
            </Button>

            {/* Sidebar content (hidden if collapsed) */}
            {!sidebarCollapsed && (
              <>
                <h2 className="text-xl font-semibold mb-6 mt-2">Graph Data Tools</h2>

                {/* Upload button */}
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className={`w-full py-6 text-lg transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Upload Graph Data
                </Button>

                {/* Graph options (only show when graph is loaded) */}
                {graphData && (
                  <div className="w-full mt-6 space-y-4">
                    {/* Graph metadata panel */}
                    <div
                      className={`p-4 rounded-lg border ${
                        isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Graph Information</h3>
                      <div className="text-sm space-y-1">
                        <div>
                          <strong>Name:</strong> {graphData.metadata?.fileName || "Unknown"}
                        </div>
                        <div>
                          <strong>Type:</strong> {graphData.metadata?.fileType?.toUpperCase() || "Unknown"}
                        </div>
                        <div>
                          <strong>Nodes:</strong> {graphData.metadata?.nodeCount || graphData.nodes.length}
                        </div>
                        <div>
                          <strong>Edges:</strong> {graphData.metadata?.edgeCount || graphData.edges.length}
                        </div>
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
                            ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {Object.entries(AVAILABLE_LAYOUTS).map(([key, layout]) => (
                          <option key={key} value={key} className={isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}>
                            {layout.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">{AVAILABLE_LAYOUTS[currentLayout].description}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => {/* TODO: Add more graph manipulation functions */}}
                        variant="outline"
                        className={`w-full py-2 ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        <Wrench className="w-4 h-4 mr-0" />
                        Graph Manipulation Functions
                      </Button>

                      <Button
                        onClick={() => setIsCustomizationOpen(!isCustomizationOpen)}
                        variant="outline"
                        className={`w-full py-2 ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"} ${
                          isCustomizationOpen ? "bg-blue-500 text-white border-blue-500" : ""
                        }`}
                      >
                        <Brush className="w-4 h-4 mr-0" />
                        Customize
                      </Button>

                      <Button
                        onClick={handleResetView}
                        variant="outline"
                        className={`w-full py-2 ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        <RotateCcw className="w-4 h-4 mr-0" />
                        Reset View
                      </Button>

                      <Button
                        onClick={handleExportImage}
                        variant="outline"
                        className={`w-full py-2 ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        <Download className="w-4 h-4 mr-0" />
                        Export as PNG
                      </Button>

                      <Button
                        onClick={clearGraphData}
                        variant="outline"
                        className={`w-full py-2 ${isDarkMode ? "border-red-600 text-red-400 hover:bg-red-600 hover:text-white" : "border-red-500 text-red-600 hover:bg-red-500 hover:text-white"}`}
                      >
                        <Trash2 className="w-4 h-4 mr-0" />
                        Clear Graph
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─────────────── MAIN GRAPH AREA ─────────────── */}
        <div
          className={`flex-1 transition-colors duration-300 ${isDarkMode ? "bg-[rgb(32,32,32)]" : "bg-gray-50"} flex flex-col`}
        >
          <div className="flex-1 p-6">
            {graphData ? (
              <GraphVisualizer
                ref={graphVisualizerRef}
                data={graphData}
                isDarkMode={isDarkMode}
                currentLayout={currentLayout}
                width="100%"
                height="calc(100vh - 50px)"
              />
            ) : (
              // Placeholder when no graph is loaded
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div
                    className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <div className="w-12 h-12 border-2 border-dashed border-current rounded"></div>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Visualizer</h1>
                  <h2 className="text-xl font-semibold mb-2">No Graph Data</h2>
                  <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Upload a graph file to visualize your data
                  </p>
                  <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Supported formats: .txt & .json (More to be added soon!)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────── SETTINGS BUTTON ─────────────── */}
      <div className="fixed bottom-2 left-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className={`rounded-full shadow-lg hover:scale-110 transition-all ${
                isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-white hover:bg-gray-100 text-gray-900"
              }`}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>

          {/* Settings dialog */}
          <DialogContent className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Settings</DialogTitle>
            </DialogHeader>

            {/* Settings content */}
            <div className="py-4 space-y-4">
              {/* Dark mode toggle */}
              <div className="flex items-center space-x-2">
                <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                <Label htmlFor="dark-mode" className={isDarkMode ? "text-white" : "text-gray-900"}>
                  Dark Mode
                </Label>
              </div>

              {/* Graph controls accordion */}
              <div className={`border-t pt-4 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
                <button
                  onClick={() => setShowGraphControls(!showGraphControls)}
                  className={`flex items-center justify-between w-full font-medium transition-colors ${
                    isDarkMode ? "text-white hover:text-gray-300" : "text-gray-900 hover:text-gray-700"
                  }`}
                >
                  <span>Graph Controls</span>
                  <ArrowLeft
                    size={16}
                    className={`transition-transform duration-200 ${showGraphControls ? "rotate-90" : "-rotate-90"}`}
                  />
                </button>

                {/* Collapsible help section */}
                {showGraphControls && (
                  <div
                    className={`text-sm space-y-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"} animate-in slide-in-from-top-2 duration-200`}
                  >
                    {/* Navigation help */}
                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                      <strong className={`block mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Mouse Navigation</strong>
                      <ul className="space-y-1 text-xs">
                        <li>• Left click + drag: Pan around the graph</li>
                        <li>• Mouse wheel: Zoom in/out</li>
                        <li>• Left click on node/edge: Select single element</li>
                      </ul>
                    </div>

                    {/* Multi-select help */}
                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                      <strong className={`block mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Advanced Selection</strong>
                      <ul className="space-y-1 text-xs">
                        <li>• Ctrl + left click: Select multiple nodes/edges</li>
                        <li>• Ctrl + left click + drag: Box select multiple elements</li>
                        <li>• Click empty space: Deselect all</li>
                      </ul>
                    </div>

                    {/* Layout controls help */}
                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                      <strong className={`block mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Layout Controls</strong>
                      <ul className="space-y-1 text-xs">
                        <li>• Use layout dropdown to change graph arrangement</li>
                        <li>• Reset View button centers and fits graph to screen</li>
                        <li>• Export PNG saves current view as image</li>
                      </ul>
                    </div>

                    {/* Customization help */}
                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                      <strong className={`block mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Customization Controls</strong>
                      <ul className="space-y-1 text-xs">
                        <li>• Select nodes and use Customize panel to change colors</li>
                        <li>• Click shape buttons to change selected node shapes</li>
                        <li>• Adjust border color and width in real-time</li>
                        <li>• Reset button restores original node styles</li>
                      </ul>
                    </div>

                    {/* Coming soon */}
                    <div
                      className={`p-3 rounded-lg border-2 border-dashed ${
                        isDarkMode ? "border-gray-600 bg-gray-800/50" : "border-gray-300 bg-gray-50/50"
                      }`}
                    >
                      <em className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        🚧 More controls and customization options coming soon...
                      </em>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─────────────── CUSTOMIZATION PANEL ─────────────── */}
      <CustomizationPanel
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        isDarkMode={isDarkMode}
        onColorChange={handleColorChange}
        onBorderChange={handleBorderChange}
        onShapeChange={handleShapeChange}
        onResetNodes={handleResetNodes}
      />

      {/* ─────────────── FILE UPLOAD MODAL ─────────────── */}
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
