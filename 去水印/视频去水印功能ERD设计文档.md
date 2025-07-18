# 视频去水印功能 ERD 设计文档

## 1. 概述

本文档描述了为 MediaCraft 平台（mediacraft.yzhu.name）实现视频去水印功能的实体关系设计。该功能将允许用户通过 Web 界面上传视频、选择水印区域，并获得去除水印后的视频文件。

## 2. 核心业务流程

1. **用户上传视频** → 系统生成任务记录
2. **帧选择阶段** → 用户选择包含水印的代表帧
3. **区域选择阶段** → 用户框选水印区域
4. **后台处理** → AI 模型处理视频去水印
5. **结果交付** → 用户下载处理后的视频

## 3. 实体关系图 (ERD)

### 3.1 核心实体

#### 3.1.1 用户实体 (users)
```sql
users {
    id: BIGINT PRIMARY KEY AUTO_INCREMENT
    username: VARCHAR(50) UNIQUE NOT NULL
    email: VARCHAR(100) UNIQUE
    password_hash: VARCHAR(255) NOT NULL
    user_type: ENUM('free', 'premium', 'admin') DEFAULT 'free'
    credits_remaining: INT DEFAULT 0  -- 剩余处理时长(秒)
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    last_login: TIMESTAMP
    is_active: BOOLEAN DEFAULT TRUE
}
```

#### 3.1.2 视频去水印任务实体 (video_watermark_tasks)
```sql
video_watermark_tasks {
    id: BIGINT PRIMARY KEY AUTO_INCREMENT
    user_id: BIGINT NOT NULL
    task_uuid: VARCHAR(36) UNIQUE NOT NULL  -- 用于前端轮询
    original_filename: VARCHAR(255) NOT NULL
    file_size: BIGINT NOT NULL  -- 文件大小(字节)
    video_duration: DECIMAL(10,2)  -- 视频时长(秒)
    video_format: VARCHAR(10) NOT NULL  -- mp4, mov, avi等
    video_resolution: VARCHAR(20)  -- 1920x1080
    fps: DECIMAL(5,2)  -- 帧率
    
    -- 文件路径
    original_file_path: VARCHAR(500) NOT NULL  -- 原始文件存储路径
    processed_file_path: VARCHAR(500)  -- 处理后文件路径
    
    -- 任务状态
    status: ENUM('uploaded', 'frame_selecting', 'region_selecting', 'queued', 'processing', 'completed', 'failed') DEFAULT 'uploaded'
    progress_percentage: TINYINT DEFAULT 0
    error_message: TEXT
    
    -- 处理参数
    selected_frame_number: INT  -- 用户选择的代表帧号
    detection_mode: ENUM('manual', 'auto') DEFAULT 'manual'
    processing_algorithm: ENUM('opencv_inpaint', 'lama_ai', 'diffusion_ai') DEFAULT 'opencv_inpaint'
    
    -- 时间戳
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    started_at: TIMESTAMP  -- 开始处理时间
    completed_at: TIMESTAMP  -- 完成时间
    expires_at: TIMESTAMP  -- 结果文件过期时间
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
}
```

#### 3.1.3 水印区域实体 (watermark_regions)
```sql
watermark_regions {
    id: BIGINT PRIMARY KEY AUTO_INCREMENT
    task_id: BIGINT NOT NULL
    region_order: TINYINT NOT NULL  -- 区域序号(支持多个水印区域)
    
    -- 区域坐标(相对于视频分辨率)
    x: INT NOT NULL  -- 左上角X坐标
    y: INT NOT NULL  -- 左上角Y坐标
    width: INT NOT NULL  -- 宽度
    height: INT NOT NULL  -- 高度
    
    -- 区域属性
    region_type: ENUM('static', 'dynamic') DEFAULT 'static'
    confidence_score: DECIMAL(3,2)  -- AI检测置信度(0.00-1.00)
    
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
    -- 外键约束
    FOREIGN KEY (task_id) REFERENCES video_watermark_tasks(id) ON DELETE CASCADE,
    -- 复合唯一索引
    UNIQUE KEY unique_task_region (task_id, region_order)
}
```

#### 3.1.4 任务处理日志实体 (task_processing_logs)
```sql
task_processing_logs {
    id: BIGINT PRIMARY KEY AUTO_INCREMENT
    task_id: BIGINT NOT NULL
    log_level: ENUM('info', 'warning', 'error') NOT NULL
    message: TEXT NOT NULL
    processing_stage: VARCHAR(50)  -- 'upload', 'frame_extract', 'ai_process', 'merge_audio'等
    execution_time_ms: INT  -- 执行耗时(毫秒)
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
    -- 外键约束
    FOREIGN KEY (task_id) REFERENCES video_watermark_tasks(id) ON DELETE CASCADE
}
```

#### 3.1.5 用户配额管理实体 (user_quotas)
```sql
user_quotas {
    id: BIGINT PRIMARY KEY AUTO_INCREMENT
    user_id: BIGINT NOT NULL
    quota_type: ENUM('daily_processing_time', 'monthly_processing_time', 'file_size_limit', 'concurrent_tasks') NOT NULL
    quota_limit: INT NOT NULL  -- 配额上限
    quota_used: INT DEFAULT 0  -- 已使用配额
    reset_period: ENUM('daily', 'monthly', 'never') NOT NULL
    last_reset_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- 复合唯一索引
    UNIQUE KEY unique_user_quota (user_id, quota_type)
}
```

#### 3.1.6 系统配置实体 (system_configs)
```sql
system_configs {
    id: INT PRIMARY KEY AUTO_INCREMENT
    config_key: VARCHAR(100) UNIQUE NOT NULL
    config_value: TEXT NOT NULL
    config_type: ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string'
    description: VARCHAR(255)
    is_active: BOOLEAN DEFAULT TRUE
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
}
```

### 3.2 实体关系说明

#### 3.2.1 一对多关系
- **users** → **video_watermark_tasks** (1:N)
  - 一个用户可以创建多个视频处理任务
- **video_watermark_tasks** → **watermark_regions** (1:N)
  - 一个任务可以包含多个水印区域
- **video_watermark_tasks** → **task_processing_logs** (1:N)
  - 一个任务可以产生多条处理日志
- **users** → **user_quotas** (1:N)
  - 一个用户可以有多种类型的配额限制

#### 3.2.2 关系约束
- 所有外键关系都设置了 `ON DELETE CASCADE`，确保数据一致性
- 使用复合唯一索引防止重复数据
- 任务状态使用枚举类型确保数据有效性

## 4. 核心业务规则

### 4.1 任务状态流转
```
uploaded → frame_selecting → region_selecting → queued → processing → completed/failed
```

### 4.2 配额管理规则
- **免费用户**：每日最多处理 5 分钟视频，单文件不超过 100MB
- **付费用户**：根据套餐提供不同的处理时长和文件大小限制
- **并发限制**：每用户最多同时处理 2 个任务

### 4.3 文件管理规则
- 原始文件保存 7 天
- 处理结果保存 3 天
- 超过保存期限自动清理

## 5. 索引设计

### 5.1 主要索引
```sql
-- 任务查询优化
CREATE INDEX idx_tasks_user_status ON video_watermark_tasks(user_id, status);
CREATE INDEX idx_tasks_created_at ON video_watermark_tasks(created_at);
CREATE INDEX idx_tasks_uuid ON video_watermark_tasks(task_uuid);

-- 日志查询优化
CREATE INDEX idx_logs_task_stage ON task_processing_logs(task_id, processing_stage);
CREATE INDEX idx_logs_created_at ON task_processing_logs(created_at);

-- 配额查询优化
CREATE INDEX idx_quotas_user_type ON user_quotas(user_id, quota_type);
```

## 6. 数据安全考虑

### 6.1 敏感数据保护
- 用户密码使用 bcrypt 哈希存储
- 文件路径不直接暴露给前端
- 任务 UUID 用于前端访问，避免暴露内部 ID

### 6.2 数据清理策略
- 定期清理过期的任务文件
- 自动删除失败任务的临时文件
- 日志数据定期归档

## 7. 扩展性考虑

### 7.1 水平扩展
- 使用 UUID 作为任务标识，支持分布式部署
- 文件存储使用云存储服务，支持多地域部署
- 数据库支持读写分离和分库分表

### 7.2 功能扩展
- 预留字段支持更多处理算法
- 支持批量处理任务
- 支持 API 接口调用

## 8. 初始化数据

### 8.1 系统配置初始化
```sql
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('max_file_size_mb', '500', 'integer', '最大文件大小限制(MB)'),
('max_video_duration_minutes', '30', 'integer', '最大视频时长限制(分钟)'),
('supported_formats', '["mp4", "mov", "avi", "mkv"]', 'json', '支持的视频格式'),
('default_processing_algorithm', 'opencv_inpaint', 'string', '默认处理算法'),
('file_retention_days', '7', 'integer', '文件保留天数'),
('result_retention_days', '3', 'integer', '结果文件保留天数');
```

### 8.2 用户配额模板
```sql
-- 免费用户配额模板
INSERT INTO user_quotas (user_id, quota_type, quota_limit, reset_period) VALUES
(?, 'daily_processing_time', 300, 'daily'),  -- 5分钟/天
(?, 'file_size_limit', 104857600, 'never'),  -- 100MB
(?, 'concurrent_tasks', 1, 'never');         -- 1个并发任务

-- 付费用户配额模板
INSERT INTO user_quotas (user_id, quota_type, quota_limit, reset_period) VALUES
(?, 'monthly_processing_time', 18000, 'monthly'),  -- 5小时/月
(?, 'file_size_limit', 1073741824, 'never'),       -- 1GB
(?, 'concurrent_tasks', 3, 'never');               -- 3个并发任务
```

## 9. API 接口设计预览

基于此 ERD 设计，主要的 API 接口将包括：

- `POST /api/video/upload` - 上传视频文件
- `GET /api/video/task/{uuid}/frames` - 获取视频帧用于选择
- `POST /api/video/task/{uuid}/select-frame` - 确认选择的帧
- `POST /api/video/task/{uuid}/select-regions` - 提交水印区域
- `GET /api/video/task/{uuid}/status` - 查询任务状态
- `GET /api/video/task/{uuid}/download` - 下载处理结果
- `GET /api/user/quotas` - 查询用户配额

这个 ERD 设计为视频去水印功能提供了完整的数据模型支持，既考虑了当前需求，也为未来扩展预留了空间。