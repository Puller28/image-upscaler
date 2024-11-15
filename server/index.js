import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set required Sharp environment variables if not already set
process.env.SHARP_IGNORE_GLOBAL = process.env.SHARP_IGNORE_GLOBAL || "1";
process.env.SHARP_DIST_BASE_URL = process.env.SHARP_DIST_BASE_URL || "https://raw.githubusercontent.com/lovell/sharp-libvips/master/vendor/lib/linux-x64";

const app = express();
const port = process.env.PORT || 10000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the dist directory
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('Received file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
}).single('image');

app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    }
  });
});

app.post('/api/upscale', (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Upload error:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        return res.status(400).json({
          error: 'Upload failed',
          details: err.message
        });
      }

      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({
          error: 'No image provided',
          details: 'Please select an image to upload'
        });
      }

      const width = parseInt(req.query.width || '7200', 10);
      const height = parseInt(req.query.height || '10800', 10);
      const dpi = parseInt(req.query.dpi || '300', 10);

      console.log('Processing image:', {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
      });

      console.log('Target dimensions:', { width, height, dpi });

      // Verify buffer integrity
      if (!req.file.buffer || req.file.buffer.length === 0) {
        throw new Error('Invalid image buffer');
      }

      const metadata = await sharp(req.file.buffer).metadata();
      console.log('Original image metadata:', metadata);
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image dimensions');
      }

      // Log Sharp version and libvips info
      console.log('Sharp version:', sharp.versions);
      console.log('Sharp platform:', sharp.platform);

      const processedImage = await sharp(req.file.buffer)
        .resize(width, height, {
          kernel: 'lanczos3',
          fit: 'cover',
          position: 'center'
        })
        .withMetadata({
          density: dpi
        })
        .jpeg({
          quality: 95,
          chromaSubsampling: '4:4:4',
          force: true
        })
        .toBuffer({ resolveWithObject: true });

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
        if (error.message.includes('Input buffer contains unsupported image format')) {
          return res.status(400).json({
            error: 'Unsupported image format',
            details: 'Please upload a valid image file'
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