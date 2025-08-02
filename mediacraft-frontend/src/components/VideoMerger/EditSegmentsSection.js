import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { videoMergerService } from '../../services/api';

export default function EditSegmentsSection({ taskUuid, onStartMerge }) {
  const { t } = useTranslation('common');
  const [taskData, setTaskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchTaskData();
  }, [taskUuid]);
  
  const fetchTaskData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await videoMergerService.getTaskStatus(taskUuid);
      
      console.log('Task status response:', response);
      
      if (response.data && response.data.success) {
        const task = response.data.data;
        
        // 构造视频列表数据
        const videos = task.config?.files || [];
        
        setTaskData({
          taskId: taskUuid,
          videos: videos.map(file => ({
            filename: file.filename,
            size: file.size
          }))
        });
      } else {
        setError(response.data?.message || t('common.error'));
      }
    } catch (err) {
      console.error('Fetch task data error:', err);
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartMerge = async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      // 创建简单的片段数据 - 现在先使用整个视频文件
      const segments = taskData.videos ? taskData.videos.map((video, index) => ({
        filename: video.filename,
        startTime: 0,
        endTime: null, // 使用整个视频
        order: index
      })) : [];
      
      console.log('Starting merge with segments:', segments);
      
      const response = await videoMergerService.startMerge(taskData.taskId, segments);
      
      console.log('Start merge response:', response);
      
      // 检查响应格式：后端返回 {success: true, data: {...}}
      if (response.data && response.data.success) {
        // 显示成功提示
        setSuccess(true);
        setError(null);
        
        // 调用回调，主页面会处理跳转
        if (onStartMerge) {
          onStartMerge();
        }
      } else {
        console.error('Start merge failed:', response);
        setError(response.data?.message || t('videoMerger.errors.startMergeFailed'));
      }
    } catch (err) {
      console.error('Start merge error:', err);
      setError(err.message || t('videoMerger.errors.startMergeFailed'));
    } finally {
      setIsStarting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Edit Video Segments</h2>
        </div>
        <div className="card-body text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!taskData || !taskData.videos || taskData.videos.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Edit Video Segments</h2>
        </div>
        <div className="card-body text-center py-12">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
          <p className="text-gray-600 mb-4">No videos have been uploaded yet.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Edit Video Segments</h2>
      </div>
      <div className="card-body">
        {error && (
          <Alert 
            type="danger" 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}
        
        {success && (
          <Alert 
            type="success" 
            message="Merge task submitted successfully!" 
            onClose={() => setSuccess(false)} 
          />
        )}
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <p className="font-medium">
                Total Videos: {taskData.videos.length}
              </p>
              <p className="text-sm text-gray-600">
                Videos will be merged in the order shown below
              </p>
            </div>
            <Button
              onClick={handleStartMerge}
              loading={isStarting}
              disabled={isStarting || taskData.videos.length === 0}
              size="lg"
            >
              Start Merging
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          {taskData.videos.map((video, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{video.filename}</h3>
                    <p className="text-sm text-gray-500">
                      {(video.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Full video will be used
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}