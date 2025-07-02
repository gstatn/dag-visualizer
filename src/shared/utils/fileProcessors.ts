// shared/utils/fileProcessors.ts
import { GraphData } from '../types/graph';

// TXT file processor (handle both simple edge list and structured format)
export const processTxtFile = (content: string, fileName: string): GraphData => {
  console.log("Processing TXT file content:", content.substring(0, 200) + "...");
  
  const lines = content.trim().split('\n').filter(line => line.trim());
  console.log("Found", lines.length, "non-empty lines");
  
  const edges: GraphData['edges'] = [];
  const nodeSet = new Set<string>();

  // Check if this is structured format with headers
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
    // Handle simple edge list format
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

// JSON file processor
export const processJsonFile = (content: string, fileName: string): GraphData => {
  try {
    const jsonData = JSON.parse(content);
    console.log("Processing JSON data structure:", Object.keys(jsonData));
    
    // Handle custom JSON format with nested graph structure
    if (jsonData.graph && jsonData.graph.edgesSet && jsonData.graph.nodes) {
      console.log("Detected custom graph format");
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
      throw new Error('JSON format not recognized. Expected {nodes: [], edges: []} or custom graph structure.');
    }
  } catch (error) {
    console.error("JSON parsing error:", error);
    throw new Error(`Invalid JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Main file processor function
export const processFile = async (file: File): Promise<GraphData> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const fileContent = await file.text();

  switch (fileExtension) {
    case 'txt':
      return processTxtFile(fileContent, file.name);
    case 'json':
      return processJsonFile(fileContent, file.name);
    // TODO: Add support for XML, GraphML, DOT files in the future
    // case 'xml':
    //   return processXmlFile(fileContent, file.name);
    // case 'dot':
    //   return processDotFile(fileContent, file.name);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
};