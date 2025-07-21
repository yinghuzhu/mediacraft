#!/usr/bin/env python3
"""
MediaCraft - Main Application
Features: Video Watermark Removal and Video Merger
"""

import os
import sys
import uuid
import tempfile
import threading

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)

from flask import Flask, request, jsonify, send_file, render_template
from werkzeug.utils import secure_filename
from models.task import VideoWatermarkTask
from models.merge_task import VideoMergeTask
from models.merge_video_item import MergeVideoItem
from models.storage import TaskStorage
from processors.video_processor import VideoProcessor
from processors.video_merger import VideoMerger
import config

# Initialize Flask app with correct paths
static_folder = os.path.join(project_root, 'static')
template_folder = os.path.join(project_root, 'templates')
app = Flask(__name__, 
            static_folder=static_folder,
            template_folder=template_folder)

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

@app.route('/video-merger.html')
def video_merger():
    """Video merger page"""
    return app.send_static_file('video-merger.html')

@app.route('/video-merger')
def video_merger_redirect():
    """Redirect to video merger page"""
    from flask import redirect
    return redirect('/video-merger.html')

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

# ===== Video Merger API Routes =====

@app.route('/api/video/merge/create', methods=['POST'])
def create_merge_task():
    """Create a new video merge task"""
    try:
        data = request.get_json()
        if not data:
            return jsonify(make_response(
                code=30001,
                message="Missing request data"
            )), 400
        
        task_name = data.get('task_name', 'Untitled Merge')
        
        # Create merge task
        task = VideoMergeTask(task_name=task_name)
        
        # Set optional parameters if provided
        if 'merge_mode' in data:
            task.merge_mode = data['merge_mode']
        if 'audio_handling' in data:
            task.audio_handling = data['audio_handling']
        if 'quality_preset' in data:
            task.quality_preset = data['quality_preset']
        
        # Save task
        if not storage.save_merge_task(task):
            return jsonify(make_response(
                code=30002,
                message="Failed to create merge task"
            )), 500
        
        return jsonify(make_response(
            data={
                "task_uuid": task.task_uuid,
                "task_name": task.task_name,
                "created_at": task.created_at.isoformat()
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30003,
            message=f"Failed to create merge task: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>', methods=['GET'])
def get_merge_task(task_uuid):
    """Get merge task details"""
    try:
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        # Get video items
        items = storage.get_video_items(task_uuid)
        items_data = [item.to_dict() for item in items]
        
        # Prepare response data
        task_data = task.to_dict()
        task_data['items'] = items_data
        
        return jsonify(make_response(
            data=task_data
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30005,
            message=f"Failed to get merge task: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>', methods=['DELETE'])
def delete_merge_task(task_uuid):
    """Delete merge task"""
    try:
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        # Delete task and all associated files
        if not storage.delete_merge_task(task_uuid):
            return jsonify(make_response(
                code=30006,
                message="Failed to delete merge task"
            )), 500
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "message": "Task deleted successfully"
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30007,
            message=f"Failed to delete merge task: {str(e)}"
        )), 500

@app.route('/api/video/merge/upload', methods=['POST'])
def upload_merge_video():
    """Upload video file for merging"""
    try:
        # Check if task_uuid is provided
        task_uuid = request.form.get('task_uuid')
        if not task_uuid:
            return jsonify(make_response(
                code=30008,
                message="Missing task_uuid parameter"
            )), 400
        
        # Check if task exists
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        # Check if file is provided
        if 'file' not in request.files:
            return jsonify(make_response(
                code=30009,
                message="No file found in upload"
            )), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify(make_response(
                code=30010,
                message="No file selected"
            )), 400
        
        # Check file format
        if not allowed_file(file.filename):
            return jsonify(make_response(
                code=30011,
                message="Unsupported video format. Please upload MP4, MOV, AVI, or MKV files"
            )), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify(make_response(
                code=30012,
                message=f"File size exceeds limit ({MAX_FILE_SIZE // (1024*1024)}MB)"
            )), 400
        
        # Get current items count
        items = storage.get_video_items(task_uuid)
        if len(items) >= 10:
            return jsonify(make_response(
                code=30013,
                message="Maximum number of videos (10) reached for this merge task"
            )), 400
        
        # Save file
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        temp_filename = f"merge_{task_uuid}_{uuid.uuid4().hex}.{file_extension}"
        
        # Create task-specific directory
        temp_dir = storage.get_merge_task_temp_dir(task_uuid)
        temp_path = os.path.join(temp_dir, temp_filename)
        
        file.save(temp_path)
        
        # Create video item
        item_order = len(items) + 1
        item = MergeVideoItem(
            original_filename=filename,
            file_size=file_size,
            file_path=temp_path,
            item_order=item_order
        )
        
        # Extract video information
        merger = VideoMerger()
        try:
            if merger.analyze_video_item(item):
                print(f"Successfully analyzed video: {item.original_filename}")
            else:
                print(f"Failed to analyze video: {item.original_filename}, using defaults")
        except Exception as e:
            print(f"Failed to analyze video: {e}")
            # Set default values if analysis fails
            item.video_duration = 0.0
            item.video_resolution = "Unknown"
            item.fps = 0.0
            item.start_time = 0.0
            item.end_time = 0.0
            item.segment_duration = 0.0
        
        # Add item to task
        items.append(item)
        if not storage.save_video_items(task_uuid, items):
            return jsonify(make_response(
                code=30014,
                message="Failed to save video item"
            )), 500
        
        # Update task status
        task.status = 'uploading'
        storage.save_merge_task(task)
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "item_id": item.item_id,
                "original_filename": filename,
                "file_size": file_size,
                "video_duration": item.video_duration,
                "video_resolution": item.video_resolution,
                "fps": item.fps,
                "item_order": item.item_order,
                "start_time": item.start_time,
                "end_time": item.end_time,
                "segment_duration": item.segment_duration
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30015,
            message=f"Upload processing error: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>/items/<item_id>', methods=['PUT'])
def update_merge_video_item(task_uuid, item_id):
    """Update video item time segment"""
    try:
        # Check if task exists
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        # Get video items
        items = storage.get_video_items(task_uuid)
        
        # Find the specific item
        target_item = None
        for item in items:
            if item.item_id == item_id:
                target_item = item
                break
        
        if not target_item:
            return jsonify(make_response(
                code=30016,
                message="Video item not found"
            )), 404
        
        # Get update data
        data = request.get_json()
        if not data:
            return jsonify(make_response(
                code=30017,
                message="Missing update data"
            )), 400
        
        # Update time segment if provided
        if 'start_time' in data or 'end_time' in data:
            start_time = data.get('start_time', target_item.start_time)
            end_time = data.get('end_time', target_item.end_time)
            
            if not target_item.set_time_segment(start_time, end_time):
                return jsonify(make_response(
                    code=30018,
                    message="Invalid time segment values"
                )), 400
        
        # Save updated item
        if not storage.update_video_item(task_uuid, target_item):
            return jsonify(make_response(
                code=30019,
                message="Failed to update video item"
            )), 500
        
        # Recalculate total duration
        items = storage.get_video_items(task_uuid)
        segment_durations = [item.segment_duration for item in items]
        task.calculate_total_duration(segment_durations)
        storage.save_merge_task(task)
        
        return jsonify(make_response(
            data=target_item.to_dict()
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30020,
            message=f"Failed to update video item: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>/items/<item_id>', methods=['DELETE'])
def delete_merge_video_item(task_uuid, item_id):
    """Delete video item from merge task"""
    try:
        # Check if task exists
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        # Get video items
        items = storage.get_video_items(task_uuid)
        
        # Find the specific item
        target_item = None
        target_index = -1
        for i, item in enumerate(items):
            if item.item_id == item_id:
                target_item = item
                target_index = i
                break
        
        if not target_item:
            return jsonify(make_response(
                code=30016,
                message="Video item not found"
            )), 404
        
        # Remove item from list
        items.pop(target_index)
        
        # Reorder remaining items
        for i, item in enumerate(items):
            item.item_order = i + 1
        
        # Save updated items
        if not storage.save_video_items(task_uuid, items):
            return jsonify(make_response(
                code=30021,
                message="Failed to update video items"
            )), 500
        
        # Delete the file if it exists
        if target_item.file_path and os.path.exists(target_item.file_path):
            try:
                os.remove(target_item.file_path)
            except Exception as e:
                print(f"Failed to delete file: {e}")
        
        # Recalculate total duration
        segment_durations = [item.segment_duration for item in items]
        task.calculate_total_duration(segment_durations)
        storage.save_merge_task(task)
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "item_id": item_id,
                "message": "Video item deleted successfully"
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30022,
            message=f"Failed to delete video item: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>/reorder', methods=['POST'])
def reorder_merge_videos(task_uuid):
    """Reorder video items in merge task"""
    try:
        # Check if task exists
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        # Get reorder data
        data = request.get_json()
        if not data or 'item_order' not in data:
            return jsonify(make_response(
                code=30023,
                message="Missing item_order parameter"
            )), 400
        
        item_order = data['item_order']
        if not isinstance(item_order, list):
            return jsonify(make_response(
                code=30024,
                message="item_order must be a list of item IDs"
            )), 400
        
        # Update order
        if not storage.update_video_order(task_uuid, item_order):
            return jsonify(make_response(
                code=30025,
                message="Failed to update video order"
            )), 500
        
        # Get updated items
        items = storage.get_video_items(task_uuid)
        items_data = [item.to_dict() for item in items]
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "items": items_data
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30026,
            message=f"Failed to reorder videos: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>/start', methods=['POST'])
def start_merge_processing(task_uuid):
    """Start video merge processing"""
    try:
        # Check if task exists
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        # Get video items
        items = storage.get_video_items(task_uuid)
        if not items:
            return jsonify(make_response(
                code=30027,
                message="No videos to merge"
            )), 400
        
        # Check if task is already processing or completed
        if task.status in ['processing', 'completed']:
            return jsonify(make_response(
                code=30028,
                message=f"Task is already in {task.status} state"
            )), 400
        
        # Start background processing task
        def process_merge_async():
            merger = VideoMerger()
            merger.process_merge_task(task)
        
        thread = threading.Thread(target=process_merge_async)
        thread.daemon = True
        thread.start()
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "videos_count": len(items),
                "message": "Started video merge processing, please check status later"
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30029,
            message=f"Failed to start merge processing: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>/status', methods=['GET'])
def get_merge_task_status(task_uuid):
    """Query merge task status"""
    try:
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        return jsonify(make_response(
            data={
                "task_uuid": task_uuid,
                "task_name": task.task_name,
                "status": task.status,
                "progress_percentage": task.progress_percentage,
                "error_message": task.error_message,
                "total_videos": task.total_videos,
                "total_duration": task.total_duration,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None
            }
        ))
    
    except Exception as e:
        return jsonify(make_response(
            code=30030,
            message=f"Failed to query merge task status: {str(e)}"
        )), 500

@app.route('/api/video/merge/task/<task_uuid>/download', methods=['GET'])
def download_merge_result(task_uuid):
    """Download merge result"""
    try:
        task = storage.get_merge_task(task_uuid)
        if not task:
            return jsonify(make_response(
                code=30004,
                message="Merge task not found"
            )), 404
        
        if task.status != 'completed':
            return jsonify(make_response(
                code=30031,
                message="Merge task not yet completed"
            )), 400
        
        if not task.output_file_path or not os.path.exists(task.output_file_path):
            return jsonify(make_response(
                code=30032,
                message="Merged result file not found"
            )), 404
        
        # Generate download filename
        download_filename = f"{task.task_name.replace(' ', '_')}_merged.{task.output_format}"
        
        return send_file(
            task.output_file_path,
            as_attachment=True,
            download_name=download_filename,
            mimetype=f'video/{task.output_format}'
        )
    
    except Exception as e:
        return jsonify(make_response(
            code=30033,
            message=f"Download failed: {str(e)}"
        )), 500

if __name__ == '__main__':
    app.run(debug=config.DEBUG, host=config.HOST, port=config.PORT)