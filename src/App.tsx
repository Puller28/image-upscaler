import React, { useState, useCallback } from 'react';
import { Download, Package, Wand2 } from 'lucide-react';
import { DropZone } from './components/DropZone';
import { ImagePreview } from './components/ImagePreview';
import { ErrorMessage } from './components/ErrorMessage';
import { ProcessingStatus } from './components/ProcessingStatus';
import { DebugPanel } from './components/DebugPanel';
import { DimensionSelector } from './components/DimensionSelector';
import { FAQ } from './components/FAQ';
import { uploadAndProcessImage, downloadAllImages } from './services/imageService';
import { PRINT_DIMENSIONS } from './types';
import type { DebugInfo, PrintDimension, ProcessedImage } from './types';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedDimensions, setSelectedDimensions] = useState<PrintDimension[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('image/')) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(droppedFile);
      setProcessedImages([]);
      setError(null);
      setDebugInfo(null);
    } else {
      setError('Please drop a valid image file.');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
      setProcessedImages([]);
      setError(null);
      setDebugInfo(null);
    }
  }, []);

  const handleUpscale = useCallback(async () => {
    if (!file || selectedDimensions.length === 0) return;

    setIsProcessing(true);
    setError(null);
    const newProcessedImages: ProcessedImage[] = [];

    try {
      for (const dimension of selectedDimensions) {
        const { processedImageUrl } = await uploadAndProcessImage(file, dimension);
        newProcessedImages.push({
          url: processedImageUrl,
          dimension
        });
      }
      setProcessedImages(newProcessedImages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [file, selectedDimensions]);

  const handleDownloadAll = useCallback(async () => {
    if (!file || processedImages.length === 0) return;
    try {
      await downloadAllImages(processedImages, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download images');
    }
  }, [file, processedImages]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setProcessedImages([]);
    setSelectedDimensions([]);
    setIsProcessing(false);
    setError(null);
    setDebugInfo(null);
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section with Schema.org Markup */}
        <section itemScope itemType="https://schema.org/WebApplication">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Wand2 className="w-12 h-12 text-white animate-float" aria-hidden="true" />
              <h1 className="text-5xl font-bold text-white" itemProp="name">
                Print-Ready Image Upscaler
              </h1>
            </div>
            <p className="text-xl text-white/90 mb-2" itemProp="description">
              Transform your images into high-quality prints with professional DPI
            </p>
            <p className="text-white/75">
              Free online tool to resize images for posters, artwork, and large format printing
            </p>
            <meta itemProp="applicationCategory" content="Image Processing Tool" />
            <meta itemProp="operatingSystem" content="Any" />
          </div>
        </section>

        {/* Main Application Section */}
        <div className="glass-panel rounded-3xl p-8 mb-8" role="main">
          {!preview ? (
            <DropZone onDrop={handleDrop} onFileSelect={handleFileInput} />
          ) : (
            <div className="space-y-8">
              <DimensionSelector
                dimensions={PRINT_DIMENSIONS}
                selectedDimensions={selectedDimensions}
                onSelect={setSelectedDimensions}
              />

              <div className="flex justify-center">
                <ImagePreview
                  title="Original Image"
                  imageSrc={preview}
                  fileInfo={file ? { name: file.name, size: file.size } : null}
                />
              </div>

              <ProcessingStatus isProcessing={isProcessing} />
              {error && <ErrorMessage message={error} />}

              {processedImages.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 text-center">
                    Processed Images Ready
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {processedImages.map((img) => (
                      <a
                        key={img.dimension.id}
                        href={img.url}
                        download={`upscaled-${img.dimension.id}-${file?.name}`}
                        className="glass-button-secondary inline-flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        {img.dimension.name}
                      </a>
                    ))}
                    {processedImages.length > 1 && (
                      <button
                        onClick={handleDownloadAll}
                        className="glass-button inline-flex items-center gap-2"
                      >
                        <Package className="w-5 h-5" />
                        Download All
                      </button>
                    )}
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleReset}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Process Another Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-4">
                  {!isProcessing && selectedDimensions.length > 0 && (
                    <button
                      onClick={handleUpscale}
                      className="glass-button"
                      aria-label="Start image upscaling process"
                    >
                      Start Upscaling
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="glass-button-secondary"
                    aria-label="Reset and upload new image"
                  >
                    Upload New Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <FAQ />
        </div>

        <footer className="mt-8 text-center text-white/60 text-sm">
          <p>Supported formats: JPG, PNG, WEBP • Maximum file size: 25MB</p>
        </footer>
      </div>
    </div>
  );
}

export default App;