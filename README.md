# Image Upscaler

A web application for upscaling images to print-ready formats using AI-powered algorithms.

## Features

- Multiple print size options (24x36", 24x32", 24x30", 11x14", A1)
- High-quality upscaling with 300 DPI output
- Batch processing support
- ZIP download for multiple sizes
- Free to use

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This application is configured for deployment on Render. The `render.yaml` file contains the service configuration.

1. Fork/clone this repository
2. Create a new Web Service in Render
3. Connect your repository
4. Render will automatically detect the configuration and deploy

## Environment Variables

- `PORT`: Server port (default: 10000)

## License

MIT