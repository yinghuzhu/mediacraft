# MediaCraft 文件组织结构

## 📁 文件重组说明

为了提高项目的可维护性和组织性，我们对 MediaCraft 项目的文件结构进行了系统化的重新组织。

## 🗂️ 新的文件结构

```
mediacraft/
├── 📁 docs/                               # 项目文档
│   ├── 📁 development/                    # 开发文档
│   ├── 📁 deployment/                     # 部署文档
│   ├── 📁 testing/                       # 测试文档
│   └── 📁 watermark_removal/             # 功能文档
├── 📁 scripts/                           # 脚本文件
│   ├── 📁 core/                          # 核心应用文件
│   │   ├── app.py                        # 主应用程序
│   │   └── config.py                     # 配置文件
│   ├── 📁 launchers/                     # 启动脚本
│   │   ├── start_video_merger.py         # 视频合并启动器
│   │   └── start_video_watermark.py      # 水印去除启动器
│   ├── 📁 deployment/                    # 部署脚本
│   │   ├── create_release.sh             # 创建发布版本
│   │   ├── install.sh                    # 安装脚本
│   │   └── nginx_mediacraft_fixed.conf   # Nginx配置
│   └── 📁 fixes/                         # 修复脚本
│       ├── fix_502_error.sh              # 502错误修复
│       ├── fix_audio_issue.sh            # 音频问题修复
│       └── fix_opencv_dependencies.sh    # OpenCV依赖修复
├── 📁 models/                            # 数据模型
├── 📁 processors/                        # 视频处理器
├── 📁 static/                            # 前端文件
├── 📁 tests/                             # 测试文件
├── 📁 storage/                           # 数据存储
├── 📁 temp/                              # 临时文件
├── app.py -> scripts/core/app.py         # 主应用（符号链接）
├── config.py -> scripts/core/config.py   # 配置文件（符号链接）
├── start_video_merger.py -> scripts/launchers/start_video_merger.py
├── start_video_watermark.py -> scripts/launchers/start_video_watermark.py
├── test_upload_fix.py                    # 上传修复测试
├── test_video_merger.py                  # 视频合并测试
├── README.md                             # 项目说明
├── DOCUMENTATION_INDEX.md               # 文档索引
└── requirements.txt                      # Python依赖
```

## 🔄 文件重组原则

### 1. 按功能分类
- **核心文件**: 主要的应用程序文件
- **启动脚本**: 各功能模块的启动器
- **部署脚本**: 安装、配置、发布相关脚本
- **修复脚本**: 问题修复和维护脚本
- **测试文件**: 单元测试和集成测试

### 2. 保持兼容性
- 使用符号链接保持根目录的关键文件可访问
- 确保现有的启动命令仍然有效
- 维护文档和脚本中的路径引用

### 3. 提高可维护性
- 清晰的目录结构便于查找和维护
- 相关文件集中管理
- 减少根目录的文件数量

## 📋 文件分类详解

### 核心应用文件 (`scripts/core/`)
- **app.py**: Flask 主应用程序，包含所有 API 路由
- **config.py**: 应用配置文件，环境变量和设置

### 启动脚本 (`scripts/launchers/`)
- **start_video_merger.py**: 视频合并功能专用启动器
- **start_video_watermark.py**: 水印去除功能专用启动器

### 部署脚本 (`scripts/deployment/`)
- **create_release.sh**: 自动化发布脚本
- **install.sh**: 系统安装脚本
- **nginx_mediacraft_fixed.conf**: Nginx 服务器配置

### 修复脚本 (`scripts/fixes/`)
- **fix_502_error.sh**: 修复 502 网关错误
- **fix_audio_issue.sh**: 修复音频处理问题
- **fix_opencv_dependencies.sh**: 修复 OpenCV 依赖问题

### 测试文件 (根目录)
- **test_upload_fix.py**: 上传功能修复测试
- **test_video_merger.py**: 视频合并功能测试
- **test_video_watermark.py**: 水印去除功能测试

## 🔗 符号链接说明

为了保持向后兼容性，我们在根目录创建了符号链接：

```bash
# 核心文件链接
app.py -> scripts/core/app.py
config.py -> scripts/core/config.py

# 启动脚本链接
start_video_merger.py -> scripts/launchers/start_video_merger.py
start_video_watermark.py -> scripts/launchers/start_video_watermark.py
```

这样用户仍然可以使用熟悉的命令：
```bash
python app.py                    # 启动主应用
python start_video_merger.py     # 启动视频合并功能
python start_video_watermark.py  # 启动水印去除功能
```

## 📊 重组效果

### 优势
1. **结构清晰**: 文件按功能和用途分类组织
2. **易于维护**: 相关文件集中管理，便于查找和修改
3. **减少混乱**: 根目录文件数量大幅减少
4. **保持兼容**: 现有使用方式不受影响

### 统计数据
- **根目录文件减少**: 从 15+ 个减少到 8 个核心文件
- **脚本文件整理**: 10+ 个脚本文件按类型分类
- **文档文件整理**: 15+ 个文档文件系统化组织
- **符号链接**: 4 个关键文件的兼容性链接

## 🚀 使用指南

### 开发者
```bash
# 编辑核心应用
vim scripts/core/app.py

# 修改配置
vim scripts/core/config.py

# 运行测试
python test_video_merger.py
```

### 部署人员
```bash
# 运行安装脚本
bash scripts/deployment/install.sh

# 创建发布版本
bash scripts/deployment/create_release.sh

# 配置 Nginx
cp scripts/deployment/nginx_mediacraft_fixed.conf /etc/nginx/sites-available/
```

### 维护人员
```bash
# 修复常见问题
bash scripts/fixes/fix_opencv_dependencies.sh
bash scripts/fixes/fix_audio_issue.sh
bash scripts/fixes/fix_502_error.sh
```

## 🔧 迁移指南

如果您有现有的脚本或文档引用了旧的文件路径，请按以下方式更新：

### 路径更新对照表
```bash
# 旧路径 -> 新路径
app.py -> scripts/core/app.py (或使用符号链接)
config.py -> scripts/core/config.py (或使用符号链接)
start_*.py -> scripts/launchers/start_*.py (或使用符号链接)
*.sh -> scripts/deployment/*.sh 或 scripts/fixes/*.sh
```

### 导入语句更新
如果您的代码中有相对导入，可能需要更新：
```python
# 如果从 scripts/core/ 目录运行
from models.task import VideoWatermarkTask  # 改为
from ...models.task import VideoWatermarkTask
```

## 📝 维护建议

1. **新文件放置**
   - 核心应用代码: `scripts/core/`
   - 启动脚本: `scripts/launchers/`
   - 部署脚本: `scripts/deployment/`
   - 修复脚本: `scripts/fixes/`
   - 测试文件: 根目录或 `tests/`

2. **符号链接维护**
   - 定期检查符号链接的有效性
   - 添加新的核心文件时考虑是否需要符号链接
   - 更新文档中的路径引用

3. **文档同步**
   - 文件移动后及时更新相关文档
   - 保持安装和使用指南的准确性
   - 更新 README 中的项目结构说明

---

**重组完成日期**: 2025年1月21日  
**影响范围**: 项目文件结构  
**兼容性**: 完全向后兼容