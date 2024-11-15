import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropZoneProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onDrop, onFileSelect }) => {
  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative group cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-2xl transition-all duration-300 group-hover:from-indigo-500/20 group-hover:to-blue-500/20" />
      <div className="relative border-2 border-dashed border-white/30 rounded-2xl p-12 text-center transition-all duration-300 group-hover:border-indigo-400">
        <div className="max-w-sm mx-auto">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full blur-2xl opacity-20" />
            <div className="relative">
              <ImageIcon className="w-20 h-20 mx-auto text-indigo-600 animate-float" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Drag and drop your image here
          </h3>
          <p className="text-gray-600 mb-6">
            or click to select a file from your computer
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="glass-button inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            Select Image
          </label>
        </div>
      </div>
    </div>
  );
};