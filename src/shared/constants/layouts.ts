// shared/constants/layouts.ts

// Layout definitions with their configurations
export const AVAILABLE_LAYOUTS = {
  dagre: {
    name: 'Dagre',
    description: 'Hierarchical layout ideal for DAGs and trees',
    config: {
      name: 'dagre',
      rankDir: 'TB',
      spacingFactor: 1.5,
      nodeDimensionsIncludeLabels: true
    }
  },
  circle: {
    name: 'Circle',
    description: 'Arranges nodes in a circle, good for showing connections',
    config: {
      name: 'circle',
      radius: Math.min(300, typeof window !== 'undefined' ? window.innerWidth / 6 : 300),
      startAngle: -Math.PI / 2
    }
  },
  concentric: {
    name: 'Concentric',
    description: 'Concentric circles based on node importance',
    config: {
      name: 'concentric',
      concentric: (node: { degree: (includeLoops: boolean) => number }) => node.degree(false),
      levelWidth: () => 1,
      spacingFactor: 1.5,
      minNodeSpacing: 50
    }
  },
  grid: {
    name: 'Grid',
    description: 'Organized grid layout, clean and systematic',
    config: {
      name: 'grid',
      rows: undefined,
      cols: undefined,
      spacingFactor: 1.2
    }
  },
  breadthfirst: {
    name: 'Breadthfirst',
    description: 'Tree-like layout using breadth-first traversal',
    config: {
      name: 'breadthfirst',
      directed: true,
      spacingFactor: 1.5,
      avoidOverlap: true
    }
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
      nestingFactor: 1,
      gravity: 40,
      numIter: 600,
      initialTemp: 100,
      coolingFactor: 0.9,
      minTemp: 1.0,
      animate: false
    }
  }
} as const;

export type LayoutKey = keyof typeof AVAILABLE_LAYOUTS;