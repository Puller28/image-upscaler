import axios, { AxiosError } from 'axios';
import JSZip from 'jszip';
import type { DebugInfo, PrintDimension } from '../types';

interface ErrorResponse {
  error?: string;
  details?: string;
}

interface ProcessedImage {
  url: string;
  dimension: PrintDimension;
}

const API_URL = '/api';  // Use relative path since backend serves frontend
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

const validateImageDimensions = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < 100 || img.height < 100) {
        reject(new ImageValidationError('Image dimensions too small. Minimum size is 100x100 pixels.'));
      }
      if (img.width > 8000 || img.height > 8000) {
        reject(new ImageValidationError('Image dimensions too large. Maximum size is 8000x8000 pixels.'));
      }
      resolve();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageValidationError('Failed to load image. Please ensure it\'s a valid image file.'));
    };

    img.src = objectUrl;
  });
};

const validateImageFormat = (file: File): void => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new ImageValidationError(
      'Unsupported image format. Please use JPG, PNG, or WebP images.'
    );
  }
};

const validateImageSize = (file: File): void => {
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageValidationError(
      `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`
    );
  }
  if (file.size === 0) {
    throw new ImageValidationError('File appears to be empty.');
  }
};

const validateImage = async (file: File): Promise<void> => {
  validateImageFormat(file);
  validateImageSize(file);
  await validateImageDimensions(file);
};

const checkServerHealth = async (): Promise<void> => {
  try {
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000
    });
    
    if (response.data?.status !== 'ok') {
      throw new Error('Processing server is not ready');
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Server connection error: ${error.message}`);
    }
    throw error;
  }
};

const handleErrorResponse = async (error: AxiosError): Promise<never> => {
  if (error.response) {
    const response = error.response;
    const errorData = response.data;

    if (errorData instanceof Blob) {
      const textData = await errorData.text();
      try {
        const jsonError = JSON.parse(textData) as ErrorResponse;
        throw new Error(jsonError.details || jsonError.error || 'Processing failed');
      } catch {
        throw new Error('Processing failed');
      }
    }

    if (typeof errorData === 'object' && errorData !== null) {
      const typedError = errorData as ErrorResponse;
      throw new Error(typedError.details || typedError.error || 'Processing failed');
    }
  }

  throw new Error('Failed to process image');
};

interface ProcessResult {
  processedImageUrl: string;
  debug: DebugInfo;
}

export const uploadAndProcessImage = async (
  file: File,
  dimension: PrintDimension
): Promise<ProcessResult> => {
  try {
    await validateImage(file);
    await checkServerHealth();

    const formData = new FormData();
    formData.append('image', file);

    const targetWidth = Math.round(dimension.width * dimension.dpi);
    const targetHeight = Math.round(dimension.height * dimension.dpi);

    const response = await axios.post(
      `${API_URL}/upscale?width=${targetWidth}&height=${targetHeight}&dpi=${dimension.dpi}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob',
        timeout: 300000, // 5 minute timeout for large images
        validateStatus: status => status === 200,
        maxBodyLength: MAX_FILE_SIZE,
        maxContentLength: MAX_FILE_SIZE * 5 // Allow for larger processed images
      }
    );

    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('Invalid response from server');
    }

    const contentType = response.headers['content-type'];
    if (!contentType?.startsWith('image/')) {
      throw new Error('Invalid response type from server');
    }

    const debug: DebugInfo = {
      status: 'success',
      requestInfo: {
        type: file.type,
        size: file.size,
        name: file.name
      },
      responseInfo: {
        dimensions: {
          width: parseInt(response.headers['x-image-width'] || '0', 10),
          height: parseInt(response.headers['x-image-height'] || '0', 10)
        },
        format: contentType,
        size: response.data.size
      }
    };

    return {
      processedImageUrl: URL.createObjectURL(new Blob([response.data], { type: contentType })),
      debug
    };

  } catch (error) {
    const debug: DebugInfo = {
      status: 'error',
      requestInfo: {
        type: file.type,
        size: file.size,
        name: file.name
      },
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };

    if (error instanceof ImageValidationError) {
      throw { message: error.message, debug };
    }
    if (error instanceof AxiosError) {
      const errorMessage = await handleErrorResponse(error);
      throw { message: errorMessage, debug };
    }
    if (error instanceof Error) {
      throw { message: error.message, debug };
    }
    throw { message: 'An unexpected error occurred. Please try again.', debug };
  }
};

export const downloadAllImages = async (images: ProcessedImage[], originalFileName: string): Promise<void> => {
  const zip = new JSZip();
  const imageFolder = zip.folder('upscaled-images');
  
  if (!imageFolder) {
    throw new Error('Failed to create zip folder');
  }

  await Promise.all(
    images.map(async (img) => {
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const fileName = `upscaled-${img.dimension.id}-${originalFileName}`;
        imageFolder.file(fileName, blob);
      } catch (error) {
        console.error(`Failed to add ${img.dimension.id} to zip:`, error);
        throw new Error(`Failed to prepare ${img.dimension.name} for download`);
      }
    })
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `upscaled-images-${originalFileName.split('.')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};