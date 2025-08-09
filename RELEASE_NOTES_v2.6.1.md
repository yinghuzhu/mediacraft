# MediaCraft v2.6.1 发布说明 (紧急修复)

## 🚨 紧急修复版本

### 📋 版本信息
- **版本号**: 2.6.1
- **发布日期**: 2025-08-09
- **类型**: 紧急修复 (Hotfix)
- **修复版本**: v2.6.0

### 🐛 修复的问题

#### 配置加载错误
- **问题**: 生产环境配置验证失败，`'EnhancedConfig' object has no attribute 'LOG_LEVEL'`
- **原因**: 配置属性初始化顺序错误，生产环境优化在属性定义之前执行
- **修复**: 调整配置初始化顺序，确保所有属性在使用前已定义

#### 具体修复
```python
# 修复前 (错误)
self.TASK_TIMEOUT_SECONDS = self.env_loader.get_int('TASK_TIMEOUT_SECONDS', 1800)
if self.IS_PRODUCTION:
    self._setup_production_optimizations()  # LOG_LEVEL 还未定义

# 修复后 (正确)
self.ENABLE_DEBUG_TOOLBAR = self.env_loader.get_bool('ENABLE_DEBUG_TOOLBAR', False)
if self.IS_PRODUCTION:
    self._setup_production_optimizations()  # 所有属性已定义
```

### 🚀 部署说明

#### 从 v2.6.0 升级
如果你已经部署了 v2.6.0 并遇到配置错误，请立即升级到 v2.6.1：

```bash
# 下载修复版本
wget mediacraft-2.6.1.tar.gz

# 解压
tar -xzf mediacraft-2.6.1.tar.gz

# 停止服务
pkill -f "python3 app.py"

# 备份数据
cp -r mediacraft/data mediacraft-2.6.1/

# 替换代码
mv mediacraft mediacraft-2.6.0-backup
mv mediacraft-2.6.1 mediacraft

# 重启服务
cd mediacraft
source venv/bin/activate
nohup python3 app.py > app.log 2>&1 &
```

#### 验证修复
```bash
# 测试配置加载
python3 scripts/validate_config.py

# 应该看到: ✓ 配置验证通过
```

### 📊 影响范围
- **影响版本**: v2.6.0
- **影响环境**: 生产环境 (FLASK_ENV=production)
- **症状**: 服务启动失败，配置验证报错

### 🔒 兼容性
- ✅ 完全向后兼容 v2.6.0
- ✅ 数据格式无变化
- ✅ API 接口无变化

### 📞 紧急支持
如果在修复过程中遇到问题：
1. 检查环境变量 `FLASK_ENV` 设置
2. 确认所有依赖已正确安装
3. 查看应用日志获取详细错误信息

---

**抱歉给您带来的不便，这个紧急修复确保了生产环境的稳定运行。**