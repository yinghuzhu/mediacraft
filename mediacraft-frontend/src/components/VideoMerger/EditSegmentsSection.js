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
          videos: videos.map(file => {
            const startTime = file.start_time || 0;
            const endTime = file.end_time || file.duration || 0;
            const segmentDuration = endTime - startTime;
            
            return {
              filename: file.filename,
              size: file.size,
              duration: file.duration || 0,
              resolution: file.resolution || 'Unknown',
              fps: file.fps || 0,
              has_audio: file.has_audio || false,
              start_time: startTime,
              end_time: endTime,
              segment_duration: segmentDuration
            };
          })
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
  
  const handleTimeUpdate = async (index) => {
    const startInput = document.getElementById(`start-time-${index}`);
    const endInput = document.getElementById(`end-time-${index}`);
    
    if (!startInput || !endInput) return;
    
    const startTime = parseFloat(startInput.value);
    const endTime = parseFloat(endInput.value);
    
    if (startTime >= endTime) {
      setError('Start time must be less than end time');
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${taskUuid}/segments/${index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 计算片段时长
        const segmentDuration = endTime - startTime;
        
        // 更新本地状态
        setTaskData(prev => ({
          ...prev,
          videos: prev.videos.map((video, i) => 
            i === index ? { 
              ...video, 
              start_time: startTime, 
              end_time: endTime,
              segment_duration: segmentDuration
            } : video
          )
        }));
      } else {
        setError(data.message || 'Failed to update segment time');
      }
    } catch (err) {
      console.error('Update segment time error:', err);
      setError('Failed to update segment time');
    }
  };
  
  const handleTimeReset = (index) => {
    const video = taskData.videos[index];
    const startInput = document.getElementById(`start-time-${index}`);
    const endInput = document.getElementById(`end-time-${index}`);
    
    if (startInput && endInput) {
      startInput.value = "0.0";
      endInput.value = (video.duration || 0).toFixed(1);
      
      // 自动更新
      handleTimeUpdate(index);
    }
  };
  
  const calculateTotalDuration = () => {
    if (!taskData || !taskData.videos) return 0;
    
    return taskData.videos.reduce((total, video) => {
      const segmentDuration = video.segment_duration || (video.end_time || video.duration || 0) - (video.start_time || 0);
      return total + segmentDuration;
    }, 0);
  };
  
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    return `${remainingSeconds}s`;
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
              <p className="font-medium">
                Total Duration: {formatDuration(calculateTotalDuration())}
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
        
        <div className="space-y-4">
          {taskData.videos.map((video, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center mb-3">
                <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <div className="flex-grow">
                  <h3 className="font-medium">{video.filename}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p>Size: {(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <p>Duration: {formatDuration(video.duration || 0)}</p>
                    </div>
                    <div>
                      <p>Resolution: {video.resolution || 'Unknown'}</p>
                      <p>Segment: {formatDuration((video.segment_duration || (video.end_time || video.duration || 0) - (video.start_time || 0)))}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time (s)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      defaultValue={(video.start_time || 0).toFixed(1)}
                      min="0"
                      max={(video.duration || 0) - 0.1}
                      step="0.1"
                      id={`start-time-${index}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time (s)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      defaultValue={(video.end_time || video.duration || 0).toFixed(1)}
                      min="0.1"
                      max={video.duration || 0}
                      step="0.1"
                      id={`end-time-${index}`}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-grow"
                    onClick={() => handleTimeUpdate(index)}
                  >
                    Update
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-grow"
                    onClick={() => handleTimeReset(index)}
                  >
                    Reset
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Segment: {(video.start_time || 0).toFixed(1)}s - {(video.end_time || video.duration || 0).toFixed(1)}s
                ({((video.end_time || video.duration || 0) - (video.start_time || 0)).toFixed(1)}s duration)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}