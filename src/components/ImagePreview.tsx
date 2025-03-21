import React from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';

interface ImagePreviewProps {
  title: string;
  imageSrc?: string | null;
  isProcessing?: boolean;
  fileInfo?: { name: string; size: number } | null;
  additionalInfo?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  title,
  imageSrc,
  isProcessing,
  fileInfo,
  additionalInfo,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative group">
        {isProcessing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          </div>
        ) : imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      {fileInfo && (
        <div className="text-sm text-gray-600">
          {fileInfo.name} ({(fileInfo.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
      {additionalInfo && (
        <div className="text-sm text-gray-600">{additionalInfo}</div>
      )}
    </div>
  );
};