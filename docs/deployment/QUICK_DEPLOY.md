# MediaCraft 快速部署指南

## 🚀 一键部署 (推荐)

### 使用内置安装脚本（默认目录）
```bash
# 1. 创建发布包
./scripts/deployment/create_release.sh

# 2. 上传到服务器
scp releases/mediacraft-2.4.0.tar.gz user@your-server:/tmp/

# 3. 在服务器上安装
ssh user@your-server
tar -xzf /tmp/mediacraft-2.4.0.tar.gz
cd mediacraft-2.4.0
sudo ./install.sh
```

### 使用自定义目录
```bash
# 1. 解压发布包
tar -xzf mediacraft-2.4.0.tar.gz
cd mediacraft-2.4.0

# 2. 运行安装脚本（自定义目录）
sudo ./install.sh -i /opt/mediacraft -d /data/mediacraft
```

## 📋 手工部署 (5步完成)

### 第1步：准备环境
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm ffmpeg nginx

# CentOS/RHEL
sudo dnf install -y python3 python3-pip nodejs npm ffmpeg nginx
```

### 第2步：创建用户和目录
```bash
sudo useradd -r -s /bin/bash -d /var/www/mediacraft mediacraft
sudo mkdir -p /var/www/mediacraft
sudo chown mediacraft:mediacraft /var/www/mediacraft
```

### 第3步：部署应用
```bash
# 解压并复制文件
tar -xzf mediacraft-2.2.1.tar.gz
sudo cp -r mediacraft-2.2.1/* /var/www/mediacraft/
sudo chown -R mediacraft:mediacraft /var/www/mediacraft

# 安装后端依赖
sudo -u mediacraft bash -c "
cd /var/www/mediacraft
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
"

# 安装前端依赖
sudo -u mediacraft bash -c "
cd /var/www/mediacraft/frontend
npm install --production
"
```

### 第4步：配置服务
```bash
# 复制服务文件
sudo cp /var/www/mediacraft/mediacraft-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mediacraft-backend mediacraft-frontend

# 配置 Nginx
sudo cp /var/www/mediacraft/nginx_mediacraft.conf /etc/nginx/sites-available/mediacraft
sudo ln -sf /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 第5步：启动服务
```bash
# 启动应用服务
sudo systemctl start mediacraft-backend
sudo systemctl start mediacraft-frontend

# 重新加载 Nginx
sudo nginx -t && sudo systemctl reload nginx

# 检查状态
sudo systemctl status mediacraft-backend
sudo systemctl status mediacraft-frontend
```

## ✅ 验证部署

### 检查服务状态
```bash
# 检查端口监听
sudo netstat -tlnp | grep -E ':(80|3000|50001)'

# 健康检查
curl http://localhost/api/health
curl http://localhost/
```

### 查看日志
```bash
# 应用日志
sudo journalctl -u mediacraft-backend -f
sudo journalctl -u mediacraft-frontend -f

# Nginx 日志
sudo tail -f /var/log/nginx/mediacraft_*.log
```

## 🔧 常用管理命令

### 服务管理
```bash
# 重启服务
sudo systemctl restart mediacraft-backend
sudo systemctl restart mediacraft-frontend

# 停止服务
sudo systemctl stop mediacraft-backend
sudo systemctl stop mediacraft-frontend

# 查看服务状态
sudo systemctl status mediacraft-*
```

### 更新部署
```bash
# 停止服务
sudo systemctl stop mediacraft-backend mediacraft-frontend

# 备份当前版本
sudo cp -r /var/www/mediacraft /backup/mediacraft-$(date +%Y%m%d)

# 部署新版本 (重复第3步)
# ...

# 启动服务
sudo systemctl start mediacraft-backend mediacraft-frontend
```

### 清理维护
```bash
# 清理临时文件
sudo -u mediacraft find /var/www/mediacraft/temp -type f -mtime +1 -delete

# 查看磁盘使用
df -h /var/www/mediacraft
du -sh /var/www/mediacraft/storage/*

# 日志轮转
sudo logrotate -f /etc/logrotate.d/mediacraft
```

## 🛠️ 故障排除

### 服务启动失败
```bash
# 查看详细错误
sudo journalctl -u mediacraft-backend -n 50
sudo journalctl -u mediacraft-frontend -n 50

# 检查配置
sudo nginx -t
python3 -m py_compile /var/www/mediacraft/app.py
```

### 权限问题
```bash
# 修复权限
sudo chown -R mediacraft:mediacraft /var/www/mediacraft
sudo chmod -R 755 /var/www/mediacraft
sudo chmod -R 777 /var/www/mediacraft/storage
sudo chmod -R 777 /var/www/mediacraft/temp
```

### 端口冲突
```bash
# 检查端口占用
sudo lsof -i :3000
sudo lsof -i :50001

# 修改端口 (编辑服务文件)
sudo systemctl edit mediacraft-backend
sudo systemctl edit mediacraft-frontend
```

## 📞 获取帮助

如果遇到问题，请查看：
- [详细部署指南](./MANUAL_DEPLOYMENT.md)
- [安装指南](./INSTALLATION.md)
- [故障排除](./TROUBLESHOOTING.md)

或联系技术支持。