#!/usr/bin/env python3
"""
Test script for video merger functionality
"""

import os
import sys
import tempfile
import shutil
from models.merge_task import VideoMergeTask
from models.merge_video_item import MergeVideoItem
from models.storage import TaskStorage
from processors.video_merger import VideoMerger

def test_merge_task_model():
    """Test VideoMergeTask model"""
    print("🧪 Testing VideoMergeTask model...")
    
    # Create task
    task = VideoMergeTask("Test Merge Task")
    assert task.task_name == "Test Merge Task"
    assert task.status == "created"
    assert task.total_videos == 0
    
    # Test status update
    assert task.update_status("processing") == True
    assert task.status == "processing"
    assert task.started_at is not None
    
    # Test invalid status
    assert task.update_status("invalid_status") == False
    
    # Test serialization
    task_dict = task.to_dict()
    assert task_dict['task_name'] == "Test Merge Task"
    
    # Test deserialization
    task2 = VideoMergeTask.from_dict(task_dict)
    assert task2.task_name == task.task_name
    assert task2.task_uuid == task.task_uuid
    
    print("✅ VideoMergeTask model tests passed")

def test_merge_video_item_model():
    """Test MergeVideoItem model"""
    print("🧪 Testing MergeVideoItem model...")
    
    # Create item
    item = MergeVideoItem("test.mp4", 1024*1024, "/tmp/test.mp4", 1)
    assert item.original_filename == "test.mp4"
    assert item.file_size == 1024*1024
    assert item.item_order == 1
    assert item.video_format == "mp4"
    
    # Test time segment
    assert item.set_time_segment(10.0, 30.0) == True
    assert item.start_time == 10.0
    assert item.end_time == 30.0
    assert item.segment_duration == 20.0
    
    # Test invalid time segment
    assert item.set_time_segment(30.0, 10.0) == False
    
    # Test video info update
    item.update_video_info(60.0, "1920x1080", 30.0, 2000000, True)
    assert item.video_duration == 60.0
    assert item.video_resolution == "1920x1080"
    assert item.fps == 30.0
    
    # Test serialization
    item_dict = item.to_dict()
    assert item_dict['original_filename'] == "test.mp4"
    
    # Test deserialization
    item2 = MergeVideoItem.from_dict(item_dict)
    assert item2.original_filename == item.original_filename
    assert item2.item_id == item.item_id
    
    print("✅ MergeVideoItem model tests passed")

def test_storage():
    """Test storage functionality"""
    print("🧪 Testing storage functionality...")
    
    storage = TaskStorage()
    
    # Test merge task storage
    task = VideoMergeTask("Storage Test Task")
    assert storage.save_merge_task(task) == True
    
    retrieved_task = storage.get_merge_task(task.task_uuid)
    assert retrieved_task is not None
    assert retrieved_task.task_name == "Storage Test Task"
    
    # Test video items storage
    items = [
        MergeVideoItem("video1.mp4", 1024, "/tmp/video1.mp4", 1),
        MergeVideoItem("video2.mp4", 2048, "/tmp/video2.mp4", 2)
    ]
    
    assert storage.save_video_items(task.task_uuid, items) == True
    
    retrieved_items = storage.get_video_items(task.task_uuid)
    assert len(retrieved_items) == 2
    assert retrieved_items[0].original_filename == "video1.mp4"
    
    # Test reorder
    new_order = [items[1].item_id, items[0].item_id]
    assert storage.update_video_order(task.task_uuid, new_order) == True
    
    reordered_items = storage.get_video_items(task.task_uuid)
    assert reordered_items[0].item_order == 1
    assert reordered_items[0].original_filename == "video2.mp4"
    
    # Test cleanup
    assert storage.delete_merge_task(task.task_uuid) == True
    assert storage.get_merge_task(task.task_uuid) is None
    
    print("✅ Storage tests passed")

def test_video_merger():
    """Test VideoMerger functionality"""
    print("🧪 Testing VideoMerger functionality...")
    
    merger = VideoMerger()
    
    # Test format compatibility check
    items = [
        MergeVideoItem("video1.mp4", 1024, "/tmp/video1.mp4", 1),
        MergeVideoItem("video2.mp4", 2048, "/tmp/video2.mp4", 2)
    ]
    
    # Set video info
    items[0].update_video_info(30.0, "1920x1080", 30.0, 2000000, True)
    items[1].update_video_info(45.0, "1920x1080", 30.0, 2000000, True)
    
    compatible, message = merger.check_format_compatibility(items)
    assert compatible == True
    
    # Test incompatible formats
    items[1].video_resolution = "1280x720"
    compatible, message = merger.check_format_compatibility(items)
    assert compatible == False
    assert "Resolution mismatch" in message
    
    # Test optimal output format
    items[1].video_resolution = "1920x1080"  # Reset
    output_format = merger.get_optimal_output_format(items)
    assert output_format['resolution'] == "1920x1080"
    assert output_format['fps'] == 30
    assert output_format['format'] == "mp4"
    
    print("✅ VideoMerger tests passed")

def main():
    """Run all tests"""
    print("🎬 MediaCraft Video Merger Tests")
    print("=" * 50)
    
    try:
        test_merge_task_model()
        test_merge_video_item_model()
        test_storage()
        test_video_merger()
        
        print("\n🎉 All tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)