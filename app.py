#!/usr/bin/env python3
"""
Video Watermark Remover - Main Application
"""

import os
import uuid
import tempfile
import threading
from flask import Flask, request, jsonify, send_file, render_template
from werkzeug.utils import secure_filename
from models.task import VideoWatermarkTask
from models.storage import TaskStorage
from processors.video_processor import VideoProcessor
import config

# Initialize Flask app
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# Initialize storage
storage = TaskStorage()

# Configure upload settings
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv'}
MAX_FILE_SIZE = config.MAX_FILE_SIZE

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def make_response(code=10000, message="ok", data=None):
    """Generate unified response format"""
    return {
        "code": code,
        "message": message,
        "data": data
    }

@app.route('/')
def index():
    """Main page"""
    return app.send_static_file('index.html')

@app.route('/video-watermark.html')
def video_watermark():
    """Redirect to main page"""
    from flask import redirect
    return redirect('/')

@app.errorhandler(404)
def page_not_found(e):
    """Custom 404 error page"""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Page Not Found - MediaCraft</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card shadow">
                        <div class="card-body text-center p-5">
                            <h1 class="display-1 text-muted">404</h1>
                            <h2 class="mb-4">Page Not Found</h2>
                            <p class="lead mb-4">The page you're looking for doesn't exist or has been moved.</p>
                            <a href="/" class="btn btn-primary">Go to Homepage</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """, 404

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/api/video/upload', methods=['POST'])
def upload_video():
    """Upload video file"""
    try:
        if 'file' not in request.files:
            return jsonify(make_response(
                code=20001,
                message="No file found in upload"
            )), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify(make_response(
                code=20002,
                message="No file selected"
            )), 400
        
        if not allowed_file(file.filename):
            return jsonify(make_response(
                code=20003,
                message="Unsupported video format. Please upload MP4, MOV, AVI, or MKV files"
            )), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify(make_response(
                code=20004,
                message=f"File size exceeds limit ({MAX_FILE_SIZE // (1024*1024)}MB)"
            )), 400
        
        # Save file
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        temp_filename = f"{uuid.uuid4().hex}.{file_extension}"
        temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
        
        file.save(temp_path)
        
        # Create task record
        task = VideoWatermarkTask(
            original_filename=filename,
            file_size=file_size,
            video_format=file_extension,
            original_file_path=temp_path
        )
        
        # Extract video information
        processor = VideoProcessor()
        try:
            video_info = processor.extract_video_info(temp_path)
            task.video_duration = video_info['duration']
            task.video_resolution = video_info['resolution']
            task.fps = video_info['fps']
        except Exception as e:
            print(f"Failed to extract video info: {e}")
        
        # Save task
        storage.save_task(task)
        
        return jsonify(make_response(
            data={
                "task_uuid": task.task_uuid,
                "filename": filename,
                "file_size": file_size,
                "duration": task.video_duration,
                "resolution": task.video_resolution,
                "fps": task.fps
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=20006,
            message=f"Upload processing error: {str(e)}"
        )), 500

@app.route('/api/video/task/<task_uuid>/frames', methods=['GET'])
def get_video_frames(task_uuid):
    """Get video frames for selection"""
    try:
        task = storage.get_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=20007,
                message="Task not found"
            )), 404
        
        if not os.path.exists(task.original_file_path):
            return jsonify(make_response(
                code=20008,
                message="Original video file not found"
            )), 404
        
        # Get sample count parameter
        sample_count = request.args.get('count', 12, type=int)
        sample_count = min(max(sample_count, 5), 20)  # Limit between 5-20
        
        processor = VideoProcessor()
        frames_data = processor.get_sample_frames(task.original_file_path, sample_count)
        
        if not frames_data:
            return jsonify(make_response(
                code=20009,
                message="Unable to extract video frames"
            )), 500
        
        # Update task status
        task.status = 'frame_selecting'
        storage.save_task(task)
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "frames": [
                    {
                        "frame_number": frame_num,
                        "image_data": image_data
                    }
                    for frame_num, image_data in frames_data
                ]
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=20010,
            message=f"Failed to get video frames: {str(e)}"
        )), 500

@app.route('/api/video/task/<task_uuid>/select-frame', methods=['POST'])
def select_frame(task_uuid):
    """Select frame containing watermark"""
    try:
        task = storage.get_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=20007,
                message="Task not found"
            )), 404
        
        data = request.get_json()
        if not data or 'frame_number' not in data:
            return jsonify(make_response(
                code=20011,
                message="Missing frame number parameter"
            )), 400
        
        frame_number = data['frame_number']
        
        # Extract selected frame
        processor = VideoProcessor()
        frame = processor.extract_frame(task.original_file_path, frame_number)
        
        if frame is None:
            return jsonify(make_response(
                code=20012,
                message="Unable to extract specified frame"
            )), 500
        
        # Convert frame to base64
        import cv2
        import base64
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Update task
        task.selected_frame_number = frame_number
        task.status = 'region_selecting'
        storage.save_task(task)
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "frame_number": frame_number,
                "frame_image": f"data:image/jpeg;base64,{frame_base64}"
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=20013,
            message=f"Failed to select frame: {str(e)}"
        )), 500

@app.route('/api/video/task/<task_uuid>/select-regions', methods=['POST'])
def select_regions(task_uuid):
    """Submit watermark regions and start processing"""
    try:
        task = storage.get_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=20007,
                message="Task not found"
            )), 404
        
        data = request.get_json()
        if not data or 'regions' not in data:
            return jsonify(make_response(
                code=20014,
                message="Missing watermark regions parameter"
            )), 400
        
        regions_data = data['regions']
        if not regions_data:
            return jsonify(make_response(
                code=20015,
                message="At least one watermark region must be selected"
            )), 400
        
        # Save regions to storage
        if not storage.save_regions(task_uuid, regions_data):
            return jsonify(make_response(
                code=20016,
                message="Failed to save watermark regions"
            )), 500
        
        # Start background processing task
        def process_video_async():
            processor = VideoProcessor()
            processor.process_video_remove_watermark(task, regions_data)
        
        thread = threading.Thread(target=process_video_async)
        thread.daemon = True
        thread.start()
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "regions_count": len(regions_data),
                "message": "Started video processing, please check status later"
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=20017,
            message=f"Failed to submit watermark regions: {str(e)}"
        )), 500

@app.route('/api/video/task/<task_uuid>/status', methods=['GET'])
def get_task_status(task_uuid):
    """Query task status"""
    try:
        task = storage.get_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=20007,
                message="Task not found"
            )), 404
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "status": task.status,
                "progress_percentage": task.progress_percentage,
                "error_message": task.error_message,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=20018,
            message=f"Failed to query task status: {str(e)}"
        )), 500

@app.route('/api/video/task/<task_uuid>/download', methods=['GET'])
def download_result(task_uuid):
    """Download processing result"""
    try:
        task = storage.get_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=20007,
                message="Task not found"
            )), 404
        
        if task.status != 'completed':
            return jsonify(make_response(
                code=20019,
                message="Task not yet completed"
            )), 400
        
        if not task.processed_file_path or not os.path.exists(task.processed_file_path):
            return jsonify(make_response(
                code=20020,
                message="Processed result file not found"
            )), 404
        
        # Generate download filename
        name_without_ext = os.path.splitext(task.original_filename)[0]
        download_filename = f"{name_without_ext}_no_watermark.{task.video_format}"
        
        return send_file(
            task.processed_file_path,
            as_attachment=True,
            download_name=download_filename,
            mimetype=f'video/{task.video_format}'
        )
    
    except Exception as e:
        return jsonify(make_response(
            code=20021,
            message=f"Download failed: {str(e)}"
        )), 500

if __name__ == '__main__':
    app.run(debug=config.DEBUG, host=config.HOST, port=config.PORT)