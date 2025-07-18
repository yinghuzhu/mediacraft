# MediaCraft

A professional web application for removing watermarks from videos and other media processing tasks.

## Features

- 🎬 **Multi-format Support**: Handles MP4, MOV, AVI, MKV video formats
- 🖼️ **Smart Frame Selection**: Choose the frame that best shows the watermark
- 🎯 **Precise Region Selection**: Mark multiple watermark regions with mouse drag
- 🤖 **AI-powered Processing**: Uses advanced image inpainting algorithms
- 🔊 **Audio Preservation**: Keeps the original audio track intact
- 📊 **Real-time Progress**: Shows processing status and progress
- 💾 **Easy Download**: Get your watermark-free video with one click

## Installation

### Prerequisites

- Python 3.8+
- FFmpeg (optional, for audio processing)
- OpenCV dependencies

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/video-watermark-remover.git
cd video-watermark-remover
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python start_video_watermark.py
```

4. Open your browser and navigate to:
```
http://localhost:50001
```

5. For production deployment:
```
https://mediacraft.yzhu.name
```

## Usage

1. **Upload Video**: Drag and drop or click to select a video file (max 500MB)
2. **Select Frame**: Choose a frame that clearly shows the watermark
3. **Mark Watermarks**: Draw rectangles around watermark regions
4. **Process Video**: Start processing and wait for completion
5. **Download**: Get your watermark-free video

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
├── app/                   # Application package
│   ├── __init__.py        # Package initialization
│   └── routes.py          # Application routes
├── app.py                 # Main application module
├── config.py              # Configuration settings
├── models/
│   ├── task.py            # Task model
│   └── storage.py         # Storage management
├── processors/
│   └── video_processor.py # Video processing logic
├── static/
│   └── index.html         # Web interface (MediaCraft UI)
├── storage/               # Data storage (created automatically)
│   ├── tasks/             # Task data
│   ├── regions/           # Region data
│   └── logs/              # Processing logs
├── temp/                  # Temporary files
└── start_video_watermark.py # Startup script
```

## API Endpoints

- `POST /api/video/upload` - Upload video file
- `GET /api/video/task/{uuid}/frames` - Get video frames
- `POST /api/video/task/{uuid}/select-frame` - Select frame
- `POST /api/video/task/{uuid}/select-regions` - Submit watermark regions
- `GET /api/video/task/{uuid}/status` - Check processing status
- `GET /api/video/task/{uuid}/download` - Download processed video

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

## Acknowledgements

- OpenCV for image processing capabilities
- Flask for the web framework
- Bootstrap for the UI components