import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";

// TYPESCRIPT INTERFACES
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onDataUploaded: (data: GraphData) => void; // NEW: Callback to pass processed data to parent
}

// NEW: Interface for processed graph data
export interface GraphData {
  nodes: Array<{
    id: string;
    label?: string;
    [key: string]: string | number | boolean | undefined; // Allow additional properties
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    [key: string]: string | number | boolean | undefined; // Allow additional properties
  }>;
  metadata?: {
    fileType: string;
    fileName: string;
    nodeCount: number;
    edgeCount: number;
  };
}

const FileUploadModal = ({ isOpen, onClose, isDarkMode, onDataUploaded }: FileUploadModalProps) => {
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // NEW: Loading state
  const [error, setError] = useState<string | null>(null); // NEW: Error state
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null); // Clear any previous errors
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null); // Clear any previous errors
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  // NEW: File processing function
  const processFile = async (file: File): Promise<GraphData> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileContent = await file.text();

    switch (fileExtension) {
      case 'txt':
        return processTxtFile(fileContent, file.name);
      case 'json':
        return processJsonFile(fileContent, file.name);
      case 'csv':
        return processCsvFile(fileContent, file.name);
      // TODO: Add support for XML, GraphML, DOT files in the future
      // case 'xml':
      //   return processXmlFile(fileContent, file.name);
      // case 'dot':
      //   return processDotFile(fileContent, file.name);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  };

  // NEW: TXT file processor (handle both simple edge list and your structured format)
  const processTxtFile = (content: string, fileName: string): GraphData => {
    console.log("Processing TXT file content:", content.substring(0, 200) + "...");
    
    const lines = content.trim().split('\n').filter(line => line.trim());
    console.log("Found", lines.length, "non-empty lines");
    
    const edges: GraphData['edges'] = [];
    const nodeSet = new Set<string>();

    // Check if this is your structured format with headers
    if (content.includes("Graph Nodes:") && content.includes("Graph Edges:")) {
      console.log("Detected structured format with headers");
      
      // Find the nodes section
      const nodesLineIndex = lines.findIndex(line => line.includes("Graph Nodes:"));
      const edgesLineIndex = lines.findIndex(line => line.includes("Graph Edges:"));
      
      if (nodesLineIndex !== -1 && edgesLineIndex !== -1) {
        // Parse nodes (semicolon separated)
        const nodesLine = lines[nodesLineIndex + 1];
        if (nodesLine) {
          const nodeNames = nodesLine.split(';').map(n => n.trim()).filter(n => n);
          nodeNames.forEach(nodeName => nodeSet.add(nodeName));
          console.log("Found nodes:", nodeNames);
        }
        
        // Parse edges (numbered list format: "1. X1 --> X4")
        for (let i = edgesLineIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          console.log(`Processing edge line: "${line}"`);
          
          // Match pattern: "1. X1 --> X4" or "X1 --> X4"
          const edgeMatch = line.match(/(?:\d+\.\s*)?(\w+)\s*-->\s*(\w+)/);
          if (edgeMatch) {
            const source = edgeMatch[1];
            const target = edgeMatch[2];
            
            nodeSet.add(source);
            nodeSet.add(target);
            
            edges.push({
              id: `edge-${edges.length}`,
              source,
              target
            });
            
            console.log(`Added edge: ${source} → ${target}`);
          } else {
            console.warn(`Could not parse edge line: "${line}"`);
          }
        }
      }
    } else {
      // Handle simple edge list format (original logic)
      console.log("etected simple edge list format");
      
      lines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        console.log(`Line ${index + 1}:`, parts);
        
        if (parts.length >= 2) {
          const source = parts[0];
          const target = parts[1];
          const label = parts.slice(2).join(' ') || undefined;
          
          nodeSet.add(source);
          nodeSet.add(target);
          
          edges.push({
            id: `edge-${index}`,
            source,
            target,
            label
          });
          
          console.log(`Added edge: ${source} → ${target}`, label ? `(${label})` : '');
        } else {
          console.warn(`Skipping invalid line ${index + 1}:`, line);
        }
      });
    }

    const nodes: GraphData['nodes'] = Array.from(nodeSet).map(nodeId => ({
      id: nodeId,
      label: nodeId
    }));

    console.log("Final result:", { nodes: nodes.length, edges: edges.length });
    console.log("Nodes:", nodes);
    console.log("Edges:", edges);

    return {
      nodes,
      edges,
      metadata: {
        fileType: 'txt',
        fileName,
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };
  };

  // NEW: JSON file processor
  const processJsonFile = (content: string, fileName: string): GraphData => {
    try {
      const jsonData = JSON.parse(content);
      console.log("Processing JSON data structure:", Object.keys(jsonData));
      
      // Handle your specific JSON format with nested graph structure
      if (jsonData.graph && jsonData.graph.edgesSet && jsonData.graph.nodes) {
        console.log("Detected your custom graph format");
        const graphData = jsonData.graph;
        
        // Process nodes from the nodes array
        const nodes: GraphData['nodes'] = graphData.nodes.map((node: Record<string, unknown>, index: number) => {
          const nodeId = (node.name as string) || (node.id as string) || `node-${index}`;
          console.log(`Processing node: ${nodeId}`);
          
          return {
            id: nodeId,
            label: nodeId,
            centerX: node.centerX as number,
            centerY: node.centerY as number,
            nodeType: node.nodeType as string,
            nodeVariableType: node.nodeVariableType as string
          };
        });
        
        // Process edges from the edgesSet array
        const edges: GraphData['edges'] = graphData.edgesSet.map((edge: Record<string, unknown>, index: number) => {
          const node1 = edge.node1 as Record<string, unknown>;
          const node2 = edge.node2 as Record<string, unknown>;
          const source = (node1.name as string) || `node1-${index}`;
          const target = (node2.name as string) || `node2-${index}`;
          
          console.log(`Processing edge: ${source} → ${target}`);
          
          return {
            id: `edge-${index}`,
            source,
            target,
            endpoint1: edge.endpoint1 as string,
            endpoint2: edge.endpoint2 as string,
            probability: edge.probability as number
          };
        });
        
        console.log("Processed custom format:", { nodes: nodes.length, edges: edges.length });
        
        return {
          nodes,
          edges,
          metadata: {
            fileType: 'json',
            fileName,
            nodeCount: nodes.length,
            edgeCount: edges.length
          }
        };
      }
      // Handle standard nodes/edges format
      else if (jsonData.nodes && jsonData.edges) {
        console.log("Detected standard nodes/edges format");
        
        return {
          nodes: jsonData.nodes.map((node: Record<string, unknown>, index: number) => ({
            id: (node.id as string) || (node.name as string) || `node-${index}`,
            label: (node.label as string) || (node.name as string) || (node.id as string) || `Node ${index}`,
            ...Object.fromEntries(
              Object.entries(node).filter(([_, value]) => 
                typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              )
            )
          })),
          edges: jsonData.edges.map((edge: Record<string, unknown>, index: number) => ({
            id: (edge.id as string) || `edge-${index}`,
            source: (edge.source as string) || (edge.from as string),
            target: (edge.target as string) || (edge.to as string),
            label: (edge.label as string) || (edge.name as string),
            ...Object.fromEntries(
              Object.entries(edge).filter(([_, value]) => 
                typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              )
            )
          })),
          metadata: {
            fileType: 'json',
            fileName,
            nodeCount: jsonData.nodes.length,
            edgeCount: jsonData.edges.length
          }
        };
      } 
      // Handle nested graph format
      else if (jsonData.graph) {
        console.log("Detected nested graph format");
        return processJsonFile(JSON.stringify(jsonData.graph), fileName);
      } else {
        throw new Error('JSON format not recognized. Expected {nodes: [], edges: []} or your custom graph structure.');
      }
    } catch (error) {
      console.error("JSON parsing error:", error);
      throw new Error(`Invalid JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // NEW: CSV file processor
  const processCsvFile = (content: string, fileName: string): GraphData => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const edges: GraphData['edges'] = [];
    const nodeSet = new Set<string>();

    // Look for common column names
    const sourceCol = headers.findIndex(h => ['source', 'from', 'src', 'node1'].includes(h));
    const targetCol = headers.findIndex(h => ['target', 'to', 'dest', 'node2'].includes(h));
    const labelCol = headers.findIndex(h => ['label', 'name', 'edge_label'].includes(h));

    if (sourceCol === -1 || targetCol === -1) {
      throw new Error('CSV must contain source and target columns (source/from/src and target/to/dest)');
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= Math.max(sourceCol, targetCol) + 1) {
        const source = values[sourceCol];
        const target = values[targetCol];
        const label = labelCol !== -1 ? values[labelCol] : undefined;

        if (source && target) {
          nodeSet.add(source);
          nodeSet.add(target);
          
          edges.push({
            id: `edge-${i-1}`,
            source,
            target,
            label
          });
        }
      }
    }

    const nodes: GraphData['nodes'] = Array.from(nodeSet).map(nodeId => ({
      id: nodeId,
      label: nodeId
    }));

    return {
      nodes,
      edges,
      metadata: {
        fileType: 'csv',
        fileName,
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };
  };

  // UPDATED: Upload handler with file processing
  const handleUpload = async () => {
    if (selectedFile) {
      setIsProcessing(true);
      setError(null);
      
      try {
        console.log("Processing file:", selectedFile.name, "Size:", selectedFile.size, "Type:", selectedFile.type);
        const processedData = await processFile(selectedFile);
        console.log("Processed data:", processedData);
        console.log("Nodes:", processedData.nodes.length, "Edges:", processedData.edges.length);
        
        // Pass the processed data to the parent component
        console.log("Calling onDataUploaded with:", processedData);
        onDataUploaded(processedData);
        
        onClose(); // Close the modal
        // NOTE: Don't clear selectedFile here anymore since we're using the data
      } catch (error) {
        console.error("Error processing file:", error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.warn("No file selected for upload");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Upload Graph Data
          </DialogTitle>
          <p className={`${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Upload your graph data file to visualize your DAG (supports .txt, .json, .csv)
          </p>
        </DialogHeader>
        
        <div className="py-6">
          {/* NEW: Error display */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-800 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              dragActive
                ? isDarkMode 
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-blue-400 bg-blue-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".json,.csv,.txt,.xml,.dot,.graphml" // UPDATED: Added future formats
            />
            
            <div className="space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {selectedFile ? (
                  <File className={`w-8 h-8 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                ) : (
                  <Upload className={`w-8 h-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                )}
              </div>
              
              <div>
                {selectedFile ? (
                  <div>
                    <p className={`text-lg font-medium ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      File Selected: {selectedFile.name}
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-lg font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Drop your file here
                    </p>
                    <p className={`${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Or click to browse and select a file
                    </p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleChooseFile}
                variant="outline"
                disabled={isProcessing} // NEW: Disable during processing
                className={`transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Choose File
              </Button>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setError(null);
                  onClose();
                }}
                variant="outline"
                disabled={isProcessing} // NEW: Disable during processing
                className={isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleUpload}
                disabled={isProcessing} // NEW: Disable during processing
                className={`${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors duration-200`}
              >
                {isProcessing ? 'Processing...' : 'Upload File'} {/* NEW: Loading text */}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;