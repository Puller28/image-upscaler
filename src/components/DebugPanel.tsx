import React from 'react';
import { Terminal } from 'lucide-react';
import type { DebugInfo } from '../types';

interface DebugPanelProps {
  debugInfo: DebugInfo;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ debugInfo }) => {
  if (!debugInfo) return null;

  return (
    <div className="mt-8 p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5" />
        <h3 className="font-semibold">Debug Information</h3>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Status: </span>
          <span className={debugInfo.error ? 'text-red-400' : 'text-green-400'}>
            {debugInfo.status}
          </span>
        </div>
        
        {debugInfo.requestInfo && (
          <div>
            <div className="text-gray-400 mb-1">Request Info:</div>
            <div className="pl-4">
              <div>Type: {debugInfo.requestInfo.type}</div>
              <div>Size: {(debugInfo.requestInfo.size / 1024 / 1024).toFixed(2)} MB</div>
              <div>Name: {debugInfo.requestInfo.name}</div>
            </div>
          </div>
        )}

        {debugInfo.responseInfo && (
          <div>
            <div className="text-gray-400 mb-1">Response Info:</div>
            <div className="pl-4">
              {debugInfo.responseInfo.dimensions && (
                <>
                  <div>Width: {debugInfo.responseInfo.dimensions.width}px</div>
                  <div>Height: {debugInfo.responseInfo.dimensions.height}px</div>
                </>
              )}
              {debugInfo.responseInfo.format && (
                <div>Format: {debugInfo.responseInfo.format}</div>
              )}
              {debugInfo.responseInfo.size && (
                <div>Size: {(debugInfo.responseInfo.size / 1024 / 1024).toFixed(2)} MB</div>
              )}
            </div>
          </div>
        )}

        {debugInfo.error && (
          <div className="text-red-400">
            Error Details: {debugInfo.error}
          </div>
        )}
      </div>
    </div>
  );
};