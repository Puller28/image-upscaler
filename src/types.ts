export interface RequestInfo {
  type: string;
  size: number;
  name: string;
}

export interface ResponseInfo {
  dimensions?: {
    width: number;
    height: number;
  };
  format?: string;
  size?: number;
}

export interface DebugInfo {
  status: 'processing' | 'success' | 'error';
  error?: string;
  requestInfo: RequestInfo;
  responseInfo?: ResponseInfo;
}

export interface PrintDimension {
  id: string;
  name: string;
  width: number;
  height: number;
  dpi: number;
  description: string;
}

export const PRINT_DIMENSIONS: PrintDimension[] = [
  {
    id: '24x36',
    name: '24" × 36"',
    width: 24,
    height: 36,
    dpi: 300,
    description: 'Large Format Poster (2:3)'
  },
  {
    id: '24x32',
    name: '24" × 32"',
    width: 24,
    height: 32,
    dpi: 300,
    description: 'Large Format Print (3:4)'
  },
  {
    id: '24x30',
    name: '24" × 30"',
    width: 24,
    height: 30,
    dpi: 300,
    description: 'Large Format Print (4:5)'
  },
  {
    id: '11x14',
    name: '11" × 14"',
    width: 11,
    height: 14,
    dpi: 300,
    description: 'Standard Photo Print'
  },
  {
    id: 'a1',
    name: 'A1 (ISO)',
    width: 23.39,
    height: 33.11,
    dpi: 300,
    description: 'International Standard (594mm × 841mm)'
  }
];