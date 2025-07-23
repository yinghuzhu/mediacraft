# MediaCraft 安装指南

## 📋 系统要求

### 最低要求
- **操作系统**: Linux, macOS, Windows
- **Python**: 3.8 或更高版本
- **Node.js**: 18 或更高版本
- **内存**: 4GB RAM
- **存储**: 10GB 可用空间
- **网络**: 互联网连接（用于依赖下载）

### 推荐配置
- **操作系统**: Ubuntu 20.04+ / macOS 12+ / Windows 10+
- **Python**: 3.10 或更高版本
- **Node.js**: 18+ LTS 版本
- **内存**: 8GB RAM 或更多
- **存储**: 20GB 可用空间
- **CPU**: 多核处理器（视频处理性能更好）

## 🔧 依赖软件

### 后端依赖
1. **Python 3.8+**
2. **FFmpeg** (用于视频处理)
3. **OpenCV** (通过 pip 安装)

### 前端依赖
1. **Node.js 18+** (LTS 版本推荐)
2. **npm** 或 **yarn** (包管理器)

### Node.js 安装

#### macOS
```bash
# 使用 Homebrew
brew install node@18

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Ubuntu/Debian
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### Windows
1. 从 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本
2. 运行安装程序
3. 验证安装：`node --version`

### FFmpeg 安装

#### macOS
```bash
# 使用 Homebrew
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
1. 从 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载
2. 解压到系统路径
3. 添加到环境变量 PATH

#### 验证安装
```bash
ffmpeg -version
node --version
npm --version
```

## 📦 安装步骤

### 开发环境安装

#### 1. 克隆项目
```bash
git clone https://github.com/yinghuzhu/mediacraft.git
cd mediacraft
```

#### 2. 后端设置
```bash
# 创建 Python 虚拟环境
python3 -m venv venv

# 激活虚拟环境
# macOS/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate

# 安装 Python 依赖
pip install -r requirements.txt
```

#### 3. 前端设置
```bash
# 进入前端目录
cd mediacraft-frontend

# 安装 Node.js 依赖
npm install

# 返回项目根目录
cd ..
```

#### 4. 验证安装
```bash
# 检查后端依赖
python -c "import cv2, numpy, flask, flask_cors; print('后端依赖已安装')"

# 检查前端依赖
cd mediacraft-frontend && npm list --depth=0 && cd ..

# 运行测试
python test_video_watermark.py
python test_video_merger.py
```

### 生产环境安装

#### 使用自动化部署脚本（推荐）

```bash
# 1. 创建发布包
./scripts/deployment/create_release.sh

# 2. 上传到服务器
scp releases/mediacraft-2.0.0.tar.gz user@server:/tmp/

# 3. 在服务器上安装
ssh user@server
cd /tmp
tar -xzf mediacraft-2.0.0.tar.gz
cd mediacraft-2.0.0
sudo ./install.sh
```

#### 手动安装步骤

```bash
# 1. 安装系统依赖
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm ffmpeg nginx

# CentOS/RHEL
sudo dnf install -y python3 python3-pip nodejs npm ffmpeg nginx

# 2. 创建安装目录
sudo mkdir -p /var/www/mediacraft
sudo chown $USER:$USER /var/www/mediacraft

# 3. 复制项目文件
cp -r * /var/www/mediacraft/
cd /var/www/mediacraft

# 4. 设置后端
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. 设置前端
cd mediacraft-frontend
npm install --production
npm run build
cd ..

# 6. 配置服务
sudo cp scripts/deployment/mediacraft-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mediacraft-backend mediacraft-frontend

# 7. 配置 Nginx
sudo cp scripts/deployment/nginx_mediacraft.conf /etc/nginx/sites-available/mediacraft
sudo ln -s /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🚀 启动应用

### 开发模式

#### 启动后端服务
```bash
# 激活虚拟环境
source venv/bin/activate

# 启动 Flask 后端
python app.py
# 后端运行在 http://localhost:50001
```

#### 启动前端服务
```bash
# 在新终端中进入前端目录
cd mediacraft-frontend

# 启动 Next.js 开发服务器
npm run dev
# 前端运行在 http://localhost:3000
```

#### 单独启动特定功能
```bash
# 仅启动水印去除功能
python start_video_watermark.py

# 仅启动视频合并功能
python start_video_merger.py
```

### 生产模式

#### 使用 systemd 服务
```bash
# 启动服务
sudo systemctl start mediacraft-backend
sudo systemctl start mediacraft-frontend
sudo systemctl start nginx

# 检查状态
sudo systemctl status mediacraft-backend
sudo systemctl status mediacraft-frontend
```

#### 手动启动
```bash
# 启动后端
cd /var/www/mediacraft
source venv/bin/activate
python app.py &

# 启动前端
cd /var/www/mediacraft/frontend
npm start &
```

### 访问地址

#### 开发环境
- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:50001/api/health
- **水印去除**: http://localhost:3000/watermark-remover
- **视频合并**: http://localhost:3000/video-merger

#### 生产环境
- **主应用**: https://mediacraft.yzhu.name
- **水印去除**: https://mediacraft.yzhu.name/watermark-remover
- **视频合并**: https://mediacraft.yzhu.name/video-merger
- **API 健康检查**: https://mediacraft.yzhu.name/api/health

## ⚙️ 配置选项

### 环境变量配置
创建 `.env` 文件或设置环境变量：

```bash
# 服务器配置
DEBUG=True
HOST=0.0.0.0
PORT=50001

# 文件配置
MAX_FILE_SIZE=524288000  # 500MB
TEMP_DIR=/path/to/temp
STORAGE_DIR=/path/to/storage

# 处理配置
FRAME_QUALITY=90
MAX_PROCESSING_TIME=600  # 10分钟
BATCH_SIZE=50
```

### 配置文件说明
- `DEBUG`: 调试模式开关
- `HOST`: 服务器监听地址
- `PORT`: 服务器端口
- `MAX_FILE_SIZE`: 最大文件上传大小
- `TEMP_DIR`: 临时文件目录
- `STORAGE_DIR`: 数据存储目录

## 🐳 Docker 部署

### 创建 Dockerfile
```dockerfile
FROM python:3.10-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建必要目录
RUN mkdir -p temp storage

# 暴露端口
EXPOSE 50001

# 启动命令
CMD ["python", "app.py"]
```

### 构建和运行
```bash
# 构建镜像
docker build -t mediacraft .

# 运行容器
docker run -p 50001:50001 -v $(pwd)/storage:/app/storage mediacraft
```

### Docker Compose
```yaml
version: '3.8'

services:
  mediacraft:
    build: .
    ports:
      - "50001:50001"
    volumes:
      - ./storage:/app/storage
      - ./temp:/app/temp
    environment:
      - DEBUG=False
      - HOST=0.0.0.0
      - PORT=50001
    restart: unless-stopped
```

## 🔧 故障排除

### 常见问题

#### 1. FFmpeg 未找到
```bash
# 错误信息
FFmpeg not found

# 解决方案
# 确保 FFmpeg 已安装并在 PATH 中
which ffmpeg  # macOS/Linux
where ffmpeg  # Windows
```

#### 2. OpenCV 安装失败
```bash
# 错误信息
Failed building wheel for opencv-python

# 解决方案
# 安装系统依赖
sudo apt-get install python3-dev libopencv-dev  # Ubuntu
brew install opencv  # macOS

# 或使用预编译版本
pip install opencv-python-headless
```

#### 3. 端口被占用
```bash
# 错误信息
Address already in use

# 解决方案
# 查找占用端口的进程
lsof -i :50001  # macOS/Linux
netstat -ano | findstr :50001  # Windows

# 或更改端口
export PORT=50002
python app.py
```

#### 4. 权限问题
```bash
# 错误信息
Permission denied

# 解决方案
# 确保目录权限正确
chmod 755 temp storage
chown -R $USER:$USER temp storage
```

### 日志调试
```bash
# 启用详细日志
export DEBUG=True
python app.py

# 查看日志文件
tail -f storage/logs/*.log
```

## 📊 性能优化

### 系统优化
1. **增加内存**: 视频处理需要较多内存
2. **SSD 存储**: 提高文件 I/O 性能
3. **多核 CPU**: 并行处理能力

### 应用优化
1. **批处理大小**: 调整 `BATCH_SIZE` 参数
2. **临时目录**: 使用快速存储作为临时目录
3. **并发限制**: 根据硬件配置调整并发数

### 监控配置
```bash
# 系统资源监控
htop
iostat -x 1
df -h

# 应用日志监控
tail -f storage/logs/*.log
```

## 🔒 安全配置

### 基础安全
1. **防火墙配置**: 只开放必要端口
2. **文件权限**: 限制文件访问权限
3. **用户权限**: 使用非 root 用户运行

### 生产环境安全
1. **HTTPS 配置**: 使用 SSL/TLS 加密
2. **访问控制**: 配置访问限制
3. **日志审计**: 启用访问日志记录

## 📝 验证安装

### 功能测试
```bash
# 运行所有测试
python test_video_watermark.py
python test_video_merger.py
python test_upload_fix.py

# 健康检查
curl http://localhost:50001/api/health
```

### 性能测试
```bash
# 上传测试文件
curl -X POST -F "file=@test_video.mp4" \
  http://localhost:50001/api/video/upload

# 检查响应时间
time curl http://localhost:50001/api/health
```

## 🆘 获取帮助

### 文档资源
- [项目文档](../README.md)
- [API 参考](./API_REFERENCE.md)
- [故障排除](./TROUBLESHOOTING.md)

### 社区支持
- [GitHub Issues](https://github.com/yinghuzhu/mediacraft/issues)
- [讨论区](https://github.com/yinghuzhu/mediacraft/discussions)

### 联系方式
- 邮箱: support@mediacraft.com
- 文档: https://docs.mediacraft.com