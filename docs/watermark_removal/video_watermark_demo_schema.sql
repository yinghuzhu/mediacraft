-- 视频去水印 Demo 版本数据库设计
-- 简化版本，只包含核心功能

-- 视频去水印任务表
CREATE TABLE video_watermark_tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_uuid VARCHAR(36) UNIQUE NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    video_duration DECIMAL(10,2),
    video_format VARCHAR(10) NOT NULL,
    video_resolution VARCHAR(20),
    fps DECIMAL(5,2),
    
    -- 文件路径
    original_file_path VARCHAR(500) NOT NULL,
    processed_file_path VARCHAR(500),
    
    -- 任务状态
    status ENUM('uploaded', 'frame_selecting', 'region_selecting', 'processing', 'completed', 'failed') DEFAULT 'uploaded',
    progress_percentage TINYINT DEFAULT 0,
    error_message TEXT,
    
    -- 处理参数
    selected_frame_number INT,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    INDEX idx_task_uuid (task_uuid),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 水印区域表
CREATE TABLE watermark_regions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    region_order TINYINT NOT NULL,
    
    -- 区域坐标
    x INT NOT NULL,
    y INT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES video_watermark_tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_region (task_id, region_order)
);

-- 任务处理日志表
CREATE TABLE task_processing_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    log_level ENUM('info', 'warning', 'error') NOT NULL,
    message TEXT NOT NULL,
    processing_stage VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES video_watermark_tasks(id) ON DELETE CASCADE,
    INDEX idx_task_stage (task_id, processing_stage)
);