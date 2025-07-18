"""
Configuration settings for Video Watermark Remover
"""

import os

# Server settings
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 5000))

# File settings
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 500 * 1024 * 1024))  # 500MB default
TEMP_DIR = os.getenv('TEMP_DIR', os.path.join(os.path.dirname(__file__), 'temp'))
STORAGE_DIR = os.getenv('STORAGE_DIR', os.path.join(os.path.dirname(__file__), 'storage'))

# Processing settings
FRAME_QUALITY = int(os.getenv('FRAME_QUALITY', 90))  # JPEG quality for frames
MAX_PROCESSING_TIME = int(os.getenv('MAX_PROCESSING_TIME', 300))  # 5 minutes max processing time
BATCH_SIZE = int(os.getenv('BATCH_SIZE', 50))  # Number of frames to process in a batch

# Create necessary directories
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)