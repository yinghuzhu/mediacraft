# MediaCraft

A professional web application for video processing tasks including watermark removal and video merging, built with modern Next.js frontend and Flask backend architecture.

## Features

### 🎨 Modern Web Interface
- **Next.js Frontend**: Modern React-based user interface with server-side rendering
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Internationalization**: Support for English and Chinese languages
- **Real-time Updates**: Live progress tracking and status updates
- **SEO Optimized**: Server-side rendering for better search engine visibility

### Video Watermark Removal
- 🎬 **Multi-format Support**: Handles MP4, MOV, AVI, MKV video formats
- 🖼️ **Smart Frame Selection**: Choose the frame that best shows the watermark
- 🎯 **Precise Region Selection**: Mark multiple watermark regions with mouse drag
- 🤖 **AI-powered Processing**: Uses advanced image inpainting algorithms
- 🔊 **Audio Preservation**: Keeps the original audio track intact
- 📊 **Real-time Progress**: Shows processing status and progress
- 💾 **Easy Download**: Get your watermark-free video with one click

### Video Merger
- 🎞️ **Multi-video Merging**: Combine multiple videos into one seamless file
- ⏱️ **Precise Time Control**: Select specific segments from each video
- 🔄 **Drag & Drop Ordering**: Easily rearrange video sequence
- 🎵 **Audio Options**: Keep all audio, first video only, or remove audio
- 📱 **Mobile Friendly**: Optimized for touch devices
- ⚡ **High Performance**: Efficient FFmpeg-based processing

## Installation

### Prerequisites

**Backend Requirements:**
- Python 3.8+
- FFmpeg (for video processing)
- OpenCV dependencies

**Frontend Requirements:**
- Node.js 18+
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yinghuzhu/mediacraft.git
cd mediacraft
```

2. **Backend Setup:**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the Flask backend
python app.py
# Backend runs on http://localhost:50001
```

3. **Frontend Setup:**
```bash
# Navigate to frontend directory
cd mediacraft-frontend

# Install Node.js dependencies
npm install

# Start the Next.js development server
npm run dev
# Frontend runs on http://localhost:3000
```

4. **Access the Application:**
- **Development**: http://localhost:3000
- **Production**: https://mediacraft.yzhu.name

### Production Deployment

For production deployment, use the automated deployment scripts:

```bash
# Create release package
./scripts/deployment/create_release.sh

# Deploy to server
tar -xzf releases/mediacraft-2.0.0.tar.gz
cd mediacraft-2.0.0
sudo ./install.sh
```

## Usage

### Video Watermark Removal
1. **Upload Video**: Drag and drop or click to select a video file (max 500MB)
2. **Select Frame**: Choose a frame that clearly shows the watermark
3. **Mark Watermarks**: Draw rectangles around watermark regions
4. **Process Video**: Start processing and wait for completion
5. **Download**: Get your watermark-free video

### Video Merger
1. **Create Task**: Set task name and merge preferences
2. **Upload Videos**: Add multiple video files (up to 10 videos, 500MB each)
3. **Edit Segments**: Set start/end times for each video segment
4. **Arrange Order**: Drag and drop to reorder videos
5. **Merge**: Start processing and download the merged result

## Configuration

You can customize the application by setting environment variables:

```bash
# Server settings
export DEBUG=False
export HOST=0.0.0.0
export PORT=8080

# File settings
export MAX_FILE_SIZE=1073741824  # 1GB
export TEMP_DIR=/path/to/temp
export STORAGE_DIR=/path/to/storage

# Processing settings
export FRAME_QUALITY=80
export MAX_PROCESSING_TIME=600  # 10 minutes
export BATCH_SIZE=30
```

## Project Structure

```
mediacraft/
├── 🔧 Backend (Flask API)
│   ├── scripts/core/
│   │   ├── app.py             # Main Flask application
│   │   └── config.py          # Configuration settings
│   ├── models/                # Data models
│   │   ├── task.py           # Watermark removal task model
│   │   ├── merge_task.py     # Video merge task model
│   │   ├── merge_video_item.py # Merge video item model
│   │   └── storage.py        # Storage management
│   ├── processors/            # Video processing logic
│   │   ├── video_processor.py # Watermark removal processor
│   │   └── video_merger.py   # Video merger processor
│   ├── static/               # Backend static files
│   └── storage/              # Data storage (auto-created)
│       ├── tasks/            # Watermark removal tasks
│       ├── regions/          # Watermark regions
│       ├── merge_tasks/      # Video merge tasks
│       └── logs/             # Processing logs
├── 🎨 Frontend (Next.js)
│   └── mediacraft-frontend/
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── pages/        # Next.js pages
│       │   ├── services/     # API services
│       │   └── styles/       # Styling files
│       ├── public/
│       │   └── locales/      # Internationalization files
│       └── package.json      # Node.js dependencies
├── 🚀 Deployment
│   └── scripts/deployment/
│       ├── create_release.sh # Release package creation
│       ├── install.sh        # Automated installation
│       └── nginx_*.conf      # Nginx configurations
├── 📝 Documentation
│   └── docs/                 # Comprehensive documentation
├── 🧪 Testing
│   ├── test_video_watermark.py # Watermark removal tests
│   ├── test_video_merger.py    # Video merger tests
│   └── test_upload_fix.py      # Upload functionality tests
└── 🔗 Compatibility Links
    ├── app.py -> scripts/core/app.py
    ├── config.py -> scripts/core/config.py
    ├── start_video_watermark.py -> scripts/launchers/start_video_watermark.py
    └── start_video_merger.py -> scripts/launchers/start_video_merger.py
```

## API Endpoints

### Watermark Removal
- `POST /api/video/upload` - Upload video file
- `GET /api/video/task/{uuid}/frames` - Get video frames
- `POST /api/video/task/{uuid}/select-frame` - Select frame
- `POST /api/video/task/{uuid}/select-regions` - Submit watermark regions
- `GET /api/video/task/{uuid}/status` - Check processing status
- `GET /api/video/task/{uuid}/download` - Download processed video

### Video Merger
- `POST /api/video/merge/create` - Create merge task
- `GET /api/video/merge/task/{uuid}` - Get task details
- `DELETE /api/video/merge/task/{uuid}` - Delete task
- `POST /api/video/merge/upload` - Upload video for merging
- `PUT /api/video/merge/task/{uuid}/items/{item_id}` - Update video item
- `DELETE /api/video/merge/task/{uuid}/items/{item_id}` - Delete video item
- `POST /api/video/merge/task/{uuid}/reorder` - Reorder videos
- `POST /api/video/merge/task/{uuid}/start` - Start merge processing
- `GET /api/video/merge/task/{uuid}/status` - Check merge status
- `GET /api/video/merge/task/{uuid}/download` - Download merged video

## Requirements

```
Flask==2.3.2
opencv-python>=4.9.0
numpy>=1.26.0
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Architecture

### Frontend-Backend Separation

MediaCraft uses a modern architecture with separated frontend and backend:

- **Frontend**: Next.js application (Port 3000)
  - Server-side rendering for SEO
  - Internationalization support
  - Responsive design
  - Real-time updates

- **Backend**: Flask API server (Port 50001)
  - RESTful API endpoints
  - Video processing logic
  - File management
  - Task scheduling

- **Reverse Proxy**: Nginx
  - Routes frontend requests to Next.js
  - Routes API requests to Flask backend
  - Handles SSL termination
  - Static file serving

### Deployment

#### Automated Deployment

Use the provided deployment scripts for easy production setup:

```bash
# Create release package
./scripts/deployment/create_release.sh

# Deploy to server
scp releases/mediacraft-2.0.0.tar.gz user@server:/tmp/
ssh user@server
cd /tmp && tar -xzf mediacraft-2.0.0.tar.gz
cd mediacraft-2.0.0 && sudo ./install.sh
```

#### Manual Production Setup

1. **Configure DNS**: Point mediacraft.yzhu.name to your server
2. **Install Dependencies**: Node.js 18+, Python 3.8+, FFmpeg
3. **Setup Services**: Use systemd for process management
4. **Configure Nginx**: Proxy frontend and API requests
5. **SSL Setup**: Use Let's Encrypt for HTTPS

Example Nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name mediacraft.yzhu.name;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:50001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 500M;
    }
}
```

## 📚 文档

完整的项目文档已按功能分类整理：

- **[📋 文档索引](./DOCUMENTATION_INDEX.md)** - 所有文档的导航目录
- **[🛠️ 开发文档](./docs/development/)** - 项目结构、API 参考、开发指南
- **[🚀 部署文档](./docs/deployment/)** - 安装指南、配置说明
- **[🧪 测试文档](./docs/testing/)** - 测试指南、质量保证
- **[🎬 功能文档](./docs/)** - 各功能模块的详细说明

### 快速导航
- [项目结构说明](./docs/development/PROJECT_STRUCTURE.md)
- [API 参考文档](./docs/development/API_REFERENCE.md)
- [安装部署指南](./docs/deployment/INSTALLATION.md)
- [测试运行指南](./docs/testing/TEST_GUIDE.md)

## Acknowledgements

- OpenCV for image processing capabilities
- Flask for the web framework
- Bootstrap for the UI components