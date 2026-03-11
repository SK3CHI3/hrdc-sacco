'use client';

import { useEffect } from 'react';

interface ElevenLabsWidgetProps {
  agentId: string;
}

export function ElevenLabsWidget({ agentId }: ElevenLabsWidgetProps) {
  useEffect(() => {
    // Create the custom element dynamically
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', agentId);
    
    // Add to DOM
    document.body.appendChild(widget);
    
    // Cleanup on unmount
    return () => {
      if (widget.parentNode) {
        widget.parentNode.removeChild(widget);
      }
    };
  }, [agentId]);

  return null; // Component doesn't render anything itself
}
