# MediaCraft Frontend

This is the Next.js frontend for MediaCraft, a professional video editing tool.

## Features

- Video Watermark Removal
- Video Merging
- Internationalization (English and Chinese)
- SEO Friendly

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

## Project Structure

- `/public` - Static files and localization resources
- `/src/components` - Reusable UI components
- `/src/pages` - Next.js pages and API routes
- `/src/services` - API services
- `/src/styles` - Global styles
- `/src/utils` - Utility functions

## Internationalization

The application supports English and Chinese languages. Translations are stored in:

- `/public/locales/en/common.json`
- `/public/locales/zh/common.json`

## API Integration

The frontend communicates with the Flask backend API. API services are defined in:

- `/src/services/api.js`