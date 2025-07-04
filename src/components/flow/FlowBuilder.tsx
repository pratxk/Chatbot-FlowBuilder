import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MessageNode, { MessageNodeData } from './MessageNode';
import NodesPanel from './NodesPanel';
import SettingsPanel from './SettingsPanel';

/**
 * FlowBuilder Component
 * 
 * Main component that orchestrates the entire chatbot flow builder.
 * Manages the React Flow instance, nodes, edges, and UI panels.
 * 
 * Features:
 * - Drag and drop node creation
 * - Node selection and editing
 * - Connection validation (one source, multiple targets)
 * - Save functionality with validation
 * - Responsive layout
 */

// Define custom node types for React Flow
const nodeTypes = {
  messageNode: MessageNode,
};

// Initial nodes and edges - starts with empty flow
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const LOCAL_STORAGE_KEY = 'chatbot-flow';

const FlowBuilderContent: React.FC = () => {
  // React Flow hooks for managing nodes and edges
  const [nodes, setNodes, onNodesChange]: [Node[], any, OnNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange]: [Edge[], any, OnEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [resetting, setResetting] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);

  // React Flow instance and utilities
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load from localStorage ONLY if data was explicitly saved
  React.useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
        if (Array.isArray(savedNodes) && Array.isArray(savedEdges)) {
          setNodes(savedNodes);
          setEdges(savedEdges);
          setHasSavedData(true);
        }
      } catch {
        setHasSavedData(false);
      }
    }
  }, [setNodes, setEdges]);

  // Track if localStorage has saved data (for showing Reset button)
  React.useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
        setHasSavedData(
          Array.isArray(savedNodes) && savedNodes.length > 0 ||
          Array.isArray(savedEdges) && savedEdges.length > 0
        );
      } catch {
        setHasSavedData(false);
      }
    } else {
      setHasSavedData(false);
    }
  }, []);

  // Reset flow handler
  const handleReset = useCallback(() => {
    setResetting(true);
  }, []);

  const confirmReset = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setNodeIdCounter(1);
    setHasSavedData(false); // <-- Add this line to immediately hide the Reset button
    setResetting(false);
  }, [setNodes, setEdges]);

  const cancelReset = useCallback(() => {
    setResetting(false);
  }, []);

  /**
   * Handle node selection - shows settings panel for selected node
   */
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  /**
   * Handle pane click - deselects any selected node
   */
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  /**
   * Handle edge connections with validation
   * Ensures that source handles can only have one outgoing connection
   */
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      // Check if the source node already has an outgoing connection
      const sourceNodeId = params.source;
      const existingEdgeFromSource = edges.find(edge => 
        edge.source === sourceNodeId && edge.sourceHandle === params.sourceHandle
      );

      if (existingEdgeFromSource) {
        toast({
          title: "Connection Error",
          description: "Each message can only have one outgoing connection.",
          variant: "destructive",
        });
        return;
      }

      // Add the new edge
      setEdges((eds) => addEdge(params, eds));
    },
    [edges, toast, setEdges]
  );

  /**
   * Handle drag over event for drop zone
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle drop event to create new nodes
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type || !reactFlowWrapper.current) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create new node based on dropped type
      const newNode: Node = {
        id: `node_${nodeIdCounter}`,
        type,
        position,
        data: { label: 'New message' },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter(prev => prev + 1);
    },
    [screenToFlowPosition, nodeIdCounter, setNodes]
  );

  /**
   * Update node data (called from SettingsPanel or inline edit)
   */
  const onUpdateNode = useCallback((nodeId: string, data: Partial<MessageNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, [setNodes]);

  /**
   * Deselect current node
   */
  const onDeselectNode = useCallback(() => {
    setSelectedNode(null);
  }, []);

  /**
   * Validate and save the flow
   * Only allow save if there is at most one disconnected node (node with no incoming edges)
   */
  const onSave = useCallback(() => {
    // Check if there are more than one nodes
    if (nodes.length === 0) {
      toast({
        title: "Nothing to Save",
        description: "Add at least one node to save your chatbot flow.",
        variant: "destructive",
      });
      return;
    }

    // Find nodes with no incoming connections (empty target handles)
    const nodesWithoutTargets = nodes.filter(node => {
      return !edges.some(edge => edge.target === node.id);
    });

    // Allow save only if at most one node is disconnected
    if (nodesWithoutTargets.length > 1) {
      toast({
        title: "Save Error",
        description: "Cannot save: More than one node is disconnected. Each flow should have only one starting point.",
        variant: "destructive",
      });
      return;
    }

    // Validation passed - save the flow
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ nodes, edges }));
    setHasSavedData(true);
    toast({
      title: "Flow Saved",
      description: "Your chatbot flow has been saved successfully!",
    });
  }, [nodes, edges, toast]);

  // Delete node handler
  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  return (
    <div className="h-screen flex bg-background">
      {/* Main Flow Area */}
      <div className="flex-1 relative">
        {/* Save & Reset Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button onClick={onSave} className="shadow-lg">
            Save Changes
          </Button>
          {hasSavedData && (
            <Button variant="destructive" onClick={handleReset} className="shadow-lg">
              Reset Flow
            </Button>
          )}
        </div>

        {/* Confirmation Popup */}
        {resetting && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg border space-y-4 min-w-[320px]">
              <h2 className="font-semibold text-lg">Reset Flow?</h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete your entire chatbot flow? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={cancelReset}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmReset}>
                  Yes, Reset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* React Flow */}
        <div ref={reactFlowWrapper} className="w-full h-full">
          <ReactFlow
            nodes={nodes.map(node =>
              node.type === 'messageNode'
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      // Provide onChange for inline editing
                      onChange: (label: string) => onUpdateNode(node.id, { label }),
                    },
                  }
                : node
            )}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            className="bg-flow-bg"
            fitView
          >
            <Controls className="bg-card border border-border" />
            <Background />
          </ReactFlow>
        </div>
      </div>

      {/* Right Panel - Nodes or Settings */}
      {selectedNode ? (
        <SettingsPanel
          selectedNode={selectedNode}
          onUpdateNode={onUpdateNode}
          onDeselectNode={onDeselectNode}
          onDeleteNode={handleDeleteNode}
        />
      ) : (
        <NodesPanel />
      )}
    </div>
  );
};

/**
 * FlowBuilder Wrapper with ReactFlowProvider
 */
const FlowBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
};

export default FlowBuilder;