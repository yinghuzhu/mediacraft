# MediaCraft 文档索引

## 📚 文档结构总览

MediaCraft 项目的所有文档已经按照功能和用途进行了系统化的组织和分类。

## 🗂️ 文档目录结构

```
docs/
├── 📄 README.md                           # 文档总览
├── 📁 development/                        # 开发文档
│   ├── PROJECT_STRUCTURE.md               # 项目结构说明
│   ├── API_REFERENCE.md                   # API 参考文档
│   ├── UPLOAD_FIX_NOTES.md               # 上传修复说明
│   └── VIDEO_MERGER_COMPLETION.md         # 视频合并完成报告
├── 📁 deployment/                         # 部署文档
│   └── INSTALLATION.md                    # 安装指南
├── 📁 testing/                           # 测试文档
│   └── TEST_GUIDE.md                     # 测试指南
├── 📁 watermark_removal/                 # 水印去除功能文档
│   ├── README.md                         # 功能概述
│   └── erd_design_doc.md                 # 数据库设计文档
└── 📁 video_merger/                      # 视频合并功能文档
    └── (已迁移到 development/)
```

## 📖 文档分类说明

### 🎯 核心文档
- **[README.md](./README.md)** - 项目主要说明文档
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - 本文档索引

### 🛠️ 开发相关文档
位于 `docs/development/` 目录：

1. **[项目结构说明](./docs/development/PROJECT_STRUCTURE.md)**
   - 目录结构详解
   - 架构设计说明
   - 核心组件介绍
   - 数据流说明

2. **[API 参考文档](./docs/development/API_REFERENCE.md)**
   - 完整的 API 接口文档
   - 请求/响应格式说明
   - 错误码参考
   - 使用示例

3. **[文件组织结构](./docs/development/FILE_ORGANIZATION.md)**
   - 文件重组说明
   - 新的目录结构
   - 符号链接说明
   - 迁移指南

4. **[上传修复说明](./docs/development/UPLOAD_FIX_NOTES.md)**
   - 上传错误问题分析
   - 修复方案详解
   - 测试验证方法

5. **[视频合并完成报告](./docs/development/VIDEO_MERGER_COMPLETION.md)**
   - 功能开发完成情况
   - 技术实现亮点
   - 测试验证结果

### 🚀 部署相关文档
位于 `docs/deployment/` 目录：

1. **[安装指南](./docs/deployment/INSTALLATION.md)**
   - 系统要求说明
   - 详细安装步骤
   - 配置选项说明
   - 故障排除指南

### 🧪 测试相关文档
位于 `docs/testing/` 目录：

1. **[测试指南](./docs/testing/TEST_GUIDE.md)**
   - 测试环境设置
   - 测试用例说明
   - 性能测试方法
   - 持续集成配置

### 🎬 功能文档
按功能模块分类：

#### 水印去除功能 (`docs/watermark_removal/`)
- **[功能概述](./docs/watermark_removal/README.md)** - 水印去除功能说明
- **[数据库设计](./docs/watermark_removal/erd_design_doc.md)** - 数据模型设计

#### 视频合并功能
相关文档已迁移到开发文档中，包含在完成报告内。

## 🔍 规格文档
位于 `.kiro/specs/` 目录（Kiro IDE 专用）：

- **[视频合并需求](./kiro/specs/video-merger/requirements.md)** - 功能需求文档
- **[视频合并设计](./kiro/specs/video-merger/design.md)** - 设计文档
- **[视频合并任务](./kiro/specs/video-merger/tasks.md)** - 开发任务列表

## 📋 测试文件
项目根目录的测试文件：

- **test_video_watermark.py** - 水印去除功能测试
- **test_video_merger.py** - 视频合并功能测试
- **test_upload_fix.py** - 上传修复测试

## 🚀 启动脚本
项目根目录的启动脚本：

- **start_video_watermark.py** - 水印去除功能启动脚本
- **start_video_merger.py** - 视频合并功能启动脚本
- **app.py** - 主应用程序

## 📝 文档使用指南

### 🆕 新用户快速开始
1. 阅读 [项目主页](./README.md) 了解项目概述
2. 按照 [安装指南](./docs/deployment/INSTALLATION.md) 设置环境
3. 运行测试验证安装：`python test_video_watermark.py`
4. 启动应用：`python app.py`

### 👨‍💻 开发者指南
1. 查看 [项目结构](./docs/development/PROJECT_STRUCTURE.md) 了解架构
2. 参考 [API 文档](./docs/development/API_REFERENCE.md) 进行开发
3. 阅读 [测试指南](./docs/testing/TEST_GUIDE.md) 编写测试
4. 查看完成报告了解最新功能状态

### 🔧 运维人员指南
1. 参考 [安装指南](./docs/deployment/INSTALLATION.md) 进行部署
2. 配置监控和日志系统
3. 定期运行测试验证系统状态

## 🔄 文档维护

### 文档更新原则
- **及时性**: 代码变更时同步更新文档
- **准确性**: 确保文档内容与实际实现一致
- **完整性**: 覆盖所有重要功能和配置
- **可读性**: 使用清晰的语言和格式

### 文档贡献指南
1. 遵循现有的文档结构和格式
2. 使用 Markdown 格式编写
3. 添加适当的图表和示例
4. 提交前检查链接和格式

## 🔗 相关链接

### 项目资源
- **GitHub 仓库**: https://github.com/yinghuzhu/mediacraft
- **在线演示**: https://mediacraft.yzhu.name
- **API 文档**: http://localhost:50001/api/health

### 技术文档
- **Flask 文档**: https://flask.palletsprojects.com/
- **OpenCV 文档**: https://docs.opencv.org/
- **FFmpeg 文档**: https://ffmpeg.org/documentation.html

## 📞 支持与反馈

如果您在使用文档过程中遇到问题或有改进建议，请：

1. 提交 GitHub Issue
2. 发送邮件至项目维护者
3. 在项目讨论区留言

---

**最后更新**: 2025年1月21日  
**文档版本**: v1.0  
**维护者**: MediaCraft 开发团队