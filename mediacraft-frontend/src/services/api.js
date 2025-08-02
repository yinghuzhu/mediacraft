import axios from 'axios';

// 在生产环境中使用相对路径，开发环境使用完整URL
const baseURL = process.env.NODE_ENV === 'production' 
  ? '' // 生产环境使用相对路径，通过Nginx代理
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50001');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 确保Cookie被发送
});

// 视频水印移除API
export const watermarkService = {
  uploadVideo: async (file, onProgress) => {
    try {
      // 直接创建水印去除任务，包含文件上传
      const formData = new FormData();
      formData.append('file', file);
      formData.append('task_type', 'watermark_removal');

      const response = await api.post('/api/tasks/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });

      if (response.data && response.data.task_id) {
        return {
          data: {
            task_id: response.data.task_id,
            task_uuid: response.data.task_id, // 兼容前端
            status: response.data.status,
            message: response.data.message
          }
        };
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (error) {
      throw error;
    }
  },

  getVideoFrames: (taskId, count = 12) => {
    // 调用后端API获取视频帧
    return api.get(`/api/tasks/${taskId}/frames`, {
      params: { count },
    });
  },

  selectFrame: (taskId, frameNumber) => {
    // 这个可以通过更新任务来实现
    return api.put(`/api/tasks/${taskId}`, {
      selected_frame: frameNumber,
    });
  },

  selectRegions: (taskId, regions) => {
    // 更新任务的区域信息并开始处理
    return api.put(`/api/tasks/${taskId}`, {
      regions: regions,
      action: 'start_processing'
    });
  },

  getTaskStatus: (taskId) => {
    return api.get(`/api/tasks/${taskId}/status`);
  },

  getDownloadUrl: (taskId) => {
    const downloadBaseURL = process.env.NODE_ENV === 'production' ? '' : baseURL;
    return `${downloadBaseURL}/api/tasks/${taskId}/download`;
  },
};

// 视频合并API
export const videoMergerService = {
  // 创建视频合并任务
  createTask: (taskName) => api.post('/api/tasks/create', {
    task_type: 'video_merge',
    task_name: taskName
  }),

  // 上传视频文件
  uploadVideo: (taskId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(`/api/tasks/${taskId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      } : undefined,
    });
  },

  // 获取任务状态
  getTaskStatus: (taskId) => api.get(`/api/tasks/${taskId}/status`),

  // 开始合并
  startMerge: (taskId, segments) => api.post(`/api/tasks/${taskId}/config`, {
    segments: segments,
    action: 'start_processing'
  }),

  // 下载结果
  downloadResult: (taskId) => api.get(`/api/tasks/${taskId}/download`, {
    responseType: 'blob'
  }),

  getDownloadUrl: (taskId) => {
    const downloadBaseURL = process.env.NODE_ENV === 'production' ? '' : baseURL;
    return `${downloadBaseURL}/api/tasks/${taskId}/download`;
  },
};

// 保持向后兼容的mergeService
export const mergeService = videoMergerService;

export default api;