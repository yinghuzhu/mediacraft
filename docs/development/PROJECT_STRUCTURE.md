# MediaCraft 项目结构

## 📁 目录结构

```
mediacraft/
├── 🔧 Backend (Flask API)
│   ├── 📁 api/                     # API 路由模块
│   │   ├── tasks.py                # 统一任务管理API
│   │   ├── user.py                 # 用户相关API
│   │   └── __init__.py             # API蓝图初始化
│   ├── 📁 core/                    # 核心业务逻辑
│   │   ├── storage.py              # 存储管理
│   │   ├── task_queue.py           # 任务队列管理
│   │   └── user_manager.py         # 用户管理
│   ├── 📁 processors/              # 视频处理器
│   │   ├── video_processor.py      # 水印去除处理器
│   │   ├── video_merger.py         # 视频合并处理器（稳定版）
│   │   └── merger.py               # 视频合并处理器（当前版）
│   ├── 📁 models/                  # 数据模型
│   │   ├── task.py                 # 任务模型
│   │   ├── merge_task.py           # 合并任务模型
│   │   └── storage.py              # 存储模型
│   ├── app.py                      # 主Flask应用
│   └── config.py                   # 配置文件
├── 🎨 Frontend (Next.js)
│   └── 📁 mediacraft-frontend/
│       ├── 📁 src/
│       │   ├── 📁 components/      # React组件
│       │   │   ├── 📁 Tasks/       # 任务相关组件
│       │   │   ├── 📁 VideoMerger/ # 视频合并组件
│       │   │   ├── 📁 WatermarkRemover/ # 水印去除组件
│       │   │   └── 📁 UI/          # 通用UI组件
│       │   ├── 📁 pages/           # Next.js页面
│       │   │   ├── index.js        # 首页
│       │   │   ├── tasks.js        # 任务列表
│       │   │   ├── tasks/[id].js   # 任务详情
│       │   │   ├── watermark-remover.js # 水印去除
│       │   │   └── video-merger.js # 视频合并
│       │   ├── 📁 services/        # API服务
│       │   │   └── api.js          # API客户端
│       │   └── 📁 styles/          # 样式文件
│       ├── 📁 public/
│       │   └── 📁 locales/         # 国际化文件
│       └── package.json            # 依赖配置
├── 📝 Documentation
│   ├── 📁 docs/                    # 项目文档
│   │   ├── 📁 development/         # 开发文档
│   │   ├── 📁 deployment/          # 部署文档
│   │   ├── 📁 testing/             # 测试文档
│   │   ├── 📁 watermark_removal/   # 水印去除文档
│   │   └── FEATURES_UPDATE.md      # 功能更新说明
│   ├── README.md                   # 项目主文档
│   └── DOCUMENTATION_INDEX.md      # 文档索引
├── 🧪 Testing
│   ├── test_video_watermark.py     # 水印去除测试
│   ├── test_video_merger.py        # 视频合并测试
│   └── test_upload_fix.py          # 上传功能测试
├── 🚀 Deployment
│   └── 📁 scripts/
│       ├── 📁 deployment/          # 部署脚本
│       ├── 📁 launchers/           # 启动脚本
│       └── start.py                # 主启动脚本
├── 📦 Storage (Auto-created)
│   └── 📁 scripts/core/data/
│       ├── 📁 uploads/             # 用户上传文件
│       ├── 📁 results/             # 处理结果
│       ├── 📁 tasks/               # 任务数据
│       └── 📁 logs/                # 系统日志
└── 🔗 Compatibility Links
    ├── app.py -> scripts/core/app.py
    ├── config.py -> scripts/core/config.py
    └── requirements.txt            # Python依赖
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