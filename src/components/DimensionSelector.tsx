import React from 'react';
import { Ruler, Check } from 'lucide-react';
import type { PrintDimension } from '../types';

interface DimensionSelectorProps {
  dimensions: PrintDimension[];
  selectedDimensions: PrintDimension[];
  onSelect: (dimensions: PrintDimension[]) => void;
}

export const DimensionSelector: React.FC<DimensionSelectorProps> = ({
  dimensions,
  selectedDimensions,
  onSelect,
}) => {
  const toggleDimension = (dimension: PrintDimension) => {
    const isSelected = selectedDimensions.some(d => d.id === dimension.id);
    if (isSelected) {
      onSelect(selectedDimensions.filter(d => d.id !== dimension.id));
    } else {
      onSelect([...selectedDimensions, dimension]);
    }
  };

  const selectAll = () => {
    onSelect(dimensions);
  };

  const clearAll = () => {
    onSelect([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-800">
          <Ruler className="w-6 h-6" />
          <h3 className="text-xl font-semibold">Select Print Dimensions</h3>
        </div>
        <div className="flex gap-4">
          <button
            onClick={selectAll}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearAll}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dimensions.map((dimension) => {
          const isSelected = selectedDimensions.some(d => d.id === dimension.id);
          return (
            <button
              key={dimension.id}
              onClick={() => toggleDimension(dimension)}
              className={`dimension-card ${
                isSelected ? 'dimension-card-selected' : 'dimension-card-default'
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-900">{dimension.name}</div>
                  {isSelected && (
                    <div className="bg-indigo-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {dimension.description}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {(dimension.width * dimension.dpi).toFixed(0)} × {(dimension.height * dimension.dpi).toFixed(0)} px @ {dimension.dpi} DPI
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br ${
                isSelected ? 'from-indigo-500/5 to-blue-500/5' : 'from-transparent to-transparent'
              } transition-opacity duration-200`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};