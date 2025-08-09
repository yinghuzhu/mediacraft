# MediaCraft 手工部署指南

## 📋 概述

本指南详细介绍如何在生产服务器上手工部署 MediaCraft，适用于需要自定义配置或自动化脚本无法满足需求的场景。

## 🎯 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Next.js       │    │     Flask       │
│   (反向代理)     │────│   (前端)        │────│    (后端)       │
│   Port: 80/443  │    │   Port: 3000    │    │   Port: 50001   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 部署步骤

### 第一步：准备服务器环境

#### 1.1 更新系统包
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL/Rocky Linux
sudo dnf update -y
```

#### 1.2 安装基础依赖
```bash
# Ubuntu/Debian
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    curl \
    wget \
    git \
    nginx \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6

# CentOS/RHEL/Rocky Linux
sudo dnf install -y \
    python3 \
    python3-pip \
    python3-devel \
    gcc \
    gcc-c++ \
    make \
    curl \
    wget \
    git \
    nginx \
    mesa-libGL \
    glib2 \
    libSM \
    libXrender \
    libXext

# 安装 FFmpeg (CentOS/RHEL 需要额外步骤)
sudo dnf install -y epel-release
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm
sudo dnf install -y ffmpeg
```

#### 1.3 安装 Node.js 18+
```bash
# 使用 NodeSource 仓库 (推荐)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu/Debian

# 或者 CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# 验证安装
node --version  # 应该显示 v18.x.x
npm --version
```

### 第二步：创建用户和目录

#### 2.1 创建专用用户
```bash
# 创建 mediacraft 用户
sudo useradd -r -s /bin/bash -d /var/www/mediacraft mediacraft

# 创建主目录
sudo mkdir -p /var/www/mediacraft
sudo chown mediacraft:mediacraft /var/www/mediacraft
```

#### 2.2 创建必要目录

**重要：从 v2.3.0 开始，MediaCraft 采用数据目录分离架构**

```bash
# 创建程序目录
sudo mkdir -p /var/www/mediacraft
sudo chown mediacraft:mediacraft /var/www/mediacraft

# 创建独立的数据目录
sudo mkdir -p /var/lib/mediacraft
sudo mkdir -p /var/lib/mediacraft/{uploads,results,temp,storage,tasks,sessions,logs}
sudo mkdir -p /var/lib/mediacraft/temp/{processing,merge_temp}
sudo chown -R mediacraft:mediacraft /var/lib/mediacraft

# 创建数据目录符号链接
sudo ln -sf /var/lib/mediacraft /var/www/mediacraft/data
```

### 第三步：部署应用代码

#### 3.1 上传发布包
```bash
# 方法1: 使用 scp 上传
scp releases/mediacraft-2.3.0.tar.gz user@your-server:/tmp/

# 方法2: 在服务器上直接下载
wget https://github.com/your-repo/releases/download/v2.3.0/mediacraft-2.3.0.tar.gz -O /tmp/mediacraft-2.3.0.tar.gz
```

#### 3.2 解压和部署
```bash
# 解压到临时目录
cd /tmp
tar -xzf mediacraft-2.3.0.tar.gz

# 复制程序文件到目标目录
sudo cp -r mediacraft-2.3.0/* /var/www/mediacraft/
sudo chown -R mediacraft:mediacraft /var/www/mediacraft

# 确保数据目录符号链接存在
sudo ln -sf /var/lib/mediacraft /var/www/mediacraft/data

# 创建初始数据文件（如果不存在）
sudo -u mediacraft bash -c '
[ ! -f /var/lib/mediacraft/config.json ] && echo "{}" > /var/lib/mediacraft/config.json
[ ! -f /var/lib/mediacraft/tasks.json ] && echo "[]" > /var/lib/mediacraft/tasks.json
[ ! -f /var/lib/mediacraft/sessions.json ] && echo "{}" > /var/lib/mediacraft/sessions.json
[ ! -f /var/lib/mediacraft/users.json ] && echo "{}" > /var/lib/mediacraft/users.json
'
```

### 第四步：配置后端服务

#### 4.1 创建 Python 虚拟环境
```bash
# 切换到 mediacraft 用户
sudo -u mediacraft bash
cd /var/www/mediacraft

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级 pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt
```

#### 4.2 测试后端
```bash
# 在虚拟环境中测试
source venv/bin/activate
python -c "import cv2, numpy, flask, flask_cors; print('✓ 后端依赖安装成功')"

# 测试 FFmpeg
ffmpeg -version | head -1

# 快速启动测试 (Ctrl+C 停止)
python app.py
```

### 第五步：配置前端服务

#### 5.1 安装前端依赖
```bash
# 仍在 mediacraft 用户下
cd /var/www/mediacraft/frontend

# 安装生产依赖
npm install --production --no-optional

# 验证安装
npm list --depth=0
```

#### 5.2 测试前端
```bash
# 快速启动测试 (Ctrl+C 停止)
npm start
```

### 第六步：配置系统服务

#### 6.1 创建后端服务
```bash
# 退出 mediacraft 用户
exit

# 创建 systemd 服务文件
sudo tee /etc/systemd/system/mediacraft-backend.service > /dev/null << 'EOF'
[Unit]
Description=MediaCraft Backend Service
After=network.target

[Service]
Type=simple
User=mediacraft
Group=mediacraft
WorkingDirectory=/var/www/mediacraft
Environment=PATH=/var/www/mediacraft/venv/bin
Environment=PYTHONPATH=/var/www/mediacraft
Environment=DEBUG=False
Environment=HOST=127.0.0.1
Environment=PORT=50001
ExecStart=/var/www/mediacraft/venv/bin/python /var/www/mediacraft/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/mediacraft/storage /var/www/mediacraft/temp /var/www/mediacraft/logs

[Install]
WantedBy=multi-user.target
EOF
```

#### 6.2 创建前端服务
```bash
sudo tee /etc/systemd/system/mediacraft-frontend.service > /dev/null << 'EOF'
[Unit]
Description=MediaCraft Frontend Service
After=network.target

[Service]
Type=simple
User=mediacraft
Group=mediacraft
WorkingDirectory=/var/www/mediacraft/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=http://127.0.0.1:50001
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
EOF
```

#### 6.3 启用和启动服务
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务 (开机自启)
sudo systemctl enable mediacraft-backend.service
sudo systemctl enable mediacraft-frontend.service

# 启动服务
sudo systemctl start mediacraft-backend.service
sudo systemctl start mediacraft-frontend.service

# 检查状态
sudo systemctl status mediacraft-backend.service
sudo systemctl status mediacraft-frontend.service
```

### 第七步：配置 Nginx 反向代理

#### 7.1 创建 Nginx 配置
```bash
sudo tee /etc/nginx/sites-available/mediacraft > /dev/null << 'EOF'
# MediaCraft Nginx Configuration
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # 替换为你的域名
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # 文件上传大小限制
    client_max_body_size 500M;
    
    # 后端 API 路由
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:50001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # 大文件上传
        proxy_request_buffering off;
        
        # 缓冲设置
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # 静态文件
    location ^~ /static/ {
        alias /var/www/mediacraft/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Next.js 静态文件
    location ^~ /_next/static/ {
        alias /var/www/mediacraft/frontend/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 前端应用 (默认路由)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # 日志
    access_log /var/log/nginx/mediacraft_access.log;
    error_log /var/log/nginx/mediacraft_error.log;
}
EOF
```

#### 7.2 启用站点配置
```bash
# 创建符号链接
sudo ln -sf /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/

# 删除默认站点 (可选)
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 第八步：配置 SSL (可选但推荐)

#### 8.1 安装 Certbot
```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo dnf install -y certbot python3-certbot-nginx
```

#### 8.2 获取 SSL 证书
```bash
# 替换为你的域名和邮箱
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --email your-email@example.com --agree-tos --no-eff-email

# 测试自动续期
sudo certbot renew --dry-run
```

### 第九步：验证部署

#### 9.1 检查服务状态
```bash
# 检查所有服务
sudo systemctl status mediacraft-backend.service
sudo systemctl status mediacraft-frontend.service
sudo systemctl status nginx.service

# 检查端口监听
sudo netstat -tlnp | grep -E ':(80|443|3000|50001)'
```

#### 9.2 功能测试
```bash
# 健康检查
curl -I http://your-domain.com/api/health

# 前端访问测试
curl -I http://your-domain.com/

# HTTPS 测试 (如果配置了 SSL)
curl -I https://your-domain.com/
```

#### 9.3 日志检查
```bash
# 查看应用日志
sudo journalctl -u mediacraft-backend.service -f
sudo journalctl -u mediacraft-frontend.service -f

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/mediacraft_access.log
sudo tail -f /var/log/nginx/mediacraft_error.log
```

## 🔧 高级配置

### 环境变量配置

创建环境配置文件：
```bash
sudo -u mediacraft tee /var/www/mediacraft/.env > /dev/null << 'EOF'
# 服务器配置
DEBUG=False
HOST=127.0.0.1
PORT=50001

# 文件配置
MAX_FILE_SIZE=524288000
TEMP_DIR=/var/www/mediacraft/temp
STORAGE_DIR=/var/www/mediacraft/storage

# 处理配置
FRAME_QUALITY=90
MAX_PROCESSING_TIME=600
BATCH_SIZE=50

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/var/www/mediacraft/logs/app.log
EOF
```

### 性能优化

#### 系统级优化
```bash
# 增加文件描述符限制
echo "mediacraft soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "mediacraft hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化内核参数
sudo tee -a /etc/sysctl.conf > /dev/null << 'EOF'
# 网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535

# 内存优化
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sudo sysctl -p
```

#### 应用级优化
```bash
# 配置 Nginx worker 进程数
sudo sed -i "s/worker_processes auto;/worker_processes $(nproc);/" /etc/nginx/nginx.conf

# 配置 Nginx 连接数
sudo tee -a /etc/nginx/nginx.conf > /dev/null << 'EOF'
events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}
EOF
```

### 监控和日志

#### 设置日志轮转
```bash
sudo tee /etc/logrotate.d/mediacraft > /dev/null << 'EOF'
/var/www/mediacraft/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mediacraft mediacraft
    postrotate
        systemctl reload mediacraft-backend.service
    endscript
}
EOF
```

#### 设置监控脚本
```bash
sudo tee /usr/local/bin/mediacraft-health-check.sh > /dev/null << 'EOF'
#!/bin/bash
# MediaCraft 健康检查脚本

DOMAIN="your-domain.com"
LOG_FILE="/var/log/mediacraft-health.log"

# 检查后端健康
if curl -f -s "http://127.0.0.1:50001/api/health" > /dev/null; then
    echo "$(date): Backend OK" >> $LOG_FILE
else
    echo "$(date): Backend FAILED" >> $LOG_FILE
    systemctl restart mediacraft-backend.service
fi

# 检查前端健康
if curl -f -s "http://127.0.0.1:3000" > /dev/null; then
    echo "$(date): Frontend OK" >> $LOG_FILE
else
    echo "$(date): Frontend FAILED" >> $LOG_FILE
    systemctl restart mediacraft-frontend.service
fi
EOF

sudo chmod +x /usr/local/bin/mediacraft-health-check.sh

# 添加到 crontab (每5分钟检查一次)
echo "*/5 * * * * /usr/local/bin/mediacraft-health-check.sh" | sudo crontab -
```

## 🛠️ 故障排除

### 常见问题和解决方案

#### 1. 服务启动失败
```bash
# 查看详细错误信息
sudo journalctl -u mediacraft-backend.service -n 50
sudo journalctl -u mediacraft-frontend.service -n 50

# 检查配置文件
sudo nginx -t
python3 -m py_compile /var/www/mediacraft/app.py
```

#### 2. 权限问题
```bash
# 修复文件权限
sudo chown -R mediacraft:mediacraft /var/www/mediacraft
sudo chmod -R 755 /var/www/mediacraft
sudo chmod -R 777 /var/www/mediacraft/storage
sudo chmod -R 777 /var/www/mediacraft/temp
```

#### 3. 端口冲突
```bash
# 检查端口占用
sudo netstat -tlnp | grep -E ':(3000|50001)'
sudo lsof -i :3000
sudo lsof -i :50001

# 修改端口配置
sudo systemctl edit mediacraft-backend.service
sudo systemctl edit mediacraft-frontend.service
```

#### 4. 内存不足
```bash
# 检查内存使用
free -h
ps aux --sort=-%mem | head -10

# 添加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 维护命令

#### 日常维护
```bash
# 重启所有服务
sudo systemctl restart mediacraft-backend.service
sudo systemctl restart mediacraft-frontend.service
sudo systemctl reload nginx

# 清理临时文件
sudo -u mediacraft find /var/www/mediacraft/temp -type f -mtime +1 -delete

# 查看磁盘使用
df -h /var/www/mediacraft
du -sh /var/www/mediacraft/storage/*

# 备份配置
sudo tar -czf /backup/mediacraft-config-$(date +%Y%m%d).tar.gz \
    /etc/nginx/sites-available/mediacraft \
    /etc/systemd/system/mediacraft-*.service \
    /var/www/mediacraft/.env
```

#### 更新部署
```bash
# 停止服务
sudo systemctl stop mediacraft-backend.service
sudo systemctl stop mediacraft-frontend.service

# 备份当前版本
sudo cp -r /var/www/mediacraft /backup/mediacraft-$(date +%Y%m%d)

# 部署新版本
# (重复第三步的部署过程)

# 启动服务
sudo systemctl start mediacraft-backend.service
sudo systemctl start mediacraft-frontend.service
```

## 📊 性能监控

### 系统监控
```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs

# 实时监控
htop                    # CPU 和内存
iotop                   # 磁盘 I/O
nethogs                 # 网络使用
```

### 应用监控
```bash
# 查看应用资源使用
ps aux | grep -E '(python|node)'
sudo systemctl status mediacraft-*

# 查看连接数
ss -tuln | grep -E ':(80|443|3000|50001)'
```

## 🔒 安全加固

### 防火墙配置
```bash
# 安装 ufw (Ubuntu) 或使用 firewalld (CentOS)
sudo apt install -y ufw

# 基本规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable
sudo ufw status
```

### 安全更新
```bash
# 设置自动安全更新
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

这个手工部署指南提供了完整的步骤，让你可以在任何 Linux 服务器上成功部署 MediaCraft。记得根据你的具体环境调整域名、路径和配置参数。