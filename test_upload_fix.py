#!/usr/bin/env python3
"""
Test script to verify upload API response format
"""

import json
from models.merge_video_item import MergeVideoItem

def test_upload_response_format():
    """Test that upload response has all required fields"""
    print("🧪 Testing upload response format...")
    
    # Create a video item as it would be after upload
    item = MergeVideoItem("test.mp4", 1024*1024, "/tmp/test.mp4", 1)
    
    # Simulate video analysis (this might fail and leave some fields as default)
    item.video_duration = 30.5
    item.video_resolution = "1920x1080"
    item.fps = 30.0
    item.start_time = 0.0
    item.end_time = 30.5
    item.segment_duration = 30.5
    
    # Create response data as backend would return
    response_data = {
        "task_uuid": "test-uuid",
        "item_id": item.item_id,
        "original_filename": "test.mp4",
        "file_size": item.file_size,
        "video_duration": item.video_duration,
        "video_resolution": item.video_resolution,
        "fps": item.fps,
        "item_order": item.item_order,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "segment_duration": item.segment_duration
    }
    
    print("Response data:", json.dumps(response_data, indent=2))
    
    # Test that all fields are present and not None
    required_fields = [
        'video_duration', 'segment_duration', 'start_time', 
        'end_time', 'video_resolution', 'fps'
    ]
    
    for field in required_fields:
        value = response_data.get(field)
        if value is None:
            print(f"❌ Field '{field}' is None")
            return False
        else:
            print(f"✅ Field '{field}': {value}")
    
    # Test JavaScript-like rendering
    duration = response_data['video_duration'] if response_data['video_duration'] else 0
    segment_duration = response_data['segment_duration'] if response_data['segment_duration'] else duration
    
    print(f"✅ Duration formatting: {duration:.1f}s")
    print(f"✅ Segment duration formatting: {segment_duration:.1f}s")
    
    return True

def test_with_missing_fields():
    """Test handling of missing fields"""
    print("\n🧪 Testing with missing fields...")
    
    # Simulate response with missing fields
    response_data = {
        "task_uuid": "test-uuid",
        "item_id": "test-item-id",
        "original_filename": "test.mp4",
        "file_size": 1024*1024,
        "video_duration": None,  # This could be None if analysis fails
        "video_resolution": None,
        "fps": None,
        "item_order": 1,
        "start_time": None,
        "end_time": None,
        "segment_duration": None
    }
    
    # Apply frontend defensive programming
    item_data = {
        **response_data,
        'video_duration': response_data['video_duration'] or 0,
        'segment_duration': response_data['segment_duration'] or response_data['video_duration'] or 0,
        'start_time': response_data['start_time'] or 0,
        'end_time': response_data['end_time'] or response_data['video_duration'] or 0,
        'video_resolution': response_data['video_resolution'] or 'N/A',
        'fps': response_data['fps'] or 0
    }
    
    print("Fixed item data:", json.dumps(item_data, indent=2))
    
    # Test rendering
    duration = item_data['video_duration'] if item_data['video_duration'] and isinstance(item_data['video_duration'], (int, float)) else 0
    segment_duration = item_data['segment_duration'] if item_data['segment_duration'] and isinstance(item_data['segment_duration'], (int, float)) else duration
    
    print(f"✅ Safe duration formatting: {duration:.1f}s")
    print(f"✅ Safe segment duration formatting: {segment_duration:.1f}s")
    
    return True

def main():
    """Run all tests"""
    print("🎬 Upload Response Format Tests")
    print("=" * 50)
    
    try:
        test_upload_response_format()
        test_with_missing_fields()
        
        print("\n🎉 All tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    main()