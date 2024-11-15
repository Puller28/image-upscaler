import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import multer from 'multer';
import { promisify } from 'util';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

const runMiddleware = promisify(upload.single('image'));

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res);

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        error: 'No image provided',
        details: 'Please select an image to upload'
      });
    }

    const width = parseInt(req.query.width as string || '7200', 10);
    const height = parseInt(req.query.height as string || '10800', 10);
    const dpi = parseInt(req.query.dpi as string || '300', 10);

    const metadata = await sharp(file.buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }

    const processedImage = await sharp(file.buffer)
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

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', processedImage.data.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Image-Width', processedImage.info.width);
    res.setHeader('X-Image-Height', processedImage.info.height);
    res.setHeader('X-Image-DPI', dpi);
    
    res.send(processedImage.data);

  } catch (error) {
    console.error('Processing error:', error);
    
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
}