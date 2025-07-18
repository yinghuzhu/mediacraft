"""
Storage model for tasks and regions
"""

import os
import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import config
from .task import VideoWatermarkTask

class TaskStorage:
    """Storage for tasks and regions"""
    
    def __init__(self):
        """Initialize storage"""
        self.tasks_dir = os.path.join(config.STORAGE_DIR, 'tasks')
        self.regions_dir = os.path.join(config.STORAGE_DIR, 'regions')
        self.logs_dir = os.path.join(config.STORAGE_DIR, 'logs')
        
        # Create directories
        os.makedirs(self.tasks_dir, exist_ok=True)
        os.makedirs(self.regions_dir, exist_ok=True)
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # In-memory cache
        self.tasks_cache = {}
        self.regions_cache = {}
    
    def save_task(self, task: VideoWatermarkTask) -> bool:
        """Save task to storage"""
        try:
            # Update cache
            self.tasks_cache[task.task_uuid] = task
            
            # Save to file
            task_path = os.path.join(self.tasks_dir, f"{task.task_uuid}.json")
            with open(task_path, 'w', encoding='utf-8') as f:
                json.dump(task.to_dict(), f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            print(f"Failed to save task: {e}")
            return False
    
    def get_task(self, task_uuid: str) -> Optional[VideoWatermarkTask]:
        """Get task from storage"""
        try:
            # Check cache first
            if task_uuid in self.tasks_cache:
                return self.tasks_cache[task_uuid]
            
            # Load from file
            task_path = os.path.join(self.tasks_dir, f"{task_uuid}.json")
            if os.path.exists(task_path):
                with open(task_path, 'r', encoding='utf-8') as f:
                    task_data = json.load(f)
                
                task = VideoWatermarkTask.from_dict(task_data)
                self.tasks_cache[task_uuid] = task
                return task
            
            return None
        except Exception as e:
            print(f"Failed to get task: {e}")
            return None
    
    def save_regions(self, task_uuid: str, regions: List[Dict[str, Any]]) -> bool:
        """Save regions to storage"""
        try:
            # Update cache
            self.regions_cache[task_uuid] = regions
            
            # Save to file
            regions_path = os.path.join(self.regions_dir, f"{task_uuid}.json")
            with open(regions_path, 'w', encoding='utf-8') as f:
                json.dump(regions, f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            print(f"Failed to save regions: {e}")
            return False
    
    def get_regions(self, task_uuid: str) -> List[Dict[str, Any]]:
        """Get regions from storage"""
        try:
            # Check cache first
            if task_uuid in self.regions_cache:
                return self.regions_cache[task_uuid]
            
            # Load from file
            regions_path = os.path.join(self.regions_dir, f"{task_uuid}.json")
            if os.path.exists(regions_path):
                with open(regions_path, 'r', encoding='utf-8') as f:
                    regions = json.load(f)
                
                self.regions_cache[task_uuid] = regions
                return regions
            
            return []
        except Exception as e:
            print(f"Failed to get regions: {e}")
            return []
    
    def add_log(self, task_uuid: str, level: str, message: str, stage: str = None) -> bool:
        """Add log entry"""
        try:
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'level': level,
                'message': message,
                'stage': stage
            }
            
            # Append to log file
            log_path = os.path.join(self.logs_dir, f"{task_uuid}.log")
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')
            
            # Print to console
            print(f"[{level.upper()}] {task_uuid} - {stage or 'GENERAL'}: {message}")
            
            return True
        except Exception as e:
            print(f"Failed to add log: {e}")
            return False
    
    def cleanup_old_tasks(self, days: int = 7) -> int:
        """Clean up old tasks and files"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            removed_count = 0
            
            # Iterate through task files
            for filename in os.listdir(self.tasks_dir):
                if not filename.endswith('.json'):
                    continue
                
                task_path = os.path.join(self.tasks_dir, filename)
                try:
                    # Check file modification time
                    if datetime.fromtimestamp(os.path.getmtime(task_path)) < cutoff_date:
                        # Load task to get file paths
                        with open(task_path, 'r', encoding='utf-8') as f:
                            task_data = json.load(f)
                        
                        # Remove original file
                        original_path = task_data.get('original_file_path')
                        if original_path and os.path.exists(original_path):
                            os.remove(original_path)
                        
                        # Remove processed file
                        processed_path = task_data.get('processed_file_path')
                        if processed_path and os.path.exists(processed_path):
                            os.remove(processed_path)
                        
                        # Remove regions file
                        task_uuid = task_data.get('task_uuid')
                        regions_path = os.path.join(self.regions_dir, f"{task_uuid}.json")
                        if os.path.exists(regions_path):
                            os.remove(regions_path)
                        
                        # Remove log file
                        log_path = os.path.join(self.logs_dir, f"{task_uuid}.log")
                        if os.path.exists(log_path):
                            os.remove(log_path)
                        
                        # Remove task file
                        os.remove(task_path)
                        
                        # Remove from cache
                        if task_uuid in self.tasks_cache:
                            del self.tasks_cache[task_uuid]
                        if task_uuid in self.regions_cache:
                            del self.regions_cache[task_uuid]
                        
                        removed_count += 1
                except Exception as e:
                    print(f"Error cleaning up task {filename}: {e}")
            
            return removed_count
        except Exception as e:
            print(f"Failed to clean up old tasks: {e}")
            return 0