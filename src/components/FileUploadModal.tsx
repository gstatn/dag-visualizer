import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";

// ---- Types ----
interface FileUploadModalProps {
  isOpen: boolean;              // controls modal visibility
  onClose: () => void;          // close modal
  isDarkMode: boolean;          // theme flag
  onDataUploaded: (data: GraphData) => void; // emits processed data upstream
}

// Normalized graph shape used across the app
export interface GraphData {
  nodes: Array<{
    id: string;
    label?: string;
    [key: string]: string | number | boolean | undefined; // allow extra fields
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    [key: string]: string | number | boolean | undefined; // allow extra fields
  }>;
  metadata?: {
    fileType: string;
    fileName: string;
    nodeCount: number;
    edgeCount: number;
  };
}

const FileUploadModal = ({ isOpen, onClose, isDarkMode, onDataUploaded }: FileUploadModalProps) => {
  // ---- UI state ----
  const [dragActive, setDragActive] = useState(false);           // drag area highlight
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // chosen file
  const [isProcessing, setIsProcessing] = useState(false);       // loading guard
  const [error, setError] = useState<string | null>(null);       // error message
  const fileInputRef = useRef<HTMLInputElement>(null);            // hidden input ref

  // ---- Drag handlers ----
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // ---- Drop handler ----
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null); // clear stale errors
    }
  };

  // ---- File picker change ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null); // clear stale errors
    }
  };

  // ---- Open hidden file picker ----
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  // ---- Unified processor dispatch by extension ----
  const processFile = async (file: File): Promise<GraphData> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileContent = await file.text();

    switch (fileExtension) {
      case 'txt':
        return processTxtFile(fileContent, file.name);
      case 'json':
        return processJsonFile(fileContent, file.name);
      // Future formats can be added here (xml, graphml, dot)
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  };

  /**
   * TXT parser:
   * - Supports simple "A B [label...]" edge list (space separated).
   * - Supports a light "Graph Nodes:" / "Graph Edges:" header format.
   */
  const processTxtFile = (content: string, fileName: string): GraphData => {
    console.log("Processing TXT file content:", content.substring(0, 200) + "...");

    const lines = content.trim().split('\n').filter(line => line.trim());
    console.log("Found", lines.length, "non-empty lines");

    const edges: GraphData['edges'] = [];
    const nodeSet = new Set<string>();

    // Detect header-based format
    if (content.includes("Graph Nodes:") && content.includes("Graph Edges:")) {
      console.log("Detected structured format with headers");

      const nodesLineIndex = lines.findIndex(line => line.includes("Graph Nodes:"));
      const edgesLineIndex = lines.findIndex(line => line.includes("Graph Edges:"));

      if (nodesLineIndex !== -1 && edgesLineIndex !== -1) {
        // Parse nodes (semicolon-separated on next line)
        const nodesLine = lines[nodesLineIndex + 1];
        if (nodesLine) {
          const nodeNames = nodesLine.split(';').map(n => n.trim()).filter(n => n);
          nodeNames.forEach(nodeName => nodeSet.add(nodeName));
          console.log("Found nodes:", nodeNames);
        }

        // Parse edges like "1. X1 --> X4" or "X1 --> X4"
        for (let i = edgesLineIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          console.log(`Processing edge line: "${line}"`);

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
      // Simple edge list: "A B [optional label ...]"
      console.log("Detected simple edge list format");

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

    // Build nodes from the set
    const nodes: GraphData['nodes'] = Array.from(nodeSet).map(nodeId => ({
      id: nodeId,
      label: nodeId
    }));

    console.log("Final result:", { nodes: nodes.length, edges: edges.length });

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

  /**
   * JSON parser:
   * - Supports a custom nested format: { graph: { nodes: [], edgesSet: [] } }
   * - Supports a standard format: { nodes: [], edges: [] }
   * - Falls back to nested "graph" if present.
   */
  const processJsonFile = (content: string, fileName: string): GraphData => {
    try {
      const jsonData = JSON.parse(content);
      console.log("Processing JSON data structure:", Object.keys(jsonData));

      // Custom nested format with edgesSet/nodes
      if (jsonData.graph && jsonData.graph.edgesSet && jsonData.graph.nodes) {
        console.log("Detected custom graph format");
        const graphData = jsonData.graph;

        const nodes: GraphData['nodes'] = graphData.nodes.map((node: Record<string, unknown>, index: number) => {
          const nodeId = (node.name as string) || (node.id as string) || `node-${index}`;
          return {
            id: nodeId,
            label: nodeId,
            centerX: node.centerX as number,
            centerY: node.centerY as number,
            nodeType: node.nodeType as string,
            nodeVariableType: node.nodeVariableType as string
          };
        });

        const edges: GraphData['edges'] = graphData.edgesSet.map((edge: Record<string, unknown>, index: number) => {
          const node1 = edge.node1 as Record<string, unknown>;
          const node2 = edge.node2 as Record<string, unknown>;
          const source = (node1?.name as string) || `node1-${index}`;
          const target = (node2?.name as string) || `node2-${index}`;

          return {
            id: `edge-${index}`,
            source,
            target,
            endpoint1: edge.endpoint1 as string,
            endpoint2: edge.endpoint2 as string,
            probability: edge.probability as number
          };
        });

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

      // Standard nodes/edges format
      if (jsonData.nodes && jsonData.edges) {
        console.log("Detected standard nodes/edges format");

        return {
          nodes: jsonData.nodes.map((node: Record<string, unknown>, index: number) => ({
            id: (node.id as string) || (node.name as string) || `node-${index}`,
            label: (node.label as string) || (node.name as string) || (node.id as string) || `Node ${index}`,
            ...Object.fromEntries(
              Object.entries(node).filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
            )
          })),
          edges: jsonData.edges.map((edge: Record<string, unknown>, index: number) => ({
            id: (edge.id as string) || `edge-${index}`,
            source: (edge.source as string) || (edge.from as string),
            target: (edge.target as string) || (edge.to as string),
            label: (edge.label as string) || (edge.name as string),
            ...Object.fromEntries(
              Object.entries(edge).filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
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

      // Nested graph passthrough
      if (jsonData.graph) {
        console.log("Detected nested graph format");
        return processJsonFile(JSON.stringify(jsonData.graph), fileName);
      }

      throw new Error('JSON format not recognized. Expected {nodes: [], edges: []} or a custom nested graph.');
    } catch (error) {
      console.error("JSON parsing error:", error);
      throw new Error(`Invalid JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // ---- Upload click: process file and bubble result ----
  const handleUpload = async () => {
    if (selectedFile) {
      setIsProcessing(true);
      setError(null);

      try {
        console.log("Processing file:", selectedFile.name, "Size:", selectedFile.size, "Type:", selectedFile.type);
        const processedData = await processFile(selectedFile);
        console.log("Processed data:", processedData);

        onDataUploaded(processedData); // bubble normalized graph data
        onClose();                     // close modal after success
        // note: selectedFile is not cleared to allow follow-up actions if needed
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
      <DialogContent
        className={`max-w-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Upload Graph Data
          </DialogTitle>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Upload a graph data file to visualize the DAG (supports .txt, .json)
          </p>
        </DialogHeader>

        <div className="py-6">
          {/* Error banner */}
          {error && (
            <div
              className={`mb-4 p-3 rounded-lg border ${
                isDarkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Drop zone */}
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
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".json,.txt,.xml,.dot,.graphml" // extra formats listed for future support
            />

            {/* Icon + text */}
            <div className="space-y-4">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                {selectedFile ? (
                  <File className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                ) : (
                  <Upload className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </div>

              <div>
                {selectedFile ? (
                  <div>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      File Selected: {selectedFile.name}
                    </p>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Drop file here
                    </p>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Or click to browse and select a file
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleChooseFile}
                variant="outline"
                disabled={isProcessing}
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

          {/* Action row */}
          {selectedFile && (
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setError(null);
                  onClose();
                }}
                variant="outline"
                disabled={isProcessing}
                className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
              >
                Cancel
              </Button>

              <Button
                onClick={handleUpload}
                disabled={isProcessing}
                className={`${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors duration-200`}
              >
                {isProcessing ? 'Processing...' : 'Upload File'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;
