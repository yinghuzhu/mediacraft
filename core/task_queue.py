"""
任务队列管理器
基于内存队列和线程池的异步任务处理系统
"""
import queue
import threading
import uuid
import time
from concurrent.futures import ThreadPoolExecutor, Future
from datetime import datetime
from typing import Dict, Optional, Callable, List, Tuple
import logging

logger = logging.getLogger(__name__)

class TaskQueueManager:
    """任务队列管理器 - 管理异步任务的执行和调度"""
    
    def __init__(self, storage_manager, max_concurrent: int = 3):
        self.storage = storage_manager
        self.max_concurrent = max_concurrent
        
        # 活跃任务字典 {task_id: Future}
        self.active_tasks: Dict[str, Future] = {}
        
        # 等待队列
        self.task_queue = queue.Queue()
        
        # 线程池执行器
        self.executor = ThreadPoolExecutor(max_workers=self.max_concurrent)
        
        # 线程锁
        self._lock = threading.RLock()
        
        # 任务执行器映射
        self.task_executors = {}
        
        # 启动队列处理线程
        self._running = True
        self._queue_thread = threading.Thread(target=self._process_queue, daemon=True)
        self._queue_thread.start()
        
        logger.info(f"TaskQueueManager initialized with max_concurrent={max_concurrent}")
    
    def register_task_executor(self, task_type: str, executor_func: Callable):
        """注册任务执行器"""
        self.task_executors[task_type] = executor_func
        logger.info(f"Registered task executor for type: {task_type}")
    
    def submit_task(self, task_data: Dict) -> str:
        """提交任务到队列"""
        try:
            # 生成任务ID
            task_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            
            # 完善任务数据
            task_data.update({
                "task_id": task_id,
                "status": "queued",
                "created_at": now,
                "started_at": None,
                "completed_at": None,
                "progress_percentage": 0,
                "error_message": None
            })
            
            # 保存任务到存储
            self.storage.save_task(task_id, task_data)
            
            with self._lock:
                # 检查是否可以立即执行
                if len(self.active_tasks) < self.max_concurrent:
                    self._start_task_immediately(task_id)
                else:
                    # 添加到等待队列
                    self.task_queue.put(task_id)
                    logger.info(f"Task {task_id} added to queue, queue size: {self.task_queue.qsize()}")
            
            return task_id
            
        except Exception as e:
            logger.error(f"Failed to submit task: {e}")
            raise
    
    def _start_task_immediately(self, task_id: str):
        """立即开始执行任务"""
        try:
            future = self.executor.submit(self._execute_task, task_id)
            self.active_tasks[task_id] = future
            logger.info(f"Task {task_id} started immediately, active tasks: {len(self.active_tasks)}")
        except Exception as e:
            logger.error(f"Failed to start task {task_id}: {e}")
            # 更新任务状态为失败
            self._update_task_status(task_id, "failed", error_message=str(e))
    
    def _process_queue(self):
        """处理任务队列的后台线程"""
        logger.info("Queue processing thread started")
        
        while self._running:
            try:
                # 检查是否有空闲槽位和等待的任务
                with self._lock:
                    if len(self.active_tasks) < self.max_concurrent and not self.task_queue.empty():
                        try:
                            task_id = self.task_queue.get_nowait()
                            self._start_task_immediately(task_id)
                        except queue.Empty:
                            pass
                
                # 清理已完成的任务
                self._cleanup_completed_tasks()
                
                # 短暂休眠
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in queue processing: {e}")
                time.sleep(5)  # 出错时等待更长时间
    
    def _cleanup_completed_tasks(self):
        """清理已完成的任务"""
        with self._lock:
            completed_tasks = []
            for task_id, future in self.active_tasks.items():
                if future.done():
                    completed_tasks.append(task_id)
            
            for task_id in completed_tasks:
                del self.active_tasks[task_id]
    
    def _execute_task(self, task_id: str):
        """执行具体任务"""
        try:
            # 获取任务数据
            task = self.storage.get_task(task_id)
            if not task:
                logger.error(f"Task {task_id} not found")
                return
            
            # 更新任务状态为处理中
            self._update_task_status(task_id, "processing", started_at=datetime.utcnow().isoformat())
            
            task_type = task.get("task_type")
            if task_type not in self.task_executors:
                raise ValueError(f"No executor registered for task type: {task_type}")
            
            # 执行任务
            executor_func = self.task_executors[task_type]
            result = executor_func(task, self._create_progress_callback(task_id))
            
            # 更新任务状态为完成
            self._update_task_status(
                task_id, 
                "completed", 
                completed_at=datetime.utcnow().isoformat(),
                progress_percentage=100,
                output_file_path=result.get("output_file_path") if isinstance(result, dict) else result
            )
            
            logger.info(f"Task {task_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            # 更新任务状态为失败
            self._update_task_status(
                task_id, 
                "failed", 
                completed_at=datetime.utcnow().isoformat(),
                error_message=str(e)
            )
        
        finally:
            # 从活跃任务中移除
            with self._lock:
                self.active_tasks.pop(task_id, None)
    
    def _create_progress_callback(self, task_id: str) -> Callable:
        """创建进度回调函数"""
        def progress_callback(percentage: int, message: str = ""):
            try:
                self._update_task_progress(task_id, percentage, message)
            except Exception as e:
                logger.error(f"Failed to update progress for task {task_id}: {e}")
        
        return progress_callback
    
    def _update_task_status(self, task_id: str, status: str, **kwargs):
        """更新任务状态"""
        try:
            task = self.storage.get_task(task_id)
            if task:
                task["status"] = status
                task.update(kwargs)
                self.storage.save_task(task_id, task)
        except Exception as e:
            logger.error(f"Failed to update task status for {task_id}: {e}")
    
    def _update_task_progress(self, task_id: str, percentage: int, message: str = ""):
        """更新任务进度"""
        try:
            task = self.storage.get_task(task_id)
            if task:
                task["progress_percentage"] = max(0, min(100, percentage))
                if message:
                    task["progress_message"] = message
                self.storage.save_task(task_id, task)
        except Exception as e:
            logger.error(f"Failed to update task progress for {task_id}: {e}")
    
    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """获取任务状态"""
        return self.storage.get_task(task_id)
    
    def get_user_tasks(self, sid: str, limit: int = 50) -> List[Dict]:
        """获取用户的任务列表"""
        return self.storage.get_user_tasks(sid)[:limit]
    
    def cancel_task(self, task_id: str) -> bool:
        """取消任务（仅限排队中的任务）"""
        try:
            task = self.storage.get_task(task_id)
            if not task:
                return False
            
            status = task.get("status")
            
            # 只能取消排队中的任务
            if status == "queued":
                self._update_task_status(
                    task_id, 
                    "cancelled", 
                    completed_at=datetime.utcnow().isoformat()
                )
                logger.info(f"Task {task_id} cancelled")
                return True
            
            # 正在执行的任务无法取消（简化版本）
            return False
            
        except Exception as e:
            logger.error(f"Failed to cancel task {task_id}: {e}")
            return False
    
    def get_queue_status(self) -> Dict:
        """获取队列状态"""
        try:
            with self._lock:
                active_count = len(self.active_tasks)
                queue_size = self.task_queue.qsize()
            
            # 统计各状态任务数量
            all_tasks = self.storage.get_tasks()
            status_counts = {}
            for task in all_tasks["tasks"].values():
                status = task.get("status", "unknown")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return {
                "active_tasks": active_count,
                "queued_tasks": queue_size,
                "max_concurrent": self.max_concurrent,
                "status_counts": status_counts,
                "can_accept_new_task": queue_size < self.storage.get_config_value("max_queue_size", 50)
            }
        except Exception as e:
            logger.error(f"Failed to get queue status: {e}")
            return {}
    
    def can_accept_task(self) -> Tuple[bool, str]:
        """检查是否可以接受新任务"""
        try:
            max_queue_size = self.storage.get_config_value("max_queue_size", 50)
            current_queue_size = self.task_queue.qsize()
            active_count = len(self.active_tasks)
            
            if current_queue_size >= max_queue_size:
                return False, f"系统队列已满（{current_queue_size}/{max_queue_size}），请稍后再试"
            
            if active_count >= self.max_concurrent:
                estimated_wait = (current_queue_size + 1) * 60  # 假设每个任务平均1分钟
                return True, f"系统繁忙，您的任务已加入队列，预计等待时间：{estimated_wait//60}分钟"
            
            return True, "任务已提交，正在处理"
            
        except Exception as e:
            logger.error(f"Failed to check if can accept task: {e}")
            return False, "系统错误，请稍后再试"
    
    def shutdown(self):
        """关闭任务队列管理器"""
        logger.info("Shutting down TaskQueueManager...")
        self._running = False
        
        # 等待队列处理线程结束
        if self._queue_thread.is_alive():
            self._queue_thread.join(timeout=5)
        
        # 关闭线程池
        self.executor.shutdown(wait=True)
        
        logger.info("TaskQueueManager shutdown complete")
    
    def get_system_stats(self) -> Dict:
        """获取系统统计信息"""
        try:
            queue_status = self.get_queue_status()
            storage_stats = self.storage.get_storage_stats()
            
            return {
                "queue_status": queue_status,
                "storage_stats": storage_stats,
                "uptime": "N/A",  # 可以添加启动时间跟踪
                "thread_pool_size": self.max_concurrent
            }
        except Exception as e:
            logger.error(f"Failed to get system stats: {e}")
            return {}