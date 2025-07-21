#!/usr/bin/env python3
"""
Startup script for Video Watermark Remover
"""

import os
import sys
import subprocess
import webbrowser
import time
import config

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import cv2
        import numpy
        import flask
        print("✅ All required dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_ffmpeg():
    """Check if FFmpeg is installed"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ FFmpeg is installed")
            return True
        else:
            print("⚠️  FFmpeg not found - audio processing will be limited")
            return False
    except:
        print("⚠️  FFmpeg not found - audio processing will be limited")
        return False

def create_directories():
    """Create necessary directories"""
    os.makedirs(config.TEMP_DIR, exist_ok=True)
    os.makedirs(config.STORAGE_DIR, exist_ok=True)
    os.makedirs(os.path.join(config.STORAGE_DIR, 'tasks'), exist_ok=True)
    os.makedirs(os.path.join(config.STORAGE_DIR, 'regions'), exist_ok=True)
    os.makedirs(os.path.join(config.STORAGE_DIR, 'logs'), exist_ok=True)
    print("✅ Storage directories created")

def start_server():
    """Start the Flask server"""
    from app import app
    
    host = config.HOST
    port = config.PORT
    debug = config.DEBUG
    
    print(f"🚀 Starting server at http://{host}:{port}")
    
    # Open browser after a short delay
    if host in ('0.0.0.0', '127.0.0.1', 'localhost'):
        def open_browser():
            time.sleep(1.5)
            webbrowser.open(f"http://localhost:{port}")
        
        import threading
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
    
    # Start Flask app
    app.run(host=host, port=port, debug=debug)

if __name__ == "__main__":
    print("🎬 Video Watermark Remover")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check FFmpeg (optional)
    check_ffmpeg()
    
    # Create directories
    create_directories()
    
    # Start server
    start_server()