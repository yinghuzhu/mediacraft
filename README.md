# MediaCraft Frontend

MediaCraft 视频处理平台的前端应用，基于 Next.js 构建的现代化 Web 界面。

## 功能特性

- 🎬 视频合并界面
- 🖼️ 水印去除工具
- 📊 实时任务状态监控
- 👥 用户管理系统
- 🌐 国际化支持 (中文/英文)
- 📱 响应式设计

## 技术栈

- **框架**: Next.js 13+
- **样式**: Tailwind CSS
- **国际化**: next-i18next
- **状态管理**: React Hooks
- **HTTP客户端**: Axios
- **部署**: Vercel

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 环境配置

创建环境配置文件：

```bash
cp .env.production .env.local
```

编辑 `.env.local` 配置后端API地址：

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
npm run build
npm start
# 或
yarn build
yarn start
```

## 部署到 Vercel

### 自动部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署完成

### 环境变量配置

在 Vercel 项目设置中添加：

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### 手动部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 项目结构

```
├── public/             # 静态资源
│   └── locales/       # 国际化文件
├── src/
│   ├── components/    # React 组件
│   │   ├── Layout/   # 布局组件
│   │   ├── Tasks/    # 任务相关组件
│   │   ├── UI/       # 通用UI组件
│   │   ├── VideoMerger/      # 视频合并组件
│   │   └── WatermarkRemover/ # 水印去除组件
│   ├── pages/        # Next.js 页面
│   ├── services/     # API 服务
│   └── styles/       # 样式文件
├── next.config.js    # Next.js 配置
├── tailwind.config.js # Tailwind 配置
└── package.json      # 项目依赖
```

## 主要页面

- `/` - 首页
- `/video-merger` - 视频合并工具
- `/watermark-remover` - 水印去除工具
- `/tasks` - 任务列表
- `/tasks/[id]` - 任务详情

## API 集成

前端通过 `src/services/api.js` 与后端 API 通信：

```javascript
// 视频合并
await api.post('/video/merge', formData);

// 获取任务状态
await api.get(`/tasks/${taskId}`);

// 下载结果
window.open(`${API_URL}/tasks/${taskId}/download`);
```

## 国际化

支持中文和英文，配置文件位于 `public/locales/`：

- `public/locales/zh/common.json` - 中文
- `public/locales/en/common.json` - 英文

## 开发指南

### 添加新页面

1. 在 `src/pages/` 创建新文件
2. 使用 Layout 组件包装
3. 添加国际化文本

### 添加新组件

1. 在 `src/components/` 对应目录创建组件
2. 使用 Tailwind CSS 样式
3. 添加 PropTypes 类型检查

### API 调用

使用 `src/services/api.js` 中的封装方法：

```javascript
import api from '../services/api';

const response = await api.post('/endpoint', data);
```

## 许可证

MIT License