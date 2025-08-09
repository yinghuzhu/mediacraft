# MediaCraft 部署指南

本指南将帮助您在不同环境中部署 MediaCraft 应用。

## 🎯 部署概述

MediaCraft 是一个前后端分离的应用：
- **后端**: Python Flask API 服务
- **前端**: React 单页应用
- **依赖**: FFmpeg 视频处理引擎

## 🛠️ 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **CPU**: 4核心或更多
- **内存**: 8GB RAM 或更多
- **存储**: 50GB SSD
- **网络**: 高速互联网连接

### 软件依赖
- **操作系统**: Linux (Ubuntu 20.04+), macOS, Windows 10+
- **Python**: 3.8 或更高版本
- **Node.js**: 16.0 或更高版本
- **FFmpeg**: 4.0 或更高版本
- **Git**: 版本控制工具

## 🚀 快速部署

### 1. 环境准备

#### Ubuntu/Debian
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装系统依赖
sudo apt install -y python3 python3-pip python3-venv nodejs npm ffmpeg git

# 验证安装
python3 --version
node --version
ffmpeg -version
```

#### macOS
```bash
# 使用 Homebrew 安装依赖
brew install python3 node ffmpeg git

# 验证安装
python3 --version
node --version
ffmpeg -version
```

#### Windows
1. 安装 Python 3.8+ (从 python.org)
2. 安装 Node.js 16+ (从 nodejs.org)
3. 安装 FFmpeg (从 ffmpeg.org)
4. 安装 Git (从 git-scm.com)

### 2. 获取源代码
```bash
# 克隆项目
git clone <repository-url>
cd mediacraft

# 查看项目结构
ls -la
```

### 3. 后端部署

#### 创建虚拟环境
```bash
# 创建Python虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# 或 Windows: venv\\Scripts\\activate
```

#### 安装依赖
```bash
# 安装Python依赖
pip install -r requirements.txt

# 验证安装
pip list
```

#### 配置环境变量
```bash
# 创建环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

**环境变量说明**:
```bash
# 应用配置
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here

# 文件存储
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=500MB

# 任务配置
TASK_TIMEOUT=3600
CLEANUP_INTERVAL=86400

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

#### 启动后端服务
```bash
# 开发环境
python app.py

# 生产环境 (使用 Gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 4. 前端部署

#### 安装依赖
```bash
# 进入前端目录
cd mediacraft-frontend

# 安装依赖
npm install

# 验证安装
npm list
```

#### 构建生产版本
```bash
# 构建生产版本
npm run build

# 查看构建结果
ls -la build/
```

#### 部署静态文件
```bash
# 使用 serve 部署 (开发/测试)
npm install -g serve
serve -s build -l 3000

# 或使用 Nginx (生产环境)
sudo cp -r build/* /var/www/html/
```

## 🌐 生产环境部署

### 使用 Nginx + Gunicorn

#### 1. 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2. 配置 Nginx
创建配置文件 `/etc/nginx/sites-available/mediacraft`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/mediacraft/build;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传大小限制
    client_max_body_size 500M;
}
```

#### 3. 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 4. 配置 Gunicorn 服务
创建服务文件 `/etc/systemd/system/mediacraft.service`:
```ini
[Unit]
Description=MediaCraft Flask App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/mediacraft
Environment="PATH=/path/to/mediacraft/venv/bin"
ExecStart=/path/to/mediacraft/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 5. 启动服务
```bash
# 重新加载服务配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start mediacraft
sudo systemctl enable mediacraft

# 检查状态
sudo systemctl status mediacraft
```

### 使用 Docker 部署

#### 1. 创建 Dockerfile (后端)
```dockerfile
FROM python:3.9-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

#### 2. 创建 Dockerfile (前端)
```dockerfile
FROM node:16-alpine as build

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    environment:
      - FLASK_ENV=production
    restart: unless-stopped

  frontend:
    build: ./mediacraft-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### 4. 启动容器
```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🔧 配置优化

### 性能优化
```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
sysctl -p
```

### 日志配置
```python
# logging.conf
[loggers]
keys=root,mediacraft

[handlers]
keys=consoleHandler,fileHandler

[formatters]
keys=simpleFormatter

[logger_root]
level=INFO
handlers=consoleHandler

[logger_mediacraft]
level=INFO
handlers=fileHandler
qualname=mediacraft

[handler_consoleHandler]
class=StreamHandler
level=INFO
formatter=simpleFormatter
args=(sys.stdout,)

[handler_fileHandler]
class=FileHandler
level=INFO
formatter=simpleFormatter
args=('logs/app.log',)

[formatter_simpleFormatter]
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

## 📊 监控和维护

### 健康检查
```bash
# 创建健康检查脚本
cat > health_check.sh << 'EOF'
#!/bin/bash
# 检查后端服务
curl -f http://localhost:5000/api/health || exit 1

# 检查前端服务
curl -f http://localhost:80 || exit 1

echo "All services are healthy"
EOF

chmod +x health_check.sh
```

### 日志轮转
```bash
# 配置 logrotate
cat > /etc/logrotate.d/mediacraft << 'EOF'
/path/to/mediacraft/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload mediacraft
    endscript
}
EOF
```

### 备份策略
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mediacraft"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份应用代码
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /path/to/mediacraft

# 备份用户数据
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /path/to/mediacraft/uploads

# 清理旧备份 (保留30天)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# 添加到定时任务
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🔒 安全配置

### SSL/TLS 配置
```bash
# 使用 Let's Encrypt 获取证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### 防火墙配置
```bash
# 配置 UFW 防火墙
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🚨 故障排除

### 常见问题

#### 1. 后端服务无法启动
```bash
# 检查日志
tail -f logs/app.log

# 检查端口占用
netstat -tlnp | grep :5000

# 检查依赖
pip check
```

#### 2. 前端构建失败
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 检查Node版本
node --version
npm --version
```

#### 3. FFmpeg 处理失败
```bash
# 检查FFmpeg安装
ffmpeg -version

# 检查文件权限
ls -la uploads/

# 手动测试处理
ffmpeg -i input.mp4 -c copy output.mp4
```

### 性能问题诊断
```bash
# 系统资源监控
htop
iotop
df -h

# 应用性能分析
python -m cProfile app.py

# 网络连接检查
netstat -an | grep :5000
```

## 📞 技术支持

如果在部署过程中遇到问题，请：
1. 查看相关日志文件
2. 检查系统资源使用情况
3. 验证配置文件正确性
4. 联系技术支持团队

---

**最后更新**: 2025年8月4日  
**维护者**: MediaCraft 开发团队