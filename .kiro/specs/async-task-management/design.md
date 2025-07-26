# MediaCraft 异步任务管理系统设计文档

## 1. 需求理解

### 1.1 核心问题
- 当前系统为同步处理，用户需要在浏览器中等待耗时的视频处理操作
- 用户关闭浏览器后无法继续访问之前的任务
- 缺乏用户身份识别和任务持久化机制

### 1.2 设计目标
- **异步任务处理**：用户提交任务后可以关闭浏览器，任务在后台继续处理
- **渐进式用户管理**：Demo阶段基于Cookie，商业化可扩展为完整用户系统
- **任务持久化**：用户重新打开浏览器能看到历史任务和处理结果
- **可扩展存储**：Demo使用文件系统，设计支持平滑迁移到数据库
- **商业化就绪**：架构设计考虑用户管理、计费、权限等商业化需求

## 2. 架构设计

### 2.1 整体架构
```
用户浏览器
    ↓ Cookie (user_id)
前端 (Next.js)
    ↓ 新增任务管理页面 + 原有处理页面
后端 API
    ├── /api/video/* (原有视频处理API)
    ├── /api/tasks/* (新增任务管理API)
    └── /api/user/* (新增用户管理API)
异步任务队列
    ↓ 后台处理
视频处理器
    ↓ 生成结果文件
文件存储系统
    ├── 用户数据 (JSON)
    ├── 任务数据 (JSON)
    ├── 上传文件
    └── 结果文件
```

### 2.2 设计原则
1. **Cookie用户识别**：首次访问生成UUID存储在Cookie中
2. **任务异步化**：所有耗时操作转为后台任务
3. **状态持久化**：任务状态和用户数据存储在文件系统
4. **API扩展**：在原有API基础上新增任务管理接口
5. **前端增强**：新增任务列表页面，保持原有处理流程

## 3. 详细设计

### 3.1 用户身份管理

#### 3.1.1 Cookie用户识别
```
GET / (任何页面首次访问)
├── 检查Cookie中的user_id
├── 如果不存在：生成UUID并设置Cookie
├── 如果存在：验证user_id有效性
└── 创建或更新用户会话记录
```

#### 3.1.2 用户数据结构（简化且可扩展）
```json
{
  "user_id": "uuid-string",
  "created_at": "2025-01-25T10:00:00Z",
  "last_accessed": "2025-01-25T15:30:00Z",
  "tasks": ["task-uuid-1", "task-uuid-2"],
  "metadata": {
    // 预留扩展空间，商业化时可添加：
    // "email": null,
    // "subscription_plan": "free",
    // "usage_limits": {},
    // "billing_info": {}
  }
}
```

### 3.2 异步任务管理

#### 3.2.1 任务提交流程
```
用户操作 → 检查并发限制 → 创建任务记录 → 返回任务ID → 后台异步处理
```

**并发控制策略：**
- 单用户最大并发任务数：1（可配置）
- 系统总最大并发任务数：5（可配置）
- 超出用户限制：提示"请等待当前任务完成"
- 超出系统限制：提示"系统繁忙，请稍后重试"

#### 3.2.2 任务状态流转
```
created → uploaded → processing → completed/failed
```

#### 3.2.3 任务数据结构（简化且可扩展）
```json
{
  "task_id": "uuid-string",
  "user_id": "user-uuid",
  "task_type": "watermark_removal|video_merge",
  "status": "created|uploaded|processing|completed|failed",
  "progress": 0-100,
  "created_at": "2025-01-25T10:00:00Z",
  "started_at": "2025-01-25T10:01:00Z",
  "completed_at": "2025-01-25T10:05:00Z",
  "original_filename": "video.mp4",
  "file_size": 1048576,
  "input_file_path": "/data/uploads/user-id/task-id/input.mp4",
  "output_file_path": "/data/results/user-id/task-id/output.mp4",
  "error_message": null,
  "config": {
    "selected_frame": 100,
    "regions": [[10, 10, 50, 50]]
  },
  "metadata": {
    // 预留扩展空间，商业化时可添加：
    // "priority": "normal",
    // "estimated_cost": 0.0,
    // "billing_status": "free",
    // "resource_usage": {}
  }
}
```

### 3.3 API接口设计

#### 3.3.1 统一响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2025-01-25T10:00:00Z",
    "version": "v1",
    "request_id": "uuid"
  }
}
```

#### 3.3.2 用户管理API
```
GET /api/user/info
└── 返回当前用户信息和任务统计

GET /api/user/tasks
└── 返回用户的所有任务列表
```

#### 3.3.3 任务管理API
```
POST /api/tasks/create
├── 创建新任务（水印去除或视频合并）
└── 返回任务ID

POST /api/tasks/{task_id}/upload
├── 上传文件到指定任务
└── 更新任务状态为uploaded

POST /api/tasks/{task_id}/config
├── 设置任务配置（帧选择、区域选择等）
└── 启动后台处理

GET /api/tasks/{task_id}/status
├── 查询任务状态和进度
└── 返回实时状态信息

GET /api/tasks/{task_id}/download
├── 下载任务结果文件
└── 验证用户权限后返回文件
```

#### 3.3.4 兼容性API
保持原有的 `/api/video/*` 接口，内部调用新的任务管理系统。

### 3.4 后端架构设计

#### 3.4.1 模块结构
```
app.py (主应用)
├── middleware/
│   └── user_middleware.py (用户识别中间件)
├── api/
│   ├── user.py (用户管理API)
│   ├── tasks.py (任务管理API)
│   └── video.py (兼容性视频API)
├── core/
│   ├── user_manager.py (用户管理器)
│   ├── task_manager.py (任务管理器)
│   ├── task_queue.py (异步任务队列)
│   └── storage/
│       ├── storage_interface.py (存储抽象接口)
│       ├── file_storage.py (文件存储实现)
│       └── database_storage.py (数据库存储实现-未来)
├── processors/
│   ├── watermark_processor.py (水印处理器)
│   └── video_merger.py (视频合并器)
├── models/
│   ├── user.py (用户模型)
│   └── task.py (任务模型)
└── utils/
    ├── file_utils.py (文件工具)
    └── uuid_utils.py (UUID工具)
```

#### 3.4.2 任务处理流程
```
1. 用户访问 → 中间件识别用户 → 设置user_id
2. 任务创建 → 生成任务记录 → 关联用户ID
3. 文件上传 → 保存到用户目录 → 更新任务状态
4. 配置提交 → 启动后台处理 → 返回处理中状态
5. 后台处理 → 实时更新进度 → 生成结果文件
6. 用户查询 → 返回任务状态 → 提供下载链接
```

### 3.5 存储系统设计

#### 3.5.1 存储抽象层
```python
from abc import ABC, abstractmethod

class StorageInterface(ABC):
    """存储抽象接口 - 支持从文件系统平滑迁移到数据库"""
    
    @abstractmethod
    def get_user(self, user_id): pass
    
    @abstractmethod
    def save_user(self, user_id, user_data): pass
    
    @abstractmethod
    def get_task(self, task_id): pass
    
    @abstractmethod
    def save_task(self, task_id, task_data): pass
    
    @abstractmethod
    def query_user_tasks(self, user_id): pass

# Demo阶段实现
class FileStorage(StorageInterface):
    def __init__(self, data_dir):
        self.data_dir = data_dir
    
    def get_user(self, user_id):
        # JSON文件实现
        pass

# 商业化阶段实现（未来）
class DatabaseStorage(StorageInterface):
    def __init__(self, db_connection):
        self.db = db_connection
    
    def get_user(self, user_id):
        # 数据库实现
        pass
```

#### 3.5.2 文件存储实现（Demo阶段）
```
data/
├── users/
│   └── {user_id}.json (用户数据)
├── tasks/
│   └── {task_id}.json (任务数据)
├── uploads/
│   └── {user_id}/
│       └── {task_id}/
│           └── input.mp4 (上传文件)
└── results/
    └── {user_id}/
        └── {task_id}/
            └── output.mp4 (结果文件)
```

#### 3.5.3 数据持久化策略
- **用户数据**：每次访问时更新last_accessed
- **任务数据**：状态变更时立即保存
- **文件管理**：按用户和任务分目录存储
- **清理策略**：定期清理过期任务和文件
- **扩展支持**：通过StorageInterface支持未来数据库迁移

### 3.6 前端设计

#### 3.6.1 新增页面
- **任务列表页面** (`/tasks`)：显示用户所有任务，支持多语言
- **任务详情页面** (`/tasks/{task_id}`)：显示任务详细信息和进度，支持多语言

#### 3.6.2 现有页面增强
- **水印去除页面**：任务提交后跳转到任务列表
- **视频合并页面**：任务提交后跳转到任务列表
- **导航栏**：添加"我的"主菜单，下设"任务列表"子菜单（为商业化预留扩展空间）

#### 3.6.3 用户体验流程
```
用户访问 → 自动获得身份 → 查看历史任务
创建任务 → 上传文件 → 配置参数 → 提交处理
任务提交 → 跳转任务列表 → 查看进度 → 下载结果
关闭浏览器 → 重新打开 → 继续查看任务状态
```

## 4. 实施计划

### 4.1 第一阶段：基础设施
1. 创建会话管理系统
2. 创建异步任务队列系统
3. 创建数据存储系统

### 4.2 第二阶段：API适配层
1. 创建 `/api/video/*` 路由
2. 实现原有的响应格式
3. 内部集成异步任务系统

### 4.3 第三阶段：处理器集成
1. 将现有处理器包装为异步任务
2. 添加进度回调机制
3. 实现错误处理和重试

### 4.4 第四阶段：测试和优化
1. 端到端功能测试
2. 性能优化
3. 错误处理完善

## 5. 关键技术决策

### 5.1 保持同步API外观
- 对前端来说，API仍然是同步的
- 异步处理在后端内部进行
- 通过轮询获取处理状态

### 5.2 渐进式处理
- 快速操作（如帧提取）保持同步
- 耗时操作（如视频处理）使用异步
- 根据操作类型选择处理方式

### 5.3 错误处理策略
- 保持原有的错误码系统
- 异步任务错误通过状态查询返回
- 提供详细的错误信息和恢复建议

## 6. 风险评估

### 6.1 兼容性风险
- **风险**：API变更可能影响前端功能
- **缓解**：严格保持原有API格式和行为

### 6.2 性能风险
- **风险**：异步系统可能增加响应延迟
- **缓解**：快速操作保持同步，只对耗时操作异步化

### 6.3 复杂性风险
- **风险**：系统复杂度增加，维护困难
- **缓解**：清晰的模块分离，完善的文档和测试

## 7. 成功标准

### 7.1 功能标准
- [ ] 所有原有功能正常工作
- [ ] 用户体验与原版本一致
- [ ] 支持并发用户和任务

### 7.2 性能标准
- [ ] API响应时间 < 2秒
- [ ] 任务处理不阻塞其他操作
- [ ] 支持至少10个并发任务

### 7.3 稳定性标准
- [ ] 24小时连续运行无崩溃
- [ ] 任务失败有明确错误信息
- [ ] 系统重启后任务状态可恢复

## 8. 技术实现细节

### 8.1 会话管理实现
- 使用Cookie存储session_id
- 基于JSON文件的会话持久化
- 自动过期清理机制

### 8.2 异步任务队列实现
- 基于Python内置queue的轻量级实现
- ThreadPoolExecutor处理并发任务
- 任务状态实时更新机制

### 8.3 数据存储实现
- JSON文件存储任务和会话数据
- 线程安全的文件读写操作
- 自动备份和恢复机制

### 8.4 API兼容层实现
- 保持原有的路由结构
- 统一的响应格式包装
- 错误码映射和处理

---

**设计文档版本**: v1.0  
**创建时间**: 2025年1月25日  
**最后更新**: 2025年1月25日  
**状态**: 待审核