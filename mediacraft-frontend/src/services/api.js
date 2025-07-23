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
});

// 视频水印移除API
export const watermarkService = {
  uploadVideo: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/api/video/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },

  getVideoFrames: (taskUuid, count = 12) => {
    return api.get(`/api/video/task/${taskUuid}/frames`, {
      params: { count },
    });
  },

  selectFrame: (taskUuid, frameNumber) => {
    return api.post(`/api/video/task/${taskUuid}/select-frame`, {
      frame_number: frameNumber,
    });
  },

  selectRegions: (taskUuid, regions) => {
    return api.post(`/api/video/task/${taskUuid}/select-regions`, {
      regions,
    });
  },

  getTaskStatus: (taskUuid) => {
    return api.get(`/api/video/task/${taskUuid}/status`);
  },

  getDownloadUrl: (taskUuid) => {
    const downloadBaseURL = process.env.NODE_ENV === 'production' ? '' : baseURL;
    return `${downloadBaseURL}/api/video/task/${taskUuid}/download`;
  },
};

// 视频合并API
export const mergeService = {
  createTask: (taskName, options = {}) => {
    return api.post('/api/video/merge/create', {
      task_name: taskName,
      ...options,
    });
  },

  uploadVideo: (taskUuid, file, onProgress) => {
    const formData = new FormData();
    formData.append('task_uuid', taskUuid);
    formData.append('file', file);

    return api.post('/api/video/merge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },

  getTask: (taskUuid) => {
    return api.get(`/api/video/merge/task/${taskUuid}`);
  },

  updateItem: (taskUuid, itemId, data) => {
    return api.put(`/api/video/merge/task/${taskUuid}/items/${itemId}`, data);
  },

  deleteItem: (taskUuid, itemId) => {
    return api.delete(`/api/video/merge/task/${taskUuid}/items/${itemId}`);
  },

  reorderItems: (taskUuid, itemOrder) => {
    return api.post(`/api/video/merge/task/${taskUuid}/reorder`, {
      item_order: itemOrder,
    });
  },

  startMerge: (taskUuid) => {
    return api.post(`/api/video/merge/task/${taskUuid}/start`);
  },

  getTaskStatus: (taskUuid) => {
    return api.get(`/api/video/merge/task/${taskUuid}/status`);
  },

  getDownloadUrl: (taskUuid) => {
    const downloadBaseURL = process.env.NODE_ENV === 'production' ? '' : baseURL;
    return `${downloadBaseURL}/api/video/merge/task/${taskUuid}/download`;
  },
};

export default api;