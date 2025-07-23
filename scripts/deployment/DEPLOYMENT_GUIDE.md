# MediaCraft 部署指南

## 📋 概述

MediaCraft 采用现代化的前后端分离架构：
- **前端**: Next.js 应用 (端口 3000)
- **后端**: Flask API 服务 (端口 50001)
- **代理**: Nginx 反向代理

## 🏗️ 架构图

```
用户请求 → Nginx → Next.js 前端 (3000)
                 ↓
                 Flask 后端 (50001) ← API 请求
```

## 🚀 自动化部署（推荐）

### 1. 创建发布包

```bash
# 在开发机器上执行
./scripts/deployment/create_release.sh

# 生成的发布包
releases/mediacraft-2.0.0.tar.gz (约 400KB)
```

### 2. 上传到服务器

```bash
# 上传发布包
scp releases/mediacraft-2.0.0.tar.gz user@server:/tmp/

# 登录服务器
ssh user@server
```

### 3. 自动安装

```bash
# 解压发布包
cd /tmp
tar -xzf mediacraft-2.0.0.tar.gz
cd mediacraft-2.0.0

# 运行自动安装脚本
sudo ./install.sh
```

### 4. 启动服务

```bash
# 启动后端服务
sudo systemctl start mediacraft-backend

# 启动前端服务
sudo systemctl start mediacraft-frontend

# 重启 Nginx
sudo systemctl restart nginx

# 检查服务状态
sudo systemctl status mediacraft-backend
sudo systemctl status mediacraft-frontend
sudo systemctl status nginx
```

## 🔧 手动部署

### 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Python**: 3.8+
- **Node.js**: 18+ LTS
- **内存**: 4GB+ RAM
- **存储**: 20GB+ 可用空间

### 1. 安装系统依赖

#### Ubuntu/Debian
```bash
# 更新包管理器
sudo apt update

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装其他依赖
sudo apt-get install -y python3 python3-pip python3-venv
sudo apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6
sudo apt-get install -y ffmpeg nginx curl wget
```

#### CentOS/RHEL
```bash
# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# 安装其他依赖
sudo dnf install -y python3 python3-pip
sudo dnf install -y mesa-libGL.x86_64 glib2 libSM libXrender libXext
sudo dnf install -y nginx epel-release
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm
sudo dnf install -y ffmpeg
```

### 2. 创建安装目录

```bash
# 创建应用目录
sudo mkdir -p /var/www/mediacraft
sudo chown $USER:$USER /var/www/mediacraft

# 解压应用文件
cd /var/www/mediacraft
tar -xzf /tmp/mediacraft-2.0.0.tar.gz --strip-components=1
```

### 3. 配置后端

```bash
# 创建 Python 虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt
pip install flask-cors

# 创建必要目录
mkdir -p storage/{tasks,uploads,merge_tasks} temp logs
```

### 4. 配置前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install --production

# 返回根目录
cd ..
```

### 5. 配置系统服务

#### 创建后端服务
```bash
sudo tee /etc/systemd/system/mediacraft-backend.service << 'EOF'
[Unit]
Description=MediaCraft Backend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/mediacraft
Environment=PATH=/var/www/mediacraft/venv/bin
ExecStart=/var/www/mediacraft/venv/bin/python /var/www/mediacraft/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

#### 创建前端服务
```bash
sudo tee /etc/systemd/system/mediacraft-frontend.service << 'EOF'
[Unit]
Description=MediaCraft Frontend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/mediacraft/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

#### 启用服务
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable mediacraft-backend
sudo systemctl enable mediacraft-frontend

# 启动服务
sudo systemctl start mediacraft-backend
sudo systemctl start mediacraft-frontend
```

### 6. 配置 Nginx

```bash
# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/mediacraft << 'EOF'
server {
    listen 80;
    server_name mediacraft.yzhu.name;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Backend API - 优先匹配
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:50001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle large file uploads
        client_max_body_size 500M;
        proxy_request_buffering off;
        
        # Timeout settings
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Static files from backend
    location ^~ /static/ {
        alias /var/www/mediacraft/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend (Next.js) - 默认路由
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
        
        # Timeout settings
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Logs
    access_log /var/log/nginx/mediacraft_access.log;
    error_log /var/log/nginx/mediacraft_error.log;
}
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 7. 配置 SSL (可选但推荐)

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx  # Ubuntu
sudo dnf install certbot python3-certbot-nginx      # CentOS

# 获取 SSL 证书
sudo certbot --nginx -d mediacraft.yzhu.name

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 验证部署

### 1. 检查服务状态

```bash
# 检查后端服务
sudo systemctl status mediacraft-backend

# 检查前端服务
sudo systemctl status mediacraft-frontend

# 检查 Nginx
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep -E ':(3000|50001|80|443)'
```

### 2. 功能测试

```bash
# 健康检查
curl http://localhost:50001/api/health

# 前端访问测试
curl -I http://localhost:3000

# 通过 Nginx 访问测试
curl -I http://mediacraft.yzhu.name
```

### 3. 日志检查

```bash
# 后端日志
sudo journalctl -u mediacraft-backend -f

# 前端日志
sudo journalctl -u mediacraft-frontend -f

# Nginx 日志
sudo tail -f /var/log/nginx/mediacraft_access.log
sudo tail -f /var/log/nginx/mediacraft_error.log
```

## 🔧 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查服务状态
sudo systemctl status mediacraft-backend
sudo systemctl status mediacraft-frontend

# 查看详细日志
sudo journalctl -u mediacraft-backend -n 50
sudo journalctl -u mediacraft-frontend -n 50
```

#### 2. 端口冲突
```bash
# 检查端口占用
sudo lsof -i :3000
sudo lsof -i :50001

# 修改端口配置
sudo systemctl edit mediacraft-frontend
# 添加环境变量 PORT=3001
```

#### 3. 权限问题
```bash
# 设置正确的文件权限
sudo chown -R www-data:www-data /var/www/mediacraft
sudo chmod -R 755 /var/www/mediacraft
```

#### 4. Nginx 配置错误
```bash
# 测试 Nginx 配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
```

## 📊 监控和维护

### 系统监控

```bash
# 系统资源监控
htop
iostat -x 1
df -h

# 服务监控
sudo systemctl status mediacraft-*
```

### 日志轮转

```bash
# 配置日志轮转
sudo tee /etc/logrotate.d/mediacraft << 'EOF'
/var/log/nginx/mediacraft_*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

### 备份策略

```bash
# 备份应用数据
sudo tar -czf /backup/mediacraft-$(date +%Y%m%d).tar.gz \
    /var/www/mediacraft/storage \
    /etc/nginx/sites-available/mediacraft \
    /etc/systemd/system/mediacraft-*.service

# 定期备份脚本
sudo crontab -e
# 添加：0 2 * * * /path/to/backup-script.sh
```

## 🔄 更新部署

### 1. 创建新版本发布包

```bash
# 在开发机器上
./scripts/deployment/create_release.sh 2.1.0
```

### 2. 更新服务器

```bash
# 停止服务
sudo systemctl stop mediacraft-frontend
sudo systemctl stop mediacraft-backend

# 备份当前版本
sudo cp -r /var/www/mediacraft /var/www/mediacraft.backup

# 部署新版本
cd /tmp
tar -xzf mediacraft-2.1.0.tar.gz
sudo cp -r mediacraft-2.1.0/* /var/www/mediacraft/

# 更新依赖
cd /var/www/mediacraft
source venv/bin/activate
pip install -r requirements.txt

cd frontend
npm install --production

# 重启服务
sudo systemctl start mediacraft-backend
sudo systemctl start mediacraft-frontend
```

## 📞 支持

如果遇到部署问题，请：

1. 检查系统日志：`sudo journalctl -xe`
2. 查看服务状态：`sudo systemctl status mediacraft-*`
3. 检查网络连接：`curl -I http://localhost:3000`
4. 提交 GitHub Issue 或联系技术支持

---

**部署指南版本**: v2.0  
**最后更新**: 2025年1月24日  
**适用版本**: MediaCraft 2.0.0+