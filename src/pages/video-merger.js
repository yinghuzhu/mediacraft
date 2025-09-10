import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout/Layout';
import withAuth from '../components/Auth/withAuth';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import { videoMergerService } from '../services/api';

function VideoMerger() {
  const { t } = useTranslation('common');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [taskResult, setTaskResult] = useState(null);
  const [videoSegments, setVideoSegments] = useState([]);
  const [showSegmentEditor, setShowSegmentEditor] = useState(false);
  
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  const maxFileSize = 500 * 1024 * 1024; // 500MB
  const maxFiles = 10;
  
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndSetFiles(selectedFiles);
  };
  
  const validateAndSetFiles = (selectedFiles) => {
    setError(null);
    
    if (!selectedFiles.length) return;
    
    if (selectedFiles.length < 2) {
      setError(t('videoMerger.validation.minFiles'));
      return;
    }
    
    if (selectedFiles.length > maxFiles) {
      setError(t('videoMerger.validation.maxFiles', { maxFiles }));
      return;
    }
    
    const validFiles = [];
    const errors = [];
    
    selectedFiles.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: ${t('videoMerger.errors.unsupportedFormat')}`);
        return;
      }
      
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: ${t('videoMerger.errors.fileTooLarge')}`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setFiles(validFiles);
    initializeVideoSegments(validFiles);
  };
  
  const initializeVideoSegments = (fileList) => {
    const segments = fileList.map((file, index) => ({
      id: `segment-${index}-${Date.now()}`,
      filename: file.name,
      size: file.size,
      file: file,
      startTime: 0,
      endTime: null, // Will be set when video metadata is loaded
      duration: null,
      segmentDuration: null
    }));
    setVideoSegments(segments);
    setShowSegmentEditor(true);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };
  
  // 时间段管理函数
  const handleTimeUpdate = (segmentId, startTime, endTime) => {
    if (startTime >= endTime) {
      setError('开始时间必须小于结束时间');
      return;
    }
    
    setVideoSegments(prev => prev.map(segment => 
      segment.id === segmentId 
        ? { 
            ...segment, 
            startTime: startTime, 
            endTime: endTime,
            segmentDuration: endTime - startTime
          } 
        : segment
    ));
    setError(null);
  };
  
  const handleTimeReset = (segmentId) => {
    setVideoSegments(prev => prev.map(segment => 
      segment.id === segmentId 
        ? { 
            ...segment, 
            startTime: 0, 
            endTime: segment.duration || 0,
            segmentDuration: segment.duration || 0
          } 
        : segment
    ));
  };
  
  const loadVideoMetadata = (file, segmentId) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        setVideoSegments(prev => prev.map(segment => 
          segment.id === segmentId 
            ? { 
                ...segment, 
                duration: duration,
                endTime: duration,
                segmentDuration: duration
              } 
            : segment
        ));
        resolve(duration);
      };
      
      video.onerror = () => {
        console.warn(`无法加载视频元数据: ${file.name}`);
        resolve(0);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };
  
  useEffect(() => {
    if (videoSegments.length > 0) {
      videoSegments.forEach(segment => {
        if (segment.duration === null) {
          loadVideoMetadata(segment.file, segment.id);
        }
      });
    }
  }, [videoSegments]);
  
  const calculateTotalDuration = () => {
    return videoSegments.reduce((total, segment) => {
      return total + (segment.segmentDuration || 0);
    }, 0);
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0.0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    return `${remainingSeconds}s`;
  };
  
  const handleSubmit = async () => {
    if (files.length < 2) {
      setError(t('videoMerger.validation.selectFiles'));
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const taskConfig = {
        merge_mode: 'concat',
        audio_handling: 'keep_all',
        quality_preset: 'medium',
        segments: videoSegments.map(segment => ({
          filename: segment.filename,
          start_time: segment.startTime,
          end_time: segment.endTime,
          duration: segment.segmentDuration
        }))
      };
      
      const response = await videoMergerService.submitTask(
        files,
        taskConfig,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      if (response.data && response.data.task_id) {
        setTaskResult(response.data);
        setSuccess(true);
        
        // 2秒后跳转到任务详情页
        setTimeout(() => {
          window.location.href = `/tasks/${response.data.task_id}`;
        }, 2000);
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || t('videoMerger.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Layout
      title={t('videoMerger.title')}
      description={t('videoMerger.description')}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t('videoMerger.title')}
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            {t('videoMerger.description')}
          </p>
          
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
              message={t('videoMerger.processing.taskSubmitted')} 
              onClose={() => setSuccess(false)} 
            />
          )}
          
          <div className="card">
            <div className="card-body">
              {!files.length ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <svg 
                      className="mx-auto h-16 w-16 text-gray-400 mb-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                      />
                    </svg>
                    
                    <p className="mb-2 text-sm text-gray-500">
                      {t('videoMerger.upload.dragDrop')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('videoMerger.upload.supportedFormats')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('videoMerger.upload.maxVideos')}
                    </p>
                  </label>
                </div>
              ) : (
                <div>
                  {!showSegmentEditor ? (
                    <div>
                      <h3 className="text-lg font-medium mb-4">{t('tasks.types.video_merge')} - {files.length} {t('common.files')}</h3>
                      
                      <div className="space-y-2 mb-6">
                        {files.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between bg-gray-50 p-3 rounded"
                          >
                            <div className="flex items-center">
                              <span className="mr-2 text-gray-500">{index + 1}.</span>
                              <span className="truncate max-w-xs">{file.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setFiles([]);
                            setVideoSegments([]);
                            setShowSegmentEditor(false);
                          }}
                          disabled={isUploading}
                        >
                          {t('common.reselect')}
                        </Button>
                        <Button 
                          onClick={() => setShowSegmentEditor(true)}
                          className="flex-1"
                        >
                          编辑时间段
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex flex-wrap justify-between items-center">
                          <div>
                            <p className="font-medium">
                              总视频数: {videoSegments.length}
                            </p>
                            <p className="font-medium">
                              总时长: {formatDuration(calculateTotalDuration())}
                            </p>
                            <p className="text-sm text-gray-600">
                              视频将按以下顺序合并
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowSegmentEditor(false)}
                              disabled={isUploading}
                            >
                              返回
                            </Button>
                            <Button
                              onClick={handleSubmit}
                              loading={isUploading}
                              disabled={isUploading || videoSegments.length === 0}
                              size="lg"
                            >
                              {t('videoMerger.editSegments.startMerging')}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {isUploading && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{t('common.uploading')}</span>
                            <span className="text-sm text-gray-500">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {videoSegments.map((segment, index) => (
                          <div key={segment.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center mb-3">
                              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium mr-3">
                                {index + 1}
                              </span>
                              <div className="flex-grow">
                                <h3 className="font-medium">{segment.filename}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div>
                                    <p>文件大小: {formatFileSize(segment.size)}</p>
                                    <p>原始时长: {formatDuration(segment.duration || 0)}</p>
                                  </div>
                                  <div>
                                    <p>选中时长: {formatDuration(segment.segmentDuration || (segment.endTime || segment.duration || 0) - (segment.startTime || 0))}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 items-end">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    开始时间 (秒)
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={(segment.startTime || 0).toFixed(1)}
                                    min="0"
                                    max={(segment.duration || 0) - 0.1}
                                    step="0.1"
                                    onChange={(e) => {
                                      const startTime = parseFloat(e.target.value) || 0;
                                      handleTimeUpdate(segment.id, startTime, segment.endTime || segment.duration || 0);
                                    }}
                                    disabled={isUploading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    结束时间 (秒)
                                  </label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={(segment.endTime || segment.duration || 0).toFixed(1)}
                                    min="0.1"
                                    max={segment.duration || 0}
                                    step="0.1"
                                    onChange={(e) => {
                                      const endTime = parseFloat(e.target.value) || (segment.duration || 0);
                                      handleTimeUpdate(segment.id, segment.startTime || 0, endTime);
                                    }}
                                    disabled={isUploading}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-grow"
                                  onClick={() => handleTimeReset(segment.id)}
                                  disabled={isUploading}
                                >
                                  重置
                                </Button>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              选中段: {(segment.startTime || 0).toFixed(1)}s - {(segment.endTime || segment.duration || 0).toFixed(1)}s
                              ({((segment.endTime || segment.duration || 0) - (segment.startTime || 0)).toFixed(1)}s 时长)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>{t('videoMerger.info.mergeOrder')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// 使用 withAuth HOC 包装组件
export default withAuth(VideoMerger);

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}