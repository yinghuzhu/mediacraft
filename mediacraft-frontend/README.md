# MediaCraft Frontend

This is the Next.js frontend for MediaCraft, a professional video processing web application.

## Features

### 🎨 Modern Web Interface
- **Next.js 14**: Latest React framework with App Router
- **Server-Side Rendering**: Improved SEO and performance
- **Responsive Design**: Optimized for all device sizes
- **Real-time Updates**: Live progress tracking and notifications

### 🌍 Internationalization
- **Multi-language Support**: English and Chinese
- **Dynamic Language Switching**: Change language without page reload
- **Localized Content**: All UI elements and messages translated

### 🎬 Video Processing Features
- **Watermark Removal**: AI-powered watermark detection and removal
- **Video Merging**: Combine multiple videos with precise control
- **Drag & Drop Interface**: Intuitive file upload and management
- **Progress Tracking**: Real-time processing status updates

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd mediacraft-frontend
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Docker Deployment

You can deploy the application using Docker:

```bash
# Build the Docker image
docker build -t mediacraft-frontend .

# Run the container
docker run -p 3000:3000 mediacraft-frontend
```

Or using Docker Compose to deploy both frontend and backend:

```bash
docker-compose up -d
```

## Project Structure

```
mediacraft-frontend/
├── 📁 public/                    # Static assets
│   ├── locales/                  # Internationalization files
│   │   ├── en/common.json       # English translations
│   │   └── zh/common.json       # Chinese translations
│   ├── manifest.json            # PWA manifest
│   └── robots.txt               # SEO robots file
├── 📁 src/
│   ├── components/              # Reusable React components
│   │   ├── FileUpload.js       # File upload component
│   │   ├── ProgressBar.js      # Progress tracking component
│   │   └── LanguageSwitcher.js # Language selection component
│   ├── pages/                   # Next.js pages (App Router)
│   │   ├── index.js            # Home page
│   │   ├── watermark-remover.js # Watermark removal page
│   │   ├── video-merger.js     # Video merger page
│   │   └── _app.js             # App configuration
│   ├── services/               # API integration
│   │   └── api.js              # Backend API client
│   ├── styles/                 # Styling files
│   │   ├── globals.css         # Global styles
│   │   └── components.css      # Component styles
│   └── utils/                  # Utility functions
│       ├── constants.js        # Application constants
│       └── helpers.js          # Helper functions
├── 📄 next.config.js           # Next.js configuration
├── 📄 next-i18next.config.js   # Internationalization config
├── 📄 tailwind.config.js       # Tailwind CSS configuration
└── 📄 package.json             # Dependencies and scripts
```

## Internationalization

The application supports English and Chinese languages. Translations are stored in:

- `/public/locales/en/common.json`
- `/public/locales/zh/common.json`

## API Integration

The frontend communicates with the Flask backend API through a centralized service layer:

### API Configuration
- **Development**: Next.js rewrites proxy API requests to `http://localhost:50001`
- **Production**: Nginx proxies `/api/*` requests to the Flask backend
- **Base URL**: Automatically configured based on environment

### API Services (`/src/services/api.js`)
```javascript
// Watermark removal services
watermarkService.uploadVideo(file, onProgress)
watermarkService.getVideoFrames(taskUuid)
watermarkService.selectFrame(taskUuid, frameNumber)
watermarkService.selectRegions(taskUuid, regions)
watermarkService.getTaskStatus(taskUuid)
watermarkService.getDownloadUrl(taskUuid)

// Video merger services
mergeService.createTask(taskName, options)
mergeService.uploadVideo(taskUuid, file, onProgress)
mergeService.getTask(taskUuid)
mergeService.startMerge(taskUuid)
mergeService.getTaskStatus(taskUuid)
mergeService.getDownloadUrl(taskUuid)
```

## Performance Optimizations

### Next.js Optimizations
- **Image Optimization**: Automatic image optimization with Next.js Image component
- **Font Optimization**: Automatic font loading optimization
- **Code Splitting**: Automatic code splitting for faster page loads
- **Static Generation**: Pre-rendered pages for better performance
- **Server-Side Rendering**: SEO-friendly rendering

### Build Optimizations
- **SWC Minification**: Fast Rust-based minification
- **Compression**: Gzip compression enabled
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: Webpack bundle analyzer integration

### Runtime Optimizations
- **Lazy Loading**: Components loaded on demand
- **Caching**: Aggressive caching strategies
- **Prefetching**: Intelligent link prefetching
- **Service Worker**: PWA capabilities for offline support

### Development Experience
- **Fast Refresh**: Instant feedback during development
- **TypeScript Support**: Optional TypeScript integration
- **ESLint Integration**: Code quality enforcement
- **Hot Module Replacement**: Live code updates