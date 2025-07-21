# MediaCraft 视频合并功能 - 数据模型设计

## 1. 概述

本文档描述了MediaCraft平台视频合并功能的数据模型设计。该设计基于现有的视频去水印功能架构，继续使用文件存储方式，扩展支持多视频合并的业务需求，同时保持与现有系统的兼容性。

**注意：本设计继续采用无数据库架构，使用JSON文件存储和内存缓存，与现有系统保持一致。**

## 2. 核心业务流程

1. **用户上传多个视频** → 系统创建合并任务记录
2. **视频信息提取** → 系统分析每个视频的基本信息
3. **时间片段设置** → 用户为每个视频设置开始和结束时间
4. **顺序排列** → 用户调整视频合并顺序
5. **后台合并处理** → 系统使用FFmpeg合并视频
6. **结果交付** → 用户下载合并后的视频

## 3. 数据模型设计

### 3.1 核心数据模型

#### 3.1.1 视频合并任务模型 (VideoMergeTask)
```python
class VideoMergeTask:
    def __init__(self):
        self.task_uuid: str  # 任务唯一标识
        self.task_name: str  # 用户自定义任务名称
        self.total_videos: int  # 参与合并的视频总数
        self.total_duration: float  # 合并后预计总时长(秒)
        self.output_resolution: str  # 输出分辨率 (如: 1920x1080)
        self.output_format: str = 'mp4'  # 输出格式
        
        # 文件路径
        self.output_file_path: str  # 合并后文件路径
        
        # 任务状态
        self.status: str = 'created'  # created, uploading, processing, completed, failed
        self.progress_percentage: int = 0
        self.error_message: str = None
        
        # 处理参数
        self.merge_mode: str = 'concat'  # concat, blend
        self.audio_handling: str = 'keep_all'  # keep_all, keep_first, remove
        self.quality_preset: str = 'medium'  # fast, medium, high
        
        # 时间戳
        self.created_at: datetime
        self.started_at: datetime = None
        self.completed_at: datetime = None
        self.expires_at: datetime = None
```

#### 3.1.2 合并视频项模型 (MergeVideoItem)
```python
class MergeVideoItem:
    def __init__(self):
        self.item_id: str  # 视频项唯一标识
        self.item_order: int  # 在合并序列中的顺序 (1-10)
        
        # 视频文件信息
        self.original_filename: str
        self.file_size: int  # 文件大小(字节)
        self.file_path: str  # 文件存储路径
        
        # 视频属性
        self.video_duration: float  # 原始视频时长(秒)
        self.video_resolution: str  # 视频分辨率
        self.video_format: str  # 视频格式
        self.fps: float  # 帧率
        self.bitrate: int  # 比特率
        self.has_audio: bool = True  # 是否包含音频
        
        # 时间片段设置
        self.start_time: float = 0  # 开始时间(秒)
        self.end_time: float = None  # 结束时间(秒，None表示到结尾)
        self.segment_duration: float  # 片段时长(秒)
        
        # 处理状态
        self.status: str = 'uploaded'  # uploaded, analyzed, ready, processing, completed, failed
        
        self.created_at: datetime
        self.updated_at: datetime
```

#### 3.1.3 文件存储结构
```
storage/
├── merge_tasks/           # 合并任务数据
│   ├── {task_uuid}.json   # 任务基本信息
│   └── {task_uuid}_items.json  # 视频项列表
├── merge_logs/            # 合并处理日志
│   └── {task_uuid}.log    # 任务处理日志
└── merge_temp/            # 临时文件目录
    ├── {task_uuid}/       # 任务临时目录
    │   ├── segments/      # 视频片段文件
    │   └── output/        # 输出文件
    └── cleanup/           # 待清理文件
```

### 3.2 存储管理扩展

#### 3.2.1 扩展现有TaskStorage类
```python
class TaskStorage:
    def __init__(self):
        # 现有属性
        self.tasks_dir = os.path.join(config.STORAGE_DIR, 'tasks')
        self.regions_dir = os.path.join(config.STORAGE_DIR, 'regions')
        self.logs_dir = os.path.join(config.STORAGE_DIR, 'logs')
        
        # 新增合并功能相关目录
        self.merge_tasks_dir = os.path.join(config.STORAGE_DIR, 'merge_tasks')
        self.merge_logs_dir = os.path.join(config.STORAGE_DIR, 'merge_logs')
        self.merge_temp_dir = os.path.join(config.TEMP_DIR, 'merge_temp')
        
        # 内存缓存
        self.merge_tasks_cache = {}
        self.merge_items_cache = {}
    
    # 合并任务相关方法
    def save_merge_task(self, task: VideoMergeTask) -> bool
    def get_merge_task(self, task_uuid: str) -> VideoMergeTask
    def delete_merge_task(self, task_uuid: str) -> bool
    
    # 视频项相关方法
    def save_video_items(self, task_uuid: str, items: List[MergeVideoItem]) -> bool
    def get_video_items(self, task_uuid: str) -> List[MergeVideoItem]
    def update_video_order(self, task_uuid: str, new_order: List[str]) -> bool
    
    # 日志相关方法
    def add_merge_log(self, task_uuid: str, level: str, message: str, stage: str = None) -> bool
```

#### 3.2.2 与现有系统的集成
- 视频合并功能与视频去水印功能在存储层面完全独立
- 共享相同的配置管理机制（config.py）
- 复用现有的文件上传和临时文件管理逻辑
- 保持相同的API响应格式和错误处理方式

## 4. 核心业务规则

### 4.1 任务状态流转
```
created → uploading → processing → completed/failed
```

### 4.2 视频项状态流转
```
uploaded → analyzed → ready → processing → completed/failed
```

### 4.3 业务约束
- **视频数量限制**：每个合并任务最多10个视频
- **文件大小限制**：单个视频最大500MB，总大小最大5GB
- **时长限制**：合并后视频最长2小时
- **格式限制**：仅支持主流视频格式
- **顺序约束**：视频顺序必须连续，不能有空隙

### 4.4 数据完整性规则
- 删除合并任务时，自动删除所有相关的视频项和日志
- 视频项的顺序必须在1-10范围内且不重复
- 时间片段的结束时间必须大于开始时间
- 片段时长自动计算并保持同步

## 5. 性能优化设计

### 5.1 缓存策略
- 使用内存缓存存储活跃的合并任务信息
- 实现LRU缓存机制，自动清理长时间未访问的任务
- 缓存视频基本信息，避免重复解析

### 5.2 文件管理优化
- 按任务UUID创建独立的临时目录
- 实现文件引用计数，避免重复存储相同文件
- 定期清理过期的临时文件和缓存

## 6. 数据安全考虑

### 6.1 敏感数据保护
- 任务UUID用于前端访问，避免暴露内部ID
- 文件路径不直接暴露给前端
- 用户上传的文件自动设置访问权限

### 6.2 数据清理策略
- 定期清理过期的合并任务和相关文件
- 自动删除失败任务的临时文件
- 日志数据按级别和时间进行归档

### 6.3 并发控制
- 使用乐观锁控制任务状态更新
- 文件操作使用原子性操作
- 避免同一任务的并发处理

## 7. 性能优化设计

### 7.1 查询优化
- 为常用查询路径创建复合索引
- 使用分页查询处理大量日志数据
- 实现查询结果缓存机制

### 7.2 存储优化
- 使用JSON字段存储灵活的配置数据
- 合理设置字段长度避免空间浪费
- 定期清理历史数据

### 7.3 处理优化
- 异步处理视频合并任务
- 实现任务队列避免资源竞争
- 支持任务暂停和恢复

## 8. 扩展性考虑

### 8.1 水平扩展
- 使用UUID作为任务标识，支持分布式部署
- 文件存储可扩展到云存储服务
- 数据库支持读写分离

### 8.2 功能扩展
- 预留字段支持更多合并模式
- 支持视频转场效果
- 支持批量合并任务
- 支持用户自定义输出参数

### 8.3 集成扩展
- 支持与第三方视频服务集成
- 支持API接口调用
- 支持Webhook通知

## 9. 数据迁移和兼容性

### 9.1 现有系统兼容
- 新增表不影响现有功能
- 共享配置表采用向后兼容的方式
- API版本控制确保兼容性

### 9.2 数据迁移策略
- 采用增量部署方式
- 提供数据回滚机制
- 实现平滑升级过程

## 10. 监控和运维

### 10.1 关键指标监控
- 合并任务成功率
- 平均处理时间
- 系统资源使用情况
- 错误率和错误类型分布

### 10.2 运维支持
- 提供任务状态查询接口
- 支持手动任务重试
- 实现自动故障恢复
- 提供详细的操作日志

## 11. 示例数据

### 11.1 合并任务示例
```sql
INSERT INTO video_merge_tasks (task_uuid, task_name, total_videos, output_format, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', '我的旅行视频合集', 3, 'mp4', 'created');
```

### 11.2 视频项示例
```sql
INSERT INTO merge_video_items (task_id, item_order, original_filename, file_size, video_duration, start_time, end_time) 
VALUES 
(1, 1, 'intro.mp4', 52428800, 30.5, 0, 25.0),
(1, 2, 'main_content.mp4', 157286400, 120.0, 10.0, 90.0),
(1, 3, 'outro.mp4', 31457280, 15.0, 0, 15.0);
```

这个ERD设计为视频合并功能提供了完整的数据模型支持，既满足了功能需求，也考虑了性能、安全性和扩展性。设计采用了模块化的方式，与现有系统保持良好的兼容性。