# MediaCraft 数据目录分离架构

## 概述

从 MediaCraft v2.3.0 开始，我们实现了数据目录和程序目录的分离，这是生产环境的最佳实践。这种架构确保在升级程序时不会意外删除用户数据。

## 目录结构

### 程序目录（可配置）
```
/var/www/mediacraft/          # 程序文件目录（默认，可自定义）
├── core/                     # 核心程序文件
│   ├── app.py               # Flask 应用
│   └── config.py            # 配置文件
├── frontend/                 # Next.js 前端
├── models/                   # 数据模型
├── processors/              # 视频处理器
├── launchers/               # 启动脚本
├── data -> /var/lib/mediacraft  # 数据目录符号链接
├── install.sh               # 安装脚本
├── upgrade.sh               # 升级脚本
└── production.conf          # 生产环境配置
```

### 数据目录（可配置）
```
/var/lib/mediacraft/          # 数据文件目录（默认，可自定义，升级时保留）
├── uploads/                  # 用户上传的文件
├── results/                  # 处理结果文件
├── temp/                     # 临时文件
├── storage/                  # 存储文件
├── tasks/                    # 任务数据
├── sessions/                 # 会话数据
├── logs/                     # 日志文件
├── config.json              # 应用配置
├── tasks.json               # 任务数据
├── sessions.json            # 会话数据
└── users.json               # 用户数据
```

### 自定义目录示例
```bash
# 企业环境示例
程序目录: /opt/mediacraft
数据目录: /data/mediacraft

# 多实例部署示例
程序目录: /opt/mediacraft-prod
数据目录: /data/mediacraft-prod

程序目录: /opt/mediacraft-test  
数据目录: /data/mediacraft-test
```

## 优势

### 1. 安全升级
- 程序升级时不会影响用户数据
- 数据目录完全独立，不会被意外删除
- 支持回滚到之前版本

### 2. 数据持久化
- 用户上传的视频文件永久保存
- 处理历史和任务记录保留
- 用户会话和配置不丢失

### 3. 备份简化
- 只需备份 `/var/lib/mediacraft` 目录即可保存所有用户数据
- 程序文件可以随时重新部署

### 4. 权限管理
- 数据目录和程序目录可以设置不同的权限
- 更好的安全性控制

## 部署方式

### 新安装

#### 使用默认目录
```bash
# 1. 解压发布包
tar -xzf mediacraft-2.4.0.tar.gz
cd mediacraft-2.4.0

# 2. 运行安装脚本（使用默认目录）
sudo ./install.sh
```

#### 使用自定义目录
```bash
# 1. 解压发布包
tar -xzf mediacraft-2.4.0.tar.gz
cd mediacraft-2.4.0

# 2. 运行安装脚本（自定义目录）
sudo ./install.sh -i /opt/mediacraft -d /data/mediacraft
```

安装脚本会：
- 创建指定的程序目录（默认：`/var/www/mediacraft`）
- 创建指定的数据目录（默认：`/var/lib/mediacraft`）
- 建立符号链接 `程序目录/data -> 数据目录`
- 根据实际路径生成系统服务和 Nginx 配置
- 设置正确的权限

### 升级现有安装

#### 使用默认目录
```bash
# 1. 解压发布包
tar -xzf mediacraft-2.4.0.tar.gz
cd mediacraft-2.4.0

# 2. 运行升级脚本（使用默认目录）
sudo ./upgrade.sh
```

#### 使用自定义目录
```bash
# 1. 解压发布包
tar -xzf mediacraft-2.4.0.tar.gz
cd mediacraft-2.4.0

# 2. 运行升级脚本（自定义目录）
sudo ./upgrade.sh -i /opt/mediacraft -d /data/mediacraft
```

升级脚本会：
- 停止服务
- 备份当前程序文件到 `/var/backups/mediacraft-YYYYMMDD-HHMMSS`
- 保留数据目录不变
- 更新程序文件
- 根据实际路径更新系统服务和 Nginx 配置
- 重新启动服务

### 从旧版本迁移
如果从 v2.2.x 或更早版本升级，升级脚本会自动检测并迁移数据：

```bash
# 升级脚本会自动执行以下操作：
# 1. 检测旧的数据目录结构
# 2. 将数据迁移到新的独立数据目录
# 3. 创建符号链接
# 4. 更新配置
```

## 配置文件

### production.conf
升级后会在程序目录创建 `production.conf` 文件，包含数据目录路径：

```bash
# MediaCraft Production Configuration
DATA_DIR=/var/lib/mediacraft
UPLOAD_DIR=/var/lib/mediacraft/uploads
RESULTS_DIR=/var/lib/mediacraft/results
TEMP_DIR=/var/lib/mediacraft/temp
STORAGE_DIR=/var/lib/mediacraft/storage
TASKS_DIR=/var/lib/mediacraft/tasks
SESSIONS_DIR=/var/lib/mediacraft/sessions
LOGS_DIR=/var/lib/mediacraft/logs

# Database files
CONFIG_FILE=/var/lib/mediacraft/config.json
TASKS_FILE=/var/lib/mediacraft/tasks.json
SESSIONS_FILE=/var/lib/mediacraft/sessions.json
USERS_FILE=/var/lib/mediacraft/users.json
```

## 维护操作

### 备份数据
```bash
# 备份所有用户数据
sudo tar -czf mediacraft-data-backup-$(date +%Y%m%d).tar.gz -C /var/lib mediacraft

# 只备份配置文件
sudo cp /var/lib/mediacraft/*.json /path/to/backup/
```

### 恢复数据
```bash
# 恢复完整数据
sudo tar -xzf mediacraft-data-backup-YYYYMMDD.tar.gz -C /var/lib

# 恢复权限
sudo chown -R www-data:www-data /var/lib/mediacraft
```

### 清理临时文件
```bash
# 清理临时文件（保留用户数据）
sudo rm -rf /var/lib/mediacraft/temp/*
sudo rm -rf /var/lib/mediacraft/logs/*.log
```

### 检查磁盘使用
```bash
# 检查数据目录大小
sudo du -sh /var/lib/mediacraft

# 检查各子目录大小
sudo du -sh /var/lib/mediacraft/*
```

## 故障排除

### 符号链接问题
如果数据目录符号链接丢失：
```bash
sudo ln -sf /var/lib/mediacraft /var/www/mediacraft/data
```

### 权限问题
如果遇到权限错误：
```bash
sudo chown -R www-data:www-data /var/www/mediacraft
sudo chown -R www-data:www-data /var/lib/mediacraft
sudo chmod -R 755 /var/www/mediacraft
sudo chmod -R 755 /var/lib/mediacraft
```

### 数据目录不存在
如果数据目录丢失，重新创建：
```bash
sudo mkdir -p /var/lib/mediacraft/{uploads,results,temp,storage,tasks,sessions,logs}
sudo chown -R www-data:www-data /var/lib/mediacraft
echo '{}' | sudo tee /var/lib/mediacraft/config.json
echo '[]' | sudo tee /var/lib/mediacraft/tasks.json
echo '{}' | sudo tee /var/lib/mediacraft/sessions.json
echo '{}' | sudo tee /var/lib/mediacraft/users.json
```

## 版本兼容性

- **v2.3.0+**: 原生支持数据目录分离
- **v2.2.x**: 升级时自动迁移到新架构
- **v2.1.x 及更早**: 需要手动迁移数据

这种架构确保了 MediaCraft 在生产环境中的稳定性和数据安全性。