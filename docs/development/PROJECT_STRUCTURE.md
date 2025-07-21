# MediaCraft 项目结构

## 📁 目录结构

```
mediacraft/
├── 📁 app/                         # 应用程序包（已弃用）
├── 📁 docs/                        # 项目文档
│   ├── 📁 development/             # 开发文档
│   ├── 📁 deployment/              # 部署文档
│   ├── 📁 testing/                 # 测试文档
│   ├── 📁 watermark_removal/       # 水印去除功能文档
│   └── 📁 video_merger/            # 视频合并功能文档
├── 📁 models/                      # 数据模型
│   ├── task.py                     # 水印去除任务模型
│   ├── merge_task.py               # 视频合并任务模型
│   ├── merge_video_item.py         # 合并视频项模型
│   └── storage.py                  # 存储管理
├── 📁 processors/                  # 视频处理器
│   ├── video_processor.py          # 水印去除处理器
│   └── video_merger.py             # 视频合并处理器
├── 📁 static/                      # 前端静态文件
│   ├── index.html                  # 水印去除界面
│   └── video-merger.html           # 视频合并界面
├── 📁 storage/                     # 数据存储（自动创建）
│   ├── 📁 tasks/                   # 水印去除任务
│   ├── 📁 regions/                 # 水印区域数据
│   ├── 📁 merge_tasks/             # 视频合并任务
│   ├── 📁 logs/                    # 处理日志
│   └── 📁 merge_logs/              # 合并日志
├── 📁 temp/                        # 临时文件（自动创建）
├── 📁 tests/                       # 测试文件
├── 📁 scripts/                     # 脚本文件
├── 📁 releases/                    # 发布版本
├── 📁 .kiro/                       # Kiro IDE 配置
│   └── 📁 specs/                   # 功能规格文档
│       └── 📁 video-merger/        # 视频合并规格
├── app.py                          # 主应用程序
├── config.py                       # 配置文件
├── requirements.txt                # Python 依赖
├── start_video_watermark.py        # 水印去除启动脚本
├── start_video_merger.py           # 视频合并启动脚本
├── test_video_watermark.py         # 水印去除测试
├── test_video_merger.py            # 视频合并测试
├── test_upload_fix.py              # 上传修复测试
└── README.md                       # 项目说明
```

## 🏗️ 架构设计

### MVC 架构模式

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     View        │    │   Controller    │    │     Model       │
│  (Frontend)     │◄──►│   (Flask App)   │◄──►│  (Data Layer)   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • index.html    │    │ • app.py        │    │ • models/       │
│ • video-merger  │    │ • API Routes    │    │ • storage.py    │
│   .html         │    │ • Request       │    │ • Database      │
│ • JavaScript    │    │   Handling      │    │   Operations    │
│ • CSS Styles    │    │ • Response      │    │                 │
│                 │    │   Formatting    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据流

```
用户请求 → Flask路由 → 业务逻辑 → 数据模型 → 存储层
    ↑                                              ↓
响应数据 ← JSON格式 ← 处理结果 ← 视频处理 ← 数据检索
```

## 🔧 核心组件

### 1. Web 框架层
- **Flask**: Web 应用框架
- **路由管理**: RESTful API 设计
- **请求处理**: 文件上传、JSON 数据处理
- **响应格式**: 统一的 JSON 响应格式

### 2. 业务逻辑层
- **VideoProcessor**: 水印去除处理器
- **VideoMerger**: 视频合并处理器
- **任务管理**: 异步任务处理和状态跟踪

### 3. 数据模型层
- **Task Models**: 任务数据模型
- **Storage**: 文件和数据存储管理
- **序列化**: JSON 序列化和反序列化

### 4. 视频处理层
- **OpenCV**: 图像和视频处理
- **FFmpeg**: 专业视频编码和合并
- **算法**: 水印去除算法和视频处理算法

## 🔄 请求生命周期

### 水印去除流程
```
1. 上传视频 → 2. 提取帧 → 3. 选择帧 → 4. 标记区域 → 5. 处理视频 → 6. 下载结果
```

### 视频合并流程
```
1. 创建任务 → 2. 上传视频 → 3. 编辑片段 → 4. 排序视频 → 5. 合并处理 → 6. 下载结果
```

## 📦 依赖管理

### Python 依赖
- **Flask**: Web 框架
- **OpenCV**: 计算机视觉库
- **NumPy**: 数值计算库
- **Werkzeug**: WSGI 工具库

### 前端依赖
- **Bootstrap 5**: UI 框架
- **SortableJS**: 拖拽排序库
- **Bootstrap Icons**: 图标库

## 🔒 安全考虑

### 文件上传安全
- 文件类型验证
- 文件大小限制
- 安全文件名处理
- 临时文件管理

### 数据安全
- 任务隔离
- 自动清理机制
- 错误信息过滤

## 🚀 性能优化

### 后端优化
- 异步任务处理
- 批量帧处理
- 内存管理
- 文件流处理

### 前端优化
- 响应式设计
- 懒加载
- 进度反馈
- 错误处理

## 🔧 扩展性设计

### 模块化架构
- 独立的处理器模块
- 可插拔的存储后端
- 灵活的配置系统

### API 设计
- RESTful 接口
- 版本控制支持
- 标准化响应格式
- 完整的错误码体系