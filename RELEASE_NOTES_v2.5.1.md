# MediaCraft v2.5.1 发布说明

## 🎉 版本亮点

MediaCraft v2.5.1 是一个重要的配置管理和部署优化版本，引入了完整的环境配置管理系统，支持开发和生产环境的灵活配置。

## 🆕 新功能

### 📋 环境配置管理系统
- **多环境支持**: 支持开发环境 (`.env.development`) 和生产环境 (`.env.production`) 配置
- **自动配置生成**: 安装时自动生成生产环境配置文件
- **安全密钥生成**: 自动生成安全的随机密钥
- **配置验证**: 提供配置验证脚本，确保配置正确性

### 🔧 增强的部署系统
- **可配置目录**: 支持自定义程序目录和数据目录
- **数据目录分离**: 程序文件和用户数据完全分离
- **模板化配置**: 系统服务和 Nginx 配置使用模板，根据实际路径动态生成
- **权限管理**: 生产环境配置文件自动设置安全权限

### 🚀 部署脚本优化
- **智能安装**: 安装脚本支持命令行参数，可自定义安装路径
- **安全升级**: 升级脚本保护用户数据，自动备份程序文件
- **生产环境启动**: 提供专门的生产环境启动脚本

## 📁 目录结构

### 默认配置
```
程序目录: /var/www/mediacraft
数据目录: /var/lib/mediacraft
```

### 自定义配置示例
```bash
# 企业环境
sudo ./install.sh -i /opt/mediacraft -d /data/mediacraft

# 多实例部署
sudo ./install.sh -i /opt/mediacraft-prod -d /data/mediacraft-prod
```

## 🔧 配置文件

### 开发环境 (.env.development)
```bash
FLASK_ENV=development
FLASK_DEBUG=1
DATA_DIR=./data
MAX_CONCURRENT_TASKS=2
LOG_LEVEL=DEBUG
```

### 生产环境 (.env.production)
```bash
FLASK_ENV=production
FLASK_DEBUG=0
DATA_DIR=/var/lib/mediacraft
MAX_CONCURRENT_TASKS=5
LOG_LEVEL=INFO
SESSION_COOKIE_SECURE=true
```

## 🚀 部署方式

### 新安装
```bash
# 默认目录
sudo ./install.sh

# 自定义目录
sudo ./install.sh -i /opt/mediacraft -d /data/mediacraft
```

### 升级现有安装
```bash
# 默认目录
sudo ./upgrade.sh

# 自定义目录
sudo ./upgrade.sh -i /opt/mediacraft -d /data/mediacraft
```

## 🔍 配置验证

```bash
# 验证当前配置
python scripts/validate_config.py
```

验证内容包括：
- 配置文件加载
- 目录创建状态
- 依赖安装情况
- 关键配置检查
- 安全设置验证

## 📊 技术改进

### 配置管理
- **EnvConfigLoader**: 新的环境配置加载器
- **EnhancedConfig**: 增强的配置类，支持多种数据类型
- **自动类型转换**: 支持字符串、整数、布尔值、列表等类型
- **配置缓存**: 提高配置访问性能

### 安全增强
- **安全密钥**: 自动生成 32 字节随机密钥
- **文件权限**: 生产环境配置文件权限设置为 600
- **Cookie 安全**: 生产环境启用所有 Cookie 安全选项
- **CORS 配置**: 可配置的跨域资源共享设置

### 部署优化
- **模板系统**: 使用占位符模板，部署时动态替换
- **路径验证**: 安装前验证目录权限和可用性
- **服务管理**: 改进的 systemd 服务配置
- **Nginx 优化**: 优化的反向代理配置

## 📦 发布包信息

- **版本**: MediaCraft v2.5.1
- **包大小**: 446KB
- **包位置**: `releases/mediacraft-2.5.1.tar.gz`
- **创建时间**: 2025年8月9日

### 包含内容
✅ **后端服务**
- Flask API 服务器
- 异步任务管理系统
- 视频处理引擎
- 环境配置管理系统

✅ **前端应用**
- Next.js 生产构建版本
- 响应式用户界面
- 多语言支持

✅ **部署工具**
- 可配置安装脚本
- 升级脚本
- 配置验证脚本
- 生产环境启动脚本

✅ **配置模板**
- 系统服务模板
- Nginx 配置模板
- 环境配置模板

✅ **完整文档**
- 配置管理指南
- 数据目录分离文档
- 部署说明文档

## 🔄 升级说明

### 从 v2.4.x 升级
1. 数据目录会自动迁移到新的分离架构
2. 配置文件会自动生成
3. 系统服务会更新为新的模板格式

### 从更早版本升级
建议先备份数据，然后进行全新安装：
```bash
# 备份数据
sudo cp -r /var/www/mediacraft/data /backup/mediacraft-data

# 全新安装
sudo ./install.sh
```

## 🛠️ 故障排除

### 配置问题
```bash
# 验证配置
python scripts/validate_config.py

# 检查权限
ls -la .env.production
```

### 服务问题
```bash
# 检查服务状态
systemctl status mediacraft-backend
systemctl status mediacraft-frontend

# 查看日志
journalctl -u mediacraft-backend -n 50
```

## 📞 技术支持

如遇到问题，请查看：
- [配置管理指南](docs/deployment/CONFIGURATION.md)
- [数据目录分离文档](docs/deployment/DATA_SEPARATION.md)
- [快速部署指南](docs/deployment/QUICK_DEPLOY.md)

---

MediaCraft v2.5.1 为生产环境部署提供了更强大、更灵活、更安全的配置管理系统！🎊