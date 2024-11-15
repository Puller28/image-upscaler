import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  isProcessing: boolean;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ isProcessing }) => {
  if (!isProcessing) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
      <Loader2 className="w-5 h-5 animate-spin" />
      <p className="text-sm">
        Processing your image... This may take several minutes for multiple formats.
      </p>
    </div>
  );
};