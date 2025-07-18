# MediaCraft 视频去水印功能

这是 MediaCraft 媒体处理平台的视频去水印功能，部署在 mediacraft.yzhu.name。**完全简化版本，无需数据库，开箱即用！**

## 功能特性

- 🎬 **多格式支持**: 支持 MP4, MOV, AVI, MKV 等主流视频格式
- 🖼️ **智能帧选择**: 用户可以选择包含水印的代表性帧
- 🎯 **精确区域选择**: 支持鼠标拖拽框选多个水印区域
- 🤖 **AI 驱动处理**: 使用 OpenCV 的图像修复算法去除水印
- 🔊 **音频保留**: 自动保留原始视频的音频轨道（需要 FFmpeg）
- 📊 **实时进度**: 显示处理进度和状态更新
- 💾 **便捷下载**: 处理完成后直接下载结果
- 🚀 **零配置**: 无需数据库，使用内存和文件存储

## 技术架构

### 后端技术栈
- **Flask**: Web 框架
- **OpenCV**: 视频处理和图像修复
- **NumPy**: 数值计算
- **内存存储**: 任务状态管理
- **文件存储**: 数据持久化
- **FFmpeg**: 音频处理（可选）

### 前端技术栈
- **HTML5 Canvas**: 区域选择交互
- **Bootstrap 5**: UI 框架
- **原生 JavaScript**: 前端逻辑

## 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 运行测试（可选）
```bash
python test_video_watermark.py
```

### 3. 启动应用
```bash
python start_video_watermark.py
```

### 4. 访问应用
打开浏览器访问: `http://localhost:50001/` 或 `https://mediacraft.yzhu.name/`

## 使用流程

### 第一步：上传视频
- 支持拖拽上传或点击选择文件
- 文件大小限制：500MB
- 支持格式：MP4, MOV, AVI, MKV

### 第二步：选择帧
- 系统自动提取视频的采样帧
- 用户选择一个清晰显示水印的帧
- 点击帧缩略图进行选择

### 第三步：框选水印区域
- 在选定的帧上拖拽鼠标框选水印
- 支持选择多个水印区域
- 可以删除或清除已选择的区域

### 第四步：处理和下载
- 系统开始后台处理视频
- 实时显示处理进度
- 处理完成后可直接下载结果

## API 接口

### 上传视频
```
POST /api/video/upload
Content-Type: multipart/form-data

参数:
- file: 视频文件

响应:
{
  "code": 10000,
  "message": "ok",
  "data": {
    "task_uuid": "uuid-string",
    "filename": "video.mp4",
    "file_size": 1048576,
    "duration": 30.5,
    "resolution": "1920x1080",
    "fps": 30.0
  }
}
```

### 获取视频帧
```
GET /api/video/task/{task_uuid}/frames?count=12

响应:
{
  "code": 10000,
  "data": {
    "task_uuid": "uuid-string",
    "frames": [
      {
        "frame_number": 0,
        "image_data": "data:image/jpeg;base64,..."
      }
    ]
  }
}
```

### 选择帧
```
POST /api/video/task/{task_uuid}/select-frame
Content-Type: application/json

{
  "frame_number": 150
}
```

### 提交水印区域
```
POST /api/video/task/{task_uuid}/select-regions
Content-Type: application/json

{
  "regions": [
    {
      "x": 100,
      "y": 50,
      "width": 200,
      "height": 100
    }
  ]
}
```

### 查询任务状态
```
GET /api/video/task/{task_uuid}/status

响应:
{
  "code": 10000,
  "data": {
    "task_uuid": "uuid-string",
    "status": "processing",
    "progress_percentage": 45,
    "error_message": null
  }
}
```

### 下载结果
```
GET /api/video/task/{task_uuid}/download
```

## 状态说明

- `uploaded`: 视频已上传
- `frame_selecting`: 正在选择帧
- `region_selecting`: 正在选择水印区域
- `processing`: 正在处理视频
- `completed`: 处理完成
- `failed`: 处理失败

## 错误码说明

- `10000`: 成功
- `20001-20021`: 各种业务错误（详见代码注释）

## 性能优化建议

### 生产环境优化
1. **使用 GPU 加速**: 部署到带 GPU 的服务器
2. **使用 Redis**: 替换内存存储，支持分布式
3. **使用 Celery**: 异步任务队列，提高并发性能
4. **使用 CDN**: 加速文件上传和下载
5. **使用专业 AI 模型**: 替换 OpenCV，提升去水印效果

### 算法升级
- **LaMa 模型**: 基于深度学习的图像修复
- **动态水印跟踪**: 支持运动水印的检测和去除
- **半透明水印处理**: 更复杂的水印类型支持

## 限制和注意事项

### 当前限制
- 文件大小限制：500MB
- 仅支持静态水印
- 使用基础的 OpenCV 算法
- 单线程处理

### 法律声明
- 用户需确保对处理的视频拥有合法使用权
- 禁止用于侵犯他人版权的行为
- 平台仅提供技术服务，不对用户行为负责

## 故障排除

### 常见问题

**Q: 上传失败**
A: 检查文件格式和大小限制，确保网络连接正常

**Q: 处理失败**
A: 检查视频文件是否损坏，查看错误日志

**Q: 音频丢失**
A: 确保系统安装了 FFmpeg

**Q: 数据库连接失败**
A: 检查数据库配置和连接参数，系统会自动降级到内存存储

### 日志查看
应用日志会输出到控制台，包含详细的处理信息和错误信息。

## 贡献和反馈

这是一个演示版本，欢迎提供反馈和建议。在商业化版本中，我们将添加更多高级功能和性能优化。

## 许可证

本项目仅用于演示目的，请勿用于商业用途。