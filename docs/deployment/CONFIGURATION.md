# MediaCraft 配置管理指南

## 概述

MediaCraft 支持通过环境配置文件进行灵活的配置管理，支持开发环境和生产环境的不同配置需求。

## 配置文件结构

### 开发环境配置 (`.env.development`)
```bash
# Flask 配置
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=dev-secret-key-for-local-development

# 服务器配置
HOST=127.0.0.1
PORT=50001

# 数据目录配置
DATA_DIR=./data
TEMP_DIR=./data/temp
UPLOAD_DIR=./data/uploads
RESULTS_DIR=./data/results
STORAGE_DIR=./data/storage

# 任务队列配置
MAX_CONCURRENT_TASKS=2
MAX_QUEUE_SIZE=20
TASK_RETENTION_DAYS=3

# 日志配置
LOG_LEVEL=DEBUG
LOG_FILE=./data/logs/app.log

# 开发模式特定配置
ENABLE_CORS=true
ENABLE_DEBUG_TOOLBAR=false
```

### 生产环境配置 (`.env.production`)
```bash
# Flask 配置
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=SECURE_RANDOM_STRING_HERE

# 服务器配置
HOST=127.0.0.1
PORT=50001

# 数据目录配置（绝对路径）
DATA_DIR=/var/lib/mediacraft
TEMP_DIR=/var/lib/mediacraft/temp
UPLOAD_DIR=/var/lib/mediacraft/uploads
RESULTS_DIR=/var/lib/mediacraft/results
STORAGE_DIR=/var/lib/mediacraft/storage

# 任务队列配置
MAX_CONCURRENT_TASKS=5
MAX_QUEUE_SIZE=100
TASK_RETENTION_DAYS=30

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/var/lib/mediacraft/logs/app.log

# 安全配置
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Lax

# 性能配置
MAX_CONTENT_LENGTH=524288000  # 500MB
UPLOAD_TIMEOUT=300
PROCESSING_TIMEOUT=1800

# 监控配置
ENABLE_METRICS=true
HEALTH_CHECK_INTERVAL=60
```

## 配置参数说明

### Flask 配置
- `FLASK_ENV`: 运行环境 (`development` | `production`)
- `FLASK_DEBUG`: 调试模式 (`0` | `1`)
- `SECRET_KEY`: Flask 密钥，生产环境必须设置为安全的随机字符串

### 服务器配置
- `HOST`: 服务监听地址 (默认: `127.0.0.1`)
- `PORT`: 服务端口 (默认: `50001`)

### 数据目录配置
- `DATA_DIR`: 主数据目录
- `TEMP_DIR`: 临时文件目录
- `UPLOAD_DIR`: 上传文件目录
- `RESULTS_DIR`: 处理结果目录
- `STORAGE_DIR`: 存储目录

### 任务队列配置
- `MAX_CONCURRENT_TASKS`: 最大并发任务数
- `MAX_QUEUE_SIZE`: 队列最大大小
- `TASK_RETENTION_DAYS`: 任务保留天数

### 安全配置
- `SESSION_COOKIE_SECURE`: Cookie 安全标志
- `SESSION_COOKIE_HTTPONLY`: Cookie HttpOnly 标志
- `SESSION_COOKIE_SAMESITE`: Cookie SameSite 策略

### 性能配置
- `MAX_CONTENT_LENGTH`: 最大上传文件大小（字节）
- `UPLOAD_TIMEOUT`: 上传超时时间（秒）
- `PROCESSING_TIMEOUT`: 处理超时时间（秒）

### 日志配置
- `LOG_LEVEL`: 日志级别 (`DEBUG` | `INFO` | `WARNING` | `ERROR`)
- `LOG_FILE`: 日志文件路径

### CORS 配置
- `ENABLE_CORS`: 启用 CORS
- `CORS_ORIGINS`: 允许的来源列表（逗号分隔）

## 使用方法

### 开发环境
```bash
# 1. 确保 .env.development 文件存在
# 2. 启动服务
./start_backend.sh
```

### 生产环境
生产环境的配置文件会在安装时自动生成：

```bash
# 安装时自动生成 .env.production
sudo ./install.sh -i /opt/mediacraft -d /data/mediacraft

# 手动启动生产服务
sudo ./scripts/start_production.sh -i /opt/mediacraft -d /data/mediacraft
```

## 配置验证

使用配置验证脚本检查配置是否正确：

```bash
# 验证当前配置
python scripts/validate_config.py
```

验证脚本会检查：
- 配置文件是否存在
- 目录是否创建
- 依赖是否安装
- 关键配置是否正确

## 配置最佳实践

### 开发环境
1. **使用相对路径**: 数据目录使用相对路径，便于开发
2. **启用调试**: 设置 `FLASK_DEBUG=1` 和 `LOG_LEVEL=DEBUG`
3. **较小的限制**: 使用较小的并发数和队列大小
4. **宽松的安全设置**: Cookie 安全设置可以较为宽松

### 生产环境
1. **使用绝对路径**: 所有目录使用绝对路径
2. **安全的密钥**: 使用强随机密钥
3. **适当的性能配置**: 根据服务器性能调整并发数
4. **严格的安全设置**: 启用所有安全选项
5. **合适的日志级别**: 使用 `INFO` 或 `WARNING` 级别

### 安全注意事项
1. **保护配置文件**: 生产环境配置文件权限设置为 `600`
2. **定期更换密钥**: 定期更换 `SECRET_KEY`
3. **监控日志**: 定期检查应用日志
4. **备份配置**: 备份重要的配置文件

## 环境变量优先级

配置加载优先级（从高到低）：
1. 系统环境变量
2. `.env.{FLASK_ENV}` 文件
3. 代码中的默认值

## 故障排除

### 配置文件不生效
1. 检查文件名是否正确
2. 检查文件权限
3. 检查语法是否正确（无多余空格、引号等）

### 目录权限问题
```bash
# 修复目录权限
sudo chown -R www-data:www-data /var/lib/mediacraft
sudo chmod -R 755 /var/lib/mediacraft
```

### 服务启动失败
1. 检查配置文件是否存在
2. 运行配置验证脚本
3. 查看系统日志：`journalctl -u mediacraft-backend -n 50`

## 配置模板

项目提供了配置模板文件：
- `scripts/deployment/.env.production.template`: 生产环境模板
- 安装脚本会自动根据模板生成实际配置文件

这种配置管理方式确保了 MediaCraft 在不同环境下的灵活性和安全性。