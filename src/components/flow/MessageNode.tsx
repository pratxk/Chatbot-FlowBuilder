import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

// Define the data structure for our Message Node
export interface MessageNodeData {
  label: string;
}

/**
 * MessageNode Component
 * 
 * This is a custom node component for React Flow that represents a text message
 * in the chatbot flow. It includes:
 * - A source handle (bottom) that can only have one outgoing connection
 * - A target handle (top) that can accept multiple incoming connections
 * - Displays the message text with an icon
 */
const MessageNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as MessageNodeData;

  return (
    <div className={`message-node ${selected ? 'ring-2 ring-flow-selected ring-offset-2' : ''}`}>
      {/* Target Handle - allows multiple incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-flow-handle border-2 border-card"
        isConnectable={true}
      />

      {/* Node Header */}
      <div className="message-node-header flex items-center gap-2">
        <MessageSquare size={14} />
        <span>Send Message</span>
      </div>

      {/* Node Content - NOT editable here */}
      <div className="message-node-content text-sm mt-2 px-2 py-1">
        {nodeData?.label || <span className="text-muted-foreground">Enter your message...</span>}
      </div>

      {/* Source Handle - only allows one outgoing connection */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-flow-handle border-2 border-card"
        isConnectable={true}
      />
    </div>
  );
};

// Memoize the component for better performance
export default memo(MessageNode);