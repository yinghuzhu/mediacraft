import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout/Layout';
import withAuth from '../components/Auth/withAuth';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import { videoMergerService } from '../services/api';

function VideoMergerSimplified() {
  const { t } = useTranslation('common');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [taskResult, setTaskResult] = useState(null);
  
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
      setError('视频合并至少需要2个视频文件');
      return;
    }
    
    if (selectedFiles.length > maxFiles) {
      setError(`最多只能选择${maxFiles}个视频文件`);
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
  
  const handleSubmit = async () => {
    if (files.length < 2) {
      setError('请选择至少2个视频文件');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const taskConfig = {
        merge_mode: 'concat',
        audio_handling: 'keep_all',
        quality_preset: 'medium'
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
            选择多个视频文件，系统将自动将它们合并成一个视频
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
              message="视频合并任务已提交成功！正在跳转到任务页面..." 
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
                      拖放多个视频文件到这里，或点击选择文件
                    </p>
                    <p className="text-xs text-gray-500">
                      支持MP4、MOV、AVI和MKV格式（单个文件最大500MB）
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      需要至少2个视频文件，最多{maxFiles}个
                    </p>
                  </label>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium mb-4">已选择 {files.length} 个视频文件</h3>
                  
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
                  
                  {isUploading && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">上传进度</span>
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
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setFiles([])}
                      disabled={isUploading}
                    >
                      重新选择
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      loading={isUploading}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      开始合并视频
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>视频将按照选择顺序进行合并，合并后会保留所有音频</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// 使用 withAuth HOC 包装组件
export default withAuth(VideoMergerSimplified);

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}