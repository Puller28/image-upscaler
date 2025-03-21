import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Sharp for better memory management
sharp.concurrency(1);
sharp.cache(false);
sharp.simd(true);

// Set required Sharp environment variables if not already set
process.env.SHARP_IGNORE_GLOBAL = process.env.SHARP_IGNORE_GLOBAL || "1";
process.env.SHARP_DIST_BASE_URL = process.env.SHARP_DIST_BASE_URL || "https://raw.githubusercontent.com/lovell/sharp-libvips/master/vendor/lib/linux-x64";

const app = express();
const port = process.env.PORT || 10000;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Enable CORS with specific configuration
app.use(cors({
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Serve static files from the dist directory
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
}).single('image');

app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    },
    sharp: {
      versions: sharp.versions,
      platform: sharp.platform,
      concurrency: sharp.concurrency(),
      simd: sharp.simd()
    }
  });
});

const processImageInChunks = async (buffer, options) => {
  try {
    // First try to get metadata without limitations
    let metadata;
    try {
      // Create a Sharp instance with no pixel limit
      const metadataPipeline = sharp(buffer, {
        limitInputPixels: false, // Disable pixel limit entirely
        sequentialRead: true,
        failOn: 'none'
      });
      
      metadata = await metadataPipeline.metadata();
      console.log('Original image metadata (no limit):', metadata);
    } catch (metadataError) {
      console.error('Error getting metadata:', metadataError);
      throw metadataError;
    }

    // For extremely large images, implement progressive downscaling
    const pixelCount = metadata.width * metadata.height;
    const MAX_SAFE_PIXELS = 100000000; // 100 million pixels (roughly 10000x10000)
    
    // If image is extremely large, downscale it first to make it processable
    if (pixelCount > MAX_SAFE_PIXELS) {
      console.log(`Image is very large (${pixelCount} pixels). Using progressive downscaling approach.`);
      
      // Calculate downscaling factor
      const downscaleFactor = Math.sqrt(MAX_SAFE_PIXELS / pixelCount);
      const intermediateWidth = Math.floor(metadata.width * downscaleFactor);
      const intermediateHeight = Math.floor(metadata.height * downscaleFactor);
      
      console.log(`Downscaling first to ${intermediateWidth}x${intermediateHeight}`);
      
      // First downscale the image to make it processable
      const intermediateBuffer = await sharp(buffer, {
        limitInputPixels: false,
        sequentialRead: true
      })
      .resize(intermediateWidth, intermediateHeight, {
        kernel: 'lanczos3',
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();
      
      // Now process the downscaled version
      return sharp(intermediateBuffer, {
        sequentialRead: true
      })
      .resize(options.width, options.height, {
        kernel: 'lanczos3',
        fit: 'cover',
        position: 'center',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .withMetadata({
        density: options.dpi
      })
      .jpeg({
        quality: 90,
        chromaSubsampling: '4:4:4',
        force: true,
        mozjpeg: true
      })
      .toBuffer({ resolveWithObject: true });
    }
    
    // For regular-sized images, process directly
    return sharp(buffer, {
      limitInputPixels: false, // Disable pixel limit entirely
      sequentialRead: true,
      failOn: 'none'
    })
    .resize(options.width, options.height, {
      kernel: 'lanczos3',
      fit: 'cover',
      position: 'center',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .withMetadata({
      density: options.dpi
    })
    .jpeg({
      quality: 90,
      chromaSubsampling: '4:4:4',
      force: true,
      mozjpeg: true
    })
    .toBuffer({ resolveWithObject: true });
  } catch (error) {
    console.error('Error in image processing:', error);
    throw error;
  }
};

app.post('/api/upscale', (req, res) => {
  upload(req, res, async (err) => {
    // Handle multer upload errors
    if (err) {
      console.error('Upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          details: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      }
      return res.status(400).json({
        error: 'Upload failed',
        details: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        details: 'Please select an image file'
      });
    }

    console.log('Processing image:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
    });

    // Extract parameters with validation
    const width = Math.min(10000, parseInt(req.query.width, 10) || 7200);  // Cap at 10k width
    const height = Math.min(10000, parseInt(req.query.height, 10) || 10800); // Cap at 10k height 
    const dpi = parseInt(req.query.dpi, 10) || 300;

    console.log('Target dimensions:', { width, height, dpi });

    try {
      // Add memory usage tracking
      const memBefore = process.memoryUsage();
      console.log('Memory before processing:', memBefore);

      const processedImage = await processImageInChunks(req.file.buffer, {
        width,
        height,
        dpi
      });

      // Force garbage collection after processing if available
      if (global.gc) {
        global.gc();
      }

      const memAfter = process.memoryUsage();
      console.log('Memory after processing:', memAfter);
      console.log('Memory difference:', {
        rss: memAfter.rss - memBefore.rss,
        heapTotal: memAfter.heapTotal - memBefore.heapTotal,
        heapUsed: memAfter.heapUsed - memBefore.heapUsed
      });

      console.log('Image processed successfully:', {
        width: processedImage.info.width,
        height: processedImage.info.height,
        size: processedImage.data.length,
        format: processedImage.info.format
      });

      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': processedImage.data.length,
        'Cache-Control': 'no-cache',
        'X-Image-Width': processedImage.info.width,
        'X-Image-Height': processedImage.info.height,
        'X-Image-DPI': dpi
      });
      
      res.send(processedImage.data);

    } catch (error) {
      console.error('Processing error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        sharpInfo: {
          versions: sharp.versions,
          platform: sharp.platform,
          memory: process.memoryUsage()
        }
      });

      if (error instanceof Error) {
        // Handle specific sharp errors with clearer messages
        if (error.message.includes('Input buffer contains unsupported image format')) {
          return res.status(400).json({
            error: 'Unsupported image format',
            details: 'Please upload a valid JPEG, PNG, WebP, or TIFF image'
          });
        }

        if (error.message.includes('Input image exceeds pixel limit')) {
          return res.status(400).json({
            error: 'Image too large',
            details: 'The image dimensions are too large. Try reducing the image size before uploading.'
          });
        }

        if (error.message.includes('memory')) {
          return res.status(500).json({
            error: 'Out of memory',
            details: 'The server ran out of memory while processing this image. Try a smaller image.'
          });
        }
        
        return res.status(500).json({
          error: 'Processing failed',
          details: error.message
        });
      }
      
      res.status(500).json({
        error: 'Server error',
        details: 'An unexpected error occurred'
      });
    }
  });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Graceful shutdown handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    SHARP_IGNORE_GLOBAL: process.env.SHARP_IGNORE_GLOBAL,
    SHARP_DIST_BASE_URL: process.env.SHARP_DIST_BASE_URL
  });
})
.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  shutdown();
});