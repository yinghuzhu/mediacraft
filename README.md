# MediaCraft

A professional web application for video processing tasks including watermark removal and video merging.

## Features

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

- Python 3.8+
- FFmpeg (optional, for audio processing)
- OpenCV dependencies

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yinghuzhu/mediacraft.git
cd mediacraft
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:

For watermark removal:
```bash
python start_video_watermark.py
```

For video merger:
```bash
python start_video_merger.py
```

Or run the full application:
```bash
python app.py
```

4. Open your browser and navigate to:
```
http://localhost:5000/                    # Watermark removal
http://localhost:5000/video-merger.html   # Video merger
```

5. For production deployment:
```
https://mediacraft.yzhu.name
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
├── app.py                      # Main application with all routes
├── config.py                   # Configuration settings
├── models/                     # Data models
│   ├── task.py                # Watermark removal task model
│   ├── merge_task.py          # Video merge task model
│   ├── merge_video_item.py    # Merge video item model
│   └── storage.py             # Storage management
├── processors/                 # Video processing logic
│   ├── video_processor.py     # Watermark removal processor
│   └── video_merger.py        # Video merger processor
├── static/                     # Frontend files
│   ├── index.html             # Watermark removal interface
│   └── video-merger.html      # Video merger interface
├── storage/                    # Data storage (auto-created)
│   ├── tasks/                 # Watermark removal tasks
│   ├── regions/               # Watermark regions
│   ├── merge_tasks/           # Video merge tasks
│   ├── logs/                  # Processing logs
│   └── merge_logs/            # Merge processing logs
├── temp/                       # Temporary files
├── start_video_watermark.py   # Watermark removal launcher
├── start_video_merger.py      # Video merger launcher
├── test_video_watermark.py    # Watermark removal tests
└── test_video_merger.py       # Video merger tests
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

## Deployment

### Production Setup

For production deployment at mediacraft.yzhu.name:

1. Configure DNS records to point mediacraft.yzhu.name to your server
2. Set up a web server (Nginx/Apache) with the following configuration:

```nginx
# Nginx example configuration
server {
    listen 80;
    server_name mediacraft.yzhu.name;

    location / {
        proxy_pass http://localhost:50001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. Set up SSL with Let's Encrypt for secure HTTPS connections
4. Use a production WSGI server like Gunicorn:

```bash
gunicorn -w 4 -b 127.0.0.1:50001 'app:app'
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