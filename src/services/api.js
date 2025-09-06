import axios from 'axios';

// API基础URL配置 - 使用后端API域名
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50001';
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 确保Cookie被发送
});

// 会话初始化标志
let sessionInitialized = false;

// 初始化会话的函数
const initializeSession = async () => {
  if (sessionInitialized) return;
  
  try {
    const response = await api.get('/api/session/init', {
      timeout: 5000, // 5秒超时
    });
    sessionInitialized = true;
    console.log('Session initialized successfully');
  } catch (error) {
    console.log('Session initialization failed (this is normal if backend is not running):', error.message);
    // 不要抛出错误，让应用继续运行
  }
};

// 请求拦截器：确保每个请求前都有有效会话
api.interceptors.request.use(async (config) => {
  // 只在任务相关的API上初始化会话，避免用户认证API的干扰
  if (config.url && 
      (config.url.includes('/tasks/') || config.url.includes('/files/')) &&
      !config.url.includes('/session/init')) {
    try {
      await initializeSession();
    } catch (error) {
      // 忽略会话初始化错误，让请求继续
      console.log('Session init skipped:', error.message);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 响应拦截器：处理会话过期
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 避免无限重试
    if (error.config && error.config.__isRetryRequest) {
      return Promise.reject(error);
    }
    
    // 对于用户认证相关的401错误，不进行重试，直接返回错误
    if (error.response?.status === 401 && 
        (error.config.url?.includes('/user/profile') || 
         error.config.url?.includes('/user/login') ||
         error.config.url?.includes('/user/logout'))) {
      return Promise.reject(error);
    }
    
    // 只对任务相关的401/403错误进行会话重试
    if ((error.response?.status === 403 || error.response?.status === 401) && 
        (error.config.url?.includes('/tasks/') || error.config.url?.includes('/files/')) &&
        !error.config.url?.includes('/tasks/submit') && 
        !error.config.headers?.['Content-Type']?.includes('multipart/form-data')) {
      
      // 会话可能过期，重新初始化
      sessionInitialized = false;
      
      try {
        await initializeSession();
        // 标记为重试请求
        error.config.__isRetryRequest = true;
        // 重试原请求
        return api.request(error.config);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// 认证服务API
export const authService = {
  register: (username, password, email = '') => {
    return api.post('/api/user/register', {
      username,
      password,
      email
    });
  },

  login: (username, password) => {
    return api.post('/api/user/login', {
      username,
      password
    });
  },

  logout: () => {
    return api.post('/api/user/logout');
  },

  getProfile: () => {
    return api.get('/api/user/profile');
  },

  getStats: () => {
    return api.get('/api/user/stats');
  },

  getUserTasks: () => {
    return api.get('/api/user/tasks');
  }
};

// 通用任务服务API
export const taskService = {
  // 获取任务状态
  getTaskStatus: (taskId) => {
    return api.get(`/api/tasks/${taskId}/status`);
  },

  // 获取任务详情
  getTaskDetail: (taskId) => {
    return api.get(`/api/tasks/${taskId}/status`);
  },

  // 取消任务
  cancelTask: (taskId) => {
    return api.delete(`/api/tasks/${taskId}`);
  },

  // 更新任务片段时间
  updateSegment: (taskId, segmentIndex, startTime, endTime) => {
    return api.put(`/api/tasks/${taskId}/segments/${segmentIndex}`, {
      start_time: startTime,
      end_time: endTime
    });
  },

  // 获取下载链接
  getDownloadUrl: (taskId) => {
    return `${baseURL}/api/tasks/${taskId}/download`;
  }
};

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
    return `${baseURL}/api/tasks/${taskId}/download`;
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

  // 更新视频片段时间
  updateSegment: (taskId, segmentIndex, startTime, endTime) => {
    return api.put(`/api/tasks/${taskId}/segments/${segmentIndex}`, {
      start_time: startTime,
      end_time: endTime
    });
  },

  getDownloadUrl: (taskId) => {
    return `${baseURL}/api/tasks/${taskId}/download`;
  },
};

// 保持向后兼容的mergeService
export const mergeService = videoMergerService;

export default api;