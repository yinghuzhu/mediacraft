# MediaCraft 生产环境启动指南

## 🚀 快速启动

### 1. 测试模块导入
在启动应用之前，先测试所有模块是否能正确导入：

```bash
cd /path/to/mediacraft
source venv/bin/activate
python test_imports.py
```

如果看到 "✓ 所有模块导入测试通过！"，说明环境配置正确。

### 2. 验证配置
```bash
cd /path/to/mediacraft
source venv/bin/activate
python scripts/validate_config.py
```

### 3. 启动应用
```bash
cd /path/to/mediacraft
source venv/bin/activate

# 设置生产环境
export FLASK_ENV=production

# 启动应用
python app.py
```

## 🔧 常见问题排除

### 问题1: ModuleNotFoundError: No module named 'core'

**症状**:
```
Traceback (most recent call last):
  File "app.py", line 11, in <module>
    from core.env_config import get_config
ModuleNotFoundError: No module named 'core'
```

**解决方案**:
1. 确保在正确的目录中运行：
   ```bash
   cd /path/to/mediacraft
   pwd  # 应该显示包含 app.py 的目录
   ```

2. 检查目录结构：
   ```bash
   ls -la
   # 应该看到 core/ 目录
   ```

3. 测试模块导入：
   ```bash
   python test_imports.py
   ```

### 问题2: 配置文件不存在

**症状**:
```
WARNING: Environment file .env.production not found, using defaults
```

**解决方案**:
1. 检查配置文件是否存在：
   ```bash
   ls -la .env.production
   ```

2. 如果不存在，创建配置文件：
   ```bash
   cp scripts/deployment/.env.production.template .env.production
   # 编辑配置文件，设置正确的路径和密钥
   ```

3. 设置正确的权限：
   ```bash
   chmod 600 .env.production
   chown www-data:www-data .env.production
   ```

### 问题3: 权限问题

**症状**:
```
PermissionError: [Errno 13] Permission denied: '/var/lib/mediacraft'
```

**解决方案**:
```bash
# 修复目录权限
sudo chown -R www-data:www-data /var/lib/mediacraft
sudo chown -R www-data:www-data /var/www/mediacraft
sudo chmod -R 755 /var/lib/mediacraft
sudo chmod -R 755 /var/www/mediacraft
```

### 问题4: 端口被占用

**症状**:
```
OSError: [Errno 98] Address already in use
```

**解决方案**:
1. 检查端口占用：
   ```bash
   sudo netstat -tlnp | grep :50001
   sudo lsof -i :50001
   ```

2. 停止占用端口的进程：
   ```bash
   sudo kill -9 <PID>
   ```

3. 或者修改端口配置：
   ```bash
   # 编辑 .env.production
   PORT=50002
   ```

## 📋 系统服务管理

### 使用 systemd 服务

1. **启动服务**:
   ```bash
   sudo systemctl start mediacraft-backend
   sudo systemctl start mediacraft-frontend
   ```

2. **检查状态**:
   ```bash
   sudo systemctl status mediacraft-backend
   sudo systemctl status mediacraft-frontend
   ```

3. **查看日志**:
   ```bash
   sudo journalctl -u mediacraft-backend -f
   sudo journalctl -u mediacraft-frontend -f
   ```

4. **重启服务**:
   ```bash
   sudo systemctl restart mediacraft-backend
   sudo systemctl restart mediacraft-frontend
   ```

### 手动启动（调试用）

```bash
cd /var/www/mediacraft
source venv/bin/activate

# 后端
export FLASK_ENV=production
python app.py

# 前端（新终端）
cd /var/www/mediacraft/frontend
npm start
```

## 🔍 健康检查

### 检查服务是否正常运行

```bash
# 检查后端
curl -I http://localhost:50001/health

# 检查前端
curl -I http://localhost:3000

# 检查完整应用
curl -I http://your-domain.com/api/health
```

### 检查系统资源

```bash
# 内存使用
free -h

# 磁盘使用
df -h

# 进程状态
ps aux | grep -E "(python|node)"

# 网络连接
ss -tuln | grep -E ":(80|443|3000|50001)"
```

## 📝 日志分析

### 应用日志位置
- 系统日志: `journalctl -u mediacraft-backend`
- 应用日志: `/var/lib/mediacraft/logs/app.log`
- Nginx 日志: `/var/log/nginx/mediacraft_*.log`

### 常用日志命令
```bash
# 实时查看应用日志
tail -f /var/lib/mediacraft/logs/app.log

# 查看错误日志
grep -i error /var/lib/mediacraft/logs/app.log

# 查看最近的系统日志
sudo journalctl -u mediacraft-backend -n 50

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/mediacraft_error.log
```

## 🛠️ 性能优化

### 调整并发设置
编辑 `.env.production`:
```bash
# 根据服务器性能调整
MAX_CONCURRENT_TASKS=5
MAX_QUEUE_SIZE=100
```

### 内存优化
```bash
# 检查内存使用
ps aux --sort=-%mem | head -10

# 如果内存不足，添加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📞 获取帮助

如果遇到其他问题：

1. **运行诊断脚本**:
   ```bash
   python test_imports.py
   python scripts/validate_config.py
   ```

2. **收集系统信息**:
   ```bash
   # 系统信息
   uname -a
   python --version
   node --version
   
   # 服务状态
   systemctl status mediacraft-*
   
   # 日志摘要
   journalctl -u mediacraft-backend -n 20
   ```

3. **检查配置**:
   ```bash
   # 显示当前配置（隐藏敏感信息）
   grep -v SECRET .env.production
   ```

这个指南应该能帮助解决大部分生产环境的启动问题。