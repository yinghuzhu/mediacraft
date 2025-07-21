# MediaCraft API 参考文档

## 📋 概述

MediaCraft 提供 RESTful API 接口，支持视频水印去除和视频合并两大核心功能。

## 🔗 基础信息

- **Base URL**: `http://localhost:50001`
- **Content-Type**: `application/json`
- **响应格式**: JSON

## 📤 统一响应格式

```json
{
  "code": 10000,
  "message": "ok",
  "data": {
    // 具体数据内容
  }
}
```

### 响应码说明
- `10000`: 成功
- `2xxxx`: 水印去除相关错误
- `3xxxx`: 视频合并相关错误

## 🎯 水印去除 API

### 1. 上传视频
```http
POST /api/video/upload
Content-Type: multipart/form-data
```

**请求参数**:
- `file`: 视频文件 (最大 500MB)

**响应示例**:
```json
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

### 2. 获取视频帧
```http
GET /api/video/task/{task_uuid}/frames?count=12
```

**响应示例**:
```json
{
  "code": 10000,
  "message": "ok",
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

### 3. 选择帧
```http
POST /api/video/task/{task_uuid}/select-frame
Content-Type: application/json
```

**请求体**:
```json
{
  "frame_number": 100
}
```

### 4. 提交水印区域
```http
POST /api/video/task/{task_uuid}/select-regions
Content-Type: application/json
```

**请求体**:
```json
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

### 5. 查询任务状态
```http
GET /api/video/task/{task_uuid}/status
```

**响应示例**:
```json
{
  "code": 10000,
  "message": "ok",
  "data": {
    "task_uuid": "uuid-string",
    "status": "processing",
    "progress_percentage": 75,
    "error_message": null,
    "created_at": "2025-01-21T10:00:00",
    "completed_at": null
  }
}
```

### 6. 下载处理结果
```http
GET /api/video/task/{task_uuid}/download
```

## 🎬 视频合并 API

### 1. 创建合并任务
```http
POST /api/video/merge/create
Content-Type: application/json
```

**请求体**:
```json
{
  "task_name": "我的视频合并",
  "merge_mode": "concat",
  "audio_handling": "keep_all",
  "quality_preset": "medium"
}
```

**响应示例**:
```json
{
  "code": 10000,
  "message": "ok",
  "data": {
    "task_uuid": "uuid-string",
    "task_name": "我的视频合并",
    "created_at": "2025-01-21T10:00:00"
  }
}
```

### 2. 获取任务详情
```http
GET /api/video/merge/task/{task_uuid}
```

**响应示例**:
```json
{
  "code": 10000,
  "message": "ok",
  "data": {
    "task_uuid": "uuid-string",
    "task_name": "我的视频合并",
    "status": "created",
    "total_videos": 3,
    "total_duration": 120.5,
    "items": [
      {
        "item_id": "item-uuid",
        "original_filename": "video1.mp4",
        "video_duration": 30.0,
        "start_time": 0.0,
        "end_time": 25.0,
        "segment_duration": 25.0,
        "item_order": 1
      }
    ]
  }
}
```

### 3. 删除任务
```http
DELETE /api/video/merge/task/{task_uuid}
```

### 4. 上传合并视频
```http
POST /api/video/merge/upload
Content-Type: multipart/form-data
```

**请求参数**:
- `task_uuid`: 任务ID
- `file`: 视频文件

**响应示例**:
```json
{
  "code": 10000,
  "message": "ok",
  "data": {
    "task_uuid": "uuid-string",
    "item_id": "item-uuid",
    "original_filename": "video.mp4",
    "file_size": 1048576,
    "video_duration": 30.5,
    "video_resolution": "1920x1080",
    "fps": 30.0,
    "item_order": 1,
    "start_time": 0.0,
    "end_time": 30.5,
    "segment_duration": 30.5
  }
}
```

### 5. 更新视频项
```http
PUT /api/video/merge/task/{task_uuid}/items/{item_id}
Content-Type: application/json
```

**请求体**:
```json
{
  "start_time": 5.0,
  "end_time": 25.0
}
```

### 6. 删除视频项
```http
DELETE /api/video/merge/task/{task_uuid}/items/{item_id}
```

### 7. 调整视频顺序
```http
POST /api/video/merge/task/{task_uuid}/reorder
Content-Type: application/json
```

**请求体**:
```json
{
  "item_order": ["item-uuid-1", "item-uuid-2", "item-uuid-3"]
}
```

### 8. 开始合并处理
```http
POST /api/video/merge/task/{task_uuid}/start
```

### 9. 查询合并状态
```http
GET /api/video/merge/task/{task_uuid}/status
```

**响应示例**:
```json
{
  "code": 10000,
  "message": "ok",
  "data": {
    "task_uuid": "uuid-string",
    "task_name": "我的视频合并",
    "status": "processing",
    "progress_percentage": 60,
    "error_message": null,
    "total_videos": 3,
    "total_duration": 120.5,
    "created_at": "2025-01-21T10:00:00",
    "started_at": "2025-01-21T10:05:00",
    "completed_at": null
  }
}
```

### 10. 下载合并结果
```http
GET /api/video/merge/task/{task_uuid}/download
```

## 🔧 错误处理

### 常见错误码

#### 水印去除错误 (2xxxx)
- `20001`: 上传中未找到文件
- `20002`: 未选择文件
- `20003`: 不支持的视频格式
- `20004`: 文件大小超出限制
- `20007`: 任务未找到
- `20008`: 原始视频文件未找到

#### 视频合并错误 (3xxxx)
- `30001`: 缺少请求数据
- `30004`: 合并任务未找到
- `30008`: 缺少 task_uuid 参数
- `30013`: 视频数量达到上限 (10个)
- `30027`: 没有要合并的视频
- `30031`: 合并任务尚未完成

### 错误响应示例
```json
{
  "code": 20003,
  "message": "Unsupported video format. Please upload MP4, MOV, AVI, or MKV files",
  "data": null
}
```

## 📝 使用示例

### JavaScript 示例

```javascript
// 创建合并任务
const createTask = async () => {
  const response = await fetch('/api/video/merge/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_name: '我的视频合并',
      merge_mode: 'concat',
      audio_handling: 'keep_all',
      quality_preset: 'medium'
    })
  });
  
  const result = await response.json();
  if (result.code === 10000) {
    console.log('任务创建成功:', result.data.task_uuid);
  }
};

// 上传视频
const uploadVideo = async (taskUuid, file) => {
  const formData = new FormData();
  formData.append('task_uuid', taskUuid);
  formData.append('file', file);
  
  const response = await fetch('/api/video/merge/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
};
```

### Python 示例

```python
import requests

# 创建合并任务
def create_merge_task():
    url = 'http://localhost:50001/api/video/merge/create'
    data = {
        'task_name': '我的视频合并',
        'merge_mode': 'concat',
        'audio_handling': 'keep_all',
        'quality_preset': 'medium'
    }
    
    response = requests.post(url, json=data)
    result = response.json()
    
    if result['code'] == 10000:
        return result['data']['task_uuid']
    else:
        raise Exception(result['message'])

# 上传视频
def upload_video(task_uuid, file_path):
    url = 'http://localhost:50001/api/video/merge/upload'
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'task_uuid': task_uuid}
        
        response = requests.post(url, files=files, data=data)
        return response.json()
```

## 🔒 安全注意事项

1. **文件上传限制**
   - 最大文件大小: 500MB
   - 支持格式: MP4, MOV, AVI, MKV
   - 最大文件数量: 10个 (合并任务)

2. **任务管理**
   - 任务自动过期清理
   - 临时文件自动删除
   - 任务状态验证

3. **错误处理**
   - 详细的错误信息
   - 安全的错误响应
   - 请求参数验证

## 📊 性能考虑

1. **并发处理**
   - 异步任务处理
   - 后台线程执行
   - 状态轮询机制

2. **资源管理**
   - 内存使用优化
   - 临时文件清理
   - 处理超时控制

3. **缓存策略**
   - 任务状态缓存
   - 视频信息缓存
   - 静态资源缓存