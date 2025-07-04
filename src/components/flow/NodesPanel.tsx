import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * NodesPanel Component
 * 
 * This panel displays all available node types that can be dragged into the flow.
 * Currently supports only Message nodes, but designed to be extensible for future node types.
 * 
 * Features:
 * - Drag and drop functionality for creating new nodes
 * - Clean, organized display of available node types
 * - Extensible structure for adding new node types
 */

interface NodeType {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

// Define available node types - easily extensible for future node types
const nodeTypes: NodeType[] = [
  {
    type: 'messageNode',
    label: 'Message',
    description: 'Send a text message',
    icon: MessageSquare,
    color: 'bg-primary text-primary-foreground'
  }
  // Future node types can be added here:
  // {
  //   type: 'conditionalNode',
  //   label: 'Condition',
  //   description: 'Add conditional logic',
  //   icon: GitBranch,
  //   color: 'bg-secondary text-secondary-foreground'
  // }
];

const NodesPanel: React.FC = () => {
  /**
   * Handle drag start event for node creation
   * Sets the transfer data that will be used when dropping the node
   */
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="w-80 h-full border-l">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Nodes Panel</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag and drop nodes to build your chatbot flow
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {nodeTypes.map((nodeType) => {
          const IconComponent = nodeType.icon;
          return (
            <div
              key={nodeType.type}
              className="flex items-center p-3 border border-border rounded-lg cursor-grab hover:shadow-md transition-shadow bg-card"
              draggable
              onDragStart={(event) => onDragStart(event, nodeType.type)}
            >
              <div className={`p-2 rounded-md ${nodeType.color} mr-3`}>
                <IconComponent size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{nodeType.label}</h3>
                <p className="text-xs text-muted-foreground">{nodeType.description}</p>
              </div>
            </div>
          );
        })}
        
        {/* Placeholder for future node types */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            More node types coming soon...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NodesPanel;