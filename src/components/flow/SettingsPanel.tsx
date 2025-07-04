import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Node } from '@xyflow/react';
import { MessageNodeData } from './MessageNode';

/**
 * SettingsPanel Component
 * 
 * This panel appears when a node is selected and allows editing of node properties.
 * Currently supports editing text content for Message nodes.
 * 
 * Features:
 * - Edit message text for selected nodes
 * - Back button to return to nodes panel
 * - Real-time updates to the flow
 */

interface SettingsPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: Partial<MessageNodeData>) => void;
  onDeselectNode: () => void;
  onDeleteNode?: () => void; // Add this prop
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeselectNode,
  onDeleteNode,
}) => {
  const originalLabel = (selectedNode?.data as unknown as MessageNodeData)?.label || '';
  const [inputValue, setInputValue] = React.useState(originalLabel);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    setInputValue(originalLabel);
    setDirty(false);
  }, [selectedNode, originalLabel]);

  /**
   * Handle text input changes and update the node data
   */
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setDirty(event.target.value !== originalLabel);
  };

  // Only update node data when Save is clicked
  const handleSave = () => {
    if (selectedNode && dirty) {
      onUpdateNode(selectedNode.id, { label: inputValue });
      setDirty(false);
    }
  };

  return (
    <Card className="w-80 h-full border-l">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onDeselectNode}
            className="p-1 h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <CardTitle className="text-lg font-semibold">Settings Panel</CardTitle>
            <p className="text-sm text-muted-foreground">
              Edit node properties
            </p>
          </div>
        </div>
      </CardHeader>
      
      {selectedNode && (
        <CardContent className="space-y-4">
          {/* Message Node Settings */}
          {selectedNode.type === 'messageNode' && (
            <div className="space-y-3">
              <div className="p-3 bg-primary-light rounded-lg">
                <h3 className="font-medium text-sm mb-1">Message Node</h3>
                <p className="text-xs text-muted-foreground">
                  Configure the text message that will be sent
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message-text" className="text-sm font-medium">
                  Message Text
                </Label>
                <Input
                  id="message-text"
                  type="text"
                  placeholder="Enter your message..."
                  value={inputValue}
                  onChange={handleTextChange}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={!dirty}
                    className="w-full"
                  >
                    Save
                  </Button>
                  {onDeleteNode && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={onDeleteNode}
                    >
                      Delete Node
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  This text will be displayed in the chat flow
                </p>
              </div>
            </div>
          )}
          
          {/* Node Information */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="font-medium text-sm">Node Information</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>ID:</strong> {selectedNode.id}</p>
              <p><strong>Type:</strong> {selectedNode.type}</p>
              <p><strong>Position:</strong> ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SettingsPanel;